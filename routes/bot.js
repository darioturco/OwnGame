var router = require('express').Router();
var uni = require('./universe');
var passport = require('passport');
var { auth, logout } = require('./authenticater')(passport, uni);

// Rutas de la api que usan los bots para hacer acciones

router.post(/\/(login)|(infoPlayer)/, async function(req, res, next) {
  auth(req, res, next, (req.path === "/infoPlayer"), (req, res, next, userId, player) => {
    res.send({ok: true, mes: "Login exitoso.", data: player, id: userId});
  });
});

router.post('/logout', function(req, res, next) {
  logout(req.body.username, req.body.id, res);
});

router.post('/changeName', async function(req, res, next) {
  auth(req, res, next, true, (req, res, next, userId, player) => {
    if(uni.base.setPlanetName(player, req.body.coor, req.body.newName, req.body.moon)){
      res.send({ok: true, mes: "Cambio de nombre exitoso."});
    }else{
      res.send({ok: false, mes: "Coordenadas no validas."});
    }
  });
});

router.post('/abandonPlanet', async function(req, res, next) {
  auth(req, res, next, true, (req, res, next, userId, player) => {
    if(player.planets[req.body.planetNum] == undefined){
      res.send({ok: false, mes: "Numero de planeta incorrecto."});
    }else{
      uni.base.abandonPlanet(uni.player, uni.planeta, res);
    }
  });
});

router.post('/infoUniverso', function(req, res, next) {
  res.send({ok: true, mes: "Info del universo", data: uni.universo});
});

router.post('/infoGalaxy', function(req, res, next) {
  uni.base.systemInfo(res, req.body.gal, req.body.sys);
});

router.post('/changeResourcesOptions', function(req, res, next) {
  auth(req, res, next, true, (req, res, next, userId, player) => {
    let moon = req.body.moon;
    uni.fun.cleanDataSession(req.body);
    delete req.body.moon;
    if(uni.fun.validResourcesSettingsObj(req.body, moon) && uni.fun.validPlanetNum(player, req.body.planetNum)){
      if(moon){
        uni.updateResourcesDataMoon(res, player, req.body.planetNum, req.body);
      }else{
        uni.updateResourcesData(res, player, req.body.planetNum, req.body);
      }
    }else{
      res.send({ok: false, mes: "Parametros invalidos."});
    }
  });
});

router.post('/infoBuildings', async function(req, res, next) {
  auth(req, res, next, true, (req, res, next, userId, player) => {
    if(uni.fun.validPlanetNum(player, req.body.planetNum)){
      res.send(uni.costBuildings(player, req.body.planetNum));
    }else{
      res.send({ok: false, mes: "Invalid planet number."});
    }
  });
});

router.post('/buildingRequest', async function(req, res, next) {
  auth(req, res, next, true, (req, res, next, userId, player) => {
    if(uni.fun.validPlanetNum(player, req.body.planetNum)){
      uni.proccesBuildRequest(player, req.body.planetNum, req.body.process, res);
    }else{
      res.send({ok: false, mes: "Invalid planet number."});
    }
  });
});

router.post('/cancelBuilding', async function(req, res, next) {
  auth(req, res, next, true, (req, res, next, userId, player) => {
    if(uni.fun.validPlanetNum(player, req.body.planetNum)){
      uni.cancelBuildRequest(player, req.body.planetNum, res);
    }else{
      res.send({ok: false, mes: "Invalid planet number."});
    }
  });
});

router.post('/infoBuildingsMoon', async function(req, res, next) {
  auth(req, res, next, true, (req, res, next, userId, player) => {
    if(uni.fun.validMoonNum(player, req.body.planetNum)){
      res.send(uni.costMoon(player, req.body.planetNum));
    }else{
      res.send({ok: false, mes: "Invalid moon number."});
    }
  });
});

router.post('/buildingRequestMoon', async function(req, res, next) {
  auth(req, res, next, true, (req, res, next, userId, player) => {
    if(uni.fun.validMoonNum(player, req.body.planetNum)){
      uni.proccesMoonRequest(player, req.body.planetNum, req.body.process, res);
    }else{
      res.send({ok: false, mes: "Invalid moon number."});
    }
  });
});

router.post('/cancelBuildingMoon', async function(req, res, next) {
  auth(req, res, next, true, (req, res, next, userId, player) => {
    if(uni.fun.validMoonNum(player, req.body.planetNum)){
      uni.cancelMoonRequest(player, req.body.planetNum, res);
    }else{
      res.send({ok: false, mes: "Invalid moon number."});
    }
  });
});

router.post('/infoShips', async function(req, res, next) {
  auth(req, res, next, true, (req, res, next, userId, player) => {
    if(uni.fun.validPlanetNum(player, req.body.planetNum, req.body.moon)){
      res.send(uni.costShipyard(player, req.body.planetNum, req.body.moon));
    }else{
      res.send({ok: false, mes: "Invalid planet number."});
    }
  });
});

router.post('/buildShips', async function(req, res, next) {
  auth(req, res, next, true, (req, res, next, userId, player) => {
    if(uni.fun.validPlanetNum(player, req.body.planetNum)){
      uni.proccesShipyardRequest(player, req.body.planetNum, req.body.obj, req.body.cant, res);
    }else{
      res.send({ok: false, mes: "Invalid planet number."});
    }
  });
});

router.post('/cancelShips', async function(req, res, next) {
  auth(req, res, next, true, (req, res, next, userId, player) => {
    if(uni.fun.validPlanetNum(player, req.body.planetNum)){
      uni.cancelShipyardRequest(player, req.body.planetNum, req.body.obj, res);
    }else{
      res.send({ok: false, mes: "Invalid planet number."});
    }
  });
});

