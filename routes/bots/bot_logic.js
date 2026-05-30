const base      = require('../data_base');
const battleMod = require('../battle');
const fun       = require('../funciones_auxiliares');

const RESOURCE_WAIT_BUFFER_MS = 5000;
const FALLBACK_RETRY_MS       = 30 * 60 * 1000;
const SHIP_RATIO_INTERVAL_MS  = 60 * 60 * 1000;

const fakeRes = { send: () => {} };
const shipRatioLastRun = new Map(); // playerName → timestamp
const attackActiveMs   = new Map(); // playerName → accumulated active ms since last attack
const attackLastRunMs  = new Map(); // playerName → last ms that _tryAttack ran (in window)

const ATTACK_SHIP_KEYS = [
  'lightFighter','heavyFighter','cruiser','battleship','battlecruiser',
  'bomber','destroyer','deathstar','smallCargo','largeCargo',
];

const MOON_LF_GOAL = 1667;
const MOON_BS_GOAL = 112;

function _horaActual() {
  return Date.now();
}

function _isInSchedulerWindow(scheduler, nowMs) {
  if (!scheduler) return true;
  const hour = new Date(nowMs).getHours();
  return scheduler.some(w => hour >= w.start && hour < w.end);
}

function _msUntilNextWindow(scheduler, nowMs) {
  const now        = new Date(nowMs);
  const hour       = now.getHours();
  const minute     = now.getMinutes();
  const second     = now.getSeconds();
  const msIntoHour = (minute * 60 + second) * 1000;

  let minMs = Infinity;
  for (const w of scheduler) {
    let hoursUntil = w.start - hour;
    if (hoursUntil <= 0) hoursUntil += 24;
    const ms = hoursUntil * 3600000 - msIntoHour;
    if (ms > 0 && ms < minMs) minMs = ms;
  }
  return minMs === Infinity ? 3600000 : minMs;
}

function _missionDone(mission, player, planetNum) {
  const p = player.planets[planetNum];
  if (!p) return true;
  switch (mission.type) {
    case 'building': return (p.buildings[mission.item] || 0) >= mission.level;
    case 'fleet':    return (p.fleet[mission.item]     || 0) >= mission.amount;
    case 'defense':  return (p.defense[mission.item]   || 0) >= mission.amount;
    case 'research': return (player.research[mission.item] || 0) >= mission.level;
    case 'moon':          return player.planets.every((p, i) => i === planetNum || (p.moon && p.moon.active));
    case 'moonBuilding': {
      const moon = p.moon;
      if (!moon || !moon.active) return true; // no moon — skip
      return (moon.buildings[mission.item] || 0) >= mission.level;
    }
    default: return true;
  }
}

function _inProgressUntil(mission, player, planetNum) {
  const p = player.planets[planetNum];
  if (!p) return 0;
  switch (mission.type) {
    case 'building': {
      const bc = p.buildingConstrucction;
      return (bc && bc.active && bc.item === mission.item)
        ? bc.init + bc.time * 1000 : 0;
    }
    case 'research': {
      const rc = player.researchConstrucction;
      return (rc && rc.active && rc.item === mission.item)
        ? rc.init + rc.time * 1000 : 0;
    }
    case 'fleet':
    case 'defense': {
      const q = p.shipConstrucction.find(e => e.item === mission.item && e.cant > 0);
      return q ? Date.now() + q.timeNow * 1000 : 0;
    }
    case 'moonBuilding': {
      const mbc = p.moon && p.moon.buildingConstrucction;
      return (mbc && mbc.active && mbc.item === mission.item) ? mbc.init + mbc.time * 1000 : 0;
    }
    default: return 0;
  }
}

function _anyConstructionActive(player, planetNum) {
  const p = player.planets[planetNum];
  if (!p) return false;
  return !!(p.buildingConstrucction && p.buildingConstrucction.active);
}

function _resourcesEnough(resources, metal, crystal, deuterium) {
  return resources.metal >= metal && resources.crystal >= crystal && resources.deuterium >= deuterium;
}

function _msUntilResources(resources, production, metal, crystal, deuterium) {
  if (production.metal <= 0 && production.crystal <= 0 && production.deuterium <= 0) {
    return FALLBACK_RETRY_MS;
  }
  const needMetal = Math.max(0, metal     - resources.metal);
  const needCrys  = Math.max(0, crystal   - resources.crystal);
  const needDeut  = Math.max(0, deuterium - resources.deuterium);
  const msMetal = production.metal     > 0 ? (needMetal / production.metal)     * 3600000 : (needMetal > 0 ? Infinity : 0);
  const msCrys  = production.crystal   > 0 ? (needCrys  / production.crystal)   * 3600000 : (needCrys  > 0 ? Infinity : 0);
  const msDeut  = production.deuterium > 0 ? (needDeut  / production.deuterium) * 3600000 : (needDeut  > 0 ? Infinity : 0);
  const ms = Math.max(msMetal, msCrys, msDeut);
  return isFinite(ms) ? ms : FALLBACK_RETRY_MS;
}

function _tryExecute(mission, player, planetNum, uni) {
  switch (mission.type) {
    case 'building':
      if (_anyConstructionActive(player, planetNum)) return false;
      uni.proccesBuildRequest(player, planetNum, mission.item, fakeRes);
      return true;
    case 'research':
      if (player.researchConstrucction && player.researchConstrucction.active) return false;
      uni.proccesResearchRequest(player, planetNum, mission.item, fakeRes);
      return true;
    case 'fleet':
    case 'defense': {
      const p       = player.planets[planetNum];
      const inQueue = p.shipConstrucction.filter(e => e.item === mission.item).reduce((s, e) => s + e.cant, 0);
      const current = ((mission.type === 'fleet' ? p.fleet[mission.item] : p.defense[mission.item]) || 0) + inQueue;
      const need    = mission.amount - current;
      if (need <= 0) return true;
      uni.proccesShipyardRequest(player, planetNum, mission.item, need, fakeRes);
      return true;
    }
    default: return false;
  }
}

function _getCost(mission, player, planetNum, uni) {
  const p = player.planets[planetNum];
  if (!p) return null;
  try {
    switch (mission.type) {
      case 'building': {
        const costs = uni.costBuildings(player, planetNum);
        const c = costs[mission.item];
        return c ? { metal: c.metal, crystal: c.crystal, deuterium: c.deuterium } : null;
      }
      case 'research': {
        const lab   = p.buildings.researchLab || 0;
        const costs = uni.costResearch(player, lab);
        const c = costs[mission.item];
        return c ? { metal: c.metal, crystal: c.crystal, deuterium: c.deuterium } : null;
      }
      case 'fleet':
      case 'defense': {
        const shipCosts = { ...uni.costShipyard(player, planetNum, false), ...uni.costDefense(player, planetNum) };
        const c = shipCosts[mission.item];
        if (!c) return null;
        const current = (mission.type === 'fleet' ? p.fleet[mission.item] : p.defense[mission.item]) || 0;
        const need    = Math.max(1, mission.amount - current);
        return { metal: c.metal * need, crystal: c.crystal * need, deuterium: c.deuterium * need };
      }
      default: return null;
    }
  } catch (e) {
    return null;
  }
}

