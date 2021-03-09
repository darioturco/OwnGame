// Aca estan las funciones auxiliares simples o los renombres para aclarar cosas
// Listas de dialogos de las expediciones
// Los dialogos se pueden encontrar en: https://ogame.fandom.com/wiki/Expedition
/* Falta completar todos los dialogos */
const retrasoExp = ["Your expedition went into a sector full of particle storms. This set the energy stores to overload and most of the ships main systems crashed. Your mechanics where able to avoid the worst, but the expedition is going to return with a big delay.",
                    "The expeditions flagship collided with a foreign ship when it jumped into the fleet without any warning. The foreign ship exploded and the damage to the flagship was substantial. As soon as the needed repair are carried out the fleet will begin to make their way back as the expedition can not continue in those conditions.",
                    "For unknown reasons the expeditions jump went totally wrong. It nearly landed in the heart of a sun. Fortunately it landed in a known system, but the jump back is going to take longer then thought.",
                    "The solar wind of a red giant ruined the expeditions jump and it will take quite some time to calculate the return jump. There was nothing besides the emptiness of space between the stars in that sector. The fleet will return later than expected.",
                    "Your navigator made a grave error in his computations that caused the expeditions jump to be miscalculated. Not only did the fleet miss the target completely, but the return trip will take a lot more time than originally planned.",
                    "The new navigation module is still buggy. The expedition's jump not only led them in the wrong direction, but it used all the Deuterium fuel. Fortunately the fleets jump got them close to the departure planet's moon. A bit disappointed the expedition now returns without impulse power. The return trip will take longer than expected."];
const perdidaExp = ["The only thing left from the expedition was the following radio transmission: Zzzrrt Oh no! Krrrzzzzt That zrrrtrzt looks krgzzzz like .. AHH! Krzzzzzzzztzzzz... Transmision terminated",
                    "Your crew betrayed you, they decided to go rogue and start their own settlement. The last transmission received made it seem likely they will not return.",
                    "Contact with the expedition fleet was suddenly lost. Our scientists are still trying to establish contact, but it seems the fleet is lost forever.",
                    "The last transmission we received from the expedition fleet was this magnificent picture of the opening of a black hole.",
                    "A core meltdown of the lead ship leads to a chain reaction, which destroys the entire expedition fleet in a spectacular explosion."];
const separacionExp = ["Some ships crashed becouse of bad calculation of the rute."];
const navesExp = ["We found a spaceship graveyard. Some of the technicians from the expedition fleet were able to get some of the ships to work again.",
                  "We found a deserted pirate station. There are some old ships lying in the hangar. Our technicians are figuring out whether some of them are still useful or not.",
                  "Your expedition ran into the shipyards of a colony that was deserted eons ago. In the shipyards hanger they discover some ships that could be salvaged. The technicians are trying to get some of them to fly again.",
                  "Our expedition found a planet which was almost destroyed during a certain chain of wars. There are different ships floating around in the orbit. The technicians are trying to repair some of them. Maybe we will also get information about what happened here.",
                  "We came across the remains of a previous expedition! Our technicians will try to get some of the ships to work again.",
                  "Our expedition ran into an old automatic shipyard. Some of the ships are still in the production phase and our technicians are currently trying to reactivate the yards energy generators.",
                  "We found the remains of an armada. The technicians directly went to the almost intact ships to try to get them to work again.",
                  "We found the planet of an extinct civilization. We are able to see a giant intact space station, orbiting. Some of your technicians and pilots went to the surface looking for some ships which could still be used."];
const recursosExp = [ "Mineral belts around an unknown planet contained resources. The expedition ships are coming back with the resources founded.",
                      "Your expedition ran into some spaceship wrecks from an old battle. Some of the components could be saved.",
                      "The expedition found a radioactive planetoid with an extremely toxic atmosphere. After multiple scans, it shows that it has loads of resources. With the help of automated drones, we tried to harvest as many resources as possible.",
                      "On a tiny moon with its own atmosphere your expediton found some huge raw resources storage. The crew on the ground is trying to lift and load that natural treasure.",
                      "Your expedition discovered a small asteroid from which some resources could be harvested.",
                      "On an isolated planetoid we found some easily accessible resources fields and harvested some successfully.",
                      "We met a small convoy of civil ships which needed food and medicine desperately. In exchange to that we got loads of useful resources.",
                      "Your expedition found an ancient, fully loaded but deserted freighter convoy. Some of the resources could be rescued.",
                      "Your expedition fleet reports the discovery of a giant alien ship wreck. They were not able to learn from their technologies but they were able to divide the ship into its main components and made some useful resources out of it."];
