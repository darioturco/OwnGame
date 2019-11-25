var inputsFleets, cantFleets;
var destinationImgPlanet, destinationImgMoon, destinationImgDebris;

setTimeout(() => {
  inputsFleets = document.getElementsByClassName('fleetValues');
  cantFleets = document.getElementsByClassName('level');
  destinationImgPlanet = document.getElementById('pbutton');
  destinationImgMoon = document.getElementById('mbutton');
  destinationImgDebris = document.getElementById('dbutton');
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
  }
}

function pressPlanetMoonDebris(cla){
  if(cla == 1){
    destinationImgPlanet.classList.add('planet_selected');
    destinationImgMoon.classList.remove('moon_selected');
    destinationImgDebris.classList.remove('debris_selected');
    destinationImgMoon.classList.add('moon');
    destinationImgDebris.classList.add('debris');
  }else{
    if(cla == 2){
      destinationImgMoon.classList.add('moon_selected');
      destinationImgPlanet.classList.remove('planet_selected');
      destinationImgDebris.classList.remove('debris_selected');
      destinationImgPlanet.classList.add('planet');
      destinationImgDebris.classList.add('debris');
    }else{
      destinationImgDebris.classList.add('debris_selected');
      destinationImgPlanet.classList.remove('planet_selected');
      destinationImgMoon.classList.remove('moon_selected');
      destinationImgPlanet.classList.add('planet');
      destinationImgMoon.classList.add('moon');
    }
  }
}