function _getBestResearchPlanet(player) {
  let best = 0;
  let bestLevel = -1;
  for (let i = 0; i < player.planets.length; i++) {
    const lab = (player.planets[i].buildings && player.planets[i].buildings.researchLab) || 0;
    if (lab > bestLevel) { bestLevel = lab; best = i; }
  }
  return best;
}

function _checkEnergy(player, planetNum, uni, events) {
  const planet = player.planets[planetNum];
  if (!planet || planet.resources.energy >= 0) return false;

  // Satellites already being built — schedule their completion
  const inQueue = planet.shipConstrucction.find(q => q.item === 'solarSatellite' && q.cant > 0);
  if (inQueue) {
    events.addElement({ time: Date.now() + inQueue.timeNow * 1000, player: player.name });
    return true;
  }

  const avgTemp      = ((planet.temperature.max || 0) + (planet.temperature.min || 0)) / 2;
  const energyPerSat = Math.max(1, Math.floor((avgTemp + 160) / 6));
  const need         = Math.ceil(-planet.resources.energy / energyPerSat);

  const shipCosts = uni.costShipyard(player, planetNum, false);
  const satCost   = shipCosts && shipCosts.solarSatellite;
  if (!satCost) return false;

  const resources  = planet.resources;
  const production = planet.resourcesAdd;
  const totalMetal  = satCost.metal     * need;
  const totalCrys   = satCost.crystal   * need;
  const totalDeut   = satCost.deuterium * need;

  if (!_resourcesEnough(resources, totalMetal, totalCrys, totalDeut)) return false;

  uni.proccesShipyardRequest(player, planetNum, 'solarSatellite', need, fakeRes);
  return true;
}

function _checkFieldSmart(player, planetNum, uni, events) {
  const planet = player.planets[planetNum];
  if (!planet) return false;
  if ((planet.campos || 0) < (planet.camposMax || 0)) return false; // still have free fields

  const bc = planet.buildingConstrucction;
  if (bc && bc.active) {
    events.addElement({ time: bc.init + bc.time * 1000, player: player.name });
    return true;
  }

  const costs = uni.costBuildings(player, planetNum);
  const tc    = costs.terraformer;
  if (!tc || !tc.tech) {
    _scheduleEvent(events, player, FALLBACK_RETRY_MS);
    return true;
  }

  const resources  = planet.resources;
  const production = planet.resourcesAdd;
  if (!_resourcesEnough(resources, tc.metal, tc.crystal, tc.deuterium)) {
    const ms = _msUntilResources(resources, production, tc.metal, tc.crystal, tc.deuterium);
    _scheduleEvent(events, player, ms + RESOURCE_WAIT_BUFFER_MS);
    return true;
  }

  uni.proccesBuildRequest(player, planetNum, 'terraformer', fakeRes);
  return true;
}

function _checkSmartStorage(player, planetNum, uni, events) {
  const planet = player.planets[planetNum];
  if (!planet || _anyConstructionActive(player, planetNum)) return false;

  const almacen = uni.getAlmacen(planet, false);
  const res     = planet.resources;

  const storageMap = [
    { resource: 'metal',     building: 'metalStorage'     },
    { resource: 'crystal',   building: 'crystalStorage'   },
    { resource: 'deuterium', building: 'deuteriumStorage' },
  ];

  for (const { resource, building } of storageMap) {
    if (almacen[resource] > 0 && res[resource] / almacen[resource] >= 0.9) {
      const cost = _getCost({ type: 'building', item: building }, player, planetNum, uni);
      if (!cost) continue;
      if (_resourcesEnough(res, cost.metal, cost.crystal, cost.deuterium)) {
        uni.proccesBuildRequest(player, planetNum, building, fakeRes);
      } else {
        const ms = _msUntilResources(res, planet.resourcesAdd, cost.metal, cost.crystal, cost.deuterium);
        _scheduleEvent(events, player, ms + RESOURCE_WAIT_BUFFER_MS);
      }
      return true;
    }
  }
  return false;
}

function _buildShipRatio(player, planetNum, shipRatio, uni, events) {
  const planet = player.planets[planetNum];
  if (!planet || !shipRatio) return false;

  const ds = planet.fleet.deathstar || 0;

  let worstItem  = null;
  let worstRatio = Infinity;

  for (const [item, targetCount] of Object.entries(shipRatio)) {
    const target  = item === 'deathstar' ? targetCount : ds * targetCount;
    if (target <= 0) continue;
    const current = planet.fleet[item] || 0;
    const ratio   = current / target;
    if (ratio < worstRatio) { worstRatio = ratio; worstItem = item; }
  }

  if (!worstItem) return false;

  const dsTarget    = shipRatio.deathstar || 1;
  const targetCount = worstItem === 'deathstar' ? dsTarget : ds * shipRatio[worstItem];
  const current     = planet.fleet[worstItem] || 0;
  const need        = Math.max(1, Math.ceil(targetCount - current));

  const inQueue = planet.shipConstrucction.find(q => q.item === worstItem && q.cant > 0);
  if (inQueue) {
    events.addElement({ time: Date.now() + inQueue.timeNow * 1000, player: player.name });
    return true;
  }

  uni.proccesShipyardRequest(player, planetNum, worstItem, need, fakeRes);
  return true;
}

function _scheduleEvent(events, player, delayMs) {
  const now = _horaActual();
  events.addElement({ time: now + delayMs, player: player.name });
}

function _savePlanetProgress(player, planetNum, index) {
  const objSet = { [`bot.planetProgress.${planetNum}`]: index };
  player.bot.planetProgress[planetNum] = index;
  base.savePlayerData(player.name, objSet, {}, undefined, undefined, () => {});
}

function _saveResearchProgress(player, index) {
  const objSet = { 'bot.research.currentMission': index };
  player.bot.research.currentMission = index;
  base.savePlayerData(player.name, objSet, {}, undefined, undefined, () => {});
}

