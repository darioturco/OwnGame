// All DB-dependent modules mocked before universe is required
jest.mock('../../routes/data_base', () => ({
  setUniverse:              jest.fn(),
  savePlayerData:           jest.fn(),
  addMovementResources:     jest.fn(),
  insertPlayer:             jest.fn(),
  findAndExecute:           jest.fn(),
  findAndExecuteByName:     jest.fn(),
  addPlanetData:            jest.fn(),
  pushMovementToDataBase:   jest.fn(),
  updateMovementInDB:       jest.fn(),
  setPlanetData:            jest.fn(),
  saveDebris:               jest.fn(),
  warnFromAttack:           jest.fn(),
  removeHazard:             jest.fn(),
  updateCuantic:            jest.fn(),
  getPlayer:                jest.fn(),
  updateResourcesDataBase:  jest.fn(),
  forEachPlayerSortedByPoints: jest.fn(),
  findPlayersBySystemCode:  jest.fn(),
  setUniverseData:          jest.fn(),
}));
jest.mock('../../routes/battle',    () => ({ processBattle: jest.fn(), misilAttack: jest.fn() }));
jest.mock('../../routes/rewards',   () => ({ updateRewards: jest.fn() }));
jest.mock('../../routes/expedicion',() => ({ expedition: jest.fn() }));

const uni = require('../../routes/universe');
const fun = require('../../routes/funciones_auxiliares');
const base = require('../../routes/data_base');

// Helper: minimal planet object
function makePlanet(overrides = {}) {
  return {
    coordinates: { gal: 1, sys: 1, pos: 3 },
    coordinatesCod: '1_1',
    name: 'TestPlanet',
    buildings: fun.zeroBuilding(),
    fleet: { ...fun.zeroShips(), solarSatellite: 0 },
    defense: fun.zeroDefense(),
    resources: { metal: 1000, crystal: 1000, deuterium: 500, energy: 0 },
    resourcesAdd: { metal: 30, crystal: 15, deuterium: 0, energy: 0 },
    resourcesPercentage: { metal: '10', crystal: '10', deuterium: '10', energy: '10' },
    temperature: { max: 50, min: 10 },
    temperatureNormal: { max: 50, min: 10 },
    camposMax: 100,
    campos: 0,
    buildingConstrucction: { active: false },
    shipConstrucction: [],
    moon: { active: false, size: 0, buildings: fun.zeroBuildingsMoon(), buildingConstrucction: { active: false } },
    debris: { active: false, metal: 0, crystal: 0 },
    ...overrides
  };
}

// Helper: minimal player object
function makePlayer(overrides = {}) {
  return {
    name: 'TestPlayer',
    type: 'activo',
    research: fun.zeroResearch(),
    researchConstrucction: { active: false },
    planets: [makePlanet()],
    movement: [],
    puntosAcum: 0,
    puntos: 0,
    vacas: [],
    hazards: [],
    maxPlanets: 8,
    messagesCant: 0,
    messages: [],
    ...overrides
  };
}

beforeEach(() => {
  uni.universo = { speed: 1, speedFleet: 1, donutGalaxy: false, donutSystem: false, name: 'TestUni' };
  uni.player = makePlayer();
  uni.allCord = {};
  uni.cantPlayers = 0;
  jest.clearAllMocks();
});

// ─── _calcReturnTime ──────────────────────────────────────────────────────────
describe('_calcReturnTime', () => {
  test('mid-flight: returns positive remaining seconds', () => {
    // duration = (1000-0)/1000 = 1s; overdue = (500-1000)/1000 = -0.5 → result = 1.5
    const movement = { llegada: 1000, time: 0 };
    expect(uni._calcReturnTime(movement, 500)).toBeCloseTo(1.5);
  });

  test('exactly on arrival: returns full outgoing duration', () => {
    // outgoing = (1000-0)/1000 = 1s; overdue = 0 → return = 1s
    const movement = { llegada: 1000, time: 0 };
    expect(uni._calcReturnTime(movement, 1000)).toBe(1);
  });

  test('fully expired: clamps to 0', () => {
    // outgoing=1s; horaActual at llegada+1s → overdue=1s → 1-1=0
    const movement = { llegada: 1000, time: 0 };
    expect(uni._calcReturnTime(movement, 2000)).toBe(0);
    expect(uni._calcReturnTime(movement, 5000)).toBe(0);
  });

  test('longer round-trip', () => {
    // duration = (10000-0)/1000 = 10s; checked at horaActual=2000 (2s past arrival)
    // return = 10 - 2 = 8
    const movement = { llegada: 10000, time: 0 };
    expect(uni._calcReturnTime(movement, 12000)).toBe(8);
  });
});

