const { _findEarliestPastCompletion, _rehydrateQueue, runStartupCatchup } = require('../../routes/bots/bot_simulation');

const NOW = 1_000_000_000;   // fixed reference timestamp (ms)
const PAST = NOW - 60_000;   // 1 minute before NOW
const FUTURE = NOW + 60_000; // 1 minute after NOW

// ─── helpers ─────────────────────────────────────────────────────────────────

function makeBC(initOffset, timeSeconds, active = true) {
  // init + time*1000 = completion timestamp
  return { active, item: 'metalMine', init: NOW + initOffset, time: timeSeconds };
}

function makePlanet(overrides = {}) {
  return {
    buildingConstrucction: { active: false },
    moon: { active: false, buildingConstrucction: { active: false } },
    shipConstrucction: [],
    ...overrides
  };
}

function makePlayer(overrides = {}) {
  return {
    name: 'bot1',
    botType: 'miner',
    researchConstrucction: { active: false },
    planets: [makePlanet()],
    movement: [],
    bot: { scheduler: null, missionList: [], planetProgress: { 0: 0 }, research: { currentMission: 0, list: [] }, attackConfig: { enabled: false } },
    ...overrides
  };
}

function makeMockEvents() {
  return { addElement: jest.fn() };
}

function makeMockUni(players = []) {
  const uni = {
    base: {
      forEachPlayerSortedByPoints: jest.fn((forEach, done) => {
        players.forEach(forEach);
        done();
      })
    },
    events: makeMockEvents(),
    updatePlayer: jest.fn()
  };
  return uni;
}

// ─── _findEarliestPastCompletion ─────────────────────────────────────────────

describe('_findEarliestPastCompletion', () => {
  test('no active constructions → null', () => {
    const player = makePlayer();
    expect(_findEarliestPastCompletion(player, NOW)).toBeNull();
  });

  test('research completed in past → returns finish time', () => {
    // init = NOW - 120_000, time = 60s → finish = NOW - 60_000 < NOW
    const player = makePlayer({ researchConstrucction: makeBC(-120_000, 60) });
    expect(_findEarliestPastCompletion(player, NOW)).toBe(NOW - 120_000 + 60_000);
  });

  test('research not done yet → null', () => {
    // finish = NOW + 30_000 > NOW
    const player = makePlayer({ researchConstrucction: makeBC(0, 30) });
    expect(_findEarliestPastCompletion(player, NOW)).toBeNull();
  });

  test('inactive research → ignored', () => {
    const player = makePlayer({ researchConstrucction: makeBC(-200_000, 60, false) });
    expect(_findEarliestPastCompletion(player, NOW)).toBeNull();
  });

  test('planet building done in past → returns finish time', () => {
    const player = makePlayer({
      planets: [makePlanet({ buildingConstrucction: makeBC(-120_000, 60) })]
    });
    expect(_findEarliestPastCompletion(player, NOW)).toBe(NOW - 60_000);
  });

  test('planet building not done yet → null', () => {
    const player = makePlayer({
      planets: [makePlanet({ buildingConstrucction: makeBC(0, 3600) })]
    });
    expect(_findEarliestPastCompletion(player, NOW)).toBeNull();
  });

  test('moon building done in past → returns finish time', () => {
    const player = makePlayer({
      planets: [makePlanet({
        moon: {
          active: true,
          buildingConstrucction: makeBC(-120_000, 60)
        }
      })]
    });
    expect(_findEarliestPastCompletion(player, NOW)).toBe(NOW - 60_000);
  });

  test('inactive moon → moon building ignored', () => {
    const player = makePlayer({
      planets: [makePlanet({
        moon: {
          active: false,
          buildingConstrucction: makeBC(-120_000, 60)
        }
      })]
    });
    expect(_findEarliestPastCompletion(player, NOW)).toBeNull();
  });

  test('multiple past completions → returns earliest', () => {
    // research finishes at NOW - 30_000 (init = NOW-90k, time=60s)
    // building finishes at NOW - 50_000 (init = NOW-110k, time=60s)
    const player = makePlayer({
      researchConstrucction: makeBC(-90_000, 60),
      planets: [makePlanet({ buildingConstrucction: makeBC(-110_000, 60) })]
    });
    expect(_findEarliestPastCompletion(player, NOW)).toBe(NOW - 50_000);
  });

  test('mix of past and future → returns only the past one', () => {
    const player = makePlayer({
      researchConstrucction: makeBC(0, 3600),           // future
      planets: [makePlanet({ buildingConstrucction: makeBC(-120_000, 60) })]  // past
    });
    expect(_findEarliestPastCompletion(player, NOW)).toBe(NOW - 60_000);
  });
});

