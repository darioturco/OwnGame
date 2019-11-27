const cargaList = [50,100,800,1500,750,500,2000,1000000,5000,25000,7500,20000,0,0];
const deuteriumList = [10, 20, 150, 250, 120, 500, 500, 1, 5, 25, 500, 150, 0, 0]
var inputsFleets, cantFleets, speeds, cargeInputs;
var targetPlanetName, destinationImgPlanet, destinationImgMoon, destinationImgDebris, cargeBar;
var distanceText, cargaText, durationText, arrivalText, returnText, speedText, consumText, cargeResources, cargeResourcesMax;
var galaxy, system, position, speedActive = 10, dis = 5, minSpeed = 0, time = Infinity;
var galVal, sysVal, posVal;
var systemDonut, galaxyDonut, fleetUniverseSpeed;
setTimeout(() => {
  inputsFleets = document.getElementsByClassName('fleetValues');
  cantFleets = document.getElementsByClassName('level');
  speeds = document.getElementsByClassName('speed');
  cargeInputs = document.getElementsByClassName('inputCarge');
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
  for(let i = 0 ; i<cantFleets.length ; i++){
    if(cantFleets[i].innerText <= 0){
      inputsFleets[i].readOnly = true;
    }
  }
}, 0);

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
}

function calculaDistancia(){//distancia desde {gal, sys, pos} hasta {galaxy, system, position}(posicion actual)
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
    if(isNaN(aux)) aux = 0;
    carga += aux*cargaList[i];
    consumDeu += Math.floor(aux*deuteriumList[i]*dis*Math.pow(1+speedActive/100,2)/40000);
    if(aux > 0 && inputsFleets[i].dataset.vel < newMin){
      newMin = inputsFleets[i].dataset.vel;
    }
  };
  if(newMin == Infinity) newMin = 0;
  minSpeed = parseInt(newMin);
  speedText.innerText = minSpeed;
  consumText.innerText = consumDeu + ' (' + (Math.floor(consumDeu*100/((carga > 0) ? carga : 1))) + '%)';
  cargaText.innerText = carga;
  cargeResourcesMax.innerText = carga;
  clearAllResourcesFunction();
  updateSpeedPanel();//actualiza los datos
}

function updateSpeedPanel(){
  let fechaFleet;
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
}

function changeResourcesInputFunction(num){
  let suma = 0;
  let listAux = [metal_res.innerText, crystal_res.innerText, deuterium_res.innerText];
  if(cargeInputs[num].value < 0) cargeInputs[num].value = 0;
  if(cargeInputs[num].value > listAux[num]) cargeInputs[num].value = listAux[num];
  for(let i = 0 ; i<3 ; i++){
    suma += parseInt(cargeInputs[i].value);
  }
  if(suma > cargeResourcesMax.innerText){
    suma -= cargeInputs[num].value;
    cargeInputs[num].value = cargeResourcesMax.innerText - suma;
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
    let listAux = [metal_res.innerText, crystal_res.innerText, deuterium_res.innerText];
    for(let i = 0 ; i<3 ; i++){
      if(i != num) suma += parseInt(cargeInputs[i].value);
    }
    maxCarge = Math.min(cargeResourcesMax.innerText - suma, listAux[num]);
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

function clearAllResourcesFunction(){
  cargeResources.innerText = 0;
  cargeBar.style.width = '0%';
  for(let i = 0 ; i<3 ; i++){
    cargeInputs[i].value = 0;
  }
}
