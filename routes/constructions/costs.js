const names = {
  metalMine:              'Metal Mine',
  crystalMine:            'Crystal Mine',
  deuteriumMine:          'Deuterium Mine',
  solarPlant:             'Solar Plant',
  fusionReactor:          'Fusion Reactor',
  metalStorage:           'Metal Storage',
  crystalStorage:         'Crystal Storage',
  deuteriumStorage:       'Deuterium Storage',
  robotFactory:           'Robot Factory',
  shipyard:               'Shipyard',
  researchLab:            'Research Lab',
  alliance:               'Alliance Depot',
  silo:                   'Silo',
  naniteFactory:          'Nanite Factory',
  terraformer:            'Terraformer',
  energy:                 'Energy Technology',
  laser:                  'Laser Technology',
  ion:                    'Ion Technology',
  hyperspace:             'Hyperspace Technology',
  plasma:                 'Plasma Technology',
  espionage:              'Espionage Technology',
  computer:               'Computer Technology',
  astrophysics:           'Astrophysics',
  intergalactic:          'Intergalactic Research Network',
  graviton:               'Graviton Technology',
  combustion:             'Combustion Drive',
  impulse:                'Impulse Drive',
  hyperspace_drive:       'Hyperspace Drive',
  weapons:                'Weapons Technology',
  shielding:              'Shielding Technology',
  armour:                 'Armour Technology',
  lightFighter:           'Light Fighter',
  heavyFighter:           'Heavy Fighter',
  cruiser:                'Cruiser',
  battleship:             'Battleship',
  battlecruiser:          'Battlecruiser',
  bomber:                 'Bomber',
  destroyer:              'Destroyer',
  deathstar:              'Deathstar',
  smallCargo:             'Small Cargo',
  largeCargo:             'Large Cargo',
  colony:                 'Colony Ship',
  recycler:               'Recycler',
  espionageProbe:         'Espionage Probe',
  solarSatellite:         'Solar Satellite',
  rocketLauncher:         'Rocket Launcher',
  lightLaser:             'Light Laser',
  heavyLaser:             'Heavy Laser',
  gauss:                  'Gauss Cannon',
  ionCannon:              'Ion Cannon',
  plasmaTurret:           'Plasma Turret',
  smallShield:            'Small Shield Dome',
  largeShield:            'Large Shield Dome',
  antiballisticMissile:   'Anti-Ballistic Missiles',
  interplanetaryMissile:  'Interplanetary Missiles',
  lunarBase:              'Lunar Base',
  phalanx:                'Phalanx',
  spaceDock:              'Space Dock',
  marketplace:            'Marketplace',
  lunarSunshade:          'Lunar Sunshade',
  lunarBeam:              'Lunar Beam',
  jumpGate:               'Jump Gate',
  moonShield:             'Moon Shield',
};

