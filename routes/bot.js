var router = require('express').Router();
var uni = require('./universe');
var passport = require('passport');
var { auth, logout } = require('./authenticater')(passport, uni);

// Rutas de la api que usan los bots para hacer acciones

router.post(/\/(login)|(infoPlayer)/, async function(req, res, next) {
  auth(req, res, next, (req.path === "/infoPlayer"), (req, res, next, userId, player) => {
    res.json({ok: true, mes: "Login exitoso.", data: player, id: userId});
  });
});

router.post('/logout', function(req, res, next) {
  logout(req.body.username, req.body.id, res);
});

router.post('/changeName', async function(req, res, next) {
  auth(req, res, next, true, (req, res, next, userId, player) => {
    if(uni.base.setPlanetName(player, req.body.coor, req.body.newName, req.body.moon)){
      res.json({ok: true, mes: "Cambio de nombre exitoso."});
    }else{
      res.json({ok: false, mes: "Coordenadas no validas."});
    }
  });
});

router.post('/abandonPlanet', async function(req, res, next) {
  auth(req, res, next, true, (req, res, next, userId, player) => {
    if(player.planets[req.body.planetNum] == undefined){
      res.json({ok: false, mes: "Numero de planeta incorrecto."});
    }else{
      uni.base.abandonPlanet(uni.player, uni.planeta, res);
    }
  });
});

router.post('/infoUniverso', function(req, res, next) {
  res.json({ok: true, mes: "Info del universo", data: uni.universo});
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
      res.json({ok: false, mes: "Parametros invalidos."});
    }
  });
});







module.exports = router;
