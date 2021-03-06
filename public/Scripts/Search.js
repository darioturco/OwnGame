var inputIn;
var rows, playerSearch, planetSearch, coorSearch, coordinatesLink;
var withInfo;
var objInfo = undefined;
var sendEspionage, sendSmall, sendLarge;
var ready = false;

setTimeout(() => {
  inputIn = document.getElementById('inputSearchPlayer');
  rows = document.getElementsByClassName('rowSearch');
  playerSearch = document.getElementsByClassName('playerSearchText');
  planetSearch = document.getElementsByClassName('planetSearch');
  coorSearch = document.getElementsByClassName('coorSearch');
  coordinatesLink = document.getElementsByClassName('coordinatesLink');
  sendEspionage = parseInt(document.getElementsByName('ogame-espionage')[0].content);
  sendSmall = parseInt(document.getElementsByName('ogame-small-cargos')[0].content);
  sendLarge = parseInt(document.getElementsByName('ogame-large-cargos')[0].content);
  withInfo = false;
  document.onkeyup = function(tecla){
    if(tecla.key == 'Enter') setSearch();
  };
}, 0);

function setSearch(){
  let playerName = inputIn.value;
  loadJSON('./api/searchPlayer?name=' + playerName, (obj) => {
    console.log(obj);
    if(obj.ok === true){
      withInfo = true;
      ready = true;
      objInfo = obj;
      for(let i = 0 ; i<8 ; i++){
        if(i < obj.names.length){
          rows[i].style.display = 'table-row';
          playerSearch[i].innerText = playerName;
          planetSearch[i].innerText = obj.names[i];
          coorSearch[i].innerText = '[' + obj.coors[i].gal + ':' + obj.coors[i].sys + ':' + obj.coors[i].pos + ']';
          coordinatesLink[i].href = './Ogame_Galaxy.html?gal=' + obj.coors[i].gal + '&sys=' + obj.coors[i].sys;
        }else{
          rows[i].style.display = 'none';
        }
      }
    }else{
      inputIn.value = "Not Found";
    }
  });
}

function goToPlayerOverview(){
  if(withInfo){
    window.location = './Change.html?name=' + playerSearch[0].innerText;
  }
}

function personalAttack(num){
  window.location.href = './Ogame_Fleet.html?gal=' + objInfo.coors[num].gal + '&sys=' + objInfo.coors[num].sys + '&pos=' + objInfo.coors[num].pos + '&mis=7';
}

async function vacaAttack(num, small){
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

    data.coorHasta = {gal: objInfo.coors[num].gal, sys: objInfo.coors[num].sys, pos: objInfo.coors[num].pos};
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

async function sendEspionageFun(num){
  if(ready){
    let data = {};
    ready = false;
    data.ships = zeroFleet();
    data.ships.espionageProbe = sendEspionage;
    data.coorDesde = {gal: parseInt(document.getElementsByName('ogame-planet-galaxy')[0].content),
                      sys: parseInt(document.getElementsByName('ogame-planet-system')[0].content),
                      pos: parseInt(document.getElementsByName('ogame-planet-position')[0].content)};
    data.coorHasta = {gal: objInfo.coors[num].gal, sys: objInfo.coors[num].sys, pos: objInfo.coors[num].pos};
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
