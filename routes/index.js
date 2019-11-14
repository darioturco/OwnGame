require('dotenv').config();
var express = require('express');
var uni = require('./universe');
var router = express.Router();
var pInfo = uni.getBasicInfo(1,1);
var mongo = null;
require('mongodb').MongoClient.connect(process.env.MONGO_URL, {useUnifiedTopology: true}, (err, db) => {
  if(err) throw err;
  console.log("Base de datos lista.");
  mongo = db;
});
/* GET home page. */
router.get('/', function(req, res, next) {
  //console.log(mongo);
  var respuesta = "";
  var cursor = mongo.db("test").collection("user-data").find();
  cursor.forEach((doc, err) => {
    respuesta += JSON.stringify(doc);
  }, () => {
    res.render('index', {title: 'Ogame', message: respuesta});
  });
  //res.render('index', {title: 'Ogame', message: respuesta});

});

router.get('/Highscore.html', function(req, res, next) {
  res.render('Highscore', {bodyId: "highscore",
  loadItem: "initFunction(" + JSON.stringify(pInfo) + ");",
  highscore: pInfo.highscore,
  energy: pInfo.resources.energy,
  dark: pInfo.resources.dark});
});

router.get('/OGame_Defence.html', function(req, res, next) {
  res.render('OGame_Defence', {bodyId: "defense",
  loadItem: "initFunction(" + JSON.stringify(pInfo) + ");",
  highscore: pInfo.highscore,
  energy: pInfo.resources.energy,
  dark: pInfo.resources.dark});
});

router.get('/OGame_Facilities.html', function(req, res, next) {
  res.render('OGame_Facilities', {bodyId: "station",
  loadItem: "initFunction(" + JSON.stringify(pInfo) + ");",
  highscore: pInfo.highscore,
  energy: pInfo.resources.energy,
  dark: pInfo.resources.dark});
});

router.get('/OGame_Fleet.html', function(req, res, next) {
  res.render('OGame_Fleet', {bodyId: "fleet",
  loadItem: "initFunction(" + JSON.stringify(pInfo) + ");",
  highscore: pInfo.highscore,
  energy: pInfo.resources.energy,
  dark: pInfo.resources.dark});
});

router.get('/OGame_Galaxy.html', function(req, res, next) {
  res.render('OGame_Galaxy', {bodyId: "galaxy",
  loadItem: "initFunction(" + JSON.stringify(pInfo) + ");",
  highscore: pInfo.highscore,
  energy: pInfo.resources.energy,
  dark: pInfo.resources.dark});
});

router.get('/OGame_Messages.html', function(req, res, next) {
  res.render('OGame_Messages', {bodyId: "messages",
  loadItem: "initFunction(" + JSON.stringify(pInfo) + ");",
  highscore: pInfo.highscore,
  energy: pInfo.resources.energy,
  dark: pInfo.resources.dark});
});

router.get('/OGame_Movement.html', function(req, res, next) {
  res.render('OGame_Movement', {bodyId: "resources",
  loadItem: "initFunction(" + JSON.stringify(pInfo) + ");",
  highscore: pInfo.highscore,
  energy: pInfo.resources.energy,
  dark: pInfo.resources.dark});
});

router.get('/OGame_Overview.html', function(req, res, next) {
  res.render('OGame_Overview', {bodyId: "overview",
  loadItem: "initFunction(" + JSON.stringify(pInfo) + ");",
  highscore: pInfo.highscore,
  energy: pInfo.resources.energy,
  dark: pInfo.resources.dark});
});

router.get('/OGame_Research.html', function(req, res, next) {
  res.render('OGame_Research', {bodyId: "research",
  loadItem: "initFunction(" + JSON.stringify(pInfo) + ");",
  highscore: pInfo.highscore,
  energy: pInfo.resources.energy,
  dark: pInfo.resources.dark});
});

router.get('/OGame_Resources.html', function(req, res, next) {
  res.render('OGame_Resources', {bodyId: "resources",
  loadItem: "initFunction(" + JSON.stringify(pInfo) + ");",
  highscore: pInfo.highscore,
  energy: pInfo.resources.energy,
  dark: pInfo.resources.dark});
});

router.get('/OGame_ResourceSetings.html', function(req, res, next) {
  res.render('OGame_ResourceSetings', {bodyId: "resourceSettings",
  loadItem: "resourcesInitial(); initFunction(" + JSON.stringify(pInfo) + ");",
  highscore: pInfo.highscore,
  energy: pInfo.resources.energy,
  dark: pInfo.resources.dark});
});

router.get('/OGame_Reward.html', function(req, res, next) {
  res.render('OGame_Reward', {bodyId: "resources",
  loadItem: "initFunction(" + JSON.stringify(pInfo) + ");",
  highscore: pInfo.highscore,
  energy: pInfo.resources.energy,
  dark: pInfo.resources.dark});
});

router.get('/OGame_Shipyard.html', function(req, res, next) {
  res.render('OGame_Shipyard', {bodyId: "shipyard",
  loadItem: "initFunction(" + JSON.stringify(pInfo) + ");",
  highscore: pInfo.highscore,
  energy: pInfo.resources.energy,
  dark: pInfo.resources.dark});
});

router.get('/OGame_Tecnology.html', function(req, res, next) {
  res.render('OGame_Tecnology', {bodyId: "tecnology",
  loadItem: "initFunction(" + JSON.stringify(pInfo) + ");",
  highscore: pInfo.highscore,
  energy: pInfo.resources.energy,
  dark: pInfo.resources.dark});
});

router.get('/Options.html', function(req, res, next) {
  res.render('Options', {bodyId: "resources",
  loadItem: "initFunction(" + JSON.stringify(pInfo) + ");",
  highscore: pInfo.highscore,
  energy: pInfo.resources.energy,
  dark: pInfo.resources.dark});
});

router.get('/Player.html', function(req, res, next) {
  res.render('Player', {bodyId: "resources",
  loadItem: "initFunction(" + JSON.stringify(pInfo) + ");",
  highscore: pInfo.highscore,
  energy: pInfo.resources.energy,
  dark: pInfo.resources.dark});
});

router.get('/Search.html', function(req, res, next) {
  res.render('Search', {bodyId: "resources",
  loadItem: "initFunction(" + JSON.stringify(pInfo) + ");",
  highscore: pInfo.highscore,
  energy: pInfo.resources.energy,
  dark: pInfo.resources.dark});
});

router.get('/Vacas.html', function(req, res, next) {
  res.render('Vacas', {bodyId: "resources",
  loadItem: "initFunction(" + JSON.stringify(pInfo) + ");",
  highscore: pInfo.highscore,
  energy: pInfo.resources.energy,
  dark: pInfo.resources.dark});
});

module.exports = router;
