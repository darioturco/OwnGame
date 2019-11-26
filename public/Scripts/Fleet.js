const cargaList = [50,100,800,1500,750,500,2000,1000000,5000,25000,7500,20000,0,0];
var inputsFleets, cantFleets, speeds;
var targetPlanetName, destinationImgPlanet, destinationImgMoon, destinationImgDebris;
var distanceText, cargaText;
var galVal, sysVal, posVal;
var galaxy, system, position, speedActive = 10, dis = 5;
var systemDonut, galaxyDonut;
setTimeout(() => {
  inputsFleets = document.getElementsByClassName('fleetValues');
  cantFleets = document.getElementsByClassName('level');
  speeds = document.getElementsByClassName('speed');
  targetPlanetName = document.getElementById('targetPlanetName');
  destinationImgPlanet = document.getElementById('pbutton');
  destinationImgMoon = document.getElementById('mbutton');
  destinationImgDebris = document.getElementById('dbutton');
  distanceText = document.getElementById('distanceValue');
  cargaText = document.getElementById('storage');
  galVal = document.getElementById('galaxy');
  sysVal = document.getElementById('system');
  posVal = document.getElementById('position');
  galaxy = parseInt(document.getElementsByName('ogame-planet-galaxy')[0].content);
  system = parseInt(document.getElementsByName('ogame-planet-system')[0].content);
  position = parseInt(document.getElementsByName('ogame-planet-position')[0].content);
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
}

function changeSpeed(num){
  speeds[speedActive-1].classList.remove('selected');
  speeds[num-1].classList.add('selected');
  speedActive = num;
  //actualiza los datos
}

function changeFleet(){
  let carga = 0;
  for(let i = 0 ; i<inputsFleets.length ; i++){
    let aux = parseInt(inputsFleets[i].value);
    if(isNaN(aux)) aux = 0;
    carga += aux*cargaList[i];
  };
  cargaText.innerText = carga;
}