// ─── _getResourceClass ────────────────────────────────────────────────────────
describe('_getResourceClass', () => {
  test('at or over max → "overmark"', () => {
    expect(uni._getResourceClass(100, 100)).toBe('overmark');
    expect(uni._getResourceClass(200, 100)).toBe('overmark');
  });

  test('at or over 80% → "middlemark"', () => {
    expect(uni._getResourceClass(80, 100)).toBe('middlemark');
    expect(uni._getResourceClass(90, 100)).toBe('middlemark');
  });

  test('under 80% → ""', () => {
    expect(uni._getResourceClass(0, 100)).toBe('');
    expect(uni._getResourceClass(79, 100)).toBe('');
  });

  test('boundary at exactly 4/5', () => {
    expect(uni._getResourceClass(80, 100)).toBe('middlemark');
    expect(uni._getResourceClass(79, 100)).toBe('');
  });
});

// ─── _calcEnergyDistribution ─────────────────────────────────────────────────
describe('_calcEnergyDistribution', () => {
  const zeroMinas = { metalMine: 0, crystalMine: 0, deuteriumMine: 0, solarPlant: 0, fusionReactor: 0 };
  const zeroPct   = { metal: 0, crystal: 0, deuterium: 0, energy: 0 };

  test('all zeros → all zero energy', () => {
    const { energyTotal, energyUsage } = uni._calcEnergyDistribution(zeroMinas, zeroPct, 0, 0, 0);
    expect(energyTotal).toBe(0);
    expect(energyUsage).toEqual({ metal: 0, crystal: 0, deuterium: 0 });
  });

  test('solar plant level 5, no mines → energyTotal > 0, no usage', () => {
    const minas = { ...zeroMinas, solarPlant: 5 };
    const { energyTotal, energyUsage } = uni._calcEnergyDistribution(minas, zeroPct, 0, 0, 0);
    expect(energyTotal).toBeGreaterThan(0);
    expect(energyUsage).toEqual({ metal: 0, crystal: 0, deuterium: 0 });
  });

  test('ample solar energy → mines run at full capacity (energyUsage = maxEnergyAux)', () => {
    const minas = { ...zeroMinas, metalMine: 5, crystalMine: 3, deuteriumMine: 2, solarPlant: 10 };
    const pct   = { metal: 10, crystal: 10, deuterium: 10, energy: 10 };
    const { maxEnergyAux, energyUsage } = uni._calcEnergyDistribution(minas, pct, 0, 0, 0);
    expect(energyUsage.metal).toBe(maxEnergyAux.metal);
    expect(energyUsage.crystal).toBe(maxEnergyAux.crystal);
    expect(energyUsage.deuterium).toBe(maxEnergyAux.deuterium);
  });

  test('scarce energy → energyUsage < maxEnergyAux', () => {
    const minas = { ...zeroMinas, metalMine: 5, crystalMine: 3, deuteriumMine: 2, solarPlant: 1 };
    const pct   = { metal: 10, crystal: 10, deuterium: 10, energy: 10 };
    const { maxEnergyAux, energyUsage } = uni._calcEnergyDistribution(minas, pct, 0, 0, 0);
    expect(energyUsage.metal).toBeLessThan(maxEnergyAux.metal);
    expect(energyUsage.crystal).toBeLessThan(maxEnergyAux.crystal);
    expect(energyUsage.deuterium).toBeLessThan(maxEnergyAux.deuterium);
  });

  test('satellites contribute to energy', () => {
    const { energyTotal: noSat }  = uni._calcEnergyDistribution(zeroMinas, zeroPct, 0, 0, 0);
    const { energyTotal: withSat } = uni._calcEnergyDistribution(zeroMinas, zeroPct, 0, 10, 0);
    expect(withSat).toBeGreaterThan(noSat);
  });

  test('higher temperature → more satellite energy', () => {
    const { energyTotal: cold } = uni._calcEnergyDistribution(zeroMinas, zeroPct, 0, 5, -100);
    const { energyTotal: hot  } = uni._calcEnergyDistribution(zeroMinas, zeroPct, 0, 5, 200);
    expect(hot).toBeGreaterThan(cold);
  });

  test('fusion reactor produces energy and consumes deuterium', () => {
    const minas = { ...zeroMinas, fusionReactor: 3 };
    const pct   = { ...zeroPct, energy: 10 };
    const { auxEnergy } = uni._calcEnergyDistribution(minas, pct, 0, 0, 0);
    expect(auxEnergy.fusion).toBeGreaterThan(0);
    expect(auxEnergy.fusionDeuterium).toBeLessThan(0);
  });

  test('energyUsage never exceeds maxEnergyAux', () => {
    const minas = { ...zeroMinas, metalMine: 8, crystalMine: 6, deuteriumMine: 4, solarPlant: 20 };
    const pct   = { metal: 10, crystal: 10, deuterium: 10, energy: 10 };
    const { maxEnergyAux, energyUsage } = uni._calcEnergyDistribution(minas, pct, 0, 0, 0);
    expect(energyUsage.metal).toBeLessThanOrEqual(maxEnergyAux.metal);
    expect(energyUsage.crystal).toBeLessThanOrEqual(maxEnergyAux.crystal);
    expect(energyUsage.deuterium).toBeLessThanOrEqual(maxEnergyAux.deuterium);
  });
});

