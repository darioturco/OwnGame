var fun  = require('./funciones_auxiliares');
var base = require('./data_base');

// Battle stats indexed by ship/defense type number
const integridadDefensas = [200, 200, 800, 3500, 800, 10000, 2000, 10000];
const shieldDefensas     = [20, 25, 100, 200, 500, 300, 2000, 10000];
const attackDefensas     = [80, 100, 250, 1100, 150, 3000, 1, 1];
const integridadNaves    = [400, 1000, 2700, 6000, 7000, 7500, 11000, 900000, 400, 1200, 3000, 1600, 100, 200];
const shieldNaves        = [10, 25, 50, 200, 400, 500, 500, 50000, 10, 25, 100, 10, 1, 1];
const attackNaves        = [50, 150, 400, 1000, 700, 1000, 2000, 200000, 5, 5, 50, 1, 1, 1];
const keysDefensas       = fun.keysDefensas;
const keysNaves          = fun.keysNaves;

function calculaAtributosNaves(lista, tech) {
  for (let i = 0; i < lista.length; i++) {
    lista[i] += lista[i] * tech / 10;
  }
  return lista;
}

function reflectedShot(dano, escudo) {
  return dano < escudo * 0.01;
}

function addShips(list, ships, maxShields, armour) {
  for (let item in ships) {
    let tipoNum = fun.shipStringToNum(item);
    if (tipoNum != undefined) {
      for (let i = 0; i < ships[item]; i++) {
        list.push([tipoNum, armour[tipoNum], maxShields[tipoNum]]);
      }
    }
  }
}

function startAttack(shoter, receptor, listAttack, listOriginalArmour) {
  let objetivo, dano;
  for (let i = 0; i < shoter.length; i++) {
    /* Falta el fuego rapido */
    objetivo = Math.floor(Math.random() * receptor.length);
    dano = listAttack[shoter[i][0]];

    if (receptor[objetivo][1] > 0 && !reflectedShot(dano, receptor[objetivo][2])) {
      if (dano > receptor[objetivo][2]) {
        dano -= receptor[objetivo][2];
        receptor[objetivo][2] = 0;
        receptor[objetivo][1] -= dano;
        if (listOriginalArmour[receptor[objetivo][0]] * 0.7 > receptor[objetivo][1] && Math.random() > receptor[objetivo][1] / listOriginalArmour[receptor[objetivo][0]]) {
          receptor[objetivo][1] = 0;
        }
      } else {
        receptor[objetivo][2] -= dano;
      }
    }
  }
}

function updateFleet(ships, shields) {
  for (let i = 0; i < ships.length; i++) {
    if (ships[i][1] <= 0) {
      ships.splice(i, 1);
      i--;
    } else {
      ships[i][2] = shields[ships[i][0]];
    }
  }
}

function battle(attackerShips, defenderShips, defenses, attackerTech, defenderTech, fr) {
  /* Version naive del algoritmo de batallas */

  let maxShieldsAttacker = Array.from(shieldNaves);
  let maxShieldsDefender = Array.from(shieldNaves).concat(Array.from(shieldDefensas));
  calculaAtributosNaves(maxShieldsAttacker, attackerTech.shielding);
  calculaAtributosNaves(maxShieldsDefender, defenderTech.shielding);

  let attackAttacker = Array.from(attackNaves);
  let attackDefender = Array.from(attackNaves).concat(Array.from(attackDefensas));
  calculaAtributosNaves(attackAttacker, attackerTech.weapons);
  calculaAtributosNaves(attackDefender, defenderTech.weapons);

  let armourAttacker = Array.from(integridadNaves);
  let armourDefender = Array.from(integridadNaves).concat(Array.from(integridadDefensas));
  calculaAtributosNaves(armourAttacker, attackerTech.armour);
  calculaAtributosNaves(armourDefender, defenderTech.armour);

  let fleetAtk = [];
  let fleetDef = [];
  addShips(fleetAtk, attackerShips, maxShieldsAttacker, armourAttacker);
  addShips(fleetDef, defenderShips, maxShieldsDefender, armourDefender);
  addShips(fleetDef, defenses,      maxShieldsDefender, armourDefender);

  let termino = fleetAtk.length === 0 || fleetDef.length === 0;

  let ronda = 0;
  for (ronda = 0; ronda < 6 && !termino; ronda++) {
    startAttack(fleetAtk, fleetDef, attackAttacker, armourDefender);
    startAttack(fleetDef, fleetAtk, attackDefender, armourAttacker);
    updateFleet(fleetAtk, maxShieldsAttacker);
    updateFleet(fleetDef, maxShieldsDefender);
    termino = fleetAtk.length === 0 || fleetDef.length === 0;
  }

  let res = {
    atkShips:    fun.zeroShips(),
    defShips:    fun.zeroShips(),
    defDefenses: fun.zeroDefense(),
    winner:      'Draw',
    rondas:      ronda
  };

  for (let i = 0; i < fleetAtk.length; i++) {
    res.atkShips[keysNaves[fleetAtk[i][0]]]++;
  }
  for (let i = 0; i < fleetDef.length; i++) {
    if (fleetDef[i][0] < 14) {
      res.defShips[keysNaves[fleetDef[i][0]]]++;
    } else {
      res.defDefenses[keysDefensas[fleetDef[i][0] - 14]]++;
    }
  }
  res.defDefenses.antiballisticMissile  = defenses.antiballisticMissile;
  res.defDefenses.interplanetaryMissile = defenses.interplanetaryMissile;

  if (fleetAtk.length === 0 && fleetDef.length !== 0) {
    res.winner = 'Defenser';
  } else if (fleetAtk.length !== 0 && fleetDef.length === 0) {
    res.winner = 'Attacker';
  }
  return res;
}

