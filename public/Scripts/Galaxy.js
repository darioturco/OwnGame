var planets = [], estados = [], colonyImg = [], vacasButtons = [];
var galaxy = 1, system = 1;
var galaxyText, systemText;
var playerName, planetName, moons, debris, actions, colonized;
var debrisConteiner, debrisMetal, debrisCrystal, debrisNeed, debrisCord;
var moonContainer, moonSize, moonCord;
var debrisList;
var debrisActive = -1, moonActive = -1;
var sendEspionage, sendSmall, sendLarge;
var probeText, recyText, smallText, largeText, usedSlotsText;
var probe, recy, small, large, usedSlots, maxSlots;
var ready = false;

setTimeout(() => {
  moonConteiner = document.getElementById('canvasMoon');
  debrisConteiner = document.getElementById('canvasDebris');
  debrisMetal = document.getElementById('DebrisMetal');
  debrisCrystal = document.getElementById('DebrisCrystal');
  debrisNeed = document.getElementById('DebrisNeed');
  debrisCord = document.getElementById('DebrisCord');
  moonSize = document.getElementById('MoonSize');
  moonCord = document.getElementById('MoonCord');
  galaxyText = document.getElementById('galaxy_input');
  systemText = document.getElementById('system_input');
  colonized = document.getElementById('colonized');
  probeText = document.getElementById("probeValue");
  recyText = document.getElementById("recyclerValue");
  smallText = document.getElementById("smallValue");
  largeText = document.getElementById("largeValue");
  usedSlotsText = document.getElementById("slotValue");
  playerName = document.getElementsByClassName('status');
  planetName = document.getElementsByClassName('planetName');
  moons = document.getElementsByClassName('ListMoon');
  debris = document.getElementsByClassName('ListDebris');
  colonyImg = document.getElementsByClassName('colonyImg');
  actions = document.getElementsByClassName('action');
  vacasButtons = document.getElementsByClassName("icon_mail");
  sendEspionage = parseInt(document.getElementsByName('ogame-espionage')[0].content);
  sendSmall = parseInt(document.getElementsByName('ogame-small-cargos')[0].content);
  sendLarge = parseInt(document.getElementsByName('ogame-large-cargos')[0].content);
  probe = parseInt(probeText.dataset.value);
  recy = parseInt(recyText.dataset.value);
  small = parseInt(smallText.dataset.value);
  large = parseInt(largeText.dataset.value);
  usedSlots = parseInt(usedSlotsText.dataset.used);
  maxSlots = parseInt(usedSlotsText.dataset.max);
  for(let i = 1 ; i<=15 ; i++){
    planets.push(document.getElementById('Planet'+i));
  }
  document.onkeyup = function(tecla){
    if(tecla.key == 'Enter') loadSystem(parseInt(galaxyText.value), parseInt(systemText.value));
  };
  loadSystem(parseInt(galaxyText.value), parseInt(systemText.value));
  ready = true;
}, 0);

function loadSystem(gal, sys){
  if(gal < 0) gal = 0;
  if(gal > 9) gal = 9;
  if(sys < 0) sys = 0;
  if(sys > 499) sys = 499;
  galaxyText.value = gal;
  systemText.value = sys;
  galaxy = gal;
  system = sys;
  loadJSON('./api/galaxy?gal=' + gal + '&sys=' + sys, (obj) => {
    // console.log(obj);
    let cont = 0;
    debrisList = [];
    moonList = [];
    estados = [];
    pressMoon(-1);//apaga el cartel de la luna
    pressDebris(-1);//apaga el cartel de los escombros
    for(let i = 1 ; i<=15 ; i++){
      if(obj['pos'+i].active){    // Si es el plantea de la posicion i esta colonizado
        cont++;
        planets[i-1].src = './Imagenes/Planets/Miniatures/Planet_' + obj['pos'+i].type + '_' + obj['pos'+i].color + '_Mini.gif';
        playerName[i-1].innerHTML = obj['pos'+i].player + getEstado(obj['pos'+i].estado);
        //remover todas las posibles classes de estados
        playerName[i-1].classList.add(obj['pos'+i].estado);
        planetName[i-1].innerHTML = obj['pos'+i].name;
        colonyImg[i-1].style.display = 'none';
        if(obj['pos'+i].moon){
           moons[i-1].classList.add('activeMoon');
         }else{
           moons[i-1].classList.remove('activeMoon');
         }
        if(obj['pos'+i].debris){
          debris[i-1].classList.add('debrisField');
        }else{
          debris[i-1].classList.remove('debrisField');
        }
        if(playerActualName == obj['pos'+i].player){
          actions[i-1].style.display = 'none';
        }else{
          actions[i-1].style.display = 'block';
        }
        if(obj['pos'+i].esVaca){
          vacasButtons[i-1].classList.add("icon_mail_active");
        }else{
          vacasButtons[i-1].classList.remove("icon_mail_active");
        }
      }else{
        planets[i-1].src = './Imagenes/None.gif';
        playerName[i-1].innerHTML = '';
        planetName[i-1].innerHTML = '';
        colonyImg[i-1].style.display = 'inline';
        actions[i-1].style.display = 'none';
        moons[i-1].classList.remove('activeMoon');
        debris[i-1].classList.remove('debrisField');
      }
      estados.push(obj['pos'+i].estado);
      debrisList.push({debris: obj['pos'+i].debris, metal: obj['pos'+i].metalDebris, crystal: obj['pos'+i].crystalDebris});
      moonList.push({active: obj['pos'+i].moon, size: obj['pos'+i].moonSize, name: obj['pos'+i].moonName});
    }
    colonized.innerHTML = cont + " Planets colonised";
  });
}

