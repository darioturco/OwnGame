const fetch = require('node-fetch');
var token = "";
var id = ""

console.log("Hola bot");

async function login(){
  let data = {username: "bot_4", password: "vctdd"};
  let res = await fetch('http://localhost:3000/bot/login', {method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify(data)});
  res = await res.json();
  id = res.id;
  //console.log(res);
}

async function logout(){
  //let data = {username: "bot_1"};
  let data = {username: "lalalal", id};
  let res = await fetch('http://localhost:3000/bot/logout', {method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify(data)});
  res = await res.json();
  console.log(res);
}

async function changePlanetName(){
  let data = {newName: "botPlanet", moon: false, coor: {gal: 1, sys: 1, pos: 8}, id}//{username: "bot_1", password: "nwipre"};
  //let data = {username: "bot_1", password: "nwipre"};
  let res = await fetch('http://localhost:3000/bot/changeName', {method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify(data)});
  res = await res.json();
  console.log(res);
}

async function abandonPlanet(){
  let data = {id, planetNum: 0};
  let res = await fetch('http://localhost:3000/bot/abandonPlanet', {method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify(data)});
  res = await res.json();
  console.log(res);
}

async function infoPlayer(){
  let data = {id};
  let res = await fetch('http://localhost:3000/bot/infoPlayer', {method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify(data)});
  res = await res.json();
  console.log(res);
}

async function infoUniverso(){
  let data = {id};
  let res = await fetch('http://localhost:3000/bot/infoUniverso', {method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify(data)});
  res = await res.json();
  console.log(res);
}

async function infoGalaxy(){
  let data = {id, gal: 1, sys: 1};
  let res = await fetch('http://localhost:3000/bot/infoGalaxy', {method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify(data)});
  res = await res.json();
  console.log(res);
}

async function changeResourcesOptions(){
  //let data = {id, planetNum: 0, moon: false, metal: 2, crystal: 5, deuterium: 8, energy: 4};
  let data = {id, planetNum: 0, moon: true, sunshade: 5, beam: 10};
  let res = await fetch('http://localhost:3000/bot/changeResourcesOptions', {method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify(data)});
  res = await res.json();
  console.log(res);
}

async function infoBuildings(){
  let data = {id, planetNum: 0};
  let res = await fetch('http://localhost:3000/bot/infoBuildings', {method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify(data)});
  res = await res.json();
  console.log(res);
}

async function buildingRequest(){
  let data = {id, planetNum: 0, process: 'metalMine'};
  let res = await fetch('http://localhost:3000/bot/buildingRequest', {method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify(data)});
  res = await res.json();
  console.log(res);
}

async function cancelBuilding(){
  let data = {id, planetNum: 0};
  let res = await fetch('http://localhost:3000/bot/cancelBuilding', {method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify(data)});
  res = await res.json();
  console.log(res);
}

async function infoBuildingsMoon(){
  let data = {id, planetNum: 0};
  let res = await fetch('http://localhost:3000/bot/infoBuildingsMoon', {method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify(data)});
  res = await res.json();
  console.log(res);
}

async function buildingRequestMoon(){
  let data = {id, planetNum: 0, process: 'lunarBase'};
  let res = await fetch('http://localhost:3000/bot/buildingRequestMoon', {method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify(data)});
  res = await res.json();
  console.log(res);
}

async function cancelBuildingMoon(){
  let data = {id, planetNum: 0};
  let res = await fetch('http://localhost:3000/bot/cancelBuildingMoon', {method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify(data)});
  res = await res.json();
  console.log(res);
}

async function infoShips(){
  //let data = {id, planetNum: 0, moon: false};
  let data = {id, planetNum: 0, moon: true};
  let res = await fetch('http://localhost:3000/bot/infoShips', {method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify(data)});
  res = await res.json();
  console.log(res);
}

async function buildShips(){
  let data = {id, planetNum: 0, obj: "solarSatellite", cant: 5};
  let res = await fetch('http://localhost:3000/bot/buildShips', {method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify(data)});
  res = await res.json();
  console.log(res);
}

async function cancelShips(){
  let data = {id, planetNum: 0, obj: "solarSatellite"};
  let res = await fetch('http://localhost:3000/bot/cancelShips', {method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify(data)});
  res = await res.json();
  console.log(res);
}

async function infoDefenses(){
  let data = {id, planetNum: 0};
  let res = await fetch('http://localhost:3000/bot/infoDefenses', {method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify(data)});
  res = await res.json();
  console.log(res);
}

async function buildDefenses(){
  let data = {id, planetNum: 0, obj: "rocketLauncher", cant: 5};
  let res = await fetch('http://localhost:3000/bot/buildDefenses', {method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify(data)});
  res = await res.json();
  console.log(res);
}

async function cancelDefenses(){
  let data = {id, planetNum: 0, obj: "rocketLauncher"};
  let res = await fetch('http://localhost:3000/bot/cancelDefenses', {method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify(data)});
  res = await res.json();
  console.log(res);
}

async function infoResearch(){
  let data = {id};
  // let data = {id, planetNum: 0};
  let res = await fetch('http://localhost:3000/bot/infoResearch', {method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify(data)});
  res = await res.json();
  console.log(res);
}

async function buildResearch(){
  let data = {id, planetNum: 0, obj: "laser"};
  // let data = {id, planetNum: 0};
  let res = await fetch('http://localhost:3000/bot/buildResearch', {method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify(data)});
  res = await res.json();
  console.log(res);
}

async function cancelResearch(){
  let data = {id};
  // let data = {id, planetNum: 0};
  let res = await fetch('http://localhost:3000/bot/cancelResearch', {method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify(data)});
  res = await res.json();
  console.log(res);
}

