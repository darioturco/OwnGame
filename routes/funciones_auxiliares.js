// En este script estan las funciones auxiliares simples o los renombres para aclarar cosas
const hashjs = require('hash.js');
const costs = require('./constructions/costs');
const keysDefensas = ["rocketLauncher", "lightLaser", "heavyLaser", "gauss", "ion", "plasma", "smallShield", "largeShield"];
const keysNaves = ["lightFighter", "heavyFighter", "cruiser", "battleship", "battlecruiser", "bomber", "destroyer", "deathstar", "smallCargo", "largeCargo", "colony", "recycler", "espionageProbe", "solarSatellite"];
const missionsNames = ["Expedition", "Colonisation", "Recycle", "Transport", "Deployment", "Espionage", "Misil", "Attack", "Moon Destruction"];
const shipsDefensesNumber = {lightFighter:  0, heavyFighter: 1, cruiser: 2, battleship: 3, battlecruiser: 4, bomber: 5, destroyer: 6, deathstar: 7, smallCargo: 8, largeCargo: 9, colony: 10, recycler: 11, espionageProbe: 12, solarSatellite: 13, rocketLauncher: 14, lightLaser: 15, heavyLaser: 16, gauss: 17, ion: 18, plasma: 19, smallShield: 20, largeShield: 21};