// Each entry: {key, category, difficulty, requirements: [{key, level}]}
// key maps to info[key].tech (bool) in the technology page.
// requirement key maps to info[key].level for the level check.
const technologyList = [
  // Planet Buildings
  {key: 'metalMine',             category: 'Planet Building',  difficulty: 1,  requirements: []},
  {key: 'crystalMine',           category: 'Planet Building',  difficulty: 1,  requirements: []},
  {key: 'deuteriumMine',         category: 'Planet Building',  difficulty: 1,  requirements: []},
  {key: 'solarPlant',            category: 'Planet Building',  difficulty: 1,  requirements: []},
  {key: 'fusionReactor',         category: 'Planet Building',  difficulty: 4,  requirements: [{key: 'deuteriumMine', level: 5}, {key: 'energy', level: 3}]},
  {key: 'metalStorage',          category: 'Planet Building',  difficulty: 1,  requirements: []},
  {key: 'crystalStorage',        category: 'Planet Building',  difficulty: 1,  requirements: []},
  {key: 'deuteriumStorage',      category: 'Planet Building',  difficulty: 1,  requirements: []},
  // Planet Facilities
  {key: 'robotFactory',          category: 'Planet Facility',  difficulty: 1,  requirements: []},
  {key: 'shipyard',              category: 'Planet Facility',  difficulty: 2,  requirements: [{key: 'robotFactory', level: 2}]},
  {key: 'researchLab',           category: 'Planet Facility',  difficulty: 1,  requirements: []},
  {key: 'alliance',              category: 'Planet Facility',  difficulty: 2,  requirements: []},
  {key: 'silo',                  category: 'Planet Facility',  difficulty: 3,  requirements: [{key: 'shipyard', level: 1}]},
  {key: 'naniteFactory',         category: 'Planet Facility',  difficulty: 8,  requirements: [{key: 'robotFactory', level: 10}, {key: 'computer', level: 10}]},
  {key: 'terraformer',           category: 'Planet Facility',  difficulty: 9,  requirements: [{key: 'naniteFactory', level: 1}, {key: 'energy', level: 12}]},
  // Research
  {key: 'energy',                category: 'Investigation',    difficulty: 2,  requirements: [{key: 'researchLab', level: 1}]},
  {key: 'laser',                 category: 'Investigation',    difficulty: 3,  requirements: [{key: 'researchLab', level: 1}, {key: 'energy', level: 2}]},
  {key: 'ion',                   category: 'Investigation',    difficulty: 5,  requirements: [{key: 'researchLab', level: 4}, {key: 'energy', level: 4}, {key: 'laser', level: 5}]},
  {key: 'hyperspace',            category: 'Investigation',    difficulty: 6,  requirements: [{key: 'researchLab', level: 7}, {key: 'energy', level: 5}, {key: 'shielding', level: 5}]},
  {key: 'plasma',                category: 'Investigation',    difficulty: 7,  requirements: [{key: 'researchLab', level: 4}, {key: 'energy', level: 8}, {key: 'laser', level: 10}, {key: 'ion', level: 8}]},
  {key: 'espionage',             category: 'Investigation',    difficulty: 3,  requirements: [{key: 'researchLab', level: 3}]},
  {key: 'computer',              category: 'Investigation',    difficulty: 2,  requirements: [{key: 'researchLab', level: 1}]},
  {key: 'astrophysics',          category: 'Investigation',    difficulty: 4,  requirements: [{key: 'researchLab', level: 3}, {key: 'espionage', level: 4}, {key: 'computer', level: 2}]},
  {key: 'intergalactic',         category: 'Investigation',    difficulty: 8,  requirements: [{key: 'researchLab', level: 10}, {key: 'computer', level: 8}, {key: 'hyperspace', level: 8}]},
  {key: 'graviton',              category: 'Investigation',    difficulty: 10, requirements: [{key: 'researchLab', level: 12}]},
  {key: 'combustion',            category: 'Investigation',    difficulty: 3,  requirements: [{key: 'researchLab', level: 1}, {key: 'energy', level: 1}]},
  {key: 'impulse',               category: 'Investigation',    difficulty: 4,  requirements: [{key: 'researchLab', level: 2}, {key: 'energy', level: 2}]},
  {key: 'hyperspace_drive',      category: 'Investigation',    difficulty: 6,  requirements: [{key: 'researchLab', level: 7}, {key: 'hyperspace', level: 3}]},
  {key: 'weapons',               category: 'Investigation',    difficulty: 4,  requirements: [{key: 'researchLab', level: 4}]},
  {key: 'shielding',             category: 'Investigation',    difficulty: 5,  requirements: [{key: 'researchLab', level: 6}, {key: 'energy', level: 3}]},
  {key: 'armour',                category: 'Investigation',    difficulty: 3,  requirements: [{key: 'researchLab', level: 2}]},
  // Ships
  {key: 'lightFighter',          category: 'Ship',             difficulty: 3,  requirements: [{key: 'shipyard', level: 1}, {key: 'combustion', level: 1}]},
  {key: 'heavyFighter',          category: 'Ship',             difficulty: 3,  requirements: [{key: 'shipyard', level: 3}, {key: 'impulse', level: 2}, {key: 'armour', level: 2}]},
  {key: 'cruiser',               category: 'Ship',             difficulty: 5,  requirements: [{key: 'shipyard', level: 5}, {key: 'impulse', level: 4}, {key: 'ion', level: 2}]},
  {key: 'battleship',            category: 'Ship',             difficulty: 6,  requirements: [{key: 'shipyard', level: 7}, {key: 'hyperspace_drive', level: 4}]},
  {key: 'battlecruiser',         category: 'Ship',             difficulty: 7,  requirements: [{key: 'shipyard', level: 8}, {key: 'hyperspace_drive', level: 5}, {key: 'laser', level: 12}, {key: 'hyperspace', level: 5}]},
  {key: 'bomber',                category: 'Ship',             difficulty: 8,  requirements: [{key: 'shipyard', level: 8}, {key: 'impulse', level: 6}, {key: 'plasma', level: 5}]},
  {key: 'destroyer',             category: 'Ship',             difficulty: 9,  requirements: [{key: 'shipyard', level: 9}, {key: 'hyperspace_drive', level: 6}, {key: 'hyperspace', level: 5}]},
  {key: 'deathstar',             category: 'Ship',             difficulty: 10, requirements: [{key: 'shipyard', level: 12}, {key: 'hyperspace_drive', level: 7}, {key: 'graviton', level: 1}, {key: 'hyperspace', level: 6}]},
  {key: 'smallCargo',            category: 'Ship',             difficulty: 3,  requirements: [{key: 'shipyard', level: 2}, {key: 'combustion', level: 2}]},
  {key: 'largeCargo',            category: 'Ship',             difficulty: 5,  requirements: [{key: 'shipyard', level: 4}, {key: 'combustion', level: 6}]},
  {key: 'colony',                category: 'Ship',             difficulty: 4,  requirements: [{key: 'shipyard', level: 4}, {key: 'impulse', level: 3}]},
  {key: 'recycler',              category: 'Ship',             difficulty: 5,  requirements: [{key: 'shipyard', level: 4}, {key: 'combustion', level: 6}, {key: 'shielding', level: 2}]},
  {key: 'espionageProbe',        category: 'Ship',             difficulty: 3,  requirements: [{key: 'shipyard', level: 3}, {key: 'combustion', level: 3}, {key: 'espionage', level: 2}]},
  {key: 'solarSatellite',        category: 'Ship',             difficulty: 2,  requirements: [{key: 'shipyard', level: 1}]},
  // Defence
  {key: 'rocketLauncher',        category: 'Defence',          difficulty: 2,  requirements: [{key: 'shipyard', level: 1}]},
  {key: 'lightLaser',            category: 'Defence',          difficulty: 3,  requirements: [{key: 'shipyard', level: 2}, {key: 'laser', level: 3}]},
  {key: 'heavyLaser',            category: 'Defence',          difficulty: 5,  requirements: [{key: 'shipyard', level: 4}, {key: 'laser', level: 6}, {key: 'energy', level: 3}]},
  {key: 'gauss',                 category: 'Defence',          difficulty: 6,  requirements: [{key: 'shipyard', level: 6}, {key: 'weapons', level: 3}, {key: 'energy', level: 6}, {key: 'shielding', level: 1}]},
  {key: 'ionCannon',             category: 'Defence',          difficulty: 5,  requirements: [{key: 'shipyard', level: 4}, {key: 'ion', level: 4}]},
  {key: 'plasmaTurret',          category: 'Defence',          difficulty: 8,  requirements: [{key: 'shipyard', level: 8}, {key: 'plasma', level: 7}, {key: 'armour', level: 6}]},
  {key: 'smallShield',           category: 'Defence',          difficulty: 5,  requirements: [{key: 'shipyard', level: 1}, {key: 'shielding', level: 2}]},
  {key: 'largeShield',           category: 'Defence',          difficulty: 6,  requirements: [{key: 'shipyard', level: 6}, {key: 'shielding', level: 6}]},
  {key: 'antiballisticMissile',  category: 'Defence',          difficulty: 4,  requirements: [{key: 'silo', level: 2}]},
  {key: 'interplanetaryMissile', category: 'Defence',          difficulty: 5,  requirements: [{key: 'silo', level: 4}, {key: 'impulse', level: 1}]},
  // Lunar Facilities
  {key: 'lunarBase',             category: 'Lunar Facility',   difficulty: 6,  requirements: []},
  {key: 'phalanx',               category: 'Lunar Facility',   difficulty: 7,  requirements: [{key: 'lunarBase', level: 3}]},
  {key: 'spaceDock',             category: 'Lunar Facility',   difficulty: 6,  requirements: [{key: 'lunarBase', level: 1}]},
  {key: 'marketplace',           category: 'Lunar Facility',   difficulty: 9,  requirements: [{key: 'lunarBase', level: 2}, {key: 'computer', level: 8}, {key: 'alliance', level: 4}]},
  {key: 'lunarSunshade',         category: 'Lunar Facility',   difficulty: 7,  requirements: [{key: 'lunarBase', level: 1}, {key: 'laser', level: 12}]},
  {key: 'lunarBeam',             category: 'Lunar Facility',   difficulty: 7,  requirements: [{key: 'lunarBase', level: 1}, {key: 'ion', level: 12}]},
  {key: 'jumpGate',              category: 'Lunar Facility',   difficulty: 9,  requirements: [{key: 'lunarBase', level: 1}, {key: 'hyperspace', level: 7}]},
  {key: 'moonShield',            category: 'Lunar Facility',   difficulty: 10, requirements: [{key: 'lunarBase', level: 4}, {key: 'graviton', level: 1}, {key: 'shielding', level: 12}]},
];

