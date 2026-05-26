var fun  = require('./funciones_auxiliares');
var base = require('./data_base');

// Tutorial mission definitions — edit requirements and rewards here.
// planetReq: dot-path conditions that at least ONE planet must satisfy.
// researchReq: global research levels the player must have reached.
// minPlanets: minimum number of colonized planets required.
// reward: increments applied via base.savePlayerData (objInc format).
const MISSIONS = [
  { // 1: Build basic mines and solar plant
    planetReq:   { 'buildings.metalMine': 4, 'buildings.crystalMine': 2, 'buildings.solarPlant': 4 },
    researchReq: {},
    minPlanets:  0,
    reward:      { 'planets.0.resources.metal': 150, 'planets.0.resources.crystal': 75 }
  },{ // 2: Build deuterium mine, shipyard, and first rocket launcher
    planetReq:   { 'buildings.deuteriumMine': 2, 'buildings.shipyard': 1, 'defense.rocketLauncher': 1 },
    researchReq: {},
    minPlanets:  0,
    reward:      { 'puntos': 2, 'planets.0.defense.rocketLauncher': 1 }
  },{ // 3: Upgrade mines to mid levels
    planetReq:   { 'buildings.metalMine': 10, 'buildings.crystalMine': 7, 'buildings.solarPlant': 5 },
    researchReq: {},
    minPlanets:  0,
    reward:      { 'planets.0.resources.metal': 2000, 'planets.0.resources.crystal': 500 }
  },{ // 4: Research combustion drive and launch first cargo ship
    planetReq:   { 'buildings.researchLab': 1, 'fleet.smallCargo': 1 },
    researchReq: { 'combustion': 2 },
    minPlanets:  0,
    reward:      { 'planets.0.resources.deuterium': 1500 }
  },{ // 5: Research espionage and deploy espionage probe
    planetReq:   { 'fleet.espionageProbe': 1 },
    researchReq: { 'combustion': 3, 'espionage': 2 },
    minPlanets:  0,
    reward:      { 'puntos': 2, 'planets.0.fleet.espionageProbe': 2 }
  },{ // 6: Research impulse drive, armour, and astrophysics
    planetReq:   {},
    researchReq: { 'impulse': 1, 'armour': 1, 'astrophysics': 1 },
    minPlanets:  0,
    reward:      { 'puntos': 40, 'planets.0.fleet.heavyFighter': 2, 'planets.0.fleet.smallCargo': 5 }
  },{ // 7: Research laser, impulse drive lv3, and colonize a second planet
    planetReq:   {},
    researchReq: { 'laser': 1, 'impulse': 3 },
    minPlanets:  2,
    reward:      { 'puntos': 32, 'planets.0.resources.metal': 10000, 'planets.0.resources.crystal': 10000,
                   'planets.0.resources.deuterium': 10000, 'planets.0.fleet.largeCargo': 1, 'planets.0.fleet.smallCargo': 5 }
  },{ // 8: Upgrade mines to high levels
    planetReq:   { 'buildings.metalMine': 17, 'buildings.crystalMine': 15, 'buildings.deuteriumMine': 12 },
    researchReq: {},
    minPlanets:  0,
    reward:      { 'planets.0.resources.metal': 20000, 'planets.0.resources.crystal': 15000, 'planets.0.resources.deuterium': 10000 }
  },{ // 9: Research combustion lv6 and shielding, build a recycler
    planetReq:   { 'fleet.recycler': 1 },
    researchReq: { 'combustion': 6, 'shielding': 2 },
    minPlanets:  0,
    reward:      { 'puntos': 36, 'planets.0.fleet.recycler': 2 }
  },{ // 10: Research ion and impulse lv4, build cruisers
    planetReq:   { 'fleet.cruiser': 2 },
    researchReq: { 'ion': 2, 'impulse': 4 },
    minPlanets:  0,
    reward:      { 'puntos': 130, 'planets.0.fleet.lightFighter': 10, 'planets.0.fleet.heavyFighter': 3, 'planets.0.fleet.battleship': 1 }
  },
];

// Reads a nested value from obj using a dot-separated path string
function getPath(obj, path) {
  return path.split('.').reduce((o, k) => (o ? o[k] : undefined), obj);
}

// Returns true when planet satisfies every requirement in reqs
function checkPlanetReqs(planet, reqs) {
  return Object.entries(reqs).every(([path, min]) => (getPath(planet, path) || 0) >= min);
}

// Verifies mission requirements and grants the reward if all are met
function updateRewards(player, mission, res) {
  mission = parseInt(mission);
  if (!fun.validInt(mission) || mission < 1 || mission > MISSIONS.length) {
    return res.send({ ok: false, mes: "Numero de mission equivocado." });
  }
  if (player.tutorial[mission - 1]) {
    return res.send({ ok: false, mes: "Mision ya completada." });
  }

  const m = MISSIONS[mission - 1];

  const researchOk  = Object.entries(m.researchReq).every(([key, lvl]) => (player.research[key] || 0) >= lvl);
  const planetsOk   = player.planets.length >= m.minPlanets;
  const hasPlanetReqs = Object.keys(m.planetReq).length > 0;
  const planetOk    = !hasPlanetReqs || player.planets.some(p => checkPlanetReqs(p, m.planetReq));

  if (researchOk && planetsOk && planetOk) {
    const objSet = { ['tutorial.' + (mission - 1)]: true };
    base.savePlayerData(player.name, objSet, m.reward, undefined, undefined, () => {
      res.send({ ok: true });
    });
  } else {
    res.send({ ok: false, mes: "Requisitos no cumplidos." });
  }
}

// Returns mission requirements and rewards in the flat format used by the client.
function getRewards() {
  return {
    requeriments: MISSIONS.map(m => {
      let req = {};
      for (let path in m.planetReq) {
        let key = path.split('.').pop();
        req[key] = m.planetReq[path];
      }
      for (let key in m.researchReq) {
        req[key] = m.researchReq[key];
      }
      if (m.minPlanets > 0) req.planetCant = m.minPlanets;
      return req;
    }),
    rewards: MISSIONS.map(m => {
      let rew = {};
      for (let path in m.reward) {
        let key = path.split('.').pop();
        if (key === 'puntos') {
          rew.puntos = m.reward[path];
        } else {
          rew[key] = (rew[key] || 0) + m.reward[path];
        }
      }
      return rew;
    }),
  };
}

module.exports = { updateRewards, getRewards };
