require('dotenv').config();
const UPDATE_TIME = 500;
var uni = require('../universe');
var costs = require('../constructions/costs');
var botSim = require('../bots/bot_simulation');
var router = require('express').Router();
var updater = setInterval(() => {uni.updateUniverse();}, UPDATE_TIME);
setTimeout(() => {uni.dailyUpdate();}, 86400000 - (uni.fun.horaActual() % 86400000));
uni.base.onReady(() => botSim.runStartupCatchup(uni));

console.log('\x1b[35m%s\x1b[0m', new Date());
router.all('/*', (req, res, next) => {
  if(req.url.slice(1,4) !== 'api' && req.url.slice(1,9) !== 'Imagenes'){
    if(isFinite(req.query.planet)) uni.planeta = parseInt(req.query.planet);
    if(req.query.moon != undefined) uni.moon = (req.query.moon == 'true');
    if(uni.moon && uni.player.planets[uni.planeta].moon.active === false) uni.moon = false;
    if(uni.player != undefined){
      uni.base.getPlayer(uni.player.name, next, false);
    }else{
      uni.base.getListCord(next);
    }
  }else{
     next();
  }
});

// Ruta de admin
router.get('/', (req, res, next) => {
  const coordMap = {};
  const seen = new Set();
  for(const [key, val] of Object.entries(uni.allCord)){
    if(!seen.has(val.playerName)){
      seen.add(val.playerName);
      const [gal, sys, pos] = key.split('_');
      coordMap[val.playerName] = { gal, sys, pos };
    }
  }
  uni.base.countInactivePlayers((inactivePlayers) => {
    const players = [];
    uni.base.forEachPlayerSortedByPoints((doc) => {
      if(coordMap[doc.name]){
        const numPlanets = doc.planets ? doc.planets.length : 0;

        let researchMission = '—';
        if (doc.bot && doc.bot.research && doc.bot.research.list && doc.bot.research.list.length > 0) {
          const ri = (doc.bot.research.currentMission || 0) % doc.bot.research.list.length;
          const rm = doc.bot.research.list[ri];
          if (rm) researchMission = `${rm.item} ${rm.level}`;
        }

        let planetMission = '—';
        if (doc.bot && doc.bot.missionList && doc.bot.missionList.length > 0) {
          const pi = ((doc.bot.planetProgress && doc.bot.planetProgress[0] != null) ? doc.bot.planetProgress[0] : 0) % doc.bot.missionList.length;
          const pm = doc.bot.missionList[pi];
          if (pm) {
            if (pm.type === 'building' || pm.type === 'moonBuilding') planetMission = `${pm.item} ${pm.level}`;
            else if (pm.type === 'fleet' || pm.type === 'defense') planetMission = `${pm.item} ${pm.amount}`;
            else if (pm.type === 'research') planetMission = `${pm.item} ${pm.level}`;
            else planetMission = pm.type;
          }
        }

        players.push({ name: doc.name, coor: coordMap[doc.name], type: doc.type || 'active', puntos: doc.puntos || 0, botType: doc.botType || '—', numPlanets, researchMission, planetMission });
      }
    }, () => {
      res.render('Landing', {
        universo: uni.universo,
        cantPlayers: uni.cantPlayers,
        inactivePlayers,
        players,
        debugMode: process.debugMode
      });
    });
  });
});

router.get('/Highscore.html', (req, res, next) => {
  let initVal = req.query.init;
  if(initVal === undefined || initVal <= 0 || initVal > uni.cantPlayers) initVal = uni.player.highscore;
  res.render('Highscore', {bodyId: "highscore",
    url: req._parsedOriginalUrl.pathname,
    init: initVal, // Posicion en la que esta player
    max: uni.cantPlayers,
    basic: uni.getActualBasicInfo(uni.planeta),
    listScript: ['./Scripts/Highscore.js']
  });
});

