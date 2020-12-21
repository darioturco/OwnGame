require('dotenv').config();
var express = require('express');
var uni = require('./universe');
var router = express.Router();

console.log('\x1b[35m%s\x1b[0m', new Date());
router.all('/*', (req, res, next) => {
  if(req.url.slice(1,4) != 'api' && req.url.slice(1,9) != 'Imagenes'){
    if(isFinite(req.query.planet)) uni.planeta = parseInt(req.query.planet);
    if(req.query.moon != undefined) uni.moon = (req.query.moon == 'true');
    if(uni.moon == true && uni.player.planets[uni.planeta].moon.active == false) uni.moon = false;
    uni.getPlayer(process.env.PLAYER, next);
  }else{
    next();
  }

});

/* Ruta de debugeo */
router.get('/', (req, res, next) => {
  //uni.deleteCollection(process.env.UNIVERSE_NAME, ["jugadores", "universo"]);
  //uni.createUniverse(process.env.UNIVERSE_NAME, 5, {name: "", inicio: 0, maxGalaxies: 9, donutGalaxy: true, donutSystem: true, speed: 1, speedFleet: 5000, fleetDebris: 30, defenceDebris: 0, maxMoon: 20, rapidFire: true, repearDefenses: true});
  //uni.addNewPlayer("dturco", 1);
  uni.setPlanetDataDev(uni.player.planets[5].coordinates, "dturco");
  //uni.setMoonDataDev(uni.player.planets[0].coordinates, "dturco");
  //uni.sendMessage("dturco", {type: 1, title: "Nuevo titulo", text: "Mensaje oficial", data: {}});
  //uni.colonize({gal: 1, sys: 2, pos: 7}, 'dturco');
  //uni.contPoint('dturco');
  //uni.contMoonFields(uni.planeta);
  /*let navesAux = uni.fun.zeroShips();
  navesAux.deathstar = 5;
  uni.player.research.astrophysics = 10;
  for(let i = 0 ; i<100 ; i++){
      console.log(uni.fun.expedition(navesAux, uni.player.research));
      for(let item in navesAux){
        navesAux[item] = 1;
      }
  }*/
  let attackerShips = uni.fun.zeroShips();
  let defenderShips = uni.fun.zeroShips();
  let defenses = uni.fun.zeroDefense();
  let attackerTech = uni.fun.zeroResearch();
  let defenderTech = uni.fun.zeroResearch();
  for(let item in attackerShips){
    attackerShips[item] = 100;
    defenderShips[item] = 100;
  }
  for(let item in defenses) defenses[item] = 50;
  let objAttack = uni.fun.battle(attackerShips, defenderShips, defenses, attackerTech, defenderTech);
  console.log(objAttack);


  uni.seeDataBase(res, process.env.UNIVERSE_NAME, "jugadores");
});

router.get('/Highscore.html', (req, res, next) => {
  let initVal = req.query.init;
  if(initVal == undefined || initVal <= 0 || initVal > uni.cantPlayers) initVal = uni.player.highscore;
  res.render('Highscore', {bodyId: "highscore",
    url: req._parsedOriginalUrl.pathname,
    init: initVal, // posicion en la que esta player
    max: uni.cantPlayers,
    basic: uni.getActualBasicInfo(uni.planeta),
    listScript: ['./Scripts/Highscore.js']
  });
});

router.get('/MoonBuildings.html', (req, res, next) => {
  if(uni.moon == true){
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
  res.render('OGame_Fleet', {bodyId: "fleet",
    url: req._parsedOriginalUrl.pathname,
    //(uni.moon) ? uni.player.planets[uni.planeta].moon.fleet : uni.player.planets[uni.planeta].fleet,
    info: uni.fleetInfo(uni.planeta, uni.moon),
    basic: uni.getActualBasicInfo(uni.planeta),
    objCord: {gal: req.query.gal, sys: req.query.sys, pos: req.query.pos},
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
  if(req.query.newName != undefined && req.query.newName != "" && req.query.newName.length <= 23){
    uni.setPlanetName(uni.player.planets[uni.planeta].coordinates, req.query.newName);//cambia el nombre al planeta
  }
  if(req.query.newName == "abandon" && req.query.abaNdon == "si" && uni.moon == false){
    /* Se fija que no sea su unico planeta y elimina el planeta */
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
  if(uni.moon == true){
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
  if(uni.moon == true){
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
