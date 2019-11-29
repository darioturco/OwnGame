var express = require('express');
var router = express.Router();
var uni = require('./universe');

/* Info */
router.get('/universoInfo', function(req, res, next) {
  res.send(uni.universo);
});

router.get('/universo', function(req, res, next) {
  res.send(uni);
});

router.get('/allPlanets', function(req, res, next) {
  uni.seeJsonDataBase(res, process.env.UNIVERSE_NAME, "galaxy", "Planet");
});

router.get('/collection', function(req, res, next) {
  uni.seeJsonDataBase(res, process.env.UNIVERSE_NAME, req.query.collection, "Item", req.query.filtro);
});

/* Api */
router.get('/buildings', function(req, res, next) {
  res.send(uni.costBuildings(uni.planeta));
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

//Se usa set para las direcciones que cambian cosas en la base de datos

router.get('/set/addVaca', function(req, res, next) {
  req.query.coor = JSON.parse(req.query.coor);
  uni.toggleVaca(res, req.query);
});

module.exports = router;