router.get('/MoonBuildings.html', (req, res, next) => {
  if(uni.moon){
    res.render('MoonBuildings', {bodyId: "resourceSettings",
      url: req._parsedOriginalUrl.pathname,
      info: uni.moonSetting(uni.planeta),
      basic: uni.getActualBasicInfo(uni.planeta),
      listScript: ['./Scripts/Moon_Settings.js']
    });
  }else{
    res.redirect('./Ogame_ResourceSetings.html');
  }
});

router.get('/OGame_Defence.html', (req, res, next) => {
  res.render('OGame_Defence', {bodyId: "defense",
    url: req._parsedOriginalUrl.pathname,
    info: uni.player.planets[uni.planeta].defense,
    basic: uni.getActualBasicInfo(uni.planeta),
    listScript: ['./Scripts/Description.js']
  });
});

router.get('/OGame_Facilities.html', (req, res, next) => {
  res.render('OGame_Facilities', {bodyId: "station",
    url: req._parsedOriginalUrl.pathname,
    info: uni.buildingsActualInfo(uni.planeta),
    basic: uni.getActualBasicInfo(uni.planeta),
    listScript: ['./Scripts/Description.js']
  });
});

router.get('/OGame_Fleet.html', (req, res, next) => {
  if(req.query.gal == undefined) req.query.gal = uni.player.planets[uni.planeta].coordinates.gal;
  if(req.query.sys == undefined) req.query.sys = uni.player.planets[uni.planeta].coordinates.sys;
  if(req.query.pos == undefined) req.query.pos = uni.player.planets[uni.planeta].coordinates.pos;
  if(req.query.mis == undefined) req.query.mis = -1;
  if(req.query.des == undefined) req.query.des = 1;
  res.render('OGame_Fleet', {bodyId: "fleet",
    url: req._parsedOriginalUrl.pathname,
    info: uni.fleetInfo(uni.planeta, uni.moon),
    basic: uni.getActualBasicInfo(uni.planeta),
    objCord: {gal: req.query.gal, sys: req.query.sys, pos: req.query.pos},
    mission: req.query.mis,
    destination: req.query.des,
    listScript: ['./Scripts/Fleet.js']
  });
});

router.get('/OGame_Galaxy.html', (req, res, next) => {
  let galInit = (req.query.gal == undefined) ? 1 : req.query.gal;
  let sysInit = (req.query.sys == undefined) ? 1 : req.query.sys;
  res.render('OGame_Galaxy', {bodyId: "galaxy",
    url: req._parsedOriginalUrl.pathname,
    coorInit: {gal: galInit, sys: sysInit},
    info: uni.galaxyInfo(uni.planeta),
    basic: uni.getActualBasicInfo(uni.planeta),
    listScript: ['./Scripts/Galaxy.js']
  });
});

router.get('/OGame_Messages.html', (req, res, next) => {
  uni.setNoReadMessages();
  res.render('OGame_Messages', {bodyId: "messages",
    url: req._parsedOriginalUrl.pathname,
    basic: uni.getActualBasicInfo(uni.planeta),
    listScript: ["./Scripts/Message.js"]
  });
});

router.get('/OGame_Movement.html', (req, res, next) => {
  res.render('OGame_Movement', {bodyId: "movement",
    url: req._parsedOriginalUrl.pathname,
    info: uni.fleetInfo(uni.planeta, uni.moon),
    basic: uni.getActualBasicInfo(uni.planeta),
    listScript: ['./Scripts/Movement.js']
  });
});

router.get('/OGame_Overview.html', (req, res, next) => {
  if(req.query.newName !== undefined && req.query.newName !== "" && req.query.newName.length <= 23){
    uni.setPlanetName(uni.player, uni.player.planets[uni.planeta].coordinates, req.query.newName, uni.moon); // Cambia el nombre al planeta
  }
  res.render('OGame_Overview', {bodyId: "overview",
    url: req._parsedOriginalUrl.pathname,
    info: uni.overviewActualInfo(uni.planeta),
    basic: uni.getActualBasicInfo(uni.planeta),
    listScript: []
  });
});