async function sendFleet(){
  let data = {id, planetNum: 0, moon: false, data: { ships:
   { lightFighter: 0,
     heavyFighter: 0,
     cruiser: 0,
     battleship: 0,
     battlecruiser: 0,
     bomber: 0,
     destroyer: 0,
     deathstar: 0,
     smallCargo: 0,
     largeCargo: 0,
     colony: 0,
     recycler: 5,
     espionageProbe: 0,
     misil: 0 },
    coorDesde: { gal: 1, sys: 2, pos: 7 },
    coorHasta: { gal: 1, sys: 2, pos: 7 },
    destination: 3,
    porce: 2,
    mission: 2,
    resources: { metal: 0, crystal: 0, deuterium: 0 } } };
  let res = await fetch('http://localhost:3000/bot/sendFleet', {method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify(data)});
  res = await res.json();
  console.log(res);
}

async function returnFleet(){
  let data = {id, num: 0};
  let res = await fetch('http://localhost:3000/bot/returnFleet', {method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify(data)});
  res = await res.json();
  console.log(res);
}

async function readMessage(){
  let data = {id, num: 0};
  let res = await fetch('http://localhost:3000/bot/readMessage', {method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify(data)});
  res = await res.json();
  console.log(res);
}

async function deleteMessage(){
  //let data = {id, all: false, data: 'Sun Jun 20 2021 18:50:35'};
  let data = {id, all: true, data: 2};
  let res = await fetch('http://localhost:3000/bot/deleteMessage', {method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify(data)});
  res = await res.json();
  console.log(res);
}

async function changeOptions(){
  let data = {id, esp: 3, sml: 3, lar: 1};
  let res = await fetch('http://localhost:3000/bot/changeOptions', {method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify(data)});
  res = await res.json();
  console.log(res);
}

async function showTechnology(){
  let data = {};
  let res = await fetch('http://localhost:3000/bot/showTechnology', {method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify(data)});
  res = await res.json();
  console.log(res);
}

async function showHighscore(){
  let data = {};
  let res = await fetch('http://localhost:3000/bot/showHighscore', {method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify(data)});
  res = await res.json();
  console.log(res);
}

async function searchPlayer(){
  let data = {name: 'dturco'};
  let res = await fetch('http://localhost:3000/bot/searchPlayer', {method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify(data)});
  res = await res.json();
  console.log(res);
}

async function seeRewards(){
  let data = {};
  let res = await fetch('http://localhost:3000/bot/seeRewards', {method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify(data)});
  res = await res.json();
  console.log(res);
}

async function updateReward(){
  let data = {id, mission: 1};
  let res = await fetch('http://localhost:3000/bot/updateReward', {method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify(data)});
  res = await res.json();
  console.log(res);
}

async function usePhalanx(){
  let data = {id, planetNum: 0, coor: {gal: 1, sys: 2, pos: 8}};
  let res = await fetch('http://localhost:3000/bot/usePhalanx', {method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify(data)});
  res = await res.json();
  console.log(res);
}

async function useJumpGate(){
  let data = {id, planetNum: 0, data: {ships: { lightFighter: 0,
    heavyFighter: 0,
    cruiser: 0,
    battleship: 0,
    battlecruiser: 0,
    bomber: 0,
    destroyer: 0,
    deathstar: 0,
    smallCargo: 0,
    largeCargo: 0,
    colony: 0,
    recycler: 5,
    espionageProbe: 0}, coorHasta: {gal: 1, sys: 2, pos: 8}}};
  let res = await fetch('http://localhost:3000/bot/useJumpGate', {method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify(data)});
  res = await res.json();
  console.log(res);
}

async function useMarketMoon(){
  // button: 0 = metal por crystal, 1 = metal por deuterium, 2 = crystal por metal, 3 = crystal por deuterium, 4 = deuterium por metal, 5 = deuterium por crystal
  let data = {id, planetNum: 0, data: {cantidad: 10000, button: 0}};
  let res = await fetch('http://localhost:3000/bot/useMarketMoon', {method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify(data)});
  res = await res.json();
  console.log(res);
}

async function changePassword(){
  let data = {id, username: "dturco", password: "idnhlahf", newPassword: "jukulkf"};
  let res = await fetch('http://localhost:3000/bot/changePassword', {method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify(data)});
  res = await res.json();
  console.log(res);
}

async function combinar(){
  await login();
  //await deleteMessage();
  //await changePassword();
  //setTimeout(returnFleet, 250);
  //setTimeout(changePlanetName, 1000);
}

//login();
//logout();
//changePlanetName();

//combinar();
changePassword();

console.log("Fin codigo");



/* Funciones a implementar / implementadas:

  - login
  - logout
  - changePlanetName
  - abandonPlanet
  - infoPlayer
  - infoUniverso
  - infoGalaxy
  - changeResourcesOptions
  - infoBuildings
  - buildingRequest
  - cancelBuilding
  - infoBuildingsMoon
  - buildingRequestMoon
  - cancelBuildingMoon
  - infoShips
  - buildShips
  - cancelShips
  - infoDefenses
  - buildDefenses
  - cancelDefenses
  - infoResearch
  - buildResearch
  - cancelResearch
  - sendFleet
  - returnFleet
  isSomeoneAttackingMe
  keepInfoAttack
  - readMessage
  - deleteMessage
  - changeOptions
  - showTechnology
  - showHighscore
  - searchPlayer
  - seeRewards
  - updateReward
  - usePhalanx
  - useJumpGate
  - useMarketMoon
  - changePassword
*/
