var router = require('express').Router();
var uni = require('./universe');
var passport = require('passport');
var { auth, logout } = require('./authenticater')(passport, uni);

// Rutas de la api que usan los bots para hacer acciones
router.post('/login', async function(req, res, next) {
  auth(req, res, next, false, (req, res, next, userId, player) => {
    res.json({ok: true, mes: "Login exitoso.", player, id: userId});
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

module.exports = router;
