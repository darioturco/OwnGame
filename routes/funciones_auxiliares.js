// Aca estan las funciones auxiliares simples
// o los renombres para aclarar cosas
var exp = {
  generateNewTypeOfPlanet: function(pos, mod) {
    let temp = 10, rango = 40;
    let tipo = this.getTypePlanet(pos, mod);
    rango = Math.floor(Math.random()*20+10);
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
    if((mod == 0 && pos >= 14) || (mod == 1 && (pos == 6 || pos == 7))) tipo = 1; // Normal
    if((mod == 0 && pos <= 3) || (mod == 1 && (pos == 4 || pos == 5))) tipo = 2; // Dry
    if((mod == 0 && (pos == 6 || pos == 7)) || (mod == 1 && (pos == 8 || pos == 9))) tipo = 3; // Jungle
    if((mod == 0 && (pos == 8 || pos == 9)) || (mod == 1 && (pos == 10 || pos == 11))) tipo = 4; // Water
    if((mod == 0 && (pos == 12 || pos == 13)) || (mod == 1 && pos >= 14)) tipo = 5; // Gas
    if((mod == 0 && (pos == 10 || pos == 11)) || (mod == 1 && (pos == 12 || pos == 13))) tipo = 6; // Ice
    if(mod == 1 && (pos <= 3)) tipo = 7; // Desert
    return tipo;
  },
  cantidadMisiles: function(planeta){
    // En el juego ambos tipos de misil ocupan un solo lugar
    return planeta.defense.antiballisticMissile + planeta.defense.interplanetaryMissile;
  },
  capacidadSilo: function(planeta){
    // Por cada nivel del silo se puede agregar 10 misiles de cualquier tipo
    return planeta.buildings.silo*10;
  },
  timeBuild: function(recursos, mult, elev, uniSpeed){
    let divisor = 2500 * (1+mult) * Math.pow(2,elev) * uniSpeed;
    return Math.floor(60*recursos/divisor);
  },
  maximoDefensores: function(planeta){
    return planeta.buildings.alliance + 1;
  },
  normalRandom: function(min, max, podaMin = -Infinity, podaMax = Infinity) {// la esperanza es (max+min)/2
    /* Pasar algoritmo */
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
  validInt: function(num) {
    num = parseInt(num);
    return !isNaN(num);
  },
  validShipyardName: function(name) {
    return (name == "lightFighter" || name == "heavyFighter" || name == "cruiser" || name == "battleship" || name == "battlecruiser" || name == "bomber" || name == "destroyer" || name == "deathstar" || name == "smallCargo" || name == "largeCargo" || name == "colony" || name == "recycler" || name == "espionageProbe" || name == "solarSatellite" || name == "rocketLauncher" || name == "lightLaser" || name == "heavyLaser" || name == "gauss" || name == "ion" || name == "plasma" || name == "smallShield" || name == "largeShield" || name == "antiballisticMissile" || name == "interplanetaryMissile");
  },
  formatNumber: function(num) {
    let res = num;
    let sign = Math.sign(num);
    if(isFinite(num)){
      res = '';
      num = Math.abs(num);
      while(num > 999){
        res = '.' + exp.completaDigitos(num%1000) + res; // Se usa 'exp' porque si no genera problemas de contexto
        num = Math.floor(num / 1000);
      }
      res = num + res;
      if(sign == -1) res = '-' + res;
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
    if(seg != 0){
      time = (seg%60) + "m " + time;
      seg = Math.floor(seg/60);
      if(seg != 0){
        time = (seg%24) + "h " + time;
        seg = Math.floor(seg/24);
        if(seg != 0) time = seg + "d " + time;
      }
    }
    return " " + time;
  },
  recursosSuficientes: function(resources, costo, mul = 1){
    return costo.metal*mul <= resources.metal && costo.crystal*mul <= resources.crystal && costo.deuterium*mul <= resources.deuterium;
  },
  coordenadaValida: function(coor){
    return coor.gal >= 1 && coor.sys >= 1 && coor.pos >= 1 && coor.gal <= 9 && coor.sys <= 499 && coor.pos <= 16;
  },
  calculaDistancia: function(desde, hasta, galaxyDonut, systemDonut){
    let dis = 0;
    if(desde.gal == hasta.gal){
      if(desde.sys == hasta.sys){
        if(desde.pos == hasta.pos){
          dis = 5; // Mismas cordenadas
        }else{
          dis = 1000 + 5*Math.abs(desde.pos - hasta.pos); // Mismo systema y galaxia
        }
      }else{
        if(systemDonut == true){
          dis = Math.min(2700 + 95*Math.abs(desde.sys - hasta.sys), 2700 + 95*Math.abs(desde.sys - hasta.sys - 499),  2700 + 95*Math.abs(desde.sys - hasta.sys + 499));
        }else{
          dis = 2700 + 95*Math.abs(desde.sys - hasta.sys);
        }
      }
    }else{
      if(galaxyDonut == true){
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
    let arrayText = ["Expedition", "Colonisation", "Recycle", "Transport", "Deployment", "Espionage", "ACS Defend", "Attack", "Moon Destruction"];
    return arrayText[num];
  },
  objStringToNum: function(obj){
    for(let i in obj){
      obj[i] = parseInt(obj[i]);
    }
  },
  getIndexOfPlanet: function(planets, coors){ // Dada una lista de planetas y unas coordenadas, devuelve el indice del planeta con esas coordenadas
    let res = -1;
    for(let i = 0 ; i<planets.length && res == -1 ; i++){
      if(planets[i].coordinates.gal == coors.gal && planets[i].coordinates.sys == coors.sys && planets[i].coordinates.pos == coors.pos){
        res = i;
      }
    }
    return res;
  },
  isZeroObj: function(obj){
    let res = true;
    for(let i in obj){
      if (obj[i] != 0){
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
  estaColonizado: function(lista, coor){
    return lista[coor.gal + '_' + coor.sys + '_' + coor.sys] == undefined;
  },
  cargaEscombros: function(debris, recicladores){
    let capacidad = 20000*recicladores;// Calcula cuanto puede cargar como maximo
    let res = {metal: 0, crystal: 0};
    if(debris.metal > capacidad){      // Recolecta el metal
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
  }
};

module.exports = exp;
