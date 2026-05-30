jest.mock('../../routes/data_base', () => ({ savePlayerData: jest.fn() }));
jest.mock('../../routes/battle',    () => ({ battle: jest.fn() }));

const {
  runBot,
  _isInSchedulerWindow,
  _msUntilNextWindow,
  _missionDone,
  _inProgressUntil,
  _anyConstructionActive,
  _resourcesEnough,
  _msUntilResources,
  _getBestResearchPlanet,
  _checkEnergy,
  _checkSmartStorage,
  _checkFieldSmart,
  _buildShipRatio,
  _runResearchMission,
  _runPlanetMission,
  _schedulerActiveMs,
  _tickAttackTimer,
  _tryColonize,
  _joinFleet,
} = require('../../routes/bots/bot_logic');

const NOW = 1_700_000_000_000;
const FALLBACK_RETRY_MS = 30 * 60 * 1000;

// ─── helpers ──────────────────────────────────────────────────────────────────

function makePlanet(overrides = {}) {
  return {
    coordinates:           { gal: 1, sys: 100, pos: 8 },
    buildings:             {},
    fleet:                 {},
    defense:               {},
    shipConstrucction:     [],
    buildingConstrucction: { active: false },
    moon:                  { active: false, buildingConstrucction: { active: false } },
    resources:             { metal: 10000, crystal: 5000, deuterium: 2000, energy: 100 },
    resourcesAdd:          { metal: 100, crystal: 50, deuterium: 25, energy: 0 },
    temperature:           { max: 40, min: 20 },
    campos:                40,
    camposMax:             50,
    debris:                { active: false },
    ...overrides,
  };
}

function makePlayer(overrides = {}) {
  return {
    name:                  'testBot',
    botType:               'miner',
    puntos:                1000,
    lastVisit:             0,
    research:              { computer: 1, astrophysics: 0 },
    researchConstrucction: { active: false },
    planets:               [makePlanet()],
    movement:              [],
    bot: {
      scheduler:        null,
      missionList:      [],
      planetProgress:   { 0: 0 },
      research:         { currentMission: 0, list: [] },
      attackConfig:     { enabled: false },
      almacenSmart:     false,
      fieldSmart:       false,
      joinFleet:        false,
      probMoveResources: 0,
    },
    ...overrides,
  };
}

function makeEvents() {
  return { addElement: jest.fn() };
}

function makeUni(overrides = {}) {
  return {
    proccesBuildRequest:    jest.fn(),
    proccesResearchRequest: jest.fn(),
    proccesShipyardRequest: jest.fn(),
    proccesMoonRequest:     jest.fn(),
    addFleetMovement:       jest.fn(),
    costBuildings:          jest.fn(() => ({})),
    costResearch:           jest.fn(() => ({})),
    costShipyard:           jest.fn(() => ({})),
    costDefense:            jest.fn(() => ({})),
    costMoon:               jest.fn(() => ({})),
    getAlmacen:             jest.fn(() => ({ metal: 0, crystal: 0, deuterium: 0 })),
    allCord:                {},
    base:                   { findAndExecuteByName: jest.fn() },
    universo:               { maxGalaxies: 9 },
    ...overrides,
  };
}

// ─── _isInSchedulerWindow ──────────────────────────────────────────────────────

describe('_isInSchedulerWindow', () => {
  test('no scheduler → always true', () => {
    expect(_isInSchedulerWindow(null,      NOW)).toBe(true);
    expect(_isInSchedulerWindow(undefined, NOW)).toBe(true);
  });

  test('hour inside window → true', () => {
    const t = new Date(2024, 0, 15, 14, 0, 0).getTime(); // 14:00
    expect(_isInSchedulerWindow([{ start: 8, end: 20 }], t)).toBe(true);
  });

  test('hour outside window → false', () => {
    const t = new Date(2024, 0, 15, 5, 0, 0).getTime(); // 5:00
    expect(_isInSchedulerWindow([{ start: 8, end: 20 }], t)).toBe(false);
  });

  test('multiple windows, hour in second one → true', () => {
    const t = new Date(2024, 0, 15, 22, 0, 0).getTime(); // 22:00
    expect(_isInSchedulerWindow([{ start: 8, end: 12 }, { start: 20, end: 24 }], t)).toBe(true);
  });

  test('at exact window start → true', () => {
    const t = new Date(2024, 0, 15, 8, 0, 0).getTime();
    expect(_isInSchedulerWindow([{ start: 8, end: 20 }], t)).toBe(true);
  });

  test('at exact window end → false (end exclusive)', () => {
    const t = new Date(2024, 0, 15, 20, 0, 0).getTime();
    expect(_isInSchedulerWindow([{ start: 8, end: 20 }], t)).toBe(false);
  });
});

// ─── _msUntilNextWindow ────────────────────────────────────────────────────────

describe('_msUntilNextWindow', () => {
  test('window starts later today → correct ms (no fractional minutes)', () => {
    const t  = new Date(2024, 0, 15, 6, 0, 0).getTime(); // 6:00 sharp
    const ms = _msUntilNextWindow([{ start: 8, end: 20 }], t);
    expect(ms).toBe(2 * 3600000); // 2 h
  });

  test('window already passed today → wraps to next day', () => {
    const t  = new Date(2024, 0, 15, 22, 0, 0).getTime(); // 22:00
    const ms = _msUntilNextWindow([{ start: 8, end: 12 }], t);
    expect(ms).toBe(10 * 3600000); // 10 h until 8:00
  });

  test('empty scheduler → fallback 3600000', () => {
    const t  = new Date(2024, 0, 15, 12, 0, 0).getTime();
    const ms = _msUntilNextWindow([], t);
    expect(ms).toBe(3600000);
  });
});

// ─── _missionDone ──────────────────────────────────────────────────────────────

