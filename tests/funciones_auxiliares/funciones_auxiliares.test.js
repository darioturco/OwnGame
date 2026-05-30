const f     = require('../../routes/funciones_auxiliares');
const costs = require('../../routes/constructions/costs');

// ─── getTypePlanet ────────────────────────────────────────────────────────────
describe('getTypePlanet', () => {
  describe('mod=0', () => {
    test('pos<=3 → type 2 (Dry)', () => {
      expect(f.getTypePlanet(1, 0)).toBe(2);
      expect(f.getTypePlanet(3, 0)).toBe(2);
    });
    test('pos=6||7 → type 3 (Jungle)', () => {
      expect(f.getTypePlanet(6, 0)).toBe(3);
      expect(f.getTypePlanet(7, 0)).toBe(3);
    });
    test('pos=8||9 → type 4 (Water)', () => {
      expect(f.getTypePlanet(8, 0)).toBe(4);
      expect(f.getTypePlanet(9, 0)).toBe(4);
    });
    test('pos=10||11 → type 6 (Ice)', () => {
      expect(f.getTypePlanet(10, 0)).toBe(6);
      expect(f.getTypePlanet(11, 0)).toBe(6);
    });
    test('pos=12||13 → type 5 (Gas)', () => {
      expect(f.getTypePlanet(12, 0)).toBe(5);
      expect(f.getTypePlanet(13, 0)).toBe(5);
    });
    test('pos>=14 → type 1 (Normal)', () => {
      expect(f.getTypePlanet(14, 0)).toBe(1);
      expect(f.getTypePlanet(16, 0)).toBe(1);
    });
  });

  describe('mod=1', () => {
    test('pos<=3 → type 7 (Desert)', () => {
      expect(f.getTypePlanet(1, 1)).toBe(7);
      expect(f.getTypePlanet(3, 1)).toBe(7);
    });
    test('pos=4||5 → type 2 (Dry)', () => {
      expect(f.getTypePlanet(4, 1)).toBe(2);
      expect(f.getTypePlanet(5, 1)).toBe(2);
    });
    test('pos=6||7 → type 1 (Normal)', () => {
      expect(f.getTypePlanet(6, 1)).toBe(1);
      expect(f.getTypePlanet(7, 1)).toBe(1);
    });
    test('pos=8||9 → type 3 (Jungle)', () => {
      expect(f.getTypePlanet(8, 1)).toBe(3);
      expect(f.getTypePlanet(9, 1)).toBe(3);
    });
    test('pos=10||11 → type 4 (Water)', () => {
      expect(f.getTypePlanet(10, 1)).toBe(4);
      expect(f.getTypePlanet(11, 1)).toBe(4);
    });
    test('pos=12||13 → type 6 (Ice)', () => {
      expect(f.getTypePlanet(12, 1)).toBe(6);
      expect(f.getTypePlanet(13, 1)).toBe(6);
    });
    test('pos>=14 → type 5 (Gas)', () => {
      expect(f.getTypePlanet(14, 1)).toBe(5);
      expect(f.getTypePlanet(16, 1)).toBe(5);
    });
  });
});

// ─── cantidadMisiles ──────────────────────────────────────────────────────────
describe('cantidadMisiles', () => {
  test('sums both missile types', () => {
    const planeta = { defense: { antiballisticMissile: 3, interplanetaryMissile: 5 } };
    expect(f.cantidadMisiles(planeta)).toBe(8);
  });
  test('works with zeros', () => {
    const planeta = { defense: { antiballisticMissile: 0, interplanetaryMissile: 0 } };
    expect(f.cantidadMisiles(planeta)).toBe(0);
  });
});

// ─── capacidadSilo ────────────────────────────────────────────────────────────
describe('capacidadSilo', () => {
  test('level * 10', () => {
    expect(f.capacidadSilo({ buildings: { silo: 4 } })).toBe(40);
    expect(f.capacidadSilo({ buildings: { silo: 0 } })).toBe(0);
    expect(f.capacidadSilo({ buildings: { silo: 10 } })).toBe(100);
  });
});

