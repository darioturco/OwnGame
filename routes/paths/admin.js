var fs = require('fs');
var path = require('path');
var router = require('express').Router();
var uni = require('../universe');
var dev = require('../dev/dev_functions');
var botNames = require('../bots/bot_names');

var typesDir = path.join(__dirname, '../bots/types');
var availableTypes = fs.readdirSync(typesDir)
  .filter(f => f.endsWith('.js'))
  .map(f => f.slice(0, -3));

router.post('/create-bots', (req, res) => {
  const { name, botType, count } = req.body;
  const n = parseInt(count);
  console.log(`[create-bots] Request received: name=${name}, botType=${botType}, count=${count} (n=${n})`);
  if(!name || !botType || isNaN(n) || n < 1){
    return res.status(400).json({ error: 'Parametros invalidos' });
  }
  uni.base.getListCord(async () => {
    const existingNames = new Set(Object.values(uni.allCord).map(v => v.playerName));
    const botName = (i) => n === 1 ? name : `${name}_${i}`;
    const conflicts = [];
    for(let i = 1; i <= n; i++){
      if(existingNames.has(botName(i))) conflicts.push(botName(i));
    }
    if(conflicts.length > 0){
      return res.status(400).json({ error: `Ya existen: ${conflicts.join(', ')}` });
    }
    try {
      let created = 0;
      for(let i = 1; i <= n; i++){
        const result = await uni.addNewPlayer(botName(i), 2, botType);
        if(result !== undefined) created++;
      }
      res.json({ ok: true, created });
    } catch(err) {
      res.status(500).json({ error: err.message });
    }
  });
});

router.post('/create-random-bots', (req, res) => {
  const { count } = req.body;
  const n = parseInt(count);
  if(isNaN(n) || n < 1) return res.status(400).json({ error: 'Parametros invalidos' });
  uni.base.getListCord(async () => {
    const existingNames = new Set(Object.values(uni.allCord).map(v => v.playerName));
    const getRandName = () => botNames[Math.floor(Math.random() * botNames.length)];
    const getRandType = () => availableTypes[Math.floor(Math.random() * availableTypes.length)];
    try {
      let created = 0;
      for(let i = 0; i < n; i++){
        let name;
        let attempts = 0;
        do {
          const base = getRandName();
          const suffix = Math.floor(Math.random() * 9000) + 1000;
          name = `${base}_${suffix}`;
          attempts++;
        } while(existingNames.has(name) && attempts < 100);
        if(existingNames.has(name)) continue;
        existingNames.add(name);
        const botType = getRandType();
        const result = await uni.addNewPlayer(name, 2, botType);
        if(result !== undefined) created++;
      }
      res.json({ ok: true, created });
    } catch(err) {
      res.status(500).json({ error: err.message });
    }
  });
});

router.post('/set-bot-config', (req, res) => {
  const { name, bot } = req.body;
  if(!name || !bot) return res.status(400).json({ ok: false, mes: 'Missing name or bot config' });
  uni.base.findAndExecuteByName(name, (player) => {
    if(!player) return res.status(404).json({ ok: false, mes: 'Player not found' });
    if(!player.botType || player.botType === 'human') return res.status(400).json({ ok: false, mes: 'Not a bot player' });
    uni.base.savePlayerData(name, { bot }, {}, undefined, undefined, () => {
      res.json({ ok: true, mes: 'Bot config updated' });
    });
  });
});

router.get('/get-bot', (req, res) => {
  const { name } = req.query;
  if(!name) return res.status(400).json({ok: false, mes: 'Missing name'});
  uni.base.findAndExecuteByName(name, (player) => {
    if(!player) return res.status(404).json({ok: false, mes: 'Player not found'});
    res.json({ok: true, bot: player.bot || null, botType: player.botType || null});
  });
});

router.post('/delete-player', (req, res) => {
  const { name } = req.body;
  if(!name) return res.status(400).json({ok: false, mes: 'Missing name'});
  if(uni.player && uni.player.name === name) return res.status(400).json({ok: false, mes: 'Cannot delete active player'});
  uni.deletePlayer(name, () => res.json({ok: true}));
});

router.post('/execute-dev-code', (req, res) => {
  if(!process.debugMode) return res.status(403).json({ok: false, mes: 'Not in debug mode'});
  dev.executeDevCode();
  res.json({ok: true, mes: 'Dev code executed'});
});

router.get('/delete-universe', (req, res) => {
  if(req.query.Sure !== 'Delete') return res.status(400).json({ok: false, mes: 'Missing confirmation'});
  uni.base.deleteCollection(['jugadores', 'universo']);
  uni.universo = null;
  uni.player = null;
  uni.allCord = {};
  uni.cantPlayers = 0;
  while(uni.events.length > 0) uni.events.useNext();
  res.json({ok: true});
});

router.post('/create-universe', (req, res) => {
  if(uni.universo) return res.status(400).json({ok: false, mes: 'Universe already exists'});
  const { name, speed, speedFleet, maxGalaxies, donutGalaxy, donutSystem, fleetDebris, defenceDebris, maxMoon, rapidFire } = req.body;
  if(!name || !speed || !speedFleet) return res.status(400).json({ok: false, mes: 'Missing fields'});
  const data = {
    inicio: 0,
    maxGalaxies:   parseInt(maxGalaxies)        || 9,
    donutGalaxy:   donutGalaxy  !== undefined ? Boolean(donutGalaxy)  : true,
    donutSystem:   donutSystem  !== undefined ? Boolean(donutSystem)  : true,
    speed:         parseFloat(speed),
    speedFleet:    parseFloat(speedFleet),
    fleetDebris:   parseFloat(fleetDebris)  >= 0 ? parseFloat(fleetDebris)  : 30,
    defenceDebris: parseFloat(defenceDebris) >= 0 ? parseFloat(defenceDebris) : 0,
    maxMoon:       parseFloat(maxMoon)      >= 0 ? parseFloat(maxMoon)      : 20,
    rapidFire:     rapidFire    !== undefined ? Boolean(rapidFire)    : true,
  };
  uni.base.setUniverseData(name, data);
  const logFile = path.join(__dirname, '../../logs/buildings.log');
  fs.unlink(logFile, () => {});
  res.json({ok: true});
});

module.exports = router;
