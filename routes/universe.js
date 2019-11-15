var objectId = require('mongodb').ObjectId;
var mongo = null;
require('mongodb').MongoClient.connect(process.env.MONGO_URL, {useUnifiedTopology: true}, (err, db) => {
  if(err) throw err;
  console.log('\x1b[32m%s\x1b[0m', "Base de datos lista.");
  mongo = db;
});

module.exports = {
  getDate: function(dia) {
    return 0;
  },
  player: null,
  setPlayer: function(player, f) {
    this.player = mongo.db(process.env.UNIVERSE_NAME).collection(process.env.JUGADORES).findOne({name: player}, (err, res) => {
      if(err) throw err;
      this.player = res;
      //actualiza los datos desde la ultima conecccion
      f();
    });
  },
  addNewPlayer: function(name, styleGame) {
    var cord = this.newCord();
    var newPlanet = {
      idPlanet: Math.pow(500,2)*cord.galaxy + 500*cord.system + cord.pos,
      coordinates: cord,
      player: name,
      name: "Planeta Principal",
      type: 1,
      resources: {metal: 500, crystal: 500, deuterium: 0, energy: 0},
      resourcesAdd: {metal: 20, crystal: 10, deuterium: 0},
      buildings: {metalMine: 0, crystalMine: 0, deuteriumMine: 0, solarPant: 0, fusionReactor: 0, metaltorage: 0, crystalStorage: 0, deuteriumStorage: 0, robotFactory: 0, shipyard: 0, researchLab: 0, alliance: 0, silo: 0, naniteFactory: 0, terraformer: 0},
      fleet: {lightFighter: 0, heavyFighter: 0, cruiser: 0, battleship: 0, battlecruiser: 0, bomber: 0, destroyer: 0, deathstar: 0, smallCargo: 0, largeCargo: 0, colony: 0, recycler: 0, espionageProbe: 0, solarSatellite: 0},
      defense: {rocketLauncher: 0, lightLaser: 0, heavyLaser: 0, gauss: 0, ion: 0, plasma: 0, smallShield: 0, largeShield: 0, antiballisticMissile: 0, interplanetaryMissile: 0},
      moon: {active: false},
      debris: {active:false, metal:0, crystal: 0}
    }
    var newPlayer = {'name': name,
      'styleGame': styleGame,
      planets: [newPlanet],
      maxPlanets: 1,
      highscore: this.getHigscoreNewPlayer(),//get la ultima position
      puntos: 0,
      puntosAcum: 0,
      vacas: [],
      sendSpionage: 1,
      dark: 8000,
      messagesCant: 0,
      messages: [],
      movement: [],
      research: {energy: 0, laser: 0, ion: 0, hyperspace: 0, plasma: 0, espionage: 0, computer: 0, astrophysics: 0, integalactic: 0, graviton: 0, combustion: 0, impulse: 0, hyperspace_drive: 0, weapons: 0, shielding: 0, armour: 0},
      lastVisit: 0,
      type: "activo"
    };
    mongo.db(process.env.UNIVERSE_NAME).collection("jugadores").insertOne(newPlayer);//agrega al jugador a la lista de jugadores
    mongo.db(process.env.UNIVERSE_NAME).collection("universo").insertOne(newPlanet);//agrega el planeta a la lista de planetas de manera ordenada por id
  },
  getHigscoreNewPlayer: () => {
    return 1;//cambiar
  },
  newCord: function() {
    //Cambiar y hacer que seleccione una coordenada libre nueva
    return {galaxy: 1, system: 1, pos: 4};
  },
  getActualBasicInfo: function(planet, str="") {
    var list = [];
    for(var i = 0 ; i<this.player.planets.length ; i++){
      list.push({nombre: this.player.planets[i].name, coordinates: this.player.planets[i].coordinates});
    }
    var item = {
      planets: list,
      resources: this.player.planets[planet].resources,
      add: this.player.planets[planet].resourcesAdd,
      mesagges: this.player.messagesCant,
      movement: this.player.movement
    };
    return {loadItem: str + "initFunction(" + JSON.stringify(item) + ");",
      playerName: this.player.name,
      highscore: this.player.highscore,
      energy: item.resources.energy,
      dark: this.player.dark,
      cantPlanets: this.player.planets.length,
      maxPlanets: this.player.maxPlanets,
      planetName: this.player.planets[planet].name
    };
  },
  seeDataBase: function(res, uni, name) {
    var respuesta = "";
    var cursor = mongo.db(uni).collection(name).find();
    cursor.forEach((doc, err) => {
      respuesta += JSON.stringify(doc);
    }, () => {
      res.render('index', {title: 'Ogame', message: respuesta});
    });
  },
  deleteRecord: function(id, uni, name){
    mongo.db(uni).collection(name).deleteOne({"_id": objectId(id)});
  },
  deleteCollection: function(uni, name){
    mongo.db(uni).dropCollection(name, (err, delOK) => {if(delOK) console.log('\x1b[35m%s\x1b[0m', "Collection" + name + "deleted")});
  }

}
