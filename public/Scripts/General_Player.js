//Script que usa toda pagina del juego. Contiene funciones varis de uso general
var metal_res, crystal_res, deuterium_res, clock;
var metal = 0, crystal = 0, deuterium = 0;
var nextFleetText, missionText, fleetTime;
var popUp, popUpText, yesNoPopUp, yesNoPopUpText;
var tickDiv;
var playerActualName;

function initFunction(obj){ // Funcion que se ejecuta apenas carga un pagina
  clock = document.getElementById("Clock");
  popUp = document.getElementById("PopUpDiv");
  popUpText = document.getElementById("PopUpText");
  yesNoPopUp = document.getElementById("YesNoPopUpDiv");
  yesNoPopUpText = document.getElementById("YesNoPopUpText");
  nextFleetText = document.getElementById("fleetInfoFirstMovementDown");
  tickDiv = document.getElementById("TickDiv");
  metal_res = document.getElementById("resources_metal");
  crystal_res = document.getElementById("resources_crystal");
  deuterium_res = document.getElementById("resources_deuterium");
  metal = Math.floor(parseInt(document.getElementsByName('ogame-add-metal')[0].content));
  crystal = Math.floor(parseInt(document.getElementsByName('ogame-add-crystal')[0].content));
  deuterium = Math.floor(parseInt(document.getElementsByName('ogame-add-deuterium')[0].content));
  playerActualName = document.getElementsByName('ogame-player-name')[0].content;
  if(nextFleetText != null){
    fleetTime = Math.ceil((parseInt(nextFleetText.dataset.time) - new Date().getTime()) / 1000);
    missionText = nextFleetText.innerHTML.slice(7);
    nextFleetText.dataset.mission = missionText;
  }
  actualizaFecha();
  setInterval(() => {
    actualizaFecha();
    if(nextFleetText != null) actualizaFleet();
  }, 1000);
}

function actualizaFleet(){
  fleetTime -= 1;
  nextFleetText.innerText = "Next: " + segundosATiempo(fleetTime) + missionText;
  if(nextFleetText.innerText[nextFleetText.innerText.length-1] == ']'){ // Soluciona el error de '[object HTMLSpanElement]'
    nextFleetText.innerText = "Next: " + segundosATiempo(fleetTime) + nextFleetText.dataset.mission;
    missionText = nextFleetText.dataset.mission;
  }
  // if(fleetTime < 0) location.reload();
}

function actualizaFecha(){ // Se ejecuta cada un segunda y updatea el reloj de la esquina derecha
  let fecha = new Date();
  clock.innerHTML = fecha.getDate() + "." + (fecha.getMonth()+1) + "." + fecha.getFullYear() + " " + ((fecha.getHours() < 10) ? ('0'+fecha.getHours()) : (fecha.getHours())) + ":" + ((fecha.getMinutes() < 10) ? ('0'+fecha.getMinutes()) : (fecha.getMinutes())) + ":" + ((fecha.getSeconds() < 10) ? ('0'+fecha.getSeconds()) : (fecha.getSeconds()));
}

function segundosATiempo(seg){ // Dado un numero de segundos le da el formato tiempo (x dias n horas m minutos s segundos) xd nh mm ss
  if(!isFinite(seg) || isNaN(seg) || seg < 0) return " unknown";
  let time = (seg%60) + "s";
  seg = Math.floor(seg/60);
  if(seg != 0){
    time = (seg%60) + "m " + time;
    seg = Math.floor(seg/60);
    if(seg != 0){
      time = (seg%24) + "h " + time;
      seg = Math.floor(seg/24);
      if(seg != 0) time = seg + "d " + time;
    }
  }
  return " " + time;
}