describe('_missionDone', () => {
  test('building: level reached → true', () => {
    const p = makePlayer({ planets: [makePlanet({ buildings: { metalMine: 5 } })] });
    expect(_missionDone({ type: 'building', item: 'metalMine', level: 5 }, p, 0)).toBe(true);
  });

  test('building: level not reached → false', () => {
    const p = makePlayer({ planets: [makePlanet({ buildings: { metalMine: 4 } })] });
    expect(_missionDone({ type: 'building', item: 'metalMine', level: 5 }, p, 0)).toBe(false);
  });

  test('fleet: amount reached → true', () => {
    const p = makePlayer({ planets: [makePlanet({ fleet: { smallCargo: 10 } })] });
    expect(_missionDone({ type: 'fleet', item: 'smallCargo', amount: 10 }, p, 0)).toBe(true);
  });

  test('fleet: amount not reached → false', () => {
    const p = makePlayer({ planets: [makePlanet({ fleet: { smallCargo: 9 } })] });
    expect(_missionDone({ type: 'fleet', item: 'smallCargo', amount: 10 }, p, 0)).toBe(false);
  });

  test('defense: amount reached → true', () => {
    const p = makePlayer({ planets: [makePlanet({ defense: { rocketLauncher: 5 } })] });
    expect(_missionDone({ type: 'defense', item: 'rocketLauncher', amount: 5 }, p, 0)).toBe(true);
  });

  test('defense: amount not reached → false', () => {
    const p = makePlayer({ planets: [makePlanet({ defense: { rocketLauncher: 4 } })] });
    expect(_missionDone({ type: 'defense', item: 'rocketLauncher', amount: 5 }, p, 0)).toBe(false);
  });

  test('research: level reached → true', () => {
    const p = makePlayer({ research: { energy: 3 } });
    expect(_missionDone({ type: 'research', item: 'energy', level: 3 }, p, 0)).toBe(true);
  });

  test('research: level not reached → false', () => {
    const p = makePlayer({ research: { energy: 2 } });
    expect(_missionDone({ type: 'research', item: 'energy', level: 3 }, p, 0)).toBe(false);
  });

  test('moon: all other planets have active moon → true', () => {
    const p = makePlayer({
      planets: [
        makePlanet(),
        makePlanet({ moon: { active: true } }),
      ]
    });
    expect(_missionDone({ type: 'moon' }, p, 0)).toBe(true);
  });

  test('moon: a planet lacks moon → false', () => {
    const p = makePlayer({
      planets: [
        makePlanet(),
        makePlanet({ moon: { active: false } }),
      ]
    });
    expect(_missionDone({ type: 'moon' }, p, 0)).toBe(false);
  });

  test('moonBuilding: no moon present → true (skip)', () => {
    const p = makePlayer({ planets: [makePlanet({ moon: { active: false } })] });
    expect(_missionDone({ type: 'moonBuilding', item: 'lunarBase', level: 1 }, p, 0)).toBe(true);
  });

  test('moonBuilding: moon has building at required level → true', () => {
    const p = makePlayer({
      planets: [makePlanet({
        moon: {
          active: true,
          buildings:             { lunarBase: 1 },
          resources:             { metal: 0, crystal: 0, deuterium: 0 },
          buildingConstrucction: { active: false },
        }
      })]
    });
    expect(_missionDone({ type: 'moonBuilding', item: 'lunarBase', level: 1 }, p, 0)).toBe(true);
  });

  test('moonBuilding: moon building below required level → false', () => {
    const p = makePlayer({
      planets: [makePlanet({
        moon: {
          active: true,
          buildings:             { lunarBase: 0 },
          resources:             { metal: 0, crystal: 0, deuterium: 0 },
          buildingConstrucction: { active: false },
        }
      })]
    });
    expect(_missionDone({ type: 'moonBuilding', item: 'lunarBase', level: 1 }, p, 0)).toBe(false);
  });

  test('invalid planet index → true', () => {
    const p = makePlayer({ planets: [] });
    expect(_missionDone({ type: 'building', item: 'metalMine', level: 1 }, p, 0)).toBe(true);
  });

  test('unknown type → true', () => {
    const p = makePlayer();
    expect(_missionDone({ type: 'unknown' }, p, 0)).toBe(true);
  });
});

// ─── _inProgressUntil ────────────────────────────────────────────────────────

describe('_inProgressUntil', () => {
  beforeEach(() => jest.useFakeTimers());
  afterEach(() => jest.useRealTimers());

  test('building active, same item → finish time', () => {
    const p = makePlayer({
      planets: [makePlanet({
        buildingConstrucction: { active: true, item: 'metalMine', init: NOW, time: 60 }
      })]
    });
    expect(_inProgressUntil({ type: 'building', item: 'metalMine' }, p, 0)).toBe(NOW + 60000);
  });

  test('building active, different item → 0', () => {
    const p = makePlayer({
      planets: [makePlanet({
        buildingConstrucction: { active: true, item: 'solarPlant', init: NOW, time: 60 }
      })]
    });
    expect(_inProgressUntil({ type: 'building', item: 'metalMine' }, p, 0)).toBe(0);
  });

  test('building inactive → 0', () => {
    const p = makePlayer({
      planets: [makePlanet({
        buildingConstrucction: { active: false, item: 'metalMine', init: NOW, time: 60 }
      })]
    });
    expect(_inProgressUntil({ type: 'building', item: 'metalMine' }, p, 0)).toBe(0);
  });

  test('research active, same item → finish time', () => {
    const p = makePlayer({
      researchConstrucction: { active: true, item: 'energy', init: NOW, time: 120 }
    });
    expect(_inProgressUntil({ type: 'research', item: 'energy' }, p, 0)).toBe(NOW + 120000);
  });

  test('research active, different item → 0', () => {
    const p = makePlayer({
      researchConstrucction: { active: true, item: 'laser', init: NOW, time: 120 }
    });
    expect(_inProgressUntil({ type: 'research', item: 'energy' }, p, 0)).toBe(0);
  });

  test('fleet item in ship queue → Date.now() + timeNow * 1000', () => {
    jest.setSystemTime(NOW);
    const p = makePlayer({
      planets: [makePlanet({
        fleet:             { smallCargo: 0 },
        shipConstrucction: [{ item: 'smallCargo', cant: 5, timeNow: 300 }]
      })]
    });
    expect(_inProgressUntil({ type: 'fleet', item: 'smallCargo' }, p, 0)).toBe(NOW + 300000);
  });

  test('fleet item not in queue → 0', () => {
    const p = makePlayer();
    expect(_inProgressUntil({ type: 'fleet', item: 'smallCargo' }, p, 0)).toBe(0);
  });

  test('moonBuilding active, same item → finish time', () => {
    const p = makePlayer({
      planets: [makePlanet({
        moon: {
          active: true,
          buildingConstrucction: { active: true, item: 'lunarBase', init: NOW, time: 300 }
        }
      })]
    });
    expect(_inProgressUntil({ type: 'moonBuilding', item: 'lunarBase' }, p, 0)).toBe(NOW + 300000);
  });

  test('invalid planet → 0', () => {
    const p = makePlayer({ planets: [] });
    expect(_inProgressUntil({ type: 'building', item: 'metalMine' }, p, 0)).toBe(0);
  });
});

// ─── _anyConstructionActive ──────────────────────────────────────────────────

