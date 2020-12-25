var objectId = require('mongodb').ObjectId;
var fun      = require('./funciones_auxiliares');
var mongo    = null;
var date     = new Date();
require('mongodb').MongoClient.connect(process.env.MONGO_URL, {useUnifiedTopology: true}, (err, db) => {
  if(err) throw err;
  mongo = db;
  exp.getUniverseData(process.env.UNIVERSE_NAME);//carga los datos del universo
  mongo.db(process.env.UNIVERSE_NAME).collection("jugadores").countDocuments({}, function(err, cant) {exp.cantPlayers = cant});
  exp.getPlayer(process.env.PLAYER, () => {console.log('\x1b[32m%s\x1b[0m', "Base de datos lista.");});
  /*setInterval(() => {// Actualiza cada 0.999 segundos el estado primario del universo
    date = new Date();
    if(date.getHours() == 0 && date.getMinutes() == 0 && date.getSeconds() == 0){
      console.log("Actualizacion diaria");
    }
  }, 999);*/
});
var exp = {
  universo: null,
  player: null,
  planeta: 0,
  moon: false,
  cantPlayers: 0,
  allCord: {},                  // Por cada planeta colonizado guardo un objeto 'infoPlanet' con la informacion basica exterior del planeta
  comienzoBusquedaNewConrd: 1,  // Apartir de que galaxia se ubican los nuevos planetas
  fun: fun,
  createUniverse: function(name, cant, data){
    this.setUniverseData(name, data);
    for(let i = 0 ; i<cant ; i++){
      this.addNewPlayer('bot_' + i, 2);
    }
  },
  setUniverseData: function(name, data) {
    data.name     = name;   // Setea el nombre del universo
    this.universo = data;   // Pone el objeto con toda la informacion del universo
    mongo.db(process.env.UNIVERSE_NAME).collection("universo").insertOne(data); // Guarda la info del universo
  },
  getUniverseData: function(name){
    let cursor = mongo.db(process.env.UNIVERSE_NAME).collection("universo").find();
    cursor.forEach((doc, err) => {
      if(err) throw err;
      this.universo = doc;
    });
  },
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
      this.allCord = obj;
      f();
    });
  },
  getPlayer: function(player, f) { // Obtiene el jugador con el nombre 'player' y despues ejecuta al funcion 'f'
    mongo.db(process.env.UNIVERSE_NAME).collection("jugadores").findOne({name: player}, (err, res) => {
      if(err) throw err;
      if(res == null){
        f();
      }else{
        this.player = res;        // Actualizo el player principal
        this.getListCord(() => {  // Cargo la lista de planetas colonizados
          this.updatePlayer(res.name, (respuesta) => {this.player = respuesta; f();}, true); // Actualiza los datos desde la ultima conecccion
        });
      }
    });
  },
  updatePlayer: function(player, f, help = false){
    let horaActual = fun.horaActual();
    let objSet = {};
    let objInc = {};
    let objPull = {movement: {llegada: {$lt: horaActual}}}; // Va a eliminar todos los movement que su llegada es menor que la hora actual
    let listShip = [];
    /* Arreglar el uso de 'help' */
    if(help == true){
      let timeLastUpdate = horaActual - this.player.lastVisit;
      let updateResourcesAddOfAllPlanets = false;
      objSet['puntosAcum'] = this.player.puntosAcum;

      if((this.player.researchConstrucction != false) && (this.player.researchConstrucction.time - Math.floor((horaActual - this.player.researchConstrucction.init)/1000) <= 0)){
        objSet['researchConstrucction'] = false;
        objSet['puntosAcum'] += this.player.researchConstrucction.metal + this.player.researchConstrucction.crystal + this.player.researchConstrucction.deuterium;
        objInc['research.' + this.player.researchConstrucction.item] = 1;
        this.player.research[this.player.researchConstrucction.item] += 1;
        if(this.player.researchConstrucction.item == 'energy' || this.player.researchConstrucction.item == 'plasma') updateResourcesAddOfAllPlanets = true;
        if(this.player.researchConstrucction.item == 'espionage'){
          for(let i = 0 ; i<this.player.planets.length ; i++){
            this.allCord[this.player.planets[i].coordinates.gal+'_'+this.player.planets[i].coordinates.sys+'_'+this.player.planets[i].coordinates.pos].espionage += 1;
          }
        }
      }

      // Por cada planeta actualiza los datos de ese planeta y si tiene luna tambien la actualiza
      for(let i = 0 ; i<this.player.planets.length ; i++){
        let updateDataThisPlanet = false; // se fija que en ese planeta se halla terminado una contruccion, si es asi actualiza los campos y los valores

        if((this.player.planets[i].buildingConstrucction != false) && (this.player.planets[i].buildingConstrucction.time - Math.floor((horaActual - this.player.planets[i].buildingConstrucction.init)/1000) <= 0)){
          objSet['planets.' + i + '.buildingConstrucction'] = false;
          objSet['puntosAcum'] += this.player.planets[i].buildingConstrucction.metal + this.player.planets[i].buildingConstrucction.crystal + this.player.planets[i].buildingConstrucction.deuterium;
          objInc['planets.' + i + '.campos'] = 1;
          objInc['planets.' + i + '.buildings.' + this.player.planets[i].buildingConstrucction.item] = 1;
          updateDataThisPlanet = true;
          this.player.planets[i].buildings[this.player.planets[i].buildingConstrucction.item] += 1;
          if(this.player.planets[i].buildingConstrucction.item == "terraformer") objInc['planets.' + i + '.camposMax'] = 5;
        }

        if(this.player.planets[i].moon.active == true && this.player.planets[i].moon.buildingConstrucction != false && (this.player.planets[i].moon.buildingConstrucction.time - Math.floor((horaActual - this.player.planets[i].moon.buildingConstrucction.init)/1000) <= 0)){
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
            if(timeLastUpdateAux < 0){ // No termino ni la primer nave de la lista
              // Actualiza timeNow y no hace nada mas
              this.player.planets[i].shipConstrucction[0].timeNow -= timeLastUpdate/1000;
              listShip = this.player.planets[i].shipConstrucction;
            }else{ // Contruyo la primer nave y va por el resto
              let lugar = this.player.planets[i].shipConstrucction[0].def ? '.defense.' : '.fleet.';
              this.player.planets[i].shipConstrucction[0].cant      -= 1;
              this.player.planets[i].shipConstrucction[0].metal     -= this.player.planets[i].shipConstrucction[0].metalOne;
              this.player.planets[i].shipConstrucction[0].crystal   -= this.player.planets[i].shipConstrucction[0].crystalOne;
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
          this.updateResourcesData(() => {}, i); // Updatea la energia y resourcesAdd
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
      // Me fijo cuales flotar regresaron y actualizo esos datos
      for(let i = 0 ; i<this.player.movement.length ; i++){
        if(this.player.movement[i].llegada < horaActual){ // Si esta flota llego a destino
          if(this.player.movement[i].ida){
            let newTime = 0;
            switch (this.player.movement[i].mission) {
            case 1: // Colonizacion
              this.player.movement[i].ships.colony -= 1;
              let resColonia = this.colonize(this.player.movement[i].coorHasta, this.player.name, this.player.movement[i].resources, this.player.movement[i].ships);
              // Informo con un mensaje que paso
              let infoMes = {type: 3, title: "Colonization", text: "", data: {}};
              if(resColonia){ // Colonizo bien, mando mensaje de felicitaciones
                infoMes.text = "Congratulations, you have a new colony!!!";
              }else{ // Fallo en la colonizacion, la flota se perdio e informo con un mensaje
                infoMes.text = "Something went wrong. The comunication with the fleet has been lost...";
              }
              this.sendMessage(this.player.name, infoMes);
              break;

            case 2: // Reciclaje
              if(fun.estaColonizado(this.allCord, this.player.movement[i].coorHasta)){ // Si el planeta esta colonizado
                mongo.db(process.env.UNIVERSE_NAME).collection("jugadores").findOne(   // Busco el objeto de los escombros que estoy intentando reciclar
                  {planets :{$elemMatch: {coordinates: {
                    gal: this.player.movement[i].coorHasta.gal,
                    sys: this.player.movement[i].coorHasta.sys,
                    pos: this.player.movement[i].coorHasta.pos}}}},
                  (err, res) => {
                    if(err) throw err;
                    let indexPlanet = fun.getIndexOfPlanet(res.planets, this.player.movement[i].coorHasta);
                    let newDebris = this.recicleDebris(res.planets[indexPlanet].debris, this.player.movement[i]);  // Reciclo los escombros
                    if(newDebris != undefined){ // Guardo los nuevos escombros
                      this.saveDebris(this.player.movement[i].coorHasta, newDebris, false);
                    }
                });
              }
              // La flota vuelve sin nada, si recicla recursos, se le agregan despues en la funcion de arriba
              newTime = (this.player.movement[i].llegada - this.player.movement[i].time)/1000;  // Calculo el tiempo que va a tardar el viaje en completarse
              newTime -= (horaActual - this.player.movement[i].llegada)/1000;                   // Le resto el tiempo que ya paso
              if(newTime < 0) newTime = 0;
              this.returnFleetInDataBase(i, undefined, newTime, this.player.movement[i].resources, undefined);
              break;

            case 3: // Transporte
              if(fun.estaColonizado(this.allCord, this.player.movement[i].coorHasta)){
                this.addPlanetData(this.player.movement[i].coorHasta, this.player.movement[i].resources, {}, this.player.movement[i].destination == 2);
              }
              newTime = (this.player.movement[i].llegada - this.player.movement[i].time)/1000;  // Calculo el tiempo que va a tardar el viaje en completarse
              newTime -= (horaActual - this.player.movement[i].llegada)/1000;                   // Le resto el tiempo que ya paso
              if(newTime < 0) newTime = 0;  // Si el tiempo dio negativo, la flota ya tendria que haber vuelto
              this.returnFleetInDataBase(i, undefined, newTime, fun.zeroResources(), undefined);
              break;

            case 4: // Despliege
              // Si hay un planeta colonizado en esa posicion, la flota se queda ahi, en caso contrario la flota se pierde
              if(fun.estaColonizado(this.allCord, this.player.movement[i].coorHasta)){
                this.addPlanetData(this.player.movement[i].coorHasta, this.player.movement[i].resources, this.player.movement[i].ships, this.player.movement[i].destination == 2);
              }else{
                let infoMes = {type: 3, title: "Failed deployment", text: "The deployment has failed. The comunication with the fleet has been lost...", data: {}};
                this.sendMessage(this.player.name, infoMes);
              }
              break;

            case 5: // Espionage
              if(fun.estaColonizado(this.allCord, this.player.movement[i].coorHasta)){ // Calculo la probabilidad de que destruyan a las sondas de espionage
                let nameEspia = fun.playerName(this.allCord, this.player.movement[i].coorDesde);
                let difEspionageLevel = this.allCord[this.player.movement[i].coorHasta.gal+'_'+this.player.movement[i].coorHasta.sys+'_'+this.player.movement[i].coorHasta.pos].espionage - this.allCord[this.player.movement[i].coorDesde.gal+'_'+this.player.movement[i].coorDesde.sys+'_'+this.player.movement[i].coorDesde.pos].espionage;
                let probabilityDetected = Math.floor(Math.pow(2, difEspionageLevel - 2) * this.player.movement[i].ships.espionageProbe);
                if(probabilityDetected < Math.floor(Math.random()*100)){ // Si no descubren a las sondas de espionage
                  // Uso el indice de espionage para mandar en reporte de espionage
                  let indiceDeEspionage = Math.sign(difEspionageLevel) * Math.pow(difEspionageLevel, 2) + this.player.movement[i].ships.espionageProbe;
                  this.sendSpyReport(nameEspia, this.player.movement[i].coorHasta, indiceDeEspionage, this.player.movement[i].destination == 2);
                }else{
                  // Calculo los escombros a agregar y los guardo
                  let newDebris = {metal: 0, crystal: Math.floor(10000 * this.player.movement[i].ships.espionageProbe / this.universo.fleetDebris)};
                  this.saveDebris(this.player.movement[i].coorHasta, newDebris, true);

                  // Aviso a los jugadores lo que paso
                  /* Completar los mesajes de espionage */
                  let nameEspiado = fun.playerName(this.allCord, this.player.movement[i].coorHasta);
                  if(nameEspia != nameEspiado){
                    let infoMesEspiado = {type: 4, title: "Spy captured", text: this.player.movement[i].ships.espionageProbe + " Espionages probes has been destroyed in ", data: {}};
                    this.sendMessage(nameEspiado, infoMesEspiado);
                  }
                  let infoMesDestruido = {type: 4, title: "Spy failed", text: "Your espionages probes has been destroyed in ", data: {}};
                  this.sendMessage(nameEspia, infoMesDestruido);

                  // Si hay mas naves ademas de las sondas, las devuelvo a su planeta
                  this.player.movement[i].ships.espionageProbe = 0;
                  if(fun.isZeroObj(this.player.movement[i].ships)){
                    break;  // Como no hay naves salgo de switch sin regresar la flota
                  } // Las sondas no vuelven pero el resto de la flota si
                }
              }
              newTime = (this.player.movement[i].llegada - this.player.movement[i].time)/1000;  // Calculo el tiempo que va a tardar el viaje en completarse
              newTime -= (horaActual - this.player.movement[i].llegada)/1000;                   // Le resto el tiempo que ya paso
              if(newTime < 0) newTime = 0;                                                      // Si el tiempo dio negativo, la flota ya tendria que haber vuelto
              this.returnFleetInDataBase(i, undefined, newTime, undefined, this.player.movement[i].ships);
              break;

            case 6: // Misil
              // Me fijo que el planeta este colonizado y que el misil se haya enviado a un planeta (las lunas y escombros no se pueden misilear)
              if(fun.estaColonizado(this.allCord, this.player.movement[i].coorHasta) && this.player.movement[i].destination == 1){
                mongo.db(process.env.UNIVERSE_NAME).collection("jugadores").findOne(   // Busco el planeta al que estoy misileando
                  {planets :{$elemMatch: {coordinates: {
                    gal: this.player.movement[i].coorHasta.gal,
                    sys: this.player.movement[i].coorHasta.sys,
                    pos: this.player.movement[i].coorHasta.pos}}}},
                  (err, res) => {
                    if(err) throw err;
                    let indexPlanet = fun.getIndexOfPlanet(res.planets, this.player.movement[i].coorHasta);
                    let objMisAttack = fun.misilAttack(res.planets[indexPlanet].defense, this.player.movement[i].ships.misil, res.research.armour, this.player.research.weapons);

                    // Guardo las nuevas defensas del planeta atacado
                    this.setPlanetData(this.player.movement[i].coorHasta, undefined, undefined, undefined, objMisAttack.survivorDefenses, undefined);

                    // Informo al atacado y a el si le digo lo que defensas se rompieron, NO informo al atacante ya que no hay nada que informar
                    let infoMesDestruido = {type: 4, title: "Misil attack", text: "", data: {}};
                    if(objMisAttack.attackedDef){
                      let aux = objMisAttack.survivorDefenses.interplanetaryMissile;
                      objMisAttack.survivorDefenses.interplanetaryMissile = 0;
                      /* Completar bien los mensajes sobre los misiles, indicar que planeta atacaron */
                      if(fun.isZeroObj(objMisAttack.survivorDefenses)){
                        infoMesDestruido.text = "The player fulanito had attacked you with missils, every defense is destroyed.";
                      }else{
                        infoMesDestruido.text = "The player fulanito had attacked you with missils, los danos fueron: ";
                        objMisAttack.survivorDefenses.interplanetaryMissile = aux;
                      }
                    }else{
                      infoMesDestruido.text = "The player fulanito had attacked you with missils, but the Anti-Balistic missils worked fine.";
                    }
                    this.sendMessage(res.name, infoMesDestruido);
                });
              }
              break;

            case 7: // Ataque
            case 8: // Moon Destruction
              /* Si estoy atacando la luna se tiene qeu fijar que halla luna */
              if(fun.estaColonizado(this.allCord, this.player.movement[i].coorHasta)){
                mongo.db(process.env.UNIVERSE_NAME).collection("jugadores").findOne(   // Busco el planeta al que estoy misileando
                  {planets :{$elemMatch: {coordinates: {
                    gal: this.player.movement[i].coorHasta.gal,
                    sys: this.player.movement[i].coorHasta.sys,
                    pos: this.player.movement[i].coorHasta.pos}}}},
                  (err, res) => {
                    if(err) throw err;
                    let indexPlanet = fun.getIndexOfPlanet(res.planets, this.player.movement[i].coorHasta);
                    if(this.player.movement[i].destination == 2 && !res.planets[indexPlanet].moon.active){
                      // Si se ataca una luna que ya no existe (por un error o porque fue destruida), la flota vuelve
                      newTime = (this.player.movement[i].llegada - this.player.movement[i].time)/1000;  // Calculo el tiempo que va a tardar el viaje en completarse
                      newTime -= (horaActual - this.player.movement[i].llegada)/1000;                   // Le resto el tiempo que ya paso
                      if(newTime < 0) newTime = 0;                                                      // Si el tiempo dio negativo, la flota ya tendria que haber vuelto
                      this.returnFleetInDataBase(i, undefined, newTime, undefined, this.player.movement[i].ships);
                      /* Aviso que la luna que se intento atacar ya no esta mas */
                      return null;
                    }
                    let defenses = {};
                    let defenderFleet = {};
                    let destroyedMoon = false;
                    if(this.player.movement[i].destination == 2){ // Si se ataca a la luna
                      defenses = fun.zeroDefense();
                      defenderFleet = res.planets[indexPlanet].moon.fleet;
                    }else{ // Si se ataca al planeta
                      defenses = res.planets[indexPlanet].defense;
                      defenderFleet = res.planets[indexPlanet].fleet;
                    }

                    // Simula la batalla
                    let objAttack = fun.battle(this.player.movement[i].ships, defenderFleet, defenses, this.player.research, res.research, this.universo.rapidFire);

                    let newDebris = fun.calcularEscombros(objAttack, {atkShips: this.player.movement[i].ships, defShips: defenderFleet, defDefenses: defenses}, this.universo.fleetDebris, this.universo.defenceDebris);
                    let newMoonObj = undefined;
                    if(!res.planets[indexPlanet].moon.active){ // Si no tiene luna, me fijo si se genera una luna en ese planeta
                      let lunaChance = fun.lunaChance(newDebris, this.universo.maxMoon);
                      if(lunaChance > Math.floor(Math.random() * 100)){
                        let moonSize = (this.universo.maxMoon == lunaChance) ? 9999 : Math.floor(fun.normalRandom(6999, 9999, 6999, 9999));
                        newMoonObj = this.createNewMoon(moonSize);
                        // Le mando un mesage avisandole que tiene una nueva luna
                        this.sendMessage(res.name, {type: 4, title: "New Moon", text: "Vamos nueva luna en... ", data: {}});
                      }
                    }

                    let stolenResources = fun.zeroResources();
                    let recursosCargados;
                    switch (objAttack.result) {
                      case 1: // Gano el atante
                        console.log("Gano el atacante");
                        let recursos;
                        if(this.player.movement[i].destination == 2){
                          // Intento destruir la luna del atacado
                          recursos = {...res.planets[indexPlanet].moon.resources};  // Copio el objeto con los recursos de la luna
                          if(this.player.movement[i].mission == 8 && objAttack.atkShips.deathstar > 0){
                            // Calculo las estrellas de la muerte que caen en destrir la luna
                            let destroyPercentage = (100 - Math.sqrt(res.planets[indexPlanet].moon.size))*Math.sqrt(objAttack.atkShips.deathstar) + this.player.research.graviton;
                            destroyPercentage = destroyPercentage / (res.planets[indexPlanet].moon.buildings.moonShield + 1);
                            objAttack.atkShips.deathstar -= Math.floor(Math.sqrt(res.planets[indexPlanet].moon.size) * Math.random() * 0.6);
                            if(objAttack.atkShips.deathstar < 0) objAttack.atkShips.deathstar = 0;
                            if(destroyPercentage > Math.random()*100){ // Se destruye la luna
                              destroyedMoon = true;
                              /* Aviso que le destruyeron la luna */
                            }else{
                              /* Aviso que la destruccion de luna fallo*/
                            }
                          }
                        }else{
                          recursos = {...res.planets[indexPlanet].resources}; // Copio el objeto con los recursos del planeta
                        }
                        if(!fun.isZeroObj(objAttack.atkShips)){ // Si toda la flota que sobrevivio se destruyo en la destruccion de la luna, no regresa nada
                          // Cargo los recursos robados (los recursos del planeta son pasados por copia, ya que la funcion los rompe)
                          recursosCargados = fun.loadResourcesAttack(objAttack.atkShips, recursos, this.player.movement[i].resources);
                          stolenResources = recursosCargados.saqueado;
                          // Regresan el resto de las naves
                          this.returnFleet(this.player.movement[i], recursosCargados.newCarga, objAttack.atkShips);
                        }
                        /* Informo con mensajes de lo ocurrido */
                        break;
                      case 2: // Gano el defensor
                        console.log("Gano el defensor");
                        /* Informo con mensajes de lo ocurrido */
                        break;
                      default: // Empate
                        console.log("Empate");
                        // Como podrian morir algunas naves la capacidad de carga es menor, me fijo si se perdieron algunos recursos que se llevaban
                        let movementAux = {ships: objAttack.atkShips, resources: fun.zeroResources()};
                        recursosCargados = fun.loadResources(movementAux, this.player.movement[i].resources);
                        // Regresan las naves que sobrevivieron
                        this.returnFleet(this.player.movement[i], recursosCargados, objAttack.atkShips);
                        /* Informo con mensajes de lo ocurrido */
                    } // Actualizo el planeta del defensor
                    for(let item in stolenResources){
                      if(this.player.movement[i].destination == 2){
                        res.planets[indexPlanet].moon.resources[item] -= stolenResources[item];
                      }else{
                        res.planets[indexPlanet].resources[item] -= stolenResources[item];
                      }
                    }
                    if(this.player.movement[i].destination == 2){
                      if(destroyedMoon){
                        newMoonObj = {active: false, size: 0};
                        this.setPlanetData(res.planets[indexPlanet].coordinates, undefined, undefined, undefined, undefined, newMoonObj);
                      }else{
                        this.setMoonData(res.planets[indexPlanet].coordinates, res.planets[indexPlanet].moon.resources, undefined, objAttack.defShips);
                      }
                    }else{
                      this.setPlanetData(res.planets[indexPlanet].coordinates, res.planets[indexPlanet].resources, undefined, objAttack.defShips, objAttack.defDefenses, newMoonObj);
                    }
                    this.saveDebris(res.planets[indexPlanet].coordinates, newDebris, true);
                });
              }else{ // Se intento atacar un planeta no colonizado y la flota vuelve sin nada
                newTime = (this.player.movement[i].llegada - this.player.movement[i].time)/1000;  // Calculo el tiempo que va a tardar el viaje en completarse
                newTime -= (horaActual - this.player.movement[i].llegada)/1000;                   // Le resto el tiempo que ya paso
                if(newTime < 0) newTime = 0;                                                      // Si el tiempo dio negativo, la flota ya tendria que haber vuelto
                this.returnFleetInDataBase(i, undefined, newTime, undefined, this.player.movement[i].ships);
                /* Aviso que se intento atacar un planeta no colonizado */
              }
              break;

            default: // Expedition (0)
              let expObj = fun.expedition(this.player.movement[i].ships, this.player.research);
              if(!expObj.mueren){ // Si se destruyo toda la flota no hago nada, en caso contrario la devuelvo al planeta
                let newResources = this.player.movement[i].resources;
                if(expObj.evento == 5){ // Se encontraron recursos y los cargo a las naves
                  newResources = fun.loadResources(this.player.movement[i], expObj.resources);
                }
                newTime = (this.player.movement[i].llegada - this.player.movement[i].time)/1000;
                newTime += expObj.time;
                newTime -= (horaActual - this.player.movement[i].llegada)/1000;
                if(newTime < 0) newTime = 0;

                // Recordar que el objeto 'ships' se paso por referencia, por lo tanto ya esta actualizado
                this.returnFleetInDataBase(i, undefined, newTime, newResources, this.player.movement[i].ships);
                for(let j = 0 ; j<expObj.mensajes.length ; j++){ // Envio los mensajes de las expediciones
                  this.sendMessage(this.player.name, expObj.mensajes[j]);
                }
              }
            }
          }else{ // La flota llega al planeta de salida, guardo sus recursos y las naves
            let lunaString = (this.player.movement[i].moon) ? '.moon.' : '.'; // Me fijo si la flota va a la luna o al planeta
            let plaString = 'planets.' +  fun.getIndexOfPlanet(this.player.planets, this.player.movement[i].coorDesde) + lunaString;

            for(let item in this.player.movement[i].resources){ // Guardo los recursos
              if(item != 'misil') objInc[plaString + 'resources.' + item] = this.player.movement[i].resources[item];
            }
            for(let item in this.player.movement[i].ships){ // Guardo todas las naves
              objInc[plaString + 'fleet.' + item] = this.player.movement[i].ships[item];
            }
          }
        }
      }
      objSet.lastVisit = horaActual;    // Updatea la ultima vez que se actualizo este planeta
      this.savePlayerData(player, objSet, objInc, objPull, f);
    }else{
      mongo.db(process.env.UNIVERSE_NAME).collection("jugadores").findOne({name: player}, (err, res) => {
        if(err) throw err;
        /* tiene que hacer lo mismo que hace abajo pero en lugar de usar el objeto help usar el res que encontro
        se podria pasar todo a una sola funcion que le entre help o res dependiendo de lo que se nececite */
        f();
      });
    }
  },
  sendSpyReport: function(name, coor, indiceDeEspionage, moon){
    mongo.db(process.env.UNIVERSE_NAME).collection("jugadores").findOne(   // Busco el jugador que tiene el planeta a espiar
      {planets :{$elemMatch: {coordinates: {
        gal: coor.gal,
        sys: coor.sys,
        pos: coor.pos}}}},
      (err, res) => {
        if(err) throw err;
        let index = fun.getIndexOfPlanet(res.planets, coor);
        if(moon && !res.planets[index].moon.active) return null;
        // Agrego los recursos y el resto lo dejo sin definir para agregarlo despues si hace falta
        let dataEsp = moon ? {resources: res.planets[index].moon.resources} : {resources: res.planets[index].resources};
        if(indiceDeEspionage >= 2){
          // Agrego fleet
          dataEsp.fleet = moon ? res.planets[index].moon.fleet : res.planets[index].fleet;
          if(indiceDeEspionage >= 3){
            // Agrego defensa
            dataEsp.defense = moon ? fun.zeroDefense() : res.planets[index].defense;
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
        let report = {type: 2, title: "Espionage Report", text: "", data: dataEsp};
        this.sendMessage(name, report);
    });
  },
  recicleDebris: function(debris, movement){
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
        {name: this.player.name, "movement.time": movement.time, "movement.llegada": movement.llegada},
        {$inc: {"movement.$.resources.metal": newResources.metal, "movement.$.resources.crystal": newResources.crystal}}
      );
      // Devuelvo como quedo el campo de escombros reciclado
      return newDebris;
    }
    return undefined;
  },
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
        (err, res) => {});
    }
  },
  savePlayerData: function(player, objSet, objInc, objPull, f){ /* III Funcion de base de datos III */
    mongo.db(process.env.UNIVERSE_NAME).collection("jugadores").findOneAndUpdate(
      {name: player},
      {$set: objSet, $inc: objInc, $pull: objPull},
      {returnOriginal: false},
      (err, res) => {
        if(err) throw err;
        f(res.value);
    });
  },
  createNewPlanet: function(cord, planetName, playerName, playerTypeNew, initResources, initShips) {
    var typePlanet = fun.generateNewTypeOfPlanet(cord.pos, cord.sys % 2);
    return {idPlanet: Math.pow(500,2)*cord.gal + 500*cord.sys + cord.pos,
      coordinates: cord,
      coordinatesCod: cord.gal + '_' + cord.sys, // Cordenadas del planeta hecho string
      player: playerName,
      playerType: playerTypeNew,
      name: planetName, // Maximo 23 caracteres
      type: typePlanet.type,
      color: typePlanet.color,
      temperature: typePlanet.temperature,
      temperatureNormal: typePlanet.temperature,
      // Este numero esta dado pseudoaleatoriamente por la posicion del sistema solar en la que esta el planeta
      camposMax: typePlanet.campos,
      // Un planeta inicialmente no tiene campos ocupados
      campos: 0,
      buildingConstrucction: false,
      shipConstrucction: [],
      // Todo planeta empieza con 500 de metal y cristal mas lo que se traiga al colonizarlo
      resources: {metal: 500+initResources.metal, crystal: 500+initResources.crystal, deuterium: initResources.deuterium, energy: 0},
      // La produccion inicial de un planet nuevo es la base, de 30 de metal y 15 de cristal en un universo de velocidad 1
      resourcesAdd: {metal: 30*this.universo.speed, crystal: 15*this.universo.speed, deuterium: 0, energy: 0},
      resourcesPercentage: {metal: '10', crystal: '10', deuterium: '10', energy: '10'},
      // Al crear un planeta empieza con todos los edificios en nivel 0
      buildings: fun.zeroBuilding(),
      // Al crear un planeta empieza con todas las flotas y defensas en nivel 0
      fleet: initShips,
      defense: fun.zeroDefense(),
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
      // Porcentaje de funcionamiento de esos edificios, al principio no importa mucho porque estan a nivel 0
      values: {sunshade: 10, beam: 10},
      cuantic: 0,
      fleet: fun.zeroShips()
    }
  },
  addNewPlayer: function(name, styleGame) {
    let newCoor = exp.newCord();
    let newPlanet = exp.createNewPlanet(newCoor, "Planeta Principal", name, 'activo', fun.zeroResources(), fun.zeroShips());
    this.allCord[coor.gal+'_'+coor.sys+'_'+coor.pos] = {espionage: 0, playerName: name}; // Guardo el nivel de espionage del nuevo jugador en esa coordenada, o sea 0
    let newPlayer = {'name': name,
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
      research: fun.zeroResearch(),
      lastVisit: fun.horaActual(),  // Pone el tiempo actual
      type: "activo" // activo inactivo InactivoFuerte fuerte debil
    };
    this.cantPlayers++;//aumenta en uno la cantidad de jugadores del universo
    mongo.db(process.env.UNIVERSE_NAME).collection("jugadores").insertOne(newPlayer);//agrega al jugador a la lista de jugadores
  },
  newCord: function(rand = true) {
    // Busca un cordenada libre y la devuelve
    for(let gal = this.comienzoBusquedaNewConrd ; gal<=9; gal++){ // Comienza en la galaxia numero comienzoBusquedaNewConrd
      for(let sys = 1 ; sys<=499; sys++){
        for(let p = 5 ; p<=10; p++){
          if(this.allCord[gal+'_'+sys+'_'+p] == undefined && (!rand || Math.random() > 0.85)){
            return {gal: gal, sys: sys, pos: p};
          }
        }
      }
    }

    if(rand){
      return this.newCord(false); // Si no encontro ninguna coordenada aletoriamente busca la primera que este libre
    }else{
      // Si ya busco linealmente la primer coordenada libre y no hay, tira un mensaje de error y devuelve undefined
      console.log("No hay coordenada libre");
      return undefined;
    }
  },
  getActualBasicInfo: function(planet) {
    let resourcesObj = (this.moon) ? this.player.planets[planet].moon.resources : this.player.planets[planet].resources;
    let classObj = {};
    let firstMovement = this.getFirstMovementInfo();
    let objStorage = this.getAlmacen(planet, this.moon);
    if(resourcesObj.metal >= objStorage.metal){
      classObj.metal = 'overmark'; // Rojo
    }else{
      if(resourcesObj.metal >= objStorage.metal*4/5){
        classObj.metal = 'middlemark'; // Amarillo
      }else{
        classObj.metal = ''; // Normal
      }
    }
    if(resourcesObj.crystal >= objStorage.crystal){
      classObj.crystal = 'overmark'; // Rojo
    }else{
      if(resourcesObj.crystal >= objStorage.crystal*4/5){
        classObj.crystal = 'middlemark'; // Amarillo
      }else{
        classObj.crystal = ''; // Normal
      }
    }
    if(resourcesObj.deuterium >= objStorage.deuterium){
      classObj.deuterium = 'overmark'; // Rojo
    }else{
      if(resourcesObj.deuterium >= objStorage.deuterium*4/5){
        classObj.deuterium = 'middlemark'; // Amarillo
      }else{
        classObj.deuterium = ''; // Normal
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
      researchConstrucction: this.player.researchConstrucction,
      cantPlanets: this.player.planets.length,
      maxPlanets: this.player.maxPlanets,
      numPlanet: planet,
      planets: this.player.planets,
      moon: this.moon,
      sendEspionage: this.player.sendEspionage,
      sendSmall: this.player.sendSmall,
      sendLarge: this.player.sendLarge,
      format: fun.formatNumber,
      segundosATiempo: fun.segundosATiempo,
      missionNumToString: fun.missionNumToString,
      cantMovments: this.player.movement.length,
      nextFleetTime: firstMovement.time,
      nextFleetMission: firstMovement.mission
    };
  },
  getFirstMovementInfo: function(){
    let res = {time: 0, mission: ""};
    if(this.player.movement.length > 0){
      let min = 0;  // Busco el indice del proximo movement a terminar
      for(let i = 1 ; i<this.player.movement.length ; i++){
        if(this.player.movement[i].llegada < this.player.movement[min].llegada){
          min = i;
        }
      }
      res.time = this.player.movement[min].llegada;
      res.mission = fun.missionNumToString(this.player.movement[min].mission) + (this.player.movement[min].ida ? "" : " (R)");
    }
    return res;
  },
  getAlmacen: function(planet, moon = false){
    let res = {};
    if(moon == true){ // Si esta en la luna todos los almecenes estan en 0, ya que no importan
      res = {metal: 0, crystal: 0, deuterium: 0};
    }else{
      res = {metal:    5000 * Math.floor(2.5 * Math.pow(Math.E, 0.61 * this.player.planets[planet].buildings.metalStorage)),
            crystal:   5000 * Math.floor(2.5 * Math.pow(Math.E, 0.61 * this.player.planets[planet].buildings.crystalStorage)),
            deuterium: 5000 * Math.floor(2.5 * Math.pow(Math.E, 0.61 * this.player.planets[planet].buildings.deuteriumStorage))};
    }
    return res;
  },
  resourcesSetting: function(planet) {
    let spd = this.universo.speed;
    let minas = this.player.planets[planet].buildings;
    let temp = (this.player.planets[planet].temperature.max + this.player.planets[planet].temperature.min)/2;
    let maxEnergyAux = {metal: Math.floor(parseInt(this.player.planets[planet].resourcesPercentage.metal) * minas.metalMine * Math.pow(1.1, minas.metalMine)),
                        crystal: Math.floor(parseInt(this.player.planets[planet].resourcesPercentage.crystal) * minas.crystalMine * Math.pow(1.1, minas.crystalMine)),
                        deuterium: Math.floor(2 * parseInt(this.player.planets[planet].resourcesPercentage.deuterium) * minas.deuteriumMine * Math.pow(1.1, minas.deuteriumMine))};
    let auxEnergy = {solar: Math.floor(20 * minas.solarPlant * Math.pow(1.1,minas.solarPlant)),
                    fusion: Math.floor(3 * minas.fusionReactor * parseInt(this.player.planets[planet].resourcesPercentage.energy) * Math.pow(1.05 + 0.01*this.player.research.energy, minas.fusionReactor)),
                    fusionDeuterium: -Math.floor(minas.fusionReactor * parseInt(this.player.planets[planet].resourcesPercentage.energy) * Math.pow(1.1, minas.fusionReactor)),
                    satillite: Math.floor((temp+160)/6) * this.player.planets[planet].fleet.solarSatellite};
    let energyTotal = auxEnergy.solar + auxEnergy.fusion + auxEnergy.satillite;
    let totalEnergyUsage = maxEnergyAux.metal + maxEnergyAux.crystal + maxEnergyAux.deuterium;
    let energyUsage = {metal: Math.floor((totalEnergyUsage == 0) ? 0 : (maxEnergyAux.metal*energyTotal)/totalEnergyUsage),
                      crystal: Math.floor((totalEnergyUsage == 0) ? 0 : (maxEnergyAux.crystal*energyTotal)/totalEnergyUsage),
                      deuterium: Math.floor((totalEnergyUsage == 0) ? 0 : (maxEnergyAux.deuterium*energyTotal)/totalEnergyUsage)};
    energyUsage = {metal: ((energyUsage.metal > maxEnergyAux.metal) ? maxEnergyAux.metal : energyUsage.metal), crystal: ((energyUsage.crystal > maxEnergyAux.crystal) ? maxEnergyAux.crystal : energyUsage.crystal), deuterium: ((energyUsage.deuterium > maxEnergyAux.deuterium) ? maxEnergyAux.deuterium : energyUsage.deuterium)};
    return {basic: {metal: 30 * spd, crystal: 15*spd},
      values: this.player.planets[planet].resourcesPercentage,
      buildings: minas,
      solarSatelite: this.player.planets[planet].fleet.solarSatellite,
      mines: {metal: Math.floor(3*((isNaN(energyUsage.metal/maxEnergyAux.metal)) ? 0 : (energyUsage.metal/maxEnergyAux.metal)) * spd * parseInt(this.player.planets[planet].resourcesPercentage.metal) * minas.metalMine * Math.pow(1.1, minas.metalMine)),
              crystal: Math.floor(2*((isNaN(energyUsage.crystal/maxEnergyAux.crystal)) ? 0 : (energyUsage.crystal/maxEnergyAux.crystal)) * spd * parseInt(this.player.planets[planet].resourcesPercentage.crystal) * minas.crystalMine * Math.pow(1.1, minas.crystalMine)),
              deuterium: Math.floor(((isNaN(energyUsage.deuterium/maxEnergyAux.deuterium)) ? 0 : (energyUsage.deuterium/maxEnergyAux.deuterium)) * spd * parseInt(this.player.planets[planet].resourcesPercentage.deuterium) * minas.deuteriumMine * Math.pow(1.1, minas.deuteriumMine) * (1.36-0.004*temp))},
      energy: auxEnergy,
      maxEnergy: maxEnergyAux,
      usageEnergy: energyUsage,
      resourcesHour: this.player.planets[planet].resourcesAdd,
      storage: {metal: 5000*Math.floor(2.5*Math.pow(Math.E, 0.61*minas.metalStorage)),
               crystal: 5000*Math.floor(2.5*Math.pow(Math.E, 0.61*minas.crystalStorage)),
               deuterium: 5000*Math.floor(2.5*Math.pow(Math.E, 0.61*minas.deuteriumStorage))},
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
      cuanticTime: (this.player.planets[planet].moon.buildings.jumpGate == 0) ? 'Infinity' : this.player.planets[planet].moon.cuantic,
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
      points: fun.formatNumber(this.player.puntos)
    };
  },
  buildingsActualInfo: function (planet) {
    let res;
    if(this.moon){
      res = this.player.planets[planet].moon.buildings;
    }else{
      res = {buildings: this.player.planets[planet].buildings,
             solarSatellite: this.player.planets[planet].fleet.solarSatellite};
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
            moonShield: {metal: 9000000*Math.pow(3, build.moonShield), crystal: 5000000*Math.pow(3, build.moonShield), deuterium: 2000000*Math.pow(3, build.moonShield), energy: 0, tech: build.lunarBase >= 4 && research.graviton >= 1 && research.shielding >= 12, level: build.moonShield, name: "Moon Shield", description: "The ultimate defense system. Even the deathstar be afraid of the shield."},
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
            astrophysics: {metal: 4000*Math.pow(2, research.astrophysics), crystal: 8000*Math.pow(2, research.astrophysics), deuterium: 4000*Math.pow(2, research.astrophysics), energy: 0, tech: lab >= 3 && research.espionage >= 4 && research.impulse >= 3, level: research.astrophysics, name: "Astrophysics", description: "With an astrophysics research module, ships can undertake long expeditions. Every second level of this technology will allow you to colonise an extra planet."},
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
    let cantFleetAux = fun.getCantFleets(this.player);
    return {fleets: (moon) ? this.player.planets[planet].moon.fleet : this.player.planets[planet].fleet,
            speed: fun.getListSpeed(this.player.research.combustion, this.player.research.impulse, this.player.research.hyperspace_drive),
            misil: (moon) ? 0 : this.player.planets[planet].defense.interplanetaryMissile,
            expeditions: cantFleetAux.expeditions,
            maxExpeditions: Math.floor(Math.sqrt(this.player.research.astrophysics)),
            slot: cantFleetAux.fleets,
            maxSlot: this.player.research.computer + 1,
            vacas: this.player.vacas,
            movement: this.player.movement
    };
  },
  galaxyInfo: function(planet){
    let cantFleetAux = fun.getCantFleets(this.player);
    return {espionage: this.player.planets[planet].fleet.espionageProbe,
            recycler: this.player.planets[planet].fleet.recycler,
            small: this.player.planets[planet].fleet.smallCargo,
            large: this.player.planets[planet].fleet.largeCargo,
            slot: cantFleetAux.fleets,
            maxSlot: this.player.research.computer + 1
    };
  },
  systemInfo: function(res, gal, sys){
    let respuesta = {};
    for(let i = 1 ; i<=15 ; i++){
      respuesta['pos' + i] = {active: false};
    }
    let listaPosiblesVacas = fun.posiblesVacas(this.player.vacas, gal, sys);
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
                                    esVaca:        listaPosiblesVacas.includes(pos),
                                    estado:        "activo"}; /* Cambiar el estado activo siempre */
        }
      }
    }, () => {
      res.send(respuesta);
    });
  },
  getQuickAtackData: function(){
    return {esp: this.player.sendEspionage,
            small: this.player.sendSmall,
            large: this.player.sendLarge};
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
    if(fun.coordenadaValida(query.coor)){
      let elimino = false;
      for(let i = 0 ; i<this.player.vacas.length ; i++){ // Busco si el jugador agregado ya esta en la lista de vacas
        if(this.player.vacas[i].coordinates.gal == query.coor.gal && this.player.vacas[i].coordinates.sys == query.coor.sys && this.player.vacas[i].coordinates.pos == query.coor.pos){
          elimino = true;
          this.player.vacas.splice(i,1);
          i--;
        }
      }
      // Lo agrego a la lista con la informacion que vino del usuario, voy a confiar en que este la manda bien, en caso de no hacerlo el unico perjudicado es el mismo usuario
      if(!elimino && this.player.name != query.playerName){
        this.player.vacas.push({coordinates: {gal: query.coor.gal, sys: query.coor.sys, pos: query.coor.pos},
                                playerName:  query.playerName,
                                planetName:  query.planetName,
                                estado:      query.estado});
      }
      mongo.db(process.env.UNIVERSE_NAME).collection("jugadores").updateOne({name: this.player.name}, {$set: {vacas: this.player.vacas}}, (err) => {
        if(err) throw err;
        res.send({ok: true, deleted: elimino});
      });
    }else{
      res.send({ok: false, mes: "Coordenadas invalidas"});
    }
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
    mongo.db(process.env.UNIVERSE_NAME).collection("jugadores").updateOne({planets :{$elemMatch: {coordinates: {gal: cord.gal, sys: cord.sys, pos: cord.pos}}}}, {$set: objSet});
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
        buildingConstrucctionAux.init      = fun.horaActual();
        buildingConstrucctionAux.time      = fun.timeBuild(objPrice[buildingName].metal + objPrice[buildingName].crystal, objPrice.time.mult, objPrice.time.elev, this.universo.speed);
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
        buildingConstrucctionAux.init      = fun.horaActual();
        buildingConstrucctionAux.time      = fun.timeBuild(objPrice[buildingName].metal + objPrice[buildingName].crystal, objPrice.time.mult, objPrice.time.elev, this.universo.speed);
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
        researchConstrucctionAux.init      = fun.horaActual();
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
        shipyardConstrucctionAux.init         = fun.horaActual();
        shipyardConstrucctionAux.time         = fun.timeBuild(objPrice[shipyardName].metal + objPrice[shipyardName].crystal, objPrice.time.mult, objPrice.time.elev, this.universo.speed);
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
        mongo.db(process.env.UNIVERSE_NAME).collection("jugadores").updateOne(
          {name: this.player.name},
          {$push: shipyardConstrucction, $inc: objInc},
          (err, result) => {
            if(err) throw err;
            res.send({ok: true});
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
    mongo.db(process.env.UNIVERSE_NAME).collection("jugadores").updateOne({name: this.player.name}, {$pull: objPull, $inc: objInc}, (err, result) => {
      if(err) throw err;
      res.send({ok: true});
    });
  },
  updateResourcesData: function(f, planet, obj = null) { // Updatea los multiplicadores de los recursos(NO toca los recursos)
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
      mongo.db(process.env.UNIVERSE_NAME).collection("jugadores").updateOne({planets :{$elemMatch: {coordinates: {gal: this.player.planets[planet].coordinates.gal, sys: this.player.planets[planet].coordinates.sys, pos: this.player.planets[planet].coordinates.pos}}}}, {$set: {'planets.$.resourcesPercentage': objSet.resourcesPercentage, 'planets.$.resources.energy': objSet['resources.energy'], 'planets.$.resourcesAdd': objSet.resourcesAdd}}, () => {
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
      mongo.db(process.env.UNIVERSE_NAME).collection("jugadores").updateOne({planets :{$elemMatch: {coordinates: {gal: this.player.planets[planet].coordinates.gal, sys: this.player.planets[planet].coordinates.sys, pos: this.player.planets[planet].coordinates.pos}}}}, {$set: {'planets.$.temperature': newTemperature, 'planets.$.moon.values': obj}}, () => {
        this.updateResourcesData(f, planet, this.player.planets[planet].resourcesPercentage); // recalcula la produccion de las minas y guarda todo en la base de datos
      });
    }
  },
  returnFleetInDataBase: function(num, res = undefined, time = undefined, resources = undefined, ships = undefined){
    let actual = fun.horaActual();
    if(this.player.movement[num].ida && this.player.movement[num].mission != 6 && !(this.player.movement[num].mission == 0 && actual >= this.player.movement[num].llegada)){
      let updateObj = {};
      let updateObjAux = this.player.movement[num]; // Voy a pushear el mismo elemento pero a cambiarle algunas cosas claves
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
      this.player.movement[num]   = updateObjAux; // Actualizo la flota de la lista de flotas volando
      mongo.db(process.env.UNIVERSE_NAME).collection("jugadores").updateOne(
      {name: this.player.name, "movement.time": oldTime, "movement.llegada": oldLlegada},
      {$set: {"movement.$": updateObjAux}}, (err, resBD) => {
        if(err) throw err;
        if(res != undefined) res.send({ok: true});
      });
    }else{
      if(res != undefined) res.send({ok: false, mes: "El viaje ya esta regresando"});
    }
  },
  returnFleet: function(movement, newResources = undefined, newShips = undefined){
    let actual = fun.horaActual();
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
    mongo.db(process.env.UNIVERSE_NAME).collection("jugadores").updateOne(
      {planets :{$elemMatch: {coordinates: movement.coorDesde}}},
      {$push: pushObj});
  },
  addFleetMovement: function(player, planet, moon, obj, res){
    console.log(obj);
    /* El parametro player es el nombre del jugador al que se le va a hacer la modificacion, en esta y en casi todas la funciones */
    /* Verificar que obj.ships sean todos numeros */
    // Verifica que no se este enviando una flota a la misma posicion de salida
    if((obj.coorDesde.gal == obj.coorHasta.gal && obj.coorDesde.sys == obj.coorHasta.sys && obj.coorDesde.pos == obj.coorHasta.pos) && ((moon && obj.destination == 2) || (!moon && obj.destination == 1))){
      res.json({ok: false, mes: "No se puede mandar una flota de un lugar a si mismo"});
      return res;
    }
    // Verifica que las cordenadas sean validas
    if(!fun.coordenadaValida(obj.coorDesde)){
      res.json({ok: false, mes: "Coordenadas de origen invalidas"});
      return res;
    }
    if(!fun.coordenadaValida(obj.coorHasta)){
      res.json({ok: false, mes: "Coordenadas de destino invalidas"});
      return res;
    }
    // Verifica que halla espacio para una flota o expedicion mas (Comentar el if para tener slot infinitos)
    let fleetExpeditionObj = fun.getCantFleets(this.player);
    if(fleetExpeditionObj.fleets >= this.player.research.computer+1){
      res.json({ok: false, mes: "No hay mas espacio para otra flota."});
      return res;
    }else if(obj.mission == 0 && fleetExpeditionObj.expeditions >= Math.floor(Math.sqrt(this.player.research.astrophysics))){
      res.json({ok: false, mes: "No hay mas espacio para otra expedicion."});
      return res;
    }
    let validMission    = false;
    let fleetVoid       = true;
    let thereIsNoFleet  = false;
    let flotaValida     = false;
    let misil           = obj.ships.misil > 0;
    let minSpeed        = Infinity;
    let neededDeuterium = 0;
    let maxCarga        = 0;
    let distancia       = fun.calculaDistancia(obj.coorDesde, obj.coorHasta, this.universo.donutGalaxy, this.universo.donutSystem);
    let navesInfo       = fun.navesInfo(this.player.research.combustion, this.player.research.impulse, this.player.research.hyperspace_drive);
    for(let item in obj.ships){
      if(item != 'misil'){
        if(moon){
          if(obj.ships[item] > this.player.planets[planet].moon.fleet[item]) thereIsNoFleet = true;
        }else{
          if(obj.ships[item] > this.player.planets[planet].fleet[item]) thereIsNoFleet = true;
        }
        if(obj.ships[item] < 0) obj.ships[item] = 0;  // Controla que no sea un numero negativo
        if(obj.ships[item] > 0){                      // Si hay nave de ese tipo
          fleetVoid = false;
          if(navesInfo[item].speed < minSpeed) minSpeed = navesInfo[item].speed; // Obtengo la velocidad minima de toda la flota
          neededDeuterium += Math.floor(obj.ships[item] * navesInfo[item].consumo * distancia * Math.pow(0.68+obj.porce/100, 2) / 40000);
        }
        maxCarga += obj.ships[item] * navesInfo[item].carga;
      }
    }
    // Me fijo por separado el caso de los misiles
    if(obj.ships['misil'] < 0) obj.ships['misil'] = 0;
    if(misil && obj.mission != 6){
      res.json({ok: false, mes: "Los misiles solo pueden ser eviados a misilear."});
      return res;
    }
    if(!fleetVoid && obj.mission == 6){
      res.json({ok: false, mes: "No se puede misilear con naves que no sean misiles."});
      return res;
    }
    if(obj.ships['misil'] > ((moon) ? 0 : this.player.planets[planet].defense["interplanetaryMissile"])){
      thereIsNoFleet = true;
    }
    switch (obj.mission) {
      case 0: // Expedition
        validMission = obj.coorHasta.pos == 16 && !misil;
        break;
      case 1: // Colonisation
        validMission = obj.ships.colony > 0 && !misil;
        break;
      case 2: // Recycle
        validMission = obj.ships.recycler > 0 && obj.destination == 3 && !misil;
        break;
      case 3: // Transport
      case 4: // Deployment
        validMission = !misil;
        break;
      case 5: // Espionage
        validMission =  obj.ships.espionageProbe > 0 && !misil;
        break;
      case 6: // Misil
        validMission = misil;
        break;
      case 7: // Attack
        validMission = !misil;
        break;
      case 8: // Moon Destruction
        validMission = obj.ships.deathstar > 0 && !misil;
        break;
    }
    // La unica mision que se puede mandar a la posicion 16 es una expedicion
    if(obj.mission != 0 && obj.coorHasta.pos == 16) validMission = false;
    let deuterioDisponible = (moon) ? this.player.planets[planet].moon.resources.deuterium : this.player.planets[planet].resources.deuterium;
    if(!fleetVoid || misil){
      flotaValida = true;
      if(misil){
        minSpeed = navesInfo['misil'].speed;
        if(obj.coorDesde.gal != obj.coorHasta.gal || Math.abs(obj.coorDesde.sys - obj.coorHasta.sys) > (this.player.research.impulse * 5)){
          res.json({ok: false, mes: "No se puede misilear una posicion tan lejana."});
          return res;
        }
      }
    }
    if(validMission && !thereIsNoFleet && isFinite(minSpeed) && neededDeuterium <= deuterioDisponible - obj.resources.deuterium){
      if(fun.recursosSuficientes((moon) ? this.player.planets[planet].moon.resources : this.player.planets[planet].resources, obj.resources)){
        fun.objStringToNum(obj.resources);  // Paso los recursos de strings a integer
        if(maxCarga >= obj.resources.metal + obj.resources.crystal + obj.resources.deuterium){

          // Calculo cuanto tarda la flota en llegar
          let time = Math.ceil((10+(35000/obj.porce)*Math.sqrt(10*distancia/minSpeed)) / this.universo.speedFleet);
          // Si es una expedicion le agrego una hora mas un tiempo random
          if(obj.mission == 0) time += 3600 + Math.ceil(Math.random()*3600);

          // Creo los objetos para guardar todo en la base de datos
          let pushObjAux = {};
          let pushObj    = {};
          pushObjAux['ships']       = obj.ships;       // Objeto con la catidad de cada nave en la flota
          pushObjAux['moon']        = moon;            // Boolenao que esta en true si la flota salio de una luna y falso si salio desde un planeta
          pushObjAux['coorDesde']   = obj.coorDesde;   // Coordenadas simplificadas del lugar de partida de la flota
          pushObjAux['coorHasta']   = obj.coorHasta;   // Coordenadas simplificadas del lugar de llegada de la flota
          pushObjAux['destination'] = obj.destination; // Planeta = 1, luna = 2, escombros = 3
          pushObjAux['speed']       = obj.porce;       // Numero del 1 al 10 que indica a que velocidad va la flota
          pushObjAux['mission']     = obj.mission;     // Numero del 0 al 8 que indica que numero de mission ejecuta esta flota
          pushObjAux['ida']         = true;            // Bool si dice si es un viaje de ida o de vuelta
          pushObjAux['duracion']    = time;            // Cuanto tarda el viaje
          pushObjAux['time']        = fun.horaActual();// Tiempo en que empezo el viaje
          pushObjAux['llegada']     = fun.horaActual() + time*1000;     // Tiempo en que la flota llega
          pushObjAux['desdeName']   = this.player.planets[planet].name; // Nombre del planeta de salida
          pushObjAux['desdeType']   = this.player.planets[planet].type; // Tipo del planeta de salida
          pushObjAux['desdeColor']  = this.player.planets[planet].color;// Color del planeta de salida
          pushObjAux['hastaType']   = fun.getTypePlanet(obj.coorHasta.pos, obj.coorHasta.pos % 2); // Tipo del planeta de llegada
          if(fun.estaColonizado(this.allCord, obj.coorHasta)){
            pushObjAux['hastaColor'] = this.allCord[obj.coorHasta.gal+'_'+obj.coorHasta.sys+'_'+obj.coorHasta.pos].color;   // Color del planeta de llegada
          }else{
            pushObjAux['hastaColor'] = 0;
          }
          pushObjAux['resources']   = {metal: obj.resources.metal,      // Objeto con el formato {metal, crystal, deuterium} que indica cuato lleva la flota de cada recurso
                                       crystal: obj.resources.crystal,
                                       deuterium: obj.resources.deuterium};
          pushObj['movement'] = pushObjAux;
          obj.resources.deuterium += neededDeuterium;
          let moonString = (moon) ? '.moon.' : '.';
          let objInc = {};
          objInc['planets.$' + moonString + 'resources.metal'] = -obj.resources.metal;
          objInc['planets.$' + moonString + 'resources.crystal'] = -obj.resources.crystal;
          objInc['planets.$' + moonString + 'resources.deuterium'] = -obj.resources.deuterium;
          for(let clave in obj.ships){ // Resto todas las naves menos el misil
            if(clave != 'misil'){
              if(moon){
                this.player.planets[planet].moon.fleet[clave] -= obj.ships[clave];
              }else{
                this.player.planets[planet].fleet[clave] -= obj.ships[clave];
              }
              objInc['planets.$' + moonString + 'fleet.' + clave] = -obj.ships[clave];
            }
          }
          // Resto los misiles que se enviaron
          objInc['planets.$' + moonString + 'defense.interplanetaryMissile'] = -obj.ships['misil'];
          this.player.movement.push(pushObj);
          this.player.planets[planet].resources.metal -= obj.resources.metal;
          this.player.planets[planet].resources.crystal -= obj.resources.crystal;
          this.player.planets[planet].resources.deuterium -= obj.resources.deuterium;
          mongo.db(process.env.UNIVERSE_NAME).collection("jugadores").updateOne(
            {planets :{$elemMatch: {coordinates: {gal: this.player.planets[planet].coordinates.gal, sys: this.player.planets[planet].coordinates.sys, pos: this.player.planets[planet].coordinates.pos}}}},
            {$push: pushObj, $inc: objInc});
          res.json({ok: true}); // Usa json y no send por ser pedido via POST
        }else{
          res.json({ok: false, mes: "No se puede cargar tantos recursos."});
        }
      }else{
        res.json({ok: false, mes: "Recursos no validos"});
      }
    }else{
      if(!validMission){
        res.json({ok: false, mes: "Mission no valida con la flota actual"});
      }else{
        if(neededDeuterium <= deuterioDisponible - obj.resources.deuterium){
          res.json({ok: false, mes: "Flota no valida"});
        }else{
          res.json({ok: false, mes: "Deuterio insuficiente como para lanzar la flota"});
        }
      }
    }
  },
  moveCuanticFleet: function(player, planet, obj, res){
    if(this.player.planets[planet].moon.active == true && this.player.planets[planet].moon.buildings.jumpGate > 0 && fun.estaColonizado(this.allCord, obj.coorHasta)){
      let index = fun.getIndexOfPlanet(this.player.planets, obj.coorHasta);
      // Se fija que se salte a otra luna, que exista la luna a la que se quiere saltar y que tenga salto cuantico
      if(index != planet && this.player.planets[index].moon.active == true && this.player.planets[index].moon.buildings.jumpGate > 0){
        // Se fija que el salto cuantico de salida este listo para usar (el de destino no necesita estar listo)
        console.log(this.player.planets[planet].moon);
        if(this.player.planets[planet].moon.cuantic - fun.horaActual() <= 0){
          let incorrerctFleet = false;  // Se fija que la cantidad de flotas este bien
          let zeroFleet = true;
          for(let item in obj.ships){
            if(!fun.validInt(obj.ships[item]) || obj.ships[item] < 0) obj.ships[item] = 0;
            if(obj.ships[item] > 0) zeroFleet = false;
            if(obj.ships[item] > this.player.planets[planet].moon.fleet[item]) incorrerctFleet = true;
          }
          if(!incorrerctFleet && !zeroFleet){ // Paso las naves a la luna que salto y actualizo la info de la luna
            this.addPlanetData(obj.coorHasta, fun.zeroResources(), obj.ships, true);
            this.updateCuantic(this.player.planets[planet].coordinates, fun.negativeObj(obj.ships), fun.horaActual() + Math.floor(12*3600*1000 / this.player.planets[planet].moon.buildings.jumpGate));
            res.json({ok: true});
          }else{
            res.json({ok: false, mes: "Flota incorrecta."});
          }
        }else{
          res.json({ok: false, mes: "El salto cuantico esta cargandose"});
        }
      }else{
        if(index == planet){
          res.json({ok: false, mes: "No se puede saltar a la misma luna."});
        }else{
          res.json({ok: false, mes: "No se puede saltar a esa luna."});
        }
      }
    }else{
      res.json({ok: false, mes: "Error en la luna."});
    }
    return res;
  },
  marketResources: function(player, planet, obj, res){
    let recursosSuficientes = false;
    obj.button   = parseInt(obj.button);
    obj.cantidad = parseInt(obj.cantidad);
    if(!fun.validInt(obj.cantidad) || obj.cantidad < 0) obj.cantidad = 0;
    if(this.player.planets[planet].moon.active && this.player.planets[planet].moon.buildings.marketplace > 0 && obj.cantidad > 0){
      let objResourcesAdd = fun.zeroResources();
      switch (obj.button) {
        case 0: // Vendo metal por cristal
        case 1: // Vendo metal por deuterio
          if(this.player.planets[planet].moon.resources.metal >= obj.cantidad){
            recursosSuficientes = true;
            objResourcesAdd.metal = -obj.cantidad;
            if(obj.button == 0){
              objResourcesAdd.crystal = Math.floor(obj.cantidad*(2/3)*(9/10));
            }else{
              objResourcesAdd.deuterium = Math.floor(obj.cantidad/3*(9/10));
            }
          }
          break;
        case 2: // Vendo cristal por metal
        case 3: // Vendo cristal por deuterio
          if(this.player.planets[planet].moon.resources.crystal >= obj.cantidad){
            recursosSuficientes = true;
            objResourcesAdd.crystal = -obj.cantidad;
            if(obj.button == 2){
              objResourcesAdd.metal = Math.floor(obj.cantidad*(3/2)*(9/10));
            }else{
              objResourcesAdd.deuterium = Math.floor(obj.cantidad/2*(9/10));
            }
          }
          break;
        case 4: // Vendo deuterio por metal
        case 5: // Vendo deuterio por cristal
          if(this.player.planets[planet].moon.resources.deuterium >= obj.cantidad){
            recursosSuficientes = true;
            objResourcesAdd.deuterium = -obj.cantidad;
            if(obj.button == 4){
              objResourcesAdd.metal = Math.floor(obj.cantidad*3*(9/10));
            }else{
              objResourcesAdd.crystal = Math.floor(obj.cantidad*2*(9/10));
            }
          }
      }
      if(recursosSuficientes){
        this.addPlanetData(this.player.planets[planet].coordinates, objResourcesAdd, undefined, true, () => {
          res.send({ok: true});
        });
      }else{
        res.send({ok: false, mes: "Recursos insuficientes."});
      }
    }else{
      if(this.player.planets[planet].moon.active){
        if(obj.cantidad > 0){
          res.send({ok: false, mes: "Se necesita un mercado lunar para comerciar."});
        }else{
          res.send({ok: false, mes: "Cantidad de recursos invalida."});
        }
      }else{
        res.send({ok: false, mes: "No tenes luna."});
      }
    }
  },
  setPlanetData: function(cord, resources = undefined, buildings = undefined, fleet = undefined, defenses = undefined, moon = undefined){ /* III Funcion de base de datos III */
    let setObj = {};
    if(resources != undefined) setObj['planets.$.resources'] = resources;
    if(buildings != undefined) setObj['planets.$.buildings'] = buildings;
    if(fleet     != undefined) setObj['planets.$.fleet'] = fleet;
    if(defenses  != undefined) setObj['planets.$.defense'] = defenses;
    if(moon      != undefined) setObj['planets.$.moon'] = moon;
    mongo.db(process.env.UNIVERSE_NAME).collection("jugadores").updateOne({planets :{$elemMatch: {coordinates: {gal: cord.gal, sys: cord.sys, pos: cord.pos}}}}, {$set: setObj});
  },
  setMoonData: function(cord, resources = undefined, buildings = undefined, fleet = undefined){ // Asume el planeta tiene luna, de lo contrario no hace nada /* III Funcion de base de datos III */
    let setObj = {};
    if(resources != undefined) setObj['planets.$.moon.resources'] = resources;
    if(buildings != undefined) setObj['planets.$.moon.buildings'] = buildings;
    if(fleet != undefined) setObj['planets.$.moon.fleet'] = fleet;
    mongo.db(process.env.UNIVERSE_NAME).collection("jugadores").updateOne({planets :{$elemMatch: {coordinates: {gal: cord.gal, sys: cord.sys, pos: cord.pos}}}}, {$set: setObj});
  },
  addPlanetData: function(cord, resources, fleet, moon, f = undefined){ /* III Funcion de base de datos III */
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
  colonize: function(cord, player, resources = undefined, ships = undefined){
    // Me fijo que la tecnologia de astrifisica permite colonizar esa posicion
    if((cord.pos == 3 || cord.pos == 13) && this.player.research.astrophysics < 4) return false;
    if((cord.pos == 2 || cord.pos == 14) && this.player.research.astrophysics < 6) return false;
    if((cord.pos == 1 || cord.pos == 15) && this.player.research.astrophysics < 8) return false;
    // Me fijo que halla un lugar disponible para colonizar el planeta y que ese planeta no este colonizado
    if(Math.ceil(this.player.research.astrophysics/2)+1 > this.player.planets.length && this.player.planets.length < 8 && !fun.estaColonizado(this.allCord, this.player.movement[i].coorHasta)){
      // Seteo los recursos y naves con los que se va a crear el nuevo planeta
      if(resources == undefined) resources = fun.zeroResources();
      if(ships == undefined) ships = fun.zeroResources();
      let newPlanet = this.createNewPlanet(cord, 'Colony', player, 'activo', resources, ships); /*no deberia estar siempre activo*/
      mongo.db(process.env.UNIVERSE_NAME).collection("jugadores").updateOne({name: player}, {$push: {planets: newPlanet}});
      return true;  // Salio todo bien
    }else{
      return false; // No se cumplieron las condiciones para colonizar
    }
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
      let costShipyard = fun.costShipsAndDefenses();
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
      /* Sumar los puntos de las flotas que estan en movimiento */
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
  abandonPlanet: function(player, planet, res){
    if(this.player.planets.length > 1){ // Solo abandono el planeta si hay almenos otro mas
      let objPull = {};
      objPull.planets  = {coordinates: this.player.planets[planet].coordinates}; // Elimino el planeta nuemro planet de la lista
      objPull.movement = {coorDesde: this.player.planets[planet].coordinates};   // Elimino todos los movment que salieron del planeta eliminado
      mongo.db(process.env.UNIVERSE_NAME).collection("jugadores").updateOne(
        {name: player},
        {$pull: objPull}, (err) => {
          if(err) throw err;
          res.send({ok: true});
        });
    }else{
      res.send({ok: false, mes: "No se puede abandonar el unico planeta que tenes."});
    }
  },
  updateRewards: function(player, mission, res){
    if(fun.validInt(mission) && 0 < mission && mission <= 10){
      mission = parseInt(mission);
      if(!this.player.tutorial[mission-1]){
        let missionCumplida = false;
        let objReward = {};
        switch (mission) {  // Para cada mision me fijo si se cumplieron los requisitos y que no le halla dado la recompensa ya
          // Los requisitos los tiene que cumplir almenos un planeta individualmente, no se cuentan las flotas en la luna ni en vuelo
          case 1:
            for(let i = 0 ; i<this.player.planets.length && !missionCumplida ; i++){
              if(this.player.planets[i].buildings.metalMine >= 4 && this.player.planets[i].buildings.crystalMine >= 2 && this.player.planets[i].buildings.solarPlant >= 4){
                missionCumplida = true;
                objReward['planets.0.resources.metal'] = 150;
                objReward['planets.0.resources.crystal'] = 75;
              }
            }
            break;
          case 2:
            for(let i = 0 ; i<this.player.planets.length && !missionCumplida ; i++){
              if(this.player.planets[i].buildings.deuteriumMine >= 2 && this.player.planets[i].buildings.shipyard >= 1 && this.player.planets[i].defense.rocketLauncher >= 1){
                missionCumplida = true;
                objReward['planets.0.defense.rocketLauncher'] = 1;
              }
            }
            break;
          case 3:
            for(let i = 0 ; i<this.player.planets.length && !missionCumplida ; i++){
              if(this.player.planets[i].buildings.metalMine >= 10 && this.player.planets[i].buildings.crystalMine >= 7 && this.player.planets[i].buildings.solarPlant >= 5){
                missionCumplida = true;
                objReward['planets.0.resources.metal'] = 2000;
                objReward['planets.0.resources.crystal'] = 500;
              }
            }
            break;
          case 4:
            if(this.player.research.combustion >= 2){
              for(let i = 0 ; i<this.player.planets.length && !missionCumplida ; i++){
                if(this.player.planets[i].buildings.researchLab >= 1 && this.player.planets[i].fleet.smallCargo >= 1){
                  missionCumplida = true;
                  objReward['planets.0.resources.deuterium'] = 1500;
                }
              }
            }
            break;
          case 5:
            if(this.player.research.combustion >= 3 && this.player.research.espionage >= 2){
              for(let i = 0 ; i<this.player.planets.length && !missionCumplida ; i++){
                if(this.player.planets[i].fleet.espionageProbe >= 1){
                  missionCumplida = true;
                  objReward['planets.0.fleet.espionageProbe'] = 2;
                }
              }
            }
            break;
          case 6:
            if(this.player.research.impulse >= 1 && this.player.research.armour >= 1 && this.player.research.astrophysics >= 1){
              missionCumplida = true;
              objReward['planets.0.fleet.heavyFighter'] = 2;
              objReward['planets.0.fleet.smallCargo'] = 5;
            }
            break;
          case 7:
            if(this.player.research.laser >= 1 && this.player.research.impulse >= 3 && this.player.planets.length >= 2){
              missionCumplida = true;
              objReward['planets.0.resources.metal'] = 10000;
              objReward['planets.0.resources.crystal'] = 10000;
              objReward['planets.0.resources.deuterium'] = 10000;
              objReward['planets.0.fleet.largeCargo'] = 1;
              objReward['planets.0.fleet.smallCargo'] = 5;
            }
            break;
          case 8:
            for(let i = 0 ; i<this.player.planets.length && !missionCumplida ; i++){
              if(this.player.planets[i].buildings.metalMine >= 17 && this.player.planets[i].buildings.crystalMine >= 15 && this.player.planets[i].buildings.deuteriumMine >= 12){
                missionCumplida = true;
                objReward['planets.0.resources.metal'] = 20000;
                objReward['planets.0.resources.crystal'] = 15000;
                objReward['planets.0.resources.deuterium'] = 10000;
              }
            }
            break;
          case 9:
            if(this.player.research.combustion >= 6 && this.player.research.shielding >= 2){
              for(let i = 0 ; i<this.player.planets.length && !missionCumplida ; i++){
                if(this.player.planets[i].fleet.recycler >= 1){
                  missionCumplida = true;
                  objReward['planets.0.fleet.recycler'] = 2;
                }
              }
            }
            break;
          default:
            if(this.player.research.ion >= 2 && this.player.research.impulse >= 4){
              for(let i = 0 ; i<this.player.planets.length && !missionCumplida ; i++){
                if(this.player.planets[i].fleet.cruiser >= 2){
                  missionCumplida = true;
                  objReward['planets.0.fleet.lightFighter'] = 10;
                  objReward['planets.0.fleet.heavyFighter'] = 3;
                  objReward['planets.0.fleet.battleship'] = 1;
                }
              }
            }
        }
        if(missionCumplida){
          let setObj = {};
          setObj['tutorial.' + (mission-1)] = true;
          mongo.db(process.env.UNIVERSE_NAME).collection("jugadores").updateOne(
            {name: player},
            {$set: setObj, $inc: objReward}, (err) => {
              if(err) throw err;
              res.send({ok: true});
            });
        }else{
          res.send({ok: false, mes: "Requisitos no cumplidos."});
        }
      }else{
        res.send({ok: false, mes: "Mision ya completada."});
      }
    }else{
      res.send({ok: false, mes: "Numero de mission equivocado."});
    }
  },
  setPlanetDataDev: function(cord, player){ /* III Funcion de base de datos III */
    let resources = {metal: 1000, crystal: 1000, deuterium: 15000, energy: 0};
    let building = {metalMine: 0, crystalMine: 1, deuteriumMine: 0, solarPlant: 30, fusionReactor: 0, metalStorage: 10, crystalStorage: 9, deuteriumStorage: 8, robotFactory: 0, shipyard: 0, researchLab: 0, alliance: 0, silo: 0, naniteFactory: 0, terraformer: 0};
    let fleet = /*fun.zeroShips();*/{lightFighter: 10, heavyFighter: 0, cruiser: 100, battleship: 10, battlecruiser: 0, bomber: 3, destroyer: 100, deathstar: 50, smallCargo: 500, largeCargo: 200, colony: 1000, recycler: 200, espionageProbe: 30, solarSatellite: 15};
    let defenses = /*fun.zeroDefense();*/{rocketLauncher: 100, lightLaser: 10, heavyLaser: 0, gauss: 5, ion: 0, plasma: 0, smallShield: 0, largeShield: 0, antiballisticMissile: 3, interplanetaryMissile: 1000};
    let moon = /*{active: false, size: 0};*/this.createNewMoon(8888);
    let debris = {active: true, metal:1000, crystal: 2000};
    mongo.db(process.env.UNIVERSE_NAME).collection("jugadores").updateOne({planets :{$elemMatch: {coordinates: {gal: cord.gal, sys: cord.sys, pos: cord.pos}}}}, {$set: {'planets.$.resources': resources,'planets.$.buildings': building, 'planets.$.fleet': fleet, 'planets.$.defense': defenses,'planets.$.moon': moon, 'planets.$.debris': debris}});
  },
  setMoonDataDev: function(cord, player){ // Asume el planeta tiene luna, de lo contrario no hace nada /* III Funcion de base de datos III */
    /* cambiar las constantes  y no necesita player*/
    let resources = {metal: 500000, crystal: 4000000, deuterium: 1000000, energy: 0};
    let building = {lunarBase: 6, phalanx: 2, spaceDock: 0, marketplace: 1, lunarSunshade: 5, lunarBeam: 6, jumpGate: 2, moonShield: 0};
    let fleet = {lightFighter: 1000, heavyFighter: 0, cruiser: 1, battleship: 30, battlecruiser: 0, bomber: 0, destroyer: 0, deathstar: 100, smallCargo: 10, largeCargo: 200, colony: 0, recycler: 20, espionageProbe: 0, solarSatellite: 0};
    mongo.db(process.env.UNIVERSE_NAME).collection("jugadores").updateOne({planets :{$elemMatch: {coordinates: {gal: cord.gal, sys: cord.sys, pos: cord.pos}}}}, {$set: {'planets.$.moon.resources': resources,'planets.$.moon.buildings': building, 'planets.$.moon.fleet': fleet}});
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

// Lista de cosas por hacer:

/* Hay que cambiar como se actualizan los datos, hay que crear una cola con eventos a pasar, cuando uno pasa se actualiza la info de ese jugador sin que este conectado necesariamente
/* Mejorar el calculo de recursos de tiempos medios
/* Cambiar el string player por el objeto del jugador en todas las funciones
/* Comentar el codigo ^^^^^
/* Falta modularizar las funciones que acceden a la base de datos
/* Mejorar la verificacion de los datos de las funcione de la api
/* La funcion de contar puntos tiene que contar los puntos de las flotas que estan en movimiento
/* El contruir satelites solares la energia no se actualiza
/* Completar los mesajes de espionage (y todos en general)
/* Mostrar bien los reportes de espionage y de batallas
/* Avisar al atacado que lo estan atacando
/* Si una flota regresa a la luna y no hay luna, (fue destruida) vuelve al planeta
/* Pasar las funciones de espera a async, sincronizando todos los llamas a base de datos y no devolviendo nada hasta que te halla updateado toda la base de datos
/* Que se pueda misilear, espiar y atacar desde la vision de galaxia
/* Hacer que se pueda atacar desde la pagina de vacas, search y los reportes de espionage
*/