// ─── _rehydrateQueue ──────────────────────────────────────────────────────────

describe('_rehydrateQueue', () => {
  test('no pending constructions → no events added', () => {
    const events = makeMockEvents();
    _rehydrateQueue(makePlayer(), events, NOW);
    expect(events.addElement).not.toHaveBeenCalled();
  });

  test('future research → event added', () => {
    const finishTime = FUTURE + 10_000;
    const player = makePlayer({
      researchConstrucction: { active: true, init: NOW, time: (finishTime - NOW) / 1000 }
    });
    const events = makeMockEvents();
    _rehydrateQueue(player, events, NOW);
    expect(events.addElement).toHaveBeenCalledWith({ time: finishTime, player: 'bot1' });
  });

  test('past research → NOT added to queue', () => {
    const player = makePlayer({
      researchConstrucction: makeBC(-120_000, 60)  // finish = NOW - 60_000
    });
    const events = makeMockEvents();
    _rehydrateQueue(player, events, NOW);
    expect(events.addElement).not.toHaveBeenCalled();
  });

  test('future planet building → event added', () => {
    const player = makePlayer({
      planets: [makePlanet({ buildingConstrucction: makeBC(0, 3600) })]  // NOW + 3600_000
    });
    const events = makeMockEvents();
    _rehydrateQueue(player, events, NOW);
    expect(events.addElement).toHaveBeenCalledWith(
      expect.objectContaining({ player: 'bot1', time: NOW + 3_600_000 })
    );
  });

  test('future moon building → event added', () => {
    const player = makePlayer({
      planets: [makePlanet({
        moon: { active: true, buildingConstrucction: makeBC(0, 1800) }  // NOW + 1800_000
      })]
    });
    const events = makeMockEvents();
    _rehydrateQueue(player, events, NOW);
    expect(events.addElement).toHaveBeenCalledWith(
      expect.objectContaining({ time: NOW + 1_800_000, player: 'bot1' })
    );
  });

  test('future fleet movement → event added', () => {
    const arrivalTime = NOW + 5_000;
    const player = makePlayer({ movement: [{ llegada: arrivalTime }] });
    const events = makeMockEvents();
    _rehydrateQueue(player, events, NOW);
    expect(events.addElement).toHaveBeenCalledWith({ time: arrivalTime, player: 'bot1' });
  });

  test('past fleet movement → NOT added', () => {
    const player = makePlayer({ movement: [{ llegada: PAST }] });
    const events = makeMockEvents();
    _rehydrateQueue(player, events, NOW);
    expect(events.addElement).not.toHaveBeenCalled();
  });

  test('ship queue with pending ships → event added', () => {
    const player = makePlayer({
      planets: [makePlanet({
        shipConstrucction: [{ cant: 3, timeNow: 120 }]  // 120s remaining
      })]
    });
    const events = makeMockEvents();
    _rehydrateQueue(player, events, NOW);
    expect(events.addElement).toHaveBeenCalledWith(
      expect.objectContaining({ player: 'bot1', time: NOW + 120_000 })
    );
  });

  test('multiple future constructions → multiple events', () => {
    const player = makePlayer({
      researchConstrucction: { active: true, init: NOW, time: 60 },
      planets: [makePlanet({ buildingConstrucction: makeBC(0, 120) })],
      movement: [{ llegada: FUTURE }]
    });
    const events = makeMockEvents();
    _rehydrateQueue(player, events, NOW);
    expect(events.addElement).toHaveBeenCalledTimes(3);
  });
});

// ─── runStartupCatchup ────────────────────────────────────────────────────────

