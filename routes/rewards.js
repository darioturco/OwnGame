var fun  = require('./funciones_auxiliares');
var base = require('./data_base');

// Single source of truth for all mission data.
// planetReq: dot-path conditions that at least ONE planet must satisfy.
// researchReq: global research levels the player must have reached.
// minPlanets: minimum number of colonized planets required.
// reward: increments applied via base.savePlayerData (objInc format).
const MISSIONS = [
  { // 1: Build basic mines and solar plant
    title: 'Basic supply',
    info:  'To expand your home planet you first of all, will need enough resources. You can produce these via mines. Secure your basic supply by expanding your metal and crystal mines. Please note that the upkeep of supply buildings use up a lot of energy. You can produce this energy by, for example, using solar power plants.',
    planetReq:   { 'buildings.metalMine': 4, 'buildings.crystalMine': 2, 'buildings.solarPlant': 4 },
    researchReq: {},
    minPlanets:  0,
    reward:      { 'planets.0.resources.metal': 200, 'planets.0.resources.crystal': 100 }
  },{ // 2: Build deuterium mine, shipyard, and first rocket launcher
    title: 'Planet defence',
    info:  'To protect your resources from enemy pillagers, you should think about the expansion of your defence facilities early on. You can, for example, read up about what you need to build a rocket launcher in the rocket launcher techtree. You need deuterium to expand your defence facilities. Hence you should establish a basic production of this resource first.',
    planetReq:   { 'buildings.deuteriumMine': 2, 'buildings.shipyard': 1, 'defense.rocketLauncher': 1 },
    researchReq: {},
    minPlanets:  0,
    reward:      { 'puntos': 2, 'planets.0.defense.rocketLauncher': 1 }
  },{ // 3: Upgrade mines to mid levels
    title: 'Planet supplies',
    info:  'After the foundations for supply have been laid, you should intensify them. Please always make sure there is enough energy available.',
    planetReq:   { 'buildings.metalMine': 10, 'buildings.crystalMine': 7, 'buildings.deuteriumMine': 5 },
    researchReq: {},
    minPlanets:  0,
    reward:      { 'planets.0.resources.metal': 2000, 'planets.0.resources.crystal': 500 }
  },{ // 4: Research combustion drive and launch first cargo ship
    title: 'The first ship',
    info:  'Ships as well as rocket launchers can protect you from opponents. They have the advantage that they can additionally be used for offensive purposes. However, ships and modern defence facilities have to be researched first. You will need a research lab to do that.',
    planetReq:   { 'buildings.researchLab': 1, 'fleet.smallCargo': 1 },
    researchReq: { 'combustion': 2 },
    minPlanets:  0,
    reward:      { 'planets.0.resources.deuterium': 1500 }
  },{ // 5: Research espionage and deploy espionage probe
    title: 'Fleet action',
    info:  'Another way to get hold of resources is to pillage foreign planets. However, beware that some planets are very well protected. To find out information about foreign planets, you can spy on them.',
    planetReq:   { 'fleet.espionageProbe': 1 },
    researchReq: { 'combustion': 3, 'espionage': 2 },
    minPlanets:  0,
    reward:      { 'puntos': 2, 'planets.0.fleet.espionageProbe': 2 }
  },{ // 6: Research impulse drive, armour, and astrophysics
    title: 'Deep space',
    info:  'The universe is an endless ocean of space. Time and time again, researchers attempt to explore unknown territories and come across opponents, abnormalities and new resource sources. A respected emperor like you should allow yourself this luxury and send some brave researchers on expeditions. Simple espionage probes do not have a sufficient range and deliver inaccurate data.',
    planetReq:   {},
    researchReq: { 'impulse': 1, 'armour': 1, 'astrophysics': 1 },
    minPlanets:  0,
    reward:      { 'puntos': 40, 'planets.0.fleet.heavyFighter': 2, 'planets.0.fleet.smallCargo': 5 }
  },{ // 7: Research laser, impulse drive lv3, and colonize a second planet
    title: 'Expanding your empire',
    info:  'An emperor is always anxious to expand his empire. You need defend your planets with lasers. You have already laid the foundations for this on your home planet, but at some point it will be completely expanded. Develop new planets early on, to get hold of resources more quickly and to get hold of new building spaces. Through flexible air traffic between the planets and laser defenses, you also have a powerful device to protect your resources from enemy attacks.',
    planetReq:   {},
    researchReq: { 'laser': 3, 'impulse': 3 },
    minPlanets:  2,
    reward:      { 'puntos': 32, 'planets.0.resources.metal': 10000, 'planets.0.resources.crystal': 10000,
                   'planets.0.resources.deuterium': 10000, 'planets.0.fleet.largeCargo': 1, 'planets.0.fleet.smallCargo': 5 }
  },{ // 8: Upgrade mines to high levels
    title: 'Empire supplies',
    info:  'An empire need ha produccion stable of basic resources, the mines that are support by a stable energy system are ideal but sometimes, is not easy rech it. To buy a solar satelite can be a good and chep idea for get a efficien energy system for the produccion. But be carfull one attack y all will be red.',
    planetReq:   { 'buildings.metalMine': 17, 'buildings.crystalMine': 15, 'buildings.deuteriumMine': 12 },
    researchReq: {},
    minPlanets:  0,
    reward:      { 'planets.0.resources.metal': 20000, 'planets.0.resources.crystal': 15000, 'planets.0.resources.deuterium': 10000 }
  },{ // 9: Research combustion lv6 and shielding, build a recycler
    title: 'Debris field',
    info:  'After fighting in the Orbit, debris fields are formed from metal- and crystal residues from fired ships. The decomposition of this debris offers you an important alternative method to win resources.',
    planetReq:   { 'fleet.recycler': 1 },
    researchReq: { 'combustion': 6, 'shielding': 2 },
    minPlanets:  0,
    reward:      { 'puntos': 36, 'planets.0.fleet.recycler': 2 }
  },{ // 10: Research ion and impulse lv4, build cruisers
    title: 'Battle Army',
    info:  'You need a army for attack other player a get a lot of resources. This strategy can be boosted with a fleet of recicles that grab the debris of the enemy army and some lost of your fleet, you just need to be preparete. After that are ready for play Ogame like you want.',
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

  const researchOk    = Object.entries(m.researchReq).every(([key, lvl]) => (player.research[key] || 0) >= lvl);
  const planetsOk     = player.planets.length >= m.minPlanets;
  const hasPlanetReqs = Object.keys(m.planetReq).length > 0;
  const planetOk      = !hasPlanetReqs || player.planets.some(p => checkPlanetReqs(p, m.planetReq));

  if (researchOk && planetsOk && planetOk) {
    const objSet = { ['tutorial.' + (mission - 1)]: true };
    base.savePlayerData(player.name, objSet, m.reward, undefined, undefined, () => {
      res.send({ ok: true });
    });
  } else {
    res.send({ ok: false, mes: "Requisitos no cumplidos." });
  }
}

// Returns mission requirements and rewards in the flat format used by bots.
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

// Returns structured mission data for the UI (single source of truth for display).
function missionsInfo() {
  return MISSIONS.map(m => {
    const reqs = [];

    for (const [path, level] of Object.entries(m.planetReq)) {
      const parts = path.split('.');
      const category = parts[0];
      const key = parts[1];
      if (category === 'buildings') reqs.push({ type: 'building', key, level });
    }
    for (const [key, level] of Object.entries(m.researchReq)) {
      reqs.push({ type: 'research', key, level });
    }
    for (const [path, count] of Object.entries(m.planetReq)) {
      const parts = path.split('.');
      if (parts[0] === 'fleet')   reqs.push({ type: 'fleet',   key: parts[1], count });
      if (parts[0] === 'defense') reqs.push({ type: 'defense', key: parts[1], count });
    }
    if (m.minPlanets > 0) reqs.push({ type: 'colony', count: m.minPlanets });

    const reward = [];
    for (const [path, amount] of Object.entries(m.reward)) {
      if (path === 'puntos') continue;
      const parts = path.split('.');
      const category = parts[parts.length - 2];
      const key      = parts[parts.length - 1];
      reward.push({ type: category === 'resources' ? 'resource' : category, key, amount });
    }

    return { title: m.title, info: m.info, requirements: reqs, reward };
  });
}

module.exports = { updateRewards, getRewards, missionsInfo };