// ─── phalanxLevel ─────────────────────────────────────────────────────────────
describe('phalanxLevel', () => {
  test('active moon → phalanx level', () => {
    expect(f.phalanxLevel({ active: true, buildings: { phalanx: 5 } })).toBe(5);
  });
  test('inactive moon → 0', () => {
    expect(f.phalanxLevel({ active: false, buildings: { phalanx: 5 } })).toBe(0);
  });
});

// ─── timeBuild ────────────────────────────────────────────────────────────────
describe('timeBuild', () => {
  test('basic formula: floor(60*recursos/divisor)', () => {
    // divisor = 2500*(1+0)*2^0*1 = 2500; result = floor(60*2500/2500) = 60
    expect(f.timeBuild(2500, 0, 0, 1)).toBe(60);
  });
  test('higher mult reduces time', () => {
    const t1 = f.timeBuild(10000, 0, 0, 1);
    const t2 = f.timeBuild(10000, 1, 0, 1);
    expect(t2).toBeLessThan(t1);
  });
  test('higher elevation reduces time', () => {
    const t1 = f.timeBuild(10000, 0, 0, 1);
    const t2 = f.timeBuild(10000, 0, 2, 1);
    expect(t2).toBeLessThan(t1);
  });
  test('higher universe speed reduces time', () => {
    const t1 = f.timeBuild(10000, 0, 0, 1);
    const t2 = f.timeBuild(10000, 0, 0, 3);
    expect(t2).toBeLessThan(t1);
  });
});

// ─── hash ─────────────────────────────────────────────────────────────────────
describe('hash', () => {
  test('returns hex string of length 64', () => {
    const h = f.hash('hello');
    expect(h).toMatch(/^[0-9a-f]{64}$/);
  });
  test('deterministic', () => {
    expect(f.hash('test')).toBe(f.hash('test'));
  });
  test('different inputs → different hashes', () => {
    expect(f.hash('a')).not.toBe(f.hash('b'));
  });
});

// ─── normalRandom ─────────────────────────────────────────────────────────────
describe('normalRandom', () => {
  test('result within [min, max]', () => {
    for (let i = 0; i < 100; i++) {
      const val = f.normalRandom(0, 10);
      expect(val).toBeGreaterThanOrEqual(0);
      expect(val).toBeLessThanOrEqual(10);
    }
  });
  test('respects poda bounds', () => {
    for (let i = 0; i < 50; i++) {
      const val = f.normalRandom(0, 100, 40, 60);
      expect(val).toBeGreaterThanOrEqual(40);
      expect(val).toBeLessThanOrEqual(60);
    }
  });
});

// ─── randomBool ───────────────────────────────────────────────────────────────
describe('randomBool', () => {
  test('returns boolean', () => {
    expect(typeof f.randomBool()).toBe('boolean');
  });
});

// ─── randomString ─────────────────────────────────────────────────────────────
describe('randomString', () => {
  test('returns only lowercase letters', () => {
    for (let i = 0; i < 20; i++) {
      expect(f.randomString()).toMatch(/^[a-z]+$/);
    }
  });
  test('length at most 10', () => {
    for (let i = 0; i < 20; i++) {
      const len = f.randomString().length;
      expect(len).toBeLessThanOrEqual(10);
    }
  });
});

// ─── validInt ─────────────────────────────────────────────────────────────────
describe('validInt', () => {
  test('valid integers', () => {
    expect(f.validInt(0)).toBe(true);
    expect(f.validInt(42)).toBe(true);
    expect(f.validInt(-10)).toBe(true);
    expect(f.validInt('7')).toBe(true);
    expect(f.validInt('007')).toBe(true);
  });
  test('invalid values', () => {
    expect(f.validInt('abc')).toBe(false);
    expect(f.validInt(NaN)).toBe(false);
    expect(f.validInt(undefined)).toBe(false);
    expect(f.validInt(null)).toBe(false);
  });
});