// ─── getAlmacen ───────────────────────────────────────────────────────────────
describe('getAlmacen', () => {
  test('moon → all zeros', () => {
    const planet = makePlanet();
    expect(uni.getAlmacen(planet, true)).toEqual({ metal: 0, crystal: 0, deuterium: 0 });
  });

  test('planet, level 0 storage → base capacity', () => {
    const planet = makePlanet();
    const result = uni.getAlmacen(planet);
    // 5000 * floor(2.5 * e^(0.61*0)) = 5000 * floor(2.5) = 5000 * 2 = 10000
    expect(result.metal).toBe(10000);
    expect(result.crystal).toBe(10000);
    expect(result.deuterium).toBe(10000);
  });

  test('planet, higher storage levels → larger capacity', () => {
    const planet = makePlanet();
    planet.buildings.metalStorage = 3;
    const base0 = uni.getAlmacen(makePlanet());
    const base3 = uni.getAlmacen(planet);
    expect(base3.metal).toBeGreaterThan(base0.metal);
  });

  test('each resource uses its own storage building', () => {
    const planet = makePlanet();
    planet.buildings.metalStorage = 5;
    planet.buildings.crystalStorage = 2;
    planet.buildings.deuteriumStorage = 0;
    const result = uni.getAlmacen(planet);
    expect(result.metal).toBeGreaterThan(result.crystal);
    expect(result.crystal).toBeGreaterThan(result.deuterium);
  });
});

// ─── createNewMoon ────────────────────────────────────────────────────────────
describe('createNewMoon', () => {
  test('returns correct structure', () => {
    const moon = uni.createNewMoon(1000);
    expect(moon.active).toBe(true);
    expect(moon.size).toBe(1000);
    expect(moon.name).toBe('Luna');
    expect(moon.camposMax).toBe(1);
    expect(moon.campos).toBe(0);
    expect(moon.buildingConstrucction).toBe(false);
    expect(moon.cuantic).toBe(0);
    expect(moon.values).toEqual({ sunshade: 10, beam: 10 });
  });

  test('resources start at zero', () => {
    const moon = uni.createNewMoon(500);
    expect(moon.resources).toEqual({ metal: 0, crystal: 0, deuterium: 0, energy: 0 });
  });

  test('fleet starts at zero', () => {
    const moon = uni.createNewMoon(500);
    expect(Object.values(moon.fleet).every(v => v === 0)).toBe(true);
  });

  test('type between 1 and 5', () => {
    for (let i = 0; i < 20; i++) {
      const moon = uni.createNewMoon(100);
      expect(moon.type).toBeGreaterThanOrEqual(1);
      expect(moon.type).toBeLessThanOrEqual(5);
    }
  });

  test('different sizes', () => {
    expect(uni.createNewMoon(500).size).toBe(500);
    expect(uni.createNewMoon(8000).size).toBe(8000);
  });
});