const batallaPiratasExp = ["We needed to fight some pirates which were, fortunately, only a few."];
const batallaAliensExp  = ["We needed to fight some pirates which were, fortunately, only a few."];
const nadaExp = ["Your expedition took gorgeous pictures of a supernova. Nothing new could be obtained from the expedition, but at least there is good chance to win that 'Best Picture Of The Universe' competition in next months issue of OGame magazine."];
const integridadDefensas = [200, 200, 800, 3500, 800, 10000, 2000, 10000];
const shieldDefensas = [20, 25, 100, 200, 500, 300, 2000, 10000];
const attackDefensas = [80, 100, 250, 1100, 150, 3000, 1, 1];
const keysDefensas = ["rocketLauncher", "lightLaser", "heavyLaser", "gauss", "ion", "plasma", "smallShield", "largeShield"];
const integridadNaves = [400, 1000, 2700, 6000, 7000, 7500, 11000, 900000, 400, 1200, 3000, 1600, 100, 200];
const shieldNaves = [10, 25, 50, 200, 400, 500, 500, 50000, 10, 25, 100, 10, 1, 1];
const attackNaves = [50, 150, 400, 1000, 700, 1000, 2000, 200000, 5, 5, 50, 1, 1, 1];
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
  timeBuild: function(recursos, mult, elev, uniSpeed){
    let divisor = 2500 * (1+mult) * Math.pow(2,elev) * uniSpeed;
    return Math.floor(60*recursos/divisor);
  },
  normalRandom: function(min, max, podaMin = -Infinity, podaMax = Infinity) {// la esperanza es (max+min)/2
    /* Pasar algoritmo */
    let u = Math.random();
    let v = Math.random();
    if(u === 0) u = 0.5; //Converting [0,1) to (0,1)
    let num = Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v); // Box–Muller transform
    num = num / 10.0 + 0.5; // Translate to 0 -> 1
    if (num > 1 || num < 0) num = Math.random(); // resample between 0 and 1 if out of range
    num *= max - min; // Stretch to fill range
    num += min; // offset to min
    if (num > podaMax || num < podaMin) num = Math.random()*(podaMax-podaMin)+(podaMin);
    return num;
  },
  randomBool: function(){
    return (Math.random() < 0.5);
  },
  validInt: function(num) {
    num = parseInt(num);
    return !isNaN(num);
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
  validResourcesSettingsObj: function(obj, moon){
    let valid = true;
    for(let i in obj){ // Me fijo que todos los valores de 'obj' sean numeros validos
      valid &= this.validInt(obj[i]);
    }

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
  navesInfo: function(con, imp, hyp){
    let speedList = this.getListSpeed(con, imp, hyp);
    return {lightFighter:   {speed: speedList[0], carga: 50, consumo: 10},
            heavyFighter:   {speed: speedList[1], carga: 100, consumo: 20},
            cruiser:        {speed: speedList[2], carga: 800, consumo: 150},
            battleship:     {speed: speedList[3], carga: 1500, consumo: 250},
            battlecruiser:  {speed: speedList[4], carga: 750, consumo: 120},
            bomber:         {speed: speedList[5], carga: 500, consumo: 500},
            destroyer:      {speed: speedList[6], carga: 2000, consumo: 500},
            deathstar:      {speed: speedList[7], carga: 1000000, consumo: 1},
            smallCargo:     {speed: speedList[8], carga: 5000, consumo: 5},
            largeCargo:     {speed: speedList[9], carga: 25000, consumo: 25},
            colony:         {speed: speedList[10], carga: 7500, consumo: 500},
            recycler:       {speed: speedList[11], carga: 20000, consumo: 150},
            espionageProbe: {speed: speedList[12], carga: 0, consumo: 0},
            misil:          {speed: speedList[13], carga: 0, consumo: 0}
    };
  },
  getListSpeed: function(com, imp, hyp){
    let bomb = (hyp >= 8) ? 1200*hyp : 800*imp;
    let tran = (imp >= 5) ? 1000*imp : 500*com;
    return [12500+1250*com, 10000+2000*imp, 15000+3000*imp, 10000+3000*hyp, 10000+3000*hyp, 4000+bomb, 5000+1500*hyp, 100+30*hyp, 5000+tran, 7500+1500*imp, 2500+500*imp, 2000+400*imp, 100000000+10000000*com, 1000000+100000*imp];
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
    let infoNaves = this.navesInfo();
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
    return {
      lightFighter:          {metal: 3000, crystal: 1000, deuterium: 0, puntos: 4000},
      heavyFighter:          {metal: 6000, crystal: 4000, deuterium: 0, puntos: 10000},
      cruiser:               {metal: 20000, crystal: 7000, deuterium: 2000, puntos: 29000},
      battleship:            {metal: 45000, crystal: 15000, deuterium: 0, puntos: 60000},
      battlecruiser:         {metal: 30000, crystal: 40000, deuterium: 15000, puntos: 85000},
      bomber:                {metal: 50000, crystal: 25000, deuterium: 15000, puntos: 90000},
      destroyer:             {metal: 60000, crystal: 50000, deuterium: 15000, puntos: 125000},
      deathstar:             {metal: 5000000, crystal: 4000000, deuterium: 1000000, puntos: 10000000},
      smallCargo:            {metal: 2000, crystal: 2000, deuterium: 0, puntos: 4000},
      largeCargo:            {metal: 6000, crystal: 6000, deuterium: 0, puntos: 12000},
      colony:                {metal: 10000, crystal: 20000, deuterium: 10000, puntos: 40000},
      recycler:              {metal: 10000, crystal: 6000, deuterium: 2000, puntos: 18000},
      espionageProbe:        {metal: 0, crystal: 1000, deuterium: 0, puntos: 1000},
      solarSatellite:        {metal: 0, crystal: 2000, deuterium: 500, puntos: 2000},
      rocketLauncher:        {metal: 2000, crystal: 0, deuterium: 0, puntos: 2000},
      lightLaser:            {metal: 1500, crystal: 500, deuterium: 0, puntos: 2000},
      heavyLaser:            {metal: 6000, crystal: 2000, deuterium: 0, puntos: 8000},
      gauss:                 {metal: 20000, crystal: 15000, deuterium: 0, puntos: 35000},
      ion:                   {metal: 2000, crystal: 6000, deuterium: 0, puntos: 8000},
      plasma:                {metal: 50000, crystal: 50000, deuterium: 30000, puntos: 130000},
      smallShield:           {metal: 10000, crystal: 10000, deuterium: 0, puntos: 20000},
      largeShield:           {metal: 50000, crystal: 50000, deuterium: 0, puntos: 100000},
      antiballisticMissile:  {metal: 8000, crystal: 0, deuterium: 2000, puntos: 10000},
      interplanetaryMissile: {metal: 12500, crystal: 2500, deuterium: 10000, puntos: 25000}
    };
  },
  contarPuntosShips: function(ships){
    let cost = this.costShipsAndDefenses();
    let res = 0;
    for(let item in ships){
      if(item !== 'misil') res += ships[item] * cost[item].puntos;
    }
    return res;
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
  newPointsRandomFleet: function(puntos){
    let res = this.zeroShips();
    let cost = this.costShipsAndDefenses();
    while(puntos > 4500){
      for(let item in res){
        if(cost[item].puntos < puntos && this.randomBool()){
          res[item] += 1;
          puntos -= cost[item].puntos;
        }
      }
    }
    return res;
  },
  newCorrelativeRandomFleet: function(ships){
    let res = this.zeroShips();
    for(let item in res){
      res[item] = Math.floor(ships[item] * (Math.random()+0.5));
    }
    res.lightFighter += 12;
    return res;
  },
  randomBattleTechs: function(research){
    let res = {};
    // Cada tecnologia le pongo en +/-3 de la tecnologia original
    res.weapons = research.weapons + Math.floor(Math.random() * 6 - 3);
    res.shielding = research.shielding + Math.floor(Math.random() * 6 - 3);
    res.armour = research.armour + Math.floor(Math.random() * 6 - 3);
    // Me fijo que ninguna tecnologia sea negativa y si lo es la dejo en 0
    for(let item in res){
      if(res[item] < 0) res[item] = 0
    }
    return res;
  },
  expedition: function(ships, research){
    let res = {ships: ships,                   // Las naves que sobrevivieron a la expedicion
              resources: this.zeroResources(), // Los recursos nuevos que encontro la flota
              time: 0,                         // La cantidad de segundos que se retrasa la flota
              mueren: false,                   // Es true si se pierden todas las naves
              evento: 0,                       // Numero que indica que evento sucedio en la expedicion (0 = Nada, 1 = Retrazo, 2 = Perdida total, 3 = Perdida parcial, 4 = Naves, 5 = Recursos, 6 = Batalla)
              mensajes: []};                   // Lista con los mesajes a enviar para informar lo ocurrido en la expedicion
    // Tiro un numero aleatorio y me fijo que toco en la expedicion
    let rand = Math.floor(Math.random()*1000);
    if(rand < 100){        // Se retrasa la flota

      res.time = Math.floor(Math.random()*7200) + 5000;
      res.mensajes.push({type: 3, title: "Expedition", text: retrasoExp[0], data: {}});
      res.evento = 1;

    }else if(rand === 100){ // Se pierde la flota

      res.mueren = true;
      res.mensajes.push({type: 3, title: "Expedition", text: perdidaExp[0], data: {}});
      res.evento = 2;

    }else if(rand < 120){  // Se pierde parte de la flota

      if(this.randomBool()){ // Se pierde un solo tipo de nave
        let eliminado = false;
        if(!this.isZeroObj(ships)){
          while(!eliminado){
            for(let item in ships){
              if(this.randomBool() && ships[item] !== 0){
                eliminado = true;
                ships[item] = 0;
                break;
              }
            }
          }
        }
      }else{ // Se pierden un poco de cada nave
        for(let item in ships){
          ships[item] -= Math.floor(Math.random() * ships[item])
        }
      }
      res.mueren = this.isZeroObj(ships);
      res.mensajes.push({type: 3, title: "Expedition", text: separacionExp[0], data: {}});
      res.evento = 3;

    }else if(rand < 350){  // Se encuentras naves

      let newShips = {};
      let puntos = 0;
      // Decido como obtengo las nuevas naves
      if(this.randomBool()){ // Algoritmo de puntos
        puntos = Math.floor(this.contarPuntosShips(ships) * (0.4 + research.astrophysics*0.02)) + 5000 + research.astrophysics*1000;
        newShips = this.newPointsRandomFleet(puntos);
      }else{ // Algoritmo de copia de flota
        newShips = this.newCorrelativeRandomFleet(ships);
      }
      // Complico un poco el consegir estrellas de la muerte
      if(this.randomBool()) newShips['deathstar'] = 0;
      // Agrego las nuevas naves a las actuales
      for(let item in ships){
        res.ships[item] += newShips[item];
      }
      res.mensajes.push({type: 3, title: "Expedition", text: navesExp[0], data: {}});
      res.evento = 4;

    }else if(rand < 600){  // Se encuentran recursos

      let puntos = Math.floor(this.contarPuntosShips(ships) * 0.02) * research.astrophysics;
      let resource = Math.floor(Math.random() * 3);
      switch (resource) {
      case 0:
        res.resources.metal = Math.floor(puntos * Math.random()) + 1;
        break;
      case 1:
        res.resources.crystal = Math.floor(puntos * Math.random() * 0.5) + 1;
        break;
      default:
        res.resources.deuterium = Math.floor(puntos * Math.random() * 0.2) + 1;
      }
      res.mensajes.push({type: 3, title: "Expedition", text: recursosExp[0], data: {}});
      res.evento = 5;

    }else if(rand < 650){  // Se encuentran muchos recursos

      let puntos = Math.floor(this.contarPuntosShips(ships) * 0.035) * (research.astrophysics+1) + 100;
      res.resources.metal = Math.floor(puntos * Math.random()) + 1000;
      res.resources.crystal = Math.floor(puntos * Math.random() * 0.8) + 1000;
      res.resources.deuterium = Math.floor(puntos * Math.random() * 0.5) + 500;
      res.mensajes.push({type: 3, title: "Expedition", text: recursosExp[0], data: {}});
      res.evento = 5;

    }else if(rand < 800){  // Enfrentamiento

      let enemyTech = this.randomBattleTechs(research);
      let enemyShips = {};
      let puntos = 0;

      if(this.randomBool()){ // Batalla contra piratas

        puntos = Math.floor(this.contarPuntosShips(ships) * 0.85) + 5000;
        enemyShips = this.newPointsRandomFleet(puntos);
        res.mensajes.push({type: 3, title: "Expedition", text: batallaPiratasExp[0], data: {}});

      }else{ // Batalla contra alines

        for(let item in enemyTech){ // Aumento en 2 las tecnologias de los aliens
          enemyTech[item] += 2;
        }
        if(this.randomBool()){ // Algoritmo de puntos
          puntos = Math.floor(this.contarPuntosShips(ships) * 1.1) + 100000;
          enemyShips = this.newPointsRandomFleet(puntos);
        }else{ // Algoritmo de copia de flota
          enemyShips = this.newCorrelativeRandomFleet(ships);
        }
        res.mensajes.push({type: 3, title: "Expedition", text: batallaAliensExp[0], data: {}});

      }

      /* Simulo la batalla */
      let battleData/* = this.battle(ships, enemyShips, research, enemyTech)*/;
      /* Mando el mensage de la batalla */
      /*res.mensajes.push(battleData.message);*/
      res.mueren = this.isZeroObj(ships);
      /* Falta devolver las naves que sobrevivieron en ships */
      res.evento = 6;

    }else{  // No pasa nada en la expedicion
      res.mensajes.push({type: 3, title: "Expedition", text: nadaExp[0], data: {}});
    }
    res.ships.misil = 0; // No se pueden encontrar misiles en la expedicion
    return res;
  },
  misilAttack: function(defenses, misils, armour, weapon){
    // El algoritmo de misiles esta basado en el codigo del simulador http://www.toolsforogame.com/misiles/misiles.aspx
    // Resto los misiles de intersepcion que tenga el defensor
    let atacoDefensas = false;
    let newMisils = misils - defenses.antiballisticMissile;
    defenses.antiballisticMissile -= misils;

    if(defenses.antiballisticMissile < 0){ // Los misiles restantes destruyen las defensas
      let objAux;
      defenses.antiballisticMissile = 0;
      atacoDefensas = true;

      // Calculo el 'ataque' de los misiles con la variable newMisils
      let ataque = newMisils*12000*(1+(weapon/10));
      let vidaDef = new Array(8);
      for(let i = 0 ; i<integridadDefensas.length && ataque > 0 ; i++){
        vidaDef[i] = integridadDefensas[i]*(1+(armour/10)); // Calculo la 'vida' de cada tipo de defensa
        // Destruyo todas las defensas en orden, hasta quedar sin ataque o sin nada que destruir
        objAux = this.misilAttackAux(ataque, defenses[keysDefensas[i]], vidaDef[i]);
        ataque = objAux.ataqueRestante;
        defenses[keysDefensas[i]] -= objAux.destroyedDef;
      }
    }
    return {survivorDefenses: defenses, attackedDef: atacoDefensas};
  },
  misilAttackAux: function(ataque, cantDef, vidaDef){
    let destruidos = Math.floor(ataque / vidaDef); // Calculos la cantidad de defensas destruidas
    // Me fijo si destrui mas de las defensas que habia
    if(destruidos > cantDef) destruidos = cantDef;
    ataque -= destruidos*vidaDef; // Por cada destruido decremento el ataque para la proxima ronda
    return {ataqueRestante: ataque, destroyedDef: destruidos};
  },
  battle: function(attackerShips, defenderShips, defenses, attackerTech, defenderTech, fr){
    // Implento la version mas naive del algoritmo de batallas, unas ideas para mejorarlo son:
    //  - Implentar el algoritmo en ASMx86 con operaciones SIMD ( O almenos alguna parte del algoritmo )
    //  - Usar un modelo estadistico que me de una funcion por cada tipo de nave que apartir de los datos de entrada devuelva un estimado de las naves que sobreviven de ese tipo
    // Podria implentarlas en funciones distintas e ir probando cada una con casos de test

    // Calculo cuanto es el maximo escudo de cada nave para cada bando
    let maxShieldsAttacker = Array.from(shieldNaves);
    let maxShieldsDefender = Array.from(shieldNaves).concat(Array.from(shieldDefensas));
    this.calculaAtributosNaves(maxShieldsAttacker, attackerTech.shielding);
    this.calculaAtributosNaves(maxShieldsDefender, defenderTech.shielding);

    // Calculo cuanto es el ataque de cada nave para cada bando
    let attackAttacker = Array.from(attackNaves);
    let attackDefender = Array.from(attackNaves).concat(Array.from(attackDefensas));
    this.calculaAtributosNaves(attackAttacker, attackerTech.weapons);
    this.calculaAtributosNaves(attackDefender, defenderTech.weapons);

    // Calculo cuanto es la 'vida' de cada nave para cada bando
    let armourAttacker = Array.from(integridadNaves);
    let armourDefender = Array.from(integridadNaves).concat(Array.from(integridadDefensas));
    this.calculaAtributosNaves(armourAttacker, attackerTech.armour);
    this.calculaAtributosNaves(armourDefender, defenderTech.armour);

    // Por cada nave o defensa de cada bando creo un array que contiene la informacion de la el tipo de esa nave, su vida, su escudo y si sigue vivo
    let fleetAtk = [];
    let fleetDef = [];
    // Coloco las naves del atacante
    this.addShips(fleetAtk, attackerShips, maxShieldsAttacker, armourAttacker);

    // Coloco las naves del defensor
    this.addShips(fleetDef, defenderShips, maxShieldsDefender, armourDefender);
    // Coloco las defensas del defensor
    this.addShips(fleetDef, defenses, maxShieldsDefender, armourDefender);

    let termino = fleetAtk.length === 0 || fleetDef.length === 0;

    // Cada combate consta de maximo 6 rondas
    for(let ronda = 0 ; ronda<6 && !termino ; ronda++){
      // El atacante ataca al defensor
      this.startAttack(fleetAtk, fleetDef, attackAttacker, armourDefender, fr);
      // El defensor ataca al atacante
      this.startAttack(fleetDef, fleetAtk, attackDefender, armourAttacker, fr);

      // Actualizo las flotas para la siguiente ronda
      this.updateFleet(fleetAtk, maxShieldsAttacker);
      this.updateFleet(fleetDef, maxShieldsDefender);

      // Si alguna de las dos flotas esta completamente destruida, termina el combate
      termino = fleetAtk.length === 0 || fleetDef.length === 0;
    }

    let res = {};     // Devuelvo el resultado de la batalla en res
    res.atkShips = this.zeroShips();
    res.defShips = this.zeroShips();
    res.defDefenses = this.zeroDefense();

    let tipoAux;
    // Paso los arreglos de las flotas que sobrevivieron a objetos
    for(let i = 0 ; i<fleetAtk.length ; i++){
      res.atkShips[keysNaves[fleetAtk[i][0]]]++;
    }
    for(let i = 0 ; i<fleetDef.length ; i++){
      if(fleetDef[i][0] < 14){ // Es una nave
        res.defShips[keysNaves[fleetDef[i][0]]]++;
      }else{  // Es una defensa
        res.defDefenses[keysDefensas[fleetDef[i][0] - 14]]++;
      }
    } // La cantidad de misiles del defensor permanece intacta
    res.defDefenses.antiballisticMissile = defenses.antiballisticMissile;
    res.defDefenses.interplanetaryMissile = defenses.interplanetaryMissile;

    // Decido el resultado de la batalla (gana el atacante = 1, gana el defensor = 2, empate = 3)
    res.result = 3;     // Empate
    if(fleetAtk.length === 0 && fleetDef.length !== 0){
      res.result = 2;   // Gano el defensor
    }else if(fleetAtk.length !== 0 && fleetDef.length === 0){
      res.result = 1;   // Gano el atacante
    }
    return res;
  },
  calculaAtributosNaves: function(lista, tech){
    for(let i = 0 ; i<lista.length ; i++){
      lista[i] += lista[i]*tech/10;
    }
    return lista;
  },
  addShips: function(list, ships, maxShields, armour){
    let tipoNum;
    for(let item in ships){
      tipoNum = this.shipStringToNum(item);
      if(tipoNum != undefined){
        // Por cada nave pusheo un array que tiene la info: ['tipo', 'vida', 'escudo']
        for(let i = 0 ; i<ships[item] ; i++){
          list.push([tipoNum, armour[tipoNum], maxShields[tipoNum]]);
        }
      }
    }
  },
  startAttack: function(shoter, receptor, listAttack, listOriginalArmour, fr){
    // Por cada nave elijo un objetivo de la flota enemiga(receptor) y la ataco
    let objetivo, dano;
    for(let i = 0 ; i<shoter.length ; i++){
      /* Falta el fuego rapido */
      objetivo = Math.floor(Math.random()*receptor.length);
      dano = listAttack[shoter[i][0]];

      if(receptor[objetivo][1] > 0 && !this.reflectedShot(dano, receptor[objetivo][2])){ // Si la nave esta viva y no se refleja
        // Si el dano es mayor al escudo, este de desactiva y le sacan vida a la nave
        if(dano > receptor[objetivo][2]){
          dano -= receptor[objetivo][2];  // El escudo absorve parte del dano
          receptor[objetivo][2] = 0;      // Desactivo el escudo
          receptor[objetivo][1] -= dano;  // Le saco vida a esa nave

          // Si tiene menos del 70% de la vida total tiene posibilidad de explotar, esa nave
          if(listOriginalArmour[receptor[objetivo][0]] * 0.7 > receptor[objetivo][1] && Math.random() > receptor[objetivo][1] / listOriginalArmour[receptor[objetivo][0]]){
            receptor[objetivo][1] = 0;   // La nave explota, por lo tanto su vida es 0
          }
        }else{
          receptor[objetivo][2] -= dano;  // El ecudo absorbe todo el dano
        }
      }
    }
  },
  updateFleet: function(ships, shields){
    // Saco las naves destruidas (vida <= 0) y restauro los escudos de las que sigen peleando
    for(let i = 0 ; i<ships.length ; i++){
      if(ships[i][1] <= 0){
        ships.splice(i, 1);
        i--;
      }else{
        ships[i][2] = shields[ships[i][0]];
      }
    }
  },
  reflectedShot: function(dano, escudo){
    return dano < escudo*0.01;
  },
  calcularEscombros: function(objAttack, objOriginal, fleetD, defenseD){
    let debris = {metal: 0, crystal: 0};
    let costs = this.costShipsAndDefenses();
    let shipsAux;
    if(fleetD > 0){ // Sumo los escombros de las naves
      for(let item in objAttack.atkShips){
        if(item !== 'solarSatellite'){       // objOriginal.atkShips no tiene atributo 'solarSatellite' encambio tiene 'misil'
          shipsAux = (objOriginal.atkShips[item] - objAttack.atkShips[item]) + (objOriginal.defShips[item] - objAttack.defShips[item]);
          debris.metal += shipsAux * costs[item].metal * fleetD / 100;
          debris.crystal += shipsAux * costs[item].crystal * fleetD / 100;
        }
      }
    }
    // Calculo aparte el cristal los satelites solares
    shipsAux = objOriginal.defShips['solarSatellite'] - objAttack.defShips['solarSatellite'];
    debris.crystal += shipsAux * costs['solarSatellite'].crystal * fleetD / 100;
    if(defenseD > 0){ // Sumo los escombros de las defensas
      for(let item in objAttack.defDefenses){
        shipsAux = objOriginal.defDefenses[item] - objAttack.defDefenses[item];
        debris.metal += shipsAux * costs[item].metal * defenseD / 100;
        debris.crystal += shipsAux * costs[item].crystal * defenseD / 100;
      }
    }
    return debris;
  },
  lunaChance: function(debris, maxChance){
    let totalDebris = debris.metal + debris.crystal;
    // Cada 100000 de recursos un los escombros aumenta en 1% la posibilidad de luna
    let chance = Math.floor(totalDebris / 100000);
    return chance > maxChance ? maxChance : chance;
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
  }
};

module.exports = exp;
