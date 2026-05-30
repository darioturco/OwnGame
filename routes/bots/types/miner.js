module.exports = {
  // Ships on non-home planets get deployed to planet 0 after their local mission finishes
  joinFleet: false,

  // Auto-build storage (metal/crystal/deuterium) when any resource reaches 90% capacity
  almacenSmart: true,

  // Auto-build terraformer when planet has no free fields, before proceeding with missions
  fieldSmart: true,

  // Hours when the bot is active. Array of {start, end} (24h). Bot sleeps outside these windows.
  scheduler: [{ start: 0, end: 24 }],

  // Ordered list of goals executed on each planet. Bot advances to next when current is done.
  // Types: 'building' / 'research' (needs level), 'fleet' / 'defense' (needs amount), 'moon'
  missionList: [
    // Early economy foundation
    { type: 'building', item: 'solarPlant',           level: 1   },
    { type: 'building', item: 'metalMine',            level: 1   },
    { type: 'building', item: 'crystalMine',          level: 1   },
    { type: 'building', item: 'solarPlant',           level: 2   },
    { type: 'building', item: 'metalMine',            level: 2   },
    { type: 'building', item: 'crystalMine',          level: 2   },
    { type: 'building', item: 'solarPlant',           level: 3   },
    { type: 'building', item: 'metalMine',            level: 4   },
    { type: 'building', item: 'solarPlant',           level: 4   },
    { type: 'building', item: 'metalMine',            level: 5   },
    { type: 'building', item: 'crystalMine',          level: 3   },
    { type: 'building', item: 'solarPlant',           level: 5   },
    { type: 'building', item: 'metalMine',            level: 6   },
    { type: 'building', item: 'solarPlant',           level: 6   },
    { type: 'building', item: 'crystalMine',          level: 4   },
    { type: 'building', item: 'metalMine',            level: 7   },
    { type: 'building', item: 'solarPlant',           level: 7   },
    { type: 'building', item: 'deuteriumMine',        level: 1   },
    { type: 'building', item: 'metalMine',            level: 8   },
    { type: 'building', item: 'crystalMine',          level: 5   },
    { type: 'building', item: 'solarPlant',           level: 8   },
    { type: 'building', item: 'metalMine',            level: 9   },
    { type: 'building', item: 'crystalMine',          level: 6   },
    { type: 'building', item: 'solarPlant',           level: 9   },
    { type: 'building', item: 'deuteriumMine',        level: 3   },
    { type: 'building', item: 'crystalMine',          level: 7   },
    { type: 'building', item: 'solarPlant',           level: 10  },
    { type: 'building', item: 'metalMine',            level: 10  },
    { type: 'building', item: 'crystalMine',          level: 8   },

    // Basic infrastructure
    { type: 'building', item: 'robotFactory',         level: 2   },
    { type: 'building', item: 'shipyard',             level: 1   },
    { type: 'defense', item: 'rocketLauncher',        amount: 1  },
    { type: 'building', item: 'researchLab',          level: 2   },

    // Mid economy and Stronger infrastructure
    { type: 'building', item: 'metalStorage',         level: 1   },
    { type: 'building', item: 'crystalStorage',       level: 1   },
    { type: 'building', item: 'deuteriumStorage',     level: 1   },
    { type: 'building', item: 'solarPlant',           level: 11  },
    { type: 'building', item: 'deuteriumMine',        level: 4   },
    { type: 'building', item: 'metalMine',            level: 11  },
    { type: 'building', item: 'solarPlant',           level: 12  },
    { type: 'building', item: 'crystalMine',          level: 10  },
    { type: 'building', item: 'deuteriumMine',        level: 5   },
    { type: 'building', item: 'solarPlant',           level: 13  },
    { type: 'building', item: 'metalMine',            level: 13  },
    { type: 'building', item: 'robotFactory',         level: 4   },
    { type: 'building', item: 'solarPlant',           level: 14  },
    { type: 'building', item: 'metalMine',            level: 14  },
    { type: 'building', item: 'crystalMine',          level: 11  },
    { type: 'building', item: 'solarPlant',           level: 15  },
    { type: 'building', item: 'crystalMine',          level: 13  },
    { type: 'building', item: 'deuteriumMine',        level: 6   },
    { type: 'building', item: 'solarPlant',           level: 16  },
    { type: 'building', item: 'metalMine',            level: 15  },
    { type: 'building', item: 'crystalMine',          level: 14  },
    { type: 'building', item: 'deuteriumMine',        level: 7   },
    { type: 'building', item: 'robotFactory',         level: 5   },
    { type: 'defense', item: 'rocketLauncher',        amount: 9  },
    { type: 'building', item: 'metalStorage',         level: 3   },
    { type: 'building', item: 'crystalStorage',       level: 3   },
    { type: 'building', item: 'deuteriumStorage',     level: 3   },
    { type: 'building', item: 'shipyard',             level: 4   },
    { type: 'building', item: 'researchLab',          level: 3   },
    { type: 'defense', item: 'lightLaser',            amount: 10 },

    // Upper-mid economy
    { type: 'building', item: 'solarPlant',           level: 17  },
    { type: 'building', item: 'metalMine',            level: 16  },
    { type: 'building', item: 'crystalMine',          level: 15  },
    { type: 'building', item: 'deuteriumMine',        level: 8   },
    { type: 'building', item: 'solarPlant',           level: 18  },
    { type: 'building', item: 'metalMine',            level: 17  },
    { type: 'building', item: 'crystalMine',          level: 16  },
    { type: 'building', item: 'robotFactory',         level: 6   },
    { type: 'building', item: 'researchLab',          level: 4   },
    { type: 'building', item: 'solarPlant',           level: 19  },
    { type: 'building', item: 'metalMine',            level: 18  },
    { type: 'building', item: 'crystalMine',          level: 17  },
    { type: 'building', item: 'deuteriumMine',        level: 9   },
    { type: 'building', item: 'solarPlant',           level: 20  },
    { type: 'building', item: 'metalMine',            level: 19  },
    { type: 'building', item: 'crystalMine',          level: 18  },
    { type: 'building', item: 'deuteriumMine',        level: 10  },
    { type: 'defense', item: 'rocketLauncher',        amount: 25 },
    { type: 'defense', item: 'lightLaser',            amount: 50 },
    { type: 'building', item: 'metalStorage',         level: 4   },
    { type: 'building', item: 'crystalStorage',       level: 4   },
    { type: 'building', item: 'researchLab',          level: 5   },
    { type: 'building', item: 'solarPlant',           level: 21  },
    { type: 'building', item: 'metalMine',            level: 20  },
    { type: 'building', item: 'crystalMine',          level: 19  },
    { type: 'building', item: 'solarPlant',           level: 22  },
    { type: 'building', item: 'metalMine',            level: 22  },
    { type: 'building', item: 'deuteriumMine',        level: 11  },

    // Basic defense and fleet
    { type: 'building', item: 'robotFactory',         level: 7   },
    { type: 'building', item: 'shipyard',             level: 6   },
    { type: 'building', item: 'researchLab',          level: 6   },
    { type: 'fleet', item: 'solarSatellite',          amount: 10 },
    { type: 'fleet', item: 'espionageProbe',          amount: 5  },
    { type: 'fleet', item: 'smallCargo',              amount: 10 },
    { type: 'defense', item: 'smallShield',           amount: 1  },
    { type: 'defense', item: 'rocketLauncher',        amount: 100 },
    { type: 'defense', item: 'lightLaser',            amount: 100 },
    { type: 'defense', item: 'heavyLaser',            amount: 10 },
    { type: 'defense', item: 'ion',                   amount: 10 },
    { type: 'fleet', item: 'largeCargo',              amount: 25 },
    { type: 'fleet', item: 'recycler',                amount: 10 },
    { type: 'defense', item: 'gauss',                 amount: 3  },
    { type: 'building', item: 'silo',                 level: 2   },
    { type: 'defense', item: 'antiballisticMissile',  amount: 2  },
    { type: 'defense', item: 'largeShield',           amount: 1  },

    // Stronger economy and infrastructure
    { type: 'building', item: 'robotFactory',         level: 8   },
    { type: 'building', item: 'metalMine',            level: 25  },
    { type: 'building', item: 'crystalMine',          level: 23  },
    { type: 'building', item: 'deuteriumMine',        level: 15  },
    { type: 'building', item: 'metalStorage',         level: 5   },
    { type: 'building', item: 'crystalStorage',       level: 5   },
    { type: 'building', item: 'deuteriumStorage',     level: 4   },
    { type: 'building', item: 'researchLab',          level: 8   },
    { type: 'building', item: 'metalMine',            level: 26  },
    { type: 'building', item: 'crystalMine',          level: 24  },
    { type: 'building', item: 'robotFactory',         level: 10  },
    { type: 'building', item: 'naniteFactory',        level: 1   },
    { type: 'building', item: 'shipyard',             level: 8   },

    // Mid fleet and defense
    { type: 'fleet', item: 'espionageProbe',          amount: 25 },
    { type: 'defense', item: 'rocketLauncher',        amount: 500 },
    { type: 'defense', item: 'lightLaser',            amount: 500 },
    { type: 'defense', item: 'gauss',                 amount: 10 },
    { type: 'fleet', item: 'largeCargo',              amount: 50 },
    { type: 'fleet', item: 'recycler',                amount: 25 },

    // Economy final stage
    { type: 'building', item: 'crystalMine',          level: 24  },
    { type: 'building', item: 'metalMine',            level: 30  },
    { type: 'building', item: 'crystalMine',          level: 27  },
    { type: 'building', item: 'deuteriumMine',        level: 18  },
    
    // Fleet strong final stage
    { type: 'building', item: 'researchLab',          level: 10  },
    { type: 'building', item: 'naniteFactory',        level: 2   },
    { type: 'building', item: 'shipyard',             level: 12  },
    { type: 'defense', item: 'rocketLauncher',        amount: 1000 },
    { type: 'defense', item: 'lightLaser',            amount: 1000 },
    { type: 'defense', item: 'gauss',                 amount: 50  },
    { type: 'defense', item: 'plasma',                amount: 25  },
    { type: 'fleet', item: 'lightFighter',            amount: 500 },
    { type: 'fleet', item: 'heavyFighter',            amount: 10  },
    { type: 'fleet', item: 'battleship',              amount: 100 },
    { type: 'fleet', item: 'cruiser',                 amount: 100 },
    { type: 'building', item: 'alliance',             level: 1    },
    { type: 'building', item: 'naniteFactory',        level: 3    },
    { type: 'fleet', item: 'cruiser',         amount: 250 },
    { type: 'fleet', item: 'battleship',      amount: 100 },
    { type: 'fleet', item: 'battlecruiser',   amount: 25  },
    { type: 'fleet', item: 'bomber',          amount: 25  },
    { type: 'fleet', item: 'destroyer',       amount: 3   },

    // Moon construction
    { type: 'moon' },
    /*{ type: 'moonBuilding', item: 'lunarBase',         level: 1  },
    { type: 'moonBuilding', item: 'phalanx',           level: 1  },
    { type: 'moonBuilding', item: 'jumpGate',          level: 1  },
    { type: 'moonBuilding', item: 'spaceDock',         level: 1  },
    { type: 'moonBuilding', item: 'marketplace',       level: 1  },
    { type: 'moonBuilding', item: 'lunarSunshade',     level: 1  },
    { type: 'moonBuilding', item: 'lunarBeam',         level: 1  },
    { type: 'moonBuilding', item: 'moonShield',        level: 1  },*/

    // Final goal deathstar
    { type: 'building', item: 'researchLab', level: 12  },
    { type: 'fleet', item: 'deathstar', amount: 1  }

  ],

  // % chance per bot tick to move all planet resources to a random other planet when blocked by insufficient funds
  probMoveResources: 1,

  // After all missionList goals are done, keep fleet proportional to deathstar count.
  // deathstar: target count; every other key: ships per 1 deathstar.
  shipRatio: { deathstar: 1, recycler: 5, espionageProbe: 10 },

  research: {
    // Ordered research goals, run in parallel with planet missions (independent queue).
    list: [
      // investigacion, pasar a la lista de misiones de imperio
      { type: 'research', item: 'energy',           level: 2  },
      { type: 'research', item: 'computer',         level: 1  },
      { type: 'research', item: 'combustion',       level: 2  },
      { type: 'research', item: 'laser',            level: 3  },
      { type: 'research', item: 'computer',         level: 2  },
      { type: 'research', item: 'espionage',        level: 4  },
      { type: 'research', item: 'impulse',          level: 3  },
      { type: 'research', item: 'astrophysics',     level: 1  },
      { type: 'research', item: 'armour',           level: 2  },

      { type: 'research', item: 'astrophysics',     level: 3  },
      { type: 'research', item: 'energy',           level: 4  },
      { type: 'research', item: 'computer',         level: 3  },
      { type: 'research', item: 'laser',            level: 6  },
      { type: 'research', item: 'ion',              level: 5  },
      { type: 'research', item: 'weapons',          level: 3  },
      { type: 'research', item: 'shielding',        level: 6  },
      { type: 'research', item: 'combustion',       level: 6  },
      { type: 'research', item: 'armour',           level: 4  },

      { type: 'research', item: 'astrophysics',     level: 7  },
      { type: 'research', item: 'impulse',          level: 4  },
      { type: 'research', item: 'computer',         level: 8  },
      { type: 'research', item: 'energy',           level: 8  },
      { type: 'research', item: 'laser',            level: 10 },
      { type: 'research', item: 'ion',              level: 8  },
      { type: 'research', item: 'plasma',           level: 7  },
      { type: 'research', item: 'hyperspace',       level: 3  },
      { type: 'research', item: 'hyperspace_drive', level: 3  },
      { type: 'research', item: 'weapons',          level: 6  },
      { type: 'research', item: 'computer',         level: 10 },

      { type: 'research', item: 'astrophysics',     level: 9  },
      { type: 'research', item: 'espionage',        level: 8  },
      { type: 'research', item: 'energy',           level: 12 },
      { type: 'research', item: 'laser',            level: 12 },
      { type: 'research', item: 'armour',           level: 8  },
      { type: 'research', item: 'weapons',          level: 8  },
      { type: 'research', item: 'astrophysics',     level: 11 },
      { type: 'research', item: 'hyperspace_drive', level: 5  },
      { type: 'research', item: 'shielding',        level: 8  },

      { type: 'research', item: 'hyperspace_drive', level: 7  },
      { type: 'research', item: 'hyperspace',       level: 8  },
      { type: 'research', item: 'ion',              level: 12 },

      { type: 'research', item: 'astrophysics',     level: 13 },

      // Graviton — energy production gated (300000 * 2^currentLevel needed)
      { type: 'research', item: 'graviton',         level: 1  },
      { type: 'research', item: 'shielding',        level: 12 },
    ]
  },

  colonyConfig: {
    // Galaxy offset per colony slot (index 0 = 2nd planet, index 1 = 3rd, etc.).
    // Offset is relative to home planet galaxy; wraps around maxGalaxies.
    galaxyOffsets: [0, 1, 1, 2, 3],

    // Max random system offset from home planet system when picking colony coordinates.
    systemSpread: 100,
  },

  attackConfig: {
    // Master switch — set true to enable attack/recycle cycles.
    enabled: false,

    // Target must have been inactive for at least this many hours.
    minInactiveHours: 168,

    // Target planet must hold at least this many total resources (metal+crystal+deuterium).
    minResources: 50000,

    // Skip targets whose score exceeds own score * this multiplier.
    maxPointRatio: 3.0,

    // System radius around each own planet to search for targets (same galaxy only).
    attackRadio: 20,

    // Scheduler-active minutes that must pass between attack cycles.
    attackWait: 60,

    // How to pick targets when available fleet slots are limited.
    // 'random' = shuffle, 'inside' = closest first, 'outside' = farthest first.
    selectMode: 'random',

    // System radius to search for debris fields to recycle. null disables recycling.
    debrisRadio: 15,
  }
};