// ─── createNewPlanet ─────────────────────────────────────────────────────────
describe('createNewPlanet', () => {
  const cord = { gal: 1, sys: 2, pos: 7 };
  const initResources = { metal: 0, crystal: 0, deuterium: 0 };
  const initShips = fun.zeroShips();

  test('returns all required fields', () => {
    const planet = uni.createNewPlanet(cord, 'Test', 'Alice', 'activo', initResources, initShips);
    expect(planet).toHaveProperty('coordinates', cord);
    expect(planet).toHaveProperty('name', 'Test');
    expect(planet).toHaveProperty('player', 'Alice');
    expect(planet).toHaveProperty('playerType', 'activo');
    expect(planet).toHaveProperty('type');
    expect(planet).toHaveProperty('color');
    expect(planet).toHaveProperty('temperature');
    expect(planet).toHaveProperty('camposMax');
    expect(planet).toHaveProperty('campos', 0);
    expect(planet).toHaveProperty('buildingConstrucction', false);
    expect(planet).toHaveProperty('shipConstrucction');
    expect(planet).toHaveProperty('resources');
    expect(planet).toHaveProperty('resourcesAdd');
    expect(planet).toHaveProperty('buildings');
    expect(planet).toHaveProperty('fleet');
    expect(planet).toHaveProperty('defense');
    expect(planet).toHaveProperty('moon');
    expect(planet).toHaveProperty('debris');
  });

  test('starts with 500 base metal and crystal + initResources', () => {
    const init = { metal: 100, crystal: 200, deuterium: 0 };
    const planet = uni.createNewPlanet(cord, 'P', 'Bob', 'activo', init, initShips);
    expect(planet.resources.metal).toBe(600);
    expect(planet.resources.crystal).toBe(700);
    expect(planet.resources.deuterium).toBe(0);
  });

  test('buildings and defense all start at zero', () => {
    const planet = uni.createNewPlanet(cord, 'P', 'Bob', 'activo', initResources, initShips);
    expect(Object.values(planet.buildings).every(v => v === 0)).toBe(true);
    expect(Object.values(planet.defense).every(v => v === 0)).toBe(true);
  });

  test('moon starts inactive', () => {
    const planet = uni.createNewPlanet(cord, 'P', 'Bob', 'activo', initResources, initShips);
    expect(planet.moon.active).toBe(false);
  });

  test('coordinatesCod = gal_sys', () => {
    const planet = uni.createNewPlanet(cord, 'P', 'Bob', 'activo', initResources, initShips);
    expect(planet.coordinatesCod).toBe('1_2');
  });

  test('idPlanet computed from coordinates', () => {
    // idPlanet = 500^2 * gal + 500 * sys + pos = 250000*1 + 1000 + 7 = 251007
    const planet = uni.createNewPlanet(cord, 'P', 'Bob', 'activo', initResources, initShips);
    expect(planet.idPlanet).toBe(250000 * 1 + 500 * 2 + 7);
  });

  test('resourcesAdd uses universe speed', () => {
    uni.universo.speed = 3;
    const planet = uni.createNewPlanet(cord, 'P', 'Bob', 'activo', initResources, initShips);
    expect(planet.resourcesAdd.metal).toBe(30 * 3);
    expect(planet.resourcesAdd.crystal).toBe(15 * 3);
  });
});

// ─── getFirstMovementInfo ────────────────────────────────────────────────────
describe('getFirstMovementInfo', () => {
  test('no movements → zero time and empty mission', () => {
    uni.player.movement = [];
    expect(uni.getFirstMovementInfo()).toEqual({ time: 0, mission: '' });
  });

  test('single movement → returns its info', () => {
    uni.player.movement = [{ llegada: 9999, mission: 7, ida: true }];
    const result = uni.getFirstMovementInfo();
    expect(result.time).toBe(9999);
    expect(result.mission).toBe('Attack');
  });

  test('multiple movements → returns earliest arriving one', () => {
    uni.player.movement = [
      { llegada: 5000, mission: 3, ida: true },
      { llegada: 2000, mission: 7, ida: true },
      { llegada: 8000, mission: 0, ida: true },
    ];
    const result = uni.getFirstMovementInfo();
    expect(result.time).toBe(2000);
    expect(result.mission).toContain('Attack');
  });

  test('returning fleet appends " (R)" to mission', () => {
    uni.player.movement = [{ llegada: 1000, mission: 3, ida: false }];
    const result = uni.getFirstMovementInfo();
    expect(result.mission).toBe('Transport (R)');
  });
});