// ─── validShipyardName ────────────────────────────────────────────────────────
describe('validShipyardName', () => {
  test('valid ship names', () => {
    expect(f.validShipyardName('lightFighter')).toBe(true);
    expect(f.validShipyardName('deathstar')).toBe(true);
    expect(f.validShipyardName('rocketLauncher')).toBe(true);
    expect(f.validShipyardName('plasma')).toBe(true);
  });
  test('missile names', () => {
    expect(f.validShipyardName('antiballisticMissile')).toBe(true);
    expect(f.validShipyardName('interplanetaryMissile')).toBe(true);
  });
  test('invalid names', () => {
    expect(f.validShipyardName('unknown')).toBe(false);
    expect(f.validShipyardName('')).toBe(false);
    expect(f.validShipyardName('metalMine')).toBe(false);
  });
});

// ─── formatNumber ─────────────────────────────────────────────────────────────
describe('formatNumber', () => {
  test('below 1000 unchanged', () => {
    expect(f.formatNumber(0)).toBe('0');
    expect(f.formatNumber(999)).toBe('999');
    expect(f.formatNumber(1)).toBe('1');
  });
  test('thousands with dot separator', () => {
    expect(f.formatNumber(1000)).toBe('1.000');
    expect(f.formatNumber(1500)).toBe('1.500');
    expect(f.formatNumber(1000000)).toBe('1.000.000');
    expect(f.formatNumber(1234567)).toBe('1.234.567');
  });
  test('negative numbers', () => {
    expect(f.formatNumber(-1000)).toBe('-1.000');
    expect(f.formatNumber(-500)).toBe('-500');
  });
  test('non-finite returns original', () => {
    expect(f.formatNumber('abc')).toBe('abc');
  });
});

// ─── completaDigitos ──────────────────────────────────────────────────────────
describe('completaDigitos', () => {
  test('zero → "000"', () => {
    expect(f.completaDigitos(0)).toBe('000');
  });
  test('single digit → "00x"', () => {
    expect(f.completaDigitos(5)).toBe('005');
    expect(f.completaDigitos(9)).toBe('009');
  });
  test('two digits → "0xx"', () => {
    expect(f.completaDigitos(10)).toBe('010');
    expect(f.completaDigitos(99)).toBe('099');
  });
  test('three digits → unchanged', () => {
    expect(f.completaDigitos(100)).toBe(100);
    expect(f.completaDigitos(999)).toBe(999);
  });
});

// ─── segundosATiempo ──────────────────────────────────────────────────────────
describe('segundosATiempo', () => {
  test('invalid inputs → " unknown"', () => {
    expect(f.segundosATiempo(-1)).toBe(' unknown');
    expect(f.segundosATiempo(NaN)).toBe(' unknown');
    expect(f.segundosATiempo(Infinity)).toBe(' unknown');
  });
  test('seconds only', () => {
    expect(f.segundosATiempo(0)).toBe(' 0s');
    expect(f.segundosATiempo(45)).toBe(' 45s');
  });
  test('minutes and seconds', () => {
    expect(f.segundosATiempo(65)).toBe(' 1m 5s');
    expect(f.segundosATiempo(120)).toBe(' 2m 0s');
  });
  test('hours, minutes, seconds', () => {
    expect(f.segundosATiempo(3665)).toBe(' 1h 1m 5s');
    expect(f.segundosATiempo(3600)).toBe(' 1h 0m 0s');
  });
  test('days', () => {
    expect(f.segundosATiempo(90061)).toBe(' 1d 1h 1m 1s');
    expect(f.segundosATiempo(86400)).toBe(' 1d 0h 0m 0s');
  });
});

