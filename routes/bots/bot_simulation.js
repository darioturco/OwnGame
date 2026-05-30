const MAX_STEPS = 50;

function _findEarliestPastCompletion(player, now) {
  let earliest = null;

  const check = (t) => {
    if (t < now && (earliest === null || t < earliest)) earliest = t;
  };

  if (player.researchConstrucction && player.researchConstrucction.active) {
    check(player.researchConstrucction.init + player.researchConstrucction.time * 1000);
  }

  for (const planet of player.planets) {
    const bc = planet.buildingConstrucction;
    if (bc && bc.active) check(bc.init + bc.time * 1000);

    if (planet.moon && planet.moon.active) {
      const mb = planet.moon.buildingConstrucction;
      if (mb && mb.active) check(mb.init + mb.time * 1000);
    }
  }

  return earliest;
}

function _rehydrateQueue(player, events, now) {
  const addIfFuture = (t) => {
    if (t > now) events.addElement({ time: t, player: player.name });
  };

  if (player.researchConstrucction && player.researchConstrucction.active) {
    addIfFuture(player.researchConstrucction.init + player.researchConstrucction.time * 1000);
  }

  for (const planet of player.planets) {
    const bc = planet.buildingConstrucction;
    if (bc && bc.active) addIfFuture(bc.init + bc.time * 1000);

    if (planet.moon && planet.moon.active) {
      const mb = planet.moon.buildingConstrucction;
      if (mb && mb.active) addIfFuture(mb.init + mb.time * 1000);
    }

    // Ship queue — one event for the time the next ship completes
    if (planet.shipConstrucction && planet.shipConstrucction.length > 0) {
      const q = planet.shipConstrucction[0];
      if (q.cant > 0 && q.timeNow > 0) {
        addIfFuture(now + q.timeNow * 1000);
      }
    }
  }

  for (const mov of player.movement) {
    if (mov.llegada > now) addIfFuture(mov.llegada);
  }
}

function _simulateBotLoop(player, uni, now, steps, done) {
  if (steps >= MAX_STEPS) { done(); return; }

  const next = _findEarliestPastCompletion(player, now);
  if (!next) { done(); return; }

  uni.updatePlayer(player, () => {
    _rehydrateQueue(player, uni.events, now);
    _simulateBotLoop(player, uni, now, steps + 1, done);
  }, next + 1);
}

function _catchupPlayer(player, uni, now, done) {
  // Phase 1: full catch-up to now
  uni.updatePlayer(player, () => {
    _rehydrateQueue(player, uni.events, now);

    // Phase 2: bot sequential action simulation
    if (player.botType && player.botType !== 'human') {
      _simulateBotLoop(player, uni, now, 0, done);
    } else {
      done();
    }
  }, now);
}

function _safetyCheck(uni) {
  const now = Date.now();
  const inQueue = new Set(uni.events.queue.map(e => e.player));
  uni.base.forEachPlayerSortedByPoints(
    (player) => {
      if (!player.botType || player.botType === 'human') return;
      if (!inQueue.has(player.name)) {
        console.log('\x1b[33m%s\x1b[0m', `[safety] ${player.name} had no scheduled event — rescheduling.`);
        uni.events.addElement({ time: now, player: player.name });
      }
    },
    () => {}
  );
}

function runStartupCatchup(uni) {
  const now = Date.now();
  console.log('\x1b[35m%s\x1b[0m', `[startup] Running offline catch-up simulation...`);

  uni.base.forEachPlayerSortedByPoints(
    (player) => {
      _catchupPlayer(player, uni, now, () => {});
    },
    () => {
      console.log('\x1b[35m%s\x1b[0m', `[startup] Catch-up simulation complete.`);
      setInterval(() => _safetyCheck(uni), 60 * 60 * 1000);
    }
  );
}

module.exports = { runStartupCatchup, _findEarliestPastCompletion, _rehydrateQueue };