router.get('/OGame_Research.html', (req, res, next) => {
  res.render('OGame_Research', {bodyId: "research",
    url: req._parsedOriginalUrl.pathname,
    info: uni.player.research,
    basic: uni.getActualBasicInfo(uni.planeta),
    listScript: ['./Scripts/Description.js']
  });
});

router.get('/OGame_Resources.html', (req, res, next) => {
  if(uni.moon){
    res.redirect('./OGame_Facilities.html');
  }else{
    res.render('OGame_Resources', {bodyId: "resources",
      url: req._parsedOriginalUrl.pathname,
      info: uni.buildingsActualInfo(uni.planeta),
      basic: uni.getActualBasicInfo(uni.planeta),
      listScript: ['./Scripts/Description.js']
    });
  }
});

router.get('/OGame_ResourceSetings.html', (req, res, next) => {
  if(uni.moon){
    res.redirect('./MoonBuildings.html');
  }else{
    res.render('OGame_ResourceSetings', {bodyId: "resourceSettings",
      url: req._parsedOriginalUrl.pathname,
      info: uni.resourcesSetting(uni.planeta),
      basic: uni.getActualBasicInfo(uni.planeta),
      listScript: ['./Scripts/Resources_Info.js']
    });
  }
});

router.get('/OGame_Reward.html', (req, res, next) => {
  res.render('OGame_Reward', {bodyId: "reward",
    url: req._parsedOriginalUrl.pathname,
    info: uni.player.tutorial,
    basic: uni.getActualBasicInfo(uni.planeta),
    listScript: ['./Scripts/Reward.js']
  });
});

router.get('/OGame_Shipyard.html', (req, res, next) => {
  res.render('OGame_Shipyard', {bodyId: "shipyard",
    url: req._parsedOriginalUrl.pathname,
    info: (uni.moon) ? uni.player.planets[uni.planeta].moon.fleet : uni.player.planets[uni.planeta].fleet,
    basic: uni.getActualBasicInfo(uni.planeta),
    listScript: ['./Scripts/Description.js']
  });
});

router.get('/OGame_Technology.html', (req, res, next) => {
  res.render('OGame_Technology', {bodyId: "technology",
    url: req._parsedOriginalUrl.pathname,
    info: uni.techInfo(uni.planeta),
    technologyList: costs.technologyList,
    names: costs.names,
    basic: uni.getActualBasicInfo(uni.planeta),
    listScript: []
  });
});

router.get('/OGame_Calculator.html', (req, res, next) => {
  const planet = uni.player.planets[uni.planeta];
  const temp = Math.floor((planet.temperature.max + planet.temperature.min) / 2);
  res.render('OGame_Calculator', {bodyId: 'calculator',
    url: req._parsedOriginalUrl.pathname,
    basic: uni.getActualBasicInfo(uni.planeta),
    speed: uni.universo.speed,
    temp: temp,
    listScript: ['./Scripts/Calculator.js']
  });
});

router.get('/Options.html', (req, res, next) => {
  res.render('Options', {bodyId: "options",
    url: req._parsedOriginalUrl.pathname,
    info: uni.getQuickAtackDataOptions(),
    basic: uni.getActualBasicInfo(uni.planeta),
    listScript: []
  });
});

router.get('/Search.html', (req, res, next) => {
  res.render('Search', {bodyId: "search",
    url: req._parsedOriginalUrl.pathname,
    basic: uni.getActualBasicInfo(uni.planeta),
    listScript: ['./Scripts/Search.js']
  });
});

router.get('/Vacas.html', (req, res, next) => {
  res.render('Vacas', {bodyId: "vacas",
    url: req._parsedOriginalUrl.pathname,
    vacas: uni.player.vacas,
    basic: uni.getActualBasicInfo(uni.planeta),
    listScript: ['./Scripts/Vacas.js']
  });
});

router.get('/Change.html', (req, res, next) => {
  uni.moon = false;
  uni.planeta = 0;
  uni.base.getPlayer(req.query.name, () => {
    res.redirect('./OGame_Overview.html');
  });
});

module.exports = router;

/*Para pasar un dato por html se puede usar la propiedad data-val='valor' y en javascript leerla con item.dataset.val*/
