require('dotenv').config();
var express = require('express');
var uni = require('./universe');
var router = express.Router();

console.log('\x1b[35m%s\x1b[0m', new Date());
router.all('/*', (req, res, next) => {
  if(req.url.slice(1,4) != 'api'){
    if(isFinite(req.query.planet)){
      uni.planeta = parseInt(req.query.planet);
    }
    uni.getPlayer(process.env.PLAYER, next);
  }else{
    next();
  }
});

router.get('/', (req, res, next) => {
  //uni.deleteCollection(process.env.UNIVERSE_NAME, ["jugadores", "universo"]);
  //uni.createUniverse(process.env.UNIVERSE_NAME, 5, {name: "", inicio: 0, maxGalaxies: 9,donutGalaxy: true,donutSystem: true,speed: 1,speedFleet: 1,fleetDebris: 30,defenceDebris: 0,maxMoon: 20});
  //uni.addNewPlayer("dturco", 1);
  //uni.setPlanetData({galaxy: 1, system: 1, pos: 7}, "dturco");
  //uni.sendMessage("dturco", {type: 1, title: "Nuevo titulo", text: "Mensaje oficial", data: {}});
  //uni.colonize({galaxy: 1, system: 6, pos: 5}, 'dturco');
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
    info: uni.buildingsActualInfo(uni.planeta),
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
    basic: uni.getActualBasicInfo(uni.planeta),
    listScript: []
  });
});

router.get('/OGame_Overview.html', (req, res, next) => {
  if(req.query.newName != undefined && req.query.newName != "" && req.query.newName.length <= 23){
    uni.setPlanetName(uni.player.planets[uni.planeta].coordinates, req.query.newName);//cambia el nombre al planeta
  }
  if(req.query.newName == "abandon" && req.query.abaNdon == "si"){
    //se fija que no sea su unico planeta y elimina el planeta
    console.log("Despedite de tu planeta");
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
  res.render('OGame_Resources', {bodyId: "resources",
    url: req._parsedOriginalUrl.pathname,
    info: uni.buildingsActualInfo(uni.planeta),
    basic: uni.getActualBasicInfo(uni.planeta),
    listScript: ['./Scripts/Description.js']
  });
});

router.get('/OGame_ResourceSetings.html', (req, res, next) => {
  res.render('OGame_ResourceSetings', {bodyId: "resourceSettings",
    url: req._parsedOriginalUrl.pathname,
    info: uni.resourcesSetting(uni.planeta),
    basic: uni.getActualBasicInfo(uni.planeta),
    listScript: ['./Scripts/Resources_Info.js']
  });
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
  res.render('Options', {bodyId: "options",
    url: req._parsedOriginalUrl.pathname,
    info: uni.getQuickAtackData(),
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
    listScript: []
  });
});

module.exports = router;
