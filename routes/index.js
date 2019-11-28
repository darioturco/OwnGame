require('dotenv').config();
var express = require('express');
var uni = require('./universe');
var router = express.Router();

console.log(new Date());
router.all('/*', (req, res, next) => {
  if(isFinite(req.query.planet)){
    uni.planeta = parseInt(req.query.planet);
  }
  uni.getPlayer(process.env.PLAYER, next);
});

router.get('/', (req, res, next) => {
  //uni.deleteCollection(process.env.UNIVERSE_NAME, ["jugadores", "galaxy", "universo"]);
  //uni.createUniverse(process.env.UNIVERSE_NAME, 5, {name: "", inicio: 0,maxGalaxies: 9,donutGalaxy: true,donutSystem: true,speed: 1,speedFleet: 1,fleetDebris: 30,defenceDebris: 0,maxMoon: 20});
  //uni.addNewPlayer("dturco", 1);
  //uni.setPlanetData({galaxy: 1, system: 1, pos: 6}, "dturco");
  uni.seeDataBase(res, process.env.UNIVERSE_NAME, "jugadores");
});

router.get('/Highscore.html', (req, res, next) => {
  res.render('Highscore', {bodyId: "highscore",
    url: req._parsedOriginalUrl.pathname,
    basic: uni.getActualBasicInfo(uni.planeta),
    listScript: []
  });
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
    basic: uni.getActualBasicInfo(uni.planeta),
    listScript: ['./Scripts/Description.js']
  });
});

router.get('/OGame_Fleet.html', (req, res, next) => {
  if(req.query.gal == undefined) req.query.gal = uni.player.planets[uni.planeta].coordinates.galaxy;
  if(req.query.sys == undefined) req.query.sys = uni.player.planets[uni.planeta].coordinates.system;
  if(req.query.pos == undefined) req.query.pos = uni.player.planets[uni.planeta].coordinates.pos;
  res.render('OGame_Fleet', {bodyId: "fleet",
    url: req._parsedOriginalUrl.pathname,
    info: uni.fleetInfo(uni.planeta),
    basic: uni.getActualBasicInfo(uni.planeta),
    objCord: {galaxy: req.query.gal, system: req.query.sys, pos: req.query.pos},
    listScript: ['./Scripts/Fleet.js']
  });
});

router.get('/OGame_Galaxy.html', (req, res, next) => {
  res.render('OGame_Galaxy', {bodyId: "galaxy",
    url: req._parsedOriginalUrl.pathname,
    info: uni.galaxyInfo(uni.planeta),
    basic: uni.getActualBasicInfo(uni.planeta),
    listScript: ['./Scripts/Galaxy.js']
  });
});

router.get('/OGame_Messages.html', (req, res, next) => {
  res.render('OGame_Messages', {bodyId: "messages",
    url: req._parsedOriginalUrl.pathname,
    basic: uni.getActualBasicInfo(uni.planeta),
    listScript: []
  });
});

router.get('/OGame_Movement.html', (req, res, next) => {
  res.render('OGame_Movement', {bodyId: "resources",
    url: req._parsedOriginalUrl.pathname,
    basic: uni.getActualBasicInfo(uni.planeta),
    listScript: []
  });
});

router.get('/OGame_Overview.html', (req, res, next) => {
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
  res.render('OGame_Resources', {bodyId: "resources",
    url: req._parsedOriginalUrl.pathname,
    info: uni.buildingsActualInfo(uni.planeta),
    basic: uni.getActualBasicInfo(uni.planeta, "info="+JSON.stringify(this.info)+";"),
    listScript: ['./Scripts/Description.js']
  });
});

router.get('/OGame_ResourceSetings.html', (req, res, next) => {
  res.render('OGame_ResourceSetings', {bodyId: "resourceSettings",
    url: req._parsedOriginalUrl.pathname,
    info: uni.resourcesSetting(uni.planeta),
    basic: uni.getActualBasicInfo(uni.planeta, "resourcesInitial(); "),
    listScript: ['./Scripts/Resources_Info.js']
  });
});

router.get('/OGame_Reward.html', (req, res, next) => {
  res.render('OGame_Reward', {bodyId: "resources",
    url: req._parsedOriginalUrl.pathname,
    basic: uni.getActualBasicInfo(uni.planeta),
    listScript: []
  });
});

router.get('/OGame_Shipyard.html', (req, res, next) => {
  res.render('OGame_Shipyard', {bodyId: "shipyard",
    url: req._parsedOriginalUrl.pathname,
    info: uni.player.planets[uni.planeta].fleet,
    basic: uni.getActualBasicInfo(uni.planeta),
    listScript: ['./Scripts/Description.js']
  });
});

router.get('/OGame_Tecnology.html', (req, res, next) => {
  res.render('OGame_Tecnology', {bodyId: "tecnology",
    url: req._parsedOriginalUrl.pathname,
    basic: uni.getActualBasicInfo(uni.planeta),
    listScript: []
  });
});

router.get('/Options.html', (req, res, next) => {
  res.render('Options', {bodyId: "resources",
    url: req._parsedOriginalUrl.pathname,
    basic: uni.getActualBasicInfo(uni.planeta),
    listScript: []
  });
});

router.get('/Player.html', (req, res, next) => {
  res.render('Player', {bodyId: "resources",
    url: req._parsedOriginalUrl.pathname,
    basic: uni.getActualBasicInfo(uni.planeta),
    listScript: []
  });
});

router.get('/Search.html', (req, res, next) => {
  res.render('Search', {bodyId: "resources",
    url: req._parsedOriginalUrl.pathname,
    basic: uni.getActualBasicInfo(uni.planeta),
    listScript: []
  });
});

router.get('/Vacas.html', (req, res, next) => {
  res.render('Vacas', {bodyId: "vacas",
    url: req._parsedOriginalUrl.pathname,
    basic: uni.getActualBasicInfo(uni.planeta),
    listScript: []
  });
});

module.exports = router;
