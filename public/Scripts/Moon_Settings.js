var selects = [];
var controls = [];
var open = [];
var values = [];
var marketInputs = [];
var marketButtons = [];
var inputsFleets, cantFleets;
var cuanticTimeText = null;
var cuanticTime = 0, valueMoon = -1;
var dropDownMoonOpen = false, ready = true;
var selectMoon, controlMoon;
var galaxyHasta, systemHasta, positionHasta;
var marketLevel;

setTimeout(() => {
  inputsFleets = document.getElementsByClassName('fleetValues');
  cantFleets = document.getElementsByClassName('level');
  cuanticTimeText = document.getElementById('cuanticTimeCont');
  galaxyHasta = parseInt(document.getElementsByName('ogame-planet-galaxy')[0].content);
  systemHasta = parseInt(document.getElementsByName('ogame-planet-system')[0].content);
  positionHasta = parseInt(document.getElementsByName('ogame-planet-position')[0].content);
  if(cuanticTimeText != null){
    cuanticTime = parseInt(cuanticTimeText.dataset.val);
    cuanticTime -= new Date().getTime();
    cuanticTime = Math.floor(cuanticTime / 1000);
    if(cuanticTime >= 0){
      cuanticTimeText.innerText = segundosATiempo(cuanticTime);
    }else{
      cuanticTimeText.innerText = 'Ready';
    }
  }
  for(let i = 1 ; i<=2 ; i++){
    selects.push(document.getElementById("dropdown" + i));
    controls.push(document.getElementById("downButton" + i));
    open.push(false);
    values.push(parseInt(selects[i-1].dataset.val));
    setDropdown(values[i-1]*10, i, true);
  }
  selectMoon = document.getElementById("dropdown3");
  controlMoon = document.getElementById("downButton3");
  for(let i = 0 ; i<cantFleets.length ; i++){
    if(cantFleets[i].innerText <= 0){
      inputsFleets[i].readOnly = true;
    }
  }
  marketLevel = document.getElementById("marketDiv").dataset.level;
  if(marketLevel > 0){
    marketInputs.push(document.getElementById("marketMetalInput"));
    marketInputs.push(document.getElementById("marketCrystalInput"));
    marketInputs.push(document.getElementById("marketDeuteriumInput"));
    marketButtons.push(document.getElementById("metalToCrystal"));
    marketButtons.push(document.getElementById("metalToDeuterium"));
    marketButtons.push(document.getElementById("crystalToMetal"));
    marketButtons.push(document.getElementById("crystalToDeuterium"));
    marketButtons.push(document.getElementById("deuteriumToMetal"));
    marketButtons.push(document.getElementById("deuteriumToCrystal"));
    for(let i = 0 ; i<marketInputs.length ; i++){
      marketInputs[i].value = '';
    }
  }
  if(cuanticTimeText != null && cuanticTime >= 0){
    setInterval(() => {
      cuanticTime--;
      if(cuanticTime >= 0){
        cuanticTimeText.innerText = segundosATiempo(cuanticTime);
      }else{
        cuanticTimeText.innerText = 'Ready';
      }
    }, 1000);
  }
}, 0);

function clickSelect(num){
  for(let i = 0 ; i<2 ; i++){
    if(i == num-1){
      if(open[i] == true){
        selects[i].style.display = "none";
      }else{
        selects[i].style.display = "block";
      }
      open[i] = !open[i];
    }else{
      if(open[i] == true){
        selects[i].style.display = "none";
        open[i] = false;
      }
    }
  }
}

function setDropdown(val, num, init = false){
  controls[num-1].innerText = val + "%";
  values[num-1] = val/10;
  if(val >= 70){
    controls[num-1].className = "undermark";//verde (undermark)
  }else{
    if(val >= 40){
      controls[num-1].className = "middlemark";//amarillo (middlemark)
    }else {
      controls[num-1].className = "overmark";//rojo (overmark)
    }
  }
  if(init == false) clickSelect(num);
}

function clickSelectMoon(){
  if(dropDownMoonOpen == true){
    selectMoon.style.display = "none";
  }else{
    selectMoon.style.display = "block";
  }
  dropDownMoonOpen = !dropDownMoonOpen;
}