function _runPlanetMission(player, planetNum, uni, events) {
  const bot  = player.bot;
  const list = bot.missionList;
  if (!list || list.length === 0) return false;

  // Auto-register new planets not yet in planetProgress
  if (bot.planetProgress[planetNum] === undefined) {
    bot.planetProgress[planetNum] = 0;
    base.savePlayerData(player.name, { [`bot.planetProgress.${planetNum}`]: 0 }, {}, undefined, undefined, () => {});
  }

  // Smart storage check takes priority over regular missions
  if (bot.almacenSmart && _checkSmartStorage(player, planetNum, uni, events)) return true;

  // Energy deficit — build solar satellites before anything else
  if (_checkEnergy(player, planetNum, uni, events)) return true;

  // No free fields — build terraformer before proceeding
  if (bot.fieldSmart && _checkFieldSmart(player, planetNum, uni, events)) return true;

  // Clamp idx in case missionList was edited and saved index is now out of bounds
  let idx = bot.planetProgress[planetNum] % list.length;
  if (idx !== bot.planetProgress[planetNum]) _savePlanetProgress(player, planetNum, idx);
  let checked = 0;

  while (checked < list.length) {
    const mission = list[idx];

    if (_missionDone(mission, player, planetNum)) {
      idx = (idx + 1) % list.length;
      checked++;
      _savePlanetProgress(player, planetNum, idx);
      continue;
    }

    // Moon / moonBuilding missions have their own logic — hand off and return
    if (mission.type === 'moon') {
      _runMoonMission(player, planetNum, uni, events);
      return true;
    }
    if (mission.type === 'moonBuilding') {
      // Always work on the first unfulfilled moonBuilding in the list, not necessarily the current one
      const firstPending = list.find(m => m.type === 'moonBuilding' && !_missionDone(m, player, planetNum));
      _runMoonBuildingMission(player, planetNum, firstPending || mission, uni, events);
      return true;
    }

    const progressUntil = _inProgressUntil(mission, player, planetNum);
    if (progressUntil > 0) {
      events.addElement({ time: progressUntil, player: player.name });
      return true;
    }

    // Different building already in progress — wait for it to finish
    if (mission.type === 'building' && _anyConstructionActive(player, planetNum)) {
      const bc = player.planets[planetNum].buildingConstrucction;
      events.addElement({ time: bc.init + bc.time * 1000, player: player.name });
      return true;
    }

    // Fleet/defense: build as many as affordable right now, don't wait for full amount
    if (mission.type === 'fleet' || mission.type === 'defense') {
      const shipCosts = { ...uni.costShipyard(player, planetNum, false), ...uni.costDefense(player, planetNum) };
      const c = shipCosts[mission.item];
      if (!c) { _scheduleEvent(events, player, FALLBACK_RETRY_MS); return true; }
      const p        = player.planets[planetNum];
      const inQueue  = p.shipConstrucction.filter(e => e.item === mission.item).reduce((s, e) => s + e.cant, 0);
      const current  = ((mission.type === 'fleet' ? p.fleet[mission.item] : p.defense[mission.item]) || 0) + inQueue;
      const totalNeed = mission.amount - current;
      if (totalNeed <= 0) { idx = (idx + 1) % list.length; _savePlanetProgress(player, planetNum, idx); break; }
      const resources  = p.resources;
      const production = p.resourcesAdd;
      const canAfford  = Math.min(
        c.metal     > 0 ? Math.floor(resources.metal     / c.metal)     : Infinity,
        c.crystal   > 0 ? Math.floor(resources.crystal   / c.crystal)   : Infinity,
        c.deuterium > 0 ? Math.floor(resources.deuterium / c.deuterium) : Infinity,
        totalNeed
      );
      if (canAfford >= 1) {
        uni.proccesShipyardRequest(player, planetNum, mission.item, canAfford, fakeRes);
      } else if (!_tryMoveResources(player, planetNum, uni, bot, events)) {
        const ms = _msUntilResources(resources, production, c.metal, c.crystal, c.deuterium);
        _scheduleEvent(events, player, ms + RESOURCE_WAIT_BUFFER_MS);
      }
      return true;
    }

    const cost = _getCost(mission, player, planetNum, uni);
    if (!cost) {
      _scheduleEvent(events, player, FALLBACK_RETRY_MS);
      return true;
    }

    const resources  = player.planets[planetNum].resources;
    const production = player.planets[planetNum].resourcesAdd;

    if (!_resourcesEnough(resources, cost.metal, cost.crystal, cost.deuterium)) {
      if (!_tryMoveResources(player, planetNum, uni, bot, events)) {
        const ms = _msUntilResources(resources, production, cost.metal, cost.crystal, cost.deuterium);
        _scheduleEvent(events, player, ms + RESOURCE_WAIT_BUFFER_MS);
      }
      return true;
    }

    _tryExecute(mission, player, planetNum, uni);
    return true;
  }

  // All missions done — ship ratio mode (throttled to once per hour)
  if (bot.shipRatio) {
    const last = shipRatioLastRun.get(`${player.name}_${planetNum}`) || 0;
    if (Date.now() - last >= SHIP_RATIO_INTERVAL_MS) {
      shipRatioLastRun.set(`${player.name}_${planetNum}`, Date.now());
      return _buildShipRatio(player, planetNum, bot.shipRatio, uni, events);
    }
  }
  return false;
}

