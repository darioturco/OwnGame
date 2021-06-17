// Articulo sobre el flujo de trabajo de passport (no usado)
// http://toon.io/understanding-passportjs-authentication-flow/

const LocalStrategy = require('passport-local').Strategy;
var sessions = {};

module.exports = function (passport, uni) {

  passport.use(new LocalStrategy(
    {usernameField: 'username',
    passwordField: 'password',
    passReqToCallback: true,
    session: false},
    function (req, username, password, done) {
      if(sessions[req.body.id] == undefined){
        // Verifico si el username y password son correctos
        uni.base.findAndExecuteByName(username, (usuario) => {
    			if(usuario === null) return done(null, false, {data: 'Wrong username'});
    			if(uni.fun.hash(password) === usuario.pass){
            let newId = ""
            let tieneId = false;
            for(let u in sessions){ // Reviso si ese usuario ya esta logeado
              if(sessions[u] != undefined && sessions[u].name === username){
                newId = sessions[u]["_id"];
                tieneId = true;
              }
            }
            if(!tieneId){
              do{
                newId = uni.fun.randomString() + uni.fun.randomString();
                if(sessions[newId] === undefined) sessions[newId] = usuario;
              } while (sessions[newId] === undefined);
              usuario["_id"] = newId;
            }
    				return done(null, newId, usuario);
    			}else{
    				return done(null, false, {data: 'Wrong password'});
    			}
    		});
      }else{
        // Me salteo toda la etapa de verificacion de usuario
        /* Talvez seria bueno buscar el usuario en la base de datos para devolverlo actualizado */
        return done(null, req.body.id, sessions[req.body.id]);
      }
    })
  );

  passport.serializeUser((user, done) => done(null, user));
  passport.deserializeUser((id, done) => done(null, null));

  return {
    auth: function(req, res, next, verifyUser, f){
      if(verifyUser){
        if(req.body.username == undefined) req.body.username = "invalidUser";
        if(req.body.password == undefined) req.body.password = "abc";
      }
      passport.authenticate('local', { session: false }, function(err, userId, data) {
        if (err) { return next(err); }
        if (!userId) { res.json({ok: false, data}); return res; }
        req.logIn(userId, function(err) {
          if (err) { return next(err); }
          f(req, res, next, userId, data);
        });
      })(req, res, next);
    },

    logout: function(username, id, res){
      if(id == undefined || sessions[id] == undefined){
        for(let u in sessions){ // Reviso si ese usuario esta logeado
          if(sessions[u].name === username){
            sessions[sessions[u]["_id"]] = undefined;
            res.json({ok: true, mes: "Logout realizado correctamente."});
            return true;
          }
        }
        res.json({ok: false, mes: "Usauario no encontrado."});
        return false;
      }else{
        sessions[id] = undefined;
        res.json({ok: true, mes: "Logout realizado correctamente."});
        return true;
      }
    }
  };

}
