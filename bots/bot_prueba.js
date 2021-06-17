const fetch = require('node-fetch');
var token = "";
var id = ""

console.log("Hola bot");

async function login(){
  let data = {username: "bot_1", password: "nwipre"};
  let res = await fetch('http://localhost:3000/bot/login', {method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify(data)});
  res = await res.json();
  id = res.id;
  console.log(res);
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

async function combinar(){
  login();
  setTimeout(logout, 1000);
  //setTimeout(changePlanetName, 1000);
}

//login();
//logout();
//changePlanetName();

combinar();

console.log("Fin codigo");


/* Funciones a implementar:

  createNewUser
  login
  logout
  changePlanetName





*/
