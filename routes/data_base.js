var objectId = require('mongodb').ObjectId;
var fun      = require('./funciones_auxiliares');
var mongo    = null;
var date     = new Date();
/*require('mongodb').MongoClient.connect(process.env.MONGO_URL, {useUnifiedTopology: true}, (err, db) => {
  if(err) throw err;
  mongo = db;
  exp.getUniverseData(process.env.UNIVERSE_NAME);//carga los datos del universo
  mongo.db(process.env.UNIVERSE_NAME).collection("jugadores").countDocuments({}, function(err, cant) {exp.cantPlayers = cant});
  exp.getListCord();
  exp.getPlayer(process.env.PLAYER, () => {console.log('\x1b[32m%s\x1b[0m', "Base de datos lista.");});
});*/
var exp = {
  /*setUniverseData: function(name, data) {
    data.name     = name;
    this.universo = data;
    mongo.db(process.env.UNIVERSE_NAME).collection("universo").insertOne(data); // guarda la info del universo
  },
  getUniverseData: function(name){
    let cursor = mongo.db(process.env.UNIVERSE_NAME).collection("universo").find();
    cursor.forEach((doc, err) => {
      if(err) throw err;
      this.universo = doc;
    });
  },
  getListCord: function(){
    let obj = {};
    let cursor = mongo.db(process.env.UNIVERSE_NAME).collection("jugadores").find({});
    cursor.forEach((doc, err) => {
      for(let i = 0 ; i<doc.planets.length ; i++){
        obj[doc.planets[i].coordinates.galaxy + '_' + doc.planets[i].coordinates.system + '_' + doc.planets[i].coordinates.pos] = doc.planets[i].coordinates;
      }
    }, () => {this.allCord = obj;});
  },
  getPlayer: function(player, f) {
    mongo.db(process.env.UNIVERSE_NAME).collection("jugadores").findOne({name: player}, (err, res) => {
      if(err) throw err;
      if(res == null){
        f();
      }else{
        this.player = res;
        this.updatePlayer(res.name, (respuesta) => {this.player = respuesta;f();}, true); //actualiza los datos desde la ultima conecccion
      }
    });
  },
  updatePlayer: function(player, f, help = false){
    let objSet = {};
    let objInc = {};
    let listShip = [];
    if(help == true){
      let timeLastUpdate = new Date().getTime() - this.player.lastVisit;
      let updateResourcesAddOfAllPlanets = false;
      objSet['puntosAcum'] = this.player.puntosAcum;
      if((this.player.researchConstrucction != false) && (this.player.researchConstrucction.time - Math.floor((new Date().getTime() - this.player.researchConstrucction.init)/1000) <= 0)){
        objSet['researchConstrucction'] = false;
        objSet['puntosAcum'] += this.player.researchConstrucction.metal + this.player.researchConstrucction.crystal + this.player.researchConstrucction.deuterium;
        objInc['research.' + this.player.researchConstrucction.item] = 1;
        this.player.research[this.player.researchConstrucction.item] += 1;
        if(this.player.researchConstrucction.item == 'energy' || this.player.researchConstrucction.item == 'plasma') updateResourcesAddOfAllPlanets = true;
      }
      // Por cada planeta actualiza los datos de ese planeta y si tiene luna tambien la actualiza
      for(let i = 0 ; i<this.player.planets.length ; i++){
        let updateDataThisPlanet = false; // se fija que en ese planeta se halla terminado una contruccion, si es asi actualiza los campos y los valores
        if((this.player.planets[i].buildingConstrucction != false) && (this.player.planets[i].buildingConstrucction.time - Math.floor((new Date().getTime() - this.player.planets[i].buildingConstrucction.init)/1000) <= 0)){
          objSet['planets.' + i + '.buildingConstrucction'] = false;
          objSet['puntosAcum'] += this.player.planets[i].buildingConstrucction.metal + this.player.planets[i].buildingConstrucction.crystal + this.player.planets[i].buildingConstrucction.deuterium;
          objInc['planets.' + i + '.campos'] = 1;
          objInc['planets.' + i + '.buildings.' + this.player.planets[i].buildingConstrucction.item] = 1;
          updateDataThisPlanet = true;
          this.player.planets[i].buildings[this.player.planets[i].buildingConstrucction.item] += 1;
          if(this.player.planets[i].buildingConstrucction.item == "terraformer") objInc['planets.' + i + '.camposMax'] = 5;
        }
        if(this.player.planets[i].moon.active == true && this.player.planets[i].moon.buildingConstrucction != false && (this.player.planets[i].moon.buildingConstrucction.time - Math.floor((new Date().getTime() - this.player.planets[i].moon.buildingConstrucction.init)/1000) <= 0)){
          objSet['planets.' + i + '.moon.buildingConstrucction'] = false;
          objSet['puntosAcum'] += this.player.planets[i].moon.buildingConstrucction.metal + this.player.planets[i].moon.buildingConstrucction.crystal + this.player.planets[i].moon.buildingConstrucction.deuterium;
          objInc['planets.' + i + '.moon.campos'] = 1;
          objInc['planets.' + i + '.moon.buildings.' + this.player.planets[i].moon.buildingConstrucction.item] = 1;
          this.player.planets[i].moon.buildings[this.player.planets[i].moon.buildingConstrucction.item] += 1;
          if(this.player.planets[i].moon.buildingConstrucction.item == "lunarBase") objInc['planets.' + i + '.moon.camposMax'] = 3;
        }
        if(this.player.planets[i].shipConstrucction.length > 0){
          if(this.player.planets[i].shipConstrucction[0].new == true){
            this.player.planets[i].shipConstrucction[0].new = false;
            listShip = this.player.planets[i].shipConstrucction;
          }else{
            let timeLastUpdateAux = timeLastUpdate/1000;
            timeLastUpdateAux -= this.player.planets[i].shipConstrucction[0].timeNow;
            if(timeLastUpdateAux < 0){ // no termino ni la primer nave de la lista
              this.player.planets[i].shipConstrucction[0].timeNow -= timeLastUpdate/1000;//actualiza timeNow y no hace nada mas
              listShip = this.player.planets[i].shipConstrucction;
            }else{ // contruyo la primer nave y va por el resto
              let lugar = this.player.planets[i].shipConstrucction[0].def ? '.defense.' : '.fleet.';
              this.player.planets[i].shipConstrucction[0].cant -= 1;
              this.player.planets[i].shipConstrucction[0].metal -= this.player.planets[i].shipConstrucction[0].metalOne;
              this.player.planets[i].shipConstrucction[0].crystal -= this.player.planets[i].shipConstrucction[0].crystalOne;
              this.player.planets[i].shipConstrucction[0].deuterium -= this.player.planets[i].shipConstrucction[0].deuteriumOne;
              objInc['planets.' + i + lugar + this.player.planets[i].shipConstrucction[0].item] = 1;
              objSet['puntosAcum'] += this.player.planets[i].shipConstrucction[0].metalOne + this.player.planets[i].shipConstrucction[0].crystalOne + this.player.planets[i].shipConstrucction[0].deuteriumOne;
              for(let j = 0 ; j<this.player.planets[i].shipConstrucction.length ; j++){
                this.player.planets[i].shipConstrucction[j].new = false;
                if(timeLastUpdateAux > 0){
                  lugar = this.player.planets[i].shipConstrucction[j].def ? '.defense.' : '.fleet.';
                  let cantAux = 0;
                  let totalTimeJ = this.player.planets[i].shipConstrucction[j].time * this.player.planets[i].shipConstrucction[j].cant;
                  cantAux = timeLastUpdateAux / this.player.planets[i].shipConstrucction[j].time;
                  if(objInc['planets.' + i + lugar + this.player.planets[i].shipConstrucction[j].item] == undefined) objInc['planets.' + i + lugar + this.player.planets[i].shipConstrucction[j].item] = 0;
                  objInc['planets.' + i + lugar + this.player.planets[i].shipConstrucction[j].item] += Math.min(Math.floor(cantAux), this.player.planets[i].shipConstrucction[j].cant);
                  objSet['puntosAcum'] += Math.min(Math.floor(cantAux), this.player.planets[i].shipConstrucction[j].cant)*this.player.planets[i].shipConstrucction[j].metalOne + Math.min(Math.floor(cantAux), this.player.planets[i].shipConstrucction[j].cant)*this.player.planets[i].shipConstrucction[j].crystalOne + Math.min(Math.floor(cantAux), this.player.planets[i].shipConstrucction[j].cant)*this.player.planets[i].shipConstrucction[j].deuteriumOne;
                  this.player.planets[i].shipConstrucction[j].timeNow = (cantAux > 0) ? (this.player.planets[i].shipConstrucction[j].time - (timeLastUpdateAux - Math.floor(cantAux)*this.player.planets[i].shipConstrucction[j].time)) : (this.player.planets[i].shipConstrucction[j].timeNow - (timeLastUpdateAux - Math.floor(cantAux)*this.player.planets[i].shipConstrucction[j].time));
                  this.player.planets[i].shipConstrucction[j].cant      -= Math.floor(cantAux);
                  this.player.planets[i].shipConstrucction[j].metal     -= Math.floor(cantAux)*this.player.planets[i].shipConstrucction[j].metalOne;
                  this.player.planets[i].shipConstrucction[j].crystal   -= Math.floor(cantAux)*this.player.planets[i].shipConstrucction[j].crystalOne;
                  this.player.planets[i].shipConstrucction[j].deuterium -= Math.floor(cantAux)*this.player.planets[i].shipConstrucction[j].deuteriumOne;
                  timeLastUpdateAux -= totalTimeJ;
                }
                if(this.player.planets[i].shipConstrucction[j].cant > 0) listShip.push(this.player.planets[i].shipConstrucction[j]);
              }
            }
          }
        }
        objSet['planets.' + i + '.shipConstrucction'] = (listShip.length > this.player.planets[i].shipConstrucction.length) ? this.player.planets[i].shipConstrucction : listShip;
        objInc['puntos'] = Math.floor(objSet['puntosAcum']/1000);
        objSet['puntosAcum'] = objSet['puntosAcum'] % 1000;
        if(updateDataThisPlanet || updateResourcesAddOfAllPlanets){
          this.updateResourcesData(() => {}, i); //updatea la energia y resourcesAdd
          objSet['planets.' + i + '.resources.energy']       = this.player.planets[i].resources.energy;
          objSet['planets.' + i + '.resourcesAdd.metal']     = this.player.planets[i].resourcesAdd.metal;
          objSet['planets.' + i + '.resourcesAdd.crystal']   = this.player.planets[i].resourcesAdd.crystal;
          objSet['planets.' + i + '.resourcesAdd.deuterium'] = this.player.planets[i].resourcesAdd.deuterium;
        }
        let almacen = this.getAlmacen(i);
        /* deberia fijarce hace cuanto tiempo se aumento el edificio y que repercuciones tiene en la produccion de recursos */
        // Se queda con la cantidad maxima de recursos que se juntaron, siempre y cuando esa sea menor a la que entar en el almacen y sea poitiva
        objInc['planets.' + i + '.resources.metal']     = Math.max(0, Math.min(this.player.planets[i].resourcesAdd.metal*timeLastUpdate/(1000*3600), almacen.metal - this.player.planets[i].resources.metal));
        objInc['planets.' + i + '.resources.crystal']   = Math.max(0, Math.min(this.player.planets[i].resourcesAdd.crystal*timeLastUpdate/(1000*3600), almacen.crystal - this.player.planets[i].resources.crystal));
        objInc['planets.' + i + '.resources.deuterium'] = Math.max(0, Math.min(this.player.planets[i].resourcesAdd.deuterium*timeLastUpdate/(1000*3600), almacen.deuterium - this.player.planets[i].resources.deuterium));
      }
      objSet.lastVisit = new Date().getTime();    // Updatea la ultima vez que se actualizo este planeta
      mongo.db(process.env.UNIVERSE_NAME).collection("jugadores").findOneAndUpdate({name: player}, {$set: objSet, $inc: objInc}, {returnOriginal: false}, (err, res) => {
        if(err) throw err;
        f(res.value);
      });
    }else{
      mongo.db(process.env.UNIVERSE_NAME).collection("jugadores").findOne({name: player}, (err, res) => {
        if(err) throw err;
        /* tiene que hacer lo mismo que hace abajo pero en lugar de usar el objeto hhelp usar el res que encontro
        se podria pasar todo a una sola funcion que le entre help o res dependiendo de lo que se nececite */
        f();
      });
    }
  },
  addNewPlayer: function(name, styleGame) {
    var newPlanet = exp.createNewPlanet(exp.newCord(), "Planeta Principal", name, 'activo');
    var newPlayer = {'name': name,
      'styleGame': styleGame,
      planets: [newPlanet],
      maxPlanets: 1,
      highscore: this.cantPlayers + 1, // Empieza en la ultima posicion
      lastHighscore: this.cantPlayers + 1, // La posicion en la que estaba hace un dia, se la cuenta como la actual
      puntos: 0,
      puntosAcum: 0,
      vacas: [],
      sendEspionage: 1,
      sendSmall: 1,
      sendLarge: 1,
      dark: 8000,
      messagesCant: 0,
      messages: [],
      movement: [],
      researchConstrucction: false,
      tutorial: [false, false, false, false, false, false, false, false, false, false],
      research: {energy: 0, laser: 0, ion: 0, hyperspace: 0, plasma: 0, espionage: 0, computer: 0, astrophysics: 0, intergalactic: 0, graviton: 0, combustion: 0, impulse: 0, hyperspace_drive: 0, weapons: 0, shielding: 0, armour: 0},
      lastVisit: new Date().getTime(),  // Pone el tiempo actual
      type: "activo" // activo inactivo InactivoFuerte fuerte debil
    };
    this.cantPlayers++;//aumenta en uno la cantidad de jugadores del universo
    mongo.db(process.env.UNIVERSE_NAME).collection("jugadores").insertOne(newPlayer);//agrega al jugador a la lista de jugadores
  },
  systemInfo: function(res, gal, sys){
    let respuesta = {};
    for(let i = 1 ; i<=15 ; i++){
      respuesta['pos' + i] = {active: false};
    }
    let cursor = mongo.db(process.env.UNIVERSE_NAME).collection("jugadores").find({planets :{$elemMatch: {coordinatesCod: gal+'_'+sys}}});
    cursor.forEach((doc, err) => {
      for(let i = 0 ; i<doc.planets.length ; i++){
        if(doc.planets[i].coordinatesCod == gal+'_'+sys){
          let pos = doc.planets[i].coordinates.pos;
          respuesta['pos' + pos] = {active:        true,
                                    player:        doc.name,
                                    type:          doc.planets[i].type,
                                    color:         doc.planets[i].color,
                                    name:          doc.planets[i].name,
                                    moon:          doc.planets[i].moon.active,
                                    moonName:      doc.planets[i].moon.name,
                                    moonSize:      doc.planets[i].moon.size,
                                    debris:        doc.planets[i].debris.active,
                                    metalDebris:   doc.planets[i].debris.metal,
                                    crystalDebris: doc.planets[i].debris.crystal,
                                    estado:        "activo"};
        }
      }
    }, () => {
      res.send(respuesta);
    });
  },
  setOptions: function(res, esp, small, large){
    if(isFinite(esp) && isFinite(small) && isFinite(large)){
      mongo.db(process.env.UNIVERSE_NAME).collection("jugadores").updateOne({name: this.player.name}, {$set: {sendEspionage: esp, sendSmall: small, sendLarge: large}}, (err) => {
        res.send({ok: (err == null) ? true : err});
      });
    }else{
      res.send({ok: false, mes: "Algo salio mal. Parametros invalidos"});
    }
  },
  searchPlayer: function(res, playerName){
    mongo.db(process.env.UNIVERSE_NAME).collection("jugadores").findOne({name: playerName}, (err, obj) => {
      if(err) throw err;
      if(obj == null){
        res.send({ok: false, mes: "Not found"});
      }else{
        let coors = [], names = [];
        for(let i = 0 ; i<obj.planets.length ; i++){
          coors.push(obj.planets[i].coordinates);
          names.push(obj.planets[i].name);
        }
        res.send({ok: true, 'names': names, 'coors': coors});
      }
    });
  },
  highscoreData: function(res){
    listInfo = [];
    cursor = mongo.db(process.env.UNIVERSE_NAME).collection("jugadores").find({}).sort({"puntos":-1});
    cursor.forEach((doc, err) => {
      listInfo.push({name: doc.name, coor: doc.planets[0].coordinates, points: doc.puntos, rank: doc.highscore, lastRank: doc.lastHighscore});
    }, () => {
      res.send({ok: true, info: listInfo});
    });
  },
  toggleVaca: function(res, query){
    let elimino = false;
    for(let i = 0 ; i<this.player.vacas.length ; i++){
      if(this.player.vacas[i].coordinates.galaxy == query.coor.galaxy && this.player.vacas[i].coordinates.system == query.coor.system && this.player.vacas[i].coordinates.pos == query.coor.pos){
        elimino = true;
        this.player.vacas.splice(i,1);
        i--;
      }
    }
    if(elimino == false && this.player.name != query.playerName){
      this.player.vacas.push({coordinates: {galaxy: query.coor.galaxy, system: query.coor.system, pos: query.coor.pos},
                              playerName:  query.playerName,
                              planetName:  query.planetName,
                              estado:      query.estado});
    }
    mongo.db(process.env.UNIVERSE_NAME).collection("jugadores").updateOne({name: this.player.name}, {$set: {vacas: this.player.vacas}}, (err) => {
      res.send({ok: (err == null) ? true : err, deleted: elimino});
    });
  },
  setPlanetName: function(cord, newName){
    let objSet = {};
    if(this.moon == true){
      objSet['planets.$.moon.name'] = newName;
      this.player.planets[this.planeta].moon.name = newName;
    }else{
      objSet['planets.$.name'] = newName;
      this.player.planets[this.planeta].name = newName;
    }
    mongo.db(process.env.UNIVERSE_NAME).collection("jugadores").updateOne({planets :{$elemMatch: {coordinates: {galaxy: cord.galaxy, system: cord.system, pos: cord.pos}}}}, {$set: objSet});
  },
  proccesBuildRequest: function(planet, buildingName, res){
    if(this.player.planets[planet].buildingConstrucction == false){
      let objPrice     = this.costBuildings(planet);
      let enough       = fun.recursosSuficientes(this.player.planets[planet].resources, objPrice[buildingName]);
      let enoughEnergy = buildingName != 'terraformer'|| objPrice[buildingName].energy <= this.player.planets[planet].resourcesAdd.energy;
      let enoughFields = buildingName == 'terraformer'|| this.player.planets[planet].campos+1 < this.player.planets[planet].camposMax;
      if(enough && objPrice[buildingName].tech && enoughEnergy && enoughFields){
        let buildingConstrucctionAux = {};
        let buildingConstrucction    = {};
        let objInc                   = {};
        buildingConstrucctionAux.metal     = objPrice[buildingName].metal;
        buildingConstrucctionAux.crystal   = objPrice[buildingName].crystal;
        buildingConstrucctionAux.deuterium = objPrice[buildingName].deuterium;
        buildingConstrucctionAux.item      = buildingName;
        buildingConstrucctionAux.init      = new Date().getTime();
        buildingConstrucctionAux.time      = fun.timeBuild(objPrice[buildingName].metal + objPrice[buildingName].crystal, objPrice.time.mult, objPrice.time.elev);
        buildingConstrucction['planets.' + planet + '.buildingConstrucction'] = buildingConstrucctionAux;
        this.player.planets[planet].buildingConstrucction    = buildingConstrucctionAux;
        objInc['planets.' + planet + '.resources.metal']     = -objPrice[buildingName].metal;
        objInc['planets.' + planet + '.resources.crystal']   = -objPrice[buildingName].crystal;
        objInc['planets.' + planet + '.resources.deuterium'] = -objPrice[buildingName].deuterium;
        mongo.db(process.env.UNIVERSE_NAME).collection("jugadores").updateOne({name: this.player.name}, {$set: buildingConstrucction, $inc: objInc}, (err, result) => {
          if(err) throw err;
          res.send({ok: true})
        });
      }else{
        // Manejo de los errores
        let mesAux = '';
        if(!enough){
          mesAux = "Recursos no suficientes";
        }else{
          if(!objPrice[buildingName].tech){
            mesAux = "Tecnologia no alcanzada";
          }else{
            if(!enoughEnergy){
              mesAux = "No hay energia suficiente para construir el terraformer";
            }else{
              mesAux = "Campos insuficientes";
            }
          }
        }
        res.send({ok: false, mes: mesAux});
      }
    }else{
      res.send({ok: false, mes: "Ya se esta construyendo un edificio en ese planeta"});
    }
  },
  proccesMoonRequest: function(planet, buildingName, res){
    if(this.player.planets[planet].moon.buildingConstrucction == false){
      let objPrice     = this.costMoon(planet);
      let enough       = fun.recursosSuficientes(this.player.planets[planet].moon.resources, objPrice[buildingName]);
      let enoughFields = buildingName == 'lunarBase'|| this.player.planets[planet].moon.campos < this.player.planets[planet].moon.camposMax;
      if(enough && objPrice[buildingName].tech && enoughFields){
        let buildingConstrucctionAux = {};
        let buildingConstrucction    = {};
        let objInc                   = {};
        buildingConstrucctionAux.metal     = objPrice[buildingName].metal;
        buildingConstrucctionAux.crystal   = objPrice[buildingName].crystal;
        buildingConstrucctionAux.deuterium = objPrice[buildingName].deuterium;
        buildingConstrucctionAux.item      = buildingName;
        buildingConstrucctionAux.init      = new Date().getTime();
        buildingConstrucctionAux.time      = fun.timeBuild(objPrice[buildingName].metal + objPrice[buildingName].crystal, objPrice.time.mult, objPrice.time.elev);
        buildingConstrucction['planets.' + planet + '.moon.buildingConstrucction'] = buildingConstrucctionAux;
        this.player.planets[planet].buildingConstrucction = buildingConstrucctionAux;
        objInc['planets.' + planet + '.moon.resources.metal']     = -objPrice[buildingName].metal;
        objInc['planets.' + planet + '.moon.resources.crystal']   = -objPrice[buildingName].crystal;
        objInc['planets.' + planet + '.moon.resources.deuterium'] = -objPrice[buildingName].deuterium;
        mongo.db(process.env.UNIVERSE_NAME).collection("jugadores").updateOne({name: this.player.name}, {$set: buildingConstrucction, $inc: objInc}, (err, result) => {
          if(err) throw err;
          res.send({ok: true})
        });
      }else{
        let mesAux = '';
        if(!enough){
          mesAux = "Recursos insuficientes";
        }else{
          if(!objPrice[buildingName].tech){
            mesAux = "Tecnologia no alcanzada";
          }else{
            mesAux = "Campos insuficientes";
          }
        }
        res.send({ok: false, mes: mesAux});
      }
    }else{
      res.send({ok: false, mes: "Ya se esta contruyendo un edificio en esa luna"});
    }
  },
  proccesResearchRequest: function(planet, researchName, res){
    if(this.player.researchConstrucction == false){
      let objPrice = this.costResearch(planet);
      let enough   = fun.recursosSuficientes(this.player.planets[planet].resources, objPrice[researchName]);
      if(enough && objPrice[researchName].energy <= this.player.planets[planet].resourcesAdd.energy && objPrice[researchName].tech == true){
        let researchConstrucctionAux = {};
        let researchConstrucction    = {};
        let objInc                   = {};
        researchConstrucctionAux.metal     = objPrice[researchName].metal;
        researchConstrucctionAux.crystal   = objPrice[researchName].crystal;
        researchConstrucctionAux.deuterium = objPrice[researchName].deuterium;
        researchConstrucctionAux.item      = researchName;
        researchConstrucctionAux.planet    = planet;
        researchConstrucctionAux.init      = new Date().getTime();
        researchConstrucctionAux.time      = fun.timeBuild(objPrice[researchName].metal + objPrice[researchName].crystal, objPrice.time.mult, objPrice.time.elev, this.universo.speed);
        researchConstrucction['researchConstrucction'] = researchConstrucctionAux;
        this.player.researchConstrucction = researchConstrucctionAux;
        objInc['planets.' + planet + '.resources.metal']     = -objPrice[researchName].metal;
        objInc['planets.' + planet + '.resources.crystal']   = -objPrice[researchName].crystal;
        objInc['planets.' + planet + '.resources.deuterium'] = -objPrice[researchName].deuterium;
        mongo.db(process.env.UNIVERSE_NAME).collection("jugadores").updateOne({name: this.player.name}, {$set: researchConstrucction, $inc: objInc}, (err, result) => {
          if(err) throw err;
          res.send({ok: true})
        });
      }else{
        res.send({ok: false, mes: ((objPrice[researchName].tech) ? "Recursos insuficientes" : "Tecnologia no alcanzada")});
      }
    }else{
      res.send({ok: false, mes: "Ya se esta investigando algo"});
    }
  },
  proccesShipyardRequest: function(planet, shipyardName, shipyardCant, res){
    shipyardCant = parseInt(shipyardCant);
    if(fun.validInt(shipyardCant) && fun.validShipyardName(shipyardName) && shipyardCant > 0){
      let objPrice = {...this.costShipyard(planet), ...this.costDefense(planet)};
      let enough = fun.recursosSuficientes(this.player.planets[planet].resources, objPrice[researchName], shipyardCant);
      if(enough && objPrice[shipyardName].tech == true){
        // Si voy a construir misiles en el silo, me fijo que haya capacidad para los misiles
        if((shipyardName == "antiballisticMissile" || shipyardName == "interplanetaryMissile") && (shipyardCant + fun.cantidadMisiles(planeta) < fun.capacidadSilo(planeta))) return res.send({ok: false, mes: "No hay mas espacio en el silo"});
        let shipyardConstrucctionAux = {};
        let shipyardConstrucction    = {};
        let objInc                   = {};
        let defensa                  = false;
        shipyardConstrucctionAux.cant         = shipyardCant;
        shipyardConstrucctionAux.metal        = objPrice[shipyardName].metal*shipyardCant;
        shipyardConstrucctionAux.crystal      = objPrice[shipyardName].crystal*shipyardCant;
        shipyardConstrucctionAux.deuterium    = objPrice[shipyardName].deuterium*shipyardCant;
        shipyardConstrucctionAux.metalOne     = objPrice[shipyardName].metal;
        shipyardConstrucctionAux.crystalOne   = objPrice[shipyardName].crystal;
        shipyardConstrucctionAux.deuteriumOne = objPrice[shipyardName].deuterium;
        shipyardConstrucctionAux.name         = objPrice[shipyardName].name;
        shipyardConstrucctionAux.item         = shipyardName;
        shipyardConstrucctionAux.new          = true;
        shipyardConstrucctionAux.init         = new Date().getTime();
        shipyardConstrucctionAux.time         = fun.timeBuild(objPrice[shipyardName].metal + objPrice[shipyardName].crystal, objPrice.time.mult, objPrice.time.elev);
        shipyardConstrucctionAux.timeNow      = shipyardConstrucctionAux.time;
        for(let i = 0 ; i<objPrice.listInfo.length && !defensa ; i++){
          if(objPrice.listInfo[i] == shipyardName) defensa = true;
        }
        shipyardConstrucctionAux.def = defensa;
        shipyardConstrucction['planets.' + planet + '.shipConstrucction'] = shipyardConstrucctionAux;
        this.player.planets[planet].shipConstrucction.push(shipyardConstrucctionAux);
        objInc['planets.' + planet + '.resources.metal']     = -objPrice[shipyardName].metal*shipyardCant;
        objInc['planets.' + planet + '.resources.crystal']   = -objPrice[shipyardName].crystal*shipyardCant;
        objInc['planets.' + planet + '.resources.deuterium'] = -objPrice[shipyardName].deuterium*shipyardCant;
        mongo.db(process.env.UNIVERSE_NAME).collection("jugadores").updateOne({name: this.player.name}, {$push: shipyardConstrucction, $inc: objInc}, (err, result) => {
          if(err) throw err;
          res.send({ok: true})
        });
      }else{
        res.send({ok: false, mes: ((objPrice[shipyardName].tech) ? "Recursos insuficientes" : "Tecnologia no alcanzada")});
      }
    }else{
      res.send({ok: false, mes: "Cantidad o nave no valida"});
    }
  },
  cancelBuildRequest: function(planet, res){
    if(this.player.planets[planet].buildingConstrucction != false){
      let objSet = {};
      let objInc = {};
      objSet['planets.' + planet + '.buildingConstrucction'] = false;
      objInc['planets.' + planet + '.resources.metal']       = this.player.planets[planet].buildingConstrucction.metal;
      objInc['planets.' + planet + '.resources.crystal']     = this.player.planets[planet].buildingConstrucction.crystal;
      objInc['planets.' + planet + '.resources.deuterium']   = this.player.planets[planet].buildingConstrucction.deuterium;
      mongo.db(process.env.UNIVERSE_NAME).collection("jugadores").updateOne({name: this.player.name}, {$set: objSet, $inc: objInc}, (err, result) => {
        if(err) throw err;
        res.send({ok: true});
      });
    }else{
      res.send({ok: false, mes: "No se esta construyendo ningun edificio en ese planeta"});
    }
  },
  cancelMoonRequest: function(planet, res){
    if(this.player.planets[planet].moon.active == true && this.player.planets[planet].moon.buildingConstrucction != false){
      let objSet = {};
      let objInc = {};
      objSet['planets.' + planet + '.moon.buildingConstrucction'] = false;
      objInc['planets.' + planet + '.moon.resources.metal']       = this.player.planets[planet].moon.buildingConstrucction.metal;
      objInc['planets.' + planet + '.moon.resources.crystal']     = this.player.planets[planet].moon.buildingConstrucction.crystal;
      objInc['planets.' + planet + '.moon.resources.deuterium']   = this.player.planets[planet].moon.buildingConstrucction.deuterium;
      mongo.db(process.env.UNIVERSE_NAME).collection("jugadores").updateOne({name: this.player.name}, {$set: objSet, $inc: objInc}, (err, result) => {
        if(err) throw err;
        res.send({ok: true});
      });
    }else{
      res.send({ok: false, mes: ((this.player.planets[planet].moon.active) ? "No se esta construyendo nada en la luna" : "No existe la luna...")});
    }
  },
  cancelResearchRequest: function(res){
    if(this.player.researchConstrucction != false){
      let planet = this.player.researchConstrucction.planet;
      let objSet = {};
      let objInc = {};
      objSet['researchConstrucction'] = false;
      objInc['planets.' + planet + '.resources.metal']     = this.player.researchConstrucction.metal;
      objInc['planets.' + planet + '.resources.crystal']   = this.player.researchConstrucction.crystal;
      objInc['planets.' + planet + '.resources.deuterium'] = this.player.researchConstrucction.deuterium;
      mongo.db(process.env.UNIVERSE_NAME).collection("jugadores").updateOne({name: this.player.name}, {$set: objSet, $inc: objInc}, (err, result) => {
        if(err) throw err;
        res.send({ok: true});
      });
    }else{
      res.send({ok: false, mes: "No se esta investigando nada"});
    }
  },
  cancelShipyardRequest: function(planet, shipyardName, res){
    let objPull = {};
    let objInc  = {};
    objInc['planets.' + planet + '.resources.metal']     = 0;
    objInc['planets.' + planet + '.resources.crystal']   = 0;
    objInc['planets.' + planet + '.resources.deuterium'] = 0;
    for(let i = 0 ; i<this.player.planets[planet].shipConstrucction.length ; i++){
      if(this.player.planets[planet].shipConstrucction[i].item == shipyardName){
        objInc['planets.' + planet + '.resources.metal']     += this.player.planets[planet].shipConstrucction[i].metal;
        objInc['planets.' + planet + '.resources.crystal']   += this.player.planets[planet].shipConstrucction[i].crystal;
        objInc['planets.' + planet + '.resources.deuterium'] += this.player.planets[planet].shipConstrucction[i].deuterium;
      }
    }
    objPull['planets.' + planet + '.shipConstrucction'] = {item: shipyardName};
    //objPull['planets.' + planet + '.shipConstrucction'] = {};
    mongo.db(process.env.UNIVERSE_NAME).collection("jugadores").updateOne({name: this.player.name}, {$pull: objPull, $inc: objInc}, (err, result) => {
      if(err) throw err;
      res.send({ok: true});
    });
  },
  updateResourcesData: function(f, planet, obj = null) { //updatea los multiplicadores de los recursos(NO toca los recursos)
    let objSet = {};
    let spd    = this.universo.speed;
    let plasma = this.player.research.plasma;
    let minas  = this.player.planets[planet].buildings;
    let temp   = (this.player.planets[planet].temperature.max + this.player.planets[planet].temperature.min)/2;
    if(obj != null){
      this.player.planets[planet].resourcesPercentage = obj;
      objSet.resourcesPercentage = obj;
    }
    let maxEnergyAux = {metal: Math.floor(parseInt(this.player.planets[planet].resourcesPercentage.metal) * minas.metalMine * Math.pow(1.1, minas.metalMine)),
                        crystal: Math.floor(parseInt(this.player.planets[planet].resourcesPercentage.crystal) * minas.crystalMine * Math.pow(1.1, minas.crystalMine)),
                        deuterium: Math.floor(2*parseInt(this.player.planets[planet].resourcesPercentage.deuterium) * minas.deuteriumMine * Math.pow(1.1, minas.deuteriumMine))};
    let auxEnergy = {solar: Math.floor(20 * minas.solarPlant * Math.pow(1.1,minas.solarPlant)),
                     fusion: Math.floor(3 * minas.fusionReactor * parseInt(this.player.planets[planet].resourcesPercentage.energy) * Math.pow(1.05 + 0.01*this.player.research.energy, minas.fusionReactor)),
                     fusionDeuterium: -Math.floor(minas.fusionReactor * parseInt(this.player.planets[planet].resourcesPercentage.energy) * Math.pow(1.1, minas.fusionReactor)),
                     satillite: Math.floor((temp+160)/6)*this.player.planets[planet].fleet.solarSatellite};
    let energyTotal      = auxEnergy.solar + auxEnergy.fusion + auxEnergy.satillite;
    let totalEnergyUsage = maxEnergyAux.metal + maxEnergyAux.crystal + maxEnergyAux.deuterium;
    let energyUsage = {metal: Math.floor((maxEnergyAux.metal*energyTotal)/totalEnergyUsage),
                       crystal: Math.floor((maxEnergyAux.crystal*energyTotal)/totalEnergyUsage),
                       deuterium: Math.floor((maxEnergyAux.deuterium*energyTotal)/totalEnergyUsage)};
    energyUsage = {metal: ((energyUsage.metal > maxEnergyAux.metal) ? maxEnergyAux.metal : energyUsage.metal),
                   crystal: ((energyUsage.crystal > maxEnergyAux.crystal) ? maxEnergyAux.crystal : energyUsage.crystal),
                   deuterium: ((energyUsage.deuterium > maxEnergyAux.deuterium) ? maxEnergyAux.deuterium : energyUsage.deuterium)};
    let energy = Math.floor(energyTotal - maxEnergyAux.metal - maxEnergyAux.crystal - maxEnergyAux.deuterium);
    objSet['resources.energy']    = energy;
    objSet['resourcesAdd.energy'] = energyTotal;
    let deuteriumHour = spd * ((isNaN(energyUsage.deuterium/maxEnergyAux.deuterium)) ? 0 : (energyUsage.deuterium/maxEnergyAux.deuterium))*parseInt(this.player.planets[planet].resourcesPercentage.deuterium)*minas.deuteriumMine*Math.pow(1.1, minas.deuteriumMine)*(1.36-0.004*temp)*(100+plasma/3)/100 + auxEnergy.fusionDeuterium;
    if(deuteriumHour < 0) deuteriumHour = 0; // Si la ganancia de deuterio es nagativa se la redondea a 0
    objSet.resourcesAdd = {metal: 30*spd+3*((isNaN(energyUsage.metal/maxEnergyAux.metal)) ? 0 : (energyUsage.metal/maxEnergyAux.metal))*spd*parseInt(this.player.planets[planet].resourcesPercentage.metal)*minas.metalMine*Math.pow(1.1, minas.metalMine)*(100+plasma)/100,
                           crystal: 15*spd+2*((isNaN(energyUsage.crystal/maxEnergyAux.crystal)) ? 0 : (energyUsage.crystal/maxEnergyAux.crystal))*spd*parseInt(this.player.planets[planet].resourcesPercentage.crystal)*minas.crystalMine*Math.pow(1.1, minas.crystalMine)*(100+plasma*(2/3))/100,
                           deuterium: deuteriumHour};
    this.player.planets[planet].resourcesAdd        = objSet.resourcesAdd;
    this.player.planets[planet].resources.energy    = energy;
    this.player.planets[planet].resourcesAdd.energy = energyTotal;
    if(obj != null){
      mongo.db(process.env.UNIVERSE_NAME).collection("jugadores").updateOne({planets :{$elemMatch: {coordinates: {galaxy: this.player.planets[planet].coordinates.galaxy, system: this.player.planets[planet].coordinates.system, pos: this.player.planets[planet].coordinates.pos}}}}, {$set: {'planets.$.resourcesPercentage': objSet.resourcesPercentage, 'planets.$.resources.energy': objSet['resources.energy'], 'planets.$.resourcesAdd': objSet.resourcesAdd}}, () => {
        f();
      });
    }
  },
  updateResourcesDataMoon: function(f, planet, obj){
    if(obj != null){
      obj.sunshade   = parseInt(obj.sunshade);
      obj.beam       = parseInt(obj.beam); // recalcula la temperatura del planeta
      newTemperature = {max: Math.floor(this.player.planets[planet].temperatureNormal.max+this.player.planets[planet].moon.buildings.lunarBeam*4*obj.beam/10-this.player.planets[planet].moon.buildings.lunarSunshade*4*obj.sunshade/10),
                        min: Math.floor(this.player.planets[planet].temperatureNormal.min+this.player.planets[planet].moon.buildings.lunarBeam*4*obj.beam/10-this.player.planets[planet].moon.buildings.lunarSunshade*4*obj.sunshade/10)}
      mongo.db(process.env.UNIVERSE_NAME).collection("jugadores").updateOne({planets :{$elemMatch: {coordinates: {galaxy: this.player.planets[planet].coordinates.galaxy, system: this.player.planets[planet].coordinates.system, pos: this.player.planets[planet].coordinates.pos}}}}, {$set: {'planets.$.temperature': newTemperature, 'planets.$.moon.values': obj}}, () => {
        this.updateResourcesData(f, planet, this.player.planets[planet].resourcesPercentage); // recalcula la produccion de las minas y guarda todo en la base de datos
      });
    }
  },
  setPlanetData: function(cord, player){
    /* cambiar para que no sean constantes ??? */
    let resources = {metal: 1000, crystal: 1000, deuterium: 0, energy: 0};
    let building = {metalMine: 0, crystalMine: 1, deuteriumMine: 0, solarPlant: 30, fusionReactor: 0, metalStorage: 10, crystalStorage: 9, deuteriumStorage: 8, robotFactory: 0, shipyard: 0, researchLab: 0, alliance: 0, silo: 0, naniteFactory: 0, terraformer: 0};
    let fleet = {lightFighter: 10, heavyFighter: 0, cruiser: 1, battleship: 10, battlecruiser: 0, bomber: 3, destroyer: 100, deathstar: 1, smallCargo: 20, largeCargo: 200, colony: 1, recycler: 10, espionageProbe: 30, solarSatellite: 15};
    let defenses = {rocketLauncher: 0, lightLaser: 0, heavyLaser: 0, gauss: 10, ion: 0, plasma: 0, smallShield: 0, largeShield: 0, antiballisticMissile: 0, interplanetaryMissile: 0};
    let moon = this.createNewMoon(8888); //{active: false, size: 0};
    let debris = {active: false, metal:0, crystal: 0};
    mongo.db(process.env.UNIVERSE_NAME).collection("jugadores").updateOne({planets :{$elemMatch: {coordinates: {galaxy: cord.galaxy, system: cord.system, pos: cord.pos}}}}, {$set: {'planets.$.resources': resources,'planets.$.buildings': building, 'planets.$.fleet': fleet, 'planets.$.defense': defenses,'planets.$.moon': moon, 'planets.$.debris': debris}});
  },
  setMoonData: function(cord, player){ // asume el planeta tiene luna si no, no hace nada
    /* cambiar para que no sean constantes ??? */
    let resources = {metal: 500000, crystal: 4000000, deuterium: 1000000, energy: 0};
    let building = {lunarBase: 6, phalanx: 2, spaceDock: 0, marketplace: 1, lunarSunshade: 5, lunarBeam: 6, jumpGate: 1, moonShield: 0};
    let fleet = {lightFighter: 1000, heavyFighter: 0, cruiser: 1, battleship: 30, battlecruiser: 0, bomber: 0, destroyer: 0, deathstar: 100, smallCargo: 0, largeCargo: 0, colony: 0, recycler: 0, espionageProbe: 0, solarSatellite: 0};
    mongo.db(process.env.UNIVERSE_NAME).collection("jugadores").updateOne({planets :{$elemMatch: {coordinates: {galaxy: cord.galaxy, system: cord.system, pos: cord.pos}}}}, {$set: {'planets.$.moon.resources': resources,'planets.$.moon.buildings': building, 'planets.$.moon.fleet': fleet}});
  },
  colonize: function(cord, player){
    /*se tiene que fijar que no halla nadie en esa posicion
    /*se tiene que fijar que la tecnologia de astrofisica permita colonizar
    /*se tiene que fijar que el jugador no supere el maximo de planetas permitidos(8 max.)*/
    let newPlanet = this.createNewPlanet(cord, 'Colony', player, 'activo'); // no deberia estar siempre activo

    mongo.db(process.env.UNIVERSE_NAME).collection("jugadores").updateOne({name: player}, {$push: {planets: newPlanet}});
  },
  sendMessage: function(player, info) {
    let newMessage = {date: new Date().toString().slice(0,24), type: info.type, title: info.title, text: info.text, data: info.data};
    if(player == this.player.name) this.player.messagesCant++;
    mongo.db(process.env.UNIVERSE_NAME).collection("jugadores").updateOne({name: player},{$push: {messages: newMessage}, $inc: {messagesCant: 1}});
  },
  deleteMessage: function(player, all, borra) {
    let obj = (all == true) ? {type: parseInt(borra)} : {date: borra};
    mongo.db(process.env.UNIVERSE_NAME).collection("jugadores").updateOne({name: player},{$pull: {messages: obj}}, {multi: true});
  },
  setNoReadMessages: function(){
    this.player.messagesCant = 0;
    mongo.db(process.env.UNIVERSE_NAME).collection("jugadores").updateOne({name: this.player.name}, {$set: {messagesCant: 0}});
  },
  contPoint: function(player){
    mongo.db(process.env.UNIVERSE_NAME).collection("jugadores").findOne({name: player}, (err, res) => {
      if(err) throw err;
      /* no cuenta los puntos de las naves en vuelo */
      let puntos = 0;
      let maxLevel = 0;
      let costShipyard = {
        lightFighter:          {metal: 3000, crystal: 1000, deuterium: 0},
        heavyFighter:          {metal: 6000, crystal: 4000, deuterium: 0},
        cruiser:               {metal: 2000, crystal: 7000, deuterium: 2000},
        battleship:            {metal: 45000, crystal: 15000, deuterium: 0},
        battlecruiser:         {metal: 30000, crystal: 40000, deuterium: 15000},
        bomber:                {metal: 50000, crystal: 25000, deuterium: 15000},
        destroyer:             {metal: 60000, crystal: 50000, deuterium: 15000},
        deathstar:             {metal: 5000000, crystal: 4000000, deuterium: 1000000},
        smallCargo:            {metal: 2000, crystal: 2000, deuterium: 0},
        largeCargo:            {metal: 6000, crystal: 6000, deuterium: 0},
        colony:                {metal: 10000, crystal: 20000, deuterium: 10000},
        recycler:              {metal: 10000, crystal: 6000, deuterium: 2000},
        espionageProbe:        {metal: 0, crystal: 1000, deuterium: 0},
        solarSatellite:        {metal: 0, crystal: 2000, deuterium: 500},
        rocketLauncher:        {metal: 2000, crystal: 0, deuterium: 0},
        lightLaser:            {metal: 1500, crystal: 500, deuterium: 0},
        heavyLaser:            {metal: 6000, crystal: 2000, deuterium: 0},
        gauss:                 {metal: 20000, crystal: 15000, deuterium: 0},
        ion:                   {metal: 2000, crystal: 6000, deuterium: 0},
        plasma:                {metal: 50000, crystal: 50000, deuterium: 30000},
        smallShield:           {metal: 10000, crystal: 10000, deuterium: 0},
        largeShield:           {metal: 50000, crystal: 50000, deuterium: 0},
        antiballisticMissile:  {metal: 8000, crystal: 0, deuterium: 2000},
        interplanetaryMissile: {metal: 12500, crystal: 2500, deuterium: 10000}
      }
      for(let item in res.research){
        if(res.research[item] > maxLevel) maxLevel = res.research[item];
      }
      for(let j = 0 ; j<=maxLevel ; j++){
        puntos += (j < res.research.energy)           ? 800*Math.pow(2, j) +  400*Math.pow(2, j) : 0;
        puntos += (j < res.research.laser)            ? 200*Math.pow(2, j) + 100*Math.pow(2, j) : 0;
        puntos += (j < res.research.ion)              ? 1000*Math.pow(2, j) + 300*Math.pow(2, j) +  100*Math.pow(2, j) : 0;
        puntos += (j < res.research.hyperspace)       ? 4000*Math.pow(2, j) +  2000*Math.pow(2, j) : 0;
        puntos += (j < res.research.plasma)           ? 2000*Math.pow(2, j) + 4000*Math.pow(2, j) +  1000*Math.pow(2, j) : 0;
        puntos += (j < res.research.espionage)        ? 200*Math.pow(2, j) + 1000*Math.pow(2, j) +  200*Math.pow(2, j) : 0;
        puntos += (j < res.research.computer)         ? 400*Math.pow(2, j) +  600*Math.pow(2, j) : 0;
        puntos += (j < res.research.astrophysics)     ? 4000*Math.pow(2, j) + 8000*Math.pow(2, j) +  4000*Math.pow(2, j) : 0;
        puntos += (j < res.research.intergalactic)    ? 240000*Math.pow(2, j) + 400000*Math.pow(2, j) +  160000*Math.pow(2, j) : 0;
        puntos += (j < res.research.combustion)       ? 400*Math.pow(2, j) + 600*Math.pow(2, j) : 0;
        puntos += (j < res.research.impulse)          ? 2000*Math.pow(2, j) + 4000*Math.pow(2, j) +  600*Math.pow(2, j) : 0;
        puntos += (j < res.research.hyperspace_drive) ? 10000*Math.pow(2, j) + 20000*Math.pow(2, j) +  6000*Math.pow(2, j) : 0;
        puntos += (j < res.research.weapon)           ? 800*Math.pow(2, j) + 200*Math.pow(2, j) : 0;
        puntos += (j < res.research.shielding)        ? 200*Math.pow(2, j) + 600*Math.pow(2, j) : 0;
        puntos += (j < res.research.armour)           ? 1000*Math.pow(2, j) : 0;
      }
      for(let i = 0 ; i<res.planets.length ; i++){
        for(let obj in res.planets[i].fleet){
          puntos += costShipyard[obj].metal * res.planets[i].fleet[obj] + costShipyard[obj].crystal * res.planets[i].fleet[obj] + costShipyard[obj].deuterium * res.planets[i].fleet[obj];
        }
        for(let obj in res.planets[i].defense){
          puntos += costShipyard[obj].metal * res.planets[i].defense[obj] + costShipyard[obj].crystal * res.planets[i].defense[obj] + costShipyard[obj].deuterium * res.planets[i].defense[obj];
        }
        maxLevel = 0;
        for(let item in res.planets[i].buildings){
          if(res.planets[i].buildings[item] > maxLevel) maxLevel = res.planets[i].buildings[item];
        }
        for(let j = 0 ; j<=maxLevel ; j++){
          puntos += (j < res.planets[i].buildings.metalMine)        ? Math.floor(60*Math.pow(1.5, j)) + Math.floor(15*Math.pow(1.5, j)) : 0;
          puntos += (j < res.planets[i].buildings.crystalMine)      ? Math.floor(48*Math.pow(1.6, j)) + Math.floor(24*Math.pow(1.6, j)) : 0;
          puntos += (j < res.planets[i].buildings.deuteriumMine)    ? Math.floor(225*Math.pow(1.5, j)) + Math.floor(75*Math.pow(1.5, j)) : 0;
          puntos += (j < res.planets[i].buildings.solarPlant)       ? Math.floor(75*Math.pow(1.5, j)) + Math.floor(30*Math.pow(1.5, j)) : 0;
          puntos += (j < res.planets[i].buildings.fusionReactor)    ? Math.floor(900*Math.pow(1.8, j)) + Math.floor(360*Math.pow(1.8, j)) + Math.floor(180*Math.pow(1.8, j)) : 0;
          puntos += (j < res.planets[i].buildings.metalStorage)     ? 1000*Math.pow(2, j) : 0;
          puntos += (j < res.planets[i].buildings.crystalStorage)   ? 1000*Math.pow(2, j) + 500*Math.pow(2, j) : 0;
          puntos += (j < res.planets[i].buildings.deuteriumStorage) ? 1000*Math.pow(2, j) + 1000*Math.pow(2, j) : 0;
          puntos += (j < res.planets[i].buildings.robotFactory)     ? 400*Math.pow(2, j) + 120*Math.pow(2, j) + 200*Math.pow(2, j) : 0;
          puntos += (j < res.planets[i].buildings.shipyard)         ? 400*Math.pow(2, j) + 200*Math.pow(2, j) + 100*Math.pow(2, j) : 0;
          puntos += (j < res.planets[i].buildings.researchLab)      ? 200*Math.pow(2, j) + 400*Math.pow(2, j) + 200*Math.pow(2, j) : 0;
          puntos += (j < res.planets[i].buildings.alliance)         ? 20000*Math.pow(2, j) + 40000*Math.pow(2, j) : 0;
          puntos += (j < res.planets[i].buildings.silo)             ? 20000*Math.pow(2, j) + 20000*Math.pow(2, j) + 1000*Math.pow(2, j) : 0;
          puntos += (j < res.planets[i].buildings.naniteFactory)    ? 1000000*Math.pow(2, j) + 500000*Math.pow(2, j) + 100000*Math.pow(2, j) : 0;
          puntos += (j < res.planets[i].buildings.terraformer)      ? 50000*Math.pow(2, j) + 100000*Math.pow(2, j): 0;
        }
        if(res.planets[i].active){ //Suma los recursos de la luna
          for(let obj in res.planets[i].fleet){
            puntos += costShipyard[obj].metal * res.planets[i].moon.fleet[obj] + costShipyard[obj].crystal * res.planets[i].moon.fleet[obj] + costShipyard[obj].deuterium * res.planets[i].moon.fleet[obj];
          }
          maxLevel = 0;
          for(let item in res.planets[i].moon.buildings){
            if(res.planets[i].moon.buildings[item] > maxLevel) maxLevel = res.planets[i].moon.buildings[item];
          }
          for(let j = 0 ; j<=maxLevel ; j++){
            puntos += (j < res.planets[i].moon.buildings.lunarBase) ? 10000*Math.pow(2, j) + 20000*Math.pow(2, j) + 10000*Math.pow(2, j) : 0;
            puntos += (j < res.planets[i].moon.buildings.phalanx) ? 20000*Math.pow(2, j) + 40000*Math.pow(2, j) + 20000*Math.pow(2, j) : 0;
            puntos += (j < res.planets[i].moon.buildings.spaceDock) ? 200*Math.pow(4, j) + 10*Math.pow(3, j) + 50*Math.pow(5, j) : 0;
            puntos += (j < res.planets[i].moon.buildings.marketplace) ? 6000000*Math.pow(2, j) + 4000000*Math.pow(2, j) + 2000000*Math.pow(2, j) : 0;
            puntos += (j < res.planets[i].moon.buildings.lunarSunshade) ? 15000*Math.pow(2, j) + 50000*Math.pow(2, j) : 0;
            puntos += (j < res.planets[i].moon.buildings.lunarBeam) ? 75000*Math.pow(2, j) + 90000*Math.pow(2, j) : 0;
            puntos += (j < res.planets[i].moon.buildings.jumpGate) ? 2000000*Math.pow(2, j) + 4000000*Math.pow(2, j) + 2000000*Math.pow(2, j) : 0;
            puntos += (j < res.planets[i].moon.buildings.moonShield) ? 9000000*Math.pow(3, j) + 5000000*Math.pow(3, j) + 2000000*Math.pow(3, j) : 0;
          }
        }
      }
      /* suma los puntos de las flotas que estan en movimiento */
      mongo.db(process.env.UNIVERSE_NAME).collection("jugadores").updateOne({name: player}, {$set: {'puntos': Math.floor(puntos/1000), puntosAcum: (puntos%1000)}});
    });
  },
  contMoonFields: function(planet){
    if(this.player.planets[planet].moon.active == true){
      let campos = 0;
      let objSet = {};
      for(let item in this.player.planets[planet].moon.buildings){
        campos += this.player.planets[planet].moon.buildings[item];
      }
      objSet['planets.' + planet + '.moon.campos'] = campos;
      objSet['planets.' + planet + '.moon.camposMax'] = this.player.planets[planet].moon.buildings.lunarBase*3 + 1;
      mongo.db(process.env.UNIVERSE_NAME).collection("jugadores").updateOne({name: this.player.name}, {$set: objSet});
    }
  },*/
  seeDataBase: (res, uni, name) => {
    let respuesta = "";
    let cursor = mongo.db(uni).collection(name).find();
    cursor.forEach((doc, err) => {
      respuesta += JSON.stringify(doc);
    }, () => {
      res.render('index', {title: 'Ogame', message: respuesta});
    });
  }
  /*seeJsonDataBase: (res, uni, name, objName = "item", filtro = {}) => {
    let cursor = mongo.db(uni).collection(name).find(filtro);
    let obj = {};
    let i = 1;
    cursor.forEach((doc, err) => {
      obj[objName+i] = doc;
      i++;
    }, () => {
      res.send(obj);
    });
  },
  deleteRecord: (id, uni, name) => {
    mongo.db(uni).collection(name).deleteOne({"_id": objectId(id)});
  },
  deleteCollection: (uni, nameList) => {
    for(let i = 0 ; i<nameList.length ; i++){
      mongo.db(uni).dropCollection(nameList[i], (err, delOK) => {if(delOK) console.log('\x1b[35m%s\x1b[0m', "Collection" + nameList[i] + "deleted")});
    }
  }*/
};

module.exports = exp;
