var uni      = null;
var mongo    = null;
var date     = new Date();

require('mongodb').MongoClient.connect(process.env.MONGO_URL, {useUnifiedTopology: true}, (err, db) => {
  if(err) throw err;
  mongo = db;
  exp.getUniverseData(process.env.UNIVERSE_NAME); // Carga los datos del universo
  mongo.db(process.env.UNIVERSE_NAME).collection("jugadores").countDocuments({}, function(err, cant) {uni.cantPlayers = cant});
  exp.getPlayer(process.env.PLAYER, () => {
    console.log('\x1b[36m%s\x1b[0m', "Base de datos lista.");
  }, true);
});

var exp = {
  // Setea y pone la info del universo en 'uni'
  //  -newUniverse = Objeto con la informacion del iniverso
  setUniverse: function(newUniverse){
    uni = newUniverse;
  },

  // Setea y guarda en la base de datos la nueva informacion del universo
  //  -name = Nuevo nombre del universo
  //  -data = Nueva informacion basica del universo
  setUniverseData: function(name, data) {
    data.name    = name; // Setea el nombre del universo
    uni.universo = data; // Pone el objeto con toda la informacion basica del universo
    mongo.db(process.env.UNIVERSE_NAME).collection("universo").insertOne(data); // Guarda la info del universo
  },

  // Obtiene la informacion del universo con el nombre 'name'
  //  -name = Nombre del universo a buscar
  getUniverseData: function(name){
    let cursor = mongo.db(process.env.UNIVERSE_NAME).collection("universo").find();
    cursor.forEach((doc, err) => {
      if(err) throw err;
      if(name == doc.name) uni.universo = doc;
    });
  },

  // Obtiene el jugador con el nombre 'playerName' y despues ejecuta al funcion 'f'
  //  -playerName = Nombre del jugador a buscar
  //  -f = Funcion que se ejecuta despues de obtener el jugador
  //  -updateList = Booleano que indica si hay que updatear la lista de coordenadas o no
  getPlayer: function(playerName, f, updateList) {
    mongo.db(process.env.UNIVERSE_NAME).collection("jugadores").findOne(
      {name: playerName}, (err, res) => {
      if(err) throw err;
      if(res == null){
        f();
      }else{
        uni.player = res;  // Actualizo el player principal
        let fun = () => {  // Cargo la lista de planetas colonizados
          uni.updatePlayer(uni.player, (respuesta) => {
            uni.player = respuesta;
            f();
          }); // Actualiza los datos desde la ultima conecccion
        };
        if(updateList){
          this.getListCord(fun);
        }else{
          fun();
        }
      }
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

  // Renderiza todo un collection de la base de datos
  //  -res = Objeto respuesta a enviar al cliente
  //  -name = Nombre del colection a renderizar
  //  -json = Booleano que si es true devuelve un objeto json si no, renderiza un texto con la respuesta de la busqueda
  //  -objName = Nombre de cada objeto del collection
  //  -filtro = Filtro que se aplica al buscar los objetos del collection
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

  // Elimina una lista de collections de la base de datos
  //  -nameList = Lista de los nombres de los collections a eliminar
  deleteCollection: (nameList) => {
    for(let i = 0 ; i<nameList.length ; i++){
      mongo.db(process.env.UNIVERSE_NAME).dropCollection(nameList[i],
        (err, delOK) => {
          if(err) throw err;
          if(delOK) console.log('\x1b[35m%s\x1b[0m', "Collection" + nameList[i] + "deleted")
        });
    }
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

  // Guarda la informacion del jugador 'playerName'
  //  -playerName = Nombre del jugador al que se le actualiza la informacion
  //  -objSet = Objeto con las cosas que se remplazan
  //  -objInc = Objeto con las cosas que se incrementan
  //  -objPull = Objeto con las cosas que se eliminan de una lista
  //  -f = funcion que se ejecuta despues de terminar al funcion
  savePlayerData: function(playerName, objSet, objInc, objPush, objPull, f){
    let changeObj = {};
    if(objSet  != undefined) changeObj['$set'] = objSet;
    if(objInc  != undefined) changeObj['$inc'] = objInc;
    if(objPush != undefined) changeObj['$push'] = objPush;
    if(objPull != undefined) changeObj['$pull'] = objPull;
    mongo.db(process.env.UNIVERSE_NAME).collection("jugadores").findOneAndUpdate(
      {name: playerName}, changeObj,
      {returnOriginal: false},    // Hace que devuelva el objeto modificado, no el original
      (err, res) => {
        if(err) throw err;
        f(res.value);
    });
  },

  // Escribe informacion en un planeta, si un objeto es 'undefined' la informacion de ese objeto la deja intacta
  //  -cord = Coordenadas del planeta a cambiar informacion
  //  -resources = Recursos a poner en el planeta
  //  -building = Edificios a poner en el planeta
  //  -fleet = Naves a poner en el planeta
  //  -defenses = Defensas a poner en el planeta
  //  -moon = Objeto con la informacion de la nueva luna del planeta
  setPlanetData: function(cord, resources = undefined, buildings = undefined, fleet = undefined, defenses = undefined, moon = undefined){
    let setObj = {};
    if(resources != undefined) setObj['planets.$.resources'] = resources;
    if(buildings != undefined) setObj['planets.$.buildings'] = buildings;
    if(fleet     != undefined) setObj['planets.$.fleet']     = fleet;
    if(defenses  != undefined) setObj['planets.$.defense']   = defenses;
    if(moon      != undefined) setObj['planets.$.moon']      = moon;
    mongo.db(process.env.UNIVERSE_NAME).collection("jugadores").updateOne(
      {planets :{$elemMatch: {coordinates: cord}}},
      {$set: setObj});
  },

  // Escribe informacion en una luna, si un objeto es 'undefined' la informacion de ese objeto la deja intacta
  //  -cord = Coordenadas del planeta a cambiar informacion
  //  -resources = Recursos a poner en la luna
  //  -building = Edificios a poner en la luna
  //  -fleet = Naves a poner en la luna
  setMoonData: function(cord, resources = undefined, buildings = undefined, fleet = undefined){ // Asume el planeta tiene luna, de lo contrario no hace nada
    let setObj = {};
    if(resources != undefined) setObj['planets.$.moon.resources'] = resources;
    if(buildings != undefined) setObj['planets.$.moon.buildings'] = buildings;
    if(fleet != undefined) setObj['planets.$.moon.fleet'] = fleet;
    mongo.db(process.env.UNIVERSE_NAME).collection("jugadores").updateOne(
      {planets :{$elemMatch: {coordinates: cord}}},
      {$set: setObj});
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
      {planets :{$elemMatch: {coordinates: cord}}},
      {$inc: incObj}, (err, result) => {
        if(err) throw err;
        if(f != undefined) f();
      });
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
      {planets :{$elemMatch: {coordinates: cord}}},
      {$set: objSet});
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
      this.savePlayerData(player.name, undefined, undefined, undefined, objPull, () => {
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
      {planets :{$elemMatch: {coordinates: cord}}},
      {$set: setObj, $inc: incObj}, (err, res) => {
        if(err) throw err;
      });
  },

  // Manda un mensaje al jugador con el nombre 'playerName'
  //  -playerName = Nombre del jugador al que se le manda el mensage
  //  -info = Objeto con la informacion del mensaje, debe tener los campos 'type', 'title', 'text', 'info'
  sendMessage: function(playerName, info) {
    let newMessage = {date: new Date().toString().slice(0,24), type: info.type, title: info.title, text: info.text, data: info.data};
    // Si el mensage es para el jugador actual le incremento la cantidad de mensages no leidos
    if(playerName == uni.player.name) uni.player.messagesCant++;
    this.savePlayerData(playerName, undefined, {messagesCant: 1}, {messages: newMessage}, undefined, () => {});
  },

  // Elimina todos los mensages de un tipo o un mensage con una fecha especifica
  //  -playerName = Nombre del jugador a borrar los mensages
  //  -all = Si elimina todos los mensages de un tipo o no
  //  -borra = Numero del tipo de mensage a eliminar o la fecha del mensage a eliminar
  deleteMessage: function(playerName, all, borra) {
    let obj = (all == true) ? {type: parseInt(borra)} : {date: borra};
    mongo.db(process.env.UNIVERSE_NAME).collection("jugadores").updateOne(
      {name: playerName},
      {$pull: {messages: obj}},
      {multi: true});
  },

  // Guarda el contador de mensages no leidos en 0 del jugador actual
  setNoReadMessages: function(){
    uni.player.messagesCant = 0;
    this.savePlayerData(uni.player.name, {messagesCant: 0}, undefined, undefined, undefined, () => {});
  },

  // Envia el reporte de espionage del planeta en 'coor' al jugador 'playerName'
  //  -playerName = Nombre del jugador que esta espiando
  //  -coor = Coordenadas del planeta o luna que se esta espiando
  //  -indiceDeEspionage = Numero que indica cuanta informacion se obtiene del espiado
  //  -moon = Booleano que es true si se espia la luna y false si se espia el planeta
  sendSpyReport: function(playerName, coor, indiceDeEspionage, moon){
    mongo.db(process.env.UNIVERSE_NAME).collection("jugadores").findOne(   // Busco el jugador que tiene el planeta a espiar
      {planets: {$elemMatch: {coordinates: coor}}},
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
    let cursor = mongo.db(process.env.UNIVERSE_NAME).collection("jugadores").find(
      {planets :{$elemMatch: {coordinatesCod: gal+'_'+sys}}});

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

  // Dado el nombre de un jugador y devuelve las coordenadas de todos sus planetas
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
    let newPosition;
    let i = 1;
    let cursor = mongo.db(process.env.UNIVERSE_NAME).collection("jugadores").find({}).sort({"puntos": -1});
    cursor.forEach((doc, err) => {
      if(doc.name === uni.player.name) newPosition = i;
      listInfo.push({name: doc.name,
                     coor: doc.planets[0].coordinates,
                     points: doc.puntos,
                     rank: doc.highscore,
                     lastRank: doc.lastHighscore});
      i++;
    }, () => {
      mongo.db(process.env.UNIVERSE_NAME).collection("jugadores").updateOne(
        {name: uni.player.name},
        {$set: {highscore: newPosition}});
      res.send({ok: true, info: listInfo, newPos: newPosition});
    });
  },

  // Guarda los recursos reciclados de una flota en un campo de escombros y devuelve como quedaron los escombros
  //  -playerName = Nombre del jugador dueno de la flota
  //  -debris = Objeto con los escombros a reciclar
  //  -movment = El movment que esta reciclando
  recicleDebris: function(playerName, debris, movement){
    if(debris.active){
      // Calcula cuanto puede cargar como maximo los recicladores, esta dado por el
      // minimo entre el espacio libre en las naves y la pacidad de todos los recicladores juntos
      let espacioLibre = uni.fun.espacioLibre(movement);
      let capacidadDeCarga = Math.min(20000*movement.ships.recycler, espacioLibre); // Calculo cuantos recursos entran en los recicladores
      let newResources = uni.fun.cargaEscombros(debris, capacidadDeCarga);
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
        {planets: {$elemMatch: {coordinates: coor}}},
        objBase,
        (err, res) => {
          if(err) throw err;
        });
    }
  },

  // Updatea los niveles de produccion y de energia de un planeta
  //  -coor = Coordenadas del planeta a actualizar
  //  -objSet = Objeto con la informacion de que variables se updatean
  //  -f = Funcion a ejecutar despues al terminar la funcion
  updateResourcesDataBase: function(coor, objSet, f){
    mongo.db(process.env.UNIVERSE_NAME).collection("jugadores").updateOne(
      {planets: {$elemMatch: {coordinates: coor}}},
      {$set: objSet}, () => {
        f();
    });
  },

  // Agrega un movement a la lista de movements de un jugador
  //  -cord = El movement se agrega al jugador que tenga el planeta en estas coordenadas
  //  -objInc = Objeto con los recursos y naves que salieron del planeta
  //  -objPush = Objeto don la informacion del nuevo movement a pushear
  pushMovementToDataBase: function(cord, objInc, objPush){
    mongo.db(process.env.UNIVERSE_NAME).collection("jugadores").updateOne(
      {planets: {$elemMatch: {coordinates: cord}}},
      {$push: objPush, $inc: objInc});
  },

  // Cambia la hora de llegada e informacion de un movement en la base de datos para que esta flota vuelva al planeta del que salio
  //  -player = Objeto con la infomacion sobre el jugador
  //  -res = Objeto con la respuesta a enviar al cliente, si es undefined no se envia ninguna respuesta
  //  -time = Cantidad de segundos que va a tardar la flota en regresar al planeta
  //  -resources = Recursos que va a tener el movement
  //  -ships = Naves que vuelven
  returnFleetInDataBase: function(player, num, res = undefined, time = undefined, resources = undefined, ships = undefined){
    if(uni.fun.validInt(num) && num >= 0 && num < player.movement.length){
      let actual = uni.fun.horaActual();
      if(player.movement[num].ida && player.movement[num].mission != 6 && !(player.movement[num].mission == 0 && actual >= player.movement[num].llegada)){
        let updateObj = {};
        let updateObjAux = player.movement[num]; // Voy a pushear el mismo elemento pero a cambiarle algunas cosas claves
        if(time == undefined){
          time = Math.ceil((actual - updateObjAux['time'])/1000); // Tiempo que esa flota estuvo volando
        }
        let oldTime    = updateObjAux.time;
        let oldLlegada = updateObjAux.llegada;
        if(ships != undefined){
          ships.misil = 0;
          updateObjAux['ships'] = ships;
        }
        if(resources != undefined) updateObjAux['resources'] = resources;
        updateObjAux.ships['misil'] = 0;
        updateObjAux['ida']         = false;
        updateObjAux['duracion']    = time;
        updateObjAux['time']        = actual;
        updateObjAux['llegada']     = actual + time*1000;
        updateObj["movement"]       = updateObjAux;
        if(res != undefined){
          uni.events.remove({time: oldLlegada, player: player.name});
          if(player.movement[num].mission >= 5){
            uni.events.remove({time: oldLlegada - 1000, player: uni.fun.playerName(uni.allCord, player.movement[num].coorHasta)});
          }
        }
        uni.events.addElement({time: updateObjAux['llegada'], player: player.name});
        player.movement[num] = updateObjAux; // Actualizo la flota de la lista de flotas volando
        mongo.db(process.env.UNIVERSE_NAME).collection("jugadores").updateOne(
          {name: player.name, "movement.time": oldTime, "movement.llegada": oldLlegada},
          {$set: {"movement.$": updateObjAux}}, (err, resBD) => {
            if(err) throw err;
            if(res != undefined) res.send({ok: true});
        });
      }else{
        if(res != undefined) res.send({ok: false, mes: "El viaje ya esta regresando"});
      }
    }else{
      if(res != undefined) res.send({ok: false, mes: "Numero de flota invalido"});
    }
  },

  // Agrega un movement de regreso
  //  -movement = Objeto del movement que regresa
  //  -newResources = Recursos con los que regresa el movement
  //  -newShips = Naves que regresan en el ship
  returnFleet: function(movement, newResources = undefined, newShips = undefined){
    let actual = uni.fun.horaActual();
    let newTime = (movement.llegada - movement.time)/1000;  // Calculo el tiempo que tarda en regresar la flota
    newTime -= (actual - movement.llegada)/1000;
    if(newTime < 0) newTime = 0;
    let pushObj = {};
    pushObj.movement = movement;
    if(newShips     != undefined) pushObj.movement.ships = newShips;
    if(newResources != undefined) pushObj.movement.resources = newResources;
    pushObj.movement.ships.misil = 0;
    pushObj.movement.ida         = false;
    pushObj.movement.duracion    = newTime;
    pushObj.movement.time        = actual
    pushObj.movement.llegada     = actual + newTime*1000;
    uni.events.addElement({time: pushObj.movement.llegada, player: uni.fun.playerName(uni.allCord, movement.coorDesde)});
    mongo.db(process.env.UNIVERSE_NAME).collection("jugadores").updateOne(
      {planets :{$elemMatch: {coordinates: movement.coorDesde}}},
      {$push: pushObj});
  },

  // Cuenta los puntos de un jugador
  //  -playerName = Nombre del jugador al que se le cuentan los puntos
  contPoint: function(playerName){
    mongo.db(process.env.UNIVERSE_NAME).collection("jugadores").findOne({name: playerName}, (err, res) => {
      if(err) throw err;
      /* no cuenta los puntos de las naves en vuelo */
      /* puede explotar*/
      let puntos = 0;
      let maxLevel = 0;
      let costShipyard = uni.fun.costShipsAndDefenses();
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
          /* Se puede indefinir costShipyard[obj] */
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
        if(res.planets[i].active){ // Suma los recursos de la luna
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
      /* Deberia sumar los puntos de las flotas que estan en movimiento */
      this.savePlayerData(playerName, {'puntos': Math.floor(puntos/1000), puntosAcum: (puntos%1000)}, undefined, undefined, undefined, () => {});
    });
  },

  // Busca al jugador con que tiene el planeta en las coordenadas 'cord' y ejecuta una funcion con ese jugador
  //  -cord = Coordenas del planeta a buscar
  //  -f = Funcion a ejecutar despues de encontrar al jugador
  findAndExecute: function(cord, f){
    mongo.db(process.env.UNIVERSE_NAME).collection("jugadores").findOne(
      {planets: {$elemMatch: {coordinates: cord}}},
      (err, res) => {
        if(err) throw err;
        f(res);
    });
  },

  // Busca al jugador con que tiene el planeta en las coordenadas 'cord' y ejecuta una funcion con ese jugador
  //  -playerName = Nombre del jugador a buscar
  //  -f = Funcion a ejecutar despues de encontrar al jugador
  findAndExecuteByName: function(playerName, f){
    mongo.db(process.env.UNIVERSE_NAME).collection("jugadores").findOne(
      {name: playerName},
      (err, res) => {
        if(err) throw err;
        f(res);
    });
  },

  // Actualiza la posicion en el ranking de cada jugador y su estado de actividad
  updateAllHighscore: function(){
    let i = 1;
    let cursor = mongo.db(process.env.UNIVERSE_NAME).collection("jugadores").find({}).sort({"puntos": -1});
    cursor.forEach((doc, err) => {
      mongo.db(process.env.UNIVERSE_NAME).collection("jugadores").updateOne(
        {name: doc.name},
        {$set: {highscore: i, lastHighscore: doc.highscore, type: uni.fun.getTypeActive(doc.lastVisit)}});
      i++;
    }, () => {});
  },

  // Escribe datos en el planeta (Usada para debugear)
  //  -codr = Coordenadas del planeta a modificar
  setPlanetDataDev: function(coor){
    let resources = {metal: 1000000, crystal: 100000, deuterium: 150000, energy: 0};
    let building = {metalMine: 0, crystalMine: 1, deuteriumMine: 0, solarPlant: 30, fusionReactor: 0, metalStorage: 10, crystalStorage: 9, deuteriumStorage: 8, robotFactory: 0, shipyard: 0, researchLab: 8, alliance: 0, silo: 0, naniteFactory: 0, terraformer: 0};
    let fleet = /*uni.fun.zeroShips();*/{lightFighter: 10, heavyFighter: 0, cruiser: 100, battleship: 10, battlecruiser: 0, bomber: 3, destroyer: 100, deathstar: 50, smallCargo: 500, largeCargo: 200, colony: 1000, recycler: 200, espionageProbe: 30, solarSatellite: 15};
    let defenses = /*uni.fun.zeroDefense();*/{rocketLauncher: 100, lightLaser: 10, heavyLaser: 0, gauss: 5, ion: 0, plasma: 0, smallShield: 0, largeShield: 0, antiballisticMissile: 3, interplanetaryMissile: 1000};
    let moon = /*{active: false, size: 0};*/uni.createNewMoon(8888);
    let debris = {active: true, metal:1000, crystal: 2000};
    mongo.db(process.env.UNIVERSE_NAME).collection("jugadores").updateOne(
      {planets :{$elemMatch: {coordinates: coor}}},
      {$set: {'planets.$.resources': resources,'planets.$.buildings': building, 'planets.$.fleet': fleet, 'planets.$.defense': defenses,'planets.$.moon': moon, 'planets.$.debris': debris}});
  },

  // Escribe datos en la luna (Usada para debugear)
  //  -codr = Coordenadas de la luna a modificar
  setMoonDataDev: function(coor){ // Asume el planeta tiene luna, de lo contrario no hace nada
    let resources = {metal: 500000, crystal: 4000000, deuterium: 1000000, energy: 0};
    let building = {lunarBase: 6, phalanx: 2, spaceDock: 0, marketplace: 1, lunarSunshade: 5, lunarBeam: 6, jumpGate: 2, moonShield: 0};
    let fleet = {lightFighter: 1000, heavyFighter: 0, cruiser: 1, battleship: 30, battlecruiser: 0, bomber: 0, destroyer: 0, deathstar: 100, smallCargo: 10, largeCargo: 200, colony: 0, recycler: 20, espionageProbe: 0, solarSatellite: 0};
    mongo.db(process.env.UNIVERSE_NAME).collection("jugadores").updateOne(
      {planets :{$elemMatch: {coordinates: coor}}},
      {$set: {'planets.$.moon.resources': resources,'planets.$.moon.buildings': building, 'planets.$.moon.fleet': fleet}});
  }
};

module.exports = exp;