// Base resource costs for all ships and defenses (puntos = metal+crystal+deuterium, except solarSatellite).
// Flying ships also carry: carga (cargo), consumo (deuterium/h), speed {base, drive, factor}.
// drive: 'combustion'|'impulse'|'hyperspace'. upgradeDrive/upgradeFactor/upgradeThreshold: conditional drive upgrade.
const rawCosts = {
  lightFighter:          {metal: 3000,    crystal: 1000,    deuterium: 0,        puntos: 4000,      carga: 50,      consumo: 10,  speed: {base: 12500,     drive: 'combustion', factor: 1250}},
  heavyFighter:          {metal: 6000,    crystal: 4000,    deuterium: 0,        puntos: 10000,     carga: 100,     consumo: 20,  speed: {base: 10000,     drive: 'impulse',    factor: 2000}},
  cruiser:               {metal: 20000,   crystal: 7000,    deuterium: 2000,     puntos: 29000,     carga: 800,     consumo: 150, speed: {base: 15000,     drive: 'impulse',    factor: 3000}},
  battleship:            {metal: 45000,   crystal: 15000,   deuterium: 0,        puntos: 60000,     carga: 1500,    consumo: 250, speed: {base: 10000,     drive: 'hyperspace', factor: 3000}},
  battlecruiser:         {metal: 30000,   crystal: 40000,   deuterium: 15000,    puntos: 85000,     carga: 750,     consumo: 120, speed: {base: 10000,     drive: 'hyperspace', factor: 3000}},
  bomber:                {metal: 50000,   crystal: 25000,   deuterium: 15000,    puntos: 90000,     carga: 500,     consumo: 500, speed: {base: 4000,      drive: 'impulse',    factor: 800,  upgradeDrive: 'hyperspace', upgradeFactor: 1200, upgradeThreshold: 8}},
  destroyer:             {metal: 60000,   crystal: 50000,   deuterium: 15000,    puntos: 125000,    carga: 2000,    consumo: 500, speed: {base: 5000,      drive: 'hyperspace', factor: 1500}},
  deathstar:             {metal: 5000000, crystal: 4000000, deuterium: 1000000,  puntos: 10000000,  carga: 1000000, consumo: 1,   speed: {base: 100,       drive: 'hyperspace', factor: 30}},
  smallCargo:            {metal: 2000,    crystal: 2000,    deuterium: 0,        puntos: 4000,      carga: 5000,    consumo: 5,   speed: {base: 5000,      drive: 'combustion', factor: 500,  upgradeDrive: 'impulse',    upgradeFactor: 1000, upgradeThreshold: 5}},
  largeCargo:            {metal: 6000,    crystal: 6000,    deuterium: 0,        puntos: 12000,     carga: 25000,   consumo: 25,  speed: {base: 7500,      drive: 'impulse',    factor: 1500}},
  colony:                {metal: 10000,   crystal: 20000,   deuterium: 10000,    puntos: 40000,     carga: 7500,    consumo: 500, speed: {base: 2500,      drive: 'impulse',    factor: 500}},
  recycler:              {metal: 10000,   crystal: 6000,    deuterium: 2000,     puntos: 18000,     carga: 20000,   consumo: 150, speed: {base: 2000,      drive: 'impulse',    factor: 400}},
  espionageProbe:        {metal: 0,       crystal: 1000,    deuterium: 0,        puntos: 1000,      carga: 0,       consumo: 0,   speed: {base: 100000000, drive: 'combustion', factor: 10000000}},
  solarSatellite:        {metal: 0,       crystal: 2000,    deuterium: 500,      puntos: 2000},
  rocketLauncher:        {metal: 2000,    crystal: 0,       deuterium: 0,        puntos: 2000},
  lightLaser:            {metal: 1500,    crystal: 500,     deuterium: 0,        puntos: 2000},
  heavyLaser:            {metal: 6000,    crystal: 2000,    deuterium: 0,        puntos: 8000},
  gauss:                 {metal: 20000,   crystal: 15000,   deuterium: 0,        puntos: 35000},
  ion:                   {metal: 2000,    crystal: 6000,    deuterium: 0,        puntos: 8000},
  plasma:                {metal: 50000,   crystal: 50000,   deuterium: 30000,    puntos: 130000},
  smallShield:           {metal: 10000,   crystal: 10000,   deuterium: 0,        puntos: 20000},
  largeShield:           {metal: 50000,   crystal: 50000,   deuterium: 0,        puntos: 100000},
  antiballisticMissile:  {metal: 8000,    crystal: 0,       deuterium: 2000,     puntos: 10000},
  interplanetaryMissile: {metal: 12500,   crystal: 2500,    deuterium: 10000,    puntos: 25000,     carga: 0,       consumo: 0,   speed: {base: 1000000,   drive: 'impulse',    factor: 100000}},
};

