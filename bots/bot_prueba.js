const fetch = require('node-fetch');
var token = "";
var id = ""

console.log("Hola bot");

async function login(){
  let data = {username: "bot_1", password: "nwipre"};
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

async function combinar(){
  login();
  setTimeout(changeResourcesOptions, 500);
  //setTimeout(changePlanetName, 1000);
}

//login();
//logout();
//changePlanetName();

combinar();

console.log("Fin codigo");


/* Funciones a implementar:

  - login
  - logout
  - changePlanetName
  - abandonPlanet
  - infoPlayer
  - infoUniverso
  - infoGalaxy
  - changeResourcesOptions
  infoBuildings
  buildingRequest
  cancelBuilding
  infoBuildingsMoon
  buildingRequestMoon
  cancelBuildingMoon
  infoShips
  buildShips
  cancelShips
  infoDefenses
  buildDefenses
  cancelDefenses
  infoResearch
  buildResearch
  cancelResearch
  sendFleet
  returnFleet
  isSomeoneAttackingMe
  keepInfoAttack
  sendMessage
  deleteMessage
  changeOptions
  showTechnology
  showHighscore
  searchPlayer
  usePhalanx
  useJumpGate
  seeMarketMoon
  useMarketMoon
  changePassword

*/
