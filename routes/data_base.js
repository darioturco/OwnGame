var uni   = null;
var mongo = null;
var date  = new Date();

require('mongodb').MongoClient.connect(process.env.MONGO_URL, {useUnifiedTopology: true}, (err, db) => {
  if(err) throw err;
  mongo = db;
  exp.getUniverseData(process.env.UNIVERSE_NAME);
  mongo.db(process.env.UNIVERSE_NAME).collection("jugadores").countDocuments({}, function(err, cant) {uni.cantPlayers = cant});
  exp.getPlayer(process.env.PLAYER, () => {
    console.log('\x1b[36m%s\x1b[0m', "Base de datos lista.");
  }, true);
});

var exp = {
  setUniverse: function(newUniverse){
    uni = newUniverse;
  },

  setUniverseData: function(name, data) {
    data.name    = name;
    uni.universo = data;
    mongo.db(process.env.UNIVERSE_NAME).collection("universo").insertOne(data);
  },

  getUniverseData: function(name){
    let cursor = mongo.db(process.env.UNIVERSE_NAME).collection("universo").find();
    cursor.forEach((doc, err) => {
      if(err) throw err;
      if(name === doc.name) uni.universo = doc;
    });
  },

  getPlayer: function(playerName, f, updateList) {
    mongo.db(process.env.UNIVERSE_NAME).collection("jugadores").findOne(
      {name: playerName}, (err, res) => {
      if(err) throw err;
      if(res == null){
        f();
      }else{
        uni.player = res;
        let fun = () => {
          uni.updatePlayer(uni.player, (respuesta) => {
            uni.player = respuesta;
            f();
          });
        };
        if(updateList){
          this.getListCord(fun);
        }else{
          fun();
        }
      }
    });
  },

  getListCord: function(f){
    let obj = {};
    let espionageLevel = 0;
    let cursor = mongo.db(process.env.UNIVERSE_NAME).collection("jugadores").find({});
    cursor.forEach((doc, err) => {
      espionageLevel = doc.research.espionage;
      for(let i = 0 ; i<doc.planets.length ; i++){
        obj[doc.planets[i].coordinates.gal + '_' + doc.planets[i].coordinates.sys + '_' + doc.planets[i].coordinates.pos] = {espionage: espionageLevel, playerName: doc.planets[i].player, type: doc.planets[i].type, color: doc.planets[i].color};
      }
    }, () => {
      uni.allCord = obj;
      f();
    });
  },

  seeDataBase: (res, name, json = true, objName = "item", filtro = {}) => {
    let respuesta = json ? {} : "";
    let i = 1;
    let cursor = mongo.db(process.env.UNIVERSE_NAME).collection(name).find(filtro);
    cursor.forEach((doc, err) => {
      if(json){
        respuesta[objName+i] = doc;
      }else{
        respuesta += JSON.stringify(doc);
      }
      i++;
    }, () => {
      if(json){
        res.send(respuesta);
      }else{
        res.render('index', {title: 'Ogame', message: respuesta});
      }
    });
  },

  deleteCollection: (nameList) => {
    for(let i = 0 ; i<nameList.length ; i++){
      mongo.db(process.env.UNIVERSE_NAME).dropCollection(nameList[i],
        (err, delOK) => {
          if(err) throw err;
          if(delOK) console.log('\x1b[35m%s\x1b[0m', "Collection " + nameList[i] + " deleted.")
        });
    }
  },

  insertPlayer: function(player) {
    mongo.db(process.env.UNIVERSE_NAME).collection("jugadores").insertOne(player);
  },

  savePlayerData: function(playerName, objSet, objInc, objPush, objPull, f){
    let changeObj = {};
    if(objSet  != undefined) changeObj['$set'] = objSet;
    if(objInc  != undefined) changeObj['$inc'] = objInc;
    if(objPush != undefined) changeObj['$push'] = objPush;
    if(objPull != undefined) changeObj['$pull'] = objPull;
    mongo.db(process.env.UNIVERSE_NAME).collection("jugadores").findOneAndUpdate(
      {name: playerName}, changeObj,
      (err, res) => {
        if(err) throw err;
        f(res.value);
    });
  },

  setPlanetData: function(coor, resources = undefined, buildings = undefined, fleet = undefined, defenses = undefined, moon = undefined){
    let setObj = {};
    if(resources != undefined) setObj['planets.$.resources'] = resources;
    if(buildings != undefined) setObj['planets.$.buildings'] = buildings;
    if(fleet     != undefined) setObj['planets.$.fleet']     = fleet;
    if(defenses  != undefined) setObj['planets.$.defense']   = defenses;
    if(moon      != undefined) setObj['planets.$.moon']      = moon;
    mongo.db(process.env.UNIVERSE_NAME).collection("jugadores").updateOne(
      {planets :{$elemMatch: {coordinates: coor}}},
      {$set: setObj});
  },

  setMoonData: function(coor, resources = undefined, buildings = undefined, fleet = undefined){
    let setObj = {};
    if(resources != undefined) setObj['planets.$.moon.resources'] = resources;
    if(buildings != undefined) setObj['planets.$.moon.buildings'] = buildings;
    if(fleet != undefined) setObj['planets.$.moon.fleet'] = fleet;
    mongo.db(process.env.UNIVERSE_NAME).collection("jugadores").updateOne(
      {planets :{$elemMatch: {coordinates: coor}}},
      {$set: setObj});
  },

  addPlanetData: function(coor, resources, fleet, moon, f = undefined){
    let incObj = {};
    let moonStr = moon ? '.moon.' : '.';
    for(let i in resources){
      incObj['planets.$' + moonStr + 'resources.' + i] = resources[i];
    }
    for(let i in fleet){
      if(i !== 'misil') incObj['planets.$' + moonStr + 'fleet.' + i] = fleet[i];
    }
    mongo.db(process.env.UNIVERSE_NAME).collection("jugadores").updateOne(
      {planets :{$elemMatch: {coordinates: coor}}},
      {$inc: incObj}, (err, result) => {
        if(err) throw err;
        if(f != undefined) f();
      });
  },

  updateCuantic: function(cord, fleet, cuantic){
    let setObj = {};
    let incObj = {};
    for(let i in fleet){
      incObj['planets.$.moon.fleet.' + i] = fleet[i];
    }
    setObj['planets.$.moon.cuantic'] = cuantic;
    mongo.db(process.env.UNIVERSE_NAME).collection("jugadores").updateOne(
      {planets :{$elemMatch: {coordinates: cord}}},
      {$set: setObj, $inc: incObj}, (err, res) => {
        if(err) throw err;
      });
  },

  warnFromAttack: function(cord, warnObj){
    mongo.db(process.env.UNIVERSE_NAME).collection("jugadores").updateOne(
      {planets: {$elemMatch: {coordinates: cord}}},
      {$push: warnObj});
  },

  pushMovementToDataBase: function(cord, objInc, objPush){
    mongo.db(process.env.UNIVERSE_NAME).collection("jugadores").updateOne(
      {planets: {$elemMatch: {coordinates: cord}}},
      {$push: objPush, $inc: objInc});
  },

  removeHazard: function(coor, time){
    let objPull = {hazards: {time: time}};
    mongo.db(process.env.UNIVERSE_NAME).collection("jugadores").updateOne(
      {planets: {$elemMatch: {coordinates: coor}}}, {$pull: objPull},
      (err, res) => {
        if(err) throw err;
    });
  },

  saveDebris: function(coor, newDebris, add = false){
    if(!(add && newDebris.metal === 0 && newDebris.crystal === 0)){
      let objBase = {};
      if(add){
        objBase = {$inc: {'planets.$.debris.metal': newDebris.metal, 'planets.$.debris.crystal': newDebris.crystal}, $set: {'planets.$.debris.active': true}};
      }else{
        objBase = {$set: {'planets.$.debris': newDebris}};
      }
      mongo.db(process.env.UNIVERSE_NAME).collection("jugadores").updateOne(
        {planets: {$elemMatch: {coordinates: coor}}},
        objBase,
        (err, res) => {
          if(err) throw err;
        });
    }
  },

  updateResourcesDataBase: function(coor, objSet, f){
    mongo.db(process.env.UNIVERSE_NAME).collection("jugadores").updateOne(
      {planets: {$elemMatch: {coordinates: coor}}},
      {$set: objSet}, () => {
        f();
    });
  },

  findAndExecute: function(cord, f){
    mongo.db(process.env.UNIVERSE_NAME).collection("jugadores").findOne(
      {planets: {$elemMatch: {coordinates: cord}}},
      (err, res) => {
        if(err) throw err;
        f(res);
    });
  },

  findAndExecuteByName: function(playerName, f){
    mongo.db(process.env.UNIVERSE_NAME).collection("jugadores").findOne(
      {name: playerName},
      (err, res) => {
        if(err) throw err;
        f(res);
    });
  },

  clearHazards: function(player, res){
    mongo.db(process.env.UNIVERSE_NAME).collection("jugadores").updateOne(
      {name: player.name},
      {$set: {hazards: []}}, (err) => {
        res.send({ok: (err == null)});
    });
  },

  findPlayersBySystemCode: function(systemCode, forEach, done){
    let cursor = mongo.db(process.env.UNIVERSE_NAME).collection("jugadores").find(
      {planets: {$elemMatch: {coordinatesCod: systemCode}}});
    cursor.forEach(forEach, done);
  },

  addMovementResources: function(playerName, time, llegada, metal, crystal){
    mongo.db(process.env.UNIVERSE_NAME).collection("jugadores").updateOne(
      {name: playerName, "movement.time": time, "movement.llegada": llegada},
      {$inc: {"movement.$.resources.metal": metal, "movement.$.resources.crystal": crystal}});
  },

  updateMovementInDB: function(playerName, oldTime, oldLlegada, updateObj, f){
    mongo.db(process.env.UNIVERSE_NAME).collection("jugadores").updateOne(
      {name: playerName, "movement.time": oldTime, "movement.llegada": oldLlegada},
      {$set: {"movement.$": updateObj}}, (err, resBD) => {
        if(err) throw err;
        if(f != undefined) f();
    });
  },

  forEachPlayerSortedByPoints: function(forEach, done){
    let cursor = mongo.db(process.env.UNIVERSE_NAME).collection("jugadores").find({}).sort({"puntos": -1});
    cursor.forEach(forEach, done);
  },

  getMongo: function(){
    return mongo;
  }
};

module.exports = exp;