// ─── calculaTiempoFaltante ────────────────────────────────────────────────────
describe('calculaTiempoFaltante', () => {
  test('empty list → 0', () => {
    expect(f.calculaTiempoFaltante([])).toBe(0);
  });
  test('single item', () => {
    // time = (3-1)*10 + 5 = 25; return 25000
    expect(f.calculaTiempoFaltante([{ cant: 3, time: 10, timeNow: 5 }])).toBe(25000);
  });
  test('multiple items', () => {
    const lista = [
      { cant: 2, time: 100, timeNow: 50 },
      { cant: 1, time: 200, timeNow: 75 },
    ];
    // item0: (2-1)*100 + 50 = 150; item1: (1-1)*200 + 75 = 75; total = 225*1000
    expect(f.calculaTiempoFaltante(lista)).toBe(225000);
  });
});

// ─── recursosSuficientes ──────────────────────────────────────────────────────
describe('recursosSuficientes', () => {
  const resources = { metal: 100, crystal: 50, deuterium: 20 };
  test('sufficient resources', () => {
    expect(f.recursosSuficientes(resources, { metal: 100, crystal: 50, deuterium: 20 })).toBe(true);
    expect(f.recursosSuficientes(resources, { metal: 0, crystal: 0, deuterium: 0 })).toBe(true);
  });
  test('insufficient resources', () => {
    expect(f.recursosSuficientes(resources, { metal: 101, crystal: 50, deuterium: 20 })).toBe(false);
    expect(f.recursosSuficientes(resources, { metal: 100, crystal: 51, deuterium: 20 })).toBe(false);
    expect(f.recursosSuficientes(resources, { metal: 100, crystal: 50, deuterium: 21 })).toBe(false);
  });
  test('multiplier', () => {
    expect(f.recursosSuficientes(resources, { metal: 50, crystal: 25, deuterium: 10 }, 2)).toBe(true);
    expect(f.recursosSuficientes(resources, { metal: 51, crystal: 25, deuterium: 10 }, 2)).toBe(false);
  });
});

// ─── coordenadaValida ─────────────────────────────────────────────────────────
describe('coordenadaValida', () => {
  test('valid coordinates', () => {
    expect(f.coordenadaValida({ gal: 1, sys: 1, pos: 1 })).toBe(true);
    expect(f.coordenadaValida({ gal: 9, sys: 499, pos: 16 })).toBe(true);
    expect(f.coordenadaValida({ gal: 5, sys: 250, pos: 8 })).toBe(true);
  });
  test('out of range', () => {
    expect(f.coordenadaValida({ gal: 0, sys: 1, pos: 1 })).toBe(false);
    expect(f.coordenadaValida({ gal: 10, sys: 1, pos: 1 })).toBe(false);
    expect(f.coordenadaValida({ gal: 1, sys: 500, pos: 1 })).toBe(false);
    expect(f.coordenadaValida({ gal: 1, sys: 1, pos: 17 })).toBe(false);
    expect(f.coordenadaValida({ gal: 1, sys: 0, pos: 1 })).toBe(false);
    expect(f.coordenadaValida({ gal: 1, sys: 1, pos: 0 })).toBe(false);
  });
});

// ─── coorToCorch ─────────────────────────────────────────────────────────────
describe('coorToCorch', () => {
  test('formats correctly', () => {
    expect(f.coorToCorch({ gal: 1, sys: 2, pos: 3 })).toBe('[1:2:3]');
    expect(f.coorToCorch({ gal: 9, sys: 499, pos: 16 })).toBe('[9:499:16]');
  });
});

// ─── validResourcesSettingsObj ───────────────────────────────────────────────
describe('validResourcesSettingsObj', () => {
  test('undefined → false', () => {
    expect(f.validResourcesSettingsObj(undefined, false)).toBe(false);
  });
  test('planet: valid values 0-10', () => {
    const obj = { metal: 5, crystal: 3, deuterium: 7, energy: 10 };
    expect(f.validResourcesSettingsObj(obj, false)).toBeTruthy();
  });
  test('planet: value > 10 → false', () => {
    expect(f.validResourcesSettingsObj({ metal: 11, crystal: 0, deuterium: 0, energy: 0 }, false)).toBeFalsy();
  });
  test('planet: non-integer → false', () => {
    expect(f.validResourcesSettingsObj({ metal: 'abc', crystal: 0, deuterium: 0, energy: 0 }, false)).toBe(false);
  });
  test('moon: valid sunshade and beam', () => {
    const obj = { sunshade: 5, beam: 8 };
    expect(f.validResourcesSettingsObj(obj, true)).toBeTruthy();
  });
  test('moon: value > 10 → false', () => {
    expect(f.validResourcesSettingsObj({ sunshade: 11, beam: 5 }, true)).toBeFalsy();
  });
});