function _runResearchMission(player, uni, events) {
  const research = player.bot.research;
  if (!research || !research.list || research.list.length === 0) return false;

  const planetNum = _getBestResearchPlanet(player);
  let idx = (research.currentMission || 0) % research.list.length;
  if (idx !== research.currentMission) _saveResearchProgress(player, idx);
  let checked = 0;

  while (checked < research.list.length) {
    const mission = research.list[idx];

    if (_missionDone(mission, player, planetNum)) {
      idx = (idx + 1) % research.list.length;
      checked++;
      _saveResearchProgress(player, idx);
      continue;
    }

    const progressUntil = _inProgressUntil(mission, player, planetNum);
    if (progressUntil > 0) {
      events.addElement({ time: progressUntil, player: player.name });
      return true;
    }

    // Graviton costs energy production, not resources — handle separately
    if (mission.item === 'graviton') {
      const planet     = player.planets[planetNum];
      const energyCost = 300000 * Math.pow(2, player.research.graviton || 0);
      const energyProd = (planet.resourcesAdd && planet.resourcesAdd.energy) || 0;
      if (energyProd < energyCost) {
        const inQueue = planet.shipConstrucction.find(q => q.item === 'solarSatellite' && q.cant > 0);
        if (inQueue) {
          events.addElement({ time: Date.now() + inQueue.timeNow * 1000, player: player.name });
          return true;
        }
        const avgTemp      = ((planet.temperature.max || 0) + (planet.temperature.min || 0)) / 2;
        const energyPerSat = Math.max(1, Math.floor((avgTemp + 160) / 6));
        const satsNeeded   = Math.ceil((energyCost - energyProd) / energyPerSat);
        const shipCosts    = uni.costShipyard(player, planetNum, false);
        const satCost      = shipCosts && shipCosts.solarSatellite;
        if (!satCost) { _scheduleEvent(events, player, FALLBACK_RETRY_MS); return true; }
        const res  = planet.resources;
        const prod = planet.resourcesAdd;
        const totalMetal = satCost.metal     * satsNeeded;
        const totalCrys  = satCost.crystal   * satsNeeded;
        const totalDeut  = satCost.deuterium * satsNeeded;
        if (!_resourcesEnough(res, totalMetal, totalCrys, totalDeut)) {
          const ms = _msUntilResources(res, prod, totalMetal, totalCrys, totalDeut);
          _scheduleEvent(events, player, ms + RESOURCE_WAIT_BUFFER_MS);
          return true;
        }
        uni.proccesShipyardRequest(player, planetNum, 'solarSatellite', satsNeeded, fakeRes);
        return true;
      }
      _tryExecute(mission, player, planetNum, uni);
      return true;
    }

    const cost = _getCost(mission, player, planetNum, uni);
    if (!cost) {
      _scheduleEvent(events, player, FALLBACK_RETRY_MS);
      return true;
    }

    const resources  = player.planets[planetNum].resources;
    const production = player.planets[planetNum].resourcesAdd;

    if (!_resourcesEnough(resources, cost.metal, cost.crystal, cost.deuterium)) {
      const ms = _msUntilResources(resources, production, cost.metal, cost.crystal, cost.deuterium);
      _scheduleEvent(events, player, ms + RESOURCE_WAIT_BUFFER_MS);
      return true;
    }

    _tryExecute(mission, player, planetNum, uni);
    return true;
  }
  return false;
}

function _getCurrentMissionType(player, planetNum, bot) {
  const list = bot.missionList;
  if (!list || list.length === 0) return null;
  let idx     = (bot.planetProgress[planetNum] || 0) % list.length;
  let checked = 0;
  while (checked < list.length) {
    const m = list[idx];
    if (!_missionDone(m, player, planetNum)) return m.type;
    idx = (idx + 1) % list.length;
    checked++;
  }
  return null; // all missions done
}

const FLEET_SHIP_KEYS = [
  'lightFighter','heavyFighter','cruiser','battleship','battlecruiser',
  'bomber','destroyer','deathstar','smallCargo','largeCargo','colony',
  'recycler','espionageProbe'
];

function _joinFleet(player, planetNum, bot, uni) {
  if (!bot.joinFleet || planetNum === 0) return;

  const planet  = player.planets[planetNum];
  const planet0 = player.planets[0];
  if (!planet || !planet0) return;

  const curType = _getCurrentMissionType(player, planetNum, bot);
  if (curType === 'fleet') return; // fleet mission in progress — keep ships here

  const allDone = curType === null;

  const ships = { ...fun.zeroShips(), misil: 0 };
  let hasShips = false;

  if (allDone && bot.shipRatio) {
    const ds = planet.fleet.deathstar || 0;
    for (const [item, ratio] of Object.entries(bot.shipRatio)) {
      if (!FLEET_SHIP_KEYS.includes(item)) continue;
      const target = item === 'deathstar' ? ratio : ds * ratio;
      const toSend = Math.min(planet.fleet[item] || 0, Math.ceil(target));
      if (toSend > 0) { ships[item] = toSend; hasShips = true; }
    }
  } else {
    for (const k of FLEET_SHIP_KEYS) {
      const count = planet.fleet[k] || 0;
      if (count > 0) { ships[k] = count; hasShips = true; }
    }
  }

  if (!hasShips) return;

  const alreadyDeploying = player.movement.some(m =>
    m.coorDesde && m.coorHasta &&
    m.coorDesde.gal === planet.coordinates.gal &&
    m.coorDesde.sys === planet.coordinates.sys &&
    m.coorDesde.pos === planet.coordinates.pos &&
    m.coorHasta.gal === planet0.coordinates.gal &&
    m.coorHasta.sys === planet0.coordinates.sys &&
    m.coorHasta.pos === planet0.coordinates.pos
  );
  if (alreadyDeploying) return;

  uni.addFleetMovement(player, planetNum, false, {
    ships,
    coorDesde: planet.coordinates,
    coorHasta: planet0.coordinates,
    destination: 1,
    porce: 100,
    mission: 4, // deploy
    resources: fun.zeroResources()
  }, fakeRes);
}

function _tryMoveResources(player, planetNum, uni, bot, events) {
  const prob = bot.probMoveResources;
  if (!prob || Math.random() * 100 > prob) return false;
  if (player.planets.length < 2) return false;

  const planet    = player.planets[planetNum];
  const resources = planet.resources;
  const totalRes  = resources.metal + resources.crystal + resources.deuterium;
  if (totalRes <= 0) return false;

  const smallCargo    = planet.fleet.smallCargo || 0;
  const largeCargo    = planet.fleet.largeCargo || 0;
  const cargoCapacity = smallCargo * 5000 + largeCargo * 25000;
  if (cargoCapacity < totalRes) return false;

  const others = player.planets.filter((_, i) => i !== planetNum);
  const target  = others[Math.floor(Math.random() * others.length)];

  uni.addFleetMovement(player, planetNum, false, {
    ships: { ...fun.zeroShips(), misil: 0, smallCargo, largeCargo },
    coorDesde:   planet.coordinates,
    coorHasta:   target.coordinates,
    destination: 1,
    porce:       100,
    mission:     3, // transport
    resources:   { metal: resources.metal, crystal: resources.crystal, deuterium: resources.deuterium }
  }, fakeRes);

  _scheduleEvent(events, player, FALLBACK_RETRY_MS);
  return true;
}

