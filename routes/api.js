var express = require('express');
var router = express.Router();
var uni = require('./universe');

/* Info */
router.get('/universoInfo', function(req, res, next) {
  res.send(uni.universo);
});

router.get('/universo', function(req, res, next) {
  uni.getPlayer(process.env.PLAYER, () => {res.send(uni);});
});

router.get('/allPlanets', function(req, res, next) {
  uni.seeJsonDataBase(res, process.env.UNIVERSE_NAME, "galaxy", "Planet");
});

router.get('/collection', function(req, res, next) {
  uni.seeJsonDataBase(res, process.env.UNIVERSE_NAME, req.query.collection, "Item", req.query.filtro);
});

/* Api */
router.get('/buildings', function(req, res, next) {
  if(uni.moon){
    res.send(uni.costMoon(uni.planeta));
  }else{
    res.send(uni.costBuildings(uni.planeta));
  }
});

router.get('/research', function(req, res, next) {
  res.send(uni.costResearch(uni.planeta));
});

router.get('/shipyard', function(req, res, next) {
  res.send(uni.costShipyard(uni.planeta));
});

router.get('/defense', function(req, res, next) {
  res.send(uni.costDefense(uni.planeta));
});

router.get('/galaxy', function(req, res, next) {
  uni.systemInfo(res, req.query.gal, req.query.sys);
});

router.get('/readMessages', function(req, res, next) {
  let listMes = uni.player.messages;
  res.send({ok: true, list: listMes});
});

router.get('/searchPlayer', function(req, res, next) {
  uni.searchPlayer(res, req.query.name);
});

router.get('/highscore', function(req, res, next) {
  uni.highscoreData(res);
});

//Se usa set para las direcciones que cambian cosas en la base de datos

// Updatea los valores de resourcesSettings
router.get('/set/updateResources', function(req, res, next) {
  uni.updateResourcesData(() => {res.send({ok: true});}, uni.planeta, req.query);
});

// Updatea los valores de resourcesSettings de la luna
router.get('/set/updateResourcesMoon', function(req, res, next) {
  uni.updateResourcesDataMoon(() => {res.send({ok: true});}, uni.planeta, req.query);
});

router.get('/set/deleteMessages', function(req, res, next) {
  uni.deleteMessage(uni.player.name, req.query.all == 'true', req.query.id);
  res.send({ok: true});
});

router.get('/set/addVaca', function(req, res, next) {
  req.query.coor = JSON.parse(req.query.coor);
  uni.toggleVaca(res, req.query);
});

router.get('/set/setOptions', function(req, res, next) {
  let esp = parseInt(req.query.esp);
  let small = parseInt(req.query.sml);
  let large = parseInt(req.query.lar);
  uni.setOptions(res, esp, small, large);
});

router.get('/set/sendBuildRequest', function(req, res, next) {
  if(uni.moon){
    uni.proccesMoonRequest(uni.planeta, req.query.obj, res);
  }else{
    uni.proccesBuildRequest(uni.planeta, req.query.obj, res);
  }
});

router.get('/set/sendResearchRequest', function(req, res, next) {
  uni.proccesResearchRequest(uni.planeta, req.query.obj, res);
});

router.get('/set/sendShipyardRequest', function(req, res, next) {
  uni.proccesShipyardRequest(uni.planeta, req.query.obj, req.query.cant, res);
});

router.get('/set/cancelBuildRequest', function(req, res, next) {
  if(uni.moon){
    uni.cancelMoonRequest(uni.planeta, res);
  }else{
    uni.cancelBuildRequest(uni.planeta, res);
  }
});

router.get('/set/cancelResearchRequest', function(req, res, next) {
  uni.cancelResearchRequest(res);
});

router.get('/set/cancelShipyardRequest', function(req, res, next) {
  uni.cancelShipyardRequest(uni.planeta, req.query.obj, res);
});

router.get('/set/returnFleet', function(req, res, next) {
  uni.returnFleet(req.query.num, res);
});

router.post('/set/addFleetMovement', function(req, res, next) {
  uni.addFleetMovement(uni.player.name, uni.planeta, uni.moon, req.body, res);
});

router.post('/set/moveCuanticFleet', function(req, res, next) {
  uni.moveCuanticFleet(uni.player.name, uni.planeta, req.body, res);
});

module.exports = router;
