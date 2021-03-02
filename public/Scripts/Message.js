var fleetList = [], espList = [], universeList = [], otherList = [];
var buttonsType, conteinerList = [];
var original, listNode;
var type = 2; // enrealidad empieza en 1 apenas se cargan los mensajes

setTimeout(() => {
  original = document.getElementById('orginalMessage');
  listNode = document.getElementById('listNode');
  buttonsType = document.getElementsByClassName('buttonType');
  loadJSON('./api/readMessages', (obj) => {
    for(let i = 0 ; i<obj.list.length ; i++){
      switch (obj.list[i].type) {
        case 1:// fleet
          fleetList.push(obj.list[i]);
          break;
        case 2:// espionaje
          espList.push(obj.list[i]);
          break;
        case 3:// universe
          universeList.push(obj.list[i]);
          break;
        default:// other
          otherList.push(obj.list[i]);
      }
    }
    messageList = obj.list;
    changeTypeMessage(1, true);
  });
}, 0);

// Carga todos los mensages de ese tipo
function changeTypeMessage(num, act = false){
  if((num != type) || act){
    let auxList = [fleetList, espList, universeList, otherList][num-1];
    buttonsType[type-1].classList.remove('ui-tabs-active');
    buttonsType[num-1].classList.add('ui-tabs-active');
    type = num;
    let hasta = Math.max(auxList.length, conteinerList.length);
    let noMes = false;
    for(let i = 0 ; i<hasta ; i++){
      if(i < conteinerList.length){
        if(i < auxList.length){
          cargaData(conteinerList[i], auxList[i], i);
        }else{
          conteinerList[i].style.display = 'none'; // Apaga el conteiner
        }
      }else{
        let auxNode = original.cloneNode(true); // Crea un nuevo conteiner
        auxNode.id = "";
        auxNode.children[0].dataset.num = i;
        listNode.appendChild(auxNode);
        conteinerList.push(auxNode);
        cargaData(auxNode, auxList[i], i);
      }
    }
  }
}

function cargaData(conteiner, obj, num){
  // Pone la info de ese mensaje en ese conteiner
  console.log(obj.data);
  console.log(num);
  conteiner.children[1].innerHTML = obj.title;
  conteiner.children[2].innerHTML = obj.date;
  let text = '';
  switch (type) {
    case 1: // fleet
      text = JSON.stringify(obj.data);
      /* Muestro el informe de batalla bien */
      break;
    case 2: // espionaje

      // Muestro la informacion de espionaje
      text = obj.data.playerName + " (" + obj.data.planetName + ") <a href='./Ogame_Galaxy.html?gal=" + obj.data.coor.gal + "&sys=" + obj.data.coor.sys + "'>" + coorToCorch(obj.data.coor) + "</a>";
      text += "<br> <pre>Metal: " + Math.floor(obj.data.resources.metal) +
             "     Crystal: " + Math.floor(obj.data.resources.crystal) +
             "     Deuterium: " + Math.floor(obj.data.resources.deuterium) +
             "     Energy: " + Math.floor(obj.data.resources.energy) + "</pre>";
      if(obj.data.fleet != undefined){
        text += " <br> <pre>Fleet: " + cantObj(obj.data.fleet);
        if(obj.data.defense != undefined){
          text += "     Defenses: " + cantObj(obj.data.defense);
        }
        text += "</pre>";
      }
      // Pongo los botones para atacar
      text += "<input type='button' value='Small(" + getCantShips(obj.data.resources, 5000) + ")' onClick='sendCargos(" + getCantShips(obj.data.resources, 5000) + ", true)'/>" +
              "<input type='button' value='Large(" + getCantShips(obj.data.resources, 25000) + ")' onClick='sendCargos(" + getCantShips(obj.data.resources, 25000) + ", false)' />" +
              "<input type='button' value='Attack' onClick='attackCustom(" + obj.data.coor.gal + ", " + obj.data.coor.sys + ", " + obj.data.coor.pos + ")' />" +
              "<input type='button' value='See Report' onClick='seeCompleteReport(" + num + ")'/>";
      break;
    default:
      text = obj.text;
  }
  conteiner.children[3].innerHTML = text;
  conteiner.style.display = 'block';
}

function seeCompleteReport(num){
  console.log(espList[num]);
}

function sendCargos(cant, small){
  /* Completar esta funcion */
  console.log("Mando: " + cant + " de naves " + small);
}

function attackCustom(gal, sys, pos){
  window.location.href = './Ogame_Fleet.html?gal=' + gal + '&sys=' + sys + '&pos=' + pos;
}

function cantObj(obj){
  let res = 0;
  for(let item in obj){
    res += obj[item];
  }
  return res;
}

function getCantShips(resources, cargo){
  let total = resources.metal + resources.crystal + resources.deuterium;
  return Math.ceil(total / cargo);
}

function deleteMessage(obj){
  let num = obj.dataset.num;
  let auxList = [fleetList, espList, universeList, otherList][type-1];
  loadJSON('./api/set/deleteMessages?all=false&id=' + auxList[num].date, (obj) => {
    console.log("Elimino uno solo.");
  });
  auxList.splice(num, 1);
  changeTypeMessage(type, true);
}

function deleteAllMessage(){
  switch (type) {
    case 1:// fleet
      fleetList = [];
      break;
    case 2:// espionaje
      espList = [];
      break;
    case 3:// universe
      universeList = [];
      break;
    default:// other
      otherList = [];
  }
  for(let i = 0 ; i<conteinerList.length ; i++){
    conteinerList[i].style.display = 'none';
  }
  loadJSON('./api/set/deleteMessages?all=true&id=' + type, (obj) => {
    console.log("Elimino todo.");
  });
}
