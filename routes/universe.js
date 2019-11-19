var objectId = require('mongodb').ObjectId;
var mongo = null;
require('mongodb').MongoClient.connect(process.env.MONGO_URL, {useUnifiedTopology: true}, (err, db) => {
  if(err) throw err;
  console.log('\x1b[32m%s\x1b[0m', "Base de datos lista.");
  mongo = db;
  //carga los datos del universo
});
var exp = {
  universo: {
    name: "pepe",
    inicio: 0,
    maxGalaxies: 9,
    donutGalaxy: true,
    donutSystem: true,
    speed: 1,
    speedFleet: 1,
    fleetDebris: 30,
    defenceDebris: 0,
    maxMoon: 20,
    cantPlayers: 0
  },
  player: null,
  planeta: 0,
  setPlayer: function(player, f) {
    mongo.db(process.env.UNIVERSE_NAME).collection(process.env.JUGADORES).findOne({name: player}, (err, res) => {
      if(err) throw err;
      this.player = res;
      //actualiza los datos desde la ultima conecccion
      f();
    });
  },
  createNewPlanet: function(cord, planetName, playerName) {
    var typePlanet = this.generateNewTypeOfPlanet(cord.pos, cord.system % 2);
    return {idPlanet: Math.pow(500,2)*cord.galaxy + 500*cord.system + cord.pos,
      coordinates: cord,
      player: playerName,
      name: planetName,
      type: typePlanet.type,
      color: typePlanet.color,
      temperature: typePlanet.temperature,
      camposMax: typePlanet.campos,
      campos: 0,
      resources: {metal: 500, crystal: 500, deuterium: 0, energy: 0},
      resourcesAdd: {metal: 20, crystal: 10, deuterium: 0},
      resourcesPercentage: {metal: 10, crystal: 10, deuterium: 10, energy: 10},
      buildings: {metalMine: 0, crystalMine: 0, deuteriumMine: 0, solarPlant: 0, fusionReactor: 0, metalStorage: 0, crystalStorage: 0, deuteriumStorage: 0, robotFactory: 0, shipyard: 0, researchLab: 0, alliance: 0, silo: 0, naniteFactory: 0, terraformer: 0},
      fleet: {lightFighter: 0, heavyFighter: 0, cruiser: 0, battleship: 0, battlecruiser: 0, bomber: 0, destroyer: 0, deathstar: 0, smallCargo: 0, largeCargo: 0, colony: 0, recycler: 0, espionageProbe: 0, solarSatellite: 0},
      defense: {rocketLauncher: 0, lightLaser: 0, heavyLaser: 0, gauss: 0, ion: 0, plasma: 0, smallShield: 0, largeShield: 0, antiballisticMissile: 0, interplanetaryMissile: 0},
      moon: {active: false},
      debris: {active:false, metal:0, crystal: 0}
    };
  },
  addNewPlayer: (name, styleGame) => {
    var newPlanet = exp.createNewPlanet(exp.newCord(), "Planeta Principal", name);
    var newPlanet1 = exp.createNewPlanet({galaxy: 1, system: 2, pos: 10}, "Colony1", name);//borrar solo tiene que crear un planeta
    var newPlanet2 = exp.createNewPlanet({galaxy: 1, system: 3, pos: 12}, "Colony2", name);//borrar solo tiene que crear un planeta
    var newPlayer = {'name': name,
      'styleGame': styleGame,
      planets: [newPlanet, newPlanet1, newPlanet2],//solo tiene que cargar un planeta
      maxPlanets: 1,
      highscore: exp.getHigscoreNewPlayer(),//get la ultima position
      puntos: 0,
      puntosAcum: 0,
      vacas: [],
      sendSpionage: 1,
      dark: 8000,
      messagesCant: 0,
      messages: [],
      movement: [],
      research: {energy: 0, laser: 0, ion: 0, hyperspace: 0, plasma: 0, espionage: 0, computer: 0, astrophysics: 0, intergalactic: 0, graviton: 0, combustion: 0, impulse: 0, hyperspace_drive: 0, weapons: 0, shielding: 0, armour: 0},
      lastVisit: 0,
      type: "activo"
    };
    //aumenta en uno la cantidad de jugadores del universo
    mongo.db(process.env.UNIVERSE_NAME).collection("jugadores").insertOne(newPlayer);//agrega al jugador a la lista de jugadores
    mongo.db(process.env.UNIVERSE_NAME).collection("universo").insertOne(newPlanet);//agrega el planeta a la lista de planetas de manera ordenada por id
  },
  getHigscoreNewPlayer: () => {
    return 1;//cambiar
  },
  newCord: () => {
    //Cambiar y hacer que seleccione una coordenada libre nueva
    return {galaxy: 1, system: 1, pos: 4};
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
  getActualBasicInfo: function(planet, str="") {
    let list = [];
    for(var i = 0 ; i<this.player.planets.length ; i++){
      list.push({name: this.player.planets[i].name, coordinates: this.player.planets[i].coordinates, type: this.player.planets[i].type, color: this.player.planets[i].color});
    }
    let item = {
      resources: this.player.planets[planet].resources,
      add: this.player.planets[planet].resourcesAdd,
      mesagges: this.player.messagesCant,
      movement: this.player.movement,
      speedTime: this.universo.speed
    };
    return {loadItem: str + "initFunction(" + JSON.stringify(item) + ");",
      playerName: this.player.name,
      highscore: this.player.highscore,
      energy: item.resources.energy,
      dark: this.player.dark,
      cantPlanets: this.player.planets.length,
      maxPlanets: this.player.maxPlanets,
      numPlanet: planet,
      planets: list
    };
  },
  overviewActualInfo: function (planet) {
    let cam = this.player.planets[planet].camposMax;
    return {diameter: cam*66 + ' Km',
      type: this.player.planets[planet].type,
      temperature: this.player.planets[planet].temperature,
      camposMax: cam,
      campos: this.player.planets[planet].campos,
      cantPlayers: this.universo.cantPlayers,
      points: this.player.points
    };
  },
  buildingsActualInfo: function (planet) {
    return {buildings: this.player.planets[planet].buildings, solarSatellite: this.player.planets[planet].fleet.solarSatellite};
  },
  costBuildings: function (planet){
    let build = this.player.planets[planet].buildings;
    let divisor = 2500 * (1 + build.robotFactory) * Math.pow(2,build.naniteFactory) * this.speed;
    return {metalMine: {metal: Math.floor(60*Math.pow(1.5, build.metalMine)), crystal: Math.floor(15*Math.pow(1.5, build.metalMine)), deuterium: 0, energy: Math.floor(10*(build.metalMine+1)*Math.pow(1.1, (build.metalMine+1))), tech: true, level: build.metalMine, name: "Metal Mine", description: "Used in the extraction of metal ore, metal mines are of primary importance to all emerging and established empires."},
            crystalMine: {metal: Math.floor(48*Math.pow(1.6, build.crystalMine)), crystal: Math.floor(24*Math.pow(1.6, build.crystalMine)), deuterium: 0, energy: Math.floor(10*(build.crystalMine+1)*Math.pow(1.1, (build.crystalMine+1))), tech: true, level: build.crystalMine, name: "Crystal Mine", description: "Crystals are the main resource used to build electronic circuits and form certain alloy compounds."},
            deuteriumMine: {metal: Math.floor(225*Math.pow(1.5, build.deuteriumMine)), crystal: Math.floor(75*Math.pow(1.5, build.deuteriumMine)), deuterium: 0, energy: Math.floor(20*(build.deuteriumMine+1)*Math.pow(1.1, (build.deuteriumMine+1))), tech: true, level: build.deuteriumMine, name: "Deuterium Synthesizer", description: "Deuterium Synthesizers draw the trace Deuterium content from the water on a planet."},
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
            solarSatellite: {metal: 0, crystal: 2000, deuterium: 500, energy: 0, tech: build.shipyard >= 1, level: 1, name: "Solar Satellite", description: ""},
            listInfo: ["metalMine", "crystalMine", "deuteriumMine", "solarPlant", "fusionReactor", "solarSatellite", "metalStorage", "crystalStorage", "deuteriumStorage", "robotFactory", "shipyard", "researchLab", "alliance", "silo", "naniteFactory", "terraformer"],
            time: {mult: build.robotFactory, elev: build.naniteFactory},
            ion: this.player.research.ion // sirve para calcular los costes y tiempo de demolicion

    };
  },
  costResearch: function (planet){
    let research = this.player.research;
    let lab = this.player.planets[planet].buildings.researchLab;
    return {energy: {metal: 0, crystal: 800*Math.pow(2, research.energy), deuterium: 400*Math.pow(2, research.energy), energy: 0, tech: lab >= 1, level: research.energy, name: "Energy Technology", description: "The command of different types of energy is necessary for many new technologies."},
            laser: {metal: 200*Math.pow(2, research.laser), crystal: 100*Math.pow(2, research.laser), deuterium: 0, energy: 0, tech: lab >= 1 && research.energy >= 2, level: research.laser, name: "Laser Technology", description: "Focusing light produces a beam that causes damage when it strikes an object."},
            ion: {metal: 1000*Math.pow(2, research.ion), crystal: 300*Math.pow(2, research.ion), deuterium: 100*Math.pow(2, research.ion), energy: 0, tech: lab >= 4 && research.energy >= 4  && research.laser >= 5, level: research.ion, name: "Ion Technology", description: "The concentration of ions allows for the construction of cannons, which can inflict enormous damage and reduce the deconstruction costs per level by 4%."},
            hyperspace: {metal: 0, crystal: 4000*Math.pow(2, research.hyperspace), deuterium: 2000*Math.pow(2, research.hyperspace), energy: 0, tech: lab >= 7 && research.energy >= 5 && research.shielding >= 5, level: research.hyperspace, name: "Hyperspace Technology", description: "By integrating the 4th and 5th dimensions it is now possible to research a new kind of drive that is more economical and efficient."},
            plasma: {metal: 2000*Math.pow(2, research.plasma), crystal: 4000*Math.pow(2, research.plasma), deuterium: 1000*Math.pow(2, research.plasma), energy: 0, tech: lab >= 4 && research.energy >= 8 && research.laser >= 10 && research.ion >= 5, level: research.plasma, name: "Plasma Technology", description: "A further development of ion technology which accelerates high-energy plasma, which then inflicts devastating damage and additionally optimises the production of resources."},
            espionage: {metal: 200*Math.pow(2, research.espionage), crystal: 1000*Math.pow(2, research.espionage), deuterium: 200*Math.pow(2, research.espionage), energy: 0, tech: lab >= 3, level: research.spionage, name: "Espionage Technology", description: "Information about other planets and moons can be gained using this technology."},
            computer: {metal: 0, crystal: 400*Math.pow(2, research.computer), deuterium: 600*Math.pow(2, research.computer), energy: 0, tech: lab >= 1, level: research.computer, name: "Computer Technology", description: "More fleets can be commanded by increasing computer capacities. Each level of computer technology increases the maximum number of fleets by one."},
            astrophysics: {metal: 4000*Math.pow(2, research.astrophysics), crystal: 8000*Math.pow(2, research.astrophysics), deuterium: 4000*Math.pow(2, research.astrophysics), energy: 0, tech: lab >= 3 && research.spionage >= 4 && research.impulse >= 3, level: research.astrophysics, name: "Astrophysics", description: "With an astrophysics research module, ships can undertake long expeditions. Every second level of this technology will allow you to colonise an extra planet."},
            intergalactic: {metal: 240000*Math.pow(2, research.intergalactic), crystal: 400000*Math.pow(2, research.intergalactic), deuterium: 160000*Math.pow(2, research.intergalactic), energy: 0, tech: lab >= 10 && research.computer >= 8 && research.hyperspace >= 8, level: research.intergalactic, name: "Intergalactic Research Network", description: "Researchers on different planets communicate via this network."},
            graviton: {metal: 0, crystal: 0, deuterium: 0, energy: 300000*Math.pow(2, research.graviton), tech: lab >= 12, level: research.graviton, name: "Graviton Technology", description: "Firing a concentrated charge of graviton particles can create an artificial gravity field, which can destroy ships or even moons."},
            combustion: {metal: 400*Math.pow(2, research.combustion), crystal: 0, deuterium: 600*Math.pow(2, research.combustion), energy: 0, tech: lab >= 1 && research.energy >= 1, level: research.combustion, name: "Combustion Drive", description: "The development of this drive makes some ships faster, although each level increases speed by only 10 % of the base value."},
            impulse: {metal: 2000*Math.pow(2, research.impulse), crystal: 4000*Math.pow(2, research.impulse), deuterium: 600*Math.pow(2, research.impulse), energy: 0, tech: lab >= 2 && research.energy >= 2, level: research.impulse, name: "Impulse Drive", description: "The impulse drive is based on the reaction principle. Further development of this drive makes some ships faster, although each level increases speed by only 20 % of the base value."},
            hyperspace_drive: {metal: 10000*Math.pow(2, research.hyperspace_drive), crystal: 20000*Math.pow(2, research.hyperspace_drive), deuterium: 6000*Math.pow(2, research.hyperspace_drive), energy: 0, tech: lab >= 7 && research.hyperspace >= 3, level: research.hyperspace, name: "Hyperspace Drive", description: "Hyperspace drive warps space around a ship. The development of this drive makes some ships faster, although each level increases speed by only 30 % of the base value."},
            weapons: {metal: 800*Math.pow(2, research.weapons), crystal: 200*Math.pow(2, research.weapons), deuterium: 0, energy: 0, tech: lab >= 4, level: research.weapons, name: "Weapons Technology", description: "Weapons technology makes weapons systems more efficient. Each level of weapons technology increases the weapon strength of units by 10 % of the base value."},
            shielding: {metal: 200*Math.pow(2, research.shielding), crystal: 600*Math.pow(2, research.shielding), deuterium: 0, energy: 0, tech: lab >= 6 && research.research.energy >= 3, level: research.shielding, name: "Shielding Technology", description: "Shielding technology makes the shields on ships and defensive facilities more efficient. Each level of shield technology increases the strength of the shields by 10 % of the base value."},
            armour: {metal: 1000*Math.pow(2, research.armour), crystal: 0, deuterium: 0, energy: 0, tech: lab >= 2, level: research.armour, name: "Armour Technology", description: "Special alloys improve the armour on ships and defensive structures. The effectiveness of the armour can be increased by 10 % per level."},
            listInfo: ["energy", "laser", "ion", "hyperspace", "plasma", "espionage", "computer", "astrophysics", "intergalactic", "graviton", "combustion", "impulse", "hyperspace_drive", "weapons", "shielding", "armour"],
            time: {mult: lab, elev: research.intergalactic}
    };
  },
  normalRandom: (min, max, podaMin = -Infinity, podaMax = Infinity) => {// la esperanza es (max+min)/2
    var u = 0, v = 0;
    while(u == 0) u = Math.random(); //Converting [0,1) to (0,1)
    let num = Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v); // Box–Muller transform
    num = num / 10.0 + 0.5; // Translate to 0 -> 1
    if (num > 1 || num < 0) num = randn_bm(min, max, podaMin, podaMax); // resample between 0 and 1 if out of range
    num *= max - min; // Stretch to fill range
    num += min; // offset to min
    if (num > podaMax || num < podaMin) num = Math.random()*(podaMax-podaMin)+(podaMin);
    return num;
  },
  seeDataBase: (res, uni, name) => {
    var respuesta = "";
    var cursor = mongo.db(uni).collection(name).find();
    cursor.forEach((doc, err) => {
      respuesta += JSON.stringify(doc);
    }, () => {
      res.render('index', {title: 'Ogame', message: respuesta});
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