describe('_anyConstructionActive', () => {
  test('no active construction → false', () => {
    expect(_anyConstructionActive(makePlayer(), 0)).toBe(false);
  });

  test('active construction → true', () => {
    const p = makePlayer({
      planets: [makePlanet({
        buildingConstrucction: { active: true, item: 'metalMine', init: NOW, time: 60 }
      })]
    });
    expect(_anyConstructionActive(p, 0)).toBe(true);
  });

  test('invalid planet → false', () => {
    expect(_anyConstructionActive(makePlayer({ planets: [] }), 0)).toBe(false);
  });
});

// ─── _resourcesEnough ────────────────────────────────────────────────────────

describe('_resourcesEnough', () => {
  const res = { metal: 100, crystal: 50, deuterium: 20 };

  test('exact match → true', () => {
    expect(_resourcesEnough(res, 100, 50, 20)).toBe(true);
  });

  test('more than needed → true', () => {
    expect(_resourcesEnough(res, 50, 20, 5)).toBe(true);
  });

  test('metal short → false', () => {
    expect(_resourcesEnough(res, 101, 50, 20)).toBe(false);
  });

  test('crystal short → false', () => {
    expect(_resourcesEnough(res, 100, 51, 20)).toBe(false);
  });

  test('deuterium short → false', () => {
    expect(_resourcesEnough(res, 100, 50, 21)).toBe(false);
  });
});

// ─── _msUntilResources ───────────────────────────────────────────────────────

describe('_msUntilResources', () => {
  test('already have enough → 0', () => {
    const ms = _msUntilResources(
      { metal: 100, crystal: 50, deuterium: 20 },
      { metal: 10, crystal: 5, deuterium: 2 },
      100, 50, 20
    );
    expect(ms).toBe(0);
  });

  test('zero production → FALLBACK_RETRY_MS', () => {
    const ms = _msUntilResources(
      { metal: 0, crystal: 0, deuterium: 0 },
      { metal: 0, crystal: 0, deuterium: 0 },
      100, 50, 20
    );
    expect(ms).toBe(FALLBACK_RETRY_MS);
  });

  test('need only metal, steady production → correct ms', () => {
    // need 100 metal @ 100/h → 1 h = 3600000 ms
    const ms = _msUntilResources(
      { metal: 0,   crystal: 9999, deuterium: 9999 },
      { metal: 100, crystal: 100,  deuterium: 100  },
      100, 0, 0
    );
    expect(ms).toBeCloseTo(3600000, -2);
  });

  test('bottleneck is slowest resource', () => {
    // need 200 metal (2h) and 300 crystal (3h) → 3h
    const ms = _msUntilResources(
      { metal: 0, crystal: 0,   deuterium: 9999 },
      { metal: 100, crystal: 100, deuterium: 100 },
      200, 300, 0
    );
    expect(ms).toBeCloseTo(3 * 3600000, -2);
  });
});

// ─── _getBestResearchPlanet ──────────────────────────────────────────────────

describe('_getBestResearchPlanet', () => {
  test('single planet → 0', () => {
    const p = makePlayer({ planets: [makePlanet({ buildings: { researchLab: 3 } })] });
    expect(_getBestResearchPlanet(p)).toBe(0);
  });

  test('second planet has higher lab → 1', () => {
    const p = makePlayer({
      planets: [
        makePlanet({ buildings: { researchLab: 3 } }),
        makePlanet({ buildings: { researchLab: 5 } }),
      ]
    });
    expect(_getBestResearchPlanet(p)).toBe(1);
  });

  test('first planet has higher lab → 0', () => {
    const p = makePlayer({
      planets: [
        makePlanet({ buildings: { researchLab: 7 } }),
        makePlanet({ buildings: { researchLab: 5 } }),
      ]
    });
    expect(_getBestResearchPlanet(p)).toBe(0);
  });

  test('no lab on any planet → 0 (first wins tie)', () => {
    expect(_getBestResearchPlanet(makePlayer())).toBe(0);
  });
});

// ─── _checkEnergy ────────────────────────────────────────────────────────────

describe('_checkEnergy', () => {
  beforeEach(() => jest.useFakeTimers());
  afterEach(() => jest.useRealTimers());

  test('energy >= 0 → false', () => {
    const p = makePlayer({ planets: [makePlanet({ resources: { metal: 1000, crystal: 500, deuterium: 200, energy: 0 } })] });
    expect(_checkEnergy(p, 0, makeUni(), makeEvents())).toBe(false);
  });

  test('sats already in queue → adds completion event, returns true', () => {
    jest.setSystemTime(NOW);
    const p = makePlayer({
      planets: [makePlanet({
        resources:         { metal: 1000, crystal: 500, deuterium: 200, energy: -10 },
        shipConstrucction: [{ item: 'solarSatellite', cant: 5, timeNow: 120 }]
      })]
    });
    const events = makeEvents();
    expect(_checkEnergy(p, 0, makeUni(), events)).toBe(true);
    expect(events.addElement).toHaveBeenCalledWith({ time: NOW + 120000, player: 'testBot' });
  });

  test('energy deficit, no queue, can afford sats → builds them', () => {
    jest.setSystemTime(NOW);
    const p = makePlayer({
      planets: [makePlanet({
        resources:    { metal: 10000, crystal: 5000, deuterium: 200, energy: -5 },
        temperature:  { max: 80, min: 40 },
      })]
    });
    const uni = makeUni({
      costShipyard: jest.fn(() => ({ solarSatellite: { metal: 100, crystal: 50, deuterium: 0 } })),
    });
    const events = makeEvents();
    expect(_checkEnergy(p, 0, uni, events)).toBe(true);
    expect(uni.proccesShipyardRequest).toHaveBeenCalled();
  });

  test('energy deficit, cannot afford sats → returns false', () => {
    jest.setSystemTime(NOW);
    const p = makePlayer({
      planets: [makePlanet({
        resources:    { metal: 0, crystal: 0, deuterium: 0, energy: -5 },
        temperature:  { max: 80, min: 40 },
      })]
    });
    const uni = makeUni({
      costShipyard: jest.fn(() => ({ solarSatellite: { metal: 1000, crystal: 500, deuterium: 0 } })),
    });
    expect(_checkEnergy(p, 0, uni, makeEvents())).toBe(false);
  });

  test('no sat cost returned → false', () => {
    jest.setSystemTime(NOW);
    const p = makePlayer({
      planets: [makePlanet({ resources: { metal: 9999, crystal: 9999, deuterium: 9999, energy: -1 } })]
    });
    const uni = makeUni({ costShipyard: jest.fn(() => ({})) }); // no solarSatellite key
    expect(_checkEnergy(p, 0, uni, makeEvents())).toBe(false);
  });
});

// ─── _checkSmartStorage ──────────────────────────────────────────────────────