describe('runStartupCatchup', () => {
  beforeEach(() => jest.useFakeTimers());
  afterEach(() => jest.useRealTimers());

  test('calls forEachPlayerSortedByPoints', () => {
    const uni = makeMockUni([]);
    runStartupCatchup(uni);
    expect(uni.base.forEachPlayerSortedByPoints).toHaveBeenCalled();
  });

  test('calls updatePlayer once per player (initial catch-up)', () => {
    const player = makePlayer({ botType: undefined });
    const uni = makeMockUni([player]);
    uni.updatePlayer.mockImplementation((p, cb) => cb());
    runStartupCatchup(uni);
    expect(uni.updatePlayer).toHaveBeenCalledTimes(1);
    expect(uni.updatePlayer).toHaveBeenCalledWith(player, expect.any(Function), expect.any(Number));
  });

  test('non-bot player → no simulation loop, only 1 updatePlayer call', () => {
    const player = makePlayer({ botType: undefined, bot: undefined });
    const uni = makeMockUni([player]);
    uni.updatePlayer.mockImplementation((p, cb) => cb());
    runStartupCatchup(uni);
    expect(uni.updatePlayer).toHaveBeenCalledTimes(1);
  });

  test('human botType → no simulation loop', () => {
    const player = makePlayer({ botType: 'human' });
    const uni = makeMockUni([player]);
    uni.updatePlayer.mockImplementation((p, cb) => cb());
    runStartupCatchup(uni);
    expect(uni.updatePlayer).toHaveBeenCalledTimes(1);
  });

  test('bot with no past completions → only 1 updatePlayer call', () => {
    const player = makePlayer();  // no active constructions
    const uni = makeMockUni([player]);
    uni.updatePlayer.mockImplementation((p, cb) => cb());
    runStartupCatchup(uni);
    expect(uni.updatePlayer).toHaveBeenCalledTimes(1);
  });

  test('bot with 1 past completion → updatePlayer called twice', () => {
    const player = makePlayer({
      planets: [makePlanet({ buildingConstrucction: makeBC(-120_000, 60) })]
    });
    const uni = makeMockUni([player]);
    let callCount = 0;
    uni.updatePlayer.mockImplementation((p, cb, simNow) => {
      callCount++;
      // Clear only on simulation step (2nd+ call) so the loop can find it first
      if (callCount > 1) p.planets[0].buildingConstrucction = { active: false };
      cb();
    });
    runStartupCatchup(uni);
    expect(callCount).toBe(2);  // 1 initial + 1 simulation step
  });

  test('simulation loop stops at MAX_STEPS (50)', () => {
    const player = makePlayer({
      planets: [makePlanet({ buildingConstrucction: makeBC(-120_000, 60) })]
    });
    const uni = makeMockUni([player]);
    // Never clear the past completion → loop should cap
    uni.updatePlayer.mockImplementation((p, cb) => cb());
    runStartupCatchup(uni);
    expect(uni.updatePlayer).toHaveBeenCalledTimes(51); // 1 initial + 50 loop steps
  });

  test('multiple players → each gets updatePlayer call', () => {
    const p1 = makePlayer({ name: 'bot1', botType: undefined });
    const p2 = makePlayer({ name: 'bot2', botType: undefined });
    const uni = makeMockUni([p1, p2]);
    uni.updatePlayer.mockImplementation((p, cb) => cb());
    runStartupCatchup(uni);
    expect(uni.updatePlayer).toHaveBeenCalledTimes(2);
  });

  test('passes simulatedNow ≈ Date.now() to first updatePlayer call', () => {
    const fixedNow = 1_700_000_000_000;
    jest.setSystemTime(fixedNow);
    const player = makePlayer({ botType: undefined });
    const uni = makeMockUni([player]);
    uni.updatePlayer.mockImplementation((p, cb) => cb());
    runStartupCatchup(uni);
    const [, , simNow] = uni.updatePlayer.mock.calls[0];
    expect(simNow).toBe(fixedNow);
  });

  test('simulation calls updatePlayer with completion time + 1 as simulatedNow', () => {
    // completion time = NOW - 120_000 + 60*1000 = NOW - 60_000
    const completionTime = NOW - 60_000;
    const player = makePlayer({
      planets: [makePlanet({ buildingConstrucction: makeBC(-120_000, 60) })]
    });
    jest.setSystemTime(NOW);
    const uni = makeMockUni([player]);
    let callCount = 0;
    uni.updatePlayer.mockImplementation((p, cb, simNow) => {
      callCount++;
      // Phase 1 uses simNow=NOW; only clear on simulation step so loop triggers
      if (simNow !== NOW) p.planets[0].buildingConstrucction = { active: false };
      cb();
    });
    runStartupCatchup(uni);
    // Second call (simulation step) should use completionTime + 1
    const [, , simNowSecondCall] = uni.updatePlayer.mock.calls[1];
    expect(simNowSecondCall).toBe(completionTime + 1);
  });
});
