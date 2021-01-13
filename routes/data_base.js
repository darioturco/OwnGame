var uni      = null;
var mongo    = null;
var date     = new Date();
require('mongodb').MongoClient.connect(process.env.MONGO_URL, {useUnifiedTopology: true}, (err, db) => {
  if(err) throw err;
  mongo = db;
  exp.mongo = db; /* Borrar */
  exp.getUniverseData(process.env.UNIVERSE_NAME); // Carga los datos del universo
  mongo.db(process.env.UNIVERSE_NAME).collection("jugadores").countDocuments({}, function(err, cant) {uni.cantPlayers = cant});
  exp.getPlayer(process.env.PLAYER, () => {console.log('\x1b[32m%s\x1b[0m', "Base de datos lista.");});
});
var exp = {
  mongo: mongo, /* Borrar */

  // Setea y pone la info del universo en 'uni'
  //  -newUniverse = Objeto con la informacion del iniverso
  setUniverse: function(newUniverse){
    uni = newUniverse;
  },

  // Setea y guarda en la base de datos la nueva informacion del universo
  //  -name = Nuevo nombre del universo
  //  -data = Nueva informacion basica del universo
  setUniverseData: function(name, data) {
    data.name     = name;   // Setea el nombre del universo
    uni.universo  = data;   // Pone el objeto con toda la informacion basica del universo
    mongo.db(process.env.UNIVERSE_NAME).collection("universo").insertOne(data); // Guarda la info del universo
  },

  // getUniverseData: Obtiene la informacion del universo con el nombre 'name'
  //  -name = Nombre del universo a buscar
  getUniverseData: function(name){
    let cursor = mongo.db(process.env.UNIVERSE_NAME).collection("universo").find();
    cursor.forEach((doc, err) => {
      if(err) throw err;
      if(name == doc.name) uni.universo = doc;
    });
  },

  // Obtiene la ListCord del universo
  //  -f = Funcion que se ejecuta despues de obtener la lista
  getListCord: function(f){
    let obj = {};
    let espionageLevel = 0;
    let cursor = mongo.db(process.env.UNIVERSE_NAME).collection("jugadores").find({});
    cursor.forEach((doc, err) => {
      espionageLevel = doc.research.espionage;
      for(let i = 0 ; i<doc.planets.length ; i++){
        obj[doc.planets[i].coordinates.gal + '_' + doc.planets[i].coordinates.sys + '_' + doc.planets[i].coordinates.pos] = {espionage: espionageLevel, playerName: doc.planets[i].player, color: doc.planets[i].color};
      }
    }, () => {
      uni.allCord = obj;
      f();
    });
  },

  // Escribe datos en el planeta (Usada para debugear)
  //  -codr = Coordenadas del planeta a modificar
  setPlanetDataDev: function(cord){ /* III Funcion de base de datos III */
    let resources = {metal: 1000, crystal: 1000, deuterium: 15000, energy: 0};
    let building = {metalMine: 0, crystalMine: 1, deuteriumMine: 0, solarPlant: 30, fusionReactor: 0, metalStorage: 10, crystalStorage: 9, deuteriumStorage: 8, robotFactory: 0, shipyard: 0, researchLab: 0, alliance: 0, silo: 0, naniteFactory: 0, terraformer: 0};
    let fleet = /*uni.fun.zeroShips();*/{lightFighter: 10, heavyFighter: 0, cruiser: 100, battleship: 10, battlecruiser: 0, bomber: 3, destroyer: 100, deathstar: 50, smallCargo: 500, largeCargo: 200, colony: 1000, recycler: 200, espionageProbe: 30, solarSatellite: 15};
    let defenses = /*uni.fun.zeroDefense();*/{rocketLauncher: 100, lightLaser: 10, heavyLaser: 0, gauss: 5, ion: 0, plasma: 0, smallShield: 0, largeShield: 0, antiballisticMissile: 3, interplanetaryMissile: 1000};
    let moon = /*{active: false, size: 0};*/uni.createNewMoon(8888);
    let debris = {active: true, metal:1000, crystal: 2000};
    mongo.db(process.env.UNIVERSE_NAME).collection("jugadores").updateOne({planets :{$elemMatch: {coordinates: {gal: cord.gal, sys: cord.sys, pos: cord.pos}}}}, {$set: {'planets.$.resources': resources,'planets.$.buildings': building, 'planets.$.fleet': fleet, 'planets.$.defense': defenses,'planets.$.moon': moon, 'planets.$.debris': debris}});
  },

  // Escribe datos en la luna (Usada para debugear)
  //  -codr = Coordenadas de la luna a modificar
  setMoonDataDev: function(cord){ // Asume el planeta tiene luna, de lo contrario no hace nada /* III Funcion de base de datos III */
    let resources = {metal: 500000, crystal: 4000000, deuterium: 1000000, energy: 0};
    let building = {lunarBase: 6, phalanx: 2, spaceDock: 0, marketplace: 1, lunarSunshade: 5, lunarBeam: 6, jumpGate: 2, moonShield: 0};
    let fleet = {lightFighter: 1000, heavyFighter: 0, cruiser: 1, battleship: 30, battlecruiser: 0, bomber: 0, destroyer: 0, deathstar: 100, smallCargo: 10, largeCargo: 200, colony: 0, recycler: 20, espionageProbe: 0, solarSatellite: 0};
    mongo.db(process.env.UNIVERSE_NAME).collection("jugadores").updateOne({planets :{$elemMatch: {coordinates: {gal: cord.gal, sys: cord.sys, pos: cord.pos}}}}, {$set: {'planets.$.moon.resources': resources,'planets.$.moon.buildings': building, 'planets.$.moon.fleet': fleet}});
  },

  // Renderiza todo un collection de la base de datos
  //  -res = Objeto respuesta a enviar al cliente
  //  -name = Nombre del colection a renderizar
  seeDataBase: (res, name) => {
    let respuesta = "";
    let cursor = mongo.db(process.env.UNIVERSE_NAME).collection(name).find();
    cursor.forEach((doc, err) => {
      respuesta += JSON.stringify(doc);
    }, () => {
      res.render('index', {title: 'Ogame', message: respuesta});
    });
  },

  // Devuelve un objeto con todos los elementos de un collection de la base de datos
  //  -res = Objeto respuesta a enviar al cliente
  //  -name = Nombre del collection a mostrar
  //  -objName = Nombre de cada objeto del collection
  //  -filtro = Filtro que se aplica al buscar los objetos del collection
  seeJsonDataBase: (res, name, objName = "item", filtro = {}) => {
    let cursor = mongo.db(process.env.UNIVERSE_NAME).collection(name).find(filtro);
    let obj = {};
    let i = 1;
    cursor.forEach((doc, err) => {
      obj[objName+i] = doc;
      i++;
    }, () => {
      res.send(obj);
    });
  },

  // Elimina una lista de collections de la base de datos
  //  -nameList = Lista con la lista de los nombres de los collections a eliminar
  deleteCollection: (nameList) => {
    for(let i = 0 ; i<nameList.length ; i++){
      mongo.db(process.env.UNIVERSE_NAME).dropCollection(nameList[i],
        (err, delOK) => {
          if(err) throw err;
          if(delOK) console.log('\x1b[35m%s\x1b[0m', "Collection" + nameList[i] + "deleted")
        });
    }
  },

  // Escribe informacion en un planeta, si un objeto es 'undefined' la informacion de ese objeto la deja intacta
  //  -cord = Coordenadas del planeta a cambiar informacion
  //  -resources = Recursos a poner en el planeta
  //  -building = Edificios a poner en el planeta
  //  -fleet = Naves a poner en el planeta
  //  -defenses = Defensas a poner en el planeta
  //  -moon = Objeto con la informacion de la nueva luna del planeta
  setPlanetData: function(cord, resources = undefined, buildings = undefined, fleet = undefined, defenses = undefined, moon = undefined){ /* III Funcion de base de datos III */
    let setObj = {};
    if(resources != undefined) setObj['planets.$.resources'] = resources;
    if(buildings != undefined) setObj['planets.$.buildings'] = buildings;
    if(fleet     != undefined) setObj['planets.$.fleet']     = fleet;
    if(defenses  != undefined) setObj['planets.$.defense']   = defenses;
    if(moon      != undefined) setObj['planets.$.moon']      = moon;
    mongo.db(process.env.UNIVERSE_NAME).collection("jugadores").updateOne({planets :{$elemMatch: {coordinates: {gal: cord.gal, sys: cord.sys, pos: cord.pos}}}}, {$set: setObj});
  },

  // Escribe informacion en una luna, si un objeto es 'undefined' la informacion de ese objeto la deja intacta
  //  -cord = Coordenadas del planeta a cambiar informacion
  //  -resources = Recursos a poner en la luna
  //  -building = Edificios a poner en la luna
  //  -fleet = Naves a poner en la luna
  setMoonData: function(cord, resources = undefined, buildings = undefined, fleet = undefined){ // Asume el planeta tiene luna, de lo contrario no hace nada /* III Funcion de base de datos III */
    let setObj = {};
    if(resources != undefined) setObj['planets.$.moon.resources'] = resources;
    if(buildings != undefined) setObj['planets.$.moon.buildings'] = buildings;
    if(fleet != undefined) setObj['planets.$.moon.fleet'] = fleet;
    mongo.db(process.env.UNIVERSE_NAME).collection("jugadores").updateOne({planets :{$elemMatch: {coordinates: {gal: cord.gal, sys: cord.sys, pos: cord.pos}}}}, {$set: setObj});
  },

  // Suma recursos y flota a un planeta o luna
  //  -cord = Coordenadas del planeta a sumarle datos
  //  -resources = Recursos a sumar
  //  -fleet = Naves a sumar
  //  -moon = Boleano que indica si se suman a la luna o al planeta
  //  -f = Funcion a ejecutar despues de sumar los recursos y flota
  addPlanetData: function(cord, resources, fleet, moon, f = undefined){
    let incObj = {};
    let moonStr = moon ? '.moon.' : '.';
    for(let i in resources){
      incObj['planets.$' + moonStr + 'resources.' + i] = resources[i];
    }
    for(let i in fleet){
      if(i != 'misil') incObj['planets.$' + moonStr + 'fleet.' + i] = fleet[i];
    }
    mongo.db(process.env.UNIVERSE_NAME).collection("jugadores").updateOne(
      {planets :{$elemMatch: {coordinates: {gal: cord.gal, sys: cord.sys, pos: cord.pos}}}},
      {$inc: incObj}, (err, result) => {
        if(err) throw err;
        if(f != undefined) f();
      });
  },

  // Guarda la informacion del jugador 'playerName'
  //  -playerName = Nombre del jugador al que se le actualiza la informacion
  //  -objSet = Objeto con las cosas que se remplazan
  //  -objInc = Objeto con las cosas que se incrementan
  //  -objPull = Objeto con las cosas que se eliminan de una lista
  //  -f = funcion que se ejecuta despues de terminar al funcion
  savePlayerData: function(playerName, objSet, objInc, objPull, f){
    mongo.db(process.env.UNIVERSE_NAME).collection("jugadores").findOneAndUpdate(
      {name: playerName},
      {$set: objSet, $inc: objInc, $pull: objPull},
      {returnOriginal: false},    // Hace que devuelva el objeto modificado, no el original
      (err, res) => {
        if(err) throw err;
        f(res.value);
    });
  },

  // Manda un mensaje al jugador con el nombre 'playerName'
  //  -playerName = Nombre del jugador al que se le manda el mensage
  //  -info = Objeto con la informacion del mensaje, debe tener los campos 'type', 'title', 'text', 'info'
  sendMessage: function(playerName, info) {
    let newMessage = {date: new Date().toString().slice(0,24), type: info.type, title: info.title, text: info.text, data: info.data};
    // Si el mensage es para el jugador actual le incremento la cantidad de mensages no leidos
    if(playerName == uni.player.name) uni.player.messagesCant++;
    mongo.db(process.env.UNIVERSE_NAME).collection("jugadores").updateOne({name: playerName}, {
      $push: {messages: newMessage},
      $inc: {messagesCant: 1}});
  },

  // Elimina todos los mensages de un tipo o un mensage con una fecha especifica
  //  -playerName = Nombre del jugador a borrar los mensages
  //  -all = Si elimina todos los mensages de un tipo o no
  //  -borra = Numero del tipo de mensage a eliminar o la fecha del mensage a eliminar
  deleteMessage: function(playerName, all, borra) {
    let obj = (all == true) ? {type: parseInt(borra)} : {date: borra};
    mongo.db(process.env.UNIVERSE_NAME).collection("jugadores").updateOne({name: playerName},
      {$pull: {messages: obj}},
      {multi: true});
  },

  // Guarda el contador de mensages no leidos en 0 del jugador actual
  setNoReadMessages: function(){
    uni.player.messagesCant = 0;
    mongo.db(process.env.UNIVERSE_NAME).collection("jugadores").updateOne({name: uni.player.name}, {$set: {messagesCant: 0}});
  },

  // Elimina un planeta de un jugador
  //  -player = Objeto con la informacion del jugador
  //  -planet = Numero de planeta a eliminar
  //  -res = Objeto respuesta a devolver al cliente
  abandonPlanet: function(player, planet, res){
    if(player.planets.length > 1){ // Solo abandono el planeta si hay almenos otro mas
      let objPull = {};
      objPull.planets  = {coordinates: player.planets[planet].coordinates}; // Elimino el planeta nuemro planet de la lista
      objPull.movement = {coorDesde: player.planets[planet].coordinates};   // Elimino todos los movment que salieron del planeta eliminado
      mongo.db(process.env.UNIVERSE_NAME).collection("jugadores").updateOne(
        {name: player.name},
        {$pull: objPull}, (err) => {
          if(err) throw err;
          res.send({ok: true});
        });
    }else{
      res.send({ok: false, mes: "No se puede abandonar el unico planeta que tenes."});
    }
  },

  // Cambia la flota que hay en una luna y el tiempo de enfriamiento del salto cuentico de esa luna
  //  -cord = Coordenadas de la luna
  //  -fleet = Naves a sumar
  //  -cuantic = Nuevo tiempo de enfriamiento del salto cuantico
  updateCuantic: function(cord, fleet, cuantic){
    let setObj = {};
    let incObj = {};
    for(let i in fleet){
      incObj['planets.$.moon.fleet.' + i] = fleet[i];
    }
    setObj['planets.$.moon.cuantic'] = cuantic;
    mongo.db(process.env.UNIVERSE_NAME).collection("jugadores").updateOne(
      {planets :{$elemMatch: {coordinates: {gal: cord.gal, sys: cord.sys, pos: cord.pos}}}},
      {$set: setObj, $inc: incObj}, (err, result) => {
        if(err) throw err;
      });
  },

  // Agrega un planeta a un jugador en la base de datos
  //  -playerName = Nombre del jugador al que se le agrega el nuevo planeta
  //  -newPlanet = Objeto con la informacion del nuevo planeta
  addNewPlanetToDataBase: function(playerName, newPlanet){
    mongo.db(process.env.UNIVERSE_NAME).collection("jugadores").updateOne({name: playerName}, {$push: {planets: newPlanet}});
  },

  saveMission: function(playerName, mission, objReward, f){
    let setObj = {};
    setObj['tutorial.' + (mission-1)] = true;
    mongo.db(process.env.UNIVERSE_NAME).collection("jugadores").updateOne(
      {name: playerName},
      {$set: setObj, $inc: objReward}, (err) => {
        if(err) throw err;
        f();
      });
  },

  // Obtiene el jugador con el nombre 'playerName' y despues ejecuta al funcion 'f'
  //  -playerName = Nombre del jugador a buscar
  //  -f = Funcion que se ejecuta despues de obtener el jugador
  getPlayer: function(playerName, f) {
    mongo.db(process.env.UNIVERSE_NAME).collection("jugadores").findOne({name: playerName}, (err, res) => {
      if(err) throw err;
      if(res == null){
        f();
      }else{
        uni.player = res;         // Actualizo el player principal
        this.getListCord(() => {  // Cargo la lista de planetas colonizados
          uni.updatePlayer(uni.player, (respuesta) => {uni.player = respuesta; f();}); // Actualiza los datos desde la ultima conecccion
        });
      }
    });
  },

  // Envia el reporte de espionage del planeta en 'coor' al jugador 'playerName'
  //  -playerName = Nombre del jugador que esta espiando
  //  -coor = Coordenadas del planeta o luna que se esta espiando
  //  -indiceDeEspionage = Numero que indica cuanta informacion se obtiene del espiado
  //  -moon = Booleano que es true si se espia la luna y false si se espia el planeta
  sendSpyReport: function(playerName, coor, indiceDeEspionage, moon){
    mongo.db(process.env.UNIVERSE_NAME).collection("jugadores").findOne(   // Busco el jugador que tiene el planeta a espiar
      {planets :{$elemMatch: {coordinates: {
        gal: coor.gal,
        sys: coor.sys,
        pos: coor.pos}}}},
      (err, res) => {
        if(err) throw err;
        let index = uni.fun.getIndexOfPlanet(res.planets, coor);
        let report = {};
        if(index == -1 || (moon && !res.planets[index].moon.active)){ // Me fijo que halla un planeta o luna en el lugar a espiar
          report = {type: 3, title: "Espionage Report Failed", text: (index == -1) ? "There is no planet in the coordinates..." : "There is no moon in the coordinates...", data: {}};
        }else{
          // Agrego los recursos y el resto lo dejo sin definir para agregarlo despues si hace falta
          let dataEsp = moon ? {resources: res.planets[index].moon.resources} : {resources: res.planets[index].resources};
          if(indiceDeEspionage >= 2){
            // Agrego fleet
            dataEsp.fleet = moon ? res.planets[index].moon.fleet : res.planets[index].fleet;
            if(indiceDeEspionage >= 3){
              // Agrego defensa
              dataEsp.defense = moon ? uni.fun.zeroDefense() : res.planets[index].defense;
              if(indiceDeEspionage >= 5){
                // Agrego research
                dataEsp.research = res.planets[index].research;
                if(indiceDeEspionage >= 7){
                  // Agrego buildings
                  dataEsp.buildings = moon ? res.planets[index].moon.buildings : res.planets[index].buildings;
                }
              }
            }
          } // Mando el reporte
          report = {type: 2, title: "Espionage Report", text: "", data: dataEsp};
        }
        this.sendMessage(playerName, report);
    });
  },

  // Devuelve un objeto que tiene la informacion publica de cada planeta y luna de un sistema solar de un galaxia
  //  -res = Respuesta a enviar al cliente
  //  -gal = Numero de galaxia
  //  -sys = Nuemero de sistema
  systemInfo: function(res, gal, sys){
    let respuesta = {};
    for(let i = 1 ; i<=15 ; i++){   // Al principio todos los 16 planetas estan desactivados
      respuesta['pos' + i] = {active: false};
    }

    // Obtengo todas las vacas de ese sistema solar
    let listaPosiblesVacas = uni.fun.posiblesVacas(uni.player.vacas, gal, sys);
    let cursor = mongo.db(process.env.UNIVERSE_NAME).collection("jugadores").find({planets :{$elemMatch: {coordinatesCod: gal+'_'+sys}}});

    // Busco todos los planetas colonizados de ese sistema solar y completo la informacion de cada activo
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
                                    esVaca:        listaPosiblesVacas.includes(pos),
                                    estado:        "activo"}; /* Cambiar el estado activo siempre */
        }
      }
    }, () => {
      res.send(respuesta);
    });
  },

  // Agrega un jugador al universo y lo guarda en la base de datos
  //  -name = Nombre del nuevo jugador
  //  -styleGame = Typo de jugador que va a ser (es un bot, una persona y que tipo de bot, algo hibrido, etc)
  addNewPlayer: function(name, styleGame) {
    let newCoor = uni.newCord();
    if(newCord != undefined){
      let newPlanet = uni.createNewPlanet(newCoor, "Planeta Principal", name, 'activo', uni.fun.zeroResources(), uni.fun.zeroShips());

      // Guardo el nivel de espionage del nuevo jugador en esa coordenada, o sea 0
      uni.allCord[coor.gal+'_'+coor.sys+'_'+coor.pos] = {espionage: 0, playerName: name};
      let newPlayer = {'name': name,
        'styleGame': styleGame,
        planets: [newPlanet],
        maxPlanets: 1,
        highscore: uni.cantPlayers + 1, // Empieza en la ultima posicion
        lastHighscore: uni.cantPlayers + 1, // La posicion en la que estaba hace un dia, se la cuenta como la actual
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
        research: uni.fun.zeroResearch(),
        lastVisit: uni.fun.horaActual(),  // Pone el tiempo actual
        type: "activo" // (activo inactivo InactivoFuerte fuerte debil)
      };

      // Aumenta en uno la cantidad de jugadores del universo
      uni.cantPlayers++;
      // Agrega al jugador a la base de datos
      mongo.db(process.env.UNIVERSE_NAME).collection("jugadores").insertOne(newPlayer);
    }
  },

  // Escribe en la base de datos la cantidad de naves con las que se hacen los ataques automaticos
  //  -playerName = Nombre del jugador a cambiar valores
  //  -res = Respuesta a enviar al cliente
  //  -esp = Cantidad de sondas de espionaje
  //  -small = Cantidad de naves pequnas de carga
  //  -large = Cantidad de naves grandes de carga
  setOptions: function(playerName, res, esp, small, large){
    if(isFinite(esp) && esp > 0 && isFinite(small) && small > 0 && isFinite(large) && large > 0){
      mongo.db(process.env.UNIVERSE_NAME).collection("jugadores").updateOne(
        {name: playerName},
        {$set: {sendEspionage: esp, sendSmall: small, sendLarge: large}}, (err) => {
          res.send({ok: (err == null) ? true : err});
      });
    }else{
      res.send({ok: false, mes: "Algo salio mal. Parametros invalidos"});
    }
  },

  // Dado el nombre de un jugador y devuelve las cordenadas de todos sus planetas
  //  -res = Respuesta a enviar al cliente
  //  -playerName = Nombre del jugador a buscar
  searchPlayer: function(res, playerName){
    mongo.db(process.env.UNIVERSE_NAME).collection("jugadores").findOne({name: playerName}, (err, obj) => {
      if(err) throw err;
      if(obj == null){
        // En caso de no existir aviso y no devuelvo ninguna lista
        res.send({ok: false, mes: "Not found"});
      }else{
        // Obtengo el nombre y las coordenadas de todos sus planetas
        let coors = [], names = [];
        for(let i = 0 ; i<obj.planets.length ; i++){
          coors.push(obj.planets[i].coordinates);
          names.push(obj.planets[i].name);
        }
        res.send({ok: true, 'names': names, 'coors': coors});
      }
    });
  },

  // Devuelve una lista con todos los jugadores
  //  -res = Respuesta a enviar al cliente
  highscoreData: function(res){
    let listInfo = [];
    cursor = mongo.db(process.env.UNIVERSE_NAME).collection("jugadores").find({}).sort({"puntos": -1});
    cursor.forEach((doc, err) => {
      listInfo.push({name: doc.name, coor: doc.planets[0].coordinates, points: doc.puntos, rank: doc.highscore, lastRank: doc.lastHighscore});
    }, () => {
      res.send({ok: true, info: listInfo});
    });
  },

  // Cambia el estado de una vaca, o sea, si esta en la lista de vacas lo saca y si no esta lo agrega
  //  -player = Objeto con la informacion del jugador
  //  -res = Respuesta a enviar al cliente
  //  -query = Objeto con la informacion del request del cliente
  toggleVaca: function(player, res, query){
    if(uni.fun.coordenadaValida(query.coor)){
      let elimino = false;
      for(let i = 0 ; i<player.vacas.length ; i++){ // Busco si el jugador agregado ya esta en la lista de vacas
        if(player.vacas[i].coordinates.gal == query.coor.gal && player.vacas[i].coordinates.sys == query.coor.sys && player.vacas[i].coordinates.pos == query.coor.pos){
          elimino = true;
          player.vacas.splice(i,1);
          i--;
        }
      }
      // Lo agrego a la lista con la informacion que vino del usuario, voy a confiar en que este la manda bien, en caso de no hacerlo el unico perjudicado es el mismo usuario
      if(!elimino && player.name != query.playerName){
        player.vacas.push({coordinates: {gal: query.coor.gal, sys: query.coor.sys, pos: query.coor.pos},
                           playerName:  query.playerName,
                           planetName:  query.planetName,
                           estado:      query.estado});
      }
      mongo.db(process.env.UNIVERSE_NAME).collection("jugadores").updateOne({name: player.name}, {$set: {vacas: player.vacas}}, (err) => {
        if(err) throw err;
        res.send({ok: true, deleted: elimino});
      });
    }else{
      res.send({ok: false, mes: "Coordenadas invalidas"});
    }
  },

  // Cambia de nombre a un planeta del jugador
  //  -player = Objeto con la informacion del jugador
  //  -coor = Coordenadas del planeta al que hay que cambiarle el nombre
  //  -newName = Nuevo nombre del planeta
  setPlanetName: function(player, coor, newName, moon){
    let index = uni.fun.getIndexOfPlanet(player.planets, coor);
    let objSet = {};
    if(moon){
      objSet['planets.$.moon.name'] = newName;
      player.planets[index].moon.name = newName;
    }else{
      objSet['planets.$.name'] = newName;
      player.planets[index].name = newName;
    }
    mongo.db(process.env.UNIVERSE_NAME).collection("jugadores").updateOne(
      {planets :{$elemMatch: {coordinates: {gal: coor.gal, sys: coor.sys, pos: coor.pos}}}},
      {$set: objSet});
  },

  // Guarda los recursos reciclados de una flota en un campo de escombros y devuelve como quedaron los escombros
  //  -playerName = Nombre del jugador dueno de la flota
  //  -debris = Objeto con los escombros a reciclar
  //  -movment = El movment que esta reciclando
  recicleDebris: function(playerName, debris, movement){
    if(debris.active){
      // Calcula cuanto puede cargar como maximo los recicladores, esta dado por el
      // minimo entre el espacio libre en las naves y la pacidad de todos los recicladores juntos
      let espacioLibre = fun.espacioLibre(movement);
      let capacidadDeCarga = Math.min(20000*movement.ships.recycler, espacioLibre); // Calculo cuantos recursos entran en los recicladores
      let newResources = fun.cargaEscombros(debris, capacidadDeCarga);
      // Calculo como quedo el campo de escombros reciclado
      let newDebris = {active: false, metal: debris.metal-newResources.metal, crystal: debris.crystal-newResources.crystal};
      newDebris.active = !(newDebris.metal <= 0 && newDebris.crystal <= 0);

      // Agrego la cantidad de recursos reciclados a la flota
      mongo.db(process.env.UNIVERSE_NAME).collection("jugadores").updateOne(
        {name: playerName, "movement.time": movement.time, "movement.llegada": movement.llegada},
        {$inc: {"movement.$.resources.metal": newResources.metal, "movement.$.resources.crystal": newResources.crystal}}
      );
      // Devuelvo como quedo el campo de escombros reciclado
      return newDebris;
    }
    return undefined;
  },

  // Guarda los recursos en los escombors que hay en 'coor'
  //  -coor = Coordenadas donde estan los escombros a cambiar
  //  -newDebris = Objeto con los nuevos escombros
  //  -add = Si es true suma los nuevos escombros a los que ya habia, si es false los remplaza
  saveDebris: function(coor, newDebris, add = false){
    if(!(add && newDebris.metal == 0 && newDebris.crystal == 0)){
      let objBase = {};
      if(add){
        objBase = {$inc: {'planets.$.debris.metal': newDebris.metal, 'planets.$.debris.crystal': newDebris.crystal}, $set: {'planets.$.debris.active': true}};
      }else{
        objBase = {$set: {'planets.$.debris': newDebris}};
      }
      mongo.db(process.env.UNIVERSE_NAME).collection("jugadores").updateOne(
        {planets :{$elemMatch: {coordinates: {
          gal: coor.gal,
          sys: coor.sys,
          pos: coor.pos}}}},
        objBase,
        (err) => {
          if(err) throw err;
        });
    }
  }
};

module.exports = exp;
