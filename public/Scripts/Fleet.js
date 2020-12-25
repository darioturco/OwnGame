const cargaList = [50,100,800,1500,750,500,2000,1000000,5000,25000,7500,20000,0,0];
const deuteriumList = [10, 20, 150, 250, 120, 500, 500, 1, 5, 25, 500, 150, 0, 0];
/*cazador ligero | casadorpesado | cruzero | nave de batalla | acorazado | bombardero | destructor | estrella de la muerte | nave pequenia de carga | nave grande de carga | colonizador | resiclador | sonde de espionage | misil*/
const missionNameList = [' Expedition', ' Colonisation', ' Recycle', ' Transport', ' Deployment', ' Espionage', ' Misil', ' Attack', ' Moon Destruction'];
const missionDescriptionList = ['Send your ships into the final frontier of space to encounter thrilling quests.', 'Colonizes a new planet.', 'Send your recyclers to a debris field to collect the resources floating around there.', 'Transports your resources to other planets.', 'Sends your fleet permanently to another planet.', 'Spy the worlds of foreign emperors.', 'Destroy the defenses of other planets with misils.', 'Attacks the fleet and defence of your opponent.', 'Destroys the moon of your enemy.'];
var inputsFleets, cantFleets, speeds, cargeInputs, buttonsMision;
var targetPlanetName, destinationImgPlanet, destinationImgMoon, destinationImgDebris, cargeBar;
var distanceText, cargaText, durationText, arrivalText, returnText, speedText, consumText, cargeResources, cargeResourcesMax, missionText, missionDescriptionText;
var galaxy, system, position, destination = 1, speedActive = 10, dis = 5, minSpeed = 0, time = Infinity, missionSelected = -1;
var galVal, sysVal, posVal;
var selects = [], open = [], controls = [];
var systemDonut, galaxyDonut, fleetUniverseSpeed;
var ready = true;

setTimeout(() => {
  inputsFleets = document.getElementsByClassName('fleetValues');
  cantFleets = document.getElementsByClassName('level');
  speeds = document.getElementsByClassName('speed');
  cargeInputs = document.getElementsByClassName('inputCarge');
  buttonsMision = document.getElementsByClassName('ButtonMision');
  targetPlanetName = document.getElementById('targetPlanetName');
  destinationImgPlanet = document.getElementById('pbutton');
  destinationImgMoon = document.getElementById('mbutton');
  destinationImgDebris = document.getElementById('dbutton');
  distanceText = document.getElementById('distanceValue');
  durationText = document.getElementById('durationTime');
  arrivalText = document.getElementById('arrivalTime');
  returnText = document.getElementById('returnTime');
  cargaText = document.getElementById('storage');
  speedText = document.getElementById('speedText');
  missionText = document.getElementById('missionName');
  missionDescriptionText = document.getElementById('missionDescription');
  cargeResources = document.getElementById('remainingresources');
  cargeResourcesMax = document.getElementById('maxresources');
  cargeBar = document.getElementById('cargeBar');
  consumText = document.getElementById('consumptionDeuterium');
  galVal = document.getElementById('galaxy');
  sysVal = document.getElementById('system');
  posVal = document.getElementById('position');
  galaxy = parseInt(document.getElementsByName('ogame-planet-galaxy')[0].content);
  system = parseInt(document.getElementsByName('ogame-planet-system')[0].content);
  position = parseInt(document.getElementsByName('ogame-planet-position')[0].content);
  fleetUniverseSpeed = parseInt(document.getElementsByName('ogame-universe-speed-fleet')[0].content);
  galaxyDonut = ('true' == document.getElementsByName('ogame-donut-galaxy')[0].content);
  systemDonut = ('true' == document.getElementsByName('ogame-donut-system')[0].content);
  let missionAux = parseInt(missionText.dataset.mis);
  if(missionAux != -1 && missionAux < 9) pressButtonMision(missionAux);
  pressPlanetMoonDebris(parseInt(destinationImgPlanet.dataset.des));
  for(let i = 0 ; i<cantFleets.length ; i++){
    inputsFleets[i].value = '';
    if(cantFleets[i].innerText <= 0){
      inputsFleets[i].readOnly = true;
    }
  }
  for(let i = 1 ; i<=3 ; i++){
    selects.push(document.getElementById("dropdown" + i));
    controls.push(document.getElementById("downButton" + i));
    open.push(false);
  }
}, 0);