function misilAttackAux(ataque, cantDef, vidaDef) {
  let destruidos = Math.floor(ataque / vidaDef);
  if (destruidos > cantDef) destruidos = cantDef;
  ataque -= destruidos * vidaDef;
  return {ataqueRestante: ataque, destroyedDef: destruidos};
}

// Algoritmo basado en http://www.toolsforogame.com/misiles/misiles.aspx
function misilAttack(defenses, misils, armour, weapon) {
  let atacoDefensas = false;
  let newMisils = misils - defenses.antiballisticMissile;
  defenses.antiballisticMissile -= misils;

  if (defenses.antiballisticMissile < 0) {
    defenses.antiballisticMissile = 0;
    atacoDefensas = true;
    let ataque = newMisils * 12000 * (1 + (weapon / 10));
    let vidaDef = new Array(8);
    for (let i = 0; i < integridadDefensas.length && ataque > 0; i++) {
      vidaDef[i] = integridadDefensas[i] * (1 + (armour / 10));
      let objAux = misilAttackAux(ataque, defenses[keysDefensas[i]], vidaDef[i]);
      ataque = objAux.ataqueRestante;
      defenses[keysDefensas[i]] -= objAux.destroyedDef;
    }
  }
  return {survivorDefenses: defenses, attackedDef: atacoDefensas};
}

function calcularEscombros(objAttack, objOriginal, fleetD, defenseD) {
  let debris = {metal: 0, crystal: 0};
  let rawCosts = fun.costShipsAndDefenses();
  let shipsAux;
  if (fleetD > 0) {
    for (let item in objAttack.atkShips) {
      if (item !== 'solarSatellite') {
        shipsAux = (objOriginal.atkShips[item] - objAttack.atkShips[item]) + (objOriginal.defShips[item] - objAttack.defShips[item]);
        debris.metal   += shipsAux * rawCosts[item].metal   * fleetD / 100;
        debris.crystal += shipsAux * rawCosts[item].crystal * fleetD / 100;
      }
    }
  }
  shipsAux = objOriginal.defShips['solarSatellite'] - objAttack.defShips['solarSatellite'];
  debris.crystal += shipsAux * rawCosts['solarSatellite'].crystal * fleetD / 100;
  if (defenseD > 0) {
    for (let item in objAttack.defDefenses) {
      shipsAux = objOriginal.defDefenses[item] - objAttack.defDefenses[item];
      debris.metal   += shipsAux * rawCosts[item].metal   * defenseD / 100;
      debris.crystal += shipsAux * rawCosts[item].crystal * defenseD / 100;
    }
  }
  return debris;
}

function lunaChance(debris, maxChance) {
  let totalDebris = debris.metal + debris.crystal;
  let chance = Math.floor(totalDebris / 100000);
  return chance > maxChance ? maxChance : chance;
}

function tryDestroyMoon(player, movement, planet, objAttack, defenderName, uni) {
  if (movement.mission !== 8 || objAttack.atkShips.deathstar <= 0) return false;
  let moonSize = planet.moon.size;
  let destroyPercentage = (100 - Math.sqrt(moonSize)) * Math.sqrt(objAttack.atkShips.deathstar) + player.research.graviton;
  destroyPercentage = destroyPercentage / (planet.moon.buildings.moonShield + 1);
  objAttack.atkShips.deathstar -= Math.floor(Math.sqrt(moonSize) * Math.random() * 0.6);
  if (objAttack.atkShips.deathstar < 0) objAttack.atkShips.deathstar = 0;
  let coor = fun.coorToCorch(movement.coorHasta);
  if (destroyPercentage > Math.random() * 100) {
    uni.sendMessage(player.name,  {type: 4, title: 'Moon Destruction',       text: 'The moon on ' + coor + ' was destroyed.', data: {}});
    uni.sendMessage(movement.playerName, {type: 4, title: 'Moon Destruction', text: 'Your moon on ' + coor + ' was destroyed.', data: {}});
    return true;
  }
  uni.sendMessage(player.name,  {type: 4, title: 'Moon Destruction Fails', text: 'The moon on ' + coor + ' was attempted to be destroyed, but it failed.', data: {}});
  uni.sendMessage(movement.playerName, {type: 4, title: 'Moon Destruction Fails', text: 'Your moon on ' + coor + ' was attempted to be destroyed, but it failed.', data: {}});
  return false;
}

