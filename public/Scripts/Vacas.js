var sendEspionage, sendSmall, sendLarge;
var ready = false;

setTimeout(() => {
  sendEspionage = parseInt(document.getElementsByName('ogame-espionage')[0].content);
  sendSmall = parseInt(document.getElementsByName('ogame-small-cargos')[0].content);
  sendLarge = parseInt(document.getElementsByName('ogame-large-cargos')[0].content);
  ready = true;
}, 0);

function removeVaca(own, gal, sys, pos){ // funcion utilizada para eliminar una vaca de la lista de vacas del jugador logeado
  loadJSON('./api/set/addVaca?coor={"gal":' + gal + ',"sys":' + sys + ',"pos":' + pos + '}', (obj) => {
    if(obj.ok){
      own.parentElement.parentElement.style.display = 'none';
    }else{
      sendPopUp(obj.mes);
    }
  });
}

async function sendEspionageFun(gal, sys, pos){
  if(ready){
    let data = {};
    ready = false;
    data.ships = zeroFleet();
    data.ships.espionageProbe = sendEspionage;
    data.coorDesde = {gal: parseInt(document.getElementsByName('ogame-planet-galaxy')[0].content),
                      sys: parseInt(document.getElementsByName('ogame-planet-system')[0].content),
                      pos: parseInt(document.getElementsByName('ogame-planet-position')[0].content)};
    data.coorHasta = {gal: gal, sys: sys, pos: pos};
    data.destination = 1; // 1 = planeta, 2 = moon, 3 = debris
    data.porce = 10;
    data.mission = 5;
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

function personalAttack(gal, sys, pos){
  window.location.href = './Ogame_Fleet.html?gal=' + gal + '&sys=' + sys + '&pos=' + pos + '&mis=7';
}

async function vacaAttack(gal, sys, pos, small){
  if(ready){
    let data = {};
    ready = false;
    data.ships = zeroFleet();
    if(small){
      data.ships.smallCargo = sendSmall;
    }else{
      data.ships.largeCargo = sendLarge;
    }

    data.coorDesde = {gal: parseInt(document.getElementsByName('ogame-planet-galaxy')[0].content),
                      sys: parseInt(document.getElementsByName('ogame-planet-system')[0].content),
                      pos: parseInt(document.getElementsByName('ogame-planet-position')[0].content)};

    data.coorHasta = {gal: gal, sys: sys, pos: pos};
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

function goToPlayerOverview(name){
  window.location = './Change.html?name=' + name;
}