function setDropdownMoon(val, text, gal, sys, pos){
  controlMoon.innerText = text;
  valueMoon = parseInt(val);
  galaxyHasta = gal;
  systemHasta = sys;
  positionHasta = pos;
  clickSelectMoon();
}

function selectAllNave(num){
  if(inputsFleets[num].readOnly == false){
    if(inputsFleets[num].value == cantFleets[num].innerText){
      inputsFleets[num].value = '';
    }else{
      inputsFleets[num].value = cantFleets[num].innerText;
    }
    changeFleet();
  }
}

function changeFleet(){
  for(let i = 0 ; i<inputsFleets.length ; i++){
    let aux = parseInt(inputsFleets[i].value);
    if(isNaN(aux) || aux < 0){// si el dato de entrada no es valido escribe un 0 en el input box
      if(aux != "") inputsFleets[i].value = "";
      aux = 0;
    }
    if(aux > cantFleets[i].innerText){ // si el numero ingresado es mayor al maximo entonces se carga el maximo valor
      inputsFleets[i].value = cantFleets[i].innerText;
      aux = parseInt(cantFleets[i].innerText);
    }
  }
}

function recalculateButton(){
  loadJSON('./api/set/updateResourcesMoon?sunshade=' + values[0] + '&beam=' + values[1], (obj) => {
    if(obj.ok == true) location.reload();
  });
}

async function sendCuanticFleet(){
  if(ready){
    ready = false;
    let data = {ships: {}};
    for(let i = 0 ; i<inputsFleets.length ; i++){
      data.ships[inputsFleets[i].name] = parseInt((inputsFleets[i].value == "") ? 0 : inputsFleets[i].value);
    }
    data.coorHasta = {gal: galaxyHasta, sys: systemHasta, pos: positionHasta};
    let res = await fetch('./api/set/moveCuanticFleet', {method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify(data)});
    let objRes = await res.json();
    ready = true;
    if(objRes.ok){
      location.reload();
    }else{
      sendPopUp(objRes.mes);
    }
  }
}

function vender(num){
  if(marketLevel > 0){
    let cantidad = marketInputs[Math.floor(num/2)].value;
    if(cantidad == "") cantidad = 0;
    loadJSON('./api/set/marketMoon?cantidad=' + cantidad + '&button=' + num, (obj) => {
      if(obj.ok == true){
        location.reload();
      }else{
        sendPopUp(obj.mes);
      }
    });
  }
}

function changeMercado(num){
  if(marketLevel > 0){
    if(marketInputs[num].value == "") marketInputs[num].value = ""; // value es igual a '' si hay algun caracter no numerico
    switch(num) {
    case 0: // Vendo metal
      if(marketInputs[num].value != "" && parseInt(marketInputs[num].value) > metal_res.innerHTML) marketInputs[num].value = metal_res.innerHTML;
      marketButtons[0].value = marketInputs[num].value == '' ? 0 : formatNumber(Math.floor(parseInt(marketInputs[num].value)*(2/3)*(9/10)));
      marketButtons[1].value = marketInputs[num].value == '' ? 0 : formatNumber(Math.floor(parseInt(marketInputs[num].value)/3*(9/10)));
      break;
    case 1: // Vendo Cristal
      if(marketInputs[num].value != "" && parseInt(marketInputs[num].value) > crystal_res.innerHTML) marketInputs[num].value = crystal_res.innerHTML;
      marketButtons[2].value = marketInputs[num].value == '' ? 0 : formatNumber(Math.floor(parseInt(marketInputs[num].value)*(3/2)*(9/10)));
      marketButtons[3].value = marketInputs[num].value == '' ? 0 : formatNumber(Math.floor(parseInt(marketInputs[num].value)/2*(9/10)));
      break;
    case 2: // Vendo deuterio
      if(marketInputs[num].value != "" && parseInt(marketInputs[num].value) > deuterium_res.innerHTML) marketInputs[num].value = deuterium_res.innerHTML;
      marketButtons[4].value = marketInputs[num].value == '' ? 0 : formatNumber(Math.floor(parseInt(marketInputs[num].value)*3*(9/10)));
      marketButtons[5].value = marketInputs[num].value == '' ? 0 : formatNumber(Math.floor(parseInt(marketInputs[num].value)*2*(9/10)));
    }
  }
}