// ─── _completeResearch ────────────────────────────────────────────────────────
describe('_completeResearch', () => {
  const horaActual = 1000000;

  function makeResearch(overrides = {}) {
    return {
      active: true,
      item: 'laser',
      init: horaActual - 200000,
      time: 100,    // 100 seconds → done (100*1000 + init = horaActual - 100000 < horaActual)
      metal: 200,
      crystal: 100,
      deuterium: 0,
      ...overrides
    };
  }

  test('inactive → returns false, no changes', () => {
    const player = makePlayer();
    const objSet = { puntosAcum: 0 };
    const objInc = {};
    player.researchConstrucction = { active: false };
    expect(uni._completeResearch(player, horaActual, objSet, objInc)).toBe(false);
    expect(objSet['researchConstrucction']).toBeUndefined();
  });

  test('not done yet → returns false', () => {
    const player = makePlayer();
    const objSet = { puntosAcum: 0 };
    const objInc = {};
    player.researchConstrucction = makeResearch({ init: horaActual, time: 500 });
    expect(uni._completeResearch(player, horaActual, objSet, objInc)).toBe(false);
  });

  test('done, regular item → returns false', () => {
    const player = makePlayer();
    const objSet = { puntosAcum: 0 };
    const objInc = {};
    player.researchConstrucction = makeResearch({ item: 'laser' });
    const result = uni._completeResearch(player, horaActual, objSet, objInc);
    expect(result).toBe(false);
  });

  test('done, energy → returns true', () => {
    const player = makePlayer();
    const objSet = { puntosAcum: 0 };
    const objInc = {};
    player.researchConstrucction = makeResearch({ item: 'energy' });
    expect(uni._completeResearch(player, horaActual, objSet, objInc)).toBe(true);
  });

  test('done, plasma → returns true', () => {
    const player = makePlayer();
    const objSet = { puntosAcum: 0 };
    const objInc = {};
    player.researchConstrucction = makeResearch({ item: 'plasma' });
    expect(uni._completeResearch(player, horaActual, objSet, objInc)).toBe(true);
  });

  test('done → marks construction inactive and increments research', () => {
    const player = makePlayer();
    const objSet = { puntosAcum: 0 };
    const objInc = {};
    player.researchConstrucction = makeResearch({ item: 'laser', metal: 200, crystal: 100, deuterium: 50 });
    uni._completeResearch(player, horaActual, objSet, objInc);
    expect(objSet['researchConstrucction']).toEqual({ active: false });
    expect(objSet['puntosAcum']).toBe(350);
    expect(objInc['research.laser']).toBe(1);
    expect(player.research.laser).toBe(1);
  });

  test('done, espionage → increments allCord espionage for each planet', () => {
    const player = makePlayer({
      planets: [
        makePlanet({ coordinates: { gal: 1, sys: 1, pos: 3 } }),
        makePlanet({ coordinates: { gal: 1, sys: 2, pos: 5 } }),
      ]
    });
    uni.allCord = {
      '1_1_3': { espionage: 2, playerName: 'TestPlayer' },
      '1_2_5': { espionage: 1, playerName: 'TestPlayer' },
    };
    const objSet = { puntosAcum: 0 };
    const objInc = {};
    player.researchConstrucction = makeResearch({ item: 'espionage' });
    uni._completeResearch(player, horaActual, objSet, objInc);
    expect(uni.allCord['1_1_3'].espionage).toBe(3);
    expect(uni.allCord['1_2_5'].espionage).toBe(2);
  });
});

// ─── _completePlanetBuilding ──────────────────────────────────────────────────
describe('_completePlanetBuilding', () => {
  const horaActual = 1000000;

  function makeBuildingConstruction(overrides = {}) {
    return {
      active: true,
      item: 'metalMine',
      init: horaActual - 200000,
      time: 100,
      metal: 60,
      crystal: 15,
      deuterium: 0,
      ...overrides
    };
  }

  test('not active → returns false', () => {
    const player = makePlayer();
    player.planets[0].buildingConstrucction = { active: false };
    const objSet = { puntosAcum: 0 };
    const objInc = {};
    expect(uni._completePlanetBuilding(player, 0, horaActual, objSet, objInc)).toBe(false);
  });

  test('not done yet → returns false', () => {
    const player = makePlayer();
    player.planets[0].buildingConstrucction = makeBuildingConstruction({ init: horaActual, time: 500 });
    const objSet = { puntosAcum: 0 };
    const objInc = {};
    expect(uni._completePlanetBuilding(player, 0, horaActual, objSet, objInc)).toBe(false);
  });

  test('done → returns true and updates objSet/objInc', () => {
    const player = makePlayer();
    player.planets[0].buildingConstrucction = makeBuildingConstruction({ metal: 60, crystal: 15, deuterium: 0 });
    const objSet = { puntosAcum: 0 };
    const objInc = {};
    const result = uni._completePlanetBuilding(player, 0, horaActual, objSet, objInc);
    expect(result).toBe(true);
    expect(objSet['planets.0.buildingConstrucction']).toEqual({ active: false });
    expect(objSet['puntosAcum']).toBe(75);
    expect(objInc['planets.0.campos']).toBe(1);
    expect(objInc['planets.0.buildings.metalMine']).toBe(1);
    expect(player.planets[0].buildings.metalMine).toBe(1);
  });

  test('terraformer adds camposMax increment', () => {
    const player = makePlayer();
    player.planets[0].buildingConstrucction = makeBuildingConstruction({ item: 'terraformer' });
    const objSet = { puntosAcum: 0 };
    const objInc = {};
    uni._completePlanetBuilding(player, 0, horaActual, objSet, objInc);
    expect(objInc['planets.0.camposMax']).toBe(5);
  });

  test('non-terraformer does NOT add camposMax', () => {
    const player = makePlayer();
    player.planets[0].buildingConstrucction = makeBuildingConstruction({ item: 'solarPlant' });
    const objSet = { puntosAcum: 0 };
    const objInc = {};
    uni._completePlanetBuilding(player, 0, horaActual, objSet, objInc);
    expect(objInc['planets.0.camposMax']).toBeUndefined();
  });
});

