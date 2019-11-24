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

module.exports = router;