function clickSelect(num){
  for(let i = 0 ; i<4 ; i++){
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
  calculaDistancia();
}

function setDropdown(val, num, init = false){
  galVal.value = val.dataset.gal;
  sysVal.value = val.dataset.sys;
  posVal.value = val.dataset.pos;
  for(let i = 0 ; i<3 ; i++){
    if(i == (num-1)){
      controls[i].innerText = val.innerText;
    }else{
      controls[i].innerText = '-';
    }
  }
  if(init == false) clickSelect(num);
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

function pressPlanetMoonDebris(cla){
  destination = cla;
  if(cla == 1){
    targetPlanetName.innerText = 'Planet';
    destinationImgPlanet.classList.add('planet_selected');
    destinationImgMoon.classList.remove('moon_selected');
    destinationImgDebris.classList.remove('debris_selected');
    destinationImgMoon.classList.add('moon');
    destinationImgDebris.classList.add('debris');
  }else{
    if(cla == 2){
      targetPlanetName.innerHTML = 'Moon';
      destinationImgMoon.classList.add('moon_selected');
      destinationImgPlanet.classList.remove('planet_selected');
      destinationImgDebris.classList.remove('debris_selected');
      destinationImgPlanet.classList.add('planet');
      destinationImgDebris.classList.add('debris');
    }else{
      targetPlanetName.innerHTML = 'Debris';
      destinationImgDebris.classList.add('debris_selected');
      destinationImgPlanet.classList.remove('planet_selected');
      destinationImgMoon.classList.remove('moon_selected');
      destinationImgPlanet.classList.add('planet');
      destinationImgMoon.classList.add('moon');
    }
  }
  changeButtonMision();//cambia las misiones
}

function calculaDistancia(){//distancia desde {gal, sys, pos} hasta {galaxy, system, position}(posicion actual)
  if(galVal.value < 1) galVal.value = 1;
  if(sysVal.value < 1) sysVal.value = 1;
  if(posVal.value < 1) posVal.value = 1;
  if(galVal.value > 9) galVal.value = 9;
  if(sysVal.value > 499) sysVal.value = 499;
  if(posVal.value > 17) posVal.value = 16;
  let gal = parseInt(galVal.value);
  let sys = parseInt(sysVal.value);
  let pos = parseInt(posVal.value);
  if(gal == galaxy){
    if(sys == system){
      if(pos == position){
        dis = 5;//mismas cordenadas
      }else{
        dis = 1000 + 5*Math.abs(pos - position);//mismo systema y galaxia
      }
    }else{
      if(systemDonut == true){
        dis = Math.min(2700 + 95*Math.abs(sys - system), 2700 + 95*Math.abs(sys - system - 499),  2700 + 95*Math.abs(sys - system + 499));
      }else{
        dis = 2700 + 95*Math.abs(sys - system);
      }
    }
  }else{
    if(galaxyDonut == true){
      dis = Math.min(20000 * Math.abs(gal - galaxy), 20000 * Math.abs(gal - galaxy - 9),  20000 * Math.abs(gal - galaxy + 9));
    }else{
      dis = 20000 * Math.abs(gal - galaxy);
    }
  }
  distanceText.innerText = dis;
  updateSpeedPanel();//actualiza los datos
  changeButtonMision();//cambia las misiones
}

function changeSpeed(num){
  speeds[speedActive-1].classList.remove('selected');
  speeds[num-1].classList.add('selected');
  speedActive = num;
  updateSpeedPanel();//actualiza los datos
}

function changeFleet(){
  let newMin = Infinity;
  let carga = 0;
  let consumDeu = 0;
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
    carga += aux*cargaList[i]; // suma a la carga total de la flota
    consumDeu += Math.floor(aux*deuteriumList[i]*dis*Math.pow(0.7+speedActive/100,2)/40000); // suma al consumo de deuterio
    if(aux > 0 && parseInt(inputsFleets[i].dataset.vel) < newMin) newMin = parseInt(inputsFleets[i].dataset.vel); // busca la nave mas lenta para calcular la velocidad del viaje
  }
  if(newMin == Infinity) newMin = 0;
  minSpeed = newMin;
  speedText.innerText = minSpeed;
  consumText.innerText = consumDeu + ' (' + (Math.floor(consumDeu*100/((carga > 0) ? carga : 1))) + '%)';
  cargaText.innerText = carga;
  cargeResourcesMax.innerText = carga;
  clearAllResourcesFunction();
  updateSpeedPanel();   // Actualiza los datos
  changeButtonMision(); // Cambia las misiones
}

function updateSpeedPanel(){
  let fechaFleet, consumDeu = 0;
  dis = parseInt(distanceText.innerText);
  if(isNaN(dis)) dis = 0;
  time = Math.ceil((10+(35000/speedActive)*Math.sqrt(10*dis/minSpeed))/fleetUniverseSpeed);
  if(isFinite(time)){
    durationText.innerText = segundosATiempo(time);
    fechaFleet = new Date(new Date().getTime() + time*1000);
    arrivalText.innerText = fechaFleet.getDate() + "." + (fechaFleet.getMonth()+1) + "." + fechaFleet.getFullYear() + " " + ((fechaFleet.getHours() < 10) ? ('0'+fechaFleet.getHours()) : (fechaFleet.getHours())) + ":" + ((fechaFleet.getMinutes() < 10) ? ('0'+fechaFleet.getMinutes()) : (fechaFleet.getMinutes())) + ":" + ((fechaFleet.getSeconds() < 10) ? ('0'+fechaFleet.getSeconds()) : (fechaFleet.getSeconds()));
    fechaFleet = new Date(new Date().getTime() + time*2000);
    returnText.innerText = fechaFleet.getDate() + "." + (fechaFleet.getMonth()+1) + "." + fechaFleet.getFullYear() + " " + ((fechaFleet.getHours() < 10) ? ('0'+fechaFleet.getHours()) : (fechaFleet.getHours())) + ":" + ((fechaFleet.getMinutes() < 10) ? ('0'+fechaFleet.getMinutes()) : (fechaFleet.getMinutes())) + ":" + ((fechaFleet.getSeconds() < 10) ? ('0'+fechaFleet.getSeconds()) : (fechaFleet.getSeconds()));
  }else{
    durationText.innerText = '-';
    arrivalText.innerText = '-';
    returnText.innerText = '-';
  }
  for(let i = 0 ; i<inputsFleets.length ; i++){ // Updatea el consumo de deuterio
    let aux = parseInt(inputsFleets[i].value);
    if(isNaN(aux)) aux = 0;
    consumDeu += Math.floor(aux*deuteriumList[i]*dis*Math.pow(0.68+speedActive/100,2)/40000);
  };
  consumText.innerText = consumDeu + ' (' + (Math.floor(consumDeu*100/((parseInt(cargaText.innerText) > 0) ? parseInt(cargaText.innerText) : 1))) + '%)';
}

function changeResourcesInputFunction(num){
  let suma = 0;
  let listAux = [parseInt(metal_res.innerText), parseInt(crystal_res.innerText), parseInt(deuterium_res.innerText)];
  if(cargeInputs[num].value < 0) cargeInputs[num].value = 0;
  if(cargeInputs[num].value > listAux[num]) cargeInputs[num].value = listAux[num];
  for(let i = 0 ; i<3 ; i++){
    suma += parseInt(cargeInputs[i].value);
  }
  if(suma > parseInt(cargeResourcesMax.innerText)){
    suma -= cargeInputs[num].value;
    cargeInputs[num].value = parseInt(cargeResourcesMax.innerText) - suma;
    suma = cargeResourcesMax.innerText;
  }
  cargeResources.innerText = suma;
  if(suma <= 0){
    cargeBar.style.width = '0%';
  }else{
    cargeBar.style.width = Math.floor(100*cargeResources.innerText/cargeResourcesMax.innerText)+'%';
  }
}

function cargeResourcesFunction(all, num){
  let suma = 0;
  if(all == true){
    let maxCarge = 0;//todos los recursos que pueda poner
    let listAux = [parseInt(metal_res.innerText), parseInt(crystal_res.innerText), parseInt(deuterium_res.innerText)];
    for(let i = 0 ; i<3 ; i++){
      if(i != num) suma += parseInt(cargeInputs[i].value);
    }
    maxCarge = Math.min(parseInt(cargeResourcesMax.innerText) - suma, listAux[num]);
    cargeInputs[num].value = maxCarge;
  }else{
    cargeInputs[num].value = 0;
  }
  suma = 0;
  for(let i = 0 ; i<3 ; i++){
    suma += parseInt(cargeInputs[i].value);
  }
  cargeResources.innerText = suma;
  if(suma <= 0){
    cargeBar.style.width = '0%';
  }else{
    cargeBar.style.width = Math.floor(100*cargeResources.innerText/cargeResourcesMax.innerText)+'%';
  }
}

function cargeAllResourcesFunction(){
  for(let i = 0 ; i<3 ; i++){
    cargeResourcesFunction(true, i);
  }
}

function focusInputFunction(num){
  if(parseInt(cargeInputs[num].value) == 0){
    cargeInputs[num].value = '';
  }
}

function focusOutFunction(num){
  if(cargeInputs[num].value == '' || parseInt(cargeInputs[num].value) < 0){
    cargeInputs[num].value = '0';
  }
}

function clearAllResourcesFunction(){
  cargeResources.innerText = 0;
  cargeBar.style.width = '0%';
  for(let i = 0 ; i<3 ; i++){
    cargeInputs[i].value = 0;
  }
}

function changeButtonMision(){
  let emptyFleet = true;
  for(let i = 0 ; i<inputsFleets.length && emptyFleet == true ; i++){
    let aux = parseInt(inputsFleets[i].value);
    if(isNaN(aux)) aux = 0;
    if(aux > 0) emptyFleet = false;
  }
  if(emptyFleet == true){//elimina el selected
    for(let i = 0 ; i<buttonsMision.length ; i++){
      buttonsMision[i].classList.add('off');
    }
  }else{
    prendeButtonMision(posVal.value == 16, 0); //expedicion
    if(galVal.value > 0 && sysVal.value > 0 && posVal.value > 0 && galVal.value < 16 && sysVal.value < 16 && posVal.value < 16){
      prendeButtonMision(inputsFleets[10].value > 0 && destination == 1, 1); //colonizacion
      prendeButtonMision(inputsFleets[11].value > 0 && destination == 3, 2); //reciclaje
      prendeButtonMision(destination != 3 && cargaText.innerText > 0, 3); //transporte
      prendeButtonMision(destination != 3, 4); //despliege
      prendeButtonMision(destination != 3 && inputsFleets[12].value > 0, 5); //espionaje
      prendeButtonMision(destination != 3 && inputsFleets[13].value > 0, 6); //misil
      prendeButtonMision(destination != 3, 7); //ataque
      prendeButtonMision(destination == 2 && inputsFleets[7].value > 0, 8); //destruir luna
    }else{
      for(let i = 1 ; i<=9 ; i++){
        prendeButtonMision(false, i);
      }
    }
  }
}

function prendeButtonMision(val, num){
  if(val == true){
    buttonsMision[num].classList.remove('off');
  }else{
    buttonsMision[num].classList.add('off');
  }
}

function pressButtonMision(num){
  if(num == missionSelected){
    buttonsMision[num].children[0].classList.remove('selected');
    missionSelected = -1;
    missionText.innerText = '';
    missionDescriptionText.innerText = '-';
  }else{
    if(missionSelected != -1) buttonsMision[missionSelected].children[0].classList.remove('selected')
    buttonsMision[num].children[0].classList.add('selected');
    missionText.innerText = missionNameList[num];
    missionDescriptionText.innerText = missionDescriptionList[num];
    missionSelected = num;
  }
}

async function sendFleetMovement(){
  if(ready){
    ready = false;
    let data = {};
    data.ships = {};
    for(let i = 0 ; i<inputsFleets.length ; i++){
      data.ships[inputsFleets[i].name] = (inputsFleets[i].value == "") ? 0 : parseInt(inputsFleets[i].value);
    }
    data.coorDesde = {gal: galaxy, sys: system, pos: position};
    data.coorHasta = {gal: parseInt(galVal.value), sys: parseInt(sysVal.value), pos: parseInt(posVal.value)};
    data.destination = destination; // 1 = planeta, 2 = moon, 3 = debris
    data.porce = speedActive;
    data.mission = missionSelected;
    data.resources = {metal: parseInt(cargeInputs[0].value), crystal: parseInt(cargeInputs[1].value), deuterium: parseInt(cargeInputs[2].value)};
    let res = await fetch('./api/set/addFleetMovement', {method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify(data)});
    let objRes = await res.json();
    ready = true;
    if(objRes.ok){
      location.reload();
    }else{
      sendPopUp(objRes.mes);
    }
  }
}