// ─── validPlanetNum ───────────────────────────────────────────────────────────
describe('validPlanetNum', () => {
  const player = {
    planets: [
      { moon: { active: true } },
      { moon: { active: false } },
    ]
  };
  test('valid index', () => {
    expect(f.validPlanetNum(player, 0)).toBe(true);
    expect(f.validPlanetNum(player, 1)).toBe(true);
  });
  test('out of bounds', () => {
    expect(f.validPlanetNum(player, 2)).toBe(false);
    expect(f.validPlanetNum(player, -1)).toBe(false);
  });
  test('moon: requires active moon', () => {
    expect(f.validPlanetNum(player, 0, true)).toBe(true);
    expect(f.validPlanetNum(player, 1, true)).toBe(false);
  });
});

// ─── calculaDistancia ────────────────────────────────────────────────────────
describe('calculaDistancia', () => {
  test('same coordinates → 5', () => {
    expect(f.calculaDistancia({ gal:1, sys:1, pos:1 }, { gal:1, sys:1, pos:1 }, false, false)).toBe(5);
  });
  test('same system, different pos', () => {
    expect(f.calculaDistancia({ gal:1, sys:1, pos:1 }, { gal:1, sys:1, pos:6 }, false, false)).toBe(1025);
  });
  test('same galaxy, different sys (no donut)', () => {
    expect(f.calculaDistancia({ gal:1, sys:1, pos:1 }, { gal:1, sys:3, pos:1 }, false, false)).toBe(2890);
  });
  test('different galaxy (no donut)', () => {
    expect(f.calculaDistancia({ gal:1, sys:1, pos:1 }, { gal:3, sys:1, pos:1 }, false, false)).toBe(40000);
  });
  test('system donut wraps around', () => {
    const normal = f.calculaDistancia({ gal:1, sys:1, pos:1 }, { gal:1, sys:450, pos:1 }, false, false);
    const donut  = f.calculaDistancia({ gal:1, sys:1, pos:1 }, { gal:1, sys:450, pos:1 }, false, true);
    expect(donut).toBeLessThanOrEqual(normal);
  });
  test('galaxy donut wraps around', () => {
    const normal = f.calculaDistancia({ gal:1, sys:1, pos:1 }, { gal:8, sys:1, pos:1 }, false, false);
    const donut  = f.calculaDistancia({ gal:1, sys:1, pos:1 }, { gal:8, sys:1, pos:1 }, true, false);
    expect(donut).toBeLessThanOrEqual(normal);
  });
});

// ─── negativeObj ─────────────────────────────────────────────────────────────
describe('negativeObj', () => {
  test('negates all fields', () => {
    expect(f.negativeObj({ metal: 100, crystal: 50, deuterium: 10 })).toEqual({ metal: -100, crystal: -50, deuterium: -10 });
  });
  test('already negative → positive', () => {
    expect(f.negativeObj({ a: -5, b: -3 })).toEqual({ a: 5, b: 3 });
  });
  test('empty obj → empty', () => {
    expect(f.negativeObj({})).toEqual({});
  });
});

// ─── missionNumToString ───────────────────────────────────────────────────────
describe('missionNumToString', () => {
  test('known mission numbers', () => {
    expect(f.missionNumToString(0)).toBe('Expedition');
    expect(f.missionNumToString(7)).toBe('Attack');
    expect(f.missionNumToString(3)).toBe('Transport');
  });
  test('out of range → undefined', () => {
    expect(f.missionNumToString(99)).toBeUndefined();
  });
});