function _tryColonize(player, uni, bot, events) {
  const cfg = bot.colonyConfig;
  if (!cfg) return;

  const astrophysics = player.research.astrophysics || 0;
  const maxPlanets   = Math.min(Math.ceil(astrophysics / 2) + 1, 8);
  if (player.planets.length >= maxPlanets) return;

  if (player.movement.some(m => m.mission === 1)) return;

  let sourceNum = -1;
  for (let i = 0; i < player.planets.length; i++) {
    if ((player.planets[i].fleet.colony || 0) > 0) { sourceNum = i; break; }
  }

  if (sourceNum === -1) {
    // Colony ship already being built — wait for it
    for (let i = 0; i < player.planets.length; i++) {
      const inQueue = player.planets[i].shipConstrucction.find(q => q.item === 'colony' && q.cant > 0);
      if (inQueue) {
        events.addElement({ time: Date.now() + inQueue.timeNow * 1000, player: player.name });
        return;
      }
    }
    // No colony ship anywhere — build one on the first planet that can afford it
    for (let i = 0; i < player.planets.length; i++) {
      const planet    = player.planets[i];
      const shipCosts = uni.costShipyard(player, i, false);
      const c         = shipCosts && shipCosts.colony;
      if (!c || !c.tech) continue;
      if (!_resourcesEnough(planet.resources, c.metal, c.crystal, c.deuterium)) continue;
      uni.proccesShipyardRequest(player, i, 'colony', 1, fakeRes);
      const built = planet.shipConstrucction.find(q => q.item === 'colony' && q.cant > 0);
      if (built) events.addElement({ time: Date.now() + built.timeNow * 1000, player: player.name });
      return;
    }
    return;
  }

  const home          = player.planets[0];
  const totalGal      = (uni.universo && uni.universo.maxGalaxies) || 9;
  const totalSys      = 499;
  const maxPos        = 15;
  const galaxyOffsets = cfg.galaxyOffsets || [0];
  const systemSpread  = cfg.systemSpread  || 50;

  const colonyIdx  = player.planets.length - 1;
  const sysOffset  = Math.floor(Math.random() * (systemSpread + 1));

  let targetGal;
  if (colonyIdx < galaxyOffsets.length) {
    const galOffset = galaxyOffsets[colonyIdx];
    targetGal = ((home.coordinates.gal - 1 + galOffset + totalGal * 100) % totalGal) + 1;
  } else {
    targetGal = Math.floor(Math.random() * totalGal) + 1;
  }
  const targetSys = ((home.coordinates.sys - 1 + sysOffset) % totalSys) + 1;

  const middlePos = Math.ceil(maxPos / 2); // 8
  const posQueue  = [
    middlePos,
    Math.floor(Math.random() * 6) + 1,
    Math.floor(Math.random() * 6) + 1,
  ];

  let targetPos = null;
  for (const pos of posQueue) {
    if (!uni.allCord[`${targetGal}_${targetSys}_${pos}`]) { targetPos = pos; break; }
  }
  if (targetPos === null) return; // retry next cycle with fresh randoms

  uni.addFleetMovement(player, sourceNum, false, {
    ships:       { ...fun.zeroShips(), misil: 0, colony: 1 },
    coorDesde:   player.planets[sourceNum].coordinates,
    coorHasta:   { gal: targetGal, sys: targetSys, pos: targetPos },
    destination: 1,
    porce:       100,
    mission:     1, // colonize
    resources:   fun.zeroResources()
  }, fakeRes);
}

// Returns ms of scheduler-active time in [fromMs, toMs].
// Used to pause the attackWait timer during inactive windows.
function _schedulerActiveMs(scheduler, fromMs, toMs) {
  if (!scheduler || scheduler.length === 0) return Math.max(0, toMs - fromMs);
  let total  = 0;
  let cursor = fromMs;
  while (cursor < toMs) {
    const d        = new Date(cursor);
    const dayStart = new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
    const dayEnd   = dayStart + 86400000;
    for (const w of scheduler) {
      const wStart = dayStart + w.start * 3600000;
      const wEnd   = dayStart + w.end   * 3600000;
      const start  = Math.max(cursor, wStart);
      const end    = Math.min(toMs, wEnd);
      if (end > start) total += end - start;
    }
    cursor = dayEnd;
  }
  return total;
}

// TODO: replace full battle sim with a fast analytical estimator (power ratio, rapid fire, etc.)
function fastBattleSimulator(atkShips, defShips, defDefenses, atkResearch, defResearch) {
  return battleMod.battle(atkShips, defShips, defDefenses, atkResearch, defResearch, false);
}

function _buildAttackFleet(player) {
  const ships = { ...fun.zeroShips(), misil: 0 };
  const p = player.planets[0];
  if (p) {
    for (const k of ATTACK_SHIP_KEYS) ships[k] = p.fleet[k] || 0;
  }
  return ships;
}

// Returns true when attackWait scheduler-active time has elapsed since last attack cycle.
// Updates the in-memory accumulators every call; resets when it fires.
// Called once per runBot tick (which only runs in-window), so elapsed is always active time.
function _tickAttackTimer(player) {
  const cfg = player.bot.attackConfig;
  if (!cfg) return false;

  const now       = Date.now();
  const name      = player.name;
  const last      = attackLastRunMs.get(name);
  const prevAccum = attackActiveMs.get(name) || 0;
  const elapsed   = last ? _schedulerActiveMs(player.bot.scheduler, last, now) : 0;
  const newAccum  = prevAccum + elapsed;

  attackLastRunMs.set(name, now);

  const waitMs = (cfg.attackWait || 60) * 60 * 1000;
  if (newAccum < waitMs) {
    attackActiveMs.set(name, newAccum);
    return false;
  }

  attackActiveMs.set(name, 0);
  return true;
}

