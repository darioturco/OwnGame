var planets = [];
var playerName, planetName, moons, debris, actions;

setTimeout(() => {
  playerName = document.getElementsByClassName('status');
  planetName = document.getElementsByClassName('planetName');
  moons = document.getElementsByClassName('ListMoon');
  debris = document.getElementsByClassName('ListDebris');
  actions = document.getElementsByClassName('action');
  for(let i = 1 ; i<=15 ; i++){
    planets.push(document.getElementById('Planet'+i));
  }
  loadSystem(1,1);
}, 0);

function loadSystem(gal, sys){
  loadJSON('./api/galaxy?gal=' + gal + '&sys=' + sys, (obj) => {
    console.log(obj);
    for(let i = 1 ; i<=15 ; i++){
      if(obj['pos'+i].active == true){
        planets[i-1].src = './Imagenes/Planets/Miniatures/Planet_' + obj['pos'+i].type + '_' + obj['pos'+i].color + '_Mini.gif';
        playerName[i-1].innerHTML = obj['pos'+i].player + getEstado(obj['pos'+i].estado);
        //remover todas las posibles classes de estados
        playerName[i-1].classList.add(obj['pos'+i].estado);
        planetName[i-1].innerHTML = obj['pos'+i].name;
        actions[i-1].style.display = 'block';
        if(obj['pos'+i].moon == true) moons[i-1].classList.add('activeMoon');
        if(obj['pos'+i].debris == true) debris[i-1].classList.add('debrisField');
      }else{
        planets[i-1].src = '';
        playerName[i-1].innerHTML = '';
        planetName[i-1].innerHTML = '';
        actions[i-1].style.display = 'none';
        moons[i-1].classList.remove('activeMoon');
        debris[i-1].classList.remove('debrisField');
      }
    }
  });
}

function getEstado(est){
  res = "";
  if(est != 'activo') res = '(' + est[0] + ')';
  return res;
}

function doExpedition(){

}

function pressMoon(num){

}

function pressDebris(num){

}