function getEstado(est){
  res = "";
  if(est != 'activo') res = '(' + est[0] + ')';
  return res;
}

function pressMoon(num){
  if(moonActive == num){
    moonActive = -1;
    moonConteiner.style.display = 'none'; //cierra el div
  }else{
    moonActive = num;
    if(num >= 0){ //actualiza datos de la luna
      moonCord.innerHTML = '['+galaxy+':'+system+':'+num+']';
      moonSize.innerHTML = moonList[num-1].size + ' Km';
      moonConteiner.style.top = ((num-1)*33+76) + 'px';
      moonConteiner.style.display = 'block';
      debrisConteiner.style.display = 'none'; // cierra el div de debris
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
      debrisMetal.innerHTML = 'Metal: ' + formatNumber(debrisList[num-1].metal);
      debrisCrystal.innerHTML = 'Crystal: ' + formatNumber(debrisList[num-1].crystal);
      debrisNeed.innerHTML = 'Recyclers needed: ' + formatNumber(Math.ceil((debrisList[num-1].metal + debrisList[num-1].crystal)/20000));
      debrisCord.innerHTML = '['+galaxy+':'+system+':'+num+']';
      debrisConteiner.style.top = ((num-1)*33+76) + 'px';
      debrisConteiner.style.display = 'block';
      moonConteiner.style.display = 'none'; // cierra el div de moon
    }else{
      debrisConteiner.style.display = 'none';
    }
  }
}

function galaxyChange(add){
  let galaxyVal = parseInt(galaxyText.value) + add;
  if(galaxyVal > 9) galaxyVal = 1;
  if(galaxyVal < 1) galaxyVal = 9;
  galaxyText.value = galaxyVal;
}
function systemChange(add){
  let systemVal = parseInt(systemText.value) + add;
  if(systemVal > 499) systemVal = 1;
  if(systemVal < 1) systemVal = 499;
  systemText.value = systemVal;
}

function updatePanel(nave){
  usedSlots++;
  usedSlotsText.innerText = usedSlots + '/' + maxSlots;
  switch (nave) {
  case 0: // Espionage
    probeText.innerText = probe;
    break;
  case 1: // Recicladores
    recyText.innerText = recy;
    break;
  case 2: // Large Cargos
    largeText.innerText = large;
    break;
  case 3: // Small Cargos
    smallText.innerText = small;
    break;
  }
}

function pressGo(){
  loadSystem(parseInt(galaxyText.value), parseInt(systemText.value));
}

function doExpedition(){
  window.location.href = './Ogame_Fleet.html?gal=' + galaxy + '&sys=' + system + '&pos=16&mis=0';
}

function colonize(pos){
  window.location.href = './Ogame_Fleet.html?gal=' + galaxy + '&sys=' + system + '&pos=' + pos + '&mis=1';
}

function addVaca(pos){
  loadJSON('./api/set/addVaca?coor={"gal":' + galaxy + ',"sys":' + system + ',"pos":' + pos + '}&playerName=' + playerName[pos-1].innerText + '&planetName=' + planetName[pos-1].innerText + '&estado=' + estados[pos-1], (obj) => {
    if(obj.ok){
      if(obj.deleted){
        vacasButtons[pos-1].classList.remove("icon_mail_active");
      }else{
        vacasButtons[pos-1].classList.add("icon_mail_active");
      }
    }else{
      sendPopUp(obj.mes);
    }

  });
}

function getReport(num){
  console.log(num);
}

function goToPlayerOverview(num){
  if(playerName[num-1] != ''){
    window.location = './Change.html?name=' + playerName[num-1].innerHTML;
  }
}