function _tryAttack(player, uni, events) {
  const cfg = player.bot.attackConfig;
  if (!cfg || !cfg.enabled) return;

  const planet0      = player.planets[0];
  if (!planet0) return;

  const ourGal      = planet0.coordinates.gal;
  const ourPoints   = player.puntos;
  const attackRadio = cfg.attackRadio || 10;
  const minInactMs  = (cfg.minInactiveHours || 24) * 3600000;
  const maxPointRat = cfg.maxPointRatio || 3.0;
  const minRes      = cfg.minResources || 0;
  const maxSlots    = player.research.computer + 1;

  // Collect unique candidate player names: same galaxy, within attackRadio of any bot planet
  const seen           = new Set();
  const candidateNames = [];
  for (const [cord, info] of Object.entries(uni.allCord)) {
    if (!info.playerName || info.playerName === name) continue;
    if (seen.has(info.playerName)) continue;
    const parts = cord.split('_').map(Number);
    const [gal, sys] = parts;
    if (gal !== ourGal) continue;
    let inRange = false;
    for (const p of player.planets) {
      if (p.coordinates.gal !== ourGal) continue;
      if (Math.abs(sys - p.coordinates.sys) <= attackRadio) { inRange = true; break; }
    }
    if (!inRange) continue;
    seen.add(info.playerName);
    candidateNames.push(info.playerName);
  }

  // Build per-player candidate list with min system-distance to any bot planet
  const playerCands = new Map(); // playerName → { minDist }
  for (const [cord, info] of Object.entries(uni.allCord)) {
    if (!info.playerName || info.playerName === name) continue;
    const parts = cord.split('_').map(Number);
    const [gal, sys] = parts;
    if (gal !== ourGal) continue;
    let minDist = Infinity;
    for (const p of player.planets) {
      if (p.coordinates.gal !== ourGal) continue;
      const d = Math.abs(sys - p.coordinates.sys);
      if (d < minDist) minDist = d;
    }
    if (minDist > attackRadio) continue;
    const existing = playerCands.get(info.playerName);
    if (!existing || minDist < existing.minDist) {
      playerCands.set(info.playerName, { minDist });
    }
  }

  if (playerCands.size === 0) return;

  // Slots available: reserve 1 for the attack fleet itself
  const freeSlots  = Math.max(0, maxSlots - player.movement.length - 1);
  if (freeSlots <= 0) return;

  let candidates = Array.from(playerCands.entries())
    .map(([playerName, { minDist }]) => ({ playerName, minDist }));

  // Sort/trim according to selectMode
  const selectMode = cfg.selectMode || 'random';
  if (candidates.length > freeSlots) {
    switch (selectMode) {
      case 'inside':  candidates.sort((a, b) => a.minDist - b.minDist); break;
      case 'outside': candidates.sort((a, b) => b.minDist - a.minDist); break;
      default: // 'random'
        for (let i = candidates.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [candidates[i], candidates[j]] = [candidates[j], candidates[i]];
        }
        break;
    }
    candidates = candidates.slice(0, freeSlots);
  }

  let pending  = candidates.length;
  const viable = []; // { target, planet, coor, totalRes }

  function onDone() {
    if (--pending > 0) return;

    if (viable.length === 0) return;

    // Send one spy probe per viable target (from planet with most probes)
    let spySrcNum = 0;
    let spyMax    = player.planets[0].fleet.espionageProbe || 0;
    for (let i = 1; i < player.planets.length; i++) {
      const cnt = player.planets[i].fleet.espionageProbe || 0;
      if (cnt > spyMax) { spyMax = cnt; spySrcNum = i; }
    }
    for (const v of viable) {
      if (player.movement.length >= maxSlots || spyMax <= 0) break;
      uni.addFleetMovement(player, spySrcNum, false, {
        ships:       { ...fun.zeroShips(), misil: 0, espionageProbe: 1 },
        coorDesde:   player.planets[spySrcNum].coordinates,
        coorHasta:   v.coor,
        destination: 1, porce: 100, mission: 5,
        resources:   fun.zeroResources()
      }, fakeRes);
      spyMax--;
    }

    // Simulate battle for each viable target; pick best loot that the bot wins
    const atkFleet = _buildAttackFleet(player);
    if (ATTACK_SHIP_KEYS.every(k => atkFleet[k] === 0)) return;

    let bestVictim = null;
    let bestLoot   = -1;
    for (const v of viable) {
      let result;
      try {
        result = fastBattleSimulator(
          atkFleet, v.planet.fleet, v.planet.defense,
          player.research, v.target.research
        );
      } catch (e) { continue; }
      if (result.winner !== 'Attacker') continue;
      if (v.totalRes > bestLoot) { bestLoot = v.totalRes; bestVictim = v; }
    }

    if (!bestVictim || player.movement.length >= maxSlots) return;

    uni.addFleetMovement(player, 0, false, {
      ships:       atkFleet,
      coorDesde:   planet0.coordinates,
      coorHasta:   bestVictim.coor,
      destination: 1, porce: 100, mission: 7,
      resources:   fun.zeroResources()
    }, fakeRes);
  }

  for (const cand of candidates) {
    uni.base.findAndExecuteByName(cand.playerName, (target) => {
      if (!target)                                             { onDone(); return; }
      if (!target.botType || target.botType === 'human')      { onDone(); return; }
      if (target.puntos > ourPoints * maxPointRat)            { onDone(); return; }
      if (target.lastVisit > now - minInactMs)                { onDone(); return; }

      for (const planet of target.planets) {
        const c = planet.coordinates;
        if (c.gal !== ourGal) continue;
        let inRange = false;
        for (const p of player.planets) {
          if (p.coordinates.gal !== ourGal) continue;
          if (Math.abs(c.sys - p.coordinates.sys) <= attackRadio) { inRange = true; break; }
        }
        if (!inRange) continue;
        const totalRes = planet.resources.metal + planet.resources.crystal + planet.resources.deuterium;
        if (totalRes < minRes) continue;
        viable.push({ target, planet, coor: c, totalRes });
        break; // one planet per player
      }
      onDone();
    });
  }
}

function _tryRecycle(player, uni) {
  const cfg = player.bot.attackConfig;
  if (!cfg || cfg.debrisRadio == null) return;

  const debrisRadio = cfg.debrisRadio;
  const planet0     = player.planets[0];
  if (!planet0) return;
  const ourGal   = planet0.coordinates.gal;
  const maxSlots = player.research.computer + 1;
  if (player.movement.length >= maxSlots) return;

  // Find source planet in same galaxy with most recyclers
  let srcNum       = -1;
  let srcRecyclers = 0;
  for (let i = 0; i < player.planets.length; i++) {
    const p   = player.planets[i];
    if (p.coordinates.gal !== ourGal) continue;
    const cnt = p.fleet.recycler || 0;
    if (cnt > srcRecyclers) { srcRecyclers = cnt; srcNum = i; }
  }
  if (srcNum === -1 || srcRecyclers === 0) return;

  function inRadio(coor) {
    for (const p of player.planets) {
      if (p.coordinates.gal !== ourGal) continue;
      if (Math.abs(coor.sys - p.coordinates.sys) <= debrisRadio) return true;
    }
    return false;
  }

  const debrisCandidates = [];

  // Own planets — no extra DB call
  for (const p of player.planets) {
    if (!p.debris || !p.debris.active) continue;
    if (p.coordinates.gal !== ourGal) continue;
    if (!inRadio(p.coordinates)) continue;
    const total = (p.debris.metal || 0) + (p.debris.crystal || 0);
    if (total > 0) debrisCandidates.push({ coor: p.coordinates, total });
  }

  // Other players in same galaxy
  const seen         = new Set([player.name]);
  const otherPlayers = [];
  for (const [cord, info] of Object.entries(uni.allCord)) {
    if (!info.playerName || seen.has(info.playerName)) continue;
    const parts = cord.split('_').map(Number);
    if (parts[0] !== ourGal) continue;
    seen.add(info.playerName);
    otherPlayers.push(info.playerName);
  }

  function sendRecyclers() {
    if (debrisCandidates.length === 0) return;

    debrisCandidates.sort((a, b) => b.total - a.total);

    const src     = player.planets[srcNum];
    let available = srcRecyclers;

    for (const d of debrisCandidates) {
      if (player.movement.length >= maxSlots || available <= 0) break;

      const alreadyGoing = player.movement.some(m =>
        m.mission === 2 &&
        m.coorHasta.gal === d.coor.gal &&
        m.coorHasta.sys === d.coor.sys &&
        m.coorHasta.pos === d.coor.pos
      );
      if (alreadyGoing) continue;

      const toSend = Math.min(available, Math.ceil(d.total / 20000));
      uni.addFleetMovement(player, srcNum, false, {
        ships:       { ...fun.zeroShips(), misil: 0, recycler: toSend },
        coorDesde:   src.coordinates,
        coorHasta:   d.coor,
        destination: 3,
        porce:       100,
        mission:     2,
        resources:   fun.zeroResources()
      }, fakeRes);
      available -= toSend;
    }
  }

  if (otherPlayers.length === 0) { sendRecyclers(); return; }

  let pending = otherPlayers.length;
  function onDone() { if (--pending > 0) return; sendRecyclers(); }

  for (const targetName of otherPlayers) {
    uni.base.findAndExecuteByName(targetName, (target) => {
      if (target) {
        for (const planet of target.planets) {
          if (!planet.debris || !planet.debris.active) continue;
          if (planet.coordinates.gal !== ourGal) continue;
          if (!inRadio(planet.coordinates)) continue;
          const total = (planet.debris.metal || 0) + (planet.debris.crystal || 0);
          if (total > 0) debrisCandidates.push({ coor: planet.coordinates, total });
        }
      }
      onDone();
    });
  }
}

