var fun  = require('./funciones_auxiliares');
var base = require('./data_base');
var queue = require('./Queue')
var events = new queue.Queue();
var actualizando = false;

var exp  = {
  universo: null,             // Objeto con la informcaion basica del universo
  player: null,               // Objeto con toda la informacion del jugador que estoy viendo
  planeta: 0,                 // En que numero de planeta estoy parado
  moon: false,                // Si estoy parado en una luna
  cantPlayers: 0,             // Cantidad de jugadores en todo el universo
  allCord: {},                // Por cada planeta colonizado guardo un objeto 'infoPlanet' con la informacion basica exterior del planeta
  comienzoBusquedaNewCoor: 1, // Apartir de que galaxia se ubican los nuevos planetas
  events: events,             // Lista de tiempos en los que hay que actualizar a un jugador
  fun: fun,
  base: base,

  // Crea el un nuevo universo con 'cant' bots
  //  -name = Nombre del universo
  //  -cant = Cantidad de bots
  //  -data = Objeto con la informacion basica del nuevo universo
  createUniverse: function(name, cant, data){
    base.setUniverseData(name, data);
    for(let i = 0 ; i<cant ; i++){
      base.addNewPlayer('bot_' + i, 2);
    }
  },

  // Actualiza la informacion del jugador player
  //  -player = Objeto player a actualizar
  //  -f = Funcion que se ejecuta despues de ejecutar esta funcion
  updatePlayer: function(player, f){
    let horaActual = fun.horaActual();
    let objSet = {};
    let objInc = {};
    let objPull = {movement: {llegada: {$lt: horaActual}}}; // Va a eliminar todos los movement que su llegada es menor que la hora actual
    let listShip = [];
    let timeLastUpdate = horaActual - player.lastVisit;
    let updateResourcesAddOfAllPlanets = false;
    objSet['puntosAcum'] = player.puntosAcum;

    if((player.researchConstrucction.active) && (player.researchConstrucction.time*1000 + player.researchConstrucction.init <= horaActual)){
      objSet['researchConstrucction'] = {active: false};
      objSet['puntosAcum'] += player.researchConstrucction.metal + player.researchConstrucction.crystal + player.researchConstrucction.deuterium;
      objInc['research.' + player.researchConstrucction.item] = 1;
      player.research[player.researchConstrucction.item] += 1;
      if(player.researchConstrucction.item === 'energy' || player.researchConstrucction.item === 'plasma') updateResourcesAddOfAllPlanets = true;
      if(player.researchConstrucction.item === 'espionage'){
        for(let i = 0 ; i<player.planets.length ; i++){
          this.allCord[player.planets[i].coordinates.gal+'_'+player.planets[i].coordinates.sys+'_'+player.planets[i].coordinates.pos].espionage += 1;
        }
      }
    }

    // Por cada planeta actualiza los datos de ese planeta y si tiene luna tambien la actualiza
    for(let i = 0 ; i<player.planets.length ; i++){
      let updateDataThisPlanet = false; // se fija que en ese planeta se halla terminado una contruccion, si es asi actualiza los campos y los valores

      if((player.planets[i].buildingConstrucction.active) && (1000*player.planets[i].buildingConstrucction.time + player.planets[i].buildingConstrucction.init <= horaActual)){
        objSet['planets.' + i + '.buildingConstrucction'] = {active: false};
        objSet['puntosAcum'] += player.planets[i].buildingConstrucction.metal + player.planets[i].buildingConstrucction.crystal + player.planets[i].buildingConstrucction.deuterium;
        objInc['planets.' + i + '.campos'] = 1;
        objInc['planets.' + i + '.buildings.' + player.planets[i].buildingConstrucction.item] = 1;
        updateDataThisPlanet = true;
        player.planets[i].buildings[player.planets[i].buildingConstrucction.item] += 1;
        if(player.planets[i].buildingConstrucction.item === "terraformer") objInc['planets.' + i + '.camposMax'] = 5;
      }

      if(player.planets[i].moon.active && player.planets[i].moon.buildingConstrucction.active && (1000*player.planets[i].moon.buildingConstrucction.time + player.planets[i].moon.buildingConstrucction.init <= horaActual)){
        objSet['planets.' + i + '.moon.buildingConstrucction'] = {active: false};
        objSet['puntosAcum'] += player.planets[i].moon.buildingConstrucction.metal + player.planets[i].moon.buildingConstrucction.crystal + player.planets[i].moon.buildingConstrucction.deuterium;
        objInc['planets.' + i + '.moon.campos'] = 1;
        objInc['planets.' + i + '.moon.buildings.' + player.planets[i].moon.buildingConstrucction.item] = 1;
        player.planets[i].moon.buildings[player.planets[i].moon.buildingConstrucction.item] += 1;
        if(player.planets[i].moon.buildingConstrucction.item === "lunarBase") objInc['planets.' + i + '.moon.camposMax'] = 3;
      }

      if(player.planets[i].shipConstrucction.length > 0){
        if(player.planets[i].shipConstrucction[0].new === true){
          player.planets[i].shipConstrucction[0].new = false;
          listShip = player.planets[i].shipConstrucction;
        }else{
          let timeLastUpdateAux = timeLastUpdate/1000;
          timeLastUpdateAux -= player.planets[i].shipConstrucction[0].timeNow;
          if(timeLastUpdateAux < 0){ // No termino ni la primer nave de la lista

            // Actualiza timeNow y no hace nada mas
            player.planets[i].shipConstrucction[0].timeNow -= timeLastUpdate/1000;
            listShip = player.planets[i].shipConstrucction;

          }else{ // Contruyo la primer nave y continua con el resto

            let lugar = player.planets[i].shipConstrucction[0].def ? '.defense.' : '.fleet.';
            player.planets[i].shipConstrucction[0].cant      -= 1;
            player.planets[i].shipConstrucction[0].metal     -= player.planets[i].shipConstrucction[0].metalOne;
            player.planets[i].shipConstrucction[0].crystal   -= player.planets[i].shipConstrucction[0].crystalOne;
            player.planets[i].shipConstrucction[0].deuterium -= player.planets[i].shipConstrucction[0].deuteriumOne;
            objInc['planets.' + i + lugar + player.planets[i].shipConstrucction[0].item] = 1;
            objSet['puntosAcum'] += player.planets[i].shipConstrucction[0].metalOne + player.planets[i].shipConstrucction[0].crystalOne + player.planets[i].shipConstrucction[0].deuteriumOne;

            // Me fijo el resto de la s naves a contruir
            for(let j = 0 ; j<player.planets[i].shipConstrucction.length ; j++){
              player.planets[i].shipConstrucction[j].new = false;
              if(timeLastUpdateAux > 0){
                lugar = player.planets[i].shipConstrucction[j].def ? '.defense.' : '.fleet.';
                let cantAux = 0;
                let totalTimeJ = player.planets[i].shipConstrucction[j].time * player.planets[i].shipConstrucction[j].cant;
                cantAux = timeLastUpdateAux / player.planets[i].shipConstrucction[j].time;
                if(objInc['planets.' + i + lugar + player.planets[i].shipConstrucction[j].item] === undefined) objInc['planets.' + i + lugar + player.planets[i].shipConstrucction[j].item] = 0;
                objInc['planets.' + i + lugar + player.planets[i].shipConstrucction[j].item] += Math.min(Math.floor(cantAux), player.planets[i].shipConstrucction[j].cant);
                objSet['puntosAcum'] += Math.min(Math.floor(cantAux), player.planets[i].shipConstrucction[j].cant)*player.planets[i].shipConstrucction[j].metalOne + Math.min(Math.floor(cantAux), player.planets[i].shipConstrucction[j].cant)*player.planets[i].shipConstrucction[j].crystalOne + Math.min(Math.floor(cantAux), player.planets[i].shipConstrucction[j].cant)*player.planets[i].shipConstrucction[j].deuteriumOne;
                player.planets[i].shipConstrucction[j].timeNow = (cantAux > 0) ? (player.planets[i].shipConstrucction[j].time - (timeLastUpdateAux - Math.floor(cantAux)*player.planets[i].shipConstrucction[j].time)) : (player.planets[i].shipConstrucction[j].timeNow - (timeLastUpdateAux - Math.floor(cantAux)*player.planets[i].shipConstrucction[j].time));
                player.planets[i].shipConstrucction[j].cant      -= Math.floor(cantAux);
                player.planets[i].shipConstrucction[j].metal     -= Math.floor(cantAux)*player.planets[i].shipConstrucction[j].metalOne;
                player.planets[i].shipConstrucction[j].crystal   -= Math.floor(cantAux)*player.planets[i].shipConstrucction[j].crystalOne;
                player.planets[i].shipConstrucction[j].deuterium -= Math.floor(cantAux)*player.planets[i].shipConstrucction[j].deuteriumOne;
                timeLastUpdateAux -= totalTimeJ;
              }
              if(player.planets[i].shipConstrucction[j].cant > 0) listShip.push(player.planets[i].shipConstrucction[j]);
            }
            if(player.planets[i].shipConstrucction[0].item === 'solarSatellite'){
              updateDataThisPlanet = true;
            }
          }
        }
      }

      objSet['planets.' + i + '.shipConstrucction'] = (listShip.length > player.planets[i].shipConstrucction.length) ? player.planets[i].shipConstrucction : listShip;
      if(updateDataThisPlanet || updateResourcesAddOfAllPlanets){
        this.updateResourcesData(() => {}, player, i); // Updatea la energia y resourcesAdd
        objSet['planets.' + i + '.resources.energy']       = player.planets[i].resources.energy;
        objSet['planets.' + i + '.resourcesAdd.metal']     = player.planets[i].resourcesAdd.metal;
        objSet['planets.' + i + '.resourcesAdd.crystal']   = player.planets[i].resourcesAdd.crystal;
        objSet['planets.' + i + '.resourcesAdd.deuterium'] = player.planets[i].resourcesAdd.deuterium;
      }

      let almacen = this.getAlmacen(player.planets[i]);
      // Se queda con la cantidad maxima de recursos que se juntaron, siempre y cuando esa sea menor a la que entar en el almacen y sea poitiva
      objInc['planets.' + i + '.resources.metal']     = Math.max(0, Math.min(player.planets[i].resourcesAdd.metal*timeLastUpdate/(1000*3600), almacen.metal - player.planets[i].resources.metal));
      objInc['planets.' + i + '.resources.crystal']   = Math.max(0, Math.min(player.planets[i].resourcesAdd.crystal*timeLastUpdate/(1000*3600), almacen.crystal - player.planets[i].resources.crystal));
      objInc['planets.' + i + '.resources.deuterium'] = Math.max(0, Math.min(player.planets[i].resourcesAdd.deuterium*timeLastUpdate/(1000*3600), almacen.deuterium - player.planets[i].resources.deuterium));
    }
    // Me fijo cuales flotar regresaron y actualizo esos datos
    for(let i = 0 ; i<player.movement.length ; i++){
      if(player.movement[i].llegada < horaActual){ // Si esta flota llego a destino
        if(player.movement[i].ida){
          let newTime = 0;
          switch (player.movement[i].mission) {
          case 1: // Colonizacion
            player.movement[i].ships.colony -= 1;
            let resColonia = this.colonize(player.movement[i].coorHasta, player, player.movement[i].resources, player.movement[i].ships);
            // Informo con un mensaje que paso
            let infoMes = {type: 3, title: "Colonization", text: "", data: {}};
            if(resColonia){ // Colonizo bien, mando mensaje de felicitaciones
              infoMes.text = "Congratulations, you have a new colony!!!";
            }else{ // Fallo en la colonizacion, la flota se perdio e informo con un mensaje
              infoMes.text = "Something went wrong. The comunication with the fleet has been lost...";
            }
            base.sendMessage(player.name, infoMes);
            break;

          case 2: // Reciclaje
            if(fun.estaColonizado(this.allCord, player.movement[i].coorHasta)){ // Si el planeta esta colonizado
              base.findAndExecute(player.movement[i].coorHasta, (res) => {
                let indexPlanet = fun.getIndexOfPlanet(res.planets, player.movement[i].coorHasta);
                let newDebris = base.recicleDebris(player.name, res.planets[indexPlanet].debris, player.movement[i]);  // Reciclo los escombros
                if(newDebris != undefined){ // Guardo los nuevos escombros
                  base.saveDebris(player.movement[i].coorHasta, newDebris, false);
                }
              });
            }
            // La flota vuelve sin nada, si recicla recursos, se le agregan despues en la funcion de arriba
            newTime = (player.movement[i].llegada - player.movement[i].time)/1000;  // Calculo el tiempo que va a tardar el viaje en completarse
            newTime -= (horaActual - player.movement[i].llegada)/1000;                   // Le resto el tiempo que ya paso
            if(newTime < 0) newTime = 0;
            base.returnFleetInDataBase(player, i, undefined, newTime, player.movement[i].resources, undefined);
            break;

          case 3: // Transporte
            if(fun.estaColonizado(this.allCord, player.movement[i].coorHasta)){
              base.addPlanetData(player.movement[i].coorHasta, player.movement[i].resources, {}, player.movement[i].destination === 2);
            }
            newTime = (player.movement[i].llegada - player.movement[i].time)/1000;  // Calculo el tiempo que va a tardar el viaje en completarse
            newTime -= (horaActual - player.movement[i].llegada)/1000;                   // Le resto el tiempo que ya paso
            if(newTime < 0) newTime = 0;  // Si el tiempo dio negativo, la flota ya tendria que haber vuelto
            base.returnFleetInDataBase(player, i, undefined, newTime, fun.zeroResources(), undefined);
            break;

          case 4: // Despliege
            // Si hay un planeta colonizado en esa posicion, la flota se queda ahi, en caso contrario la flota se pierde
            if(fun.estaColonizado(this.allCord, player.movement[i].coorHasta)){
              base.addPlanetData(player.movement[i].coorHasta, player.movement[i].resources, player.movement[i].ships, player.movement[i].destination === 2);
            }else{
              let infoMes = {type: 3, title: "Failed deployment", text: "The deployment has failed. The comunication with the fleet has been lost...", data: {}};
              base.sendMessage(player.name, infoMes);
            }
            break;

          case 5: // Espionage
            if(fun.estaColonizado(this.allCord, player.movement[i].coorHasta)){ // Calculo la probabilidad de que destruyan a las sondas de espionage
              let nameEspia = fun.playerName(this.allCord, player.movement[i].coorDesde);
              let difEspionageLevel = this.allCord[player.movement[i].coorHasta.gal+'_'+player.movement[i].coorHasta.sys+'_'+player.movement[i].coorHasta.pos].espionage - this.allCord[player.movement[i].coorDesde.gal+'_'+player.movement[i].coorDesde.sys+'_'+player.movement[i].coorDesde.pos].espionage;
              let probabilityDetected = Math.floor(Math.pow(2, difEspionageLevel - 2) * player.movement[i].ships.espionageProbe);
              if(probabilityDetected < Math.floor(Math.random()*100)){ // Si no descubren a las sondas de espionage
                // Uso el indice de espionage para mandar en reporte de espionage
                let indiceDeEspionage = Math.sign(difEspionageLevel) * Math.pow(difEspionageLevel, 2) + player.movement[i].ships.espionageProbe;
                base.sendSpyReport(nameEspia, player.movement[i].coorHasta, indiceDeEspionage, player.movement[i].destination === 2);
              }else{
                // Calculo los escombros a agregar y los guardo
                let newDebris = {metal: 0, crystal: Math.floor(10000 * player.movement[i].ships.espionageProbe / this.universo.fleetDebris)};
                base.saveDebris(player.movement[i].coorHasta, newDebris, true);

                // Aviso a los jugadores lo que paso
                /* Completar los mesajes de espionage */
                let nameEspiado = fun.playerName(this.allCord, player.movement[i].coorHasta);
                if(nameEspia !== nameEspiado){
                  let infoMesEspiado = {type: 4, title: "Spy captured", text: player.movement[i].ships.espionageProbe + " Espionages probes has been destroyed in ", data: {}};
                  base.sendMessage(nameEspiado, infoMesEspiado);
                }
                let infoMesDestruido = {type: 4, title: "Spy failed", text: "Your espionages probes has been destroyed in ", data: {}};
                base.sendMessage(nameEspia, infoMesDestruido);

                // Si hay mas naves ademas de las sondas, las devuelvo a su planeta
                player.movement[i].ships.espionageProbe = 0;
                if(fun.isZeroObj(player.movement[i].ships)){
                  break;  // Como no hay naves salgo de switch sin regresar la flota
                } // Las sondas no vuelven pero el resto de la flota si
              }
            }
            newTime = (player.movement[i].llegada - player.movement[i].time)/1000;  // Calculo el tiempo que va a tardar el viaje en completarse
            newTime -= (horaActual - player.movement[i].llegada)/1000;                   // Le resto el tiempo que ya paso
            if(newTime < 0) newTime = 0;                                                      // Si el tiempo dio negativo, la flota ya tendria que haber vuelto
            base.returnFleetInDataBase(player, i, undefined, newTime, undefined, player.movement[i].ships);
            break;

          case 6: // Misil
            // Me fijo que el planeta este colonizado y que el misil se haya enviado a un planeta (las lunas y escombros no se pueden misilear)
            if(fun.estaColonizado(this.allCord, player.movement[i].coorHasta) && player.movement[i].destination === 1){
              base.findAndExecute(player.movement[i].coorHasta, (res) => {
                let indexPlanet = fun.getIndexOfPlanet(res.planets, player.movement[i].coorHasta);
                let objMisAttack = fun.misilAttack(res.planets[indexPlanet].defense, player.movement[i].ships.misil, res.research.armour, player.research.weapons);

                // Guardo las nuevas defensas del planeta atacado
                base.setPlanetData(player.movement[i].coorHasta, undefined, undefined, undefined, objMisAttack.survivorDefenses, undefined);

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
                base.sendMessage(res.name, infoMesDestruido);
              });
            }
            break;

          case 7: // Ataque
          case 8: // Moon Destruction
            /* Si estoy atacando la luna se tiene que fijar que halla luna */
            if(fun.estaColonizado(this.allCord, player.movement[i].coorHasta)){
              base.findAndExecute(player.movement[i].coorHasta, (res) => {
                let indexPlanet = fun.getIndexOfPlanet(res.planets, player.movement[i].coorHasta);
                if(player.movement[i].destination === 2 && !res.planets[indexPlanet].moon.active){
                  // Si se ataca una luna que ya no existe (por un error o porque fue destruida), la flota vuelve
                  newTime = (player.movement[i].llegada - player.movement[i].time)/1000;  // Calculo el tiempo que va a tardar el viaje en completarse
                  newTime -= (horaActual - player.movement[i].llegada)/1000;                   // Le resto el tiempo que ya paso
                  if(newTime < 0) newTime = 0;                                                      // Si el tiempo dio negativo, la flota ya tendria que haber vuelto
                  base.returnFleetInDataBase(player, i, undefined, newTime, undefined, player.movement[i].ships);
                  /* Aviso que la luna que se intento atacar ya no esta mas */
                  return null;
                }
                let defenses = {};
                let defenderFleet = {};
                let destroyedMoon = false;
                if(player.movement[i].destination === 2){ // Si se ataca a la luna
                  defenses = fun.zeroDefense();
                  defenderFleet = res.planets[indexPlanet].moon.fleet;
                }else{ // Si se ataca al planeta
                  defenses = res.planets[indexPlanet].defense;
                  defenderFleet = res.planets[indexPlanet].fleet;
                }

                // Simula la batalla
                let objAttack = fun.battle(player.movement[i].ships, defenderFleet, defenses, player.research, res.research, this.universo.rapidFire);

                let newDebris = fun.calcularEscombros(objAttack, {atkShips: player.movement[i].ships, defShips: defenderFleet, defDefenses: defenses}, this.universo.fleetDebris, this.universo.defenceDebris);
                let newMoonObj = undefined;
                if(!res.planets[indexPlanet].moon.active){ // Si no tiene luna, me fijo si se genera una luna en ese planeta
                  let lunaChance = fun.lunaChance(newDebris, this.universo.maxMoon);
                  if(lunaChance > Math.floor(Math.random() * 100)){
                    let moonSize = (this.universo.maxMoon === lunaChance) ? 9999 : Math.floor(fun.normalRandom(6999, 9999, 6999, 9999));
                    newMoonObj = this.createNewMoon(moonSize);
                    // Le mando un mesage avisandole que tiene una nueva luna
                    base.sendMessage(res.name, {type: 4, title: "New Moon", text: "Vamos nueva luna en... ", data: {}});
                  }
                }

                /* Intento usar el space dock */

                let stolenResources = fun.zeroResources();
                let recursosCargados;
                switch (objAttack.result) {
                  case 1: // Gano el atante
                    console.log("Gano el atacante");
                    let recursos;
                    if(player.movement[i].destination === 2){
                      // Intento destruir la luna del atacado
                      recursos = {...res.planets[indexPlanet].moon.resources};  // Copio el objeto con los recursos de la luna
                      if(player.movement[i].mission === 8 && objAttack.atkShips.deathstar > 0){
                        // Calculo las estrellas de la muerte que caen en destrir la luna
                        let destroyPercentage = (100 - Math.sqrt(res.planets[indexPlanet].moon.size))*Math.sqrt(objAttack.atkShips.deathstar) + player.research.graviton;
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
                      recursosCargados = fun.loadResourcesAttack(objAttack.atkShips, recursos, player.movement[i].resources);
                      stolenResources = recursosCargados.saqueado;
                      // Regresan el resto de las naves
                      base.returnFleet(player.movement[i], recursosCargados.newCarga, objAttack.atkShips);
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
                    recursosCargados = fun.loadResources(movementAux, player.movement[i].resources);
                    // Regresan las naves que sobrevivieron
                    base.returnFleet(player.movement[i], recursosCargados, objAttack.atkShips);
                    /* Informo con mensajes de lo ocurrido */
                } // Actualizo el planeta del defensor
                for(let item in stolenResources){
                  if(player.movement[i].destination === 2){
                    res.planets[indexPlanet].moon.resources[item] -= stolenResources[item];
                  }else{
                    res.planets[indexPlanet].resources[item] -= stolenResources[item];
                  }
                }
                if(player.movement[i].destination === 2){
                  if(destroyedMoon){
                    newMoonObj = {active: false, size: 0};
                    base.setPlanetData(res.planets[indexPlanet].coordinates, undefined, undefined, undefined, undefined, newMoonObj);
                  }else{
                    base.setMoonData(res.planets[indexPlanet].coordinates, res.planets[indexPlanet].moon.resources, undefined, objAttack.defShips);
                  }
                }else{
                  base.setPlanetData(res.planets[indexPlanet].coordinates, res.planets[indexPlanet].resources, undefined, objAttack.defShips, objAttack.defDefenses, newMoonObj);
                }
                base.saveDebris(res.planets[indexPlanet].coordinates, newDebris, true);
              });
            }else{ // Se intento atacar un planeta no colonizado y la flota vuelve sin nada
              newTime = (player.movement[i].llegada - player.movement[i].time)/1000;  // Calculo el tiempo que va a tardar el viaje en completarse
              newTime -= (horaActual - player.movement[i].llegada)/1000;                   // Le resto el tiempo que ya paso
              if(newTime < 0) newTime = 0;                                                      // Si el tiempo dio negativo, la flota ya tendria que haber vuelto
              base.returnFleetInDataBase(player, i, undefined, newTime, undefined, player.movement[i].ships);
              /* Aviso que se intento atacar un planeta no colonizado */
            }
            break;

          default: // Expedition (0)
            let expObj = fun.expedition(player.movement[i].ships, player.research);
            if(!expObj.mueren){ // Si se destruyo toda la flota no hago nada, en caso contrario la devuelvo al planeta
              let newResources = player.movement[i].resources;
              if(expObj.evento === 5){ // Se encontraron recursos y los cargo a las naves
                newResources = fun.loadResources(player.movement[i], expObj.resources);
              }
              newTime = (player.movement[i].llegada - player.movement[i].time)/1000;
              newTime += expObj.time;
              newTime -= (horaActual - player.movement[i].llegada)/1000;
              if(newTime < 0) newTime = 0;

              // Recordar que el objeto 'ships' se paso por referencia, por lo tanto ya esta actualizado
              base.returnFleetInDataBase(player, i, undefined, newTime, newResources, player.movement[i].ships);
              for(let j = 0 ; j<expObj.mensajes.length ; j++){ // Envio los mensajes de las expediciones
                base.sendMessage(player.name, expObj.mensajes[j]);
              }
            }
          }
        }else{ // La flota llega al planeta de salida, guardo sus recursos y las naves
          let planetIndex = fun.getIndexOfPlanet(player.planets, player.movement[i].coorDesde);
          if(planetIndex !== -1){
            let lunaString = (player.movement[i].moon) ? '.moon.' : '.'; // Me fijo si la flota va a la luna o al planeta
            // Si se dirije a la luna y no hay por un error o porque se destruyo, esa flota vuelve al planeta
            if(!player.planets[planetIndex].moon.active && player.movement[i].moon){
              lunaString = '.';
            }
            let plaString = 'planets.' + planetIndex + lunaString;

            for(let item in player.movement[i].resources){ // Guardo los recursos
              if(item !== 'misil') objInc[plaString + 'resources.' + item] = player.movement[i].resources[item];
            }
            for(let item in player.movement[i].ships){ // Guardo todas las naves
              objInc[plaString + 'fleet.' + item] = player.movement[i].ships[item];
            }
          }
        }
      }
    }
    objInc['puntos'] = Math.floor(objSet['puntosAcum']/1000);
    objSet['puntosAcum'] = objSet['puntosAcum'] % 1000;
    objSet.lastVisit = horaActual;    // Updatea la ultima vez que se actualizo este planeta
    base.savePlayerData(player.name, objSet, objInc, undefined, objPull, f);
  },

  // Devuelve el objeto de un nuevo planeta
  //  -cood = Coordenadas del nuevo planeta
  //  -planetName = Nombre del nuevo planeta
  //  -playerName = Nombre del jugador dueno del planeta
  //  -playerTypeNew = El typo de jugador del que es el dueno del planeta
  //  -initResources = Recursos con los que inicia el planeta
  //  -initShips = Naves con las que inicia el planeta
  createNewPlanet: function(cord, planetName, playerName, playerTypeNew, initResources, initShips) {
    let typePlanet = fun.generateNewTypeOfPlanet(cord.pos, cord.sys % 2);
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

  // Devuelve el objeto de una nueva luna
  //  -newSize: Tamano de la nueva luna
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

  // Devuelve una coorneda que este libre en el universo
  //  -rand = Si es true la coordenada es alatoria, si no se busca la glaxia numero 'comienzoBusquedaNewCoor'
  newCord: function(rand = true) {
    // Busca un cordenada libre y la devuelve
    let newCoor = {};
    for(newCoor.gal = this.comienzoBusquedaNewCoor ; newCoor.gal<=9; newCoor.gal++){ // Comienza en la galaxia numero comienzoBusquedaNewCoor
      for(newCoor.sys = 1 ; newCoor.sys<=499; newCoor.sys++){
        for(newCoor.pos = 5 ; newCoor.pos<=10; newCoor.pos++){
          if(!fun.estaColonizado(this.allCord, newCoor) && (!rand || Math.random() > 0.9)){
            return newCoor;
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

  // Devuelve un objeto con la informacion basica del jugador activo
  //  -planet = Numero de planeta en el que esta parado el jugador
  getActualBasicInfo: function(planet) {
    let resourcesObj = (this.moon) ? this.player.planets[planet].moon.resources : this.player.planets[planet].resources;
    let classObj = {};
    let firstMovement = this.getFirstMovementInfo();
    let objStorage = this.getAlmacen(this.player.planets[planet], this.moon);
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

  // Devuelve el tiempo en el que llega la primer flota y la mission mas si esta regresando o no
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

  // Devuelve cuanto es el almacenamiento maximo de cada recurso para un planeta
  //  -planetaObj = Objeto con la informacion de todo el planeta o luna
  //  -moon = Si es una luna luna o no
  getAlmacen: function(planetObj, moon = false){
    let res = {};
    if(moon){ // Si esta en la luna todos los almecenes estan en 0, ya que no importan
      res = fun.zeroResources();
    }else{  // La funcion para calcular cada almacenamiento es: 5000 * 2.5 * e^(0.61 * almacen)
      res = {metal:    5000 * Math.floor(2.5 * Math.pow(Math.E, 0.61 * planetObj.buildings.metalStorage)),
            crystal:   5000 * Math.floor(2.5 * Math.pow(Math.E, 0.61 * planetObj.buildings.crystalStorage)),
            deuterium: 5000 * Math.floor(2.5 * Math.pow(Math.E, 0.61 * planetObj.buildings.deuteriumStorage))};
    }
    return res;
  },

  // Devuelve un objeto con la informacion de la produccion de recursos de un planeta
  //  -planet = Numero de planeta
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
    let energyUsage = {metal: Math.floor((totalEnergyUsage === 0) ? 0 : (maxEnergyAux.metal*energyTotal)/totalEnergyUsage),
                       crystal: Math.floor((totalEnergyUsage === 0) ? 0 : (maxEnergyAux.crystal*energyTotal)/totalEnergyUsage),
                       deuterium: Math.floor((totalEnergyUsage === 0) ? 0 : (maxEnergyAux.deuterium*energyTotal)/totalEnergyUsage)};
    energyUsage = {metal: ((energyUsage.metal > maxEnergyAux.metal) ? maxEnergyAux.metal : energyUsage.metal), crystal: ((energyUsage.crystal > maxEnergyAux.crystal) ? maxEnergyAux.crystal : energyUsage.crystal), deuterium: ((energyUsage.deuterium > maxEnergyAux.deuterium) ? maxEnergyAux.deuterium : energyUsage.deuterium)};
    return {basic: {metal: 30 * spd, crystal: 15 * spd},
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
      /* Ya hay una funcion que calcula el storage del planeta */
      storage: {metal: 5000*Math.floor(2.5*Math.pow(Math.E, 0.61*minas.metalStorage)),
               crystal: 5000*Math.floor(2.5*Math.pow(Math.E, 0.61*minas.crystalStorage)),
               deuterium: 5000*Math.floor(2.5*Math.pow(Math.E, 0.61*minas.deuteriumStorage))},
      plasma: this.player.research.plasma}
  },

  // Devuelve un objeto con la informacion de los settings de una luna
  //  -planet = Numero de planeta que tiene la luna
  moonSetting: function (planet) {
    cuanticMoonsCordAux = [];
    for(let i = 0 ; i<this.player.planets.length ; i++){
      if(this.player.planets[i].moon.active && this.player.planets[i].moon.buildings.jumpGate > 0) cuanticMoonsCordAux.push({name: this.player.planets[i].moon.name, cord: this.player.planets[i].coordinates, num: i});
    }
    return {buildings: this.player.planets[planet].moon.buildings,
      values: {sunshade: this.player.planets[planet].moon.values.sunshade, beam: this.player.planets[planet].moon.values.beam},
      fleets: this.player.planets[planet].moon.fleet,
      cuanticTime: (this.player.planets[planet].moon.buildings.jumpGate === 0) ? 'Infinity' : this.player.planets[planet].moon.cuantic,
      cuanticMoonsCord: cuanticMoonsCordAux,
      campos: {campos: this.player.planets[planet].moon.campos, camposMax: this.player.planets[planet].moon.camposMax}
    };
  },

  // Devuelve un objeto con la informacion para servir la pagina overview
  //  -planet = Numero de planeta en el que el usuario esta parado
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

  // Devuelve un objeto con la informacion para servir la pagina de edificios
  //  -planet = Numero de planeta en el que el usuario esta parado
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

  // Devuelve un objeto que, por cada edificio, tiene la informacion de los costos, descripcion, etc.
  //  -player = Objeto con la informacion del jugador
  //  -planet = Numero de planeta en el que el usuario esta parado
  costBuildings: function (player, planet){
    let build = player.planets[planet].buildings;
    let energyAux = {metal: Math.floor(10*(build.metalMine+1)*Math.pow(1.1, (build.metalMine+1))), crystal: Math.floor(10*(build.crystalMine+1)*Math.pow(1.1, (build.crystalMine+1))), deuterium: Math.floor(20*(build.deuteriumMine+1)*Math.pow(1.1, (build.deuteriumMine+1)))};
    return {metalMine: {metal: Math.floor(60*Math.pow(1.5, build.metalMine)), crystal: Math.floor(15*Math.pow(1.5, build.metalMine)), deuterium: 0, energy: energyAux.metal, energyNeed: energyAux.metal-Math.floor(10*(build.metalMine)*Math.pow(1.1, (build.metalMine))), tech: true, level: build.metalMine, name: "Metal Mine", description: "Used in the extraction of metal ore, metal mines are of primary importance to all emerging and established empires."},
            crystalMine: {metal: Math.floor(48*Math.pow(1.6, build.crystalMine)), crystal: Math.floor(24*Math.pow(1.6, build.crystalMine)), deuterium: 0, energy: energyAux.crystal, energyNeed: energyAux.crystal-Math.floor(10*(build.crystalMine)*Math.pow(1.1, (build.crystalMine))), tech: true, level: build.crystalMine, name: "Crystal Mine", description: "Crystals are the main resource used to build electronic circuits and form certain alloy compounds."},
            deuteriumMine: {metal: Math.floor(225*Math.pow(1.5, build.deuteriumMine)), crystal: Math.floor(75*Math.pow(1.5, build.deuteriumMine)), deuterium: 0, energy: energyAux.deuterium, energyNeed: energyAux.deuterium-Math.floor(20*(build.deuteriumMine)*Math.pow(1.1, (build.deuteriumMine))), tech: true, level: build.deuteriumMine, name: "Deuterium Synthesizer", description: "Deuterium Synthesizers draw the trace Deuterium content from the water on a planet."},
            solarPlant: {metal: Math.floor(75*Math.pow(1.5, build.solarPlant)), crystal: Math.floor(30*Math.pow(1.5, build.solarPlant)), deuterium: 0, energy:  0, tech: true, level: build.solarPlant, name: "Solar Plant", description: "Solar power plants absorb energy from solar radiation. All mines need energy to operate."},
            fusionReactor: {metal: Math.floor(900*Math.pow(1.8, build.fusionReactor)), crystal: Math.floor(360*Math.pow(1.8, build.fusionReactor)), deuterium: Math.floor(180*Math.pow(1.8, build.fusionReactor)), energy: 0, tech: build.deuteriumMine >= 5 && player.research.energy >= 3, level: build.fusionReactor, name: "Fusion Reactor", description: "The fusion reactor uses deuterium to produce energy."},
            metalStorage: {metal: 1000*Math.pow(2, build.metalStorage), crystal: 0, deuterium: 0, energy: 0, tech: true, level: build.metalStorage, name: "Metal Storage", description: "Provides storage for excess metal."},
            crystalStorage: {metal: 1000*Math.pow(2, build.crystalStorage), crystal: 500*Math.pow(2, build.crystalStorage), deuterium: 0, energy: 0, tech: true, level: build.crystalStorage, name: "Crystal Storage", description: "Provides storage for excess crystal."},
            deuteriumStorage: {metal: 1000*Math.pow(2, build.deuteriumStorage), crystal: 1000*Math.pow(2, build.deuteriumStorage), deuterium: 0, energy: 0, tech: true, level: build.deuteriumStorage, name: "Deuterium Storage", description: "Giant tanks for storing newly-extracted deuterium."},
            robotFactory: {metal: 400*Math.pow(2, build.robotFactory), crystal: 120*Math.pow(2, build.robotFactory), deuterium: 200*Math.pow(2, build.robotFactory), energy: 0, tech: true, level: build.robotFactory, name: "Robotics Factory", description: "Robotic factories provide construction robots to aid in the construction of buildings. Each level increases the speed of the upgrade of buildings."},
            shipyard: {metal: 400*Math.pow(2, build.shipyard), crystal: 200*Math.pow(2, build.shipyard), deuterium: 100*Math.pow(2, build.shipyard), energy: 0, tech: build.robotFactory >= 2, level: build.shipyard, name: "Shipyard", description: "All types of ships and defensive facilities are built in the planetary shipyard."},
            researchLab: {metal: 200*Math.pow(2, build.researchLab), crystal: 400*Math.pow(2, build.researchLab), deuterium: 200*Math.pow(2, build.researchLab), energy: 0, tech: true, level: build.researchLab, name: "Research Lab", description: "A research lab is required in order to conduct research into new technologies."},
            alliance: {metal: 20000*Math.pow(2, build.alliance), crystal: 40000*Math.pow(2, build.alliance), deuterium: 0, energy: 0, tech: true, level: build.alliance, name: "Alliance Depot", description: "The alliance depot improve the expeditions rewards, also is essential to trade resourses in a moon."},
            silo: {metal: 20000*Math.pow(2, build.silo), crystal: 20000*Math.pow(2, build.silo), deuterium: 1000*Math.pow(2, build.silo), energy: 0, tech: build.shipyard >= 1, level: build.silo, name: "Silo", description: "Missile silos are used to store missiles."},
            naniteFactory: {metal: 1000000*Math.pow(2, build.naniteFactory), crystal: 500000*Math.pow(2, build.naniteFactory), deuterium: 100000*Math.pow(2, build.naniteFactory), energy: 0, tech: build.robotFactory >= 10 && player.research.computer >= 10, level: build.naniteFactory, name: "Nanite Factory", description: "This is the ultimate in robotics technology. Each level cuts the construction time for buildings, ships, and defences."},
            terraformer: {metal: 0, crystal: 50000*Math.pow(2, build.terraformer), deuterium: 100000*Math.pow(2, build.terraformer), energy: 1000*Math.pow(2, build.terraformer), tech: build.naniteFactory >= 1 && player.research.energy >= 12, level: build.terraformer, name: "Terraformer", description: "The terraformer increases the usable surface of planets."},
            solarSatellite: {metal: 0, crystal: 2000, deuterium: 500, energy: 0, tech: build.shipyard >= 1, level: player.planets[planet].fleet.solarSatellite, name: "Solar Satellite", description: "Solar satellites are simple platforms of solar cells, located in a high, stationary orbit. A solar satellite produces " + Math.floor(((player.planets[planet].temperature.max + player.planets[planet].temperature.min)/2+160)/6) + " energy on this planet."},
            listInfo: ["metalMine", "crystalMine", "deuteriumMine", "solarPlant", "fusionReactor", "solarSatellite", "metalStorage", "crystalStorage", "deuteriumStorage", "robotFactory", "shipyard", "researchLab", "alliance", "silo", "naniteFactory", "terraformer"],
            time: {mult: build.robotFactory, elev: build.naniteFactory},
            doing: player.planets[planet].buildingConstrucction
    };
  },

  // Devuelve un objeto que, por cada edificio lunar, tiene la informacion de los costos, descripcion, etc.
  //  -player = Objeto con la informacion del jugador
  //  -planet = Numero de planeta en el que el usuario esta parado
  costMoon: function (player, planet){
    let build = player.planets[planet].moon.buildings;
    let research = player.research;
    return {lunarBase: {metal: 10000*Math.pow(2, build.lunarBase), crystal: 20000*Math.pow(2, build.lunarBase), deuterium: 10000*Math.pow(2, build.lunarBase), energy: 0, tech: true, level: build.lunarBase, name: "Lunar Base", description: "Since the moon has no atmosphere, a lunar base is required to generate habitable space."},
            phalanx: {metal: 20000*Math.pow(2, build.phalanx), crystal: 40000*Math.pow(2, build.phalanx), deuterium: 20000*Math.pow(2, build.phalanx), energy: 0, tech: build.lunarBase >= 3, level: build.phalanx, name: "Phalanx", description: "Using the sensor phalanx, fleets of other empires can be discovered and observed. The bigger the sensor phalanx array, the larger the range it can scan."},
            spaceDock: {metal: 10000*Math.pow(3, build.spaceDock), crystal: 1000*Math.pow(2, build.spaceDock), deuterium: 5000*Math.pow(3, build.spaceDock), energy: 0, tech: build.lunarBase >= 1, level: build.spaceDock, name: "Space Dock", description: "Wreckages can be repaired in the Space Dock."},
            marketplace: {metal: 6000000*Math.pow(2, build.marketplace), crystal: 4000000*Math.pow(2, build.marketplace), deuterium: 2000000*Math.pow(2, build.marketplace), energy: 0, tech: build.lunarBase >= 2 && research.computer >= 8 && player.planets[planet].buildings.alliance >= 4, level: build.marketplace, name: "Marketplace", description: "The place for change resources with other empires, recolectors or even mysterious and dangerous people."},
            lunarSunshade: {metal: 15000*Math.pow(2, build.lunarSunshade), crystal: 0, deuterium: 50000*Math.pow(2, build.lunarSunshade), energy: 0, tech: build.lunarBase >= 1 && research.laser >= 12, level: build.lunarSunshade, name: "Lunar Sunshade", description: "The system that get cold your planet. For each level you can reduce 3 degrees the minimun temperature from your planet, growing up the deuterium producction but getting worse the energy levels."},
            lunarBeam: {metal: 0, crystal: 70000*Math.pow(2, build.lunarBeam), deuterium: 90000*Math.pow(2, build.lunarBeam), energy: 0, tech: build.lunarBase >= 1 && research.ion >= 12, level: build.lunarBeam, name: "Lunar Beam", description: "The system that warn your planet. For each level you can reduce 3 degrees the maximun temperature from your planet. The solar satellites will improve the energy."},
            jumpGate: {metal: 2000000*Math.pow(2, build.jumpGate), crystal: 4000000*Math.pow(2, build.jumpGate), deuterium: 2000000*Math.pow(2, build.jumpGate), energy: 0, tech: build.lunarBase >= 1 && research.hyperspace >= 7, level: build.jumpGate, name: "Jump Gate", description: "Jump gates are huge transceivers capable of sending even the biggest fleet in no time to a distant jump gate."},
            moonShield: {metal: 9000000*Math.pow(3, build.moonShield), crystal: 5000000*Math.pow(3, build.moonShield), deuterium: 2000000*Math.pow(3, build.moonShield), energy: 0, tech: build.lunarBase >= 4 && research.graviton >= 1 && research.shielding >= 12, level: build.moonShield, name: "Moon Shield", description: "The ultimate defense system. Even the deathstar be afraid of the shield."},
            listInfo: ["lunarBase", "phalanx", "spaceDock", "marketplace", "lunarSunshade", "lunarBeam", "jumpGate", "moonShield"],
            time: {mult: build.lunarBase, elev: player.planets[planet].buildings.naniteFactory},
            doing: player.planets[planet].moon.buildingConstrucction
    };
  },

  // Devuelve un objeto que, por cada tecnologia, tiene la informacion de los costos, descripcion, etc.
  //  -player = Objeto con la informacion del jugador
  //  -planet = Nivel del laboratorio de investigacion que tiene el planeta actual
  costResearch: function (player, lab){
    let research = player.research;
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
            doing: player.researchConstrucction
    };
  },

  // Devuelve un objeto que, por cada nave, tiene la informacion de los costos, descripcion, etc.
  //  -player = Objeto con la informacion del jugador
  //  -planet = Numero de planeta en el que el usuario esta parado
  //  -moon   = Booleano que es true si estamos en la luna y false si no
  costShipyard: function(player, planet, moon){
    let fleet = (moon) ? player.planets[planet].moon.fleet : player.planets[planet].fleet;
    let research = player.research;
    let yard = player.planets[planet].buildings.shipyard;
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
            solarSatellite: {metal: 0, crystal: 2000, deuterium: 500, energy: 0, tech: yard >= 1, level: fleet.solarSatellite, name: "Solar Satellite", description: "Solar satellites are simple platforms of solar cells, located in a high, stationary orbit. A solar satellite produces " + Math.floor(((player.planets[planet].temperature.max + player.planets[planet].temperature.min)/2+160)/6) + " energy on this planet."},
            listInfo: ["lightFighter", "heavyFighter", "cruiser", "battleship", "battlecruiser", "bomber", "destroyer", "deathstar", "smallCargo", "largeCargo", "colony", "recycler", "espionageProbe", "solarSatellite"],
            time: {mult: yard, elev: player.planets[planet].buildings.naniteFactory},
            doing: player.planets[planet].shipConstrucction
    };
  },

  // Devuelve un objeto que, por cada defensa, tiene la informacion de los costos, descripcion, etc.
  //  -player = Objeto con la informacion del jugador
  //  -planet = Numero de planeta en el que el usuario esta parado
  costDefense: function(player, planet){
    let defense = player.planets[planet].defense;
    let research = player.research;
    let yard = player.planets[planet].buildings.shipyard;
    return {rocketLauncher: {metal: 2000, crystal: 0, deuterium: 0, energy: 0, tech: yard >= 1, level: defense.rocketLauncher, name: "Rocket Launcher", description: "The rocket launcher is a simple, cost-effective defensive option."},
            lightLaser: {metal: 1500, crystal: 500, deuterium: 0, energy: 0, tech: yard >= 2 && research.laser >= 3, level: defense.lightLaser, name: "Light Laser", description: "Concentrated firing at a target with photons can produce significantly greater damage than standard ballistic weapons."},
            heavyLaser: {metal: 6000, crystal: 2000, deuterium: 0, energy: 0, tech: yard >= 4 && research.laser >= 6 && research.energy >= 3, level: defense.heavyLaser, name: "Heavy Laser", description: "The heavy laser is the logical development of the light laser."},
            gauss: {metal: 20000, crystal: 15000, deuterium: 0, energy: 0, tech: yard >= 6 && research.weapons >= 3 && research.energy >= 6 && research.shielding >= 1, level: defense.gauss, name: "Gauss Cannon", description: "The Gauss Cannon fires projectiles weighing tons at high speeds."},
            ion: {metal: 2000, crystal: 6000, deuterium: 0, energy: 0, tech: yard >= 4 && research.ion >= 4, level: defense.ion, name: "Ion Cannon", description: "The Ion Cannon fires a continuous beam of accelerating ions, causing considerable damage to objects it strikes."},
            plasma: {metal: 50000, crystal: 50000, deuterium: 30000, energy: 0, tech: yard >= 8 && research.plasma >= 7, level: defense.plasma, name: "Plasma Turret", description: "Plasma Turrets release the energy of a solar flare and surpass even the destroyer in destructive effect."},
            smallShield: {metal: 10000, crystal: 10000, deuterium: 0, energy: 0, tech: yard >= 1 && research.shielding >= 2, level: defense.smallShield, name: "Small Shield Dome", description: "The small shield dome covers an entire planet with a field which can absorb a tremendous amount of energy."},
            largeShield: {metal: 50000, crystal: 50000, deuterium: 0, energy: 0, tech: yard >= 6 && research.shielding >= 6, level: defense.largeShield, name: "Large Shield Dome", description: "The evolution of the small shield dome can employ significantly more energy to withstand attacks."},
            antiballisticMissile: {metal: 8000, crystal: 0, deuterium: 2000, energy: 0, tech: player.planets[planet].buildings.silo >= 2, level: defense.antiballisticMissile, name: "Anti-Ballistic Missiles", description: "Anti-Ballistic Missiles destroy attacking interplanetary missiles"},
            interplanetaryMissile: {metal: 12500, crystal: 2500, deuterium: 10000, energy: 0, tech: player.planets[planet].buildings.silo >= 4 && research.impulse >= 1 , level: defense.interplanetaryMissile, name: "Interplanetary Missiles", description: "Anti-Ballistic Missiles destroy attacking interplanetary missiles"},
            listInfo: ["rocketLauncher", "lightLaser", "heavyLaser", "gauss", "ion", "plasma", "smallShield", "largeShield", "antiballisticMissile", "interplanetaryMissile"],
            time: {mult: yard, elev: player.planets[planet].buildings.naniteFactory},
            doing: player.planets[planet].shipConstrucction
    };
  },

  // Devuelve un objeto con la informacion para servir la pagina de fleet
  //  -planet = Numero de planeta en el que el usuario esta parado
  //  -moon = Booleano que indica si esta en una luna o no
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

  // Devuelve un objeto con la informacion para servir la pagina de galaxia
  //  -planet = Numero de planeta en el que el usuario esta parado
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

  // Devuelve un objeto con la informacion de cuantas naves mandar para cada ataque automatico
  getQuickAtackDataOptions: function(){
    return {esp: this.player.sendEspionage,
            small: this.player.sendSmall,
            large: this.player.sendLarge};
  },

  // Empieza la construccion de un edificion en un planeta
  //  -player = Objeto con la informacion del jugador
  //  -planet = numero de planeta
  //  -buildingName = String con el nombre del edificio a mejorar
  //  -res = Respuesta a enviar al cliente
  proccesBuildRequest: function(player, planet, buildingName, res){
    if(!player.planets[planet].buildingConstrucction.active){
      let objPrice = this.costBuildings(player, planet);
      if(objPrice[buildingName] != undefined){
        let enough = fun.recursosSuficientes(player.planets[planet].resources, objPrice[buildingName]);
        let {metal, crystal, deuterium, energy, tech} = objPrice[buildingName];
        let enoughEnergy = buildingName !== 'terraformer' || energy <= player.planets[planet].resourcesAdd.energy;
        let enoughFields = buildingName === 'terraformer' || (player.planets[planet].campos + 1) < player.planets[planet].camposMax;
        if(enough && tech && enoughEnergy && enoughFields){
          let buildingConstrucctionAux = {};
          let buildingConstrucction    = {};
          let objInc                   = {};
          buildingConstrucctionAux.active    = true;
          buildingConstrucctionAux.metal     = metal;
          buildingConstrucctionAux.crystal   = crystal;
          buildingConstrucctionAux.deuterium = deuterium;
          buildingConstrucctionAux.item      = buildingName;
          buildingConstrucctionAux.init      = fun.horaActual();
          buildingConstrucctionAux.time      = fun.timeBuild(metal + crystal, objPrice.time.mult, objPrice.time.elev, this.universo.speed);
          buildingConstrucction['planets.' + planet + '.buildingConstrucction'] = buildingConstrucctionAux;
          player.planets[planet].buildingConstrucction    = buildingConstrucctionAux;
          objInc['planets.' + planet + '.resources.metal']     = -metal;
          objInc['planets.' + planet + '.resources.crystal']   = -crystal;
          objInc['planets.' + planet + '.resources.deuterium'] = -deuterium;
          events.addElement({time: buildingConstrucctionAux.init + buildingConstrucctionAux.time*1000, player: player.name});
          base.savePlayerData(player.name, buildingConstrucction, objInc, undefined, undefined, () => {
            res.send({ok: true});
          });
        }else{ // Manejo de los errores
          let mesAux = '';
          if(!enough){
            mesAux = "Recursos no suficientes";
          }else if(!tech){
            mesAux = "Tecnologia no alcanzada";
          }else if(!enoughEnergy){
            mesAux = "No hay energia suficiente para construir el terraformer";
          }else{
            mesAux = "Campos insuficientes";
          }
          res.send({ok: false, mes: mesAux});
        }
      }else{
        res.send({ok: false, mes: "Edificio invalido"});
      }
    }else{
      res.send({ok: false, mes: "Ya se esta construyendo un edificio en ese planeta"});
    }
  },

  // Empieza la construccion de un edificion en una luna
  //  -player = Objeto con la informacion del jugador
  //  -planet = Numero de planeta
  //  -buildingName = String con el nombre del edificio a mejorar
  //  -res = Respuesta a enviar al cliente
  proccesMoonRequest: function(player, planet, buildingName, res){
    if(!player.planets[planet].moon.buildingConstrucction.active){
      let objPrice = this.costMoon(player, planet);
      if(objPrice[buildingName] != undefined){
        let enough = fun.recursosSuficientes(player.planets[planet].moon.resources, objPrice[buildingName]);
        let {metal, crystal, deuterium, tech} = objPrice[buildingName];
        let enoughFields = buildingName === 'lunarBase'|| (player.planets[planet].moon.campos+1) < player.planets[planet].moon.camposMax;
        if(enough && tech && enoughFields){
          let buildingConstrucctionAux = {};
          let buildingConstrucction    = {};
          let objInc                   = {};
          buildingConstrucctionAux.active    = true;
          buildingConstrucctionAux.metal     = metal;
          buildingConstrucctionAux.crystal   = crystal;
          buildingConstrucctionAux.deuterium = deuterium;
          buildingConstrucctionAux.item      = buildingName;
          buildingConstrucctionAux.init      = fun.horaActual();
          buildingConstrucctionAux.time      = fun.timeBuild(metal + crystal, objPrice.time.mult, objPrice.time.elev, this.universo.speed);
          buildingConstrucction['planets.' + planet + '.moon.buildingConstrucction'] = buildingConstrucctionAux;
          player.planets[planet].buildingConstrucction = buildingConstrucctionAux;
          objInc['planets.' + planet + '.moon.resources.metal']     = -metal;
          objInc['planets.' + planet + '.moon.resources.crystal']   = -crystal;
          objInc['planets.' + planet + '.moon.resources.deuterium'] = -deuterium;
          events.addElement({time: buildingConstrucctionAux.init + buildingConstrucctionAux.time*1000, player: player.name});
          base.savePlayerData(player.name, buildingConstrucction, objInc, undefined, undefined, () => {
            res.send({ok: true});
          });
        }else{ // Manejo de errores
          let mesAux = '';
          if(!enough){
            mesAux = "Recursos insuficientes";
          }else if(!tech){
            mesAux = "Tecnologia no alcanzada";
          }else{
            mesAux = "Campos insuficientes";
          }
          res.send({ok: false, mes: mesAux});
        }
      }else{
        res.send({ok: false, mes: "Edificio invalido"});
      }
    }else{
      res.send({ok: false, mes: "Ya se esta contruyendo un edificio en esa luna"});
    }
  },

  // Empieza la investigacion de una tecnologia
  //  -player = Objeto con la informacion del jugador
  //  -planet = numero de planeta que inicia la investigacion
  //  -researchName = String con el nombre de la tecnologia a investigar
  //  -res = Respuesta a enviar al cliente
  proccesResearchRequest: function(player, planet, researchName, res){
    if(!player.researchConstrucction.active){
      let objPrice = this.costResearch(player, player.planets[planet].buildings.researchLab);
      if(objPrice[researchName] != undefined){
        let enough = fun.recursosSuficientes(player.planets[planet].resources, objPrice[researchName]);
        let {metal, crystal, deuterium, energy, tech} = objPrice[researchName];
        if(enough && tech && energy <= player.planets[planet].resourcesAdd.energy){
          let researchConstrucctionAux = {};
          let researchConstrucction    = {};
          let objInc                   = {};
          researchConstrucctionAux.active    = true;
          researchConstrucctionAux.metal     = metal;
          researchConstrucctionAux.crystal   = crystal;
          researchConstrucctionAux.deuterium = deuterium;
          researchConstrucctionAux.item      = researchName;
          researchConstrucctionAux.planet    = planet;
          researchConstrucctionAux.init      = fun.horaActual();
          researchConstrucctionAux.time      = fun.timeBuild(metal + crystal, objPrice.time.mult, objPrice.time.elev, this.universo.speed);
          researchConstrucction['researchConstrucction'] = researchConstrucctionAux;
          player.researchConstrucction = researchConstrucctionAux;
          objInc['planets.' + planet + '.resources.metal']     = -metal;
          objInc['planets.' + planet + '.resources.crystal']   = -crystal;
          objInc['planets.' + planet + '.resources.deuterium'] = -deuterium;
          events.addElement({time: researchConstrucctionAux.init + researchConstrucctionAux.time*1000, player: player.name});
          base.savePlayerData(player.name, researchConstrucction, objInc, undefined, undefined, () => {
            res.send({ok: true});
          });
        }else{
          res.send({ok: false, mes: ((tech) ? "Recursos insuficientes" : "Tecnologia no alcanzada")});
        }
      }else{
        res.send({ok: false, mes: "Investigacion invalida"});
      }
    }else{
      res.send({ok: false, mes: "Ya se esta investigando algo"});
    }
  },

  // Empieza la construccion una cantidad de naves o defensa en un planeta
  //  -player = Objeto con la informacion del jugador
  //  -planet = numero de planeta
  //  -shipyardName = String con el nombre de la nave o defensa a construir
  //  -shipyardCant = Cantidad de naves o defensas a construir
  //  -res = Respuesta a enviar al cliente
  proccesShipyardRequest: function(player, planet, shipyardName, shipyardCant, res){
    shipyardCant = parseInt(shipyardCant);
    if(fun.validInt(shipyardCant) && fun.validShipyardName(shipyardName) && shipyardCant > 0){
      let objPrice = {...this.costShipyard(player, planet, false), ...this.costDefense(player, planet)};
      let enough = fun.recursosSuficientes(player.planets[planet].resources, objPrice[shipyardName], shipyardCant);
      let {metal, crystal, deuterium, name, tech} = objPrice[shipyardName];
      if(enough && tech){
        // Si voy a construir misiles en el silo, me fijo que haya capacidad para los misiles
        if((shipyardName === "antiballisticMissile" || shipyardName === "interplanetaryMissile") && (shipyardCant + fun.cantidadMisiles(planeta) < fun.capacidadSilo(planeta))){
          return res.send({ok: false, mes: "No hay mas espacio en el silo"});
        }
        let shipyardConstrucctionAux = {};
        let shipyardConstrucction    = {};
        let objInc                   = {};
        let defensa                  = false;
        shipyardConstrucctionAux.cant         = shipyardCant;
        shipyardConstrucctionAux.metal        = metal*shipyardCant;
        shipyardConstrucctionAux.crystal      = crystal*shipyardCant;
        shipyardConstrucctionAux.deuterium    = deuterium*shipyardCant;
        shipyardConstrucctionAux.metalOne     = metal;
        shipyardConstrucctionAux.crystalOne   = crystal;
        shipyardConstrucctionAux.deuteriumOne = deuterium;
        shipyardConstrucctionAux.name         = name;
        shipyardConstrucctionAux.item         = shipyardName;
        shipyardConstrucctionAux.new          = true;
        shipyardConstrucctionAux.init         = fun.horaActual();
        shipyardConstrucctionAux.time         = fun.timeBuild(metal + crystal, objPrice.time.mult, objPrice.time.elev, this.universo.speed);
        shipyardConstrucctionAux.timeNow      = shipyardConstrucctionAux.time;
        for(let i = 0 ; i<objPrice.listInfo.length && !defensa ; i++){
          if(objPrice.listInfo[i] === shipyardName) defensa = true;
        }
        shipyardConstrucctionAux.def = defensa;
        shipyardConstrucction['planets.' + planet + '.shipConstrucction'] = shipyardConstrucctionAux;
        player.planets[planet].shipConstrucction.push(shipyardConstrucctionAux);
        objInc['planets.' + planet + '.resources.metal']     = -metal*shipyardCant;
        objInc['planets.' + planet + '.resources.crystal']   = -crystal*shipyardCant;
        objInc['planets.' + planet + '.resources.deuterium'] = -deuterium*shipyardCant;
        let tiempoEnCola = fun.calculaTiempoFaltante(player.planets[planet].shipConstrucction);
        events.addElement({time: shipyardConstrucctionAux.init + tiempoEnCola, player: player.name});
        base.savePlayerData(player.name, undefined, objInc, shipyardConstrucction, undefined, () => {
          res.send({ok: true});
        });
      }else{
        res.send({ok: false, mes: ((tech) ? "Recursos insuficientes" : "Tecnologia no alcanzada")});
      }
    }else{
      res.send({ok: false, mes: "Cantidad o nave no valida"});
    }
  },

  // Cancela la construccion del edificio que se este mejorando en el planeta
  //  -player = Objeto con la informacion del jugador
  //  -planet = Numero de planeta
  //  -res = Respuesta a enviar al cliente
  cancelBuildRequest: function(player, planet, res){
    if(player.planets[planet].buildingConstrucction.active){
      let objSet = {};
      let objInc = {};
      let {metal, crystal, deuterium, init, time} = player.planets[planet].buildingConstrucction;
      objSet['planets.' + planet + '.buildingConstrucction'] = {active: false};
      objInc['planets.' + planet + '.resources.metal']       = metal;
      objInc['planets.' + planet + '.resources.crystal']     = crystal;
      objInc['planets.' + planet + '.resources.deuterium']   = deuterium;
      events.remove({time: init + time*1000, player: player.name});
      base.savePlayerData(player.name, objSet, objInc, undefined, undefined, () => {
        res.send({ok: true});
      });
    }else{
      res.send({ok: false, mes: "No se esta construyendo ningun edificio en ese planeta"});
    }
  },

  // Cancela la construccion del edificio que se este mejorando en la luna
  //  -player = Objeto con la informacion del jugador
  //  -planet = Numero del planeta de la luna
  //  -res = Respuesta a enviar al cliente
  cancelMoonRequest: function(player, planet, res){
    if(player.planets[planet].moon.active && player.planets[planet].moon.buildingConstrucction.active){
      let objSet = {};
      let objInc = {};
      let {metal, crystal, deuterium, init, time} = player.planets[planet].moon.buildingConstrucction;
      objSet['planets.' + planet + '.moon.buildingConstrucction'] = {active: false};
      objInc['planets.' + planet + '.moon.resources.metal']       = metal;
      objInc['planets.' + planet + '.moon.resources.crystal']     = crystal;
      objInc['planets.' + planet + '.moon.resources.deuterium']   = deuterium;
      events.remove({time: init + time*1000, player: player.name});
      base.savePlayerData(player.name, objSet, objInc, undefined, undefined, () => {
        res.send({ok: true});
      });
    }else{
      res.send({ok: false, mes: ((player.planets[planet].moon.active) ? "No se esta construyendo nada en la luna" : "No existe la luna...")});
    }
  },

  // Cancela la investigacion de la tecnologia que se esta mejorando
  //  -player = Objeto con la informacion del jugador
  //  -res = Respuesta a enviar al cliente
  cancelResearchRequest: function(player, res){
    if(player.researchConstrucction.active){
      let objSet = {};
      let objInc = {};
      let {metal, crystal, deuterium, init, time, planet} = player.researchConstrucction;
      objSet['researchConstrucction'] = {active: false};
      objInc['planets.' + planet + '.resources.metal']     = metal;
      objInc['planets.' + planet + '.resources.crystal']   = crystal;
      objInc['planets.' + planet + '.resources.deuterium'] = deuterium;
      events.remove({time: init + time*1000, player: player.name});
      base.savePlayerData(player.name, objSet, objInc, undefined, undefined, () => {
        res.send({ok: true});
      });
    }else{
      res.send({ok: false, mes: "No se esta investigando nada"});
    }
  },

  // Cancela una pedido de construccion de una nave en un planeta
  //  -player = Objeto con la informacion del jugador
  //  -planet = Numero de planeta
  //  -shipyardName = Nombre de la nave a cancelar su construccion
  //  -res = Respuesta a enviar al cliente
  cancelShipyardRequest: function(player, planet, shipyardName, res){
    let objPull = {};
    let objInc  = {};
    objInc['planets.' + planet + '.resources.metal']     = 0;
    objInc['planets.' + planet + '.resources.crystal']   = 0;
    objInc['planets.' + planet + '.resources.deuterium'] = 0;
    for(let i = 0 ; i<player.planets[planet].shipConstrucction.length ; i++){
      console.log(player.planets[planet].shipConstrucction[i]);
      if(player.planets[planet].shipConstrucction[i].item === shipyardName){
        objInc['planets.' + planet + '.resources.metal']     += player.planets[planet].shipConstrucction[i].metal;
        objInc['planets.' + planet + '.resources.crystal']   += player.planets[planet].shipConstrucction[i].crystal;
        objInc['planets.' + planet + '.resources.deuterium'] += player.planets[planet].shipConstrucction[i].deuterium;
        events.remove({time: player.planets[planet].shipConstrucction[i].init + player.planets[planet].shipConstrucction[i].time*1000, player: player.name});
      }
    }
    objPull['planets.' + planet + '.shipConstrucction'] = {item: shipyardName};
    base.savePlayerData(player.name, undefined, objInc, undefined, objPull, () => {
      res.send({ok: true});
    });
  },

  // Cambia los niveles de produccion de las minas y con eso updatea los niveles de energia usados por cada una
  //  -f = Funcion que se ejecuta despues de guardar los nuevos valores en la base de datos
  //  -player = Objeto con la infomacion sobre el jugador
  //  -planet = Numero de planeta
  //  -obj = Objeto con los nuevos valores de los multiplicadores, es null los valores quedan iguales pero actualiza los niveles de energia y produccion de cada mina
  updateResourcesData: function(f, player, planet, obj = undefined) { // Updatea los multiplicadores de los recursos(NO toca los recursos)
    let objSet = {};
    let spd    = this.universo.speed;
    let plasma = player.research.plasma;
    let minas  = player.planets[planet].buildings;
    let temp   = (player.planets[planet].temperature.max + player.planets[planet].temperature.min)/2;
    if(obj != undefined && fun.validResourcesSettingsObj(obj, false)){
      player.planets[planet].resourcesPercentage = obj;
      objSet['planets.$.resourcesPercentage'] = obj;
    }
    fun.objStringToNum(player.planets[planet].resourcesPercentage);
    let maxEnergyAux = {metal: Math.floor(player.planets[planet].resourcesPercentage.metal * minas.metalMine * Math.pow(1.1, minas.metalMine)),
                        crystal: Math.floor(player.planets[planet].resourcesPercentage.crystal * minas.crystalMine * Math.pow(1.1, minas.crystalMine)),
                        deuterium: Math.floor(2*player.planets[planet].resourcesPercentage.deuterium * minas.deuteriumMine * Math.pow(1.1, minas.deuteriumMine))};
    let auxEnergy = {solar: Math.floor(20 * minas.solarPlant * Math.pow(1.1,minas.solarPlant)),
                     fusion: Math.floor(3 * minas.fusionReactor * player.planets[planet].resourcesPercentage.energy * Math.pow(1.05 + 0.01*player.research.energy, minas.fusionReactor)),
                     fusionDeuterium: -Math.floor(minas.fusionReactor * player.planets[planet].resourcesPercentage.energy * Math.pow(1.1, minas.fusionReactor)),
                     satillite: Math.floor((temp+160)/6)*player.planets[planet].fleet.solarSatellite};
    let energyTotal      = auxEnergy.solar + auxEnergy.fusion + auxEnergy.satillite;
    let totalEnergyUsage = maxEnergyAux.metal + maxEnergyAux.crystal + maxEnergyAux.deuterium;
    let energyUsage = {metal: Math.floor((maxEnergyAux.metal*energyTotal)/totalEnergyUsage),
                       crystal: Math.floor((maxEnergyAux.crystal*energyTotal)/totalEnergyUsage),
                       deuterium: Math.floor((maxEnergyAux.deuterium*energyTotal)/totalEnergyUsage)};
    energyUsage = {metal: ((energyUsage.metal > maxEnergyAux.metal) ? maxEnergyAux.metal : energyUsage.metal),
                   crystal: ((energyUsage.crystal > maxEnergyAux.crystal) ? maxEnergyAux.crystal : energyUsage.crystal),
                   deuterium: ((energyUsage.deuterium > maxEnergyAux.deuterium) ? maxEnergyAux.deuterium : energyUsage.deuterium)};
    let energy = Math.floor(energyTotal - maxEnergyAux.metal - maxEnergyAux.crystal - maxEnergyAux.deuterium);
    objSet['planets.$.resources.energy'] = energy;
    let deuteriumHour = spd * ((isNaN(energyUsage.deuterium/maxEnergyAux.deuterium)) ? 0 : (energyUsage.deuterium/maxEnergyAux.deuterium)) * player.planets[planet].resourcesPercentage.deuterium * minas.deuteriumMine*Math.pow(1.1, minas.deuteriumMine)*(1.36-0.004*temp)*(100+plasma/3)/100 + auxEnergy.fusionDeuterium;
    if(deuteriumHour < 0) deuteriumHour = 0; // Si la ganancia de deuterio es nagativa se la redondea a 0
    objSet['planets.$.resourcesAdd'] = {metal: 30*spd+3*((isNaN(energyUsage.metal/maxEnergyAux.metal)) ? 0 : (energyUsage.metal/maxEnergyAux.metal))*spd*player.planets[planet].resourcesPercentage.metal*minas.metalMine*Math.pow(1.1, minas.metalMine)*(100+plasma)/100,
                                        crystal: 15*spd+2*((isNaN(energyUsage.crystal/maxEnergyAux.crystal)) ? 0 : (energyUsage.crystal/maxEnergyAux.crystal))*spd*player.planets[planet].resourcesPercentage.crystal*minas.crystalMine*Math.pow(1.1, minas.crystalMine)*(100+plasma*(2/3))/100,
                                        deuterium: deuteriumHour,
                                        energy: energyTotal};
    player.planets[planet].resourcesAdd     = objSet['planets.$.resourcesAdd'];
    player.planets[planet].resources.energy = energy;
    if(obj != undefined){
      base.updateResourcesDataBase(player.planets[planet].coordinates, objSet, () => {f();});
    }
  },

  // Cambia los niveles de produccion de los edificios de la luna y actualiza la temperatura del planeta
  //  -f = Funcion que se ejecuta despues de guardar los nuevos valores en la base de datos
  //  -player = Objeto con la infomacion sobre el jugador
  //  -planet = Numero de planeta
  //  -obj = Objeto con los nuevos niveles de produccion de sunshade y lunar beam
  updateResourcesDataMoon: function(f, player, planet, obj){
    if(obj != null && fun.validResourcesSettingsObj(obj, true)){
      let objSet = {};
      obj.sunshade = parseInt(obj.sunshade);
      obj.beam     = parseInt(obj.beam);

      // Recalcula la temperatura del planeta
      objSet['planets.$.temperature'] = {max: Math.floor(player.planets[planet].temperatureNormal.max+player.planets[planet].moon.buildings.lunarBeam*4*obj.beam/10-player.planets[planet].moon.buildings.lunarSunshade*4*obj.sunshade/10),
                                         min: Math.floor(player.planets[planet].temperatureNormal.min+player.planets[planet].moon.buildings.lunarBeam*4*obj.beam/10-player.planets[planet].moon.buildings.lunarSunshade*4*obj.sunshade/10)};
      objSet['planets.$.moon.values'] = obj;
      base.updateResourcesDataBase(player.planets[planet].coordinates, objSet, () => {
        // Recalcula la produccion de las minas y guarda todo en la base de datos
        this.updateResourcesData(f, player, planet, player.planets[planet].resourcesPercentage);
      });
    }
  },

  // Agrega un movement de ida
  //  -player = Objeto con la informacion del jugador
  //  -planet = Numero de planeta
  //  -moon = Booleno que es true si la flota sale de la luna y false si sale del planeta
  //  -obj = Objeto con la informacion del cliente sobre a donde se dirige la flota
  //  -res = Objeto respuesta a enviar al cliente
  addFleetMovement: function(player, planet, moon, obj, res){
    // Verifica que las cordenadas sean validas
    if(!fun.coordenadaValida(obj.coorDesde)){
      res.json({ok: false, mes: "Coordenadas de origen invalidas"});
      return res;
    }
    if(!fun.coordenadaValida(obj.coorHasta)){
      res.json({ok: false, mes: "Coordenadas de destino invalidas"});
      return res;
    }

    // Verifica que no se este enviando una flota a la misma posicion de salida
    if((fun.equalCoor(obj.coorDesde, obj.coorHasta)) && ((moon && obj.destination === 2) || (!moon && obj.destination === 1))){
      res.json({ok: false, mes: "No se puede mandar una flota de un lugar a si mismo"});
      return res;
    }

    // Verifica que las naves enviadas sean validas
    if(!fun.validShips(obj.ships)){
      res.json({ok: false, mes: "Naves no validas"});
      return res;
    }

    // Verifica que halla espacio para una flota o expedicion mas (Comentar el if para tener slot infinitos)
    let fleetExpeditionObj = fun.getCantFleets(player);
    if(fleetExpeditionObj.fleets >= player.research.computer+1){
      res.json({ok: false, mes: "No hay mas espacio para otra flota."});
      return res;
    }else if(obj.mission === 0 && fleetExpeditionObj.expeditions >= Math.floor(Math.sqrt(player.research.astrophysics))){
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
    let navesInfo       = fun.navesInfo(player.research.combustion, player.research.impulse, player.research.hyperspace_drive);
    for(let item in obj.ships){
      if(item !== 'misil'){
        if(moon){
          if(obj.ships[item] > player.planets[planet].moon.fleet[item]) thereIsNoFleet = true;
        }else{
          if(obj.ships[item] > player.planets[planet].fleet[item]) thereIsNoFleet = true;
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
    if(misil && obj.mission !== 6){
      res.json({ok: false, mes: "Los misiles solo pueden ser eviados a misilear."});
      return res;
    }
    if(!fleetVoid && obj.mission === 6){
      res.json({ok: false, mes: "No se puede misilear con naves que no sean misiles."});
      return res;
    }
    if(obj.ships['misil'] > ((moon) ? 0 : player.planets[planet].defense["interplanetaryMissile"])){
      thereIsNoFleet = true;
    }
    switch (obj.mission) {
      case 0: // Expedition
        validMission = obj.coorHasta.pos === 16 && !misil;
        break;
      case 1: // Colonisation
        validMission = obj.ships.colony > 0 && !misil;
        break;
      case 2: // Recycle
        validMission = obj.ships.recycler > 0 && obj.destination === 3 && !misil;
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
    if(obj.mission !== 0 && obj.coorHasta.pos === 16) validMission = false;
    let deuterioDisponible = (moon) ? player.planets[planet].moon.resources.deuterium : player.planets[planet].resources.deuterium;
    if(!fleetVoid || misil){
      flotaValida = true;
      if(misil){
        minSpeed = navesInfo['misil'].speed;
        if(obj.coorDesde.gal !== obj.coorHasta.gal || Math.abs(obj.coorDesde.sys - obj.coorHasta.sys) > (player.research.impulse * 5)){
          res.json({ok: false, mes: "No se puede misilear una posicion tan lejana."});
          return res;
        }
      }
    }
    if(validMission && !thereIsNoFleet && isFinite(minSpeed) && neededDeuterium <= deuterioDisponible - obj.resources.deuterium){
      if(fun.recursosSuficientes((moon) ? player.planets[planet].moon.resources : player.planets[planet].resources, obj.resources)){
        fun.objStringToNum(obj.resources);  // Paso los recursos de strings a integer
        if(maxCarga >= obj.resources.metal + obj.resources.crystal + obj.resources.deuterium){

          // Calculo cuanto tarda la flota en llegar
          let time = Math.ceil((10+(35000/obj.porce)*Math.sqrt(10*distancia/minSpeed)) / this.universo.speedFleet);
          // Si es una expedicion le agrego una hora mas un tiempo random
          if(obj.mission === 0) time += 3600 + Math.ceil(Math.random()*3600);

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
          pushObjAux['duracion']    = time;            // Cuanto tarda el viaje en segundos
          pushObjAux['time']        = fun.horaActual();// Tiempo en que empezo el viaje
          pushObjAux['llegada']     = fun.horaActual() + time*1000; // Tiempo en que la flota llega
          pushObjAux['desdeName']   = player.planets[planet].name;  // Nombre del planeta de salida
          pushObjAux['desdeType']   = player.planets[planet].type;  // Tipo del planeta de salida
          pushObjAux['desdeColor']  = player.planets[planet].color; // Color del planeta de salida
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
            if(clave !== 'misil'){
              if(moon){
                player.planets[planet].moon.fleet[clave] -= obj.ships[clave];
              }else{
                player.planets[planet].fleet[clave] -= obj.ships[clave];
              }
              objInc['planets.$' + moonString + 'fleet.' + clave] = -obj.ships[clave];
            }
          }
          // Resto los misiles que se enviaron
          objInc['planets.$' + moonString + 'defense.interplanetaryMissile'] = -obj.ships['misil'];
          player.movement.push(pushObj);
          player.planets[planet].resources.metal -= obj.resources.metal;
          player.planets[planet].resources.crystal -= obj.resources.crystal;
          player.planets[planet].resources.deuterium -= obj.resources.deuterium;
          events.addElement({time: pushObjAux['llegada'], player: player.name});
          if(obj.mission >= 5 && fun.estaColonizado(this.allCord, obj.coorHasta)){ // Updateo al jugador atacado o espiado, un segundo antes de que llague la flota
            let destinoNamePlayer = fun.playerName(this.allCord, obj.coorHasta);
            if(destinoNamePlayer !== player.name){
              events.addElement({time: (pushObjAux['llegada'] - 1000), player: destinoNamePlayer});
            }
          }
          base.pushMovementToDataBase(player.planets[planet].coordinates, objInc, pushObj);
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

  // Pasa la flota de una luna con salto cuantico a otra luna con salto cuantico
  //  -player = Objeto con la informacion del jugador
  //  -planet = Numero de planeta
  //  -obj = Objeto con informacion del cliente de a donde va la flota
  moveCuanticFleet: function(player, planet, obj, res){
    if(player.planets[planet].moon.active && player.planets[planet].moon.buildings.jumpGate > 0 && fun.estaColonizado(this.allCord, obj.coorHasta)){
      let index = fun.getIndexOfPlanet(player.planets, obj.coorHasta);
      // Se fija que se salte a otra luna, que exista la luna a la que se quiere saltar y que tenga salto cuantico
      if(index !== planet && player.planets[index].moon.active && player.planets[index].moon.buildings.jumpGate > 0){
        // Se fija que el salto cuantico de salida este listo para usar (el de destino no necesita estar listo)
        if(player.planets[planet].moon.cuantic - fun.horaActual() <= 0){
          let incorrerctFleet = false;  // Se fija que la cantidad de flotas este bien
          let zeroFleet = true;
          for(let item in obj.ships){
            if(!fun.validInt(obj.ships[item]) || obj.ships[item] < 0) obj.ships[item] = 0;
            if(obj.ships[item] > 0) zeroFleet = false;
            if(obj.ships[item] > player.planets[planet].moon.fleet[item]) incorrerctFleet = true;
          }
          if(!incorrerctFleet && !zeroFleet){ // Paso las naves a la luna que salto y actualizo la info de la luna
            base.addPlanetData(obj.coorHasta, fun.zeroResources(), obj.ships, true);
            base.updateCuantic(player.planets[planet].coordinates, fun.negativeObj(obj.ships), fun.horaActual() + Math.floor(12*3600*1000 / player.planets[planet].moon.buildings.jumpGate));
            res.json({ok: true});
          }else{
            res.json({ok: false, mes: "Flota incorrecta."});
          }
        }else{
          res.json({ok: false, mes: "El salto cuantico esta cargandose"});
        }
      }else{
        if(index === planet){
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

  // Efectua la venta y compra de recursos de un jugador en un mercado lunar
  //  -player = Objeto con la informacion del jugador
  //  -planet = Numero de planeta
  //  -obj = Objeto del cliente con la informacion de que se esta comerciando
  //  -res = Objeto respuesta a enviar al cliente
  marketResources: function(player, planet, obj, res){
    let recursosSuficientes = false;
    obj.button   = parseInt(obj.button);
    obj.cantidad = parseInt(obj.cantidad);
    if(fun.validInt(obj.button) && fun.validInt(obj.cantidad)){
      if(player.planets[planet].moon.active && player.planets[planet].moon.buildings.marketplace > 0 && obj.cantidad > 0){
        let objResourcesAdd = fun.zeroResources();
        switch (obj.button) {
          case 0: // Vendo metal por cristal
          case 1: // Vendo metal por deuterio
            if(player.planets[planet].moon.resources.metal >= obj.cantidad){
              recursosSuficientes = true;
              objResourcesAdd.metal = -obj.cantidad;
              if(obj.button === 0){
                objResourcesAdd.crystal = Math.floor(obj.cantidad*(2/3)*(9/10));
              }else{
                objResourcesAdd.deuterium = Math.floor(obj.cantidad/3*(9/10));
              }
            }
            break;
          case 2: // Vendo cristal por metal
          case 3: // Vendo cristal por deuterio
            if(player.planets[planet].moon.resources.crystal >= obj.cantidad){
              recursosSuficientes = true;
              objResourcesAdd.crystal = -obj.cantidad;
              if(obj.button === 2){
                objResourcesAdd.metal = Math.floor(obj.cantidad*(3/2)*(9/10));
              }else{
                objResourcesAdd.deuterium = Math.floor(obj.cantidad/2*(9/10));
              }
            }
            break;
          case 4: // Vendo deuterio por metal
          case 5: // Vendo deuterio por cristal
            if(player.planets[planet].moon.resources.deuterium >= obj.cantidad){
              recursosSuficientes = true;
              objResourcesAdd.deuterium = -obj.cantidad;
              if(obj.button === 4){
                objResourcesAdd.metal = Math.floor(obj.cantidad*3*(9/10));
              }else{
                objResourcesAdd.crystal = Math.floor(obj.cantidad*2*(9/10));
              }
            }
          default: // Opcion invalida
            res.send({ok: false, mes: "Recurso invalido."});
            return;
        }
        if(recursosSuficientes){
          base.addPlanetData(player.planets[planet].coordinates, objResourcesAdd, undefined, true, () => {
            res.send({ok: true});
          });
        }else{
          res.send({ok: false, mes: "Recursos insuficientes."});
        }
      }else{
        if(player.planets[planet].moon.active){
          if(obj.cantidad > 0){
            res.send({ok: false, mes: "Se necesita un mercado lunar para comerciar."});
          }else{
            res.send({ok: false, mes: "Cantidad de recursos invalida."});
          }
        }else{
          res.send({ok: false, mes: "No tenes luna."});
        }
      }
    }else{
      res.send({ok: false, mes: "Recursos invalidos."});
    }
  },

  // Intenta colonizar un planeta para un jugador, devuelve true si lo logra y false si no
  //  -cord = Coordenadas del planeta a colonizar
  //  -player = Objeto del jugador que esta colonizando
  //  -resources = Recursos con los que empieza el nuevo planeta
  //  -ships = Naves con las que empieza el nuevo planeta
  colonize: function(cord, player, resources = undefined, ships = undefined){
    // Me fijo que la tecnologia de astrifisica permite colonizar esa posicion
    if((cord.pos === 3 || cord.pos === 13) && player.research.astrophysics < 4) return false;
    if((cord.pos === 2 || cord.pos === 14) && player.research.astrophysics < 6) return false;
    if((cord.pos === 1 || cord.pos === 15) && player.research.astrophysics < 8) return false;

    // Me fijo que halla un lugar disponible para colonizar el planeta y que ese planeta no este ya colonizado
    if(Math.ceil(player.research.astrophysics/2)+1 > player.planets.length && player.planets.length < 8 && !fun.estaColonizado(this.allCord, player.movement[i].coorHasta)){

      // Seteo los recursos y naves con los que se va a crear el nuevo planeta
      if(resources === undefined) resources = fun.zeroResources();
      if(ships === undefined) ships = fun.zeroResources();
      let newPlanet = this.createNewPlanet(cord, 'Colony', player, player.type, resources, ships);

      // Guardo el nuevo planeta en la base de datos
      base.savePlayerData(playerName, undefined, undefined, {planets: newPlanet}, undefined, () => {});
      return true;  // Salio todo bien
    }else{
      return false; // No se cumplieron las condiciones para colonizar
    }
  },

  // Cambia el estado de una vaca, o sea, si esta en la lista de vacas lo saca y si no esta lo agrega
  //  -player = Objeto con la informacion del jugador
  //  -res = Respuesta a enviar al cliente
  //  -query = Objeto con la informacion del request del cliente
  toggleVaca: function(player, res, query){
    if(fun.coordenadaValida(query.coor)){
      let elimino = false;
      for(let i = 0 ; i<player.vacas.length ; i++){ // Busco si el jugador agregado ya esta en la lista de vacas
        if(fun.equalCoor(player.vacas[i].coordinates, query.coor.gal)){
          elimino = true;
          player.vacas.splice(i, 1);
          i--;
        }
      }
      // Lo agrego a la lista con la informacion que vino del usuario, voy a confiar en que este la manda bien, en caso de no hacerlo el unico perjudicado es el mismo usuario
      if(!elimino && player.name !== query.playerName){
        player.vacas.push({coordinates: {gal: query.coor.gal, sys: query.coor.sys, pos: query.coor.pos},
                           playerName:  query.playerName,
                           planetName:  query.planetName,
                           estado:      query.estado});
      }
      base.savePlayerData(player.name, {vacas: player.vacas}, undefined, undefined, undefined, () => {
        res.send({ok: true, deleted: elimino});
      });
    }else{
      res.send({ok: false, mes: "Coordenadas invalidas"});
    }
  },

  // Actualiza los maximos campos y los usados en una luna
  //  -player = Objeto con la informacion del jugador
  //  -planet = Numero de planeta en el que esta la luna
  contMoonFields: function(player, planet){
    if(player.planets[planet].moon.active){
      let campos = 0;
      let objSet = {};
      for(let item in player.planets[planet].moon.buildings){
        campos += player.planets[planet].moon.buildings[item];
      }
      objSet['planets.' + planet + '.moon.campos'] = campos;
      objSet['planets.' + planet + '.moon.camposMax'] = player.planets[planet].moon.buildings.lunarBase*3 + 1;
      base.savePlayerData(player.name, objSet, undefined, undefined, undefined, () => {});
    }
  },

  // Verifica si se cumplio una mision y si es asi, entrega la recompensa
  //  -player = Objeto con la informacion del jugador
  //  -mission = Numero de mision a verificar
  //  -res = Objeto respuesta a devolver al cliente
  updateRewards: function(player, mission, res){
    if(fun.validInt(mission) && 0 < mission && mission <= 10){
      mission = parseInt(mission);
      if(!player.tutorial[mission-1]){
        let missionCumplida = false;
        let objReward = {};
        switch (mission) {  // Para cada mision me fijo si se cumplieron los requisitos y que no le halla dado la recompensa ya
          // Los requisitos los tiene que cumplir almenos un planeta individualmente, no se cuentan las flotas en la luna ni en vuelo
          case 1:
            for(let i = 0 ; i<player.planets.length && !missionCumplida ; i++){
              if(player.planets[i].buildings.metalMine >= 4 && player.planets[i].buildings.crystalMine >= 2 && player.planets[i].buildings.solarPlant >= 4){
                missionCumplida = true;
                objReward['planets.0.resources.metal'] = 150;
                objReward['planets.0.resources.crystal'] = 75;
              }
            }
            break;
          case 2:
            for(let i = 0 ; i<player.planets.length && !missionCumplida ; i++){
              if(player.planets[i].buildings.deuteriumMine >= 2 && player.planets[i].buildings.shipyard >= 1 && player.planets[i].defense.rocketLauncher >= 1){
                missionCumplida = true;
                objReward['planets.0.defense.rocketLauncher'] = 1;
              }
            }
            break;
          case 3:
            for(let i = 0 ; i<player.planets.length && !missionCumplida ; i++){
              if(player.planets[i].buildings.metalMine >= 10 && player.planets[i].buildings.crystalMine >= 7 && player.planets[i].buildings.solarPlant >= 5){
                missionCumplida = true;
                objReward['planets.0.resources.metal'] = 2000;
                objReward['planets.0.resources.crystal'] = 500;
              }
            }
            break;
          case 4:
            if(player.research.combustion >= 2){
              for(let i = 0 ; i<player.planets.length && !missionCumplida ; i++){
                if(player.planets[i].buildings.researchLab >= 1 && player.planets[i].fleet.smallCargo >= 1){
                  missionCumplida = true;
                  objReward['planets.0.resources.deuterium'] = 1500;
                }
              }
            }
            break;
          case 5:
            if(player.research.combustion >= 3 && player.research.espionage >= 2){
              for(let i = 0 ; i<player.planets.length && !missionCumplida ; i++){
                if(player.planets[i].fleet.espionageProbe >= 1){
                  missionCumplida = true;
                  objReward['planets.0.fleet.espionageProbe'] = 2;
                }
              }
            }
            break;
          case 6:
            if(player.research.impulse >= 1 && player.research.armour >= 1 && player.research.astrophysics >= 1){
              missionCumplida = true;
              objReward['planets.0.fleet.heavyFighter'] = 2;
              objReward['planets.0.fleet.smallCargo'] = 5;
            }
            break;
          case 7:
            if(player.research.laser >= 1 && player.research.impulse >= 3 && player.planets.length >= 2){
              missionCumplida = true;
              objReward['planets.0.resources.metal'] = 10000;
              objReward['planets.0.resources.crystal'] = 10000;
              objReward['planets.0.resources.deuterium'] = 10000;
              objReward['planets.0.fleet.largeCargo'] = 1;
              objReward['planets.0.fleet.smallCargo'] = 5;
            }
            break;
          case 8:
            for(let i = 0 ; i<player.planets.length && !missionCumplida ; i++){
              if(player.planets[i].buildings.metalMine >= 17 && player.planets[i].buildings.crystalMine >= 15 && player.planets[i].buildings.deuteriumMine >= 12){
                missionCumplida = true;
                objReward['planets.0.resources.metal'] = 20000;
                objReward['planets.0.resources.crystal'] = 15000;
                objReward['planets.0.resources.deuterium'] = 10000;
              }
            }
            break;
          case 9:
            if(player.research.combustion >= 6 && player.research.shielding >= 2){
              for(let i = 0 ; i<player.planets.length && !missionCumplida ; i++){
                if(player.planets[i].fleet.recycler >= 1){
                  missionCumplida = true;
                  objReward['planets.0.fleet.recycler'] = 2;
                }
              }
            }
            break;
          default:
            if(player.research.ion >= 2 && player.research.impulse >= 4){
              for(let i = 0 ; i<player.planets.length && !missionCumplida ; i++){
                if(player.planets[i].fleet.cruiser >= 2){
                  missionCumplida = true;
                  objReward['planets.0.fleet.lightFighter'] = 10;
                  objReward['planets.0.fleet.heavyFighter'] = 3;
                  objReward['planets.0.fleet.battleship'] = 1;
                }
              }
            }
        }
        if(missionCumplida){
          let objSet = {};
          objSet['tutorial.' + (mission-1)] = true;
          base.savePlayerData(player.name, objSet, objReward, undefined, undefined, () => {
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

  // Funcion que se ejecuta periodicamente para actualizar el estado de cada jugador en el universo
  updateUniverse: function(){
    if(!actualizando){
      actualizando = true;
      let horaActual = fun.horaActual();
      let salir = false;

      //console.log(events);
      // Recorro la cola de jugadores a actualizar y si el tiempo llego, los actualizo
      while(!events.isEmpty && events.next().time <= horaActual){
        let updateObj = events.useNext();

        // Si tengo que updatear al jugador que estoy usando, lo guardo en la base de datos y en el objeto uni.player
        if(updateObj.player === this.player.name){
          base.getPlayer(updateObj.player, () => {}, false);
        }else{ // Si no lo guardo solo en la base de datos
          base.findAndExecuteByName(updateObj.player, (player) => {
            this.updatePlayer(player, () => {});
          });
        }
      }
      actualizando = false;
    }
  },

  // Funcion que se ejecuta una vez por dia, cuando el dia empieza
  dailyUpdate: function(){
    console.log('\x1b[36m%s\x1b[0m', "Daily update.");
    base.updateAllHighscore();
    // Dentro de un dia se va a ejecutar de nuevo
    setTimeout(() => {this.dailyUpdate();}, 86400000);
  }
};

base.setUniverse(exp);
module.exports = exp;

// Lista de cosas por hacer:

/* Completar los mesajes de espionage (y todos en general)
/* Mostrar bien los reportes de espionage y de batallas
/* Avisar al atacado que lo estan atacando (API de bots)(Terminar la linea 170 de layout.pug)
/* Que se pueda misilear, espiar y atacar desde la vision de galaxia
/* Hacer que se pueda atacar desde la pagina de vacas, search y los reportes de espionage
/* Crear la API con la que interactuan los bots (Los bots no los va a controlar el servidor)
/* Pasar todo el juego a ingles (Todo lo que lee el usuario)
/* Mostrar bien los datos del phalanx en el cliente
/* Mejorar el codigo del cliente
*/