describe('_checkSmartStorage', () => {
  test('all resources below 90% capacity → false', () => {
    const p = makePlayer({
      planets: [makePlanet({ resources: { metal: 500, crystal: 500, deuterium: 500, energy: 0 } })]
    });
    const uni = makeUni({
      getAlmacen: jest.fn(() => ({ metal: 10000, crystal: 10000, deuterium: 10000 })),
    });
    expect(_checkSmartStorage(p, 0, uni, makeEvents())).toBe(false);
  });

  test('active construction → false (skip)', () => {
    const p = makePlayer({
      planets: [makePlanet({
        buildingConstrucction: { active: true, item: 'metalMine', init: NOW, time: 60 },
        resources: { metal: 9500, crystal: 500, deuterium: 500, energy: 0 }
      })]
    });
    const uni = makeUni({
      getAlmacen: jest.fn(() => ({ metal: 10000, crystal: 10000, deuterium: 10000 })),
    });
    expect(_checkSmartStorage(p, 0, uni, makeEvents())).toBe(false);
  });

  test('metal at 95% capacity, can afford → builds metalStorage', () => {
    const p = makePlayer({
      planets: [makePlanet({ resources: { metal: 9500, crystal: 5000, deuterium: 2000, energy: 0 } })]
    });
    const uni = makeUni({
      getAlmacen:    jest.fn(() => ({ metal: 10000, crystal: 10000, deuterium: 10000 })),
      costBuildings: jest.fn(() => ({ metalStorage: { metal: 1000, crystal: 500, deuterium: 0 } })),
    });
    const events = makeEvents();
    expect(_checkSmartStorage(p, 0, uni, events)).toBe(true);
    expect(uni.proccesBuildRequest).toHaveBeenCalledWith(p, 0, 'metalStorage', expect.anything());
  });

  test('crystal at 95% capacity, can afford → builds crystalStorage', () => {
    const p = makePlayer({
      planets: [makePlanet({ resources: { metal: 10000, crystal: 9500, deuterium: 2000, energy: 0 } })]
    });
    const uni = makeUni({
      getAlmacen:    jest.fn(() => ({ metal: 10000, crystal: 10000, deuterium: 10000 })),
      costBuildings: jest.fn(() => ({ crystalStorage: { metal: 1000, crystal: 500, deuterium: 0 } })),
    });
    const events = makeEvents();
    expect(_checkSmartStorage(p, 0, uni, events)).toBe(true);
    expect(uni.proccesBuildRequest).toHaveBeenCalledWith(p, 0, 'crystalStorage', expect.anything());
  });

  test('metal over 90% but cannot afford storage → schedules wait', () => {
    jest.useFakeTimers();
    jest.setSystemTime(NOW);
    const p = makePlayer({
      planets: [makePlanet({
        resources:    { metal: 9500, crystal: 0, deuterium: 0, energy: 0 },
        resourcesAdd: { metal: 100, crystal: 50, deuterium: 25 }
      })]
    });
    const uni = makeUni({
      getAlmacen:    jest.fn(() => ({ metal: 10000, crystal: 10000, deuterium: 10000 })),
      costBuildings: jest.fn(() => ({ metalStorage: { metal: 50000, crystal: 500, deuterium: 0 } })),
    });
    const events = makeEvents();
    expect(_checkSmartStorage(p, 0, uni, events)).toBe(true);
    expect(uni.proccesBuildRequest).not.toHaveBeenCalled();
    expect(events.addElement).toHaveBeenCalled();
    jest.useRealTimers();
  });
});

// ─── _checkFieldSmart ────────────────────────────────────────────────────────

describe('_checkFieldSmart', () => {
  beforeEach(() => jest.useFakeTimers());
  afterEach(() => jest.useRealTimers());

  test('free fields available → false', () => {
    jest.setSystemTime(NOW);
    const p = makePlayer({ planets: [makePlanet({ campos: 40, camposMax: 50 })] });
    expect(_checkFieldSmart(p, 0, makeUni(), makeEvents())).toBe(false);
  });

  test('no free fields, construction active → schedules build-finish event', () => {
    jest.setSystemTime(NOW);
    const p = makePlayer({
      planets: [makePlanet({
        campos:                50,
        camposMax:             50,
        buildingConstrucction: { active: true, item: 'metalMine', init: NOW, time: 60 }
      })]
    });
    const events = makeEvents();
    expect(_checkFieldSmart(p, 0, makeUni(), events)).toBe(true);
    expect(events.addElement).toHaveBeenCalledWith({ time: NOW + 60000, player: 'testBot' });
  });

  test('no free fields, no terraformer tech → schedules fallback', () => {
    jest.setSystemTime(NOW);
    const p = makePlayer({ planets: [makePlanet({ campos: 50, camposMax: 50 })] });
    const uni = makeUni({
      costBuildings: jest.fn(() => ({ terraformer: { metal: 100, crystal: 50, deuterium: 0 } })), // no .tech
    });
    const events = makeEvents();
    expect(_checkFieldSmart(p, 0, uni, events)).toBe(true);
    expect(uni.proccesBuildRequest).not.toHaveBeenCalled();
    expect(events.addElement).toHaveBeenCalled();
  });

  test('no free fields, can afford terraformer → builds it', () => {
    jest.setSystemTime(NOW);
    const p = makePlayer({
      planets: [makePlanet({
        campos:    50,
        camposMax: 50,
        resources: { metal: 10000, crystal: 5000, deuterium: 1000, energy: 0 }
      })]
    });
    const uni = makeUni({
      costBuildings: jest.fn(() => ({ terraformer: { metal: 1000, crystal: 500, deuterium: 0, tech: true } })),
    });
    const events = makeEvents();
    expect(_checkFieldSmart(p, 0, uni, events)).toBe(true);
    expect(uni.proccesBuildRequest).toHaveBeenCalledWith(p, 0, 'terraformer', expect.anything());
  });

  test('no free fields, cannot afford terraformer → schedules resource wait', () => {
    jest.setSystemTime(NOW);
    const p = makePlayer({
      planets: [makePlanet({
        campos:       50,
        camposMax:    50,
        resources:    { metal: 0, crystal: 0, deuterium: 0, energy: 0 },
        resourcesAdd: { metal: 100, crystal: 50, deuterium: 25 }
      })]
    });
    const uni = makeUni({
      costBuildings: jest.fn(() => ({ terraformer: { metal: 10000, crystal: 5000, deuterium: 0, tech: true } })),
    });
    const events = makeEvents();
    expect(_checkFieldSmart(p, 0, uni, events)).toBe(true);
    expect(uni.proccesBuildRequest).not.toHaveBeenCalled();
    expect(events.addElement).toHaveBeenCalled();
  });
});

// ─── _buildShipRatio ─────────────────────────────────────────────────────────

