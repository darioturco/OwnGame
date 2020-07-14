// Aca estan las funciones auxiliares simples
// o los renombres para aclarar cosas
var exp = {
  generateNewTypeOfPlanet: function(pos, mod) {
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
  cantidadMisiles: function(planeta){
    // En el juego ambos tipos de misil ocupan un solo lugar
    return planeta.defense.antiballisticMissile + planeta.defense.interplanetaryMissile;
  },
  capacidadSilo: function(planeta){
    // por cada nivel del silo se puede agregar 10 misiles de cualquier tipo
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
        res = '.' + this.completaDigitos(num%1000) + res;
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
  recursosSuficientes: function(resources, costo, mul = 1){
    return costo.metal*mul <= resources.metal && costo.crystal*mul <= resources.crystal && costo.deuterium*mul <= resources.deuterium;
  }
};

module.exports = exp;

//Lista de cosas por hacer

/* Terminar la funcion addFleetMovement
/* Mejorar el calculo de recursos de tiempos medios
/* El abandonar el planeta en Overview
/* Falta la administracion de flotas que te enviaron para defender tu planeta
/* La funcion de contar puntos tiene que contar los puntos de las flotas que estan en movimiento
/* El contruir satelites solares la energia no se actualiza
/* Tengo que agregar a la lista de fleetMovement
/* Tengo que terminar al funcion addSuport
/* Modularizar algunas funciones para que tengan nombres mas descriptivos
*/
