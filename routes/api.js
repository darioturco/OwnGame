var express = require('express');
var router = express.Router();
var uni = require('./universe');

/* GET users listing. */
router.get('/universoInfo', function(req, res, next) {
  res.send(uni.universo);
});

router.get('/universo', function(req, res, next) {
  res.send({uni});
});

router.get('/buildings', function(req, res, next) {
  res.send(uni.costBuildings(uni.planeta));
});

router.get('/research', function(req, res, next) {
  res.send(uni.costResearch(uni.planeta));
});

module.exports = router;