describe('_buildShipRatio', () => {
  test('null shipRatio → false', () => {
    expect(_buildShipRatio(makePlayer(), 0, null, makeUni(), makeEvents())).toBe(false);
  });

  test('no deathstar, only per-DS ratios → false (target = 0)', () => {
    const p = makePlayer({ planets: [makePlanet({ fleet: { deathstar: 0 } })] });
    expect(_buildShipRatio(p, 0, { recycler: 5 }, makeUni(), makeEvents())).toBe(false);
  });

  test('has deathstar, worst ratio item → orders it', () => {
    const p = makePlayer({
      planets: [makePlanet({ fleet: { deathstar: 1, recycler: 0, espionageProbe: 10 } })]
    });
    const uni = makeUni();
    // recycler ratio 0/5=0, espionageProbe ratio 10/10=1 → recycler is worst
    const result = _buildShipRatio(p, 0, { deathstar: 1, recycler: 5, espionageProbe: 10 }, uni, makeEvents());
    expect(result).toBe(true);
    expect(uni.proccesShipyardRequest).toHaveBeenCalledWith(p, 0, 'recycler', expect.any(Number), expect.anything());
  });

  test('item already in queue → adds completion event', () => {
    jest.useFakeTimers();
    jest.setSystemTime(NOW);
    const p = makePlayer({
      planets: [makePlanet({
        fleet:             { deathstar: 1, recycler: 0 },
        shipConstrucction: [{ item: 'recycler', cant: 5, timeNow: 300 }]
      })]
    });
    const uni   = makeUni();
    const events = makeEvents();
    _buildShipRatio(p, 0, { deathstar: 1, recycler: 5 }, uni, events);
    expect(events.addElement).toHaveBeenCalledWith({ time: NOW + 300000, player: 'testBot' });
    jest.useRealTimers();
  });
});

// ─── _runResearchMission ─────────────────────────────────────────────────────

describe('_runResearchMission', () => {
  test('no research list → false', () => {
    expect(_runResearchMission(makePlayer(), makeUni(), makeEvents())).toBe(false);
  });

  test('all research missions done → false', () => {
    const p = makePlayer({
      research: { energy: 2 },
      bot: {
        ...makePlayer().bot,
        research: { currentMission: 0, list: [{ type: 'research', item: 'energy', level: 1 }] }
      }
    });
    expect(_runResearchMission(p, makeUni(), makeEvents())).toBe(false);
  });

  test('research in progress → adds event, returns true', () => {
    const p = makePlayer({
      researchConstrucction: { active: true, item: 'energy', init: NOW, time: 120 },
      bot: {
        ...makePlayer().bot,
        research: { currentMission: 0, list: [{ type: 'research', item: 'energy', level: 1 }] }
      }
    });
    const events = makeEvents();
    expect(_runResearchMission(p, makeUni(), events)).toBe(true);
    expect(events.addElement).toHaveBeenCalledWith({ time: NOW + 120000, player: 'testBot' });
  });

  test('can afford research → calls proccesResearchRequest', () => {
    const p = makePlayer({
      research: { energy: 0 },
      planets:  [makePlanet({
        buildings: { researchLab: 3 },
        resources: { metal: 10000, crystal: 5000, deuterium: 2000, energy: 0 }
      })],
      bot: {
        ...makePlayer().bot,
        research: { currentMission: 0, list: [{ type: 'research', item: 'energy', level: 1 }] }
      }
    });
    const uni = makeUni({
      costResearch: jest.fn(() => ({ energy: { metal: 100, crystal: 50, deuterium: 0 } })),
    });
    const events = makeEvents();
    expect(_runResearchMission(p, uni, events)).toBe(true);
    expect(uni.proccesResearchRequest).toHaveBeenCalled();
  });

  test('cannot afford → schedules resource wait, no research started', () => {
    jest.useFakeTimers();
    jest.setSystemTime(NOW);
    const p = makePlayer({
      research: { energy: 0 },
      planets:  [makePlanet({
        buildings:    { researchLab: 3 },
        resources:    { metal: 0, crystal: 0, deuterium: 0, energy: 0 },
        resourcesAdd: { metal: 100, crystal: 50, deuterium: 25 }
      })],
      bot: {
        ...makePlayer().bot,
        research: { currentMission: 0, list: [{ type: 'research', item: 'energy', level: 1 }] }
      }
    });
    const uni = makeUni({
      costResearch: jest.fn(() => ({ energy: { metal: 1000, crystal: 500, deuterium: 0 } })),
    });
    const events = makeEvents();
    expect(_runResearchMission(p, uni, events)).toBe(true);
    expect(uni.proccesResearchRequest).not.toHaveBeenCalled();
    expect(events.addElement).toHaveBeenCalled();
    jest.useRealTimers();
  });

  test('graviton: enough energy production → tries to execute', () => {
    jest.useFakeTimers();
    jest.setSystemTime(NOW);
    const energyCost = 300000; // 300000 * 2^0
    const p = makePlayer({
      research: { graviton: 0 },
      planets:  [makePlanet({
        buildings:    { researchLab: 5 },
        resources:    { metal: 9999, crystal: 9999, deuterium: 9999, energy: 0 },
        resourcesAdd: { metal: 100, crystal: 50, deuterium: 25, energy: energyCost + 1 }
      })],
      bot: {
        ...makePlayer().bot,
        research: { currentMission: 0, list: [{ type: 'research', item: 'graviton', level: 1 }] }
      }
    });
    const uni = makeUni({
      costResearch: jest.fn(() => ({ graviton: { metal: 0, crystal: 0, deuterium: 0 } })),
    });
    expect(_runResearchMission(p, uni, makeEvents())).toBe(true);
    expect(uni.proccesResearchRequest).toHaveBeenCalled();
    jest.useRealTimers();
  });

  test('graviton: not enough energy → builds solar satellites', () => {
    jest.useFakeTimers();
    jest.setSystemTime(NOW);
    const p = makePlayer({
      research: { graviton: 0 },
      planets:  [makePlanet({
        buildings:    { researchLab: 5 },
        resources:    { metal: 50_000_000, crystal: 50_000_000, deuterium: 9999, energy: 0 },
        resourcesAdd: { metal: 100, crystal: 50, deuterium: 25, energy: 0 },
        temperature:  { max: 80, min: 40 }
      })],
      bot: {
        ...makePlayer().bot,
        research: { currentMission: 0, list: [{ type: 'research', item: 'graviton', level: 1 }] }
      }
    });
    const uni = makeUni({
      costShipyard: jest.fn(() => ({ solarSatellite: { metal: 100, crystal: 50, deuterium: 0 } })),
    });
    const events = makeEvents();
    expect(_runResearchMission(p, uni, events)).toBe(true);
    expect(uni.proccesShipyardRequest).toHaveBeenCalled();
    jest.useRealTimers();
  });
});

