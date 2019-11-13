var express = require('express');
var router = express.Router();

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'Ogame' });
});

router.get('/Highscore.html', function(req, res, next) {
  res.render('Highscore', {});
});

router.get('/OGame_Defence.html', function(req, res, next) {
  res.render('OGame_Defence', {});
});

router.get('/OGame_Facilities.html', function(req, res, next) {
  res.render('OGame_Facilities', {});
});

router.get('/OGame_Fleet.html', function(req, res, next) {
  res.render('OGame_Fleet', {});
});

router.get('/OGame_Galaxy.html', function(req, res, next) {
  res.render('OGame_Galaxy', {});
});

router.get('/OGame_Messages.html', function(req, res, next) {
  res.render('OGame_Messages', {});
});

router.get('/OGame_Movement.html', function(req, res, next) {
  res.render('OGame_Movement', {});
});

router.get('/OGame_Overview.html', function(req, res, next) {
  res.render('OGame_Overview', {});
});

router.get('/OGame_Research.html', function(req, res, next) {
  res.render('OGame_Research', {});
});

router.get('/OGame_Resources.html', function(req, res, next) {
  res.render('OGame_Resources', {});
});

router.get('/OGame_ResourceSetings.html', function(req, res, next) {
  res.render('OGame_ResourceSetings', {});
});

router.get('/OGame_Reward.html', function(req, res, next) {
  res.render('OGame_Reward', {});
});

router.get('/OGame_Shipyard.html', function(req, res, next) {
  res.render('OGame_Shipyard', {});
});

router.get('/OGame_Tecnology.html', function(req, res, next) {
  res.render('OGame_Tecnology', {});
});

router.get('/Options.html', function(req, res, next) {
  res.render('Options', {});
});

router.get('/Player.html', function(req, res, next) {
  res.render('Player', {});
});

router.get('/Search.html', function(req, res, next) {
  res.render('Search', {});
});

router.get('/Vacas.html', function(req, res, next) {
  res.render('Vacas', {});
});
module.exports = router;