// Single source of truth for all build/research/ship/defense tech requirements.
// build = planet buildings, research = player.research, moonBuild = moon buildings (optional).
// Defense ion/plasma use ionCannon/plasmaTurret keys to avoid conflict with research ion/plasma.
function techRequirements(build, research, moonBuild) {
  moonBuild = moonBuild || {lunarBase: 0, phalanx: 0, spaceDock: 0, marketplace: 0, lunarSunshade: 0, lunarBeam: 0, jumpGate: 0, moonShield: 0};
  let lab  = build.researchLab || 0;
  let yard = build.shipyard    || 0;
  let silo = build.silo        || 0;
  return {
    // Planet buildings
    metalMine:            true,
    crystalMine:          true,
    deuteriumMine:        true,
    solarPlant:           true,
    fusionReactor:        (build.deuteriumMine || 0) >= 5 && research.energy >= 3,
    metalStorage:         true,
    crystalStorage:       true,
    deuteriumStorage:     true,
    robotFactory:         true,
    shipyard:             (build.robotFactory || 0) >= 2,
    researchLab:          true,
    alliance:             true,
    silo:                 yard >= 1,
    naniteFactory:        (build.robotFactory || 0) >= 10 && research.computer >= 10,
    terraformer:          (build.naniteFactory || 0) >= 1 && research.energy >= 12,
    solarSatellite:       yard >= 1,

    // Moon buildings
    lunarBase:            true,
    phalanx:              moonBuild.lunarBase >= 3,
    spaceDock:            moonBuild.lunarBase >= 1,
    marketplace:          moonBuild.lunarBase >= 2 && research.computer >= 8 && (build.alliance || 0) >= 4,
    lunarSunshade:        moonBuild.lunarBase >= 1 && research.laser >= 12,
    lunarBeam:            moonBuild.lunarBase >= 1 && research.ion >= 12,
    jumpGate:             moonBuild.lunarBase >= 1 && research.hyperspace >= 7,
    moonShield:           moonBuild.lunarBase >= 4 && research.graviton >= 1 && research.shielding >= 12,

    // Research technologies
    energy:               lab >= 1,
    laser:                lab >= 1 && research.energy >= 2,
    ion:                  lab >= 4 && research.energy >= 4 && research.laser >= 5,
    hyperspace:           lab >= 7 && research.energy >= 5 && research.shielding >= 5,
    plasma:               lab >= 4 && research.energy >= 8 && research.laser >= 10 && research.ion >= 8,
    espionage:            lab >= 3,
    computer:             lab >= 1,
    astrophysics:         lab >= 3 && research.espionage >= 4 && research.computer >= 2,
    intergalactic:        lab >= 10 && research.computer >= 8 && research.hyperspace >= 8,
    graviton:             lab >= 12,
    combustion:           lab >= 1 && research.energy >= 1,
    impulse:              lab >= 2 && research.energy >= 2,
    hyperspace_drive:     lab >= 7 && research.hyperspace >= 3,
    weapons:              lab >= 4,
    shielding:            lab >= 6 && research.energy >= 3,
    armour:               lab >= 2,

    // Ships
    lightFighter:         yard >= 1 && research.combustion >= 1,
    heavyFighter:         yard >= 3 && research.impulse >= 2 && research.armour >= 2,
    cruiser:              yard >= 5 && research.impulse >= 4 && research.ion >= 2,
    battleship:           yard >= 7 && research.hyperspace_drive >= 4,
    battlecruiser:        yard >= 8 && research.hyperspace_drive >= 5 && research.laser >= 12 && research.hyperspace >= 5,
    bomber:               yard >= 8 && research.impulse >= 6 && research.plasma >= 5,
    destroyer:            yard >= 9 && research.hyperspace_drive >= 6 && research.hyperspace >= 5,
    deathstar:            yard >= 12 && research.hyperspace_drive >= 7 && research.graviton >= 1 && research.hyperspace >= 6,
    smallCargo:           yard >= 2 && research.combustion >= 2,
    largeCargo:           yard >= 4 && research.combustion >= 6,
    colony:               yard >= 4 && research.impulse >= 3,
    recycler:             yard >= 4 && research.combustion >= 6 && research.shielding >= 2,
    espionageProbe:       yard >= 3 && research.combustion >= 3 && research.espionage >= 2,

    // Defenses (ionCannon/plasmaTurret to avoid clash with research ion/plasma keys)
    rocketLauncher:       yard >= 1,
    lightLaser:           yard >= 2 && research.laser >= 3,
    heavyLaser:           yard >= 4 && research.laser >= 6 && research.energy >= 3,
    gauss:                yard >= 6 && research.weapons >= 3 && research.energy >= 6 && research.shielding >= 1,
    ionCannon:            yard >= 4 && research.ion >= 4,
    plasmaTurret:         yard >= 8 && research.plasma >= 7 && research.armour >= 6,
    smallShield:          yard >= 1 && research.shielding >= 2,
    largeShield:          yard >= 6 && research.shielding >= 6,
    antiballisticMissile: silo >= 2,
    interplanetaryMissile: silo >= 4 && research.impulse >= 1,
  };
}