// ─── objStringToNum ───────────────────────────────────────────────────────────
describe('objStringToNum', () => {
  test('converts string values to int', () => {
    const obj = { metal: '100', crystal: '50', deuterium: '0' };
    f.objStringToNum(obj);
    expect(obj).toEqual({ metal: 100, crystal: 50, deuterium: 0 });
  });
  test('mutates in place', () => {
    const obj = { a: '5' };
    const ref = obj;
    f.objStringToNum(obj);
    expect(ref.a).toBe(5);
  });
});

// ─── equalCoor ───────────────────────────────────────────────────────────────
describe('equalCoor', () => {
  test('equal coordinates', () => {
    expect(f.equalCoor({ gal:1, sys:2, pos:3 }, { gal:1, sys:2, pos:3 })).toBe(true);
  });
  test('different gal', () => {
    expect(f.equalCoor({ gal:1, sys:2, pos:3 }, { gal:2, sys:2, pos:3 })).toBe(false);
  });
  test('different sys', () => {
    expect(f.equalCoor({ gal:1, sys:2, pos:3 }, { gal:1, sys:3, pos:3 })).toBe(false);
  });
  test('different pos', () => {
    expect(f.equalCoor({ gal:1, sys:2, pos:3 }, { gal:1, sys:2, pos:4 })).toBe(false);
  });
});

// ─── getIndexOfPlanet ────────────────────────────────────────────────────────
describe('getIndexOfPlanet', () => {
  const planets = [
    { coordinates: { gal:1, sys:1, pos:1 } },
    { coordinates: { gal:1, sys:1, pos:5 } },
    { coordinates: { gal:2, sys:3, pos:8 } },
  ];
  test('finds existing planet', () => {
    expect(f.getIndexOfPlanet(planets, { gal:1, sys:1, pos:5 })).toBe(1);
    expect(f.getIndexOfPlanet(planets, { gal:2, sys:3, pos:8 })).toBe(2);
  });
  test('returns -1 when not found', () => {
    expect(f.getIndexOfPlanet(planets, { gal:9, sys:9, pos:9 })).toBe(-1);
  });
});

// ─── isZeroObj ───────────────────────────────────────────────────────────────
describe('isZeroObj', () => {
  test('all zeros → true', () => {
    expect(f.isZeroObj({ a: 0, b: 0, c: 0 })).toBe(true);
    expect(f.isZeroObj({})).toBe(true);
  });
  test('any non-zero → false', () => {
    expect(f.isZeroObj({ a: 0, b: 1 })).toBe(false);
    expect(f.isZeroObj({ a: -1 })).toBe(false);
  });
});

// ─── zero* factories ─────────────────────────────────────────────────────────
describe('zero factory functions', () => {
  test('zeroResources', () => {
    expect(f.zeroResources()).toEqual({ metal: 0, crystal: 0, deuterium: 0 });
  });
  test('zeroShips has 14 ship types all zero', () => {
    const ships = f.zeroShips();
    expect(Object.values(ships).every(v => v === 0)).toBe(true);
    expect(Object.keys(ships)).toHaveLength(14);
  });
  test('zeroDefense has 10 defense types all zero', () => {
    const def = f.zeroDefense();
    expect(Object.values(def).every(v => v === 0)).toBe(true);
    expect(Object.keys(def)).toHaveLength(10);
  });
  test('zeroBuilding has 15 building types all zero', () => {
    const b = f.zeroBuilding();
    expect(Object.values(b).every(v => v === 0)).toBe(true);
    expect(Object.keys(b)).toHaveLength(15);
  });
  test('zeroBuildingsMoon has 8 moon buildings all zero', () => {
    const b = f.zeroBuildingsMoon();
    expect(Object.values(b).every(v => v === 0)).toBe(true);
    expect(Object.keys(b)).toHaveLength(8);
  });
  test('zeroResearch has 16 research types all zero', () => {
    const r = f.zeroResearch();
    expect(Object.values(r).every(v => v === 0)).toBe(true);
    expect(Object.keys(r)).toHaveLength(16);
  });
});

