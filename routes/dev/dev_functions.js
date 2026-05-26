var uni  = require('../universe');
var base = require('../data_base');

var dev = {
  setPlanetDataDev: function(coor){
    let mongo = base.getMongo();
    let resources = {metal: 1000000, crystal: 10000000, deuterium: 150000, energy: 0};
    let building = {metalMine: 0, crystalMine: 1, deuteriumMine: 0, solarPlant: 30, fusionReactor: 0, metalStorage: 10, crystalStorage: 9, deuteriumStorage: 8, robotFactory: 12, shipyard: 4, researchLab: 8, alliance: 0, silo: 0, naniteFactory: 1, terraformer: 0};
    let fleet = /*uni.fun.zeroShips();*/{lightFighter: 10, heavyFighter: 0, cruiser: 100, battleship: 10, battlecruiser: 0, bomber: 3, destroyer: 100, deathstar: 50, smallCargo: 500, largeCargo: 200, colony: 1000, recycler: 200, espionageProbe: 30, solarSatellite: 15};
    let defenses = /*uni.fun.zeroDefense();*/{rocketLauncher: 100, lightLaser: 10, heavyLaser: 0, gauss: 5, ion: 0, plasma: 0, smallShield: 0, largeShield: 0, antiballisticMissile: 3, interplanetaryMissile: 1000};
    let moon = /*{active: false, size: 0};*/uni.createNewMoon(8888);
    let debris = {active: true, metal:1000, crystal: 2000};
    mongo.db(process.env.UNIVERSE_NAME).collection("jugadores").updateOne(
      {planets: {$elemMatch: {coordinates: coor}}},
      {$set: {'planets.$.resources': resources, 'planets.$.buildings': building, 'planets.$.fleet': fleet, 'planets.$.defense': defenses, 'planets.$.moon': moon, 'planets.$.debris': debris}});
  },

  setMoonDataDev: function(coor){
    let mongo = base.getMongo();
    let resources = {metal: 50000000, crystal: 40000000, deuterium: 10000000, energy: 0};
    let building = {lunarBase: 10, phalanx: 4, spaceDock: 0, marketplace: 2, lunarSunshade: 0, lunarBeam: 0, jumpGate: 5, moonShield: 0};
    let fleet = {lightFighter: 1000, heavyFighter: 0, cruiser: 1, battleship: 30, battlecruiser: 0, bomber: 0, destroyer: 0, deathstar: 100, smallCargo: 10, largeCargo: 200, colony: 0, recycler: 20, espionageProbe: 0, solarSatellite: 0};
    mongo.db(process.env.UNIVERSE_NAME).collection("jugadores").updateOne(
      {planets: {$elemMatch: {coordinates: coor}}},
      {$set: {'planets.$.moon.resources': resources, 'planets.$.moon.buildings': building, 'planets.$.moon.fleet': fleet}});
  },

  setupDevEnvironment: function(){
    uni.base.deleteCollection(["jugadores", "universo"]);
    uni.createUniverse(process.env.UNIVERSE_NAME, 5, {name: "", inicio: 0, maxGalaxies: 9, donutGalaxy: true, donutSystem: true, speed: 1, speedFleet: 100, fleetDebris: 30, defenceDebris: 0, maxMoon: 20, rapidFire: true});
    uni.addNewPlayer("dturco", 1);
    dev.setPlanetDataDev(uni.player.planets[0].coordinates);
    dev.setMoonDataDev(uni.player.planets[0].coordinates);
  }
};

module.exports = dev;