// ─── _runPlanetMission ───────────────────────────────────────────────────────

describe('_runPlanetMission', () => {
  test('no missions → false', () => {
    expect(_runPlanetMission(makePlayer(), 0, makeUni(), makeEvents())).toBe(false);
  });

  test('current mission done → advances index and continues to next', () => {
    const p = makePlayer({
      planets: [makePlanet({
        buildings:    { metalMine: 1 },
        resources:    { metal: 0, crystal: 0, deuterium: 0, energy: 0 },
        resourcesAdd: { metal: 10, crystal: 5, deuterium: 2 }
      })],
      bot: {
        ...makePlayer().bot,
        missionList: [
          { type: 'building', item: 'metalMine', level: 1 }, // done
          { type: 'building', item: 'metalMine', level: 2 }, // not done
        ],
        planetProgress: { 0: 0 }
      }
    });
    const uni = makeUni({
      costBuildings: jest.fn(() => ({ metalMine: { metal: 100, crystal: 50, deuterium: 0 } })),
    });
    const events = makeEvents();
    expect(_runPlanetMission(p, 0, uni, events)).toBe(true);
    expect(events.addElement).toHaveBeenCalled(); // resource wait for mission 2
  });

  test('mission in progress (same building) → adds finish event', () => {
    const p = makePlayer({
      planets: [makePlanet({
        buildings:             { metalMine: 0 },
        buildingConstrucction: { active: true, item: 'metalMine', init: NOW, time: 60 }
      })],
      bot: {
        ...makePlayer().bot,
        missionList:    [{ type: 'building', item: 'metalMine', level: 1 }],
        planetProgress: { 0: 0 }
      }
    });
    const events = makeEvents();
    expect(_runPlanetMission(p, 0, makeUni(), events)).toBe(true);
    expect(events.addElement).toHaveBeenCalledWith({ time: NOW + 60000, player: 'testBot' });
  });

  test('different building active → waits for it to finish', () => {
    const p = makePlayer({
      planets: [makePlanet({
        buildings:             { metalMine: 0 },
        buildingConstrucction: { active: true, item: 'solarPlant', init: NOW, time: 120 }
      })],
      bot: {
        ...makePlayer().bot,
        missionList:    [{ type: 'building', item: 'metalMine', level: 1 }],
        planetProgress: { 0: 0 }
      }
    });
    const uni = makeUni({
      costBuildings: jest.fn(() => ({ metalMine: { metal: 100, crystal: 50, deuterium: 0 } })),
    });
    const events = makeEvents();
    expect(_runPlanetMission(p, 0, uni, events)).toBe(true);
    expect(events.addElement).toHaveBeenCalledWith({ time: NOW + 120000, player: 'testBot' });
    expect(uni.proccesBuildRequest).not.toHaveBeenCalled();
  });

  test('can afford building → calls proccesBuildRequest', () => {
    const p = makePlayer({
      planets: [makePlanet({
        buildings: { metalMine: 0 },
        resources: { metal: 10000, crystal: 5000, deuterium: 2000, energy: 0 }
      })],
      bot: {
        ...makePlayer().bot,
        missionList:    [{ type: 'building', item: 'metalMine', level: 1 }],
        planetProgress: { 0: 0 }
      }
    });
    const uni = makeUni({
      costBuildings: jest.fn(() => ({ metalMine: { metal: 100, crystal: 50, deuterium: 0 } })),
    });
    const events = makeEvents();
    expect(_runPlanetMission(p, 0, uni, events)).toBe(true);
    expect(uni.proccesBuildRequest).toHaveBeenCalledWith(p, 0, 'metalMine', expect.anything());
  });

  test('cannot afford building → schedules resource wait', () => {
    jest.useFakeTimers();
    jest.setSystemTime(NOW);
    const p = makePlayer({
      planets: [makePlanet({
        buildings:    { metalMine: 0 },
        resources:    { metal: 0, crystal: 0, deuterium: 0, energy: 0 },
        resourcesAdd: { metal: 10, crystal: 5, deuterium: 2 }
      })],
      bot: {
        ...makePlayer().bot,
        missionList:    [{ type: 'building', item: 'metalMine', level: 1 }],
        planetProgress: { 0: 0 }
      }
    });
    const uni = makeUni({
      costBuildings: jest.fn(() => ({ metalMine: { metal: 100, crystal: 50, deuterium: 0 } })),
    });
    const events = makeEvents();
    expect(_runPlanetMission(p, 0, uni, events)).toBe(true);
    expect(uni.proccesBuildRequest).not.toHaveBeenCalled();
    expect(events.addElement).toHaveBeenCalled();
    jest.useRealTimers();
  });

  test('fleet mission: partial purchase when cannot afford full amount', () => {
    const p = makePlayer({
      planets: [makePlanet({
        fleet:     { smallCargo: 0 },
        resources: { metal: 3000, crystal: 1500, deuterium: 0, energy: 0 }
      })],
      bot: {
        ...makePlayer().bot,
        missionList:    [{ type: 'fleet', item: 'smallCargo', amount: 10 }],
        planetProgress: { 0: 0 }
      }
    });
    // cost 1000/500 each → can afford 3
    const uni = makeUni({
      costShipyard: jest.fn(() => ({ smallCargo: { metal: 1000, crystal: 500, deuterium: 0 } })),
      costDefense:  jest.fn(() => ({})),
    });
    const events = makeEvents();
    _runPlanetMission(p, 0, uni, events);
    expect(uni.proccesShipyardRequest).toHaveBeenCalledWith(p, 0, 'smallCargo', 3, expect.anything());
  });

  test('all missions done, shipRatio set → defers to _buildShipRatio', () => {
    jest.useFakeTimers();
    jest.setSystemTime(NOW);
    const p = makePlayer({
      planets: [makePlanet({ fleet: { deathstar: 1, recycler: 0 } })],
      bot: {
        ...makePlayer().bot,
        missionList:    [{ type: 'building', item: 'metalMine', level: 1 }],
        planetProgress: { 0: 0 },
        shipRatio:      { deathstar: 1, recycler: 5 }
      }
    });
    // Make mission done
    p.planets[0].buildings = { metalMine: 1 };
    const uni   = makeUni();
    const events = makeEvents();
    _runPlanetMission(p, 0, uni, events);
    expect(uni.proccesShipyardRequest).toHaveBeenCalledWith(p, 0, 'recycler', expect.any(Number), expect.anything());
    jest.useRealTimers();
  });
});

