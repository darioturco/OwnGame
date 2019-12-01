var fleetList = [], espList = [], universeList = [], otherList = [];
var buttonsType, conteinerList = [];
var original, listNode;
var type = 2; // enrealidad empieza en 1 apenas se cargan los mensajes

setTimeout(() => {
  original = document.getElementById('orginalMessage');
  listNode = document.getElementById('listNode');
  buttonsType = document.getElementsByClassName('buttonType');
  loadJSON('./api/set/readMessages', (obj) => {
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

function changeTypeMessage(num, act = false){//carga todos los mensages de ese tipo
  if((num != type) || (act == true)){
    let auxList = [fleetList, espList, universeList, otherList][num-1];
    buttonsType[type-1].classList.remove('ui-tabs-active');
    buttonsType[num-1].classList.add('ui-tabs-active');
    type = num;
    let hasta = Math.max(auxList.length, conteinerList.length);
    let noMes = false;
    for(let i = 0 ; i<hasta ; i++){
      if(i < conteinerList.length){
        if(i < auxList.length){
          cargaData(conteinerList[i], auxList[i]);
        }else{
          conteinerList[i].style.display = 'none'; //apaga el conteiner
        }
      }else{
        let auxNode = original.cloneNode(true);// crea un nuevo conteiner
        auxNode.id = "";
        auxNode.children[0].dataset.num = i;
        listNode.appendChild(auxNode);
        conteinerList.push(auxNode);
        cargaData(auxNode, auxList[i]);
      }
    }
  }
}

function cargaData(conteiner, obj){
  conteiner.children[1].innerHTML = obj.title;//pone la info de ese mensaje en ese conteiner
  conteiner.children[2].innerHTML = obj.date;
  conteiner.children[3].innerHTML = obj.text;
  conteiner.style.display = 'block';
}

function deleteMessage(obj){
  let num = obj.dataset.num;
  let auxList = [fleetList, espList, universeList, otherList][type-1];
  loadJSON('./api/set/deleteMessages?all=false&id='+auxList[num].date, (obj) => {console.log("Elimino uno solo.");});
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
  loadJSON('./api/set/deleteMessages?all=true&id='+type, (obj) => {console.log("Elimino todo.");});
}