// ─── estaColonizado ───────────────────────────────────────────────────────────
describe('estaColonizado', () => {
  const lista = { '1_2_3': { playerName: 'Alice' } };
  test('colonized → true', () => {
    expect(f.estaColonizado(lista, { gal:1, sys:2, pos:3 })).toBe(true);
  });
  test('not colonized → false', () => {
    expect(f.estaColonizado(lista, { gal:1, sys:2, pos:4 })).toBe(false);
  });
});

// ─── playerName ───────────────────────────────────────────────────────────────
describe('playerName', () => {
  const lista = { '1_2_3': { playerName: 'Alice' } };
  test('colonized → player name', () => {
    expect(f.playerName(lista, { gal:1, sys:2, pos:3 })).toBe('Alice');
  });
  test('not colonized → empty string', () => {
    expect(f.playerName(lista, { gal:9, sys:9, pos:9 })).toBe('');
  });
});

// ─── cargaEscombros ───────────────────────────────────────────────────────────
describe('cargaEscombros', () => {
  test('enough capacity for everything', () => {
    expect(f.cargaEscombros({ metal: 100, crystal: 50 }, 200)).toEqual({ metal: 100, crystal: 50 });
  });
  test('capacity limited to metal only', () => {
    expect(f.cargaEscombros({ metal: 300, crystal: 100 }, 200)).toEqual({ metal: 200, crystal: 0 });
  });
  test('capacity fills metal then partial crystal', () => {
    expect(f.cargaEscombros({ metal: 100, crystal: 200 }, 150)).toEqual({ metal: 100, crystal: 50 });
  });
  test('zero capacity', () => {
    expect(f.cargaEscombros({ metal: 100, crystal: 100 }, 0)).toEqual({ metal: 0, crystal: 0 });
  });
});

// ─── posiblesVacas ────────────────────────────────────────────────────────────
describe('posiblesVacas', () => {
  const vacas = [
    { coordinates: { gal:1, sys:2, pos:5 } },
    { coordinates: { gal:1, sys:2, pos:9 } },
    { coordinates: { gal:1, sys:3, pos:7 } },
    { coordinates: { gal:2, sys:2, pos:4 } },
  ];
  test('filters by gal and sys', () => {
    expect(f.posiblesVacas(vacas, 1, 2)).toEqual([5, 9]);
  });
  test('no matches → empty array', () => {
    expect(f.posiblesVacas(vacas, 9, 9)).toEqual([]);
  });
});

// ─── shipStringToNum ──────────────────────────────────────────────────────────
describe('shipStringToNum', () => {
  test('known ships', () => {
    expect(f.shipStringToNum('lightFighter')).toBe(0);
    expect(f.shipStringToNum('deathstar')).toBe(7);
    expect(f.shipStringToNum('rocketLauncher')).toBe(14);
    expect(f.shipStringToNum('largeShield')).toBe(21);
  });
  test('unknown ship → undefined', () => {
    expect(f.shipStringToNum('unknown')).toBeUndefined();
  });
});

// ─── isBuildingSmallShield / isBuildingLargeShield ───────────────────────────
describe('isBuildingSmallShield', () => {
  test('contains smallShield → true', () => {
    expect(f.isBuildingSmallShield([{ item: 'lightFighter' }, { item: 'smallShield' }])).toBe(true);
  });
  test('no smallShield → false', () => {
    expect(f.isBuildingSmallShield([{ item: 'lightFighter' }])).toBe(false);
    expect(f.isBuildingSmallShield([])).toBe(false);
  });
});

describe('isBuildingLargeShield', () => {
  test('contains largeShield → true', () => {
    expect(f.isBuildingLargeShield([{ item: 'largeShield' }])).toBe(true);
  });
  test('no largeShield → false', () => {
    expect(f.isBuildingLargeShield([{ item: 'smallShield' }])).toBe(false);
  });
});

