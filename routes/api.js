var router = require('express').Router();
var uni = require('./universe');
var fs = require("fs");

// Rutas de informacion usadas solo para obtener informacion sobre el universo
router.get('/info/universoInfo', function(req, res, next) {
  res.send(uni.universo);
});

router.get('/info/universo', function(req, res, next) {
  uni.base.getPlayer(process.env.PLAYER, () => {
    res.send(uni);
  });
});

router.get('/info/allPlayers', function(req, res, next) {
  uni.base.seeDataBase(res, "jugadores", true, "Planet");
});

router.get('/info/collection', function(req, res, next) {
  uni.base.seeDataBase(res, req.query.collection, true, "Item", req.query.filtro);
});

router.get('/info/documentation', function(req, res, next) {
  var pdfDoc = fs.readFileSync('./public/Documentation.pdf');
  res.contentType("application/pdf");
  res.send(pdfDoc);
});

// Api usada por el cliente para interactuar con el servidor
router.get('/buildings', function(req, res, next) {
  if(uni.moon){
    res.send(uni.costMoon(uni.player, uni.planeta));
  }else{
    res.send(uni.costBuildings(uni.player, uni.planeta));
  }
});

router.get('/research', function(req, res, next) {
  res.send(uni.costResearch(uni.player, uni.player.planets[uni.planeta].buildings.researchLab));
});

router.get('/shipyard', function(req, res, next) {
  res.send(uni.costShipyard(uni.player, uni.planeta, uni.moon));
});

router.get('/defense', function(req, res, next) {
  res.send(uni.costDefense(uni.player, uni.planeta));
});

router.get('/galaxy', function(req, res, next) {
  uni.base.systemInfo(res, req.query.gal, req.query.sys);
});

router.get('/readMessages', function(req, res, next) {
  res.send({ok: true, list: uni.player.messages});
});

router.get('/searchPlayer', function(req, res, next) {
  uni.base.searchPlayer(res, req.query.name);
});

router.get('/highscore', function(req, res, next) {
  uni.base.highscoreData(res);
});

router.get('/usePhalanx', function(req, res, next) {
  uni.base.usePhalanx(
    {gal: parseInt(req.query.gal), sys: parseInt(req.query.sys), pos: parseInt(req.query.pos)},
    uni.player.planets[uni.planeta].coordinates,
    (uni.player.planets[uni.planeta].moon.active) ? uni.player.planets[uni.planeta].moon.buildings.phalanx : 0,
    res);
});

// Se usa set para las direcciones que cambian cosas en la base de datos

// Updatea los valores de resourcesSettings
router.get('/set/updateResources', function(req, res, next) {
  if(uni.fun.validResourcesSettingsObj(req.query, false)){
    uni.updateResourcesData(res, uni.player, uni.planeta, req.query);
  }else{
    res.send({ok: false});
  }
});

// Updatea los valores de resourcesSettings de la luna
router.get('/set/updateResourcesMoon', function(req, res, next) {
  if(uni.fun.validResourcesSettingsObj(req.query, true)){
    uni.updateResourcesDataMoon(res, uni.player, uni.planeta, req.query);
  }else{
    res.send({ok: false});
  }
});

router.get('/set/deleteMessages', function(req, res, next) {
  uni.base.deleteMessage(uni.player.name, req.query.all == 'true', req.query.id, res);
});

router.get('/set/addVaca', function(req, res, next) {
  req.query.coor = JSON.parse(req.query.coor);
  uni.toggleVaca(uni.player, res, req.query);
});

router.get('/set/setOptions', function(req, res, next) {
  uni.base.setOptions(uni.player.name, res, parseInt(req.query.esp), parseInt(req.query.sml), parseInt(req.query.lar));
});

router.get('/set/sendBuildRequest', function(req, res, next) {
  if(uni.moon){
    uni.proccesMoonRequest(uni.player, uni.planeta, req.query.obj, res);
  }else{
    uni.proccesBuildRequest(uni.player, uni.planeta, req.query.obj, res);
  }
});

router.get('/set/sendResearchRequest', function(req, res, next) {
  uni.proccesResearchRequest(uni.player, uni.planeta, req.query.obj, res);
});

router.get('/set/sendShipyardRequest', function(req, res, next) {
  uni.proccesShipyardRequest(uni.player, uni.planeta, req.query.obj, req.query.cant, res);
});

router.get('/set/cancelBuildRequest', function(req, res, next) {
  if(uni.moon){
    uni.cancelMoonRequest(uni.player, uni.planeta, res);
  }else{
    uni.cancelBuildRequest(uni.player, uni.planeta, res);
  }
});

router.get('/set/cancelResearchRequest', function(req, res, next) {
  uni.cancelResearchRequest(uni.player, res);
});

router.get('/set/cancelShipyardRequest', function(req, res, next) {
  uni.cancelShipyardRequest(uni.player, uni.planeta, req.query.obj, res);
});

router.get('/set/returnFleet', function(req, res, next) {
  uni.base.returnFleetInDataBase(uni.player, req.query.num, res);
});

router.get('/set/marketMoon', function(req, res, next) {
  uni.marketResources(uni.player, uni.planeta, req.query, res);
});

router.get('/set/updateRewards', function(req, res, next) {
  uni.updateRewards(uni.player, req.query.mission, res);
});

router.get('/set/abandonPlanet', function(req, res, next) {
  if(req.query.confirm === "Yes"){
    uni.base.abandonPlanet(uni.player, uni.planeta, res);
  }else{
    res.send({ok: false, mes: "Parametros de seguridad incorrectos."});
  }
});

router.post('/set/addFleetMovement', function(req, res, next) {
  console.log(req.body);
  uni.addFleetMovement(uni.player, uni.planeta, uni.moon, req.body, res);
});

router.post('/set/moveCuanticFleet', function(req, res, next) {
  uni.moveCuanticFleet(uni.player, uni.planeta, req.body, res);
});

module.exports = router;