// ─── _schedulerActiveMs ──────────────────────────────────────────────────────

describe('_schedulerActiveMs', () => {
  test('no scheduler → full range', () => {
    expect(_schedulerActiveMs(null,  1000, 5000)).toBe(4000);
    expect(_schedulerActiveMs([],    1000, 5000)).toBe(4000);
  });

  test('range fully inside window → full overlap', () => {
    const from = new Date(2024, 0, 15, 10, 0, 0).getTime();
    const to   = from + 3600000; // 10:00 → 11:00, inside [8,20]
    expect(_schedulerActiveMs([{ start: 8, end: 20 }], from, to)).toBe(3600000);
  });

  test('range completely outside window → 0', () => {
    const from = new Date(2024, 0, 15, 3, 0, 0).getTime();
    const to   = from + 3600000; // 3:00 → 4:00, outside [8,20]
    expect(_schedulerActiveMs([{ start: 8, end: 20 }], from, to)).toBe(0);
  });

  test('partial overlap → only the overlap counted', () => {
    const from = new Date(2024, 0, 15, 7, 0, 0).getTime(); // 7:00
    const to   = from + 2 * 3600000;                       // 9:00, window starts at 8
    expect(_schedulerActiveMs([{ start: 8, end: 20 }], from, to)).toBe(3600000);
  });

  test('multiple windows, range spans both → sum of overlaps', () => {
    const from = new Date(2024, 0, 15, 9, 0, 0).getTime(); // 9:00
    const to   = from + 4 * 3600000;                       // 13:00, windows [8,11] and [12,15]
    const ms   = _schedulerActiveMs([{ start: 8, end: 11 }, { start: 12, end: 15 }], from, to);
    expect(ms).toBe(3 * 3600000); // [9,11]=2h + [12,13]=1h = 3h
  });
});

// ─── _tickAttackTimer ────────────────────────────────────────────────────────

describe('_tickAttackTimer', () => {
  beforeEach(() => jest.useFakeTimers());
  afterEach(() => jest.useRealTimers());

  function makeAttackPlayer(name) {
    return makePlayer({
      name,
      bot: {
        scheduler:    null,
        attackConfig: { attackWait: 60, enabled: true },
        missionList:  [], planetProgress: { 0: 0 },
        research:     { currentMission: 0, list: [] }
      }
    });
  }

  test('first tick → false (no prior elapsed time)', () => {
    jest.setSystemTime(NOW);
    expect(_tickAttackTimer(makeAttackPlayer(`tick_first_${Date.now()}`))).toBe(false);
  });

  test('accumulated time less than wait → false', () => {
    const p = makeAttackPlayer(`tick_partial_${Math.random()}`);
    jest.setSystemTime(NOW);
    _tickAttackTimer(p);
    jest.setSystemTime(NOW + 30 * 60 * 1000); // 30 min, need 60
    expect(_tickAttackTimer(p)).toBe(false);
  });

  test('accumulated time >= wait → true, resets', () => {
    const p = makeAttackPlayer(`tick_fire_${Math.random()}`);
    jest.setSystemTime(NOW);
    _tickAttackTimer(p);
    jest.setSystemTime(NOW + 61 * 60 * 1000); // 61 min
    expect(_tickAttackTimer(p)).toBe(true);
  });

  test('after firing, accumulator resets → next tick false', () => {
    const p = makeAttackPlayer(`tick_reset_${Math.random()}`);
    jest.setSystemTime(NOW);
    _tickAttackTimer(p);
    jest.setSystemTime(NOW + 61 * 60 * 1000);
    _tickAttackTimer(p); // fires
    jest.setSystemTime(NOW + 62 * 60 * 1000); // only 1 min after reset
    expect(_tickAttackTimer(p)).toBe(false);
  });
});

// ─── _tryColonize ─────────────────────────────────────────────────────────────

describe('_tryColonize', () => {
  beforeEach(() => jest.useFakeTimers());
  afterEach(() => jest.useRealTimers());

  test('no colonyConfig → no-op', () => {
    jest.setSystemTime(NOW);
    const p   = makePlayer();
    const uni = makeUni();
    _tryColonize(p, uni, { colonyConfig: undefined }, makeEvents());
    expect(uni.addFleetMovement).not.toHaveBeenCalled();
    expect(uni.proccesShipyardRequest).not.toHaveBeenCalled();
  });

  test('already at max planets (astrophysics=0 → max=1) → no-op', () => {
    jest.setSystemTime(NOW);
    const p   = makePlayer({ research: { astrophysics: 0, computer: 1 } }); // 1 planet = max
    const uni = makeUni();
    const bot = { colonyConfig: { galaxyOffsets: [0], systemSpread: 50 } };
    _tryColonize(p, uni, bot, makeEvents());
    expect(uni.addFleetMovement).not.toHaveBeenCalled();
  });

  test('colonizing already in flight → no-op', () => {
    jest.setSystemTime(NOW);
    const p = makePlayer({
      research: { astrophysics: 2, computer: 1 },
      movement: [{ mission: 1 }] // colony mission in flight
    });
    const uni = makeUni();
    const bot = { colonyConfig: { galaxyOffsets: [0], systemSpread: 50 } };
    _tryColonize(p, uni, bot, makeEvents());
    expect(uni.addFleetMovement).not.toHaveBeenCalled();
  });

  test('has colony ship → sends colonize fleet', () => {
    jest.setSystemTime(NOW);
    const p = makePlayer({
      research: { astrophysics: 2, computer: 1 },
      planets:  [makePlanet({ fleet: { colony: 1 }, coordinates: { gal: 1, sys: 100, pos: 8 } })],
      movement: []
    });
    const uni = makeUni({ allCord: {}, universo: { maxGalaxies: 9 } });
    const bot = { colonyConfig: { galaxyOffsets: [0], systemSpread: 10 } };
    _tryColonize(p, uni, bot, makeEvents());
    expect(uni.addFleetMovement).toHaveBeenCalledWith(
      p, 0, false,
      expect.objectContaining({ mission: 1 }),
      expect.anything()
    );
  });

  test('no colony ship available, can afford to build one → starts construction', () => {
    jest.setSystemTime(NOW);
    const p = makePlayer({
      research: { astrophysics: 2, computer: 1 },
      planets:  [makePlanet({ fleet: {}, resources: { metal: 9999, crystal: 9999, deuterium: 9999, energy: 0 } })],
      movement: []
    });
    const uni = makeUni({
      costShipyard: jest.fn(() => ({ colony: { metal: 100, crystal: 50, deuterium: 0, tech: true } })),
    });
    const bot = { colonyConfig: { galaxyOffsets: [0], systemSpread: 10 } };
    _tryColonize(p, uni, bot, makeEvents());
    expect(uni.proccesShipyardRequest).toHaveBeenCalledWith(p, 0, 'colony', 1, expect.anything());
  });
});