// ─── getCantFleets ────────────────────────────────────────────────────────────
describe('getCantFleets', () => {
  test('counts fleets and expeditions', () => {
    const player = {
      movement: [
        { mission: 0 },
        { mission: 7 },
        { mission: 0 },
        { mission: 3 },
      ]
    };
    expect(f.getCantFleets(player)).toEqual({ expeditions: 2, fleets: 4 });
  });
  test('no movement', () => {
    expect(f.getCantFleets({ movement: [] })).toEqual({ expeditions: 0, fleets: 0 });
  });
});

// ─── getTypeActive ────────────────────────────────────────────────────────────
describe('getTypeActive', () => {
  const now = Date.now();
  test('active (< 7 days)', () => {
    expect(f.getTypeActive(now - 1 * 86400000)).toBe('active');
  });
  test('inactivo (7-30 days)', () => {
    expect(f.getTypeActive(now - 10 * 86400000)).toBe('inactivo');
  });
  test('Inactivo (30-90 days)', () => {
    expect(f.getTypeActive(now - 60 * 86400000)).toBe('Inactivo');
  });
  test('Abandonado (>= 90 days)', () => {
    expect(f.getTypeActive(now - 100 * 86400000)).toBe('Abandonado');
  });
});

// ─── cleanDataSession ─────────────────────────────────────────────────────────
describe('cleanDataSession', () => {
  test('removes id, username, password', () => {
    const obj = { id: 1, username: 'alice', password: 'secret', role: 'admin' };
    f.cleanDataSession(obj);
    expect(obj).not.toHaveProperty('id');
    expect(obj).not.toHaveProperty('username');
    expect(obj).not.toHaveProperty('password');
    expect(obj.role).toBe('admin');
  });
});

// ─── getListSpeed ─────────────────────────────────────────────────────────────
describe('getListSpeed', () => {
  test('all-zero techs returns base speeds', () => {
    const speeds = costs.getListSpeed(0, 0, 0);
    expect(speeds).toHaveLength(14);
    expect(speeds[0]).toBe(12500);      // lightFighter base
    expect(speeds[7]).toBe(100);        // deathstar base
    expect(speeds[12]).toBe(100000000); // espionageProbe base
  });
  test('higher tech → higher speed', () => {
    const base     = costs.getListSpeed(0, 0, 0);
    const upgraded = costs.getListSpeed(5, 5, 5);
    expect(upgraded[0]).toBeGreaterThan(base[0]);
    expect(upgraded[1]).toBeGreaterThan(base[1]);
  });
});

// ─── generateNewTypeOfPlanet ─────────────────────────────────────────────────
describe('generateNewTypeOfPlanet', () => {
  test('returns correct structure', () => {
    const planet = f.generateNewTypeOfPlanet(5, 0);
    expect(planet).toHaveProperty('type');
    expect(planet).toHaveProperty('color');
    expect(planet).toHaveProperty('temperature');
    expect(planet.temperature).toHaveProperty('max');
    expect(planet.temperature).toHaveProperty('min');
    expect(planet).toHaveProperty('campos');
  });
  test('type matches getTypePlanet', () => {
    for (let pos = 1; pos <= 16; pos++) {
      const planet = f.generateNewTypeOfPlanet(pos, 0);
      expect(planet.type).toBe(f.getTypePlanet(pos, 0));
    }
  });
  test('color in range 1-10', () => {
    for (let i = 0; i < 20; i++) {
      const planet = f.generateNewTypeOfPlanet(8, 0);
      expect(planet.color).toBeGreaterThanOrEqual(1);
      expect(planet.color).toBeLessThanOrEqual(10);
    }
  });
  test('temperature max > min', () => {
    for (let i = 0; i < 10; i++) {
      const planet = f.generateNewTypeOfPlanet(7, 0);
      expect(planet.temperature.max).toBeGreaterThan(planet.temperature.min);
    }
  });
});