// ─── _completeMoonBuilding ───────────────────────────────────────────────────
describe('_completeMoonBuilding', () => {
  const horaActual = 1000000;

  test('moon not active → does nothing', () => {
    const player = makePlayer();
    const objSet = { puntosAcum: 0 };
    const objInc = {};
    uni._completeMoonBuilding(player, 0, horaActual, objSet, objInc);
    expect(Object.keys(objSet)).toHaveLength(1); // only puntosAcum unchanged
    expect(Object.keys(objInc)).toHaveLength(0);
  });

  test('moon active but no construction → does nothing', () => {
    const player = makePlayer();
    player.planets[0].moon = {
      active: true, buildings: fun.zeroBuildingsMoon(),
      buildingConstrucction: { active: false }
    };
    const objSet = { puntosAcum: 0 };
    const objInc = {};
    uni._completeMoonBuilding(player, 0, horaActual, objSet, objInc);
    expect(objInc['planets.0.moon.campos']).toBeUndefined();
  });

  test('done → updates objSet/objInc and increments building', () => {
    const player = makePlayer();
    player.planets[0].moon = {
      active: true,
      buildings: { ...fun.zeroBuildingsMoon() },
      buildingConstrucction: {
        active: true, item: 'phalanx', init: horaActual - 200000, time: 100,
        metal: 20000, crystal: 40000, deuterium: 20000
      }
    };
    const objSet = { puntosAcum: 0 };
    const objInc = {};
    uni._completeMoonBuilding(player, 0, horaActual, objSet, objInc);
    expect(objSet['planets.0.moon.buildingConstrucction']).toEqual({ active: false });
    expect(objSet['puntosAcum']).toBe(80000);
    expect(objInc['planets.0.moon.campos']).toBe(1);
    expect(objInc['planets.0.moon.buildings.phalanx']).toBe(1);
    expect(player.planets[0].moon.buildings.phalanx).toBe(1);
  });

  test('lunarBase → also adds camposMax', () => {
    const player = makePlayer();
    player.planets[0].moon = {
      active: true, buildings: { ...fun.zeroBuildingsMoon() },
      buildingConstrucction: {
        active: true, item: 'lunarBase', init: horaActual - 200000, time: 100,
        metal: 10000, crystal: 20000, deuterium: 10000
      }
    };
    const objSet = { puntosAcum: 0 };
    const objInc = {};
    uni._completeMoonBuilding(player, 0, horaActual, objSet, objInc);
    expect(objInc['planets.0.moon.camposMax']).toBe(3);
  });
});

// ─── _processReturningFleet ───────────────────────────────────────────────────
describe('_processReturningFleet', () => {
  test('planet not found → does nothing', () => {
    const player = makePlayer();
    const movement = {
      coorDesde: { gal: 9, sys: 9, pos: 9 },
      moon: false,
      resources: { metal: 100, crystal: 50, deuterium: 0 },
      ships: { lightFighter: 2 }
    };
    const objInc = {};
    uni._processReturningFleet(player, movement, objInc);
    expect(Object.keys(objInc)).toHaveLength(0);
  });

  test('planet found, no moon → adds resources and ships to planet path', () => {
    const player = makePlayer();
    player.planets[0].coordinates = { gal: 1, sys: 1, pos: 3 };
    const movement = {
      coorDesde: { gal: 1, sys: 1, pos: 3 },
      moon: false,
      resources: { metal: 500, crystal: 300, deuterium: 100 },
      ships: { lightFighter: 3, cruiser: 1 }
    };
    const objInc = {};
    uni._processReturningFleet(player, movement, objInc);
    expect(objInc['planets.0.resources.metal']).toBe(500);
    expect(objInc['planets.0.resources.crystal']).toBe(300);
    expect(objInc['planets.0.resources.deuterium']).toBe(100);
    expect(objInc['planets.0.fleet.lightFighter']).toBe(3);
    expect(objInc['planets.0.fleet.cruiser']).toBe(1);
  });

  test('moon departure → uses moon path', () => {
    const player = makePlayer();
    player.planets[0].coordinates = { gal: 1, sys: 1, pos: 3 };
    player.planets[0].moon = { active: true };
    const movement = {
      coorDesde: { gal: 1, sys: 1, pos: 3 },
      moon: true,
      resources: { metal: 100, crystal: 0, deuterium: 0 },
      ships: { lightFighter: 1 }
    };
    const objInc = {};
    uni._processReturningFleet(player, movement, objInc);
    expect(objInc['planets.0.moon.resources.metal']).toBe(100);
    expect(objInc['planets.0.moon.fleet.lightFighter']).toBe(1);
  });

  test('misil key is skipped for resources', () => {
    const player = makePlayer();
    player.planets[0].coordinates = { gal: 1, sys: 1, pos: 3 };
    const movement = {
      coorDesde: { gal: 1, sys: 1, pos: 3 },
      moon: false,
      resources: { metal: 100, crystal: 0, deuterium: 0, misil: 5 },
      ships: {}
    };
    const objInc = {};
    uni._processReturningFleet(player, movement, objInc);
    expect(objInc['planets.0.resources.misil']).toBeUndefined();
    expect(objInc['planets.0.resources.metal']).toBe(100);
  });
});

