var planets = [];
var galaxy = 1, system = 1;
var playerName, planetName, moons, debris, actions;
var debrisConteiner, debrisMetal, debrisCrystal, debrisNeed, debrisCord;
var moonContainer;
var debrisList;
var debrisActive = -1, moonActive = -1;
setTimeout(() => {
  moonConteiner = document.getElementById('canvasMoon');
  debrisConteiner = document.getElementById('canvasDebris');
  debrisMetal = document.getElementById('DebrisMetal');
  debrisCrystal = document.getElementById('DebrisCrystal');
  debrisNeed = document.getElementById('DebrisNeed');
  debrisCord = document.getElementById('DebrisCord');
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
  galaxy = gal;
  system = sys;
  loadJSON('./api/galaxy?gal=' + gal + '&sys=' + sys, (obj) => {
    console.log(obj);
    debrisList = [];
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
      debrisList.push({debris: obj['pos'+i].debris, metal: obj['pos'+i].metalDebris, crystal: obj['pos'+i].crystalDebris});
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
  if(moonActive == num){
    moonActive = -1;
    moonConteiner.style.display = 'none';//cierra el div
  }else{
    moonActive = num;
    if(num >= 0){
      //actualiza datos de la luna
      moonConteiner.style.top = ((num-1)*33+76) + 'px';
      moonConteiner.style.display = 'block';
    }else{
      moonConteiner.style.display = 'none';
    }
  }
}

function pressDebris(num){
  if(debrisActive == num){
    debrisActive = -1;
    debrisConteiner.style.display = 'none';//cierra el div
  }else{
    debrisActive = num;
    if(num >= 0){
      debrisMetal.innerHTML = 'Metal: ' + debrisList[num-1].metal;
      debrisCrystal.innerHTML = 'Crystal: ' + debrisList[num-1].crystal;
      debrisNeed.innerHTML = 'Recyclers needed: ' + Math.ceil((debrisList[num-1].metal + debrisList[num-1].crystal)/20000);
      debrisCord.innerHTML = '['+galaxy+':'+system+':'+num+']';
      debrisConteiner.style.top = ((num-1)*33+76) + 'px';
      debrisConteiner.style.display = 'block';
    }else{
      debrisConteiner.style.display = 'none';
    }
  }
}
