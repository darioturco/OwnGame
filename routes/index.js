require('dotenv').config();
var express = require('express');
var uni = require('./universe');
var router = express.Router();
var pInfo = {};//uni.getBasicInfo(1,1);
var planeta = 0;


console.log(new Date());
router.all('/*', (req, res, next) => {
  uni.setPlayer(process.env.PLAYER, next);
});

/* GET pages. */
router.get('/', (req, res, next) => {
  uni.seeDataBase(res, process.env.UNIVERSE_NAME, process.env.JUGADORES);
});

router.get('/Highscore.html', (req, res, next) => {
  res.render('Highscore', Object.assign({bodyId: "highscore"}, uni.getActualBasicInfo(planeta)));
});

router.get('/OGame_Defence.html', (req, res, next) => {
  res.render('OGame_Defence', Object.assign({bodyId: "defense"}, uni.getActualBasicInfo(planeta)));
});

router.get('/OGame_Facilities.html', (req, res, next) => {
  res.render('OGame_Facilities', Object.assign({bodyId: "station"}, uni.getActualBasicInfo(planeta)));
});

router.get('/OGame_Fleet.html', (req, res, next) => {
  res.render('OGame_Fleet', Object.assign({bodyId: "fleet"}, uni.getActualBasicInfo(planeta)));
});

router.get('/OGame_Galaxy.html', (req, res, next) => {
  res.render('OGame_Galaxy', Object.assign({bodyId: "galaxy"}, uni.getActualBasicInfo(planeta)));
});

router.get('/OGame_Messages.html', (req, res, next) => {
  res.render('OGame_Messages', Object.assign({bodyId: "messages"}, uni.getActualBasicInfo(planeta)));
});

router.get('/OGame_Movement.html', (req, res, next) => {
  res.render('OGame_Movement', Object.assign({bodyId: "resources"}, uni.getActualBasicInfo(planeta)));
});

router.get('/OGame_Overview.html', (req, res, next) => {
  res.render('OGame_Overview', Object.assign({bodyId: "overview"}, uni.getActualBasicInfo(planeta)));
});

router.get('/OGame_Research.html', (req, res, next) => {
  res.render('OGame_Research', Object.assign({bodyId: "research"}, uni.getActualBasicInfo(planeta)));
});

router.get('/OGame_Resources.html', (req, res, next) => {
  res.render('OGame_Resources', Object.assign({bodyId: "resources"}, uni.getActualBasicInfo(planeta)));
});

router.get('/OGame_ResourceSetings.html', (req, res, next) => {
  res.render('OGame_ResourceSetings', Object.assign({bodyId: "resourceSettings"}, uni.getActualBasicInfo(planeta, "resourcesInitial(); ")));
});

router.get('/OGame_Reward.html', (req, res, next) => {
  res.render('OGame_Reward', Object.assign({bodyId: "resources"}, uni.getActualBasicInfo(planeta)));
});

router.get('/OGame_Shipyard.html', (req, res, next) => {
  res.render('OGame_Shipyard', Object.assign({bodyId: "shipyard"}, uni.getActualBasicInfo(planeta)));
});

router.get('/OGame_Tecnology.html', (req, res, next) => {
  res.render('OGame_Tecnology', Object.assign({bodyId: "tecnology"}, uni.getActualBasicInfo(planeta)));
});

router.get('/Options.html', (req, res, next) => {
  res.render('Options', Object.assign({bodyId: "resources"}, uni.getActualBasicInfo(planeta)));
});

router.get('/Player.html', (req, res, next) => {
  res.render('Player', Object.assign({bodyId: "resources"}, uni.getActualBasicInfo(planeta)));
});

router.get('/Search.html', (req, res, next) => {
  res.render('Search', Object.assign({bodyId: "resources"}, uni.getActualBasicInfo(planeta)));
});

router.get('/Vacas.html', (req, res, next) => {
  res.render('Vacas', Object.assign({bodyId: "resources"}, uni.getActualBasicInfo(planeta)));
});

module.exports = router;