async function sendToMine(){
  if(!(isNaN(parseInt(debrisActive)) || debrisActive < 0 || debrisActive > 15) && ready){
    if(usedSlots < maxSlots){
      if(recy > 0){
        let data = {};
        ready = false;
        let totalRecy = Math.min(debrisActive, Math.ceil((debrisList[debrisActive-1].metal + debrisList[debrisActive-1].crystal)/20000));
        data.ships = zeroFleet();
        data.ships.recycler = totalRecy;
        data.coorDesde = {gal: parseInt(document.getElementsByName('ogame-planet-galaxy')[0].content),
                          sys: parseInt(document.getElementsByName('ogame-planet-system')[0].content),
                          pos: parseInt(document.getElementsByName('ogame-planet-position')[0].content)};
        data.coorHasta = {gal: galaxy, sys: system, pos: debrisActive};
        data.destination = 3; // 1 = planeta, 2 = moon, 3 = debris
        data.porce = 10;
        data.mission = 2;
        data.resources = {metal: 0, crystal: 0, deuterium: 0};
        let res = await fetch('./api/set/addFleetMovement', {method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify(data)});
        let objRes = await res.json();
        ready = true;
        if(objRes.ok){
          recy -= totalRecy;
          updatePanel(1);
          sendTick();
        }else{
          sendPopUp(objRes.mes);
        }

      }else{
        sendPopUp("No hay recicladores para enviar.");
      }
    }else{
      sendPopUp("No hay espacio para mas flotas.");
    }
  }
}

async function sackFunction(num){
  if(!(isNaN(parseInt(num)) || num < 0 || num > 15) && ready){
    let data = {};
    ready = false;
    data.ships = zeroFleet();
    if(usedSlots < maxSlots){
      if(large >= sendLarge){
        data.ships.largeCargo = sendLarge;
        large -= sendLarge;
        updatePanel(2);
      }else if(small >= sendSmall){
        data.ships.smallCargo = sendSmall;
        small -= sendSmall;
        updatePanel(3);
      }else{
        sendPopUp("No hay suficientes naves de carga.");
        return;
      }
    }else{
      sendPopUp("No hay espacio para mas flotas.");
      return;
    }
    data.coorDesde = {gal: parseInt(document.getElementsByName('ogame-planet-galaxy')[0].content),
                      sys: parseInt(document.getElementsByName('ogame-planet-system')[0].content),
                      pos: parseInt(document.getElementsByName('ogame-planet-position')[0].content)};
    data.coorHasta = {gal: galaxy, sys: system, pos: num};
    data.destination = 1; // 1 = planeta, 2 = moon, 3 = debris
    data.porce = 10;
    data.mission = 7;
    data.resources = {metal: 0, crystal: 0, deuterium: 0};
    let res = await fetch('./api/set/addFleetMovement', {method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify(data)});
    let objRes = await res.json();
    ready = true;
    if(objRes.ok){
      sendTick();
    }else{
      sendPopUp(objRes.mes);
    }
  }
}

async function spyFunction(num, moon){
  if(!(isNaN(parseInt(num)) || num < 0 || num > 15) && ready){
    if(usedSlots < maxSlots){
      if(probe >= sendEspionage){
        let data = {};
        ready = false;
        data.ships = zeroFleet();
        data.ships.espionageProbe = sendEspionage;
        data.coorDesde = {gal: parseInt(document.getElementsByName('ogame-planet-galaxy')[0].content),
                          sys: parseInt(document.getElementsByName('ogame-planet-system')[0].content),
                          pos: parseInt(document.getElementsByName('ogame-planet-position')[0].content)};
        data.coorHasta = {gal: galaxy, sys: system, pos: num};
        data.destination = moon ? 2 : 1; // 1 = planeta, 2 = moon, 3 = debris
        data.porce = 10;
        data.mission = 5;
        data.resources = {metal: 0, crystal: 0, deuterium: 0};
        let res = await fetch('./api/set/addFleetMovement', {method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify(data)});
        let objRes = await res.json();
        ready = true;
        if(objRes.ok){
          probe -= sendEspionage;
          updatePanel(0);
          sendTick();
        }else{
          sendPopUp(objRes.mes);
        }
      }else{
        sendPopUp("No hay suficientes naves de carga.");
      }
    }else{
      sendPopUp("No hay espacio para mas flotas.");
    }
  }
}

async function usePhalanx(num){
  if(!(isNaN(parseInt(num)) || num < 0 || num > 15) && ready){
    ready = false;
    loadJSON('./api/usePhalanx?gal=' + galaxy + '&sys=' + system + '&pos=' + num, (objRes) => {
      ready = true;
      if(objRes.ok){
        /* Mustro el resultado del phalanxeo bien */
        console.log(objRes);
      }else{
        sendPopUp(objRes.mes);
      }
    });
  }else{
    sendPopUp("No se puede usar el phalanx en esa posicion.");
  }
}