router.post('/infoDefenses', async function(req, res, next) {
  auth(req, res, next, true, (req, res, next, userId, player) => {
    if(uni.fun.validPlanetNum(player, req.body.planetNum)){
      res.send(uni.costDefense(player, req.body.planetNum));
    }else{
      res.send({ok: false, mes: "Invalid planet number."});
    }
  });
});

router.post('/buildDefenses', async function(req, res, next) {
  auth(req, res, next, true, (req, res, next, userId, player) => {
    if(uni.fun.validPlanetNum(player, req.body.planetNum)){
      uni.proccesShipyardRequest(player, req.body.planetNum, req.body.obj, req.body.cant, res);
    }else{
      res.send({ok: false, mes: "Invalid planet number."});
    }
  });
});

router.post('/cancelDefenses', async function(req, res, next) {
  auth(req, res, next, true, (req, res, next, userId, player) => {
    if(uni.fun.validPlanetNum(player, req.body.planetNum)){
      uni.cancelShipyardRequest(player, req.body.planetNum, req.body.obj, res);
    }else{
      res.send({ok: false, mes: "Invalid planet number."});
    }
  });
});

router.post('/infoResearch', async function(req, res, next) {
  auth(req, res, next, true, (req, res, next, userId, player) => {
    if(!uni.fun.validPlanetNum(player, req.body.planetNum)) req.body.planetNum = 0;
    res.send(uni.costResearch(player, player.planets[req.body.planetNum].buildings.researchLab));
  });
});

router.post('/buildResearch', async function(req, res, next) {
  auth(req, res, next, true, (req, res, next, userId, player) => {
    if(uni.fun.validPlanetNum(player, req.body.planetNum)){
      uni.proccesResearchRequest(player, req.body.planetNum, req.body.obj, res);
    }else{
      res.send({ok: false, mes: "Invalid planet number."});
    }
  });
});

router.post('/cancelResearch', async function(req, res, next) {
  auth(req, res, next, true, (req, res, next, userId, player) => {
    uni.cancelResearchRequest(player, res);
  });
});

router.post('/sendFleet', async function(req, res, next) {
  auth(req, res, next, true, (req, res, next, userId, player) => {
    if(uni.fun.validPlanetNum(player, req.body.planetNum, req.body.moon)){
      uni.addFleetMovement(player, req.body.planetNum, req.body.moon, req.body.data, res);
    }else{
      res.send({ok: false, mes: "Invalid planet number."});
    }
  });
});

router.post('/returnFleet', async function(req, res, next) {
  auth(req, res, next, true, (req, res, next, userId, player) => {
    uni.base.returnFleetInDataBase(player, req.body.num, res);
  });
});

router.post('/readMessage', async function(req, res, next) {
  auth(req, res, next, true, (req, res, next, userId, player) => {
    res.send({ok: true, data: player.messages});
  });
});

router.post('/deleteMessage', async function(req, res, next) {
  auth(req, res, next, true, (req, res, next, userId, player) => {
    uni.base.deleteMessage(player.name, req.body.all, req.body.data, res);
  });
});

router.post('/changeOptions', async function(req, res, next) {
  auth(req, res, next, true, (req, res, next, userId, player) => {
    uni.base.setOptions(uni.player.name, res, parseInt(req.body.esp), parseInt(req.body.sml), parseInt(req.body.lar));
  });
});

router.post('/showTechnology', async function(req, res, next) {
  res.send(uni.fun.getTechnology());
});

router.post('/showHighscore', async function(req, res, next) {
  uni.base.highscoreData(res);
});

router.post('/searchPlayer', async function(req, res, next) {
  uni.base.searchPlayer(res, req.body.name);
});

router.post('/seeRewards', async function(req, res, next) {
  res.send(uni.fun.getRewards());
});

router.post('/updateReward', async function(req, res, next) {
  auth(req, res, next, true, (req, res, next, userId, player) => {
    uni.updateRewards(player, req.body.mission, res);
  });
});

router.post('/usePhalanx', async function(req, res, next) {
  auth(req, res, next, true, (req, res, next, userId, player) => {
    if(uni.fun.validPlanetNum(player, req.body.planetNum)){
      uni.base.usePhalanx(req.body.coor, player.planets[req.body.planetNum].coordinates, uni.fun.phalanxLevel(player.planets[req.body.planetNum].moon), res);
    }else{
      res.send({ok: false, mes: "Invalid planet number."});
    }
  });
});

router.post('/useJumpGate', async function(req, res, next) {
  auth(req, res, next, true, (req, res, next, userId, player) => {
    if(uni.fun.validPlanetNum(player, req.body.planetNum)){
      uni.moveCuanticFleet(player, uni.planeta, req.body.data, res);
    }else{
      res.send({ok: false, mes: "Invalid planet number."});
    }
  });
});

router.post('/useMarketMoon', async function(req, res, next) {
  auth(req, res, next, true, (req, res, next, userId, player) => {
    if(uni.fun.validPlanetNum(player, req.body.planetNum, true)){
      uni.marketResources(player, req.body.planetNum, req.body.data, res);
    }else{
      res.send({ok: false, mes: "Invalid moon number."});
    }
  });
});

router.post('/changePassword', async function(req, res, next) {
  auth(req, res, next, false, (req, res, next, userId, player) => {
    uni.base.changePassword(player.name, req.body.newPassword, res);
  });
});

module.exports = router;
