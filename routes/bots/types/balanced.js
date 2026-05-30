module.exports = {
  joinFleet: false,
  almacenSmart: true,
  scheduler: [{ start: 6, end: 23 }],
  missionList: [
    { type: 'building', item: 'metalMine',      level: 5,  workTogether: false },
    { type: 'building', item: 'crystalMine',    level: 4,  workTogether: false },
    { type: 'building', item: 'deuteriumMine',  level: 3,  workTogether: false },
    { type: 'building', item: 'solarPlant',     level: 5,  workTogether: false },
    { type: 'building', item: 'robotFactory',   level: 2,  workTogether: false },
    { type: 'building', item: 'shipyard',       level: 1,  workTogether: false },
    { type: 'fleet',    item: 'lightFighter',   amount: 10, workTogether: false },
    { type: 'defense',  item: 'rocketLauncher', amount: 20, workTogether: false },
    { type: 'building', item: 'metalMine',      level: 10, workTogether: false },
    { type: 'building', item: 'crystalMine',    level: 8,  workTogether: false },
    { type: 'building', item: 'deuteriumMine',  level: 6,  workTogether: false },
    { type: 'building', item: 'solarPlant',     level: 9,  workTogether: false },
    { type: 'fleet',    item: 'lightFighter',   amount: 30, workTogether: false },
    { type: 'fleet',    item: 'heavyFighter',   amount: 10, workTogether: false },
    { type: 'defense',  item: 'rocketLauncher', amount: 50, workTogether: false },
  ],
  shipRatio: { deathstar: 1, destroyer: 50, lightFighter: 200, recycler: 10 },
  research: {
    list: [
      { type: 'research', item: 'energy',     level: 2, workTogether: false },
      { type: 'research', item: 'combustion', level: 2, workTogether: false },
      { type: 'research', item: 'armour',     level: 2, workTogether: false },
      { type: 'research', item: 'weapons',    level: 2, workTogether: false },
      { type: 'research', item: 'plasma',     level: 3, workTogether: false },
      { type: 'research', item: 'weapons',    level: 4, workTogether: false },
      { type: 'research', item: 'shielding',  level: 3, workTogether: false },
    ]
  },
  attackConfig: {
    enabled: true,
    minInactiveHours: 72,
    minResources: 40000,
    maxPointRatio: 4.0,
    espionageFirst: true
  }
};