var exp = {
  generateNewTypeOfPlanet: function(pos, mod) {
    let tipo = this.getTypePlanet(pos, mod);
    let rango = Math.floor(Math.random()*20 + 10);
    let temp = 10;
    if(pos < 4){
      temp = Math.floor(this.normalRandom(310-pos*50, 230-pos*50)); // Cerca
    }else{
      if(pos > 12){
        temp = Math.floor(this.normalRandom(165-pos*50, 125-pos*50)); // Lejos
      }else{
        temp = Math.floor(this.normalRandom(130-pos*10, 90-pos*10)); // Medio
      }
    }
    return {type: tipo,
      color: Math.floor(Math.random()*10)+1,
      temperature: {max: temp+rango, min: temp-rango},
      campos: Math.floor(this.normalRandom(-0.022*Math.pow(pos,3) - 0.73*Math.pow(pos,2) + 17*pos + 75, 0.056*Math.pow(pos,3) - 3.12*Math.pow(pos,2) + 36*pos + 121))};
  },
  getTypePlanet: function(pos, mod){
    let tipo = 1;
    if((mod === 0 && pos >= 14) || (mod === 1 && (pos === 6 || pos === 7))) tipo = 1;                   // Normal
    if((mod === 0 && pos <= 3) || (mod === 1 && (pos === 4 || pos === 5))) tipo = 2;                    // Dry
    if((mod === 0 && (pos === 6 || pos === 7)) || (mod === 1 && (pos === 8 || pos === 9))) tipo = 3;    // Jungle
    if((mod === 0 && (pos === 8 || pos === 9)) || (mod === 1 && (pos === 10 || pos === 11))) tipo = 4;  // Water
    if((mod === 0 && (pos === 12 || pos === 13)) || (mod === 1 && pos >= 14)) tipo = 5;                 // Gas
    if((mod === 0 && (pos === 10 || pos === 11)) || (mod === 1 && (pos === 12 || pos === 13))) tipo = 6;// Ice
    if(mod === 1 && (pos <= 3)) tipo = 7;                                                               // Desert
    return tipo;
  },
  cantidadMisiles: function(planeta){
    // En el juego ambos tipos de misil ocupan un solo lugar
    return planeta.defense.antiballisticMissile + planeta.defense.interplanetaryMissile;
  },
  capacidadSilo: function(planeta){
    // Por cada nivel del silo se puede agregar 10 misiles de cualquier tipo
    return planeta.buildings.silo * 10;
  },
  phalanxLevel: function(moon){
    return (moon.active) ? moon.buildings.phalanx : 0;
  },
  timeBuild: function(recursos, mult, elev, uniSpeed){
    let divisor = 2500 * (1+mult) * Math.pow(2,elev) * uniSpeed;
    return Math.floor(60*recursos/divisor);
  },
  hash: function(str){
    return hashjs.sha256().update(str).digest('hex');
  },
  normalRandom: function(min, max, podaMin = -Infinity, podaMax = Infinity) { // La esperanza es (max+min)/2
    let u = Math.random();
    let v = Math.random();
    if(u === 0) u = 0.5; // Converting [0,1) to (0,1)
    let num = Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v); // Box–Muller transform
    num = num / 10.0 + 0.5; // Translate to 0 -> 1
    if (num > 1 || num < 0) num = Math.random(); // Resample between 0 and 1 if out of range
    num *= max - min; // Stretch to fill range
    num += min; // Offset to min
    if (num > podaMax || num < podaMin) num = Math.random()*(podaMax-podaMin) + (podaMin);
    return num;
  },
  randomBool: function(){
    return (Math.random() < 0.5);
  },
  randomString: function(){
    return Math.random().toString(36).replace(/[^a-z]+/g, '').substr(0, parseInt(Math.random()*6 + 5));
  },
  validInt: function(num) {
    return !isNaN(parseInt(num));
  },
  validShipyardName: function(name) {
    return (shipsDefensesNumber[name] != undefined || name === "antiballisticMissile" || name === "interplanetaryMissile");
  },
  formatNumber: function(num) {
    let res = num;
    num = parseInt(num);
    let sign = Math.sign(num);
    if(isFinite(num)){
      res = '';
      num = Math.abs(num);
      while(num > 999){
        res = '.' + exp.completaDigitos(num%1000) + res; // Se usa 'exp' porque si no genera problemas de contexto
        num = Math.floor(num / 1000);
      }
      res = num + res;
      if(sign === -1) res = '-' + res;
    }
    return res;
  },
  completaDigitos: function(inn) {
    let result = inn;
    if(inn < 100){
      result = '0' + inn;
      if(inn < 10){
        result = '00' + inn;
        if(inn <= 0) result = '000';
      }
    }
    return result;
  },
  segundosATiempo: function(seg) { // Dado un numero de segundos le da el formato tiempo (x dias n horas m minutos s segundos) xd nh mm ss
    if(!isFinite(seg) || isNaN(seg) || seg < 0) return " unknown";
    if(seg < 0) return " now";
    let time = (seg%60) + "s";
    seg = Math.floor(seg/60);
    if(seg !== 0){
      time = (seg%60) + "m " + time;
      seg = Math.floor(seg/60);
      if(seg !== 0){
        time = (seg%24) + "h " + time;
        seg = Math.floor(seg/24);
        if(seg !== 0) time = seg + "d " + time;
      }
    }
    return " " + time;
  },
  calculaTiempoFaltante: function(lista){
    let time = 0;
    for(let i = 0 ; i<lista.length ; i++){
      time += (lista[i].cant-1) * lista[i].time + lista[i].timeNow;
    }
    return time*1000;
  },
  recursosSuficientes: function(resources, costo, mul = 1){
    return costo.metal*mul <= resources.metal && costo.crystal*mul <= resources.crystal && costo.deuterium*mul <= resources.deuterium;
  },
  coordenadaValida: function(coor){
    return coor.gal >= 1 && coor.sys >= 1 && coor.pos >= 1 && coor.gal <= 9 && coor.sys <= 499 && coor.pos <= 16;
  },
  coorToCorch: function(coor){
    return '[' + coor.gal + ':' + coor.sys + ':' + coor.pos + ']';
  },
  validResourcesSettingsObj: function(obj, moon){
    if(obj == undefined) return false;
    for(let i in obj){ // Me fijo que todos los valores de 'obj' sean numeros validos
      if(!this.validInt(obj[i])) return false;
    }

    let valid = true;
    if(moon){
      // Si es la luna, fijo que las dos propiedades que me interesan esten definidas y que sean numeros entre 0 y 10 inclusibe
      valid &= 10 >= parseInt(obj.sunshade) && 0 <= parseInt(obj.sunshade);
      valid &= 10 >= parseInt(obj.beam) && 0 <= parseInt(obj.beam);
    }else{
      // Si es el planeta, fijo que las cuantro propiedades que me interesan esten definidas y que sean numeros entre 0 y 10 inclusibe
      valid &= 10 >= parseInt(obj.metal) && 0 <= parseInt(obj.metal);
      valid &= 10 >= parseInt(obj.crystal) && 0 <= parseInt(obj.crystal);
      valid &= 10 >= parseInt(obj.deuterium) && 0 <= parseInt(obj.deuterium);
      valid &= 10 >= parseInt(obj.energy) && 0 <= parseInt(obj.energy);
    }
    return valid;
  },
  validPlanetNum: function(player, num, moon = false){
    if(moon){
        return this.validMoonNum(player, num);
    }else{
        return this.validInt(num) && num >= 0 && player.planets.length > num;
    }

  },
  validMoonNum: function(player, num){
    return this.validPlanetNum(player, num) && player.planets[num].moon.active;
  },
  validShips: function(ships){
    let res = ships['misil'] != undefined && this.validInt(ships['misil']);
    for(let i = 0 ; i<keysNaves.length-1 && res ; i++){
      res &= ships[keysNaves[i]] != undefined && this.validInt(ships[keysNaves[i]]);
    }
    return res;
  },
  calculaDistancia: function(desde, hasta, galaxyDonut, systemDonut){
    let dis = 0;
    if(desde.gal === hasta.gal){
      if(desde.sys === hasta.sys){
        if(desde.pos === hasta.pos){
          dis = 5; // Mismas cordenadas
        }else{
          dis = 1000 + 5*Math.abs(desde.pos - hasta.pos); // Mismo systema y galaxia
        }
      }else{
        if(systemDonut){
          dis = Math.min(2700 + 95*Math.abs(desde.sys - hasta.sys), 2700 + 95*Math.abs(desde.sys - hasta.sys - 499),  2700 + 95*Math.abs(desde.sys - hasta.sys + 499));
        }else{
          dis = 2700 + 95*Math.abs(desde.sys - hasta.sys);
        }
      }
    }else{
      if(galaxyDonut){
        dis = Math.min(20000 * Math.abs(desde.gal - hasta.gal), 20000 * Math.abs(desde.gal - hasta.gal - 9),  20000 * Math.abs(desde.gal - hasta.gal + 9));
      }else{
        dis = 20000 * Math.abs(desde.gal - hasta.gal);
      }
    }
    return dis;
  },
  horaActual: function(){
    return new Date().getTime();
  },
  negativeObj: function(obj){ // Multiplica por -1 cada campo del obj pasado
    let res = {};
    for(let i in obj){
      res[i] = -obj[i];
    }
    return res;
  },
  missionNumToString: function(num){
    return missionsNames[num];
  },
  objStringToNum: function(obj){
    for(let i in obj){
      obj[i] = parseInt(obj[i]);
    }
  },
  equalCoor: function(coor1, coor2){
    return coor1.gal === coor2.gal && coor1.sys === coor2.sys && coor1.pos === coor2.pos;
  },
  getIndexOfPlanet: function(planets, coors){ // Dada una lista de planetas y unas coordenadas, devuelve el indice del planeta con esas coordenadas
    let res = -1;
    for(let i = 0 ; i<planets.length && res === -1 ; i++){
      if(this.equalCoor(planets[i].coordinates, coors)){
        res = i;
      }
    }
    return res;
  },
  isZeroObj: function(obj){
    let res = true;
    for(let i in obj){
      if(obj[i] !== 0){
        res = false;
        break;
      }
    }
    return res;
  },
  zeroResources: function(){
    return {metal: 0, crystal: 0, deuterium: 0};
  },
  zeroShips: function(){
    return {lightFighter:  0,
           heavyFighter:   0,
           cruiser:        0,
           battleship:     0,
           battlecruiser:  0,
           bomber:         0,
           destroyer:      0,
           deathstar:      0,
           smallCargo:     0,
           largeCargo:     0,
           colony:         0,
           recycler:       0,
           espionageProbe: 0,
           solarSatellite: 0};
  },
  zeroDefense: function(){
    return {rocketLauncher: 0, lightLaser: 0, heavyLaser: 0,
            gauss: 0, ion: 0, plasma: 0, smallShield: 0,
            largeShield: 0, antiballisticMissile: 0,
            interplanetaryMissile: 0};
  },
  zeroBuilding: function(){
    return {metalMine: 0, crystalMine: 0, deuteriumMine: 0,
            solarPlant: 0, fusionReactor: 0, metalStorage: 0,
            crystalStorage: 0, deuteriumStorage: 0, robotFactory: 0,
            shipyard: 0, researchLab: 0, alliance: 0, silo: 0,
            naniteFactory: 0, terraformer: 0};
  },
  zeroBuildingsMoon: function(){
    return {lunarBase: 0, phalanx: 0, spaceDock: 0, marketplace: 0, lunarSunshade: 0, lunarBeam: 0, jumpGate: 0, moonShield: 0}
  },
  zeroResearch: function(){
    return {energy: 0, laser: 0, ion: 0, hyperspace: 0, plasma: 0, espionage: 0,
            computer: 0, astrophysics: 0, intergalactic: 0, graviton: 0, combustion: 0,
            impulse: 0, hyperspace_drive: 0, weapons: 0, shielding: 0, armour: 0};
  },
  estaColonizado: function(lista, coor){
    return lista[coor.gal + '_' + coor.sys + '_' + coor.pos] != undefined;
  },
  playerName: function(lista, coor){
    if(this.estaColonizado(lista, coor)){
      return lista[coor.gal + '_' + coor.sys + '_' + coor.pos].playerName;
    }
    return "";
  },
  cargaEscombros: function(debris, capacidad){
    let res = {metal: 0, crystal: 0};
     if(debris.metal > capacidad){     // Recolecta el metal
        res.metal = capacidad;
    }else{
      res.metal = debris.metal;
      capacidad -= debris.metal;
      if(debris.crystal > capacidad){  // Recolecta el cristal
        res.crystal = capacidad;
      }else{
        res.crystal = debris.crystal;
      }
    }
    return res;
  },
  espacioLibre: function(movement){
    let espacioDeCarga = 0;
    let infoNaves = costs.navesInfo();
    for(item in movement.ships){
      if(item !== 'solarSatellite') espacioDeCarga += infoNaves[item].carga * movement.ships[item];
    }
    return espacioDeCarga - movement.resources.metal - movement.resources.crystal - movement.resources.deuterium;
  },
  loadResources: function(movement, resources, espacioLibre = undefined){
    let res = {};
    if(espacioLibre == undefined) espacioLibre = this.espacioLibre(movement); // Averiguo cuanto espacio libre le queda a la flota si es que no lo se
    // Cargo el metal
    let cargaAux = Math.min(espacioLibre, resources.metal);
    res.metal = movement.resources.metal + cargaAux;
    espacioLibre -= cargaAux;
    // Cargo el cristal
    cargaAux = Math.min(espacioLibre, resources.crystal);
    res.crystal = movement.resources.crystal + cargaAux;
    espacioLibre -= cargaAux;
    // Cargo el deuterio
    cargaAux = Math.min(espacioLibre, resources.deuterium);
    res.deuterium = movement.resources.deuterium + cargaAux;
    return res;
  },
  loadResourcesAttack: function(ships, resources, original){
    let saqueado = this.zeroResources();
    let movementAux = {ships: ships, resources: this.zeroResources()};
    let espacioLibre = this.espacioLibre(movementAux);

    // Cargo los recursos que ya estaban de antes devuelta, ya que podrian haberse destruido algunas naves
    movementAux.resources = this.loadResources(movementAux, original, espacioLibre);
    for(let item in original){  // recalculo en espacio libre que queda
      espacioLibre -= original[item];
    }
    if(espacioLibre > 0){
      for(let item in resources){  // Solo la mitad de los recursos pueden ser saquados
        resources[item] = Math.floor(resources[item] / 2);
      }
      saqueado = this.loadResources(movementAux, resources, espacioLibre);
    }
    for(let item in movementAux.resources){
      movementAux.resources[item] += saqueado[item];
    }
    return {newCarga: movementAux.resources, saqueado: saqueado};
  },
  costShipsAndDefenses: function(){
    return costs.rawCosts;
  },
  posiblesVacas: function(vacas, gal, sys){
    let res = [];
    for(let i = 0 ; i<vacas.length ; i++){
      if(vacas[i].coordinates.gal === gal && vacas[i].coordinates.sys === sys){
        res.push(vacas[i].coordinates.pos);
      }
    }
    return res;
  },
  shipStringToNum: function(ship){
    return shipsDefensesNumber[ship];
  },
  isBuildingSmallShield: function(listOfShipConstructions){
    for(i in listOfShipConstructions){
      if(listOfShipConstructions[i].item === 'smallShield') return true;
    }
    return false;
  },
  isBuildingLargeShield: function(listOfShipConstructions){
    for(i in listOfShipConstructions){
      if(listOfShipConstructions[i].item === 'largeShield') return true;
    }
    return false;
  },
  getCantFleets: function(player){
    let res = {expeditions: 0, fleets: player.movement.length};
    for(let i = 0 ; i<player.movement.length ; i++){            // Cuento la cantidad de expediciones en el aire
      if(player.movement[i].mission === 0) res.expeditions += 1;
    }
    return res;
  },
  getTypeActive: function(lastVisit){
    // Calculo los dias que pasaron desde la ultima coneccion del usuario
    let days = (this.horaActual() - lastVisit)/86400000;
    if(days >= 90){
      return 'Abandonado';
    }else if(days >= 30){
      return 'Inactivo';
    }else if(days >= 7){
      return 'inactivo';
    }else{
      return 'active';
    }
  },
  cleanDataSession: function(obj){
    delete obj.id;
    delete obj.username;
    delete obj.password;
  }
};

exp.keysNaves    = keysNaves;
exp.keysDefensas = keysDefensas;

module.exports = exp;
