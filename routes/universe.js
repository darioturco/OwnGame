var mongo = require('mongodb').MongoClient;
var objectId = require('mongodb').ObjectId;
var mongo = null;
require('mongodb').MongoClient.connect(process.env.MONGO_URL, {useUnifiedTopology: true}, (err, db) => {
  if(err) throw err;
  console.log("Base de datos lista.");
  mongo = db;
});

console.log(process.env);

module.exports = {
  getDate: function(dia) {
    return 0;
  },
  getBasicInfo: function(player, planet) {
    var item;
    //la base de datos da los recursos y eso y lo guarda en item
    item = {//borrar
      planets: [{nombre: "Planeta Principal", galaxy: 1, system: 1, position: 4}],
      resources: {metal: 500, crystal: 500, deuterium: 100, energy: 10, dark: 8000},
      add: {addMetal: 3, addCrystal: 2, addDeuterium: 1},
      mesagges: 0,
      flets: 0,
      highscore: 1
    }
    return item;
  }
}