function processBattle(player, movement, uni) {
  if (!fun.estaColonizado(uni.allCord, movement.coorHasta)) {
    uni.returnFleet(movement);
    uni.sendMessage(player.name, {type: 4, title: 'There Is No Planet', text: 'There is no planet on ' + fun.coorToCorch(movement.coorHasta) + ' , the fleet has returned.', data: {}});
    return;
  }
  base.findAndExecute(movement.coorHasta, (res) => {
    let indexPlanet = fun.getIndexOfPlanet(res.planets, movement.coorHasta);
    if (indexPlanet === -1) return;

    let planet        = res.planets[indexPlanet];
    let attackingMoon = movement.destination === 2;

    if (attackingMoon && !planet.moon.active) {
      uni.returnFleet(movement);
      uni.sendMessage(player.name, {type: 4, title: 'There Is No Moon', text: 'There is no moon on ' + fun.coorToCorch(movement.coorHasta) + ' , the fleet has returned.', data: {}});
      return;
    }

    let defenses      = attackingMoon ? fun.zeroDefense() : planet.defense;
    let defenderFleet = attackingMoon ? planet.moon.fleet : planet.fleet;

    let objAttack = battle(movement.ships, defenderFleet, defenses, player.research, res.research, uni.universo.rapidFire);
    let newDebris = calcularEscombros(objAttack, {atkShips: movement.ships, defShips: defenderFleet, defDefenses: defenses}, uni.universo.fleetDebris, uni.universo.defenceDebris);

    let newMoonObj = undefined;
    let moonChance = 0;
    if (!planet.moon.active) {
      moonChance = lunaChance(newDebris, uni.universo.maxMoon);
      if (moonChance > Math.floor(Math.random() * 100)) {
        let moonSize = (uni.universo.maxMoon === moonChance) ? 9999 : Math.floor(fun.normalRandom(6999, 9999, 6999, 9999));
        newMoonObj = uni.createNewMoon(moonSize);
        uni.sendMessage(res.name, {type: 4, title: "New Moon", text: "Vamos nueva luna en... ", data: {}});
      }
    }

    if (planet.moon.active) {
      let restoredPorcentage = Math.min(35, Math.log(planet.moon.buildings.spaceDock * 0.4 + 1) * 10) / 100;
      for (let ship in objAttack.defShips) {
        objAttack.defShips[ship] += Math.floor(restoredPorcentage * (defenderFleet[ship] - objAttack.defShips[ship]));
      }
    }

    let stolenResources = fun.zeroResources();
    let recursosCargados;
    let destroyedMoon = false;

    switch (objAttack.winner) {
      case 'Attacker': {
        let recursos;
        if (attackingMoon) {
          recursos = {...planet.moon.resources};
          destroyedMoon = tryDestroyMoon(player, movement, planet, objAttack, res.name, uni);
        } else {
          recursos = {...planet.resources};
        }
        if (!fun.isZeroObj(objAttack.atkShips)) {
          recursosCargados = fun.loadResourcesAttack(objAttack.atkShips, recursos, movement.resources);
          stolenResources = recursosCargados.saqueado;
          uni.returnFleet(movement, recursosCargados.newCarga, objAttack.atkShips);
        }
        break;
      }
      case 'Defenser':
        break;
      default: {
        let movementAux = {ships: objAttack.atkShips, resources: fun.zeroResources()};
        recursosCargados = fun.loadResources(movementAux, movement.resources);
        uni.returnFleet(movement, recursosCargados, objAttack.atkShips);
      }
    }

    for (let item in stolenResources) {
      if (attackingMoon) {
        planet.moon.resources[item] -= stolenResources[item];
      } else {
        planet.resources[item] -= stolenResources[item];
      }
    }

    let battleData = {
      playerName:         res.name,
      planetName:         planet.name,
      coorAttacker:       movement.coorDesde,
      coorDefender:       movement.coorHasta,
      fleetAttackBefore:  movement.ships,
      fleetAttackAfter:   objAttack.atkShips,
      fleetDefenseBefore: defenderFleet,
      fleetDefenseAfter:  objAttack.defShips,
      defensesBefore:     defenses,
      defensesAfter:      objAttack.defDefenses,
      stolenResources,
      newDebris,
      lunaChance:  moonChance,
      winner:      objAttack.winner,
      rapidFire:   uni.universo.rapidFire,
      rounds:      objAttack.rondas,
    };
    uni.sendMessage(player.name, {type: 1, title: 'Battle in space', text: '', data: battleData});
    uni.sendMessage(res.name,    {type: 1, title: 'Battle in space', text: '', data: battleData});

    if (attackingMoon) {
      if (destroyedMoon) {
        base.setPlanetData(planet.coordinates, undefined, undefined, undefined, undefined, {active: false, size: 0});
      } else {
        base.setMoonData(planet.coordinates, planet.moon.resources, undefined, objAttack.defShips);
      }
    } else {
      base.setPlanetData(planet.coordinates, planet.resources, undefined, objAttack.defShips, objAttack.defDefenses, newMoonObj);
    }
    base.saveDebris(planet.coordinates, newDebris, true);
  });
}

module.exports = { processBattle, misilAttack, battle };