// ─── _joinFleet ───────────────────────────────────────────────────────────────

describe('_joinFleet', () => {
  test('planetNum === 0 → no-op', () => {
    const p   = makePlayer();
    const uni = makeUni();
    _joinFleet(p, 0, p.bot, uni);
    expect(uni.addFleetMovement).not.toHaveBeenCalled();
  });

  test('joinFleet disabled → no-op', () => {
    const p = makePlayer({ planets: [makePlanet(), makePlanet()] });
    p.bot.joinFleet = false;
    const uni = makeUni();
    _joinFleet(p, 1, p.bot, uni);
    expect(uni.addFleetMovement).not.toHaveBeenCalled();
  });

  test('fleet mission active on planet → no deploy', () => {
    // planet 1 has smallCargo=3 < amount=5 → mission type is 'fleet'
    const p = makePlayer({
      planets: [
        makePlanet({ coordinates: { gal: 1, sys: 100, pos: 8 } }),
        makePlanet({ fleet: { smallCargo: 3 }, coordinates: { gal: 1, sys: 100, pos: 9 } })
      ],
      bot: {
        ...makePlayer().bot,
        joinFleet:      true,
        missionList:    [{ type: 'fleet', item: 'smallCargo', amount: 5 }],
        planetProgress: { 0: 0, 1: 0 }
      }
    });
    const uni = makeUni();
    _joinFleet(p, 1, p.bot, uni);
    expect(uni.addFleetMovement).not.toHaveBeenCalled();
  });

  test('all missions done, ships present → deploys to planet 0', () => {
    const p = makePlayer({
      planets: [
        makePlanet({ coordinates: { gal: 1, sys: 100, pos: 8 } }),
        makePlanet({
          fleet:       { smallCargo: 5 },
          buildings:   { metalMine: 1 },
          coordinates: { gal: 1, sys: 101, pos: 8 }
        })
      ],
      bot: {
        ...makePlayer().bot,
        joinFleet:      true,
        missionList:    [{ type: 'building', item: 'metalMine', level: 1 }], // done (level 1 = 1)
        planetProgress: { 0: 0, 1: 0 }
      }
    });
    const uni = makeUni();
    _joinFleet(p, 1, p.bot, uni);
    expect(uni.addFleetMovement).toHaveBeenCalledWith(
      p, 1, false,
      expect.objectContaining({ mission: 4 }), // deploy
      expect.anything()
    );
  });

  test('already deploying from that planet → no duplicate', () => {
    const p = makePlayer({
      planets: [
        makePlanet({ coordinates: { gal: 1, sys: 100, pos: 8 } }),
        makePlanet({
          fleet:       { smallCargo: 5 },
          buildings:   { metalMine: 1 },
          coordinates: { gal: 1, sys: 101, pos: 8 }
        })
      ],
      movement: [{
        mission:   4,
        coorDesde: { gal: 1, sys: 101, pos: 8 },
        coorHasta: { gal: 1, sys: 100, pos: 8 }
      }],
      bot: {
        ...makePlayer().bot,
        joinFleet:      true,
        missionList:    [{ type: 'building', item: 'metalMine', level: 1 }],
        planetProgress: { 0: 0, 1: 0 }
      }
    });
    const uni = makeUni();
    _joinFleet(p, 1, p.bot, uni);
    expect(uni.addFleetMovement).not.toHaveBeenCalled();
  });
});

// ─── runBot (integration) ─────────────────────────────────────────────────────

describe('runBot', () => {
  beforeEach(() => jest.useFakeTimers());
  afterEach(() => jest.useRealTimers());

  test('human botType → no-op', () => {
    jest.setSystemTime(NOW);
    const p = makePlayer({ botType: 'human' });
    runBot(p, makeUni(), makeEvents());
    expect(makeUni().proccesBuildRequest).not.toHaveBeenCalled();
  });

  test('no bot field → no-op', () => {
    jest.setSystemTime(NOW);
    const p = makePlayer({ bot: undefined });
    const events = makeEvents();
    runBot(p, makeUni(), events);
    expect(events.addElement).not.toHaveBeenCalled();
  });

  test('outside scheduler window → schedules next window, no builds', () => {
    const t = new Date(2024, 0, 15, 5, 0, 0); // 5:00, outside [8,20]
    jest.setSystemTime(t.getTime());
    const p      = makePlayer();
    p.bot.scheduler = [{ start: 8, end: 20 }];
    const uni    = makeUni();
    const events = makeEvents();
    runBot(p, uni, events);
    expect(events.addElement).toHaveBeenCalled();
    expect(uni.proccesBuildRequest).not.toHaveBeenCalled();
  });

  test('no missions, no research → schedules fallback event', () => {
    jest.setSystemTime(NOW);
    const events = makeEvents();
    runBot(makePlayer(), makeUni(), events);
    expect(events.addElement).toHaveBeenCalledWith(
      expect.objectContaining({ player: 'testBot' })
    );
  });

  test('bot with planet building mission → calls proccesBuildRequest', () => {
    jest.setSystemTime(NOW);
    const p = makePlayer({
      planets: [makePlanet({
        buildings: { metalMine: 0 },
        resources: { metal: 10000, crystal: 5000, deuterium: 2000, energy: 0 }
      })],
      bot: {
        ...makePlayer().bot,
        missionList:    [{ type: 'building', item: 'metalMine', level: 1 }],
        planetProgress: { 0: 0 }
      }
    });
    const uni = makeUni({
      costBuildings: jest.fn(() => ({ metalMine: { metal: 100, crystal: 50, deuterium: 0 } })),
    });
    const events = makeEvents();
    runBot(p, uni, events);
    expect(uni.proccesBuildRequest).toHaveBeenCalledWith(p, 0, 'metalMine', expect.anything());
  });

  test('bot with research mission → calls proccesResearchRequest', () => {
    jest.setSystemTime(NOW);
    const p = makePlayer({
      research: { energy: 0 },
      planets:  [makePlanet({
        buildings: { researchLab: 3 },
        resources: { metal: 9999, crystal: 9999, deuterium: 9999, energy: 0 }
      })],
      bot: {
        ...makePlayer().bot,
        research: { currentMission: 0, list: [{ type: 'research', item: 'energy', level: 1 }] }
      }
    });
    const uni = makeUni({
      costResearch: jest.fn(() => ({ energy: { metal: 100, crystal: 50, deuterium: 0 } })),
    });
    runBot(p, uni, makeEvents());
    expect(uni.proccesResearchRequest).toHaveBeenCalled();
  });
});