function _defenseScore(planet) {
  const costs = fun.costShipsAndDefenses();
  let score = 0;
  for (const key of fun.keysDefensas) {
    const count = planet.defense[key] || 0;
    const cost  = costs[key];
    if (count > 0 && cost) score += count * (cost.metal + cost.crystal);
  }
  return score;
}

function _runMoonBuildingMission(player, planetNum, mission, uni, events) {
  const planet = player.planets[planetNum];
  if (!planet) return false;

  const moon = planet.moon;
  if (!moon || !moon.active) return false; // no moon — _missionDone already skips, shouldn't reach here

  // Another moon building in progress — wait for it
  const mbc = moon.buildingConstrucction;
  if (mbc && mbc.active) {
    events.addElement({ time: mbc.init + mbc.time * 1000, player: player.name });
    return true;
  }

  const moonCosts = uni.costMoon(player, planetNum);
  const cost      = moonCosts && moonCosts[mission.item];
  if (!cost || !cost.tech) {
    _scheduleEvent(events, player, FALLBACK_RETRY_MS);
    return true;
  }

  const moonRes = moon.resources;

  // Moon already has enough resources → build
  if (_resourcesEnough(moonRes, cost.metal, cost.crystal, cost.deuterium)) {
    uni.proccesMoonRequest(player, planetNum, mission.item, fakeRes);
    return true;
  }

  // Resources the moon still needs
  const needMetal = Math.max(0, cost.metal     - moonRes.metal);
  const needCrys  = Math.max(0, cost.crystal   - moonRes.crystal);
  const needDeut  = Math.max(0, cost.deuterium - moonRes.deuterium);
  const totalNeed = needMetal + needCrys + needDeut;

  // Transport to moon already in flight
  const alreadySending = player.movement.some(m =>
    m.mission === 3 && m.destination === 2 &&
    m.coorHasta.gal === planet.coordinates.gal &&
    m.coorHasta.sys === planet.coordinates.sys &&
    m.coorHasta.pos === planet.coordinates.pos
  );
  if (alreadySending) {
    _scheduleEvent(events, player, FALLBACK_RETRY_MS);
    return true;
  }

  // Planet must produce/hold enough to cover the deficit
  const planetRes  = planet.resources;
  const planetProd = planet.resourcesAdd;
  if (!_resourcesEnough(planetRes, needMetal, needCrys, needDeut)) {
    const ms = _msUntilResources(planetRes, planetProd, needMetal, needCrys, needDeut);
    _scheduleEvent(events, player, ms + RESOURCE_WAIT_BUFFER_MS);
    return true;
  }

  // Check cargo capacity
  const smallCargo = planet.fleet.smallCargo || 0;
  const largeCargo = planet.fleet.largeCargo || 0;
  const capacity   = smallCargo * 5000 + largeCargo * 25000;

  if (capacity < totalNeed) {
    // Build a cargo ship first
    const inQueue = planet.shipConstrucction.find(q =>
      (q.item === 'largeCargo' || q.item === 'smallCargo') && q.cant > 0
    );
    if (inQueue) {
      events.addElement({ time: Date.now() + inQueue.timeNow * 1000, player: player.name });
      return true;
    }

    const shipCosts = uni.costShipyard(player, planetNum, false);
    const lcCost    = shipCosts && shipCosts.largeCargo;
    const scCost    = shipCosts && shipCosts.smallCargo;

    if (lcCost && _resourcesEnough(planetRes, lcCost.metal, lcCost.crystal, lcCost.deuterium)) {
      uni.proccesShipyardRequest(player, planetNum, 'largeCargo', 1, fakeRes);
    } else if (scCost && _resourcesEnough(planetRes, scCost.metal, scCost.crystal, scCost.deuterium)) {
      uni.proccesShipyardRequest(player, planetNum, 'smallCargo', 1, fakeRes);
    } else {
      const cheapest = scCost || lcCost;
      if (cheapest) {
        const ms = _msUntilResources(planetRes, planetProd, cheapest.metal, cheapest.crystal, cheapest.deuterium);
        _scheduleEvent(events, player, ms + RESOURCE_WAIT_BUFFER_MS);
      } else {
        _scheduleEvent(events, player, FALLBACK_RETRY_MS);
      }
    }
    return true;
  }

  // Transport resources from planet to moon
  uni.addFleetMovement(player, planetNum, false, {
    ships:       { ...fun.zeroShips(), misil: 0, smallCargo, largeCargo },
    coorDesde:   planet.coordinates,
    coorHasta:   planet.coordinates,
    destination: 2,
    porce:       100,
    mission:     3,
    resources:   { metal: needMetal, crystal: needCrys, deuterium: needDeut }
  }, fakeRes);

  _scheduleEvent(events, player, FALLBACK_RETRY_MS);
  return true;
}