// ─── _processShipQueue ────────────────────────────────────────────────────────
describe('_processShipQueue', () => {
  function makeQueueItem(overrides = {}) {
    return {
      new: false,
      item: 'lightFighter',
      def: false,
      cant: 3,
      time: 100,
      timeNow: 50,
      metal: 9000,   crystal: 3000,  deuterium: 0,
      metalOne: 3000, crystalOne: 1000, deuteriumOne: 0,
      ...overrides
    };
  }

  test('empty queue → empty listShip', () => {
    const player = makePlayer();
    player.planets[0].shipConstrucction = [];
    const result = uni._processShipQueue(player, 0, 60000, { puntosAcum: 0 }, {});
    expect(result).toEqual({ listShip: [], solarSatelliteBuilt: false });
  });

  test('new item → marks not new, returns queue unchanged', () => {
    const player = makePlayer();
    const item = makeQueueItem({ new: true });
    player.planets[0].shipConstrucction = [item];
    const result = uni._processShipQueue(player, 0, 60000, { puntosAcum: 0 }, {});
    expect(result.listShip[0].new).toBe(false);
    expect(result.solarSatelliteBuilt).toBe(false);
  });

  test('not enough time → reduces timeNow', () => {
    const player = makePlayer();
    const item = makeQueueItem({ timeNow: 200 });
    player.planets[0].shipConstrucction = [item];
    const objSet = { puntosAcum: 0 };
    const objInc = {};
    // timeLastUpdate = 50000ms = 50s → timeLeft = 50 - 200 = -150
    uni._processShipQueue(player, 0, 50000, objSet, objInc);
    expect(item.timeNow).toBe(150); // 200 - 50 = 150
  });

  test('enough time → builds ships and updates objInc', () => {
    const player = makePlayer();
    // timeNow=10, each ship takes 100s. timeLastUpdate=60s → timeLeft=50
    // Builds 1 ship (the current one), then 0 more (50s < 100s per ship)
    const item = makeQueueItem({ timeNow: 10, time: 100, cant: 3 });
    player.planets[0].shipConstrucction = [item];
    const objSet = { puntosAcum: 0 };
    const objInc = {};
    const result = uni._processShipQueue(player, 0, 60000, objSet, objInc);
    expect(objInc['planets.0.fleet.lightFighter']).toBeGreaterThanOrEqual(1);
    expect(result.listShip.length).toBeGreaterThan(0);
    expect(result.listShip[0].cant).toBeLessThan(3);
  });

  test('solarSatellite built → solarSatelliteBuilt = true', () => {
    const player = makePlayer();
    const item = makeQueueItem({ item: 'solarSatellite', timeNow: 1, time: 100, cant: 2 });
    player.planets[0].shipConstrucction = [item];
    const result = uni._processShipQueue(player, 0, 60000, { puntosAcum: 0 }, {});
    expect(result.solarSatelliteBuilt).toBe(true);
  });

  test('defense item uses .defense. path', () => {
    const player = makePlayer();
    const item = makeQueueItem({ item: 'rocketLauncher', def: true, timeNow: 1 });
    player.planets[0].shipConstrucction = [item];
    const objInc = {};
    uni._processShipQueue(player, 0, 60000, { puntosAcum: 0 }, objInc);
    expect(objInc['planets.0.defense.rocketLauncher']).toBeGreaterThanOrEqual(1);
  });

  test('queue exhausted → listShip is empty', () => {
    const player = makePlayer();
    // 1 ship, takes 1s, give it 100s → builds all 1, queue empty
    const item = makeQueueItem({ cant: 1, timeNow: 1, time: 1, metal: 3000, crystal: 1000, deuterium: 0 });
    player.planets[0].shipConstrucction = [item];
    const result = uni._processShipQueue(player, 0, 100000, { puntosAcum: 0 }, {});
    expect(result.listShip).toHaveLength(0);
  });
});

