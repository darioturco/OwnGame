var objectId = require('mongodb').ObjectId;
var mongo = null;
var date = new Date();
require('mongodb').MongoClient.connect(process.env.MONGO_URL, {useUnifiedTopology: true}, (err, db) => {
  if(err) throw err;
  mongo = db;
  exp.getUniverseData(process.env.UNIVERSE_NAME);//carga los datos del universo
  mongo.db(process.env.UNIVERSE_NAME).collection("jugadores").countDocuments({}, function(err, cant) {exp.cantPlayers = cant});
  exp.getListCord();
  exp.getPlayer(process.env.PLAYER, () => {console.log('\x1b[32m%s\x1b[0m', "Base de datos lista.");});
  setInterval(() => {// Actualiza cada 0.999 segundos el estado primario del universo
    /*date = new Date();
    if(date.getHours() == 0 && date.getMinutes() == 0 && date.getSeconds() == 0){
      console.log("Actualizacion diaria");
    }*/
  }, 999);
});
var exp = {
  universo: null,
  player: null,
  planeta: 0,
  moon: false,
  cantPlayers: 0,
  allCord: {},
  comienzoBusquedaNewConrd: 1,
  createUniverse: function(name, cant, data){
    this.setUniverseData(name, data);
    for(let i = 0 ; i<cant ; i++){
      this.addNewPlayer('bot_' + i, 2);
    }
  },
  setUniverseData: function(name, data) {
    data.name = name;
    this.universo = data;
    mongo.db(process.env.UNIVERSE_NAME).collection("universo").insertOne(data);// guarda la unfo del universo
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
        obj[doc.planets[i].coordinates.galaxy+'_'+doc.planets[i].coordinates.system+'_'+doc.planets[i].coordinates.pos] = doc.planets[i].coordinates;
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
        this.updatePlayer(res.name, (respuesta) => {this.player = respuesta;f();}, true);//actualiza los datos desde la ultima conecccion
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
                  this.player.planets[i].shipConstrucction[j].cant -= Math.floor(cantAux);
                  this.player.planets[i].shipConstrucction[j].metal -= Math.floor(cantAux)*this.player.planets[i].shipConstrucction[j].metalOne;
                  this.player.planets[i].shipConstrucction[j].crystal -= Math.floor(cantAux)*this.player.planets[i].shipConstrucction[j].crystalOne;
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
          this.updateResourcesData(() => {}, i);//updatea la energia y resourcesAdd
          objSet['planets.' + i + '.resources.energy'] = this.player.planets[i].resources.energy;
          objSet['planets.' + i + '.resourcesAdd.metal'] = this.player.planets[i].resourcesAdd.metal;
          objSet['planets.' + i + '.resourcesAdd.crystal'] = this.player.planets[i].resourcesAdd.crystal;
          objSet['planets.' + i + '.resourcesAdd.deuterium'] = this.player.planets[i].resourcesAdd.deuterium;
        }
        let almacen = this.getAlmacen(i);
        // deberia fijarce hace cuanto tiempo se aumento el edificio y que repercuciones tiene en la produccion de recursos
        // deberia fijarce en la capacidad maxima de los almacenes
        objInc['planets.' + i + '.resources.metal'] = Math.max(0, Math.min(this.player.planets[i].resourcesAdd.metal*timeLastUpdate/(1000*3600), almacen.metal - this.player.planets[i].resources.metal));
        objInc['planets.' + i + '.resources.crystal'] = Math.max(0, Math.min(this.player.planets[i].resourcesAdd.crystal*timeLastUpdate/(1000*3600), almacen.crystal - this.player.planets[i].resources.crystal));
        objInc['planets.' + i + '.resources.deuterium'] = Math.max(0, Math.min(this.player.planets[i].resourcesAdd.deuterium*timeLastUpdate/(1000*3600), almacen.deuterium - this.player.planets[i].resources.deuterium));
      }
      objSet.lastVisit = new Date().getTime();
      mongo.db(process.env.UNIVERSE_NAME).collection("jugadores").findOneAndUpdate({name: player}, {$set: objSet, $inc: objInc}, {returnOriginal: false}, (err, res) => {
        if(err) throw err;
        f(res.value);
      });
    }else{
      mongo.db(process.env.UNIVERSE_NAME).collection("jugadores").findOne({name: player}, (err, res) => {
        if(err) throw err;
        //tiene que hacer lo mismo que hace abajo pero en lugar de usar el objeto hhelp usar el res que encontro
        // se podria pasar todo a una sola funcion que le entre help o res dependiendo de lo que se nececite
        f();
      });


    }
  },
  createNewPlanet: function(cord, planetName, playerName, playerTypeNew) {
    var typePlanet = this.generateNewTypeOfPlanet(cord.pos, cord.system % 2);
    return {idPlanet: Math.pow(500,2)*cord.galaxy + 500*cord.system + cord.pos,
      coordinates: cord,
      coordinatesCod: cord.galaxy+'_'+cord.system,
      player: playerName,
      playerType: playerTypeNew,
      name: planetName, // maximo 23 caracteres
      type: typePlanet.type,
      color: typePlanet.color,
      temperature: typePlanet.temperature,
      temperatureNormal: typePlanet.temperature,
      camposMax: typePlanet.campos,
      campos: 0,
      buildingConstrucction: false,
      shipConstrucction: [],
      resources: {metal: 500, crystal: 500, deuterium: 0, energy: 0},
      resourcesAdd: {metal: 30*this.universo.speed, crystal: 15*this.universo.speed, deuterium: 0, energy: 0},
      resourcesPercentage: {metal: '10', crystal: '10', deuterium: '10', energy: '10'},
      buildings: {metalMine: 0, crystalMine: 0, deuteriumMine: 0, solarPlant: 0, fusionReactor: 0, metalStorage: 0, crystalStorage: 0, deuteriumStorage: 0, robotFactory: 0, shipyard: 0, researchLab: 0, alliance: 0, silo: 0, naniteFactory: 0, terraformer: 0},
      fleet: {lightFighter: 0, heavyFighter: 0, cruiser: 0, battleship: 0, battlecruiser: 0, bomber: 0, destroyer: 0, deathstar: 0, smallCargo: 0, largeCargo: 0, colony: 0, recycler: 0, espionageProbe: 0, solarSatellite: 0},
      defense: {rocketLauncher: 0, lightLaser: 0, heavyLaser: 0, gauss: 0, ion: 0, plasma: 0, smallShield: 0, largeShield: 0, antiballisticMissile: 0, interplanetaryMissile: 0},
      moon: {active: false, size: 0},
      debris: {active:false, metal:0, crystal: 0}
    };
  },
  createNewMoon: function(newSize){
    return {active: true,
      size: newSize,
      name: 'Luna',
      camposMax: 1,
      campos: 0,
      type: Math.floor(Math.random()*5)+1,
      resources: {metal: 0, crystal: 0, deuterium: 0, energy: 0},
      buildingConstrucction: false,
      buildings: {lunarBase: 0, phalanx: 0, spaceDock: 0, marketplace: 0, lunarSunshade: 0, lunarBeam: 0, jumpGate: 0, moonShield: 0},
      values: {sunshade: 10, beam: 10},
      fleet: {lightFighter: 0, heavyFighter: 0, cruiser: 0, battleship: 0, battlecruiser: 0, bomber: 0, destroyer: 0, deathstar: 0, smallCargo: 0, largeCargo: 0, colony: 0, recycler: 0, espionageProbe: 0, solarSatellite: 0}
    }
  },
  addNewPlayer: function(name, styleGame) {
    var newPlanet = exp.createNewPlanet(exp.newCord(), "Planeta Principal", name, 'activo');
    var newPlayer = {'name': name,
      'styleGame': styleGame,
      planets: [newPlanet],
      maxPlanets: 1,
      highscore: this.cantPlayers+1,//get la ultima position
      lastHighscore: this.cantPlayers+1,
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
      lastVisit: new Date().getTime(),
      type: "activo"// activo inactivo InactivoFuerte fuerte debil
    };
    this.cantPlayers++;//aumenta en uno la cantidad de jugadores del universo
    mongo.db(process.env.UNIVERSE_NAME).collection("jugadores").insertOne(newPlayer);//agrega al jugador a la lista de jugadores
  },
  newCord: function(rand = true) {
    for(let gal = this.comienzoBusquedaNewConrd ; gal<=9; gal++){
      for(let sys = 1 ; sys<=499; sys++){
        for(let p = 5 ; p<=10; p++){
          if(this.allCord[gal+'_'+sys+'_'+p] == undefined && ((Math.random() > 0.8) || rand == false)){
            let obj = {galaxy: gal, system: sys, pos: p};
            this.allCord[gal+'_'+sys+'_'+p] = obj;
            return obj;
          }
        }
      }
    }
    return this.newCord(false);
  },
  generateNewTypeOfPlanet: (pos, mod) => {
    let temp = 10, rango = 40, tipo = 1;
    if((mod == 0 && pos >= 14) || (mod == 1 && (pos == 6 || pos == 7))) tipo = 1; // Normal
    if((mod == 0 && pos <= 3) || (mod == 1 && (pos == 4 || pos == 5))) tipo = 2; // Dry
    if((mod == 0 && (pos == 6 || pos == 7)) || (mod == 1 && (pos == 8 || pos == 9))) tipo = 3; // Jungle
    if((mod == 0 && (pos == 8 || pos == 9)) || (mod == 1 && (pos == 10 || pos == 11))) tipo = 4; // Water
    if((mod == 0 && (pos == 12 || pos == 13)) || (mod == 1 && pos >= 14)) tipo = 5; // Gas
    if((mod == 0 && (pos == 10 || pos == 11)) || (mod == 1 && (pos == 12 || pos == 13))) tipo = 6; // Ice
    if(mod == 1 && (pos <= 3)) tipo = 7; // Desert
    rango = Math.floor(Math.random()*20+10);
    if(pos < 4){
      temp = Math.floor(exp.normalRandom(310-pos*50, 230-pos*50));// Cerca
    }else{
      if(pos > 12){
        temp = Math.floor(exp.normalRandom(165-pos*50, 125-pos*50));// Lejos
      }else{
        temp = Math.floor(exp.normalRandom(130-pos*10, 90-pos*10));// Medio
      }
    }
    return {type: tipo, color: Math.floor(Math.random()*10)+1, temperature: {max: temp+rango, min: temp-rango}, campos: Math.floor(exp.normalRandom(-0.022*Math.pow(pos,3)-0.73*Math.pow(pos,2)+17*pos+75, 0.056*Math.pow(pos,3)-3.12*Math.pow(pos,2)+36*pos+121))};
  },
  getActualBasicInfo: function(planet) {
    let list = [];
    let resourcesObj = (this.moon) ? this.player.planets[planet].moon.resources : this.player.planets[planet].resources;
    let classObj = {};
    let objStorage = this.getAlmacen(planet, this.moon);
    for(var i = 0 ; i<this.player.planets.length ; i++){
      list.push({name: this.player.planets[i].name, coordinates: this.player.planets[i].coordinates, type: this.player.planets[i].type, color: this.player.planets[i].color, moon: this.player.planets[i].moon});
    }
    if(resourcesObj.metal >= objStorage.metal){
      classObj.metal = 'overmark';// rojo
    }else{
      if(resourcesObj.metal >= objStorage.metal*4/5){
        classObj.metal = 'middlemark';// amarillo
      }else{
        classObj.metal = '';// normal
      }
    }
    if(resourcesObj.crystal >= objStorage.crystal){
      classObj.crystal = 'overmark';// rojo
    }else{
      if(resourcesObj.crystal >= objStorage.crystal*4/5){
        classObj.crystal = 'middlemark';// amarillo
      }else{
        classObj.crystal = '';// normal
      }
    }
    if(resourcesObj.deuterium >= objStorage.deuterium){
      classObj.deuterium = 'overmark';// rojo
    }else{
      if(resourcesObj.deuterium >= objStorage.deuterium*4/5){
        classObj.deuterium = 'middlemark';// amarillo
      }else{
        classObj.deuterium = '';// normal
      }
    }
    return {name: this.universo.name,
      speed: this.universo.speed,
      speedFleet: this.universo.speedFleet,
      donutGalaxy: (this.universo.donutGalaxy) ? 'true' : 'false',
      donutSystem: (this.universo.donutSystem) ? 'true' : 'false',
      playerName: this.player.name,
      highscore: this.player.highscore,
      resources: resourcesObj,
      add: this.player.planets[planet].resourcesAdd,
      dark: this.player.dark,
      messagesNoRead: this.player.messagesCant,
      classObjResources: classObj,
      cantPlanets: this.player.planets.length,
      maxPlanets: this.player.maxPlanets,
      numPlanet: planet,
      planets: list,
      moon: this.moon,
      format: this.formatNumber
    };
  },
  getAlmacen: function(planet, moon = false){
    let res = {};
    if(moon == true){
      res = {metal: 0, crystal: 0, deuterium: 0};
    }else{
      res = {metal: 5000*Math.floor(2.5*Math.pow(Math.E, 0.61*this.player.planets[planet].buildings.metalStorage)), crystal: 5000*Math.floor(2.5*Math.pow(Math.E, 0.61*this.player.planets[planet].buildings.crystalStorage)),deuterium: 5000*Math.floor(2.5*Math.pow(Math.E, 0.61*this.player.planets[planet].buildings.deuteriumStorage))};
    }
    return res;
  },
  resourcesSetting: function(planet) {
    let spd = this.universo.speed;
    let minas = this.player.planets[planet].buildings;
    let temp = (this.player.planets[planet].temperature.max + this.player.planets[planet].temperature.min)/2;
    let maxEnergyAux = {metal: Math.floor(parseInt(this.player.planets[planet].resourcesPercentage.metal)*minas.metalMine*Math.pow(1.1, minas.metalMine)), crystal: Math.floor(parseInt(this.player.planets[planet].resourcesPercentage.crystal)*minas.crystalMine*Math.pow(1.1, minas.crystalMine)), deuterium: Math.floor(2*parseInt(this.player.planets[planet].resourcesPercentage.deuterium)*minas.deuteriumMine*Math.pow(1.1, minas.deuteriumMine))};
    let auxEnergy = {solar: Math.floor(20*minas.solarPlant*Math.pow(1.1,minas.solarPlant)), fusion: Math.floor(3*minas.fusionReactor*parseInt(this.player.planets[planet].resourcesPercentage.energy)*Math.pow(1.05+0.01*this.player.research.energy, minas.fusionReactor)), fusionDeuterium: -Math.floor(minas.fusionReactor*parseInt(this.player.planets[planet].resourcesPercentage.energy)*Math.pow(1.1, minas.fusionReactor)), satillite: Math.floor((temp+160)/6)*this.player.planets[planet].fleet.solarSatellite};
    let energyTotal = auxEnergy.solar + auxEnergy.fusion + auxEnergy.satillite;
    let totalEnergyUsage = maxEnergyAux.metal + maxEnergyAux.crystal + maxEnergyAux.deuterium;
    let energyUsage = {metal: Math.floor((totalEnergyUsage == 0) ? 0 : (maxEnergyAux.metal*energyTotal)/totalEnergyUsage), crystal: Math.floor((totalEnergyUsage == 0) ? 0 : (maxEnergyAux.crystal*energyTotal)/totalEnergyUsage), deuterium: Math.floor((totalEnergyUsage == 0) ? 0 : (maxEnergyAux.deuterium*energyTotal)/totalEnergyUsage)};
    energyUsage = {metal: ((energyUsage.metal > maxEnergyAux.metal) ? maxEnergyAux.metal : energyUsage.metal), crystal: ((energyUsage.crystal > maxEnergyAux.crystal) ? maxEnergyAux.crystal : energyUsage.crystal), deuterium: ((energyUsage.deuterium > maxEnergyAux.deuterium) ? maxEnergyAux.deuterium : energyUsage.deuterium)};
    return {basic: {metal: 30*spd, crystal: 15*spd},
      values: this.player.planets[planet].resourcesPercentage,
      buildings: minas,
      solarSatelite: this.player.planets[planet].fleet.solarSatellite,
      mines: {metal: Math.floor(3*((isNaN(energyUsage.metal/maxEnergyAux.metal)) ? 0 : (energyUsage.metal/maxEnergyAux.metal))*spd*parseInt(this.player.planets[planet].resourcesPercentage.metal)*minas.metalMine*Math.pow(1.1, minas.metalMine)), crystal: Math.floor(2*((isNaN(energyUsage.crystal/maxEnergyAux.crystal)) ? 0 : (energyUsage.crystal/maxEnergyAux.crystal))*spd*parseInt(this.player.planets[planet].resourcesPercentage.crystal)*minas.crystalMine*Math.pow(1.1, minas.crystalMine)), deuterium: Math.floor(((isNaN(energyUsage.deuterium/maxEnergyAux.deuterium)) ? 0 : (energyUsage.deuterium/maxEnergyAux.deuterium))*spd*parseInt(this.player.planets[planet].resourcesPercentage.deuterium)*minas.deuteriumMine*Math.pow(1.1, minas.deuteriumMine)*(1.36-0.004*temp))},
      energy: auxEnergy,
      maxEnergy: maxEnergyAux,
      usageEnergy: energyUsage,
      resourcesHour: this.player.planets[planet].resourcesAdd,
      storage: {metal: 5000*Math.floor(2.5*Math.pow(Math.E, 0.61*minas.metalStorage)), crystal: 5000*Math.floor(2.5*Math.pow(Math.E, 0.61*minas.crystalStorage)),deuterium: 5000*Math.floor(2.5*Math.pow(Math.E, 0.61*minas.deuteriumStorage))},
      plasma: this.player.research.plasma}
  },
  moonSetting: function (planet) {
    cuanticMoonsCordAux = [];
    for(let i = 0 ; i<this.player.planets.length ; i++){
      if(this.player.planets[i].moon.active && this.player.planets[i].moon.buildings.jumpGate > 0) cuanticMoonsCordAux.push({name: this.player.planets[i].moon.name, cord: this.player.planets[i].coordinates, num: i});
    }
    return {buildings: this.player.planets[planet].moon.buildings,
      values: {sunshade: this.player.planets[planet].moon.values.sunshade, beam: this.player.planets[planet].moon.values.beam},
      fleets: this.player.planets[planet].moon.fleet,
      cuanticTime: (this.player.planets[planet].moon.buildings.jumpGate == 0) ? 'Infinity' : 100,//this.player.planets[planet].moon.cuanticTime //cambiar para que calcule cuanto falta para poder usar el salto cuantico
      cuanticMoonsCord: cuanticMoonsCordAux,
      campos: {campos: this.player.planets[planet].moon.campos, camposMax: this.player.planets[planet].moon.camposMax}
    };
  },
  overviewActualInfo: function (planet) {
    let camMax = (this.moon) ? this.player.planets[planet].moon.camposMax : this.player.planets[planet].camposMax;
    let cam = (this.moon) ? this.player.planets[planet].moon.campos : this.player.planets[planet].campos;
    return {diameter: (this.moon) ? this.player.planets[planet].moon.size + ' Km' : (camMax*66 + ' Km'),
      type: this.player.planets[planet].type,
      temperature: this.player.planets[planet].temperature,
      camposMax: camMax,
      campos: cam,
      cantPlayers: this.cantPlayers,
      points: this.formatNumber(this.player.puntos)
    };
  },
  buildingsActualInfo: function (planet) {
    let res;
    if(this.moon == true){
      console.log(this.player.planets[planet].moon);
      res = this.player.planets[planet].moon.buildings;
    }else{
      res = {buildings: this.player.planets[planet].buildings, solarSatellite: this.player.planets[planet].fleet.solarSatellite};
    }
    return res;
  },
  costBuildings: function (planet){
    let build = this.player.planets[planet].buildings;
    let energyAux = {metal: Math.floor(10*(build.metalMine+1)*Math.pow(1.1, (build.metalMine+1))), crystal: Math.floor(10*(build.crystalMine+1)*Math.pow(1.1, (build.crystalMine+1))), deuterium: Math.floor(20*(build.deuteriumMine+1)*Math.pow(1.1, (build.deuteriumMine+1)))}
    return {metalMine: {metal: Math.floor(60*Math.pow(1.5, build.metalMine)), crystal: Math.floor(15*Math.pow(1.5, build.metalMine)), deuterium: 0, energy: energyAux.metal, energyNeed: energyAux.metal-Math.floor(10*(build.metalMine)*Math.pow(1.1, (build.metalMine))), tech: true, level: build.metalMine, name: "Metal Mine", description: "Used in the extraction of metal ore, metal mines are of primary importance to all emerging and established empires."},
            crystalMine: {metal: Math.floor(48*Math.pow(1.6, build.crystalMine)), crystal: Math.floor(24*Math.pow(1.6, build.crystalMine)), deuterium: 0, energy: energyAux.crystal, energyNeed: energyAux.crystal-Math.floor(10*(build.crystalMine)*Math.pow(1.1, (build.crystalMine))), tech: true, level: build.crystalMine, name: "Crystal Mine", description: "Crystals are the main resource used to build electronic circuits and form certain alloy compounds."},
            deuteriumMine: {metal: Math.floor(225*Math.pow(1.5, build.deuteriumMine)), crystal: Math.floor(75*Math.pow(1.5, build.deuteriumMine)), deuterium: 0, energy: energyAux.deuterium, energyNeed: energyAux.deuterium-Math.floor(20*(build.deuteriumMine)*Math.pow(1.1, (build.deuteriumMine))), tech: true, level: build.deuteriumMine, name: "Deuterium Synthesizer", description: "Deuterium Synthesizers draw the trace Deuterium content from the water on a planet."},
            solarPlant: {metal: Math.floor(75*Math.pow(1.5, build.solarPlant)), crystal: Math.floor(30*Math.pow(1.5, build.solarPlant)), deuterium: 0, energy:  0, tech: true, level: build.solarPlant, name: "Solar Plant", description: "Solar power plants absorb energy from solar radiation. All mines need energy to operate."},
            fusionReactor: {metal: Math.floor(900*Math.pow(1.8, build.fusionReactor)), crystal: Math.floor(360*Math.pow(1.8, build.fusionReactor)), deuterium: Math.floor(180*Math.pow(1.8, build.fusionReactor)), energy: 0, tech: build.deuteriumMine >= 5 && this.player.research.energy >= 3, level: build.fusionReactor, name: "Fusion Reactor", description: "The fusion reactor uses deuterium to produce energy."},
            metalStorage: {metal: 1000*Math.pow(2, build.metalStorage), crystal: 0, deuterium: 0, energy: 0, tech: true, level: build.metalStorage, name: "Metal Storage", description: "Provides storage for excess metal."},
            crystalStorage: {metal: 1000*Math.pow(2, build.crystalStorage), crystal: 500*Math.pow(2, build.crystalStorage), deuterium: 0, energy: 0, tech: true, level: build.crystalStorage, name: "Crystal Storage", description: "Provides storage for excess crystal."},
            deuteriumStorage: {metal: 1000*Math.pow(2, build.deuteriumStorage), crystal: 1000*Math.pow(2, build.deuteriumStorage), deuterium: 0, energy: 0, tech: true, level: build.deuteriumStorage, name: "Deuterium Storage", description: "Giant tanks for storing newly-extracted deuterium."},
            robotFactory: {metal: 400*Math.pow(2, build.robotFactory), crystal: 120*Math.pow(2, build.robotFactory), deuterium: 200*Math.pow(2, build.robotFactory), energy: 0, tech: true, level: build.robotFactory, name: "Robotics Factory", description: "Robotic factories provide construction robots to aid in the construction of buildings. Each level increases the speed of the upgrade of buildings."},
            shipyard: {metal: 400*Math.pow(2, build.shipyard), crystal: 200*Math.pow(2, build.shipyard), deuterium: 100*Math.pow(2, build.shipyard), energy: 0, tech: build.robotFactory >= 2, level: build.shipyard, name: "Shipyard", description: "All types of ships and defensive facilities are built in the planetary shipyard."},
            researchLab: {metal: 200*Math.pow(2, build.researchLab), crystal: 400*Math.pow(2, build.researchLab), deuterium: 200*Math.pow(2, build.researchLab), energy: 0, tech: true, level: build.researchLab, name: "Research Lab", description: "A research lab is required in order to conduct research into new technologies."},
            alliance: {metal: 20000*Math.pow(2, build.alliance), crystal: 40000*Math.pow(2, build.alliance), deuterium: 0, energy: 0, tech: true, level: build.alliance, name: "Alliance Depot", description: "The alliance depot supplies fuel to friendly fleets in orbit helping with defence."},
            silo: {metal: 20000*Math.pow(2, build.silo), crystal: 20000*Math.pow(2, build.silo), deuterium: 1000*Math.pow(2, build.silo), energy: 0, tech: build.shipyard >= 1, level: build.silo, name: "Silo", description: "Missile silos are used to store missiles."},
            naniteFactory: {metal: 1000000*Math.pow(2, build.naniteFactory), crystal: 500000*Math.pow(2, build.naniteFactory), deuterium: 100000*Math.pow(2, build.naniteFactory), energy: 0, tech: build.robotFactory >= 10 && this.player.research.computer >= 10, level: build.naniteFactory, name: "Nanite Factory", description: "This is the ultimate in robotics technology. Each level cuts the construction time for buildings, ships, and defences."},
            terraformer: {metal: 0, crystal: 50000*Math.pow(2, build.terraformer), deuterium: 100000*Math.pow(2, build.terraformer), energy: 1000*Math.pow(2, build.terraformer), tech: build.naniteFactory >= 1 && this.player.research.energy >= 12, level: build.terraformer, name: "Terraformer", description: "The terraformer increases the usable surface of planets."},
            solarSatellite: {metal: 0, crystal: 2000, deuterium: 500, energy: 0, tech: build.shipyard >= 1, level: this.player.planets[planet].fleet.solarSatellite, name: "Solar Satellite", description: "Solar satellites are simple platforms of solar cells, located in a high, stationary orbit. A solar satellite produces " + Math.floor(((this.player.planets[planet].temperature.max + this.player.planets[planet].temperature.min)/2+160)/6) + " energy on this planet."},
            listInfo: ["metalMine", "crystalMine", "deuteriumMine", "solarPlant", "fusionReactor", "solarSatellite", "metalStorage", "crystalStorage", "deuteriumStorage", "robotFactory", "shipyard", "researchLab", "alliance", "silo", "naniteFactory", "terraformer"],
            time: {mult: build.robotFactory, elev: build.naniteFactory},
            doing: this.player.planets[planet].buildingConstrucction
    };
  },
  costMoon: function (planet){
    let build = this.player.planets[planet].moon.buildings;
    let research = this.player.research;
    return {lunarBase: {metal: 10000*Math.pow(2, build.lunarBase), crystal: 20000*Math.pow(2, build.lunarBase), deuterium: 10000*Math.pow(2, build.lunarBase), energy: 0, tech: true, level: build.lunarBase, name: "Lunar Base", description: "Since the moon has no atmosphere, a lunar base is required to generate habitable space."},
            phalanx: {metal: 20000*Math.pow(2, build.phalanx), crystal: 40000*Math.pow(2, build.phalanx), deuterium: 20000*Math.pow(2, build.phalanx), energy: 0, tech: build.lunarBase >= 3, level: build.phalanx, name: "Phalanx", description: "Using the sensor phalanx, fleets of other empires can be discovered and observed. The bigger the sensor phalanx array, the larger the range it can scan."},
            spaceDock: {metal: 200*Math.pow(4, build.spaceDock), crystal: 10*Math.pow(3, build.spaceDock), deuterium: 50*Math.pow(5, build.spaceDock), energy: 0, tech: build.lunarBase >= 1, level: build.spaceDock, name: "Space Dock", description: "Wreckages can be repaired in the Space Dock."},
            marketplace: {metal: 6000000*Math.pow(2, build.marketplace), crystal: 4000000*Math.pow(2, build.marketplace), deuterium: 2000000*Math.pow(2, build.marketplace), energy: 0, tech: build.lunarBase >= 2 && research.computer >= 3, level: build.marketplace, name: "Marketplace", description: "The place for change resources with other empires, recolectors or even mysterious and dangerous people."},
            lunarSunshade: {metal: 15000*Math.pow(2, build.lunarSunshade), crystal: 0, deuterium: 50000*Math.pow(2, build.lunarSunshade), energy: 0, tech: build.lunarBase >= 1 && research.laser >= 12, level: build.lunarSunshade, name: "Lunar Sunshade", description: "The system that get cold your planet. For each level you can reduce 3 degrees the minimun temperature from your planet, growing up the deuterium producction but getting worse the energy levels."},
            lunarBeam: {metal: 0, crystal: 75000*Math.pow(2, build.lunarBeam), deuterium: 90000*Math.pow(2, build.lunarBeam), energy: 0, tech: build.lunarBase >= 1 && research.ion >= 12, level: build.lunarBeam, name: "Lunar Beam", description: "The system that warn your planet. For each level you can reduce 3 degrees the maximun temperature from your planet. The solar satellites will improve the energy."},
            jumpGate: {metal: 2000000*Math.pow(2, build.jumpGate), crystal: 4000000*Math.pow(2, build.jumpGate), deuterium: 2000000*Math.pow(2, build.jumpGate), energy: 0, tech: build.lunarBase >= 1 && research.hyperspace >= 7, level: build.jumpGate, name: "Jump Gate", description: "Jump gates are huge transceivers capable of sending even the biggest fleet in no time to a distant jump gate."},
            moonShield: {metal: 9000000*Math.pow(3, build.moonShield), crystal: 5000000*Math.pow(3, build.moonShield), deuterium: 2000000*Math.pow(3, build.moonShield), energy: 0, tech: build.lunarBase >= 4 && research.graviton >= 1 && research.shielding >= 12, level: build.moonShield, name: "Moon Shield", description: "The ultimate defense system. Even the deadstars be afraid of the shield."},
            listInfo: ["lunarBase", "phalanx", "spaceDock", "marketplace", "lunarSunshade", "lunarBeam", "jumpGate", "moonShield"],
            time: {mult: build.lunarBase, elev: this.player.planets[planet].buildings.naniteFactory},
            doing: this.player.planets[planet].moon.buildingConstrucction
    };
  },
  costResearch: function (planet){
    let research = this.player.research;
    let lab = this.player.planets[planet].buildings.researchLab;
    return {energy: {metal: 0, crystal: 800*Math.pow(2, research.energy), deuterium: 400*Math.pow(2, research.energy), energy: 0, tech: lab >= 1, level: research.energy, name: "Energy Technology", description: "The command of different types of energy is necessary for many new technologies."},
            laser: {metal: 200*Math.pow(2, research.laser), crystal: 100*Math.pow(2, research.laser), deuterium: 0, energy: 0, tech: lab >= 1 && research.energy >= 2, level: research.laser, name: "Laser Technology", description: "Focusing light produces a beam that causes damage when it strikes an object."},
            ion: {metal: 1000*Math.pow(2, research.ion), crystal: 300*Math.pow(2, research.ion), deuterium: 100*Math.pow(2, research.ion), energy: 0, tech: lab >= 4 && research.energy >= 4  && research.laser >= 5, level: research.ion, name: "Ion Technology", description: "The concentration of ions allows for the construction of cannons, which can inflict enormous damage."},
            hyperspace: {metal: 0, crystal: 4000*Math.pow(2, research.hyperspace), deuterium: 2000*Math.pow(2, research.hyperspace), energy: 0, tech: lab >= 7 && research.energy >= 5 && research.shielding >= 5, level: research.hyperspace, name: "Hyperspace Technology", description: "By integrating the 4th and 5th dimensions it is now possible to research a new kind of drive that is more economical and efficient."},
            plasma: {metal: 2000*Math.pow(2, research.plasma), crystal: 4000*Math.pow(2, research.plasma), deuterium: 1000*Math.pow(2, research.plasma), energy: 0, tech: lab >= 4 && research.energy >= 8 && research.laser >= 10 && research.ion >= 5, level: research.plasma, name: "Plasma Technology", description: "A further development of ion technology which accelerates high-energy plasma, which then inflicts devastating damage and additionally optimises the production of resources."},
            espionage: {metal: 200*Math.pow(2, research.espionage), crystal: 1000*Math.pow(2, research.espionage), deuterium: 200*Math.pow(2, research.espionage), energy: 0, tech: lab >= 3, level: research.espionage, name: "Espionage Technology", description: "Information about other planets and moons can be gained using this technology."},
            computer: {metal: 0, crystal: 400*Math.pow(2, research.computer), deuterium: 600*Math.pow(2, research.computer), energy: 0, tech: lab >= 1, level: research.computer, name: "Computer Technology", description: "More fleets can be commanded by increasing computer capacities. Each level of computer technology increases the maximum number of fleets by one."},
            astrophysics: {metal: 4000*Math.pow(2, research.astrophysics), crystal: 8000*Math.pow(2, research.astrophysics), deuterium: 4000*Math.pow(2, research.astrophysics), energy: 0, tech: lab >= 3 && research.spionage >= 4 && research.impulse >= 3, level: research.astrophysics, name: "Astrophysics", description: "With an astrophysics research module, ships can undertake long expeditions. Every second level of this technology will allow you to colonise an extra planet."},
            intergalactic: {metal: 240000*Math.pow(2, research.intergalactic), crystal: 400000*Math.pow(2, research.intergalactic), deuterium: 160000*Math.pow(2, research.intergalactic), energy: 0, tech: lab >= 10 && research.computer >= 8 && research.hyperspace >= 8, level: research.intergalactic, name: "Intergalactic Research Network", description: "Researchers on different planets communicate via this network."},
            graviton: {metal: 0, crystal: 0, deuterium: 0, energy: 300000*Math.pow(2, research.graviton), tech: lab >= 12, level: research.graviton, name: "Graviton Technology", description: "Firing a concentrated charge of graviton particles can create an artificial gravity field, which can destroy ships or even moons."},
            combustion: {metal: 400*Math.pow(2, research.combustion), crystal: 0, deuterium: 600*Math.pow(2, research.combustion), energy: 0, tech: lab >= 1 && research.energy >= 1, level: research.combustion, name: "Combustion Drive", description: "The development of this drive makes some ships faster, although each level increases speed by only 10 % of the base value."},
            impulse: {metal: 2000*Math.pow(2, research.impulse), crystal: 4000*Math.pow(2, research.impulse), deuterium: 600*Math.pow(2, research.impulse), energy: 0, tech: lab >= 2 && research.energy >= 2, level: research.impulse, name: "Impulse Drive", description: "The impulse drive is based on the reaction principle. Further development of this drive makes some ships faster, although each level increases speed by only 20 % of the base value."},
            hyperspace_drive: {metal: 10000*Math.pow(2, research.hyperspace_drive), crystal: 20000*Math.pow(2, research.hyperspace_drive), deuterium: 6000*Math.pow(2, research.hyperspace_drive), energy: 0, tech: lab >= 7 && research.hyperspace >= 3, level: research.hyperspace, name: "Hyperspace Drive", description: "Hyperspace drive warps space around a ship. The development of this drive makes some ships faster, although each level increases speed by only 30 % of the base value."},
            weapons: {metal: 800*Math.pow(2, research.weapons), crystal: 200*Math.pow(2, research.weapons), deuterium: 0, energy: 0, tech: lab >= 4, level: research.weapons, name: "Weapons Technology", description: "Weapons technology makes weapons systems more efficient. Each level of weapons technology increases the weapon strength of units by 10 % of the base value."},
            shielding: {metal: 200*Math.pow(2, research.shielding), crystal: 600*Math.pow(2, research.shielding), deuterium: 0, energy: 0, tech: lab >= 6 && research.energy >= 3, level: research.shielding, name: "Shielding Technology", description: "Shielding technology makes the shields on ships and defensive facilities more efficient. Each level of shield technology increases the strength of the shields by 10 % of the base value."},
            armour: {metal: 1000*Math.pow(2, research.armour), crystal: 0, deuterium: 0, energy: 0, tech: lab >= 2, level: research.armour, name: "Armour Technology", description: "Special alloys improve the armour on ships and defensive structures. The effectiveness of the armour can be increased by 10 % per level."},
            listInfo: ["energy", "laser", "ion", "hyperspace", "plasma", "combustion", "impulse", "hyperspace_drive", "espionage", "computer", "astrophysics", "intergalactic", "graviton", "weapons", "shielding", "armour"],
            time: {mult: lab, elev: research.intergalactic},
            doing: this.player.researchConstrucction
    };
  },
  costShipyard: function(planet){
    let fleet = (this.moon) ? this.player.planets[planet].moon.fleet : this.player.planets[planet].fleet;
    let research = this.player.research;
    let yard = this.player.planets[planet].buildings.shipyard;
    return {lightFighter: {metal: 3000, crystal: 1000, deuterium: 0, energy: 0, tech: yard >= 1 && research.combustion >= 1, level: fleet.lightFighter, name: "Light Fighter", description: "This is the first fighting ship all emperors will build. The light fighter is an agile ship, but vulnerable on its own. In mass numbers, they can become a great threat to any empire. They are the first to accompany small and large cargoes to hostile planets with minor defences."},
            heavyFighter: {metal: 6000, crystal: 4000, deuterium: 0, energy: 0, tech: yard >= 3 && research.impulse >= 2, level: fleet.heavyFighter, name: "Heavy Fighter", description: "This fighter is better armoured and has a higher attack strength than the light fighter."},
            cruiser: {metal: 2000, crystal: 7000, deuterium: 2000, energy: 0, tech: yard >= 5 && research.impulse >= 4 && research.ion >= 2, level: fleet.cruiser, name: "Cruiser", description: "Cruisers are armoured almost three times as heavily as heavy fighters and have more than twice the firepower. In addition, they are very fast."},
            battleship: {metal: 45000, crystal: 15000, deuterium: 0, energy: 0, tech: yard >= 7 && research.hyperspace_drive >= 4, level: fleet.battleship, name: "Battleship", description: "Battleships form the backbone of a fleet. Their heavy cannons, high speed, and large cargo holds make them opponents to be taken seriously."},
            battlecruiser: {metal: 30000, crystal: 40000, deuterium: 15000, energy: 0, tech: yard >= 8 && research.hyperspace_drive >= 5 && research.laser >= 12 && research.hyperspace >= 5, level: fleet.battlecruiser, name: "Battlecruiser", description: "The Battlecruiser is highly specialized in the interception of hostile fleets."},
            bomber: {metal: 50000, crystal: 25000, deuterium: 15000, energy: 0, tech: yard >= 8 && research.impulse >= 6 && research.plasma >= 5, level: fleet.bomber, name: "Bomber", description: "The bomber was developed especially to destroy the planetary defences of a world."},
            destroyer: {metal: 60000, crystal: 50000, deuterium: 15000, energy: 0, tech: yard >= 9 && research.hyperspace_drive >= 6 && research.hyperspace >= 5, level: fleet.destroyer, name: "Destroyer", description: "The destroyer is the king of the warships."},
            deathstar: {metal: 5000000, crystal: 4000000, deuterium: 1000000, energy: 0, tech: yard >= 12 && research.hyperspace_drive >= 7 && research.graviton >= 1 && research.hyperspace >= 6, level: fleet.deathstar, name: "Deathstar", description: "The destructive power of the deathstar is unsurpassed."},
            smallCargo: {metal: 2000, crystal: 2000, deuterium: 0, energy: 0, tech: yard >= 2 && research.combustion >= 2, level: fleet.smallCargo, name: "Small Cargo", description: "The small cargo is an agile ship which can quickly transport resources to other planets."},
            largeCargo: {metal: 6000, crystal: 6000, deuterium: 0, energy: 0, tech: yard >= 4 && research.combustion >= 6, level: fleet.largeCargo, name: "Large Cargo", description: "This cargo ship has a much larger cargo capacity than the small cargo, and is generally faster thanks to an improved drive."},
            colony: {metal: 10000, crystal: 20000, deuterium: 10000, energy: 0, tech: yard >= 4 && research.impulse >= 3, level: fleet.colony, name: "Colony Ship", description: "Vacant planets can be colonised with this ship."},
            recycler: {metal: 10000, crystal: 6000, deuterium: 2000, energy: 0, tech: yard >= 4 && research.impulse >= 6 && research.shielding >= 2, level: fleet.recycler, name: "Recycler", description: "Recyclers are the only ships able to harvest debris fields floating in a planet`s orbit after combat."},
            espionageProbe: {metal: 0, crystal: 1000, deuterium: 0, energy: 0, tech: yard >= 3 && research.combustion >= 3 && research.espionage >= 2, level: fleet.espionageProbe, name: "Espionage Probe", description: "Espionage probes are small, agile drones that provide data on fleets and planets over great distances."},
            solarSatellite: {metal: 0, crystal: 2000, deuterium: 500, energy: 0, tech: yard >= 1, level: fleet.solarSatellite, name: "Solar Satellite", description: "Solar satellites are simple platforms of solar cells, located in a high, stationary orbit. A solar satellite produces " + Math.floor(((this.player.planets[planet].temperature.max + this.player.planets[planet].temperature.min)/2+160)/6) + " energy on this planet."},
            listInfo: ["lightFighter", "heavyFighter", "cruiser", "battleship", "battlecruiser", "bomber", "destroyer", "deathstar", "smallCargo", "largeCargo", "colony", "recycler", "espionageProbe", "solarSatellite"],
            time: {mult: yard, elev: this.player.planets[planet].buildings.naniteFactory},
            doing: this.player.planets[planet].shipConstrucction
    };
  },
  costDefense: function(planet){
    let defense = this.player.planets[planet].defense;
    let research = this.player.research;
    let yard = this.player.planets[planet].buildings.shipyard;
    return {rocketLauncher: {metal: 2000, crystal: 0, deuterium: 0, energy: 0, tech: yard >= 1, level: defense.rocketLauncher, name: "Rocket Launcher", description: "The rocket launcher is a simple, cost-effective defensive option."},
            lightLaser: {metal: 1500, crystal: 500, deuterium: 0, energy: 0, tech: yard >= 2 && research.laser >= 3, level: defense.lightLaser, name: "Light Laser", description: "Concentrated firing at a target with photons can produce significantly greater damage than standard ballistic weapons."},
            heavyLaser: {metal: 6000, crystal: 2000, deuterium: 0, energy: 0, tech: yard >= 4 && research.laser >= 6 && research.energy >= 3, level: defense.heavyLaser, name: "Heavy Laser", description: "The heavy laser is the logical development of the light laser."},
            gauss: {metal: 20000, crystal: 15000, deuterium: 0, energy: 0, tech: yard >= 6 && research.weapons >= 3 && research.energy >= 6 && research.shielding >= 1, level: defense.gauss, name: "Gauss Cannon", description: "The Gauss Cannon fires projectiles weighing tons at high speeds."},
            ion: {metal: 2000, crystal: 6000, deuterium: 0, energy: 0, tech: yard >= 4 && research.ion >= 4, level: defense.ion, name: "Ion Cannon", description: "The Ion Cannon fires a continuous beam of accelerating ions, causing considerable damage to objects it strikes."},
            plasma: {metal: 50000, crystal: 50000, deuterium: 30000, energy: 0, tech: yard >= 8 && research.plasma >= 7, level: defense.plasma, name: "Plasma Turret", description: "Plasma Turrets release the energy of a solar flare and surpass even the destroyer in destructive effect."},
            smallShield: {metal: 10000, crystal: 10000, deuterium: 0, energy: 0, tech: yard >= 1 && research.shielding >= 2, level: defense.smallShield, name: "Small Shield Dome", description: "The small shield dome covers an entire planet with a field which can absorb a tremendous amount of energy."},
            largeShield: {metal: 50000, crystal: 50000, deuterium: 0, energy: 0, tech: yard >= 6 && research.shielding >= 6, level: defense.largeShield, name: "Large Shield Dome", description: "The evolution of the small shield dome can employ significantly more energy to withstand attacks."},
            antiballisticMissile: {metal: 8000, crystal: 0, deuterium: 2000, energy: 0, tech: this.player.planets[planet].buildings.silo >= 2, level: defense.antiballisticMissile, name: "Anti-Ballistic Missiles", description: "Anti-Ballistic Missiles destroy attacking interplanetary missiles"},
            interplanetaryMissile: {metal: 12500, crystal: 2500, deuterium: 10000, energy: 0, tech: this.player.planets[planet].buildings.silo >= 4 && research.impulse >= 1 , level: defense.interplanetaryMissile, name: "Interplanetary Missiles", description: "Anti-Ballistic Missiles destroy attacking interplanetary missiles"},
            listInfo: ["rocketLauncher", "lightLaser", "heavyLaser", "gauss", "ion", "plasma", "smallShield", "largeShield", "antiballisticMissile", "interplanetaryMissile"],
            time: {mult: yard, elev: this.player.planets[planet].buildings.naniteFactory},
            doing: this.player.planets[planet].shipConstrucction
    };
  },
  fleetInfo: function(planet, moon){
    return {fleets: (moon) ? this.player.planets[planet].moon.fleet : this.player.planets[planet].fleet,
            speed: this.getListSpeed(),
            misil: (moon) ? 0 : this.player.planets[planet].defense.interplanetaryMissile,
            expeditions: 0, //es la cantidad de expediciones realizadas en ese momento
            maxExpeditions: Math.floor(Math.sqrt(this.player.research.astrophysics)),
            slot: 0, //es la cantidad de flotas volando (Cambiar)
            maxSlot: this.player.research.computer + 1
    };
  },
  galaxyInfo: function(planet){
    return {espionage: this.player.planets[planet].fleet.espionageProbe,
            recycler: this.player.planets[planet].fleet.recycler,
            misil: this.player.planets[planet].defense.interplanetaryMissile,
            slot: 0, //es la cantidad de flotas volando (Cambiar)
            maxSlot: this.player.research.computer + 1
    };
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
          respuesta['pos' + pos] = {active: true, player: doc.name, type: doc.planets[i].type, color: doc.planets[i].color, name: doc.planets[i].name, moon: doc.planets[i].moon.active, moonName: doc.planets[i].moon.name, moonSize: doc.planets[i].moon.size, debris: doc.planets[i].debris.active, metalDebris: doc.planets[i].debris.metal, crystalDebris: doc.planets[i].debris.crystal, estado: "activo"};
        }
      }
    }, () => {
      res.send(respuesta);
    });
  },
  getListSpeed: function(){
    let com = this.player.research.combustion;
    let imp = this.player.research.impulse;
    let hyp = this.player.research.hyperspace_drive;
    let bomb = (hyp >= 8) ? 1200*hyp : 800*imp;
    let tran = (imp >= 5) ? 1000*imp : 500*com;
    return [12500+1250*com, 10000+2000*imp, 15000+3000*imp, 10000+3000*hyp, 10000+3000*hyp, 4000+bomb, 5000+1500*hyp, 100+30*hyp, 5000+tran, 7500+1500*imp, 2500+500*imp, 2000+400*imp, 100000000+10000000*com, 1000000+100000*imp];
  },
  getQuickAtackData: function(){
    return {esp: this.player.sendEspionage, small: this.player.sendSmall, large: this.player.sendLarge};
  },
  setOptions: function(res, esp, small, large){
    if(isFinite(esp) && isFinite(small) && isFinite(large)){
      mongo.db(process.env.UNIVERSE_NAME).collection("jugadores").updateOne({name: this.player.name}, {$set: {sendEspionage: esp, sendSmall: small, sendLarge: large}}, (err) => {
        res.send({ok: (err == null) ? true : err});
      });
    }else{
      res.send({ok: false});
    }
  },
  searchPlayer: function(res, playerName){
    mongo.db(process.env.UNIVERSE_NAME).collection("jugadores").findOne({name: playerName}, (err, obj) => {
      if(err) throw err;
      if(obj == null){
        res.send({ok: false, reason: "not found"});
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
    if(elimino == false){
      this.player.vacas.push({coordinates:{galaxy: query.coor.galaxy, system: query.coor.system, pos: query.coor.pos}, playerName: query.playerName, planetName: query.planetName, estado: query.estado});
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
      let objPrice = this.costBuildings(planet);
      if(objPrice[buildingName].metal <= this.player.planets[planet].resources.metal && objPrice[buildingName].crystal <= this.player.planets[planet].resources.crystal && objPrice[buildingName].deuterium <= this.player.planets[planet].resources.deuterium && objPrice[buildingName].tech && (buildingName != 'terraformer'|| objPrice[buildingName].energy <= this.player.planets[planet].resourcesAdd.energy) && (buildingName == 'terraformer'|| this.player.planets[planet].campos+1 < this.player.planets[planet].camposMax)){
        let buildingConstrucctionAux = {};
        let buildingConstrucction = {};
        let objInc = {};
        buildingConstrucctionAux.metal = objPrice[buildingName].metal;
        buildingConstrucctionAux.crystal = objPrice[buildingName].crystal;
        buildingConstrucctionAux.deuterium = objPrice[buildingName].deuterium;
        buildingConstrucctionAux.item = buildingName;
        buildingConstrucctionAux.init = new Date().getTime();
        buildingConstrucctionAux.time = this.timeBuild(objPrice[buildingName].metal + objPrice[buildingName].crystal, objPrice.time.mult, objPrice.time.elev);
        buildingConstrucction['planets.' + planet + '.buildingConstrucction'] = buildingConstrucctionAux;
        this.player.planets[planet].buildingConstrucction = buildingConstrucctionAux;
        objInc['planets.' + planet + '.resources.metal'] = -objPrice[buildingName].metal;
        objInc['planets.' + planet + '.resources.crystal'] = -objPrice[buildingName].crystal;
        objInc['planets.' + planet + '.resources.deuterium'] = -objPrice[buildingName].deuterium;
        mongo.db(process.env.UNIVERSE_NAME).collection("jugadores").updateOne({name: this.player.name}, {$set: buildingConstrucction, $inc: objInc}, (err, result) => {
          if(err) throw err;
          res.send({ok: true})
        });
      }else{
        res.send({ok: false});
      }
    }else{
      res.send({ok: false});
    }
  },
  proccesMoonRequest: function(planet, buildingName, res){
    if(this.player.planets[planet].moon.buildingConstrucction == false){
      let objPrice = this.costMoon(planet);
      if(objPrice[buildingName].metal <= this.player.planets[planet].moon.resources.metal && objPrice[buildingName].crystal <= this.player.planets[planet].moon.resources.crystal && objPrice[buildingName].deuterium <= this.player.planets[planet].moon.resources.deuterium && objPrice[buildingName].tech && (buildingName == 'lunarBase'|| this.player.planets[planet].moon.campos+1 < this.player.planets[planet].moon.camposMax)){
        let buildingConstrucctionAux = {};
        let buildingConstrucction = {};
        let objInc = {};
        buildingConstrucctionAux.metal = objPrice[buildingName].metal;
        buildingConstrucctionAux.crystal = objPrice[buildingName].crystal;
        buildingConstrucctionAux.deuterium = objPrice[buildingName].deuterium;
        buildingConstrucctionAux.item = buildingName;
        buildingConstrucctionAux.init = new Date().getTime();
        buildingConstrucctionAux.time = this.timeBuild(objPrice[buildingName].metal + objPrice[buildingName].crystal, objPrice.time.mult, objPrice.time.elev);
        buildingConstrucction['planets.' + planet + '.moon.buildingConstrucction'] = buildingConstrucctionAux;
        this.player.planets[planet].buildingConstrucction = buildingConstrucctionAux;
        objInc['planets.' + planet + '.moon.resources.metal'] = -objPrice[buildingName].metal;
        objInc['planets.' + planet + '.moon.resources.crystal'] = -objPrice[buildingName].crystal;
        objInc['planets.' + planet + '.moon.resources.deuterium'] = -objPrice[buildingName].deuterium;
        mongo.db(process.env.UNIVERSE_NAME).collection("jugadores").updateOne({name: this.player.name}, {$set: buildingConstrucction, $inc: objInc}, (err, result) => {
          if(err) throw err;
          res.send({ok: true})
        });
      }else{
        res.send({ok: false});
      }
    }else{
      res.send({ok: false});
    }
  },
  proccesResearchRequest: function(planet, researchName, res){
    if(this.player.researchConstrucction == false){
      let objPrice = this.costResearch(planet);
      if(objPrice[researchName].metal <= this.player.planets[planet].resources.metal && objPrice[researchName].crystal <= this.player.planets[planet].resources.crystal && objPrice[researchName].deuterium <= this.player.planets[planet].resources.deuterium && objPrice[researchName].energy <= this.player.planets[planet].resourcesAdd.energy && objPrice[researchName].tech == true){
        let researchConstrucctionAux = {};
        let researchConstrucction = {};
        let objInc = {};
        researchConstrucctionAux.metal = objPrice[researchName].metal;
        researchConstrucctionAux.crystal = objPrice[researchName].crystal;
        researchConstrucctionAux.deuterium = objPrice[researchName].deuterium;
        researchConstrucctionAux.item = researchName;
        researchConstrucctionAux.planet = planet;
        researchConstrucctionAux.init = new Date().getTime();
        researchConstrucctionAux.time = this.timeBuild(objPrice[researchName].metal + objPrice[researchName].crystal, objPrice.time.mult, objPrice.time.elev);
        researchConstrucction['researchConstrucction'] = researchConstrucctionAux;
        this.player.researchConstrucction = researchConstrucctionAux;
        objInc['planets.' + planet + '.resources.metal'] = -objPrice[researchName].metal;
        objInc['planets.' + planet + '.resources.crystal'] = -objPrice[researchName].crystal;
        objInc['planets.' + planet + '.resources.deuterium'] = -objPrice[researchName].deuterium;
        mongo.db(process.env.UNIVERSE_NAME).collection("jugadores").updateOne({name: this.player.name}, {$set: researchConstrucction, $inc: objInc}, (err, result) => {
          if(err) throw err;
          res.send({ok: true})
        });
      }else{
        res.send({ok: false});
      }
    }else{
      res.send({ok: false});
    }
  },
  proccesShipyardRequest: function(planet, shipyardName, shipyardCant, res){
    shipyardCant = parseInt(shipyardCant);
    if(this.validInt(shipyardCant) && shipyardCant > 0){
      let objPrice = {...this.costShipyard(planet), ...this.costDefense(planet)};
      if(objPrice[shipyardName].metal*shipyardCant <= this.player.planets[planet].resources.metal && objPrice[shipyardName].crystal*shipyardCant <= this.player.planets[planet].resources.crystal && objPrice[shipyardName].deuterium*shipyardCant <= this.player.planets[planet].resources.deuterium && objPrice[shipyardName].tech == true){
        let shipyardConstrucctionAux = {};
        let shipyardConstrucction = {};
        let objInc = {};
        let def = false;
        shipyardConstrucctionAux.cant = shipyardCant;
        shipyardConstrucctionAux.metal = objPrice[shipyardName].metal*shipyardCant;
        shipyardConstrucctionAux.crystal = objPrice[shipyardName].crystal*shipyardCant;
        shipyardConstrucctionAux.deuterium = objPrice[shipyardName].deuterium*shipyardCant;
        shipyardConstrucctionAux.metalOne = objPrice[shipyardName].metal;
        shipyardConstrucctionAux.crystalOne = objPrice[shipyardName].crystal;
        shipyardConstrucctionAux.deuteriumOne = objPrice[shipyardName].deuterium;
        shipyardConstrucctionAux.name = objPrice[shipyardName].name;
        shipyardConstrucctionAux.item = shipyardName;
        shipyardConstrucctionAux.new = true;
        shipyardConstrucctionAux.init = new Date().getTime();
        shipyardConstrucctionAux.time = this.timeBuild(objPrice[shipyardName].metal + objPrice[shipyardName].crystal, objPrice.time.mult, objPrice.time.elev);
        shipyardConstrucctionAux.timeNow = shipyardConstrucctionAux.time;
        for(let i = 0 ; i<objPrice.listInfo.length && !def ; i++){
          if(objPrice.listInfo[i] == shipyardName) def = true;
        }
        shipyardConstrucctionAux.def = def;
        shipyardConstrucction['planets.' + planet + '.shipConstrucction'] = shipyardConstrucctionAux;
        this.player.planets[planet].shipConstrucction.push(shipyardConstrucctionAux);
        objInc['planets.' + planet + '.resources.metal'] = -objPrice[shipyardName].metal*shipyardCant;
        objInc['planets.' + planet + '.resources.crystal'] = -objPrice[shipyardName].crystal*shipyardCant;
        objInc['planets.' + planet + '.resources.deuterium'] = -objPrice[shipyardName].deuterium*shipyardCant;
        mongo.db(process.env.UNIVERSE_NAME).collection("jugadores").updateOne({name: this.player.name}, {$push: shipyardConstrucction, $inc: objInc}, (err, result) => {
          if(err) throw err;
          res.send({ok: true})
        });
      }else{
        res.send({ok: false});
      }
    }else{
      res.send({ok: false});
    }
  },
  cancelBuildRequest: function(planet, res){
    if(this.player.planets[planet].buildingConstrucction != false){
      let objSet = {};
      let objInc = {};
      objSet['planets.' + planet + '.buildingConstrucction'] = false;
      objInc['planets.' + planet + '.resources.metal'] = this.player.planets[planet].buildingConstrucction.metal;
      objInc['planets.' + planet + '.resources.crystal'] = this.player.planets[planet].buildingConstrucction.crystal;
      objInc['planets.' + planet + '.resources.deuterium'] = this.player.planets[planet].buildingConstrucction.deuterium;
      mongo.db(process.env.UNIVERSE_NAME).collection("jugadores").updateOne({name: this.player.name}, {$set: objSet, $inc: objInc}, (err, result) => {
        if(err) throw err;
        res.send({ok: true});
      });
    }else{
      res.send({ok: false});
    }
  },
  cancelMoonRequest: function(planet, res){
    if(this.player.planets[planet].moon.active == true && this.player.planets[planet].moon.buildingConstrucction != false){
      let objSet = {};
      let objInc = {};
      objSet['planets.' + planet + '.moon.buildingConstrucction'] = false;
      objInc['planets.' + planet + '.moon.resources.metal'] = this.player.planets[planet].moon.buildingConstrucction.metal;
      objInc['planets.' + planet + '.moon.resources.crystal'] = this.player.planets[planet].moon.buildingConstrucction.crystal;
      objInc['planets.' + planet + '.moon.resources.deuterium'] = this.player.planets[planet].moon.buildingConstrucction.deuterium;
      mongo.db(process.env.UNIVERSE_NAME).collection("jugadores").updateOne({name: this.player.name}, {$set: objSet, $inc: objInc}, (err, result) => {
        if(err) throw err;
        res.send({ok: true});
      });
    }else{
      res.send({ok: false});
    }
  },
  cancelResearchRequest: function(res){
    if(this.player.researchConstrucction != false){
      let planet = this.player.researchConstrucction.planet;
      let objSet = {};
      let objInc = {};
      objSet['researchConstrucction'] = false;
      objInc['planets.' + planet + '.resources.metal'] = this.player.researchConstrucction.metal;
      objInc['planets.' + planet + '.resources.crystal'] = this.player.researchConstrucction.crystal;
      objInc['planets.' + planet + '.resources.deuterium'] = this.player.researchConstrucction.deuterium;
      mongo.db(process.env.UNIVERSE_NAME).collection("jugadores").updateOne({name: this.player.name}, {$set: objSet, $inc: objInc}, (err, result) => {
        if(err) throw err;
        res.send({ok: true});
      });
    }else{
      res.send({ok: false});
    }
  },
  cancelShipyardRequest: function(planet, shipyardName, res){
    let objPull = {};
    let objInc = {};
    objInc['planets.' + planet + '.resources.metal'] = 0;
    objInc['planets.' + planet + '.resources.crystal'] = 0;
    objInc['planets.' + planet + '.resources.deuterium'] = 0;
    for(let i = 0 ; i<this.player.planets[planet].shipConstrucction.length ; i++){
      if(this.player.planets[planet].shipConstrucction[i].item == shipyardName){
        objInc['planets.' + planet + '.resources.metal'] += this.player.planets[planet].shipConstrucction[i].metal;
        objInc['planets.' + planet + '.resources.crystal'] += this.player.planets[planet].shipConstrucction[i].crystal;
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
  timeBuild: function(recursos, mult, elev){
    let divisor = 2500 * (1+mult) * Math.pow(2,elev) * this.universo.speed;
    return Math.floor(60*recursos/divisor);
  },
  updateResourcesData: function(f, planet, obj = null) { //updatea los multiplicadores de los recursos(NO toca los recursos)
    let objSet = {};
    let spd = this.universo.speed;
    let plasma = this.player.research.plasma;
    let minas = this.player.planets[planet].buildings;
    let temp = (this.player.planets[planet].temperature.max + this.player.planets[planet].temperature.min)/2;
    if(obj != null){
      this.player.planets[planet].resourcesPercentage = obj;
      objSet.resourcesPercentage = obj;
    }
    let maxEnergyAux = {metal: Math.floor(parseInt(this.player.planets[planet].resourcesPercentage.metal)*minas.metalMine*Math.pow(1.1, minas.metalMine)), crystal: Math.floor(parseInt(this.player.planets[planet].resourcesPercentage.crystal)*minas.crystalMine*Math.pow(1.1, minas.crystalMine)), deuterium: Math.floor(2*parseInt(this.player.planets[planet].resourcesPercentage.deuterium)*minas.deuteriumMine*Math.pow(1.1, minas.deuteriumMine))};
    let auxEnergy = {solar: Math.floor(20*minas.solarPlant*Math.pow(1.1,minas.solarPlant)), fusion: Math.floor(3*minas.fusionReactor*parseInt(this.player.planets[planet].resourcesPercentage.energy)*Math.pow(1.05+0.01*this.player.research.energy, minas.fusionReactor)), fusionDeuterium: -Math.floor(minas.fusionReactor*parseInt(this.player.planets[planet].resourcesPercentage.energy)*Math.pow(1.1, minas.fusionReactor)), satillite: Math.floor((temp+160)/6)*this.player.planets[planet].fleet.solarSatellite};
    let energyTotal = auxEnergy.solar + auxEnergy.fusion + auxEnergy.satillite;
    let totalEnergyUsage = maxEnergyAux.metal + maxEnergyAux.crystal + maxEnergyAux.deuterium;
    let energyUsage = {metal: Math.floor((maxEnergyAux.metal*energyTotal)/totalEnergyUsage), crystal: Math.floor((maxEnergyAux.crystal*energyTotal)/totalEnergyUsage), deuterium: Math.floor((maxEnergyAux.deuterium*energyTotal)/totalEnergyUsage)};
    energyUsage = {metal: ((energyUsage.metal > maxEnergyAux.metal) ? maxEnergyAux.metal : energyUsage.metal), crystal: ((energyUsage.crystal > maxEnergyAux.crystal) ? maxEnergyAux.crystal : energyUsage.crystal), deuterium: ((energyUsage.deuterium > maxEnergyAux.deuterium) ? maxEnergyAux.deuterium : energyUsage.deuterium)};
    let energy = Math.floor(energyTotal - maxEnergyAux.metal - maxEnergyAux.crystal - maxEnergyAux.deuterium);
    objSet['resources.energy'] = energy;
    objSet['resourcesAdd.energy'] = energyTotal;
    let deuteriumHour = spd*((isNaN(energyUsage.deuterium/maxEnergyAux.deuterium)) ? 0 : (energyUsage.deuterium/maxEnergyAux.deuterium))*parseInt(this.player.planets[planet].resourcesPercentage.deuterium)*minas.deuteriumMine*Math.pow(1.1, minas.deuteriumMine)*(1.36-0.004*temp)*(100+plasma/3)/100 + auxEnergy.fusionDeuterium;
    if(deuteriumHour < 0) deuteriumHour = 0;
    objSet.resourcesAdd = {metal: 30*spd+3*((isNaN(energyUsage.metal/maxEnergyAux.metal)) ? 0 : (energyUsage.metal/maxEnergyAux.metal))*spd*parseInt(this.player.planets[planet].resourcesPercentage.metal)*minas.metalMine*Math.pow(1.1, minas.metalMine)*(100+plasma)/100, crystal: 15*spd+2*((isNaN(energyUsage.crystal/maxEnergyAux.crystal)) ? 0 : (energyUsage.crystal/maxEnergyAux.crystal))*spd*parseInt(this.player.planets[planet].resourcesPercentage.crystal)*minas.crystalMine*Math.pow(1.1, minas.crystalMine)*(100+plasma*(2/3))/100, deuterium: deuteriumHour};
    this.player.planets[planet].resourcesAdd = objSet.resourcesAdd;
    this.player.planets[planet].resources.energy = energy;
    this.player.planets[planet].resourcesAdd.energy = energyTotal;
    if(obj != null){
      mongo.db(process.env.UNIVERSE_NAME).collection("jugadores").updateOne({planets :{$elemMatch: {coordinates: {galaxy: this.player.planets[planet].coordinates.galaxy, system: this.player.planets[planet].coordinates.system, pos: this.player.planets[planet].coordinates.pos}}}}, {$set: {'planets.$.resourcesPercentage': objSet.resourcesPercentage, 'planets.$.resources.energy': objSet['resources.energy'], 'planets.$.resourcesAdd': objSet.resourcesAdd}}, () => {
        f();
      });
    }
  },
  updateResourcesDataMoon: function(f, planet, obj){
    if(obj != null){
      obj.sunshade = parseInt(obj.sunshade);
      obj.beam = parseInt(obj.beam);// recalcula la temperatura del planeta
      newTemperature = {max: Math.floor(this.player.planets[planet].temperatureNormal.max+this.player.planets[planet].moon.buildings.lunarBeam*4*obj.beam/10-this.player.planets[planet].moon.buildings.lunarSunshade*4*obj.sunshade/10), min: Math.floor(this.player.planets[planet].temperatureNormal.min+this.player.planets[planet].moon.buildings.lunarBeam*4*obj.beam/10-this.player.planets[planet].moon.buildings.lunarSunshade*4*obj.sunshade/10)}
      mongo.db(process.env.UNIVERSE_NAME).collection("jugadores").updateOne({planets :{$elemMatch: {coordinates: {galaxy: this.player.planets[planet].coordinates.galaxy, system: this.player.planets[planet].coordinates.system, pos: this.player.planets[planet].coordinates.pos}}}}, {$set: {'planets.$.temperature': newTemperature, 'planets.$.moon.values': obj}}, () => {
        this.updateResourcesData(f, planet, this.player.planets[planet].resourcesPercentage);// recalcula la produccion de las minas y guarda todo en la base de datos
      });
    }
  },
  addFleetMovement: function(player, planet, moon, obj, res){
    // Falta terminar la funcion



    let validMission = false;
    let fleetVoid = true;
    for(let item in obj.ships){
      if(obj.ships >= 0){

      }
    }
    if(validMission){

      let pushObjAux = {}
      let pushObj = {};
      pushObjAux['ships'] = obj.ships;
      pushObjAux['moon'] = moon;
      pushObjAux['coorDesde'] = obj.coorDesde;
      pushObjAux['coorHasta'] = obj.coorHasta;
      pushObjAux['destination'] = data.destination; // planeta, luna, escombros
      pushObjAux['resources'] = {metal: obj.resources.metal, crystal: obj.resources.crystal, deuterium: obj.resources.deuterium};
      pushObjAux['speed'] = data.porce;
      pushObjAux['mission'] = data.mission;
      pushObj['planets.' + planet + '.movement'] = pushObjAux;

      //mongo.db(process.env.UNIVERSE_NAME).collection("jugadores").updateOne({name: player}, {$push: pushObj});
      res.send({ok: true});

    }else{
      res.send({ok: false});
    }

  },
  moveCuanticFleet: function(player, planeta, obj, res){
    /*if(this.player.planets[planeta].moon.active == true && ){

    }*/


    res.send({ok: true});
  },
  setPlanetData: function(cord, player){
    // cambiar para que no sean constantes ???
    let resources = {metal: 1000, crystal: 1000, deuterium: 0, energy: 0};
    let building = {metalMine: 0, crystalMine: 1, deuteriumMine: 0, solarPlant: 30, fusionReactor: 0, metalStorage: 10, crystalStorage: 9, deuteriumStorage: 8, robotFactory: 0, shipyard: 0, researchLab: 0, alliance: 0, silo: 0, naniteFactory: 0, terraformer: 0};
    let fleet = {lightFighter: 10, heavyFighter: 0, cruiser: 1, battleship: 10, battlecruiser: 0, bomber: 3, destroyer: 100, deathstar: 1, smallCargo: 20, largeCargo: 200, colony: 1, recycler: 10, espionageProbe: 30, solarSatellite: 15};
    let defenses = {rocketLauncher: 0, lightLaser: 0, heavyLaser: 0, gauss: 10, ion: 0, plasma: 0, smallShield: 0, largeShield: 0, antiballisticMissile: 0, interplanetaryMissile: 0};
    let moon = this.createNewMoon(8888);//{active: false, size: 0};
    let debris = {active: false, metal:0, crystal: 0};
    mongo.db(process.env.UNIVERSE_NAME).collection("jugadores").updateOne({planets :{$elemMatch: {coordinates: {galaxy: cord.galaxy, system: cord.system, pos: cord.pos}}}}, {$set: {'planets.$.resources': resources,'planets.$.buildings': building, 'planets.$.fleet': fleet, 'planets.$.defense': defenses,'planets.$.moon': moon, 'planets.$.debris': debris}});
  },
  setMoonData: function(cord, player){ // asume el planeta tiene luna si no, no hace nada
    // cambiar para que no sean constantes ???
    let resources = {metal: 500000, crystal: 4000000, deuterium: 1000000, energy: 0};
    let building = {lunarBase: 6, phalanx: 2, spaceDock: 0, marketplace: 1, lunarSunshade: 5, lunarBeam: 6, jumpGate: 1, moonShield: 0};
    let fleet = {lightFighter: 1000, heavyFighter: 0, cruiser: 1, battleship: 30, battlecruiser: 0, bomber: 0, destroyer: 0, deathstar: 100, smallCargo: 0, largeCargo: 0, colony: 0, recycler: 0, espionageProbe: 0, solarSatellite: 0};
    mongo.db(process.env.UNIVERSE_NAME).collection("jugadores").updateOne({planets :{$elemMatch: {coordinates: {galaxy: cord.galaxy, system: cord.system, pos: cord.pos}}}}, {$set: {'planets.$.moon.resources': resources,'planets.$.moon.buildings': building, 'planets.$.moon.fleet': fleet}});
  },
  colonize: function(cord, player){
    //se tiene que fijar que no halla nadie en esa posicion
    //se tiene que fijar que la tecnologia de astrofisica permita colonizar
    //se tiene que fijar que no supere el maximo de planetas permitidos(8 max.)
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
      let puntos = 0;// no cuenta los puntos de las naves en vuelo
      let costShipyard = {
        lightFighter: {metal: 3000, crystal: 1000, deuterium: 0},
        heavyFighter: {metal: 6000, crystal: 4000, deuterium: 0},
        cruiser: {metal: 2000, crystal: 7000, deuterium: 2000},
        battleship: {metal: 45000, crystal: 15000, deuterium: 0},
        battlecruiser: {metal: 30000, crystal: 40000, deuterium: 15000},
        bomber: {metal: 50000, crystal: 25000, deuterium: 15000},
        destroyer: {metal: 60000, crystal: 50000, deuterium: 15000},
        deathstar: {metal: 5000000, crystal: 4000000, deuterium: 1000000},
        smallCargo: {metal: 2000, crystal: 2000, deuterium: 0},
        largeCargo: {metal: 6000, crystal: 6000, deuterium: 0},
        colony: {metal: 10000, crystal: 20000, deuterium: 10000},
        recycler: {metal: 10000, crystal: 6000, deuterium: 2000},
        espionageProbe: {metal: 0, crystal: 1000, deuterium: 0},
        solarSatellite: {metal: 0, crystal: 2000, deuterium: 500},
        rocketLauncher: {metal: 2000, crystal: 0, deuterium: 0},
        lightLaser: {metal: 1500, crystal: 500, deuterium: 0},
        heavyLaser: {metal: 6000, crystal: 2000, deuterium: 0},
        gauss: {metal: 20000, crystal: 15000, deuterium: 0},
        ion: {metal: 2000, crystal: 6000, deuterium: 0},
        plasma: {metal: 50000, crystal: 50000, deuterium: 30000},
        smallShield: {metal: 10000, crystal: 10000, deuterium: 0},
        largeShield: {metal: 50000, crystal: 50000, deuterium: 0},
        antiballisticMissile: {metal: 8000, crystal: 0, deuterium: 2000},
        interplanetaryMissile: {metal: 12500, crystal: 2500, deuterium: 10000}
      }
      for(let j = 0 ; j<15 ; j++){
        puntos += (j < res.research.energy) ? 800*Math.pow(2, j) +  400*Math.pow(2, j) : 0;
        puntos += (j < res.research.laser) ? 200*Math.pow(2, j) + 100*Math.pow(2, j) : 0;
        puntos += (j < res.research.ion) ? 1000*Math.pow(2, j) + 300*Math.pow(2, j) +  100*Math.pow(2, j) : 0;
        puntos += (j < res.research.hyperspace) ? 4000*Math.pow(2, j) +  2000*Math.pow(2, j) : 0;
        puntos += (j < res.research.plasma) ? 2000*Math.pow(2, j) + 4000*Math.pow(2, j) +  1000*Math.pow(2, j) : 0;
        puntos += (j < res.research.espionage) ? 200*Math.pow(2, j) + 1000*Math.pow(2, j) +  200*Math.pow(2, j) : 0;
        puntos += (j < res.research.computer) ? 400*Math.pow(2, j) +  600*Math.pow(2, j) : 0;
        puntos += (j < res.research.astrophysics) ? 4000*Math.pow(2, j) + 8000*Math.pow(2, j) +  4000*Math.pow(2, j) : 0;
        puntos += (j < res.research.intergalactic) ? 240000*Math.pow(2, j) + 400000*Math.pow(2, j) +  160000*Math.pow(2, j) : 0;
        puntos += (j < res.research.combustion) ? 400*Math.pow(2, j) + 600*Math.pow(2, j) : 0;
        puntos += (j < res.research.impulse) ? 2000*Math.pow(2, j) + 4000*Math.pow(2, j) +  600*Math.pow(2, j) : 0;
        puntos += (j < res.research.hyperspace_drive) ? 10000*Math.pow(2, j) + 20000*Math.pow(2, j) +  6000*Math.pow(2, j) : 0;
        puntos += (j < res.research.weapon) ? 800*Math.pow(2, j) + 200*Math.pow(2, j) : 0;
        puntos += (j < res.research.shielding) ? 200*Math.pow(2, j) + 600*Math.pow(2, j) : 0;
        puntos += (j < res.research.armour) ? 1000*Math.pow(2, j) : 0;
      }
      for(let i = 0 ; i<res.planets.length ; i++){
        for(let obj in res.planets[i].fleet){
          puntos += costShipyard[obj].metal * res.planets[i].fleet[obj] + costShipyard[obj].crystal * res.planets[i].fleet[obj] + costShipyard[obj].deuterium * res.planets[i].fleet[obj];
        }
        for(let obj in res.planets[i].defense){
          puntos += costShipyard[obj].metal * res.planets[i].defense[obj] + costShipyard[obj].crystal * res.planets[i].defense[obj] + costShipyard[obj].deuterium * res.planets[i].defense[obj];
        }
        for(let j = 0 ; j<15 ; j++){
          puntos += (j < res.planets[i].buildings.metalMine) ? Math.floor(60*Math.pow(1.5, j)) + Math.floor(15*Math.pow(1.5, j)) : 0;
          puntos += (j < res.planets[i].buildings.crystalMine) ? Math.floor(48*Math.pow(1.6, j)) + Math.floor(24*Math.pow(1.6, j)) : 0;
          puntos += (j < res.planets[i].buildings.deuteriumMine) ? Math.floor(225*Math.pow(1.5, j)) + Math.floor(75*Math.pow(1.5, j)) : 0;
          puntos += (j < res.planets[i].buildings.solarPlant) ? Math.floor(75*Math.pow(1.5, j)) + Math.floor(30*Math.pow(1.5, j)) : 0;
          puntos += (j < res.planets[i].buildings.fusionReactor) ? Math.floor(900*Math.pow(1.8, j)) + Math.floor(360*Math.pow(1.8, j)) + Math.floor(180*Math.pow(1.8, j)) : 0;
          puntos += (j < res.planets[i].buildings.metalStorage) ? 1000*Math.pow(2, j) : 0;
          puntos += (j < res.planets[i].buildings.crystalStorage) ? 1000*Math.pow(2, j) + 500*Math.pow(2, j) : 0;
          puntos += (j < res.planets[i].buildings.deuteriumStorage) ? 1000*Math.pow(2, j) + 1000*Math.pow(2, j) : 0;
          puntos += (j < res.planets[i].buildings.robotFactory) ? 400*Math.pow(2, j) + 120*Math.pow(2, j) + 200*Math.pow(2, j) : 0;
          puntos += (j < res.planets[i].buildings.shipyard) ? 400*Math.pow(2, j) + 200*Math.pow(2, j) + 100*Math.pow(2, j) : 0;
          puntos += (j < res.planets[i].buildings.researchLab) ? 200*Math.pow(2, j) + 400*Math.pow(2, j) + 200*Math.pow(2, j) : 0;
          puntos += (j < res.planets[i].buildings.alliance) ? 20000*Math.pow(2, j) + 40000*Math.pow(2, j) : 0;
          puntos += (j < res.planets[i].buildings.silo) ? 20000*Math.pow(2, j) + 20000*Math.pow(2, j) + 1000*Math.pow(2, j) : 0;
          puntos += (j < res.planets[i].buildings.naniteFactory) ? 1000000*Math.pow(2, j) + 500000*Math.pow(2, j) + 100000*Math.pow(2, j) : 0;
          puntos += (j < res.planets[i].buildings.terraformer) ? 50000*Math.pow(2, j) + 100000*Math.pow(2, j): 0;
        }
      }
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
  },
  normalRandom: (min, max, podaMin = -Infinity, podaMax = Infinity) => {// la esperanza es (max+min)/2
    let u = 0, v = 0, num = 1;
    while(u == 0) u = Math.random(); //Converting [0,1) to (0,1)
    v = Math.random();
    num = Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v); // Box–Muller transform
    num = num / 10.0 + 0.5; // Translate to 0 -> 1
    if (num > 1 || num < 0) num = Math.random(); // resample between 0 and 1 if out of range
    num *= max - min; // Stretch to fill range
    num += min; // offset to min
    if (num > podaMax || num < podaMin) num = Math.random()*(podaMax-podaMin)+(podaMin);
    return num;
  },
  validInt: (num) => {
    num = parseInt(num);
    return !isNaN(num);
  },
  formatNumber: (num) => {
    this.completaDigitos = (inn) => {
      let result = inn;
      if(inn < 100){
        result = '0' + inn;
        if(inn < 10){
          result = '00' + inn;
          if(inn <= 0) result = '000';
        }
      }
      return result;
    };
    let res = num;
    let sign = Math.sign(num);
    if(isFinite(num)){
      res = '';
      num = Math.abs(num);
      while(num > 999){
        res = '.' + this.completaDigitos(num%1000) + res;
        num = Math.floor(num / 1000);
      }
      res = num + res;
      if(sign == -1) res = '-' + res;
    }
    return res;
  },
  seeDataBase: (res, uni, name) => {
    let respuesta = "";
    let cursor = mongo.db(uni).collection(name).find();
    cursor.forEach((doc, err) => {
      respuesta += JSON.stringify(doc);
    }, () => {
      res.render('index', {title: 'Ogame', message: respuesta});
    });
  },
  seeJsonDataBase: (res, uni, name, objName = "item", filtro = {}) => {
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
  }
};

module.exports = exp;

//Lista de cosas por hacer

/* Terminar la funcion addFleetMovement
/* Mejorar el calculo de recursos de tiempos medios
/* En el view de galaxy hay que poner el boton para colonizar
/* Al construir misiles tiene que fijarse en la capacidad del silo
/* El abandonar el planeta en Overview
/* La funcion de contar puntos tiene que contar los puntos de la luna
/* Cuando estas haciendo una contruccion en un planeta se tiene que poner la llavecita indicando eso
*/
