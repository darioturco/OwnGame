var fs        = require('fs');
var path      = require('path');
var fun       = require('./funciones_auxiliares');
var base      = require('./data_base');
var costs     = require('./constructions/costs');
var battle    = require('./battle');
var rewards   = require('./rewards');
var expedicion = require('./expedicion');
var queue = require('./Queue')
var botLogic  = require('./bots/bot_logic');
var botTypes  = require('./bots/bot_types');
var events = new queue.Queue();
var actualizando = false;
var inFlightPlayers = new Set();

var exp  = {
  universo: null,             // Objeto con la informcaion basica del universo
  player: null,               // Objeto con toda la informacion del jugador que estoy viendo
  planeta: 0,                 // En que numero de planeta estoy parado
  moon: false,                // Si estoy parado en una luna
  cantPlayers: 0,             // Cantidad de jugadores en todo el universo
  allCord: {},                // Por cada planeta colonizado guardo un objeto 'infoPlanet' con la informacion basica exterior del planeta
  comienzoBusquedaNewCoor: 1, // Apartir de que galaxia se ubican los nuevos planetas
  events: events,             // Lista de tiempos en los que hay que actualizar a un jugador
  fun: fun,
  base: base,

  // Crea el un nuevo universo con 'cant' bots
  //  -name = Nombre del universo
  //  -cant = Cantidad de bots
  //  -data = Objeto con la informacion basica del nuevo universo
  createUniverse: function(name, cant, data){
    base.setUniverseData(name, data);
    for(let i = 0 ; i<cant ; i++){
      this.addNewPlayer('bot_' + i, 2, 'default');
    }
  },

  // Actualiza la informacion del jugador player
  //  -player = Objeto player a actualizar
  //  -f = Funcion que se ejecuta despues de ejecutar esta funcion
  updatePlayer: function(player, f, simulatedNow = null){
    let horaActual = simulatedNow || fun.horaActual();
    let objSet = {};
    let objInc = {};
    let objPull = {movement: {llegada: {$lt: horaActual}}, hazards: {time: {$lt: horaActual}}};
    let timeLastUpdate = horaActual - player.lastVisit;
    objSet['puntosAcum'] = player.puntosAcum;

    let updateResourcesAddOfAllPlanets = this._completeResearch(player, horaActual, objSet, objInc);

    for(let i = 0; i < player.planets.length; i++){
      let updateDataThisPlanet = this._completePlanetBuilding(player, i, horaActual, objSet, objInc);
      this._completeMoonBuilding(player, i, horaActual, objSet, objInc);
      let {listShip, solarSatelliteBuilt} = this._processShipQueue(player, i, timeLastUpdate, objSet, objInc);

      objSet['planets.' + i + '.shipConstrucction'] = listShip;
      if(updateDataThisPlanet || solarSatelliteBuilt || updateResourcesAddOfAllPlanets){
        this.updateResourcesData(() => {}, player, i);
        objSet['planets.' + i + '.resources.energy']       = player.planets[i].resources.energy;
        objSet['planets.' + i + '.resourcesAdd.metal']     = player.planets[i].resourcesAdd.metal;
        objSet['planets.' + i + '.resourcesAdd.crystal']   = player.planets[i].resourcesAdd.crystal;
        objSet['planets.' + i + '.resourcesAdd.deuterium'] = player.planets[i].resourcesAdd.deuterium;
      }

      let almacen = this.getAlmacen(player.planets[i]);
      objInc['planets.' + i + '.resources.metal']     = Math.floor(Math.max(0, Math.min(player.planets[i].resourcesAdd.metal*timeLastUpdate/(1000*3600),     almacen.metal     - player.planets[i].resources.metal)));
      objInc['planets.' + i + '.resources.crystal']   = Math.floor(Math.max(0, Math.min(player.planets[i].resourcesAdd.crystal*timeLastUpdate/(1000*3600),   almacen.crystal   - player.planets[i].resources.crystal)));
      objInc['planets.' + i + '.resources.deuterium'] = Math.floor(Math.max(0, Math.min(player.planets[i].resourcesAdd.deuterium*timeLastUpdate/(1000*3600), almacen.deuterium - player.planets[i].resources.deuterium)));
    }

    for(let i = 0; i < player.movement.length; i++){
      if(player.movement[i].llegada < horaActual){
        if(player.movement[i].ida){
          this._processOutgoingMission(player, i, horaActual);
        }else{
          this._processReturningFleet(player, player.movement[i], objInc);
        }
      }
    }

    objInc['puntos'] = Math.floor(objSet['puntosAcum']/1000);
    objSet['puntosAcum'] = objSet['puntosAcum'] % 1000;
    objSet.lastVisit = horaActual;
    const self = this;
    base.savePlayerData(player.name, objSet, objInc, undefined, objPull, () => {
      if(f) f();
      if(player.botType && player.botType !== 'human') botLogic.runBot(player, self, events);
    });
  },

  _calcReturnTime: function(movement, horaActual){
    return Math.max(0, (movement.llegada - movement.time)/1000 - (horaActual - movement.llegada)/1000);
  },

  // Returns CSS class for a resource amount relative to storage capacity
  _getResourceClass: function(amount, max){
    if(amount >= max)         return 'overmark';
    if(amount >= max * 4/5)  return 'middlemark';
    return '';
  },

  // Calculates energy production/distribution across mines given numeric percentage values
  _calcEnergyDistribution: function(minas, pct, energyResearch, solarSatellites, temp){
    const maxEnergyAux = {
      metal:     Math.floor(pct.metal     * minas.metalMine     * Math.pow(1.1, minas.metalMine)),
      crystal:   Math.floor(pct.crystal   * minas.crystalMine   * Math.pow(1.1, minas.crystalMine)),
      deuterium: Math.floor(2 * pct.deuterium * minas.deuteriumMine * Math.pow(1.1, minas.deuteriumMine))
    };
    const auxEnergy = {
      solar:           Math.floor(20 * minas.solarPlant * Math.pow(1.1, minas.solarPlant)),
      fusion:          Math.floor(3 * minas.fusionReactor * pct.energy * Math.pow(1.05 + 0.01 * energyResearch, minas.fusionReactor)),
      fusionDeuterium: -Math.floor(minas.fusionReactor * pct.energy * Math.pow(1.1, minas.fusionReactor)),
      satillite:       Math.floor((temp + 160) / 6) * solarSatellites
    };
    const energyTotal      = auxEnergy.solar + auxEnergy.fusion + auxEnergy.satillite;
    const totalEnergyUsage = maxEnergyAux.metal + maxEnergyAux.crystal + maxEnergyAux.deuterium;
    let energyUsage = {
      metal:     Math.floor(totalEnergyUsage === 0 ? 0 : (maxEnergyAux.metal     * energyTotal) / totalEnergyUsage),
      crystal:   Math.floor(totalEnergyUsage === 0 ? 0 : (maxEnergyAux.crystal   * energyTotal) / totalEnergyUsage),
      deuterium: Math.floor(totalEnergyUsage === 0 ? 0 : (maxEnergyAux.deuterium * energyTotal) / totalEnergyUsage)
    };
    energyUsage = {
      metal:     Math.min(energyUsage.metal,     maxEnergyAux.metal),
      crystal:   Math.min(energyUsage.crystal,   maxEnergyAux.crystal),
      deuterium: Math.min(energyUsage.deuterium, maxEnergyAux.deuterium)
    };
    return {maxEnergyAux, auxEnergy, energyTotal, energyUsage};
  },

  // Creates a building construction record and persists it to DB
  _startBuildConstruction: function(player, planet, buildingName, metal, crystal, deuterium, objPrice, pathPrefix, res){
    const bc = {
      active: true, metal, crystal, deuterium,
      item: buildingName,
      init: fun.horaActual(),
      time: fun.timeBuild(metal + crystal, objPrice.time.mult, objPrice.time.elev, this.universo.speed)
    };
    const objSet = {['planets.' + planet + pathPrefix + '.buildingConstrucction']: bc};
    const objInc = {
      ['planets.' + planet + pathPrefix + '.resources.metal']:     -metal,
      ['planets.' + planet + pathPrefix + '.resources.crystal']:   -crystal,
      ['planets.' + planet + pathPrefix + '.resources.deuterium']: -deuterium
    };
    player.planets[planet].buildingConstrucction = bc;
    const _resObj = pathPrefix === '.moon' ? player.planets[planet].moon.resources : player.planets[planet].resources;
    _resObj.metal     -= metal;
    _resObj.crystal   -= crystal;
    _resObj.deuterium -= deuterium;
    events.addElement({time: bc.init + bc.time * 1000, player: player.name});
    const lvl = (player.planets[planet].buildings[buildingName] || 0) + 1;
    const logLine = `${new Date().toISOString()} [build] ${player.name} p${planet} ${buildingName} -> lv${lvl}\n`;
    fs.appendFile(path.join(__dirname, '../logs/buildings.log'), logLine, () => {});
    base.savePlayerData(player.name, objSet, objInc, undefined, undefined, () => {
      res.send({ok: true, mes: "Operation successful."});
    });
  },

  _completeResearch: function(player, horaActual, objSet, objInc){
    let r = player.researchConstrucction;
    if(!r.active || r.time*1000 + r.init > horaActual) return false;
    objSet['researchConstrucction'] = {active: false};
    r.active = false;
    objSet['puntosAcum'] += r.metal + r.crystal + r.deuterium;
    objInc['research.' + r.item] = 1;
    player.research[r.item] += 1;
    if(r.item === 'espionage'){
      for(let i = 0; i < player.planets.length; i++){
        this.allCord[player.planets[i].coordinates.gal+'_'+player.planets[i].coordinates.sys+'_'+player.planets[i].coordinates.pos].espionage += 1;
      }
    }
    return r.item === 'energy' || r.item === 'plasma';
  },

  _completePlanetBuilding: function(player, i, horaActual, objSet, objInc){
    let bc = player.planets[i].buildingConstrucction;
    if(!bc.active || 1000*bc.time + bc.init > horaActual) return false;
    objSet['planets.' + i + '.buildingConstrucction'] = {active: false};
    bc.active = false;
    objSet['puntosAcum'] += bc.metal + bc.crystal + bc.deuterium;
    objInc['planets.' + i + '.campos'] = 1;
    objInc['planets.' + i + '.buildings.' + bc.item] = 1;
    player.planets[i].buildings[bc.item] += 1;
    if(bc.item === 'terraformer') objInc['planets.' + i + '.camposMax'] = 5;
    return true;
  },

  _completeMoonBuilding: function(player, i, horaActual, objSet, objInc){
    let moon = player.planets[i].moon;
    let bc = moon.buildingConstrucction;
    if(!moon.active || !bc.active || 1000*bc.time + bc.init > horaActual) return;
    objSet['planets.' + i + '.moon.buildingConstrucction'] = {active: false};
    bc.active = false;
    objSet['puntosAcum'] += bc.metal + bc.crystal + bc.deuterium;
    objInc['planets.' + i + '.moon.campos'] = 1;
    objInc['planets.' + i + '.moon.buildings.' + bc.item] = 1;
    moon.buildings[bc.item] += 1;
    if(bc.item === 'lunarBase') objInc['planets.' + i + '.moon.camposMax'] = 3;
  },

  _processShipQueue: function(player, i, timeLastUpdate, objSet, objInc){
    let queue = player.planets[i].shipConstrucction;
    let prefix = 'planets.' + i;
    if(queue.length === 0) return {listShip: [], solarSatelliteBuilt: false};

    if(queue[0].new === true){
      queue[0].new = false;
      return {listShip: queue, solarSatelliteBuilt: false};
    }

    let timeLeft = timeLastUpdate/1000 - queue[0].timeNow;
    if(timeLeft < 0){
      queue[0].timeNow -= timeLastUpdate/1000;
      return {listShip: queue, solarSatelliteBuilt: false};
    }

    let lugar = queue[0].def ? '.defense.' : '.fleet.';
    objInc[prefix + lugar + queue[0].item] = 1;
    objSet['puntosAcum'] += queue[0].metalOne + queue[0].crystalOne + queue[0].deuteriumOne;
    queue[0].cant      -= 1;
    queue[0].metal     -= queue[0].metalOne;
    queue[0].crystal   -= queue[0].crystalOne;
    queue[0].deuterium -= queue[0].deuteriumOne;

    let listShip = [];
    let solarSatelliteBuilt = queue[0].item === 'solarSatellite';

    for(let j = 0; j < queue.length; j++){
      queue[j].new = false;
      if(timeLeft > 0){
        lugar = queue[j].def ? '.defense.' : '.fleet.';
        let cantAux = timeLeft / queue[j].time;
        let built = Math.min(Math.floor(cantAux), queue[j].cant);
        let totalTimeJ = queue[j].time * queue[j].cant;
        let key = prefix + lugar + queue[j].item;
        if(objInc[key] === undefined) objInc[key] = 0;
        objInc[key] += built;
        objSet['puntosAcum'] += built * (queue[j].metalOne + queue[j].crystalOne + queue[j].deuteriumOne);
        queue[j].timeNow = (cantAux > 0)
          ? (queue[j].time - (timeLeft - Math.floor(cantAux)*queue[j].time))
          : (queue[j].timeNow - (timeLeft - Math.floor(cantAux)*queue[j].time));
        queue[j].cant      -= built;
        queue[j].metal     -= built * queue[j].metalOne;
        queue[j].crystal   -= built * queue[j].crystalOne;
        queue[j].deuterium -= built * queue[j].deuteriumOne;
        timeLeft -= totalTimeJ;
      }
      if(queue[j].cant > 0) listShip.push(queue[j]);
    }

    return {listShip, solarSatelliteBuilt};
  },

  _processReturningFleet: function(player, movement, objInc){
    let planetIndex = fun.getIndexOfPlanet(player.planets, movement.coorDesde);
    if(planetIndex === -1) return;
    let lunaString = (movement.moon && player.planets[planetIndex].moon.active) ? '.moon.' : '.';
    let plaString = 'planets.' + planetIndex + lunaString;
    for(let item in movement.resources){
      if(item !== 'misil') objInc[plaString + 'resources.' + item] = (objInc[plaString + 'resources.' + item] || 0) + movement.resources[item];
    }
    for(let item in movement.ships){
      objInc[plaString + 'fleet.' + item] = (objInc[plaString + 'fleet.' + item] || 0) + movement.ships[item];
    }
  },

  _processOutgoingMission: function(player, i, horaActual){
    let movement = player.movement[i];
    let newTime = 0;
    switch(movement.mission){
      case 1: { // Colonization
        movement.ships.colony -= 1;
        let resColonia = this.colonize(movement.coorHasta, player, movement.resources, movement.ships);
        let text = resColonia ? "Congratulations, you have a new colony!!!" : "Something went wrong. The comunication with the fleet has been lost...";
        this.sendMessage(player.name, {type: 3, title: "Colonization", text, data: {}});
        if(!resColonia){
          let newTime = this._calcReturnTime(movement, horaActual);
          this.returnFleetInDataBase(player, i, undefined, newTime, movement.resources, movement.ships);
        }
        break;
      }
      case 2: { // Recycling
        newTime = this._calcReturnTime(movement, horaActual);
        this.returnFleetInDataBase(player, i, undefined, newTime, movement.resources, undefined);
        if(fun.estaColonizado(this.allCord, movement.coorHasta)){
          const newMovTime    = player.movement[i].time;
          const newMovLlegada = player.movement[i].llegada;
          base.findAndExecute(movement.coorHasta, (res) => {
            let indexPlanet = fun.getIndexOfPlanet(res.planets, movement.coorHasta);
            let newDebris = this.recicleDebris(player.name, res.planets[indexPlanet].debris, movement, newMovTime, newMovLlegada);
            if(newDebris != undefined) base.saveDebris(movement.coorHasta, newDebris, false);
          });
        }
        break;
      }
      case 3: { // Transport
        newTime = this._calcReturnTime(movement, horaActual);
        if(fun.estaColonizado(this.allCord, movement.coorHasta)){
          base.addPlanetData(movement.coorHasta, movement.resources, {}, movement.destination === 2);
          this.returnFleetInDataBase(player, i, undefined, newTime, fun.zeroResources(), undefined);
        } else {
          this.returnFleetInDataBase(player, i, undefined, newTime, movement.resources, undefined);
        }
        break;
      }
      case 4: { // Deployment
        newTime = this._calcReturnTime(movement, horaActual);
        if(fun.estaColonizado(this.allCord, movement.coorHasta)){
          base.addPlanetData(movement.coorHasta, movement.resources, movement.ships, movement.destination === 2);
        }else{
          this.sendMessage(player.name, {type: 3, title: "Failed deployment", text: "The planet no longer exists. The fleet is returning.", data: {}});
          this.returnFleetInDataBase(player, i, undefined, newTime, movement.resources, movement.ships);
        }
        break;
      }
      case 5: { // Espionage
        if(fun.estaColonizado(this.allCord, movement.coorHasta)){
          let nameEspia = fun.playerName(this.allCord, movement.coorDesde);
          let difEspionageLevel = this.allCord[movement.coorHasta.gal+'_'+movement.coorHasta.sys+'_'+movement.coorHasta.pos].espionage
                                - this.allCord[movement.coorDesde.gal+'_'+movement.coorDesde.sys+'_'+movement.coorDesde.pos].espionage;
          let probabilityDetected = Math.floor(Math.pow(2, difEspionageLevel - 2) * movement.ships.espionageProbe);
          if(probabilityDetected < Math.floor(Math.random()*100)){
            let indiceDeEspionage = Math.sign(difEspionageLevel) * Math.pow(difEspionageLevel, 2) + movement.ships.espionageProbe;
            this.sendSpyReport(nameEspia, movement.coorHasta, indiceDeEspionage, movement.destination === 2);
          }else{
            let newDebris = {metal: 0, crystal: Math.floor(10000 * movement.ships.espionageProbe / this.universo.fleetDebris)};
            base.saveDebris(movement.coorHasta, newDebris, true);
            let nameEspiado = fun.playerName(this.allCord, movement.coorHasta);
            if(nameEspia !== nameEspiado){
              this.sendMessage(nameEspiado, {type: 4, title: "Spy captured", text: movement.ships.espionageProbe + " Espionages probes has been destroyed in ", data: {}});
            }
            this.sendMessage(nameEspia, {type: 4, title: "Spy failed", text: "Your espionages probes has been destroyed in ", data: {}});
            movement.ships.espionageProbe = 0;
            if(fun.isZeroObj(movement.ships)) break;
          }
        }
        newTime = this._calcReturnTime(movement, horaActual);
        this.returnFleetInDataBase(player, i, undefined, newTime, undefined, movement.ships);
        break;
      }
      case 6: { // Missile
        if(fun.estaColonizado(this.allCord, movement.coorHasta) && movement.destination === 1){
          base.findAndExecute(movement.coorHasta, (res) => {
            let indexPlanet = fun.getIndexOfPlanet(res.planets, movement.coorHasta);
            let objMisAttack = battle.misilAttack(res.planets[indexPlanet].defense, movement.ships.misil, res.research.armour, player.research.weapons);
            base.setPlanetData(movement.coorHasta, undefined, undefined, undefined, objMisAttack.survivorDefenses, undefined);
            let text;
            if(objMisAttack.attackedDef){
              let aux = objMisAttack.survivorDefenses.interplanetaryMissile;
              objMisAttack.survivorDefenses.interplanetaryMissile = 0;
              if(fun.isZeroObj(objMisAttack.survivorDefenses)){
                text = "The player " + player.name + "(" + fun.coorToCorch(movement.coorDesde) + ") had attacked you with missils, every defense is destroyed.";
              }else{
                text = "The player " + player.name + "(" + fun.coorToCorch(movement.coorDesde) + ") had attacked you with missils, some defenses survived.";
                objMisAttack.survivorDefenses.interplanetaryMissile = aux;
              }
            }else{
              text = "The player " + player.name + "(" + fun.coorToCorch(movement.coorDesde) + ") had attacked you with missils, but the Anti-Balistic missils worked fine.";
            }
            this.sendMessage(res.name, {type: 4, title: "Misil attack", text, data: {}});
          });
        }
        break;
      }
      case 7: // Attack
      case 8: // Moon Destruction
        this._processBattle(player, movement);
        break;

      default: { // Expedition (0)
        let expObj = expedicion.expedition(movement.ships, player.research);
        if(!expObj.mueren){
          let newResources = (expObj.evento === 5) ? fun.loadResources(movement, expObj.resources) : movement.resources;
          newTime = (movement.llegada - movement.time)/1000 + expObj.time - (horaActual - movement.llegada)/1000;
          if(newTime < 0) newTime = 0;
          this.returnFleetInDataBase(player, i, undefined, newTime, newResources, movement.ships);
          for(let j = 0; j < expObj.mensajes.length; j++){
            this.sendMessage(player.name, expObj.mensajes[j]);
          }
        }
      }
    }
  },

  _processBattle: function(player, movement){
    battle.processBattle(player, movement, this);
  },

  createNewPlanet: function(cord, planetName, playerName, playerTypeNew, initResources, initShips) {
    let typePlanet = fun.generateNewTypeOfPlanet(cord.pos, cord.sys % 2);
    return {idPlanet: Math.pow(500,2)*cord.gal + 500*cord.sys + cord.pos,
      coordinates: {gal: cord.gal, sys: cord.sys, pos: cord.pos},
      coordinatesCod: cord.gal + '_' + cord.sys, // Cordenadas del planeta hecho string
      player: playerName,
      playerType: playerTypeNew,
      name: planetName, // Maximo 23 caracteres
      type: typePlanet.type,
      color: typePlanet.color,
      temperature: typePlanet.temperature,
      temperatureNormal: typePlanet.temperature,
      // Este numero esta dado pseudoaleatoriamente por la posicion del sistema solar en la que esta el planeta
      camposMax: typePlanet.campos,
      // Un planeta inicialmente no tiene campos ocupados
      campos: 0,
      buildingConstrucction: false,
      shipConstrucction: [],
      // Todo planeta empieza con 500 de metal y cristal mas lo que se traiga al colonizarlo
      resources: {metal: 500+initResources.metal, crystal: 500+initResources.crystal, deuterium: initResources.deuterium, energy: 0},
      // La produccion inicial de un planet nuevo es la base, de 30 de metal y 15 de cristal en un universo de velocidad 1
      resourcesAdd: {metal: 30*this.universo.speed, crystal: 15*this.universo.speed, deuterium: 0, energy: 0},
      resourcesPercentage: {metal: '10', crystal: '10', deuterium: '10', energy: '10'},
      // Al crear un planeta empieza con todos los edificios en nivel 0
      buildings: fun.zeroBuilding(),
      // Al crear un planeta empieza con todas las flotas y defensas en nivel 0
      fleet: initShips,
      defense: fun.zeroDefense(),
      moon: {active: false, size: 0},
      debris: {active:false, metal:0, crystal: 0}
    };
  },

  createNewMoon: function(newSize){
    return {active: true,
      size: newSize,
      name: 'Luna',
      camposMax: 1,
      campos: 0,
      type: Math.floor(Math.random()*5)+1,
      resources: {metal: 0, crystal: 0, deuterium: 0, energy: 0},
      buildingConstrucction: false,
      buildings: fun.zeroBuildingsMoon(),
      // Porcentaje de funcionamiento de esos edificios, al principio no importa mucho porque estan a nivel 0
      values: {sunshade: 10, beam: 10},
      cuantic: 0,
      fleet: fun.zeroShips()
    }
  },

  // rand=false forces sequential search instead of random placement
  newCord: function(rand = true) {
    // Busca un cordenada libre y la devuelve
    // Un sistema solar puede tener como maximo 2 planetas
    let gal, sys, pos;
    for(gal = this.comienzoBusquedaNewCoor ; gal<=9; gal++){
      for(sys = 1 ; sys<=499; sys++){
        let sysCount = 0;
        for(pos = 5 ; pos<=10; pos++){
          if(fun.estaColonizado(this.allCord, {gal, sys, pos})) sysCount++;
        }
        if(sysCount >= 2) continue;
        for(pos = 5 ; pos<=10; pos++){
          const cand = {gal, sys, pos};
          if(!fun.estaColonizado(this.allCord, cand) && (!rand || Math.random() > 0.9)){
            return cand;
          }
        }
      }
    }

    if(rand){
      return this.newCord(false); // Si no encontro ninguna coordenada aletoriamente busca la primera que este libre
    }else{
      console.log("There is no coordinate available.");
      return undefined;
    }
  },

  getActualBasicInfo: function(planet) {
    let resourcesObj = (this.moon) ? this.player.planets[planet].moon.resources : this.player.planets[planet].resources;
    let classObj = {};
    let firstMovement = this.getFirstMovementInfo();
    let objStorage = this.getAlmacen(this.player.planets[planet], this.moon);
    classObj.metal     = this._getResourceClass(resourcesObj.metal,     objStorage.metal);
    classObj.crystal   = this._getResourceClass(resourcesObj.crystal,   objStorage.crystal);
    classObj.deuterium = this._getResourceClass(resourcesObj.deuterium, objStorage.deuterium);
    return {name: this.universo.name,
      speed: this.universo.speed,
      speedFleet: this.universo.speedFleet,
      donutGalaxy: this.universo.donutGalaxy.toString(),
      donutSystem: this.universo.donutSystem.toString(),
      /*siendoAtacado: false,  Cambiar */
      playerName: this.player.name,
      highscore: this.player.highscore,
      resources: resourcesObj,
      add: this.player.planets[planet].resourcesAdd,
      dark: this.player.dark,
      messagesNoRead: this.player.messagesCant,
      classObjResources: classObj,
      researchConstrucction: this.player.researchConstrucction,
      cantPlanets: this.player.planets.length,
      maxPlanets: this.player.maxPlanets,
      numPlanet: planet,
      planets: this.player.planets,
      moon: this.moon,
      storage: objStorage,
      sendEspionage: this.player.sendEspionage,
      sendSmall: this.player.sendSmall,
      sendLarge: this.player.sendLarge,
      format: fun.formatNumber,
      segundosATiempo: fun.segundosATiempo,
      missionNumToString: fun.missionNumToString,
      cantMovments: this.player.movement.length,
      nextFleetTime: firstMovement.time,
      nextFleetMission: firstMovement.mission,
      hazards: this.player.hazards
    };
  },

  getFirstMovementInfo: function(){
    let res = {time: 0, mission: ""};
    if(this.player.movement.length > 0){
      let min = 0;  // Busco el indice del proximo movement a terminar
      for(let i = 1 ; i<this.player.movement.length ; i++){
        if(this.player.movement[i].llegada < this.player.movement[min].llegada){
          min = i;
        }
      }
      res.time = this.player.movement[min].llegada;
      res.mission = fun.missionNumToString(this.player.movement[min].mission) + (this.player.movement[min].ida ? "" : " (R)");
    }
    return res;
  },

  getAlmacen: function(planetObj, moon = false){
    let res = {};
    if(moon){ // Si esta en la luna todos los almecenes estan en 0, ya que no importan
      res = fun.zeroResources();
    }else{    // La funcion para calcular cada almacenamiento es: 5000 * 2.5 * e^(0.61 * almacen)
      res = {metal:    5000 * Math.floor(2.5 * Math.pow(Math.E, 0.61 * planetObj.buildings.metalStorage)),
            crystal:   5000 * Math.floor(2.5 * Math.pow(Math.E, 0.61 * planetObj.buildings.crystalStorage)),
            deuterium: 5000 * Math.floor(2.5 * Math.pow(Math.E, 0.61 * planetObj.buildings.deuteriumStorage))};
    }
    return res;
  },

  resourcesSetting: function(planet) {
    let spd   = this.universo.speed;
    let minas = this.player.planets[planet].buildings;
    let temp  = (this.player.planets[planet].temperature.max + this.player.planets[planet].temperature.min) / 2;
    const pct = {
      metal:     parseInt(this.player.planets[planet].resourcesPercentage.metal),
      crystal:   parseInt(this.player.planets[planet].resourcesPercentage.crystal),
      deuterium: parseInt(this.player.planets[planet].resourcesPercentage.deuterium),
      energy:    parseInt(this.player.planets[planet].resourcesPercentage.energy)
    };
    const {maxEnergyAux, auxEnergy, energyTotal, energyUsage} = this._calcEnergyDistribution(
      minas, pct, this.player.research.energy, this.player.planets[planet].fleet.solarSatellite, temp
    );
    const eff = {
      metal:     isNaN(energyUsage.metal     / maxEnergyAux.metal)     ? 0 : energyUsage.metal     / maxEnergyAux.metal,
      crystal:   isNaN(energyUsage.crystal   / maxEnergyAux.crystal)   ? 0 : energyUsage.crystal   / maxEnergyAux.crystal,
      deuterium: isNaN(energyUsage.deuterium / maxEnergyAux.deuterium) ? 0 : energyUsage.deuterium / maxEnergyAux.deuterium
    };
    return {
      basic:         {metal: 30 * spd, crystal: 15 * spd},
      values:        this.player.planets[planet].resourcesPercentage,
      buildings:     minas,
      solarSatelite: this.player.planets[planet].fleet.solarSatellite,
      mines: {
        metal:     Math.floor(3 * eff.metal     * spd * pct.metal     * minas.metalMine     * Math.pow(1.1, minas.metalMine)),
        crystal:   Math.floor(2 * eff.crystal   * spd * pct.crystal   * minas.crystalMine   * Math.pow(1.1, minas.crystalMine)),
        deuterium: Math.floor(    eff.deuterium * spd * pct.deuterium * minas.deuteriumMine * Math.pow(1.1, minas.deuteriumMine) * (1.36 - 0.004 * temp))
      },
      energy:        auxEnergy,
      maxEnergy:     maxEnergyAux,
      usageEnergy:   energyUsage,
      resourcesHour: this.player.planets[planet].resourcesAdd,
      storage:       this.getAlmacen(this.player.planets[planet], false),
      plasma:        this.player.research.plasma
    };
  },

  moonSetting: function (planet) {
    let cuanticMoonsCordAux = [];
    for(let i = 0 ; i<this.player.planets.length ; i++){
      if(this.player.planets[i].moon.active && this.player.planets[i].moon.buildings.jumpGate > 0) cuanticMoonsCordAux.push({name: this.player.planets[i].moon.name, cord: this.player.planets[i].coordinates, num: i});
    }
    return {buildings: this.player.planets[planet].moon.buildings,
      values: {sunshade: this.player.planets[planet].moon.values.sunshade, beam: this.player.planets[planet].moon.values.beam},
      fleets: this.player.planets[planet].moon.fleet,
      cuanticTime: (this.player.planets[planet].moon.buildings.jumpGate === 0) ? 'Infinity' : this.player.planets[planet].moon.cuantic,
      cuanticMoonsCord: cuanticMoonsCordAux,
      campos: {campos: this.player.planets[planet].moon.campos, camposMax: this.player.planets[planet].moon.camposMax}
    };
  },

  overviewActualInfo: function (planet) {
    let camMax = (this.moon) ? this.player.planets[planet].moon.camposMax : this.player.planets[planet].camposMax;
    let cam = (this.moon) ? this.player.planets[planet].moon.campos : this.player.planets[planet].campos;
    return {diameter: (this.moon) ? this.player.planets[planet].moon.size + ' Km' : (camMax*66 + ' Km'),
      type: this.player.planets[planet].type,
      temperature: this.player.planets[planet].temperature,
      camposMax: camMax,
      campos: cam,
      cantPlayers: this.cantPlayers,
      points: fun.formatNumber(this.player.puntos)
    };
  },

  buildingsActualInfo: function (planet) {
    let res;
    if(this.moon){
      res = this.player.planets[planet].moon.buildings;
    }else{
      res = {buildings: this.player.planets[planet].buildings,
             solarSatellite: this.player.planets[planet].fleet.solarSatellite};
    }
    return res;
  },

  costBuildings: function (player, planet){
    return costs.costBuildings(player, planet);
  },

  costMoon: function (player, planet){
    return costs.costMoon(player, planet);
  },

  costResearch: function (player, lab){
    return costs.costResearch(player, lab);
  },

  costShipyard: function(player, planet, moon){
    return costs.costShipyard(player, planet, moon);
  },

  costDefense: function(player, planet){
    return costs.costDefense(player, planet);
  },

  fleetInfo: function(planet, moon){
    let cantFleetAux = fun.getCantFleets(this.player);
    return {fleets: (moon) ? this.player.planets[planet].moon.fleet : this.player.planets[planet].fleet,
            speed: costs.getListSpeed(this.player.research.combustion, this.player.research.impulse, this.player.research.hyperspace_drive),
            misil: (moon) ? 0 : this.player.planets[planet].defense.interplanetaryMissile,
            expeditions: cantFleetAux.expeditions,
            maxExpeditions: Math.floor(Math.sqrt(this.player.research.astrophysics)),
            slot: cantFleetAux.fleets,
            maxSlot: this.player.research.computer + 1,
            vacas: this.player.vacas,
            movement: this.player.movement
    };
  },

  galaxyInfo: function(planet){
    let cantFleetAux = fun.getCantFleets(this.player);
    return {espionage: this.player.planets[planet].fleet.espionageProbe,
            recycler: this.player.planets[planet].fleet.recycler,
            small: this.player.planets[planet].fleet.smallCargo,
            large: this.player.planets[planet].fleet.largeCargo,
            slot: cantFleetAux.fleets,
            maxSlot: this.player.research.computer + 1
    };
  },

  getQuickAtackDataOptions: function(){
    return {esp: this.player.sendEspionage,
            small: this.player.sendSmall,
            large: this.player.sendLarge};
  },

  proccesBuildRequest: function(player, planet, buildingName, res){
    if(!player.planets[planet].buildingConstrucction.active){
      let objPrice = this.costBuildings(player, planet);
      if(objPrice[buildingName] != undefined){
        let enough = fun.recursosSuficientes(player.planets[planet].resources, objPrice[buildingName]);
        let {metal, crystal, deuterium, energy, tech} = objPrice[buildingName];
        let enoughEnergy = buildingName !== 'terraformer' || energy <= player.planets[planet].resourcesAdd.energy;
        let enoughFields = buildingName === 'terraformer' || (player.planets[planet].campos + 1) < player.planets[planet].camposMax;
        if(enough && tech && enoughEnergy && enoughFields){
          this._startBuildConstruction(player, planet, buildingName, metal, crystal, deuterium, objPrice, '', res);
        }else{ // Manejo de los errores
          let mesAux = '';
          if(!enough){
            mesAux = "Recursos no suficientes.";
          }else if(!tech){
            mesAux = "Tecnologia no alcanzada.";
          }else if(!enoughEnergy){
            mesAux = "No hay energia suficiente para construir el terraformer.";
          }else{
            mesAux = "Campos insuficientes.";
          }
          res.send({ok: false, mes: mesAux});
        }
      }else{
        res.send({ok: false, mes: "Edificio invalido."});
      }
    }else{
      res.send({ok: false, mes: "Ya se esta construyendo un edificio en ese planeta."});
    }
  },

  proccesMoonRequest: function(player, planet, buildingName, res){
    if(!player.planets[planet].moon.buildingConstrucction.active){
      let objPrice = this.costMoon(player, planet);
      if(objPrice[buildingName] != undefined){
        let enough = fun.recursosSuficientes(player.planets[planet].moon.resources, objPrice[buildingName]);
        let {metal, crystal, deuterium, tech} = objPrice[buildingName];
        let enoughFields = buildingName === 'lunarBase'|| (player.planets[planet].moon.campos+1) < player.planets[planet].moon.camposMax;
        if(enough && tech && enoughFields){
          this._startBuildConstruction(player, planet, buildingName, metal, crystal, deuterium, objPrice, '.moon', res);
        }else{ // Manejo de errores
          let mesAux = '';
          if(!enough){
            mesAux = "Recursos insuficientes.";
          }else if(!tech){
            mesAux = "Tecnologia no alcanzada.";
          }else{
            mesAux = "Campos insuficientes.";
          }
          res.send({ok: false, mes: mesAux});
        }
      }else{
        res.send({ok: false, mes: "Edificio invalido."});
      }
    }else{
      res.send({ok: false, mes: "Ya se esta contruyendo un edificio en esa luna."});
    }
  },

  proccesResearchRequest: function(player, planet, researchName, res){
    if(!player.researchConstrucction.active){
      let objPrice = this.costResearch(player, player.planets[planet].buildings.researchLab);
      if(objPrice[researchName] != undefined){
        let enough = fun.recursosSuficientes(player.planets[planet].resources, objPrice[researchName]);
        let {metal, crystal, deuterium, energy, tech} = objPrice[researchName];
        if(enough && tech && energy <= player.planets[planet].resourcesAdd.energy){
          let researchConstrucctionAux = {};
          let researchConstrucction    = {};
          let objInc                   = {};
          researchConstrucctionAux.active    = true;
          researchConstrucctionAux.metal     = metal;
          researchConstrucctionAux.crystal   = crystal;
          researchConstrucctionAux.deuterium = deuterium;
          researchConstrucctionAux.item      = researchName;
          researchConstrucctionAux.planet    = planet;
          researchConstrucctionAux.init      = fun.horaActual();
          researchConstrucctionAux.time      = fun.timeBuild(metal + crystal, objPrice.time.mult, objPrice.time.elev, this.universo.speed);
          researchConstrucction['researchConstrucction'] = researchConstrucctionAux;
          player.researchConstrucction = researchConstrucctionAux;
          player.planets[planet].resources.metal     -= metal;
          player.planets[planet].resources.crystal   -= crystal;
          player.planets[planet].resources.deuterium -= deuterium;
          objInc['planets.' + planet + '.resources.metal']     = -metal;
          objInc['planets.' + planet + '.resources.crystal']   = -crystal;
          objInc['planets.' + planet + '.resources.deuterium'] = -deuterium;
          events.addElement({time: researchConstrucctionAux.init + researchConstrucctionAux.time*1000, player: player.name});
          base.savePlayerData(player.name, researchConstrucction, objInc, undefined, undefined, (x) => {
            res.send({ok: true});
          });
        }else{
          res.send({ok: false, mes: ((tech) ? "Recursos insuficientes." : "Tecnologia no alcanzada.")});
        }
      }else{
        res.send({ok: false, mes: "Investigacion invalida."});
      }
    }else{
      res.send({ok: false, mes: "Ya se esta investigando algo."});
    }
  },

  proccesShipyardRequest: function(player, planet, shipyardName, shipyardCant, res){
    shipyardCant = parseInt(shipyardCant);
    if(fun.validInt(shipyardCant) && fun.validShipyardName(shipyardName) && shipyardCant > 0){
      let objPrice = {...this.costShipyard(player, planet, false), ...this.costDefense(player, planet)};
      let enough = fun.recursosSuficientes(player.planets[planet].resources, objPrice[shipyardName], shipyardCant);
      let {metal, crystal, deuterium, name, tech} = objPrice[shipyardName];
      if(enough && tech){
        // Si voy a construir misiles en el silo, me fijo que haya capacidad para los misiles
        if((shipyardName === "antiballisticMissile" || shipyardName === "interplanetaryMissile") && (shipyardCant + fun.cantidadMisiles(player.planets[planet]) >= fun.capacidadSilo(player.planets[planet]))){
          return res.send({ok: false, mes: "No hay mas espacio en el silo."});
        }
        if(shipyardName === "smallShield" && (player.planets[planet].defense.smallShield >= 1 || shipyardCant >= 2 || fun.isBuildingSmallShield(player.planets[planet].shipConstrucction))){
          return res.send({ok: false, mes: "No se puede tener dos cupulas de proteccion chicas."});
        }
        if(shipyardName === "largeShield" && (player.planets[planet].defense.largeShield >= 1 || shipyardCant >= 2 || fun.isBuildingLargeShield(player.planets[planet].shipConstrucction))){
          return res.send({ok: false, mes: "No se puede tener dos cupulas de proteccion grandes."});
        }
        let shipyardConstrucctionAux = {};
        let shipyardConstrucction    = {};
        let objInc                   = {};
        let defensa                  = false;
        shipyardConstrucctionAux.cant         = shipyardCant;
        shipyardConstrucctionAux.metal        = metal*shipyardCant;
        shipyardConstrucctionAux.crystal      = crystal*shipyardCant;
        shipyardConstrucctionAux.deuterium    = deuterium*shipyardCant;
        shipyardConstrucctionAux.metalOne     = metal;
        shipyardConstrucctionAux.crystalOne   = crystal;
        shipyardConstrucctionAux.deuteriumOne = deuterium;
        shipyardConstrucctionAux.name         = name;
        shipyardConstrucctionAux.item         = shipyardName;
        shipyardConstrucctionAux.new          = true;
        shipyardConstrucctionAux.init         = fun.horaActual();
        shipyardConstrucctionAux.time         = fun.timeBuild(metal + crystal, objPrice.time.mult, objPrice.time.elev, this.universo.speed);
        shipyardConstrucctionAux.timeNow      = shipyardConstrucctionAux.time;
        for(let i = 0 ; i<objPrice.listInfo.length && !defensa ; i++){
          if(objPrice.listInfo[i] === shipyardName) defensa = true;
        }
        shipyardConstrucctionAux.def = defensa;
        shipyardConstrucction['planets.' + planet + '.shipConstrucction'] = shipyardConstrucctionAux;
        player.planets[planet].shipConstrucction.push(shipyardConstrucctionAux);
        player.planets[planet].resources.metal     -= metal * shipyardCant;
        player.planets[planet].resources.crystal   -= crystal * shipyardCant;
        player.planets[planet].resources.deuterium -= deuterium * shipyardCant;
        objInc['planets.' + planet + '.resources.metal']     = -metal*shipyardCant;
        objInc['planets.' + planet + '.resources.crystal']   = -crystal*shipyardCant;
        objInc['planets.' + planet + '.resources.deuterium'] = -deuterium*shipyardCant;
        let tiempoEnCola = fun.calculaTiempoFaltante(player.planets[planet].shipConstrucction);
        events.addElement({time: shipyardConstrucctionAux.init + tiempoEnCola, player: player.name});
        base.savePlayerData(player.name, undefined, objInc, shipyardConstrucction, undefined, () => {
          res.send({ok: true});
        });
      }else{
        res.send({ok: false, mes: ((tech) ? "Recursos insuficientes." : "Tecnologia no alcanzada.")});
      }
    }else{
      res.send({ok: false, mes: "Cantidad o nave no valida."});
    }
  },

  cancelBuildRequest: function(player, planet, res){
    if(player.planets[planet].buildingConstrucction.active){
      let objSet = {};
      let objInc = {};
      let {metal, crystal, deuterium, init, time} = player.planets[planet].buildingConstrucction;
      objSet['planets.' + planet + '.buildingConstrucction'] = {active: false};
      objInc['planets.' + planet + '.resources.metal']       = metal;
      objInc['planets.' + planet + '.resources.crystal']     = crystal;
      objInc['planets.' + planet + '.resources.deuterium']   = deuterium;
      events.remove({time: init + time*1000, player: player.name});
      base.savePlayerData(player.name, objSet, objInc, undefined, undefined, () => {
        res.send({ok: true, mes: "Construction canceled."});
      });
    }else{
      res.send({ok: false, mes: "No se esta construyendo ningun edificio en ese planeta."});
    }
  },

  cancelMoonRequest: function(player, planet, res){
    if(player.planets[planet].moon.active && player.planets[planet].moon.buildingConstrucction.active){
      let objSet = {};
      let objInc = {};
      let {metal, crystal, deuterium, init, time} = player.planets[planet].moon.buildingConstrucction;
      objSet['planets.' + planet + '.moon.buildingConstrucction'] = {active: false};
      objInc['planets.' + planet + '.moon.resources.metal']       = metal;
      objInc['planets.' + planet + '.moon.resources.crystal']     = crystal;
      objInc['planets.' + planet + '.moon.resources.deuterium']   = deuterium;
      events.remove({time: init + time*1000, player: player.name});
      base.savePlayerData(player.name, objSet, objInc, undefined, undefined, () => {
        res.send({ok: true});
      });
    }else{
      res.send({ok: false, mes: ((player.planets[planet].moon.active) ? "No se esta construyendo nada en la luna." : "No existe la luna...")});
    }
  },

  cancelResearchRequest: function(player, res){
    if(player.researchConstrucction.active){
      let objSet = {};
      let objInc = {};
      let {metal, crystal, deuterium, init, time, planet} = player.researchConstrucction;
      objSet['researchConstrucction'] = {active: false};
      objInc['planets.' + planet + '.resources.metal']     = metal;
      objInc['planets.' + planet + '.resources.crystal']   = crystal;
      objInc['planets.' + planet + '.resources.deuterium'] = deuterium;
      events.remove({time: init + time*1000, player: player.name});
      base.savePlayerData(player.name, objSet, objInc, undefined, undefined, () => {
        res.send({ok: true});
      });
    }else{
      res.send({ok: false, mes: "No se esta investigando nada."});
    }
  },

  cancelShipyardRequest: function(player, planet, shipyardName, res){
    let objPull = {};
    let objInc  = {};
    let canCancel = false;
    objInc['planets.' + planet + '.resources.metal']     = 0;
    objInc['planets.' + planet + '.resources.crystal']   = 0;
    objInc['planets.' + planet + '.resources.deuterium'] = 0;
    for(let i = 0 ; i<player.planets[planet].shipConstrucction.length ; i++){
      if(player.planets[planet].shipConstrucction[i].item === shipyardName){
        objInc['planets.' + planet + '.resources.metal']     += player.planets[planet].shipConstrucction[i].metal;
        objInc['planets.' + planet + '.resources.crystal']   += player.planets[planet].shipConstrucction[i].crystal;
        objInc['planets.' + planet + '.resources.deuterium'] += player.planets[planet].shipConstrucction[i].deuterium;
        events.remove({time: player.planets[planet].shipConstrucction[i].init + player.planets[planet].shipConstrucction[i].time*1000, player: player.name});
        canCancel = true;
      }
    }

    objPull['planets.' + planet + '.shipConstrucction'] = {item: shipyardName};
    base.savePlayerData(player.name, undefined, objInc, undefined, objPull, () => {
      if(canCancel){ // Se fija si cancelo algo
        res.send({ok: true, mes: "Cancel Ship successful."});
      }else{
        res.send({ok: false, mes: "Can not cancel ship request. There is no such kind of ship request."});
      }
    });
  },

  // Recalcula produccion/energia de un planeta. Si obj != undefined aplica nuevos porcentajes y guarda en DB.
  updateResourcesData: function(res, player, planet, obj = undefined){
    let objSet = {};
    let spd    = this.universo.speed;
    let plasma = player.research.plasma;
    let minas  = player.planets[planet].buildings;
    let temp   = (player.planets[planet].temperature.max + player.planets[planet].temperature.min)/2;
    if(fun.validResourcesSettingsObj(obj, false)){
      player.planets[planet].resourcesPercentage = obj;
      objSet['planets.$.resourcesPercentage'] = obj;
    }
    fun.objStringToNum(player.planets[planet].resourcesPercentage);
    const pct = player.planets[planet].resourcesPercentage;
    const {maxEnergyAux, auxEnergy, energyTotal, energyUsage} = this._calcEnergyDistribution(
      minas, pct, player.research.energy, player.planets[planet].fleet.solarSatellite, temp
    );
    const eff = {
      metal:     isNaN(energyUsage.metal     / maxEnergyAux.metal)     ? 0 : energyUsage.metal     / maxEnergyAux.metal,
      crystal:   isNaN(energyUsage.crystal   / maxEnergyAux.crystal)   ? 0 : energyUsage.crystal   / maxEnergyAux.crystal,
      deuterium: isNaN(energyUsage.deuterium / maxEnergyAux.deuterium) ? 0 : energyUsage.deuterium / maxEnergyAux.deuterium
    };
    let energy = Math.floor(energyTotal - maxEnergyAux.metal - maxEnergyAux.crystal - maxEnergyAux.deuterium);
    objSet['planets.$.resources.energy'] = energy;
    let deuteriumHour = spd * eff.deuterium * pct.deuterium * minas.deuteriumMine * Math.pow(1.1, minas.deuteriumMine) * (1.36 - 0.004 * temp) * (100 + plasma/3) / 100 + auxEnergy.fusionDeuterium;
    if(deuteriumHour < 0) deuteriumHour = 0;
    objSet['planets.$.resourcesAdd'] = {
      metal:     30*spd + 3*eff.metal     * spd * pct.metal     * minas.metalMine     * Math.pow(1.1, minas.metalMine)     * (100 + plasma)     / 100,
      crystal:   15*spd + 2*eff.crystal   * spd * pct.crystal   * minas.crystalMine   * Math.pow(1.1, minas.crystalMine)   * (100 + plasma*2/3) / 100,
      deuterium: deuteriumHour,
      energy:    energyTotal
    };
    player.planets[planet].resourcesAdd     = objSet['planets.$.resourcesAdd'];
    player.planets[planet].resources.energy = energy;
    if(obj != undefined){
      base.updateResourcesDataBase(player.planets[planet].coordinates, objSet, () => {res.send({ok: true})});
    }
  },

  updateResourcesDataMoon: function(res, player, planet, obj){
    if(fun.validResourcesSettingsObj(obj, true)){
      let objSet = {};
      obj.sunshade = parseInt(obj.sunshade);
      obj.beam     = parseInt(obj.beam);

      // Recalcula la temperatura del planeta
      objSet['planets.$.temperature'] = {max: Math.floor(player.planets[planet].temperatureNormal.max+player.planets[planet].moon.buildings.lunarBeam*4*obj.beam/10-player.planets[planet].moon.buildings.lunarSunshade*4*obj.sunshade/10),
                                         min: Math.floor(player.planets[planet].temperatureNormal.min+player.planets[planet].moon.buildings.lunarBeam*4*obj.beam/10-player.planets[planet].moon.buildings.lunarSunshade*4*obj.sunshade/10)};
      objSet['planets.$.moon.values'] = obj;
      base.updateResourcesDataBase(player.planets[planet].coordinates, objSet, () => {
        // Recalcula la produccion de las minas y guarda todo en la base de datos
        this.updateResourcesData(res, player, planet, player.planets[planet].resourcesPercentage);
      });
    }
  },

  addFleetMovement: function(player, planet, moon, obj, res){
    // Verifica que las cordenadas sean validas
    if(!fun.coordenadaValida(obj.coorDesde)){
      res.send({ok: false, mes: "Coordenadas de origen invalidas."});
      return res;
    }
    if(!fun.coordenadaValida(obj.coorHasta)){
      res.send({ok: false, mes: "Coordenadas de destino invalidas."});
      return res;
    }

    // Verifica que no se este enviando una flota a la misma posicion de salida
    if((fun.equalCoor(obj.coorDesde, obj.coorHasta)) && ((moon && obj.destination === 2) || (!moon && obj.destination === 1))){
      res.send({ok: false, mes: "No se puede mandar una flota de un lugar a si mismo."});
      return res;
    }

    // Verifica que las naves enviadas sean validas
    if(!fun.validShips(obj.ships)){
      res.send({ok: false, mes: "Naves no validas"});
      return res;
    }

    // Verifica que halla espacio para una flota o expedicion mas (Comentar el if para tener slot infinitos)
    let fleetExpeditionObj = fun.getCantFleets(player);
    if(fleetExpeditionObj.fleets >= player.research.computer+1){
      res.send({ok: false, mes: "No hay mas espacio para otra flota."});
      return res;
    }else if(obj.mission === 0 && fleetExpeditionObj.expeditions >= Math.floor(Math.sqrt(player.research.astrophysics))){
      res.send({ok: false, mes: "No hay mas espacio para otra expedicion."});
      return res;
    }
    let validMission    = false;
    let fleetVoid       = true;
    let thereIsNoFleet  = false;
    let flotaValida     = false;
    let misil           = obj.ships.misil > 0;
    let minSpeed        = Infinity;
    let neededDeuterium = 0;
    let maxCarga        = 0;
    let distancia       = fun.calculaDistancia(obj.coorDesde, obj.coorHasta, this.universo.donutGalaxy, this.universo.donutSystem);
    let navesInfo       = costs.navesInfo(player.research.combustion, player.research.impulse, player.research.hyperspace_drive);
    for(let item in obj.ships){
      if(item !== 'misil'){
        if(moon){
          if(obj.ships[item] > player.planets[planet].moon.fleet[item]) thereIsNoFleet = true;
        }else{
          if(obj.ships[item] > player.planets[planet].fleet[item]) thereIsNoFleet = true;
        }
        if(obj.ships[item] < 0) obj.ships[item] = 0;  // Controla que no sea un numero negativo
        if(obj.ships[item] > 0){                      // Si hay nave de ese tipo
          fleetVoid = false;
          if(navesInfo[item].speed < minSpeed) minSpeed = navesInfo[item].speed; // Obtengo la velocidad minima de toda la flota
          neededDeuterium += Math.floor(obj.ships[item] * navesInfo[item].consumo * distancia * Math.pow(0.68+obj.porce/100, 2) / 40000);
        }
        maxCarga += obj.ships[item] * navesInfo[item].carga;
      }
    }
    // Me fijo por separado el caso de los misiles
    if(obj.ships['misil'] < 0) obj.ships['misil'] = 0;
    if(misil && obj.mission !== 6){
      res.send({ok: false, mes: "Los misiles solo pueden ser eviados a misilear."});
      return res;
    }
    if(!fleetVoid && obj.mission === 6){
      res.send({ok: false, mes: "No se puede misilear con naves que no sean misiles."});
      return res;
    }
    if(obj.ships['misil'] > ((moon) ? 0 : player.planets[planet].defense["interplanetaryMissile"])){
      thereIsNoFleet = true;
    }
    switch (obj.mission) {
      case 0: // Expedition
        validMission = obj.coorHasta.pos === 16 && !misil;
        break;
      case 1: // Colonisation
        validMission = obj.ships.colony > 0 && !misil;
        break;
      case 2: // Recycle
        validMission = obj.ships.recycler > 0 && obj.destination === 3 && !misil;
        break;
      case 3: // Transport
      case 4: // Deployment
        validMission = !misil;
        break;
      case 5: // Espionage
        validMission =  obj.ships.espionageProbe > 0 && !misil;
        break;
      case 6: // Misil
        validMission = misil;
        break;
      case 7: // Attack
        validMission = !misil;
        break;
      case 8: // Moon Destruction
        validMission = obj.ships.deathstar > 0 && !misil;
        break;
    }
    // La unica mision que se puede mandar a la posicion 16 es una expedicion
    if(obj.mission !== 0 && obj.coorHasta.pos === 16) validMission = false;
    let deuterioDisponible = (moon) ? player.planets[planet].moon.resources.deuterium : player.planets[planet].resources.deuterium;
    if(!fleetVoid || misil){
      flotaValida = true;
      if(misil){
        minSpeed = navesInfo['misil'].speed;
        if(obj.coorDesde.gal !== obj.coorHasta.gal || Math.abs(obj.coorDesde.sys - obj.coorHasta.sys) > (player.research.impulse * 5)){
          res.send({ok: false, mes: "No se puede misilear una posicion tan lejana."});
          return res;
        }
      }
    }
    if(validMission && !thereIsNoFleet && isFinite(minSpeed) && neededDeuterium <= deuterioDisponible - obj.resources.deuterium){
      if(fun.recursosSuficientes((moon) ? player.planets[planet].moon.resources : player.planets[planet].resources, obj.resources)){
        fun.objStringToNum(obj.resources);  // Paso los recursos de strings a integer
        if(maxCarga >= obj.resources.metal + obj.resources.crystal + obj.resources.deuterium){

          // Calculo cuanto tarda la flota en llegar
          let time = Math.ceil((10+(35000/obj.porce)*Math.sqrt(10*distancia/minSpeed)) / this.universo.speedFleet);
          // Si es una expedicion le agrego una hora mas un tiempo random
          if(obj.mission === 0) time += 3600 + Math.ceil(Math.random()*3600);

          // Creo los objetos para guardar todo en la base de datos
          let pushObjAux = {};
          let pushObj    = {};
          pushObjAux['ships']       = obj.ships;       // Objeto con la catidad de cada nave en la flota
          pushObjAux['moon']        = moon;            // Boolenao que esta en true si la flota salio de una luna y falso si salio desde un planeta
          pushObjAux['coorDesde']   = obj.coorDesde;   // Coordenadas simplificadas del lugar de partida de la flota
          pushObjAux['coorHasta']   = obj.coorHasta;   // Coordenadas simplificadas del lugar de llegada de la flota
          pushObjAux['destination'] = obj.destination; // Planeta = 1, luna = 2, escombros = 3
          pushObjAux['speed']       = obj.porce;       // Numero del 1 al 10 que indica a que velocidad va la flota
          pushObjAux['mission']     = obj.mission;     // Numero del 0 al 8 que indica que numero de mission ejecuta esta flota
          pushObjAux['ida']         = true;            // Bool si dice si es un viaje de ida o de vuelta
          pushObjAux['duracion']    = time;            // Cuanto tarda el viaje en segundos
          pushObjAux['time']        = fun.horaActual();// Tiempo en que empezo el viaje
          pushObjAux['llegada']     = fun.horaActual() + time*1000; // Tiempo en que la flota llega
          pushObjAux['desdeName']   = player.planets[planet].name;  // Nombre del planeta de salida
          pushObjAux['desdeType']   = player.planets[planet].type;  // Tipo del planeta de salida
          pushObjAux['desdeColor']  = player.planets[planet].color; // Color del planeta de salida
          pushObjAux['hastaType']   = this.allCord[obj.coorHasta.gal+'_'+obj.coorHasta.sys+'_'+obj.coorHasta.pos].type; // Tipo del planeta de llegada
          if(fun.estaColonizado(this.allCord, obj.coorHasta)){
            pushObjAux['hastaColor'] = this.allCord[obj.coorHasta.gal+'_'+obj.coorHasta.sys+'_'+obj.coorHasta.pos].color;   // Color del planeta de llegada
          }else{
            pushObjAux['hastaColor'] = 0;
          }
          pushObjAux['resources']   = {metal: obj.resources.metal,      // Objeto con el formato {metal, crystal, deuterium} que indica cuato lleva la flota de cada recurso
                                       crystal: obj.resources.crystal,
                                       deuterium: obj.resources.deuterium};
          pushObj['movement'] = pushObjAux;
          obj.resources.deuterium += neededDeuterium;
          let moonString = (moon) ? '.moon.' : '.';
          let objInc = {};
          objInc['planets.$' + moonString + 'resources.metal'] = -obj.resources.metal;
          objInc['planets.$' + moonString + 'resources.crystal'] = -obj.resources.crystal;
          objInc['planets.$' + moonString + 'resources.deuterium'] = -obj.resources.deuterium;
          for(let clave in obj.ships){ // Resto todas las naves menos el misil
            if(clave !== 'misil'){
              if(moon){
                player.planets[planet].moon.fleet[clave] -= obj.ships[clave];
              }else{
                player.planets[planet].fleet[clave] -= obj.ships[clave];
              }
              objInc['planets.$' + moonString + 'fleet.' + clave] = -obj.ships[clave];
            }
          }
          // Resto los misiles que se enviaron
          objInc['planets.$' + moonString + 'defense.interplanetaryMissile'] = -obj.ships['misil'];
          player.movement.push(pushObj);
          const _fleetResObj = moon ? player.planets[planet].moon.resources : player.planets[planet].resources;
          _fleetResObj.metal     -= obj.resources.metal;
          _fleetResObj.crystal   -= obj.resources.crystal;
          _fleetResObj.deuterium -= obj.resources.deuterium;
          events.addElement({time: pushObjAux['llegada'], player: player.name});
          if(obj.mission >= 5 && fun.estaColonizado(this.allCord, obj.coorHasta)){ // Updateo al jugador atacado o espiado, un segundo antes de que llague la flota
            let destinoNamePlayer = fun.playerName(this.allCord, obj.coorHasta);
            if(destinoNamePlayer !== player.name){
              events.addElement({time: (pushObjAux['llegada'] - 1000), player: destinoNamePlayer});
            }
            let warnObjAux = {name: player.name,
                      planetName: player.planets[planet].name,
                      moon: (obj.destination === 2),
                      coorDesde: obj.coorDesde,
                      coorHasta: obj.coorHasta,
                      time: pushObjAux['llegada'],
                      desdeType: pushObjAux['desdeType'],
                      desdeColor: pushObjAux['desdeColor'],
                      hastaType: pushObjAux['hastaType'],
                      hastaColor: pushObjAux['hastaColor']};
            let warnObj = {hazards: warnObjAux}
            base.warnFromAttack(obj.coorHasta, warnObj);
          }

          base.pushMovementToDataBase(player.planets[planet].coordinates, objInc, pushObj);
          res.send({ok: true}); // Usa json y no send por ser pedido via POST
        }else{
          res.send({ok: false, mes: "No se puede cargar tantos recursos."});
        }
      }else{
        res.send({ok: false, mes: "Recursos no validos."});
      }
    }else{
      if(!validMission){
        res.send({ok: false, mes: "Mission no valida con la flota actual."});
      }else{
        if(neededDeuterium <= deuterioDisponible - obj.resources.deuterium){
          res.send({ok: false, mes: "Flota no valida."});
        }else{
          res.send({ok: false, mes: "Deuterio insuficiente como para lanzar la flota."});
        }
      }
    }
  },

  moveCuanticFleet: function(player, planet, obj, res){
    if(player.planets[planet].moon.active && player.planets[planet].moon.buildings.jumpGate > 0 && fun.estaColonizado(this.allCord, obj.coorHasta)){
      let index = fun.getIndexOfPlanet(player.planets, obj.coorHasta);
      // Se fija que se salte a otra luna, que exista la luna a la que se quiere saltar y que tenga salto cuantico
      if(index !== -1 && index !== planet && player.planets[index].moon.active && player.planets[index].moon.buildings.jumpGate > 0){
        // Se fija que el salto cuantico de salida este listo para usar (el de destino no necesita estar listo)
        if(player.planets[planet].moon.cuantic - fun.horaActual() <= 0){
          let incorrerctFleet = false;  // Se fija que la cantidad de flotas este bien
          let zeroFleet = true;
          let validShips = fun.zeroShips();
          for(let item in obj.ships){
            if(!fun.validInt(obj.ships[item]) || obj.ships[item] < 0) obj.ships[item] = 0;
            if(obj.ships[item] > 0) zeroFleet = false;
            if(obj.ships[item] > player.planets[planet].moon.fleet[item] || validShips[item] == undefined) incorrerctFleet = true;
          }
          if(!incorrerctFleet && !zeroFleet){ // Paso las naves a la luna que salto y actualizo la info de la luna
            base.addPlanetData(obj.coorHasta, fun.zeroResources(), obj.ships, true);
            base.updateCuantic(player.planets[planet].coordinates, fun.negativeObj(obj.ships), fun.horaActual() + Math.floor(12*3600*1000 / player.planets[planet].moon.buildings.jumpGate));
            res.send({ok: true});
          }else{
            res.send({ok: false, mes: "Flota incorrecta."});
          }
        }else{
          res.send({ok: false, mes: "El salto cuantico esta cargandose."});
        }
      }else{
        if(index === planet){
          res.send({ok: false, mes: "No se puede saltar a la misma luna."});
        }else{
          res.send({ok: false, mes: (index === -1) ? "Coordenas de salto invalidas." : "No se puede saltar a esa luna."});
        }
      }
    }else{
      res.send({ok: false, mes: "Error en la luna."});
    }
    return res;
  },

  marketResources: function(player, planet, obj, res){
    let recursosSuficientes = false;
    obj.button   = parseInt(obj.button);
    obj.cantidad = parseInt(obj.cantidad);
    if(fun.validInt(obj.button) && fun.validInt(obj.cantidad)){
      if(player.planets[planet].moon.active && player.planets[planet].moon.buildings.marketplace > 0 && obj.cantidad > 0){
        let objResourcesAdd = fun.zeroResources();
        switch (obj.button) {
          case 0: // Vendo metal por cristal
          case 1: // Vendo metal por deuterio
            if(player.planets[planet].moon.resources.metal >= obj.cantidad){
              recursosSuficientes = true;
              objResourcesAdd.metal = -obj.cantidad;
              if(obj.button === 0){
                objResourcesAdd.crystal = Math.floor(obj.cantidad*(2/3)*(9/10));
              }else{
                objResourcesAdd.deuterium = Math.floor(obj.cantidad/3*(9/10));
              }
            }
            break;
          case 2: // Vendo cristal por metal
          case 3: // Vendo cristal por deuterio
            if(player.planets[planet].moon.resources.crystal >= obj.cantidad){
              recursosSuficientes = true;
              objResourcesAdd.crystal = -obj.cantidad;
              if(obj.button === 2){
                objResourcesAdd.metal = Math.floor(obj.cantidad*(3/2)*(9/10));
              }else{
                objResourcesAdd.deuterium = Math.floor(obj.cantidad/2*(9/10));
              }
            }
            break;
          case 4: // Vendo deuterio por metal
          case 5: // Vendo deuterio por cristal
            if(player.planets[planet].moon.resources.deuterium >= obj.cantidad){
              recursosSuficientes = true;
              objResourcesAdd.deuterium = -obj.cantidad;
              if(obj.button === 4){
                objResourcesAdd.metal = Math.floor(obj.cantidad*3*(9/10));
              }else{
                objResourcesAdd.crystal = Math.floor(obj.cantidad*2*(9/10));
              }
            }
          default: // Opcion invalida
            res.send({ok: false, mes: "Recurso invalido."});
            return;
        }
        if(recursosSuficientes){
          base.addPlanetData(player.planets[planet].coordinates, objResourcesAdd, undefined, true, () => {
            res.send({ok: true});
          });
        }else{
          res.send({ok: false, mes: "Recursos insuficientes."});
        }
      }else{
        if(player.planets[planet].moon.active){
          if(obj.cantidad > 0){
            res.send({ok: false, mes: "Se necesita un mercado lunar para comerciar."});
          }else{
            res.send({ok: false, mes: "Cantidad de recursos invalida."});
          }
        }else{
          res.send({ok: false, mes: "No tenes luna."});
        }
      }
    }else{
      res.send({ok: false, mes: "Recursos invalidos."});
    }
  },

  colonize: function(cord, player, resources = undefined, ships = undefined){
    if((cord.pos === 3 || cord.pos === 13) && player.research.astrophysics < 4) return false;
    if((cord.pos === 2 || cord.pos === 14) && player.research.astrophysics < 6) return false;
    if((cord.pos === 1 || cord.pos === 15) && player.research.astrophysics < 8) return false;

    if(Math.ceil(player.research.astrophysics/2)+1 > player.planets.length && player.planets.length < 8 && !fun.estaColonizado(this.allCord, cord)){
      if(resources === undefined) resources = fun.zeroResources();
      if(ships === undefined) ships = fun.zeroResources();
      let newPlanet = this.createNewPlanet(cord, 'Colony', player, player.type, resources, ships);
      base.savePlayerData(player.name, undefined, undefined, {planets: newPlanet}, undefined, () => {});
      return true;
    }
    return false;
  },

  // Cambia el estado de una vaca, o sea, si esta en la lista de vacas lo saca y si no esta lo agrega
  //  -player = Objeto con la informacion del jugador
  //  -res = Respuesta a enviar al cliente
  //  -query = Objeto con la informacion del request del cliente
  toggleVaca: function(player, res, query){
    if(fun.coordenadaValida(query.coor)){
      let elimino = false;
      for(let i = 0 ; i<player.vacas.length ; i++){ // Busco si el jugador agregado ya esta en la lista de vacas
        if(fun.equalCoor(player.vacas[i].coordinates, query.coor)){
          elimino = true;
          player.vacas.splice(i, 1);
          i--;
        }
      }
      // Lo agrego a la lista con la informacion que vino del usuario, voy a confiar en que este la manda bien, en caso de no hacerlo el unico perjudicado es el mismo usuario
      if(!elimino && player.name !== query.playerName){
        player.vacas.push({coordinates: {gal: query.coor.gal, sys: query.coor.sys, pos: query.coor.pos},
                           playerName:  query.playerName,
                           planetName:  query.planetName,
                           estado:      query.estado});
      }
      base.savePlayerData(player.name, {vacas: player.vacas}, undefined, undefined, undefined, () => {
        res.send({ok: true, deleted: elimino});
      });
    }else{
      res.send({ok: false, mes: "Coordenadas invalidas"});
    }
  },

  // Actualiza los maximos campos y los usados en una luna
  //  -player = Objeto con la informacion del jugador
  //  -planet = Numero de planeta en el que esta la luna
  contMoonFields: function(player, planet){
    if(player.planets[planet].moon.active){
      let campos = 0;
      let objSet = {};
      for(let item in player.planets[planet].moon.buildings){
        campos += player.planets[planet].moon.buildings[item];
      }
      objSet['planets.' + planet + '.moon.campos'] = campos;
      objSet['planets.' + planet + '.moon.camposMax'] = player.planets[planet].moon.buildings.lunarBase*3 + 1;
      base.savePlayerData(player.name, objSet, undefined, undefined, undefined, () => {});
    }
  },

  techInfo: function(planet){
    let build = this.player.planets[planet].buildings;
    let research = this.player.research;
    let buildMoon = this.player.planets[planet].moon.active ? this.player.planets[planet].moon.buildings : fun.zeroBuildingsMoon();
    let t = costs.techRequirements(build, research, buildMoon);
    let info = {};
    costs.technologyList.forEach(item => {
      let level;
      if      (item.category === 'Planet Building' || item.category === 'Planet Facility') level = build[item.key] || 0;
      else if (item.category === 'Lunar Facility')  level = buildMoon[item.key] || 0;
      else if (item.category === 'Investigation')   level = research[item.key]  || 0;
      info[item.key] = {tech: t[item.key], level};
    });
    return info;
  },

  addNewPlayer: async function(name, styleGame, botType) {
    const existingNames = new Set(Object.values(this.allCord).map(v => v.playerName));
    if(existingNames.has(name)){
      console.log(`Player name '${name}' already exists.`);
      return undefined;
    }
    let newCoor = this.newCord();
    if(newCoor == undefined || fun.estaColonizado(this.allCord, newCoor)){
      console.log(`No free coordinate for player '${name}'.`);
      return undefined;
    }
    let newPlanet = this.createNewPlanet(newCoor, "Planeta Principal", name, 'activo', fun.zeroResources(), fun.zeroShips());
    let password = fun.randomString();
    this.allCord[newCoor.gal+'_'+newCoor.sys+'_'+newCoor.pos] = {espionage: 0, playerName: name};
    const botTemplate = (botType && botType !== 'human' && botTypes[botType])
      ? JSON.parse(JSON.stringify(botTypes[botType])) : undefined;
    if (botTemplate) {
      botTemplate.planetProgress = {};
      if (botTemplate.research) botTemplate.research.currentMission = 0;
    }
    let newPlayer = {'name': name,
      'styleGame': styleGame,
      ...(botType !== undefined && {'botType': botType}),
      ...(botTemplate !== undefined && {'bot': botTemplate}),
      pass: fun.hash(password),
      planets: [newPlanet],
      maxPlanets: 1,
      highscore: this.cantPlayers + 1,
      lastHighscore: this.cantPlayers + 1,
      puntos: 0,
      puntosAcum: 0,
      vacas: [],
      sendEspionage: 1,
      sendSmall: 1,
      sendLarge: 1,
      dark: 8000,
      messagesCant: 0,
      messages: [],
      movement: [],
      researchConstrucction: false,
      tutorial: [false, false, false, false, false, false, false, false, false, false],
      research: fun.zeroResearch(),
      lastVisit: fun.horaActual(),
      type: "activo",
      hazards: []
    };
    this.cantPlayers++;
    try {
      await base.insertPlayer(newPlayer);
      if (botType && botType !== 'human') {
        events.addElement({ time: fun.horaActual(), player: name });
      }
      return password;
    } catch(err) {
      console.error(`Failed to insert player '${name}':`, err.message);
      this.cantPlayers--;
      delete this.allCord[newCoor.gal+'_'+newCoor.sys+'_'+newCoor.pos];
      return undefined;
    }
  },

  deletePlayer: function(playerName, f){
    for(let key in this.allCord){
      if(this.allCord[key].playerName === playerName) delete this.allCord[key];
    }
    events.queue = events.queue.filter(e => e.player !== playerName);
    this.cantPlayers--;
    base.deletePlayer(playerName, f);
  },

  sendMessage: function(playerName, info) {
    let newMessage = {date: new Date().toString().slice(0,24), type: info.type, title: info.title, text: info.text, data: info.data};
    if(playerName === this.player.name) this.player.messagesCant++;
    base.savePlayerData(playerName, undefined, {messagesCant: 1}, {messages: newMessage}, undefined, () => {});
  },

  deleteMessage: function(playerName, all, borra, res) {
    let obj;
    if(all === true){
      if(fun.validInt(borra)){
        obj = {type: parseInt(borra)};
      }else{
        res.send({ok: false, mes: "Invalid type."});
        return res;
      }
    }else{
      if(/\w{3} \w{3} .. \d{4} \d{2}:\d{2}:\d{2}/.test(borra)){
        obj = {date: borra};
      }else{
        res.send({ok: false, mes: "Invalid date."});
        return res;
      }
    }
    base.savePlayerData(playerName, undefined, undefined, undefined, {messages: obj}, () => {
      res.send({ok: true});
    });
  },

  setNoReadMessages: function(){
    this.player.messagesCant = 0;
    base.savePlayerData(this.player.name, {messagesCant: 0}, undefined, undefined, undefined, () => {});
  },

  sendSpyReport: function(playerName, coor, indiceDeEspionage, moon){
    base.findAndExecute(coor, (res) => {
      let index = fun.getIndexOfPlanet(res.planets, coor);
      let report = {};
      if(index === -1 || (moon && !res.planets[index].moon.active)){
        report = {type: 3, title: "Espionage Report Failed", text: (index === -1) ? "There is no planet in the coordinates..." : "There is no moon in the coordinates...", data: {}};
      }else{
        let dataEsp = {moon, coor, playerName: res.name};
        dataEsp.planetName = moon ? res.planets[index].moon.name : res.planets[index].name;
        dataEsp.resources = moon ? res.planets[index].moon.resources : res.planets[index].resources;
        if(indiceDeEspionage >= 2){
          dataEsp.fleet = moon ? res.planets[index].moon.fleet : res.planets[index].fleet;
          if(indiceDeEspionage >= 3){
            dataEsp.defense = moon ? fun.zeroDefense() : res.planets[index].defense;
            if(indiceDeEspionage >= 5){
              dataEsp.research = res.research;
              if(indiceDeEspionage >= 7){
                dataEsp.buildings = moon ? res.planets[index].moon.buildings : res.planets[index].buildings;
              }
            }
          }
        }
        report = {type: 2, title: "Espionage Report", text: "", data: dataEsp};
      }
      this.sendMessage(playerName, report);
    });
  },

  usePhalanx: function(coor, coorDesde, phal, res){
    if(fun.coordenadaValida(coor) && fun.coordenadaValida(coorDesde)){
      let alcance = phal * phal - 1;
      let estaEnRango = false;
      if(this.universo.donutSystem){
        estaEnRango = Math.min(Math.abs(coorDesde.sys - coor.sys), Math.abs(coorDesde.sys - coor.sys - 499), Math.abs(coorDesde.sys - coor.sys + 499)) <= alcance;
      }else{
        estaEnRango = Math.abs(coorDesde.sys - coor.sys) <= alcance;
      }
      if(estaEnRango && coor.gal === coorDesde.gal){
        base.findAndExecute(coor, (resPlayer) => {
          let listRes = [];
          for(let i = 0 ; i<resPlayer.movement.length ; i++){
            if(fun.equalCoor(resPlayer.movement[i].coorDesde, coor)){
              listRes.push(resPlayer.movement[i]);
            }
          }
          res.send({ok: true, data: listRes});
        });
      }else{
        res.send({ok: false, mes: "Alcance del sensor insuficiente."});
      }
    }else{
      res.send({ok: false, mes: "Coordenadas invalidas."});
    }
  },

  systemInfo: function(res, gal, sys){
    if(!fun.coordenadaValida({gal, sys, pos: 1})){
      res.send({ok: false, mes: "Coordenadas no validas."});
      return res;
    }
    let respuesta = {};
    for(let i = 1 ; i<=15 ; i++){
      respuesta['pos' + i] = {active: false};
    }
    let listaPosiblesVacas = fun.posiblesVacas(this.player.vacas, gal, sys);
    base.findPlayersBySystemCode(gal+'_'+sys, (doc, err) => {
      for(let i = 0 ; i<doc.planets.length ; i++){
        if(doc.planets[i].coordinatesCod === gal+'_'+sys){
          let pos = doc.planets[i].coordinates.pos;
          respuesta['pos' + pos] = {active:        true,
                                    player:        doc.name,
                                    type:          doc.planets[i].type,
                                    color:         doc.planets[i].color,
                                    name:          doc.planets[i].name,
                                    moon:          doc.planets[i].moon.active,
                                    moonName:      doc.planets[i].moon.name,
                                    moonSize:      doc.planets[i].moon.size,
                                    debris:        doc.planets[i].debris.active,
                                    metalDebris:   doc.planets[i].debris.metal,
                                    crystalDebris: doc.planets[i].debris.crystal,
                                    esVaca:        listaPosiblesVacas.includes(pos),
                                    estado:        "activo"};
        }
      }
    }, () => {
      res.send({ok: true, mes: "Info de la galaxia: " + gal + ", sistema: " + sys, data: respuesta});
    });
  },

  setOptions: function(playerName, res, esp, small, large){
    if(fun.validInt(esp) && esp > 0 && fun.validInt(small) && small > 0 && fun.validInt(large) && large > 0){
      base.savePlayerData(playerName, {sendEspionage: esp, sendSmall: small, sendLarge: large}, undefined, undefined, undefined, () => {
        res.send({ok: true});
      });
    }else{
      res.send({ok: false, mes: "Algo salio mal. Parametros invalidos."});
    }
  },

  highscoreData: function(res){
    let listInfo = [];
    let newPosition;
    let i = 1;
    base.forEachPlayerSortedByPoints((doc, err) => {
      if(doc.name === this.player.name) newPosition = i;
      listInfo.push({name: doc.name,
                     coor: doc.planets[0].coordinates,
                     points: doc.puntos,
                     rank: doc.highscore,
                     lastRank: doc.lastHighscore});
      i++;
    }, () => {
      base.savePlayerData(this.player.name, {highscore: newPosition}, undefined, undefined, undefined, () => {});
      res.send({ok: true, info: listInfo, newPos: newPosition});
    });
  },

  recicleDebris: function(playerName, debris, movement, newMovTime, newMovLlegada){
    if(debris.active){
      let espacioLibre = fun.espacioLibre(movement);
      let capacidadDeCarga = Math.min(20000*movement.ships.recycler, espacioLibre);
      let newResources = fun.cargaEscombros(debris, capacidadDeCarga);
      let newDebris = {active: false, metal: debris.metal-newResources.metal, crystal: debris.crystal-newResources.crystal};
      newDebris.active = !(newDebris.metal <= 0 && newDebris.crystal <= 0);
      base.addMovementResources(playerName, newMovTime, newMovLlegada, newResources.metal, newResources.crystal);
      return newDebris;
    }
    return undefined;
  },

  returnFleetInDataBase: function(player, num, res = undefined, time = undefined, resources = undefined, ships = undefined){
    if(fun.validInt(num) && num >= 0 && num < player.movement.length){
      let actual = fun.horaActual();
      if(player.movement[num].ida && player.movement[num].mission !== 6 && !(player.movement[num].mission === 0 && actual >= player.movement[num].llegada)){
        let updateObjAux = player.movement[num];
        if(time == undefined){
          time = Math.ceil((actual - updateObjAux['time'])/1000);
        }
        let oldTime    = updateObjAux.time;
        let oldLlegada = updateObjAux.llegada;
        if(ships != undefined){
          ships.misil = 0;
          updateObjAux['ships'] = ships;
        }
        if(resources != undefined) updateObjAux['resources'] = resources;
        updateObjAux.ships['misil'] = 0;
        updateObjAux['ida']         = false;
        updateObjAux['duracion']    = time;
        updateObjAux['time']        = actual;
        updateObjAux['llegada']     = actual + time*1000;
        if(res != undefined){
          events.remove({time: oldLlegada, player: player.name});
          if(player.movement[num].mission >= 5){
            events.remove({time: oldLlegada - 1000, player: fun.playerName(this.allCord, player.movement[num].coorHasta)});
          }
        }
        events.addElement({time: updateObjAux['llegada'], player: player.name});
        player.movement[num] = updateObjAux;
        if(player.movement[num].mission >= 6){
          base.removeHazard(player.movement[num].coorHasta, oldLlegada);
        }
        base.updateMovementInDB(player.name, oldTime, oldLlegada, updateObjAux, () => {
          if(res != undefined) res.send({ok: true});
        });
      }else{
        if(res != undefined) res.send({ok: false, mes: "El viaje ya esta regresando."});
      }
    }else{
      if(res != undefined) res.send({ok: false, mes: "Numero de flota invalido."});
    }
  },

  returnFleet: function(movement, newResources = undefined, newShips = undefined){
    let actual = fun.horaActual();
    let newTime = (movement.llegada - movement.time)/1000;
    newTime -= (actual - movement.llegada)/1000;
    if(newTime < 0) newTime = 0;
    let pushObj = {};
    pushObj.movement = movement;
    if(newShips     != undefined) pushObj.movement.ships = newShips;
    if(newResources != undefined) pushObj.movement.resources = newResources;
    pushObj.movement.ships.misil = 0;
    pushObj.movement.ida         = false;
    pushObj.movement.duracion    = newTime;
    pushObj.movement.time        = actual;
    pushObj.movement.llegada     = actual + newTime*1000;
    events.addElement({time: pushObj.movement.llegada, player: fun.playerName(this.allCord, movement.coorDesde)});
    base.pushMovementToDataBase(movement.coorDesde, {}, pushObj);
  },

  contPoint: function(playerName){
    base.findAndExecuteByName(playerName, (res) => {
      let puntos = 0;
      let maxLevel = 0;
      let costShipyard = fun.costShipsAndDefenses();
      for(let item in res.research){
        if(res.research[item] > maxLevel) maxLevel = res.research[item];
      }
      for(let j = 0 ; j<=maxLevel ; j++){
        puntos += (j < res.research.energy)           ? 800*Math.pow(2, j) +  400*Math.pow(2, j) : 0;
        puntos += (j < res.research.laser)            ? 200*Math.pow(2, j) + 100*Math.pow(2, j) : 0;
        puntos += (j < res.research.ion)              ? 1000*Math.pow(2, j) + 300*Math.pow(2, j) +  100*Math.pow(2, j) : 0;
        puntos += (j < res.research.hyperspace)       ? 4000*Math.pow(2, j) +  2000*Math.pow(2, j) : 0;
        puntos += (j < res.research.plasma)           ? 2000*Math.pow(2, j) + 4000*Math.pow(2, j) +  1000*Math.pow(2, j) : 0;
        puntos += (j < res.research.espionage)        ? 200*Math.pow(2, j) + 1000*Math.pow(2, j) +  200*Math.pow(2, j) : 0;
        puntos += (j < res.research.computer)         ? 400*Math.pow(2, j) +  600*Math.pow(2, j) : 0;
        puntos += (j < res.research.astrophysics)     ? 4000*Math.pow(2, j) + 8000*Math.pow(2, j) +  4000*Math.pow(2, j) : 0;
        puntos += (j < res.research.intergalactic)    ? 240000*Math.pow(2, j) + 400000*Math.pow(2, j) +  160000*Math.pow(2, j) : 0;
        puntos += (j < res.research.combustion)       ? 400*Math.pow(2, j) + 600*Math.pow(2, j) : 0;
        puntos += (j < res.research.impulse)          ? 2000*Math.pow(2, j) + 4000*Math.pow(2, j) +  600*Math.pow(2, j) : 0;
        puntos += (j < res.research.hyperspace_drive) ? 10000*Math.pow(2, j) + 20000*Math.pow(2, j) +  6000*Math.pow(2, j) : 0;
        puntos += (j < res.research.weapon)           ? 800*Math.pow(2, j) + 200*Math.pow(2, j) : 0;
        puntos += (j < res.research.shielding)        ? 200*Math.pow(2, j) + 600*Math.pow(2, j) : 0;
        puntos += (j < res.research.armour)           ? 1000*Math.pow(2, j) : 0;
      }
      for(let i = 0 ; i<res.planets.length ; i++){
        for(let obj in res.planets[i].fleet){
          puntos += costShipyard[obj].metal * res.planets[i].fleet[obj] + costShipyard[obj].crystal * res.planets[i].fleet[obj] + costShipyard[obj].deuterium * res.planets[i].fleet[obj];
        }
        for(let obj in res.planets[i].defense){
          puntos += costShipyard[obj].metal * res.planets[i].defense[obj] + costShipyard[obj].crystal * res.planets[i].defense[obj] + costShipyard[obj].deuterium * res.planets[i].defense[obj];
        }
        maxLevel = 0;
        for(let item in res.planets[i].buildings){
          if(res.planets[i].buildings[item] > maxLevel) maxLevel = res.planets[i].buildings[item];
        }
        for(let j = 0 ; j<=maxLevel ; j++){
          puntos += (j < res.planets[i].buildings.metalMine)        ? Math.floor(60*Math.pow(1.5, j)) + Math.floor(15*Math.pow(1.5, j)) : 0;
          puntos += (j < res.planets[i].buildings.crystalMine)      ? Math.floor(48*Math.pow(1.6, j)) + Math.floor(24*Math.pow(1.6, j)) : 0;
          puntos += (j < res.planets[i].buildings.deuteriumMine)    ? Math.floor(225*Math.pow(1.5, j)) + Math.floor(75*Math.pow(1.5, j)) : 0;
          puntos += (j < res.planets[i].buildings.solarPlant)       ? Math.floor(75*Math.pow(1.5, j)) + Math.floor(30*Math.pow(1.5, j)) : 0;
          puntos += (j < res.planets[i].buildings.fusionReactor)    ? Math.floor(900*Math.pow(1.8, j)) + Math.floor(360*Math.pow(1.8, j)) + Math.floor(180*Math.pow(1.8, j)) : 0;
          puntos += (j < res.planets[i].buildings.metalStorage)     ? 1000*Math.pow(2, j) : 0;
          puntos += (j < res.planets[i].buildings.crystalStorage)   ? 1000*Math.pow(2, j) + 500*Math.pow(2, j) : 0;
          puntos += (j < res.planets[i].buildings.deuteriumStorage) ? 1000*Math.pow(2, j) + 1000*Math.pow(2, j) : 0;
          puntos += (j < res.planets[i].buildings.robotFactory)     ? 400*Math.pow(2, j) + 120*Math.pow(2, j) + 200*Math.pow(2, j) : 0;
          puntos += (j < res.planets[i].buildings.shipyard)         ? 400*Math.pow(2, j) + 200*Math.pow(2, j) + 100*Math.pow(2, j) : 0;
          puntos += (j < res.planets[i].buildings.researchLab)      ? 200*Math.pow(2, j) + 400*Math.pow(2, j) + 200*Math.pow(2, j) : 0;
          puntos += (j < res.planets[i].buildings.alliance)         ? 20000*Math.pow(2, j) + 40000*Math.pow(2, j) : 0;
          puntos += (j < res.planets[i].buildings.silo)             ? 20000*Math.pow(2, j) + 20000*Math.pow(2, j) + 1000*Math.pow(2, j) : 0;
          puntos += (j < res.planets[i].buildings.naniteFactory)    ? 1000000*Math.pow(2, j) + 500000*Math.pow(2, j) + 100000*Math.pow(2, j) : 0;
          puntos += (j < res.planets[i].buildings.terraformer)      ? 50000*Math.pow(2, j) + 100000*Math.pow(2, j): 0;
        }
        if(res.planets[i].moon.active){
          for(let obj in res.planets[i].moon.fleet){
            puntos += costShipyard[obj].metal * res.planets[i].moon.fleet[obj] + costShipyard[obj].crystal * res.planets[i].moon.fleet[obj] + costShipyard[obj].deuterium * res.planets[i].moon.fleet[obj];
          }
          maxLevel = 0;
          for(let item in res.planets[i].moon.buildings){
            if(res.planets[i].moon.buildings[item] > maxLevel) maxLevel = res.planets[i].moon.buildings[item];
          }
          for(let j = 0 ; j<=maxLevel ; j++){
            puntos += (j < res.planets[i].moon.buildings.lunarBase) ? 10000*Math.pow(2, j) + 20000*Math.pow(2, j) + 10000*Math.pow(2, j) : 0;
            puntos += (j < res.planets[i].moon.buildings.phalanx) ? 20000*Math.pow(2, j) + 40000*Math.pow(2, j) + 20000*Math.pow(2, j) : 0;
            puntos += (j < res.planets[i].moon.buildings.spaceDock) ? 200*Math.pow(4, j) + 10*Math.pow(3, j) + 50*Math.pow(5, j) : 0;
            puntos += (j < res.planets[i].moon.buildings.marketplace) ? 6000000*Math.pow(2, j) + 4000000*Math.pow(2, j) + 2000000*Math.pow(2, j) : 0;
            puntos += (j < res.planets[i].moon.buildings.lunarSunshade) ? 15000*Math.pow(2, j) + 50000*Math.pow(2, j) : 0;
            puntos += (j < res.planets[i].moon.buildings.lunarBeam) ? 75000*Math.pow(2, j) + 90000*Math.pow(2, j) : 0;
            puntos += (j < res.planets[i].moon.buildings.jumpGate) ? 2000000*Math.pow(2, j) + 4000000*Math.pow(2, j) + 2000000*Math.pow(2, j) : 0;
            puntos += (j < res.planets[i].moon.buildings.moonShield) ? 9000000*Math.pow(3, j) + 5000000*Math.pow(3, j) + 2000000*Math.pow(3, j) : 0;
          }
        }
      }
      base.savePlayerData(playerName, {'puntos': Math.floor(puntos/1000), puntosAcum: (puntos%1000)}, undefined, undefined, undefined, () => {});
    });
  },

  updateAllHighscore: function(){
    let i = 1;
    base.forEachPlayerSortedByPoints((doc, err) => {
      base.savePlayerData(doc.name, {highscore: i, lastHighscore: doc.highscore, type: fun.getTypeActive(doc.lastVisit)}, undefined, undefined, undefined, () => {});
      i++;
    }, () => {});
  },

  changePassword: function(user, newPass, res){
    console.log("Cambio la pass");
    base.savePlayerData(user, {pass: fun.hash(newPass)}, undefined, undefined, undefined, () => {
      console.log("Listo");
      res.send({ok: true});
    });
  },

  searchPlayer: function(res, playerName){
    base.findAndExecuteByName(playerName, (obj) => {
      if(obj == null){
        res.send({ok: false, mes: "Not found"});
      }else{
        let coors = [], names = [];
        for(let i = 0 ; i<obj.planets.length ; i++){
          coors.push(obj.planets[i].coordinates);
          names.push(obj.planets[i].name);
        }
        res.send({ok: true, 'names': names, 'coors': coors});
      }
    });
  },

  abandonPlanet: function(player, planet, res){
    if(player.planets.length > 1){
      let objPull = {};
      objPull.planets  = {coordinates: player.planets[planet].coordinates};
      objPull.movement = {coorDesde: player.planets[planet].coordinates};
      base.savePlayerData(player.name, undefined, undefined, undefined, objPull, () => {
        res.send({ok: true});
      });
    }else{
      res.send({ok: false, mes: "No podes abandonar el unico planeta que tenes."});
    }
  },

  setPlanetName: function(player, coor, newName, moon){
    let index = fun.getIndexOfPlanet(player.planets, coor);
    if(index === -1) return false;
    let objSet = {};
    if(moon){
      objSet['planets.$.moon.name'] = newName;
      player.planets[index].moon.name = newName;
    }else{
      objSet['planets.$.name'] = newName;
      player.planets[index].name = newName;
    }
    base.updateResourcesDataBase(coor, objSet, () => {});
    return true;
  },

  // Verifica si se cumplio una mision y entrega la recompensa — logica en rewards.js
  updateRewards: rewards.updateRewards,

  // Funcion que se ejecuta periodicamente para actualizar el estado de cada jugador en el universo
  updateUniverse: function(){
    if(!actualizando){
      actualizando = true;
      let horaActual = fun.horaActual();
      let salir = false;

      // Recorro la cola de jugadores a actualizar y si el tiempo llego, los actualizo
      while(!events.isEmpty && events.next().time <= horaActual){
        let updateObj = events.useNext();

        // Si tengo que updatear al jugador que estoy usando, lo guardo en la base de datos y en el objeto uni.player
        if(this.player && updateObj.player === this.player.name){
          base.getPlayer(updateObj.player, () => {}, false);
        }else if(!inFlightPlayers.has(updateObj.player)){ // Si no lo guardo solo en la base de datos
          inFlightPlayers.add(updateObj.player);
          const playerName = updateObj.player;
          const self = this;
          base.findAndExecuteByName(playerName, (player) => {
            if(player) self.updatePlayer(player, () => { inFlightPlayers.delete(playerName); });
            else inFlightPlayers.delete(playerName);
          });
        }
      }
      actualizando = false;
    }
  },

  // Funcion que se ejecuta una vez por dia, cuando el dia empieza
  dailyUpdate: function(){
    console.log('\x1b[36m%s\x1b[0m', "Daily update!!!");
    this.updateAllHighscore();
    // Dentro de un dia se va a ejecutar de nuevo
    setTimeout(() => {this.dailyUpdate();}, 86400000);
  }
};

base.setUniverse(exp);
module.exports = exp;