// ─── recicleDebris ────────────────────────────────────────────────────────────
describe('recicleDebris', () => {
  function makeMovement(recyclers, cargo = {}) {
    const ships = { ...fun.zeroShips(), recycler: recyclers };
    return {
      ships,
      resources: { metal: cargo.metal || 0, crystal: cargo.crystal || 0, deuterium: cargo.deuterium || 0 },
      time: 1000,
      llegada: 2000
    };
  }

  test('inactive debris → returns undefined', () => {
    const result = uni.recicleDebris('p', { active: false, metal: 100, crystal: 50 }, makeMovement(1));
    expect(result).toBeUndefined();
  });

  test('active debris, fits in hold → clears it', () => {
    const debris = { active: true, metal: 100, crystal: 50 };
    const movement = makeMovement(5);
    const result = uni.recicleDebris('p', debris, movement);
    expect(result.metal).toBe(0);
    expect(result.crystal).toBe(0);
    expect(result.active).toBe(false);
  });

  test('active debris, larger than hold → partial collection', () => {
    // recycler capacity = 20000*1 = 20000
    const debris = { active: true, metal: 50000, crystal: 30000 };
    const movement = makeMovement(1);
    const result = uni.recicleDebris('p', debris, movement);
    // collected metal = 20000 (cap), crystal = 0
    expect(result.metal).toBe(30000);  // 50000 - 20000
    expect(result.active).toBe(true);  // still has stuff
  });

  test('calls base.addMovementResources with correct player', () => {
    const debris   = { active: true, metal: 100, crystal: 50 };
    const movement = makeMovement(1);
    uni.recicleDebris('PlayerA', debris, movement, movement.time, movement.llegada);
    expect(base.addMovementResources).toHaveBeenCalledWith('PlayerA', movement.time, movement.llegada, expect.any(Number), expect.any(Number));
  });
});

// ─── colonize ────────────────────────────────────────────────────────────────
describe('colonize', () => {
  function makeColonizePlayer(astrophysics = 10, numPlanets = 1) {
    const planets = [];
    for (let i = 0; i < numPlanets; i++) {
      planets.push(makePlanet({ coordinates: { gal: 1, sys: 1, pos: i + 1 } }));
    }
    return makePlayer({ research: { ...fun.zeroResearch(), astrophysics } , planets });
  }

  beforeEach(() => {
    uni.allCord = {};
  });

  test('pos 3 requires astrophysics >= 4', () => {
    const player = makeColonizePlayer(3);
    expect(uni.colonize({ gal: 1, sys: 1, pos: 3 }, player)).toBe(false);
    const player2 = makeColonizePlayer(4);
    uni.allCord = {};
    expect(uni.colonize({ gal: 1, sys: 1, pos: 3 }, player2)).toBe(true);
  });

  test('pos 2 requires astrophysics >= 6', () => {
    const player = makeColonizePlayer(5);
    expect(uni.colonize({ gal: 1, sys: 1, pos: 2 }, player)).toBe(false);
    const player2 = makeColonizePlayer(6);
    uni.allCord = {};
    expect(uni.colonize({ gal: 1, sys: 1, pos: 2 }, player2)).toBe(true);
  });

  test('pos 1 requires astrophysics >= 8', () => {
    const player = makeColonizePlayer(7);
    expect(uni.colonize({ gal: 1, sys: 1, pos: 1 }, player)).toBe(false);
  });

  test('already colonized → false', () => {
    const player = makeColonizePlayer(10);
    const cord = { gal: 2, sys: 3, pos: 7 };
    uni.allCord['2_3_7'] = { playerName: 'someone' };
    expect(uni.colonize(cord, player)).toBe(false);
  });

  test('too many planets → false', () => {
    // ceil(astrophysics/2)+1 > planets.length required
    // astrophysics=2: ceil(2/2)+1=2 > 1 (ok). With 8 planets → maxed out at 8
    const player = makeColonizePlayer(10, 8);
    expect(uni.colonize({ gal: 2, sys: 3, pos: 7 }, player)).toBe(false);
  });

  test('valid colonization → calls base.savePlayerData', () => {
    const player = makeColonizePlayer(10, 1);
    const cord = { gal: 2, sys: 3, pos: 7 };
    uni.colonize(cord, player);
    expect(base.savePlayerData).toHaveBeenCalled();
  });

  test('valid colonization → returns true', () => {
    const player = makeColonizePlayer(10, 1);
    const cord = { gal: 2, sys: 3, pos: 7 };
    expect(uni.colonize(cord, player)).toBe(true);
  });
});