function setOptions(){ // funcion que utiliza la pagina Opcions.html para comunicarse con la api
  let esp = document.getElementById('inputEspionage').value;
  let small = document.getElementById('inputSmall').value;
  let large = document.getElementById('inputLarge').value;
  loadJSON('./api/set/setOptions?esp=' + esp + '&sml=' + small + '&lar=' + large, (obj) => {
    if(obj.ok == true){
      location.reload(); //actualiza la pagina si todo salio bien
    }else{
      sendPopUp(obj.mes);
    }
  });
}

function formatNumber (num) { // apartir de un numero te lo pasa al formato lindo. Cada tres digitos pone un punto y respeta el signo de la entrada
  let res = num;
  let sign = Math.sign(num);
  if(isFinite(num)){
    res = '';
    num = Math.abs(num);
    while(num > 999){
      res = '.' + completaDigitos(num%1000) + res;
      num = Math.floor(num / 1000);
    }
    res = num + res;
    if(sign == -1) res = '-' + res;
  }
  return res;
}

function completaDigitos (inn) { // apartir de un numero string si tiene 2 caracteres o meno te lo rellena con 0 adelante hasta tener un string de 3 caracteres. Si tiene mas de 2 caracteres te devuelve el string igual
  let result = inn;
  if(inn < 100){
    result = '0' + inn;
    if(inn < 10){
      result = '00' + inn;
      if(inn <= 0) result = '000';
    }
  }
  return result;
}

function sendPopUp(message, time = 3000){ // Aparece un mensage pop up por 3s que dice el texto message
  popUp.style.display = "block";
  popUp.classList.add("popUpActive");
  popUpText.innerText = message;
  setTimeout(() => {
    popUp.style.display = "none";
    popUp.classList.remove("popUpActive");
  }, time);
}

function sendYesNoPopUp(message, yesFunction, noFunction){
  yesNoPopUp.style.display = "block";
  yesNoPopUp.classList.remove("popUpClose");
  yesNoPopUp.classList.add("popUpActive");
  yesNoPopUpText.innerText = message;
  document.getElementById("PopUpYesA").onclick = () => {
    closeYesNoPopUp();
    yesFunction();
  };
  document.getElementById("PopUpNoA").onclick = () => {
    closeYesNoPopUp();
    noFunction();
  };
}

function closeYesNoPopUp(){
  yesNoPopUp.classList.remove("popUpActive");
  yesNoPopUp.classList.add("popUpClose");
}

function sendTick(){
  let elem = document.createElement("Div");
  tickDiv.appendChild(elem);
  elem.classList.add("tickDiv");
  let elemChild = document.createElement("Div")
  elemChild.innerText = 'L';
  elem.appendChild(elemChild);
  setTimeout(() => {
    tickDiv.removeChild(elem);
  }, 1000);
}

function abandonPlanetFunction(){
  let im = document.getElementById("renameInput");
  sendYesNoPopUp("Seguro que queres abandonar el planeta?",
    () => {   // Yes function
      loadJSON('./api/set/abandonPlanet?confirm=Yes', (obj) => {
        if(obj.ok == true){
          location.reload(); //actualiza la pagina si todo salio bien
        }else{
          sendPopUp(obj.mes);
        }
      });
    }, () => {});// No function
}

function renamePlanet(){
  if(document.getElementById("renameInput").value.length <= 23){
    window.location.href = "./Ogame_Overview.html?newName=" + document.getElementById("renameInput").value;
  }else{
    console.log(document.getElementById("renameInput").value.length);
    sendPopUp("El nuevo nombre debe tener menos de 23 caracteres.");
  }
}

function zeroFleet(){
  return {lightFighter:  0,
         heavyFighter:   0,
         cruiser:        0,
         battleship:     0,
         battlecruiser:  0,
         bomber:         0,
         destroyer:      0,
         deathstar:      0,
         smallCargo:     0,
         largeCargo:     0,
         colony:         0,
         recycler:       0,
         espionageProbe: 0,
         misil:          0};
}

/*<div id="attack_alert" class="tooltip eventToggle soon" title="">
              <a href="https://s163-en.ogame.gameforge.com/game/index.php?page=eventList"></a>
                            </div>*/