function _runMoonMission(player, planetNum, uni, events) {
  const srcPlanet = player.planets[planetNum];
  if (!srcPlanet) return false;

  // Find target: own planet with highest defense score that has no moon
  let bestTarget    = null;
  let bestScore     = -1;
  for (let i = 0; i < player.planets.length; i++) {
    if (i === planetNum) continue;
    const p = player.planets[i];
    if (p.moon && p.moon.active) continue;
    const score = _defenseScore(p);
    if (score > bestScore) { bestScore = score; bestTarget = { planet: p, idx: i }; }
  }

  if (!bestTarget) return false; // all other planets already have moons

  // Choose fleet: 1667 LF or 112 BS — whichever has a higher current/goal ratio (closer)
  const currentLF = srcPlanet.fleet.lightFighter || 0;
  const currentBS = srcPlanet.fleet.battleship   || 0;
  const useLF     = (currentLF / MOON_LF_GOAL) >= (currentBS / MOON_BS_GOAL);

  const moonFleet = { ...fun.zeroShips(), misil: 0 };
  if (useLF) moonFleet.lightFighter = MOON_LF_GOAL;
  else       moonFleet.battleship   = MOON_BS_GOAL;

  // Simulate: defender must win (so ships are destroyed and debris/moon chance appears at defender)
  let simResult;
  try {
    simResult = fastBattleSimulator(
      moonFleet,
      bestTarget.planet.fleet,
      bestTarget.planet.defense,
      player.research,
      player.research
    );
  } catch (e) {
    _scheduleEvent(events, player, FALLBACK_RETRY_MS);
    return true;
  }

  if (simResult.winner === 'Defenser') {
    const haveFleet = useLF ? currentLF >= MOON_LF_GOAL : currentBS >= MOON_BS_GOAL;

    if (haveFleet) {
      const alreadyGoing = player.movement.some(m =>
        m.mission === 7 &&
        m.coorHasta.gal === bestTarget.planet.coordinates.gal &&
        m.coorHasta.sys === bestTarget.planet.coordinates.sys &&
        m.coorHasta.pos === bestTarget.planet.coordinates.pos
      );
      if (!alreadyGoing) {
        uni.addFleetMovement(player, planetNum, false, {
          ships:       moonFleet,
          coorDesde:   srcPlanet.coordinates,
          coorHasta:   bestTarget.planet.coordinates,
          destination: 1, porce: 100, mission: 7,
          resources:   fun.zeroResources()
        }, fakeRes);
      }
      _scheduleEvent(events, player, FALLBACK_RETRY_MS);
      return true;
    }

    // Need to build the fleet first
    const item = useLF ? 'lightFighter' : 'battleship';
    const goal = useLF ? MOON_LF_GOAL   : MOON_BS_GOAL;
    const need = goal - (useLF ? currentLF : currentBS);

    const inQueue = srcPlanet.shipConstrucction.find(q => q.item === item && q.cant > 0);
    if (inQueue) {
      events.addElement({ time: Date.now() + inQueue.timeNow * 1000, player: player.name });
      return true;
    }

    const shipCosts = uni.costShipyard(player, planetNum, false);
    const c         = shipCosts && shipCosts[item];
    if (!c) { _scheduleEvent(events, player, FALLBACK_RETRY_MS); return true; }

    const res  = srcPlanet.resources;
    const prod = srcPlanet.resourcesAdd;
    const canAfford = Math.min(
      c.metal     > 0 ? Math.floor(res.metal     / c.metal)     : Infinity,
      c.crystal   > 0 ? Math.floor(res.crystal   / c.crystal)   : Infinity,
      c.deuterium > 0 ? Math.floor(res.deuterium / c.deuterium) : Infinity,
      need
    );
    if (canAfford >= 1) {
      uni.proccesShipyardRequest(player, planetNum, item, canAfford, fakeRes);
    } else {
      const ms = _msUntilResources(res, prod, c.metal, c.crystal, c.deuterium);
      _scheduleEvent(events, player, ms + RESOURCE_WAIT_BUFFER_MS);
    }
    return true;
  }

  // No target has enough defense to stop the moon fleet — redirect resources to first colony
  // without a moon (not the moon-mission planet, not the home planet)
  let transferIdx = -1;
  for (let i = 1; i < player.planets.length; i++) {
    if (i === planetNum) continue;
    if (player.planets[i].moon && player.planets[i].moon.active) continue;
    transferIdx = i;
    break;
  }

  if (transferIdx === -1) { _scheduleEvent(events, player, FALLBACK_RETRY_MS); return true; }

  const tPlanet    = player.planets[transferIdx];
  const smallCargo = srcPlanet.fleet.smallCargo || 0;
  const largeCargo = srcPlanet.fleet.largeCargo || 0;

  if (smallCargo + largeCargo === 0) { _scheduleEvent(events, player, FALLBACK_RETRY_MS); return true; }

  const alreadySending = player.movement.some(m =>
    m.mission === 3 &&
    m.coorDesde.gal === srcPlanet.coordinates.gal &&
    m.coorDesde.sys === srcPlanet.coordinates.sys &&
    m.coorDesde.pos === srcPlanet.coordinates.pos &&
    m.coorHasta.gal === tPlanet.coordinates.gal &&
    m.coorHasta.sys === tPlanet.coordinates.sys &&
    m.coorHasta.pos === tPlanet.coordinates.pos
  );
  if (!alreadySending) {
    const res = srcPlanet.resources;
    uni.addFleetMovement(player, planetNum, false, {
      ships:       { ...fun.zeroShips(), misil: 0, smallCargo, largeCargo },
      coorDesde:   srcPlanet.coordinates,
      coorHasta:   tPlanet.coordinates,
      destination: 1, porce: 100, mission: 3,
      resources:   { metal: res.metal, crystal: res.crystal, deuterium: res.deuterium }
    }, fakeRes);
  }
  _scheduleEvent(events, player, FALLBACK_RETRY_MS);
  return true;
}

function runBot(player, uni, events) {
  if (!player.bot || player.botType === 'human') return;

  const now = _horaActual();

  if (!_isInSchedulerWindow(player.bot.scheduler, now)) {
    const msUntil = _msUntilNextWindow(player.bot.scheduler, now);
    _scheduleEvent(events, player, msUntil);
    return;
  }

  let needsFallback = true;

  // Research first — highest priority
  if (_runResearchMission(player, uni, events)) needsFallback = false;

  // Planet missions — one per planet
  for (let i = 0; i < player.planets.length; i++) {
    if (_runPlanetMission(player, i, uni, events)) needsFallback = false;
    if (i !== 0) _joinFleet(player, i, player.bot, uni);
  }

  if (_tickAttackTimer(player)) {
    _tryAttack(player, uni, events);
    _tryRecycle(player, uni);
  }
  _tryColonize(player, uni, player.bot, events);

  if (needsFallback) {
    _scheduleEvent(events, player, FALLBACK_RETRY_MS);
  }
}

module.exports = {
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
};