var costs = {

  rawCosts: rawCosts,
  names: names,
  technologyList: technologyList,

  techRequirements: techRequirements,

  costBuildings: function(player, planet) {
    let build = player.planets[planet].buildings;
    let tech  = techRequirements(build, player.research);
    let energyAux = {metal: Math.floor(10*(build.metalMine+1)*Math.pow(1.1, (build.metalMine+1))), crystal: Math.floor(10*(build.crystalMine+1)*Math.pow(1.1, (build.crystalMine+1))), deuterium: Math.floor(20*(build.deuteriumMine+1)*Math.pow(1.1, (build.deuteriumMine+1)))};
    return {metalMine: {metal: Math.floor(60*Math.pow(1.5, build.metalMine)), crystal: Math.floor(15*Math.pow(1.5, build.metalMine)), deuterium: 0, energy: energyAux.metal, energyNeed: energyAux.metal-Math.floor(10*(build.metalMine)*Math.pow(1.1, (build.metalMine))), tech: tech.metalMine, level: build.metalMine, name: "Metal Mine", description: "Used in the extraction of metal ore, metal mines are of primary importance to all emerging and established empires."},
            crystalMine: {metal: Math.floor(48*Math.pow(1.6, build.crystalMine)), crystal: Math.floor(24*Math.pow(1.6, build.crystalMine)), deuterium: 0, energy: energyAux.crystal, energyNeed: energyAux.crystal-Math.floor(10*(build.crystalMine)*Math.pow(1.1, (build.crystalMine))), tech: tech.crystalMine, level: build.crystalMine, name: "Crystal Mine", description: "Crystals are the main resource used to build electronic circuits and form certain alloy compounds."},
            deuteriumMine: {metal: Math.floor(225*Math.pow(1.5, build.deuteriumMine)), crystal: Math.floor(75*Math.pow(1.5, build.deuteriumMine)), deuterium: 0, energy: energyAux.deuterium, energyNeed: energyAux.deuterium-Math.floor(20*(build.deuteriumMine)*Math.pow(1.1, (build.deuteriumMine))), tech: tech.deuteriumMine, level: build.deuteriumMine, name: "Deuterium Synthesizer", description: "Deuterium Synthesizers draw the trace Deuterium content from the water on a planet."},
            solarPlant: {metal: Math.floor(75*Math.pow(1.5, build.solarPlant)), crystal: Math.floor(30*Math.pow(1.5, build.solarPlant)), deuterium: 0, energy: 0, tech: tech.solarPlant, level: build.solarPlant, name: "Solar Plant", description: "Solar power plants absorb energy from solar radiation. All mines need energy to operate."},
            fusionReactor: {metal: Math.floor(900*Math.pow(1.8, build.fusionReactor)), crystal: Math.floor(360*Math.pow(1.8, build.fusionReactor)), deuterium: Math.floor(180*Math.pow(1.8, build.fusionReactor)), energy: 0, tech: tech.fusionReactor, level: build.fusionReactor, name: "Fusion Reactor", description: "The fusion reactor uses deuterium to produce energy."},
            metalStorage: {metal: 1000*Math.pow(2, build.metalStorage), crystal: 0, deuterium: 0, energy: 0, tech: tech.metalStorage, level: build.metalStorage, name: "Metal Storage", description: "Provides storage for excess metal."},
            crystalStorage: {metal: 1000*Math.pow(2, build.crystalStorage), crystal: 500*Math.pow(2, build.crystalStorage), deuterium: 0, energy: 0, tech: tech.crystalStorage, level: build.crystalStorage, name: "Crystal Storage", description: "Provides storage for excess crystal."},
            deuteriumStorage: {metal: 1000*Math.pow(2, build.deuteriumStorage), crystal: 1000*Math.pow(2, build.deuteriumStorage), deuterium: 0, energy: 0, tech: tech.deuteriumStorage, level: build.deuteriumStorage, name: "Deuterium Storage", description: "Giant tanks for storing newly-extracted deuterium."},
            robotFactory: {metal: 400*Math.pow(2, build.robotFactory), crystal: 120*Math.pow(2, build.robotFactory), deuterium: 200*Math.pow(2, build.robotFactory), energy: 0, tech: tech.robotFactory, level: build.robotFactory, name: "Robotics Factory", description: "Robotic factories provide construction robots to aid in the construction of buildings. Each level increases the speed of the upgrade of buildings."},
            shipyard: {metal: 400*Math.pow(2, build.shipyard), crystal: 200*Math.pow(2, build.shipyard), deuterium: 100*Math.pow(2, build.shipyard), energy: 0, tech: tech.shipyard, level: build.shipyard, name: "Shipyard", description: "All types of ships and defensive facilities are built in the planetary shipyard."},
            researchLab: {metal: 200*Math.pow(2, build.researchLab), crystal: 400*Math.pow(2, build.researchLab), deuterium: 200*Math.pow(2, build.researchLab), energy: 0, tech: tech.researchLab, level: build.researchLab, name: "Research Lab", description: "A research lab is required in order to conduct research into new technologies."},
            alliance: {metal: 20000*Math.pow(2, build.alliance), crystal: 40000*Math.pow(2, build.alliance), deuterium: 0, energy: 0, tech: tech.alliance, level: build.alliance, name: "Alliance Depot", description: "The alliance depot is essential to trade resourses on a moon."},
            silo: {metal: 20000*Math.pow(2, build.silo), crystal: 20000*Math.pow(2, build.silo), deuterium: 1000*Math.pow(2, build.silo), energy: 0, tech: tech.silo, level: build.silo, name: "Silo", description: "Missile silos are used to store missiles."},
            naniteFactory: {metal: 1000000*Math.pow(2, build.naniteFactory), crystal: 500000*Math.pow(2, build.naniteFactory), deuterium: 100000*Math.pow(2, build.naniteFactory), energy: 0, tech: tech.naniteFactory, level: build.naniteFactory, name: "Nanite Factory", description: "This is the ultimate in robotics technology. Each level cuts the construction time for buildings, ships, and defenses."},
            terraformer: {metal: 0, crystal: 50000*Math.pow(2, build.terraformer), deuterium: 100000*Math.pow(2, build.terraformer), energy: 0, tech: tech.terraformer, level: build.terraformer, name: "Terraformer", description: "The terraformer increases the usable surface of planets."},
            solarSatellite: {metal: 0, crystal: 2000, deuterium: 500, energy: 0, tech: tech.solarSatellite, level: player.planets[planet].fleet.solarSatellite, name: "Solar Satellite", description: "Solar satellites are simple platforms of solar cells, located in a high, stationary orbit. A solar satellite produces " + Math.floor(((player.planets[planet].temperature.max + player.planets[planet].temperature.min)/2+160)/6) + " energy on this planet."},
            listInfo: ["metalMine", "crystalMine", "deuteriumMine", "solarPlant", "fusionReactor", "solarSatellite", "metalStorage", "crystalStorage", "deuteriumStorage", "robotFactory", "shipyard", "researchLab", "alliance", "silo", "naniteFactory", "terraformer"],
            time: {mult: build.robotFactory, elev: build.naniteFactory},
            doing: player.planets[planet].buildingConstrucction
    };
  },

  costMoon: function(player, planet) {
    let moonBuild = player.planets[planet].moon.buildings;
    let build     = player.planets[planet].buildings;
    let tech      = techRequirements(build, player.research, moonBuild);
    return {lunarBase: {metal: 10000*Math.pow(2, moonBuild.lunarBase), crystal: 20000*Math.pow(2, moonBuild.lunarBase), deuterium: 10000*Math.pow(2, moonBuild.lunarBase), energy: 0, tech: tech.lunarBase, level: moonBuild.lunarBase, name: "Lunar Base", description: "Since the moon has no atmosphere, a lunar base is required to generate habitable space."},
            phalanx: {metal: 20000*Math.pow(2, moonBuild.phalanx), crystal: 40000*Math.pow(2, moonBuild.phalanx), deuterium: 20000*Math.pow(2, moonBuild.phalanx), energy: 0, tech: tech.phalanx, level: moonBuild.phalanx, name: "Phalanx", description: "Using the sensor phalanx, fleets of other empires can be discovered and observed. The bigger the sensor phalanx array, the larger the range it can scan."},
            spaceDock: {metal: 10000*Math.pow(3, moonBuild.spaceDock), crystal: 1000*Math.pow(2, moonBuild.spaceDock), deuterium: 5000*Math.pow(3, moonBuild.spaceDock), energy: 0, tech: tech.spaceDock, level: moonBuild.spaceDock, name: "Space Dock", description: "Wreckages can be repaired in the Space Dock."},
            marketplace: {metal: 6000000*Math.pow(2, moonBuild.marketplace), crystal: 4000000*Math.pow(2, moonBuild.marketplace), deuterium: 2000000*Math.pow(2, moonBuild.marketplace), energy: 0, tech: tech.marketplace, level: moonBuild.marketplace, name: "Marketplace", description: "The place for change resources with other empires, recolectors or even mysterious and dangerous people."},
            lunarSunshade: {metal: 15000*Math.pow(2, moonBuild.lunarSunshade), crystal: 0, deuterium: 50000*Math.pow(2, moonBuild.lunarSunshade), energy: 0, tech: tech.lunarSunshade, level: moonBuild.lunarSunshade, name: "Lunar Sunshade", description: "The system that get cold your planet. For each level you can reduce 3 degrees the minimun temperature from your planet, growing up the deuterium producction but getting worse the energy levels."},
            lunarBeam: {metal: 0, crystal: 70000*Math.pow(2, moonBuild.lunarBeam), deuterium: 90000*Math.pow(2, moonBuild.lunarBeam), energy: 0, tech: tech.lunarBeam, level: moonBuild.lunarBeam, name: "Lunar Beam", description: "The system that warn your planet. For each level you can reduce 3 degrees the maximun temperature from your planet. The solar satellites will improve the energy."},
            jumpGate: {metal: 2000000*Math.pow(2, moonBuild.jumpGate), crystal: 4000000*Math.pow(2, moonBuild.jumpGate), deuterium: 2000000*Math.pow(2, moonBuild.jumpGate), energy: 0, tech: tech.jumpGate, level: moonBuild.jumpGate, name: "Jump Gate", description: "Jump gates are huge transceivers capable of sending even the biggest fleet in no time to a distant jump gate."},
            moonShield: {metal: 9000000*Math.pow(3, moonBuild.moonShield), crystal: 5000000*Math.pow(3, moonBuild.moonShield), deuterium: 2000000*Math.pow(3, moonBuild.moonShield), energy: 0, tech: tech.moonShield, level: moonBuild.moonShield, name: "Moon Shield", description: "The ultimate defense system. Even the deathstar be afraid of the shield."},
            listInfo: ["lunarBase", "phalanx", "spaceDock", "marketplace", "lunarSunshade", "lunarBeam", "jumpGate", "moonShield"],
            time: {mult: moonBuild.lunarBase, elev: player.planets[planet].buildings.naniteFactory},
            doing: player.planets[planet].moon.buildingConstrucction
    };
  },

  costResearch: function(player, lab) {
    let research = player.research;
    let tech     = techRequirements({researchLab: lab}, research);
    return {energy: {metal: 0, crystal: 800*Math.pow(2, research.energy), deuterium: 400*Math.pow(2, research.energy), energy: 0, tech: tech.energy, level: research.energy, name: "Energy Technology", description: "The command of different types of energy is necessary for many new technologies."},
            laser: {metal: 200*Math.pow(2, research.laser), crystal: 100*Math.pow(2, research.laser), deuterium: 0, energy: 0, tech: tech.laser, level: research.laser, name: "Laser Technology", description: "Focusing light produces a beam that causes damage when it strikes an object."},
            ion: {metal: 1000*Math.pow(2, research.ion), crystal: 300*Math.pow(2, research.ion), deuterium: 100*Math.pow(2, research.ion), energy: 0, tech: tech.ion, level: research.ion, name: "Ion Technology", description: "The concentration of ions allows for the construction of cannons, which can inflict enormous damage."},
            hyperspace: {metal: 0, crystal: 4000*Math.pow(2, research.hyperspace), deuterium: 2000*Math.pow(2, research.hyperspace), energy: 0, tech: tech.hyperspace, level: research.hyperspace, name: "Hyperspace Technology", description: "By integrating the 4th and 5th dimensions it is now possible to research a new kind of drive that is more economical and efficient."},
            plasma: {metal: 2000*Math.pow(2, research.plasma), crystal: 4000*Math.pow(2, research.plasma), deuterium: 1000*Math.pow(2, research.plasma), energy: 0, tech: tech.plasma, level: research.plasma, name: "Plasma Technology", description: "A further development of ion technology which accelerates high-energy plasma, which then inflicts devastating damage and additionally optimises the production of resources."},
            espionage: {metal: 200*Math.pow(2, research.espionage), crystal: 1000*Math.pow(2, research.espionage), deuterium: 200*Math.pow(2, research.espionage), energy: 0, tech: tech.espionage, level: research.espionage, name: "Espionage Technology", description: "Information about other planets and moons can be gained using this technology."},
            computer: {metal: 0, crystal: 400*Math.pow(2, research.computer), deuterium: 600*Math.pow(2, research.computer), energy: 0, tech: tech.computer, level: research.computer, name: "Computer Technology", description: "More fleets can be commanded by increasing computer capacities. Each level of computer technology increases the maximum number of fleets by one."},
            astrophysics: {metal: 4000*Math.pow(2, research.astrophysics), crystal: 8000*Math.pow(2, research.astrophysics), deuterium: 4000*Math.pow(2, research.astrophysics), energy: 0, tech: tech.astrophysics, level: research.astrophysics, name: "Astrophysics", description: "With an astrophysics research module, ships can undertake long expeditions. Every second level of this technology will allow you to colonise an extra planet."},
            intergalactic: {metal: 240000*Math.pow(2, research.intergalactic), crystal: 400000*Math.pow(2, research.intergalactic), deuterium: 160000*Math.pow(2, research.intergalactic), energy: 0, tech: tech.intergalactic, level: research.intergalactic, name: "Intergalactic Research Network", description: "Researchers on different planets communicate via this network."},
            graviton: {metal: 0, crystal: 0, deuterium: 0, energy: 300000*Math.pow(2, research.graviton), tech: tech.graviton, level: research.graviton, name: "Graviton Technology", description: "Firing a concentrated charge of graviton particles can create an artificial gravity field, which can destroy ships or even moons."},
            combustion: {metal: 400*Math.pow(2, research.combustion), crystal: 0, deuterium: 600*Math.pow(2, research.combustion), energy: 0, tech: tech.combustion, level: research.combustion, name: "Combustion Drive", description: "The development of this drive makes some ships faster, although each level increases speed by only 10 % of the base value."},
            impulse: {metal: 2000*Math.pow(2, research.impulse), crystal: 4000*Math.pow(2, research.impulse), deuterium: 600*Math.pow(2, research.impulse), energy: 0, tech: tech.impulse, level: research.impulse, name: "Impulse Drive", description: "The impulse drive is based on the reaction principle. Further development of this drive makes some ships faster, although each level increases speed by only 20 % of the base value."},
            hyperspace_drive: {metal: 10000*Math.pow(2, research.hyperspace_drive), crystal: 20000*Math.pow(2, research.hyperspace_drive), deuterium: 6000*Math.pow(2, research.hyperspace_drive), energy: 0, tech: tech.hyperspace_drive, level: research.hyperspace, name: "Hyperspace Drive", description: "Hyperspace drive warps space around a ship. The development of this drive makes some ships faster, although each level increases speed by only 30 % of the base value."},
            weapons: {metal: 800*Math.pow(2, research.weapons), crystal: 200*Math.pow(2, research.weapons), deuterium: 0, energy: 0, tech: tech.weapons, level: research.weapons, name: "Weapons Technology", description: "Weapons technology makes weapons systems more efficient. Each level of weapons technology increases the weapon strength of units by 10 % of the base value."},
            shielding: {metal: 200*Math.pow(2, research.shielding), crystal: 600*Math.pow(2, research.shielding), deuterium: 0, energy: 0, tech: tech.shielding, level: research.shielding, name: "Shielding Technology", description: "Shielding technology makes the shields on ships and defensive facilities more efficient. Each level of shield technology increases the strength of the shields by 10 % of the base value."},
            armour: {metal: 1000*Math.pow(2, research.armour), crystal: 0, deuterium: 0, energy: 0, tech: tech.armour, level: research.armour, name: "Armour Technology", description: "Special alloys improve the armour on ships and defensive structures. The effectiveness of the armour can be increased by 10 % per level."},
            listInfo: ["energy", "laser", "ion", "hyperspace", "plasma", "combustion", "impulse", "hyperspace_drive", "espionage", "computer", "astrophysics", "intergalactic", "graviton", "weapons", "shielding", "armour"],
            time: {mult: lab, elev: research.intergalactic},
            doing: player.researchConstrucction
    };
  },

  costShipyard: function(player, planet, moon) {
    let fleet  = (moon) ? player.planets[planet].moon.fleet : player.planets[planet].fleet;
    let build  = player.planets[planet].buildings;
    let tech   = techRequirements(build, player.research);
    let tempEnergy = Math.floor(((player.planets[planet].temperature.max + player.planets[planet].temperature.min)/2+160)/6);
    return {lightFighter: {metal: 3000, crystal: 1000, deuterium: 0, energy: 0, tech: tech.lightFighter, level: fleet.lightFighter, name: "Light Fighter", description: "This is the first fighting ship all emperors will build. The light fighter is an agile ship, but vulnerable on its own. In mass numbers, they can become a great threat to any empire. They are the first to accompany small and large cargoes to hostile planets with minor defenses."},
            heavyFighter: {metal: 6000, crystal: 4000, deuterium: 0, energy: 0, tech: tech.heavyFighter, level: fleet.heavyFighter, name: "Heavy Fighter", description: "This fighter is better armoured and has a higher attack strength than the light fighter."},
            cruiser: {metal: 20000, crystal: 7000, deuterium: 2000, energy: 0, tech: tech.cruiser, level: fleet.cruiser, name: "Cruiser", description: "Cruisers are armoured almost three times as heavily as heavy fighters and have more than twice the firepower. In addition, they are very fast."},
            battleship: {metal: 45000, crystal: 15000, deuterium: 0, energy: 0, tech: tech.battleship, level: fleet.battleship, name: "Battleship", description: "Battleships form the backbone of a fleet. Their heavy cannons, high speed, and large cargo holds make them opponents to be taken seriously."},
            battlecruiser: {metal: 30000, crystal: 40000, deuterium: 15000, energy: 0, tech: tech.battlecruiser, level: fleet.battlecruiser, name: "Battlecruiser", description: "The Battlecruiser is highly specialized in the interception of hostile fleets."},
            bomber: {metal: 50000, crystal: 25000, deuterium: 15000, energy: 0, tech: tech.bomber, level: fleet.bomber, name: "Bomber", description: "The bomber was developed especially to destroy the planetary defenses of a world."},
            destroyer: {metal: 60000, crystal: 50000, deuterium: 15000, energy: 0, tech: tech.destroyer, level: fleet.destroyer, name: "Destroyer", description: "The destroyer is the king of the warships."},
            deathstar: {metal: 5000000, crystal: 4000000, deuterium: 1000000, energy: 0, tech: tech.deathstar, level: fleet.deathstar, name: "Deathstar", description: "The destructive power of the deathstar is unsurpassed."},
            smallCargo: {metal: 2000, crystal: 2000, deuterium: 0, energy: 0, tech: tech.smallCargo, level: fleet.smallCargo, name: "Small Cargo", description: "The small cargo is an agile ship which can quickly transport resources to other planets."},
            largeCargo: {metal: 6000, crystal: 6000, deuterium: 0, energy: 0, tech: tech.largeCargo, level: fleet.largeCargo, name: "Large Cargo", description: "This cargo ship has a much larger cargo capacity than the small cargo, and is generally faster thanks to an improved drive."},
            colony: {metal: 10000, crystal: 20000, deuterium: 10000, energy: 0, tech: tech.colony, level: fleet.colony, name: "Colony Ship", description: "Vacant planets can be colonised with this ship."},
            recycler: {metal: 10000, crystal: 6000, deuterium: 2000, energy: 0, tech: tech.recycler, level: fleet.recycler, name: "Recycler", description: "Recyclers are the only ships able to harvest debris fields floating in a planet`s orbit after combat."},
            espionageProbe: {metal: 0, crystal: 1000, deuterium: 0, energy: 0, tech: tech.espionageProbe, level: fleet.espionageProbe, name: "Espionage Probe", description: "Espionage probes are small, agile drones that provide data on fleets and planets over great distances."},
            solarSatellite: {metal: 0, crystal: 2000, deuterium: 500, energy: 0, tech: tech.solarSatellite, level: fleet.solarSatellite, name: "Solar Satellite", description: "Solar satellites are simple platforms of solar cells, located in a high, stationary orbit. A solar satellite produces " + tempEnergy + " energy on this planet."},
            listInfo: ["lightFighter", "heavyFighter", "cruiser", "battleship", "battlecruiser", "bomber", "destroyer", "deathstar", "smallCargo", "largeCargo", "colony", "recycler", "espionageProbe", "solarSatellite"],
            time: {mult: build.shipyard, elev: build.naniteFactory},
            doing: player.planets[planet].shipConstrucction
    };
  },

  costDefense: function(player, planet) {
    let defense = player.planets[planet].defense;
    let build   = player.planets[planet].buildings;
    let tech    = techRequirements(build, player.research);
    return {rocketLauncher: {metal: 2000, crystal: 0, deuterium: 0, energy: 0, tech: tech.rocketLauncher, level: defense.rocketLauncher, name: "Rocket Launcher", description: "The rocket launcher is a simple, cost-effective defensive option."},
            lightLaser: {metal: 1500, crystal: 500, deuterium: 0, energy: 0, tech: tech.lightLaser, level: defense.lightLaser, name: "Light Laser", description: "Concentrated firing at a target with photons can produce significantly greater damage than standard ballistic weapons."},
            heavyLaser: {metal: 6000, crystal: 2000, deuterium: 0, energy: 0, tech: tech.heavyLaser, level: defense.heavyLaser, name: "Heavy Laser", description: "The heavy laser is the logical development of the light laser."},
            gauss: {metal: 20000, crystal: 15000, deuterium: 0, energy: 0, tech: tech.gauss, level: defense.gauss, name: "Gauss Cannon", description: "The Gauss Cannon fires projectiles weighing tons at high speeds."},
            ion: {metal: 2000, crystal: 6000, deuterium: 0, energy: 0, tech: tech.ionCannon, level: defense.ion, name: "Ion Cannon", description: "The Ion Cannon fires a continuous beam of accelerating ions, causing considerable damage to objects it strikes."},
            plasma: {metal: 50000, crystal: 50000, deuterium: 30000, energy: 0, tech: tech.plasmaTurret, level: defense.plasma, name: "Plasma Turret", description: "Plasma Turrets release the energy of a solar flare and surpass even the destroyer in destructive effect."},
            smallShield: {metal: 10000, crystal: 10000, deuterium: 0, energy: 0, tech: tech.smallShield, level: defense.smallShield, name: "Small Shield Dome", description: "The small shield dome covers an entire planet with a field which can absorb a tremendous amount of energy."},
            largeShield: {metal: 50000, crystal: 50000, deuterium: 0, energy: 0, tech: tech.largeShield, level: defense.largeShield, name: "Large Shield Dome", description: "The evolution of the small shield dome can employ significantly more energy to withstand attacks."},
            antiballisticMissile: {metal: 8000, crystal: 0, deuterium: 2000, energy: 0, tech: tech.antiballisticMissile, level: defense.antiballisticMissile, name: "Anti-Ballistic Missiles", description: "Anti-Ballistic Missiles destroy attacking interplanetary missiles"},
            interplanetaryMissile: {metal: 12500, crystal: 2500, deuterium: 10000, energy: 0, tech: tech.interplanetaryMissile, level: defense.interplanetaryMissile, name: "Interplanetary Missiles", description: "Anti-Ballistic Missiles destroy attacking interplanetary missiles"},
            listInfo: ["rocketLauncher", "lightLaser", "heavyLaser", "gauss", "ion", "plasma", "smallShield", "largeShield", "antiballisticMissile", "interplanetaryMissile"],
            time: {mult: build.shipyard, elev: build.naniteFactory},
            doing: player.planets[planet].shipConstrucction
    };
  },

  getListSpeed: function(com, imp, hyp){
    let drives = {combustion: com, impulse: imp, hyperspace: hyp};
    let ships = ['lightFighter', 'heavyFighter', 'cruiser', 'battleship', 'battlecruiser', 'bomber', 'destroyer', 'deathstar', 'smallCargo', 'largeCargo', 'colony', 'recycler', 'espionageProbe', 'interplanetaryMissile'];
    return ships.map(ship => {
      let s = rawCosts[ship].speed;
      if (s.upgradeDrive && drives[s.upgradeDrive] >= s.upgradeThreshold)
        return s.base + s.upgradeFactor * drives[s.upgradeDrive];
      return s.base + s.factor * drives[s.drive];
    });
  },

  navesInfo: function(con, imp, hyp){
    let speedList = this.getListSpeed(con, imp, hyp);
    let ships = ['lightFighter', 'heavyFighter', 'cruiser', 'battleship', 'battlecruiser', 'bomber', 'destroyer', 'deathstar', 'smallCargo', 'largeCargo', 'colony', 'recycler', 'espionageProbe', 'interplanetaryMissile'];
    let result = {};
    ships.forEach((ship, i) => {
      let key = (ship === 'interplanetaryMissile') ? 'misil' : ship;
      result[key] = {speed: speedList[i], carga: rawCosts[ship].carga, consumo: rawCosts[ship].consumo};
    });
    return result;
  },

  getTechnology: function() {
    return {
      lightFighter:  {shipyard: 1, combustion: 1},
      heavyFighter:  {shipyard: 3, impulse: 2, armour: 2},
      cruiser:       {shipyard: 5, impulse: 4, ionTech: 2},
      battleship:    {shipyard: 7, hyperspace_drive: 4},
      battlecruiser: {shipyard: 8, hyperspace_drive: 5, laser: 12, hyperspace: 5},
      bomber:        {shipyard: 8, impulse: 6, plasma: 5},
      destroyer:     {shipyard: 9, hyperspace_drive: 6, hyperspace: 5},
      deathstar:     {shipyard: 12, hyperspace_drive: 7, hyperspace: 6, graviton: 1},
      smallCargo:    {shipyard: 2, combustion: 2},
      largeCargo:    {shipyard: 4, combustion: 6},
      colony:        {shipyard: 4, impulse: 3},
      recycler:      {shipyard: 4, combustion: 6, shielding: 2},
      espionageProbe:{shipyard: 3, combustion: 3, espionage: 2},
      solarSatellite:{shipyard: 1},
      rocketLauncher:{shipyard: 1},
      lightLaser:    {shipyard: 2, laser: 3},
      heavyLaser:    {shipyard: 4, laser: 6, energy: 3},
      gauss:         {shipyard: 6, energy: 6, weapons: 3, shielding: 1},
      ion:           {shipyard: 4, ionTech: 4},
      plasma:        {shipyard: 8, plasma: 7, armour: 6},
      smallShield:   {shipyard: 1, shielding: 2},
      largeShield:   {shipyard: 6, shielding: 6},
      antiballisticMissile:  {silo: 2},
      interplanetaryMissile: {silo: 4, impulse: 1},
      metalMine:        {},
      crystalMine:      {},
      deuteriumMine:    {},
      solarPlant:       {},
      fusionReactor:    {deuteriumMine: 5, energy: 3},
      metalStorage:     {},
      crystalStorage:   {},
      deuteriumStorage: {},
      robotFactory:  {},
      shipyard:      {robotFactory: 2},
      researchLab:   {},
      alliance:      {},
      silo:          {shipyard: 1},
      naniteFactory: {robotFactory: 10, computer: 10},
      terraformer:   {naniteFactory: 1, energy: 12},
      lunarBase:     {},
      phalanx:       {lunarBase: 3},
      spaceDock:     {lunarBase: 1},
      marketplace:   {lunarBase: 2, computer: 8, alliance: 4},
      lunarSunshade: {lunarBase: 1, laser: 12},
      lunarBeam:     {lunarBase: 1, ionTech: 12},
      jumpGate:      {lunarBase: 1, hyperspace: 7},
      moonShield:    {lunarBase: 4, graviton: 1, shielding: 12},
      energy:        {researchLab: 1},
      laser:         {researchLab: 1, energy: 2},
      ionTech:       {researchLab: 4, laser: 5, energy: 4},
      hyperspace:    {researchLab: 7, energy: 5, shielding: 5},
      plasma:        {researchLab: 4, energy: 8, laser: 10, ionTech: 8},
      espionage:     {researchLab: 3},
      computer:      {researchLab: 1},
      astrophysics:  {researchLab: 3, espionage: 4, computer: 2},
      intergalactic: {researchLab: 10, computer: 8, hyperspace: 8},
      graviton:      {researchLab: 12},
      combustion:    {researchLab: 1, energy: 1},
      impulse:       {researchLab: 2, energy: 2},
      hyperspace_drive: {researchLab: 7, hyperspace: 3},
      weapons:   {researchLab: 4},
      shielding: {researchLab: 6, energy: 3},
      armour:    {researchLab: 2},
    };
  },

};

module.exports = costs;
