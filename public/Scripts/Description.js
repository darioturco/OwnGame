var toggle = "void", body = '';
var url = "./api/";
var colorImg = [];
var colorButton = null, cancelButton = null, inputCantConteiner = null;
var startImg = 0;
var container;
var universeSpeed = 0;
var level = "Number: ";
var info = undefined;
var size = "250";
var elementList = ["metal", "crystal", "deuterium", "energy"];
var inputCant = null, maxlink = null, contdownText = null;
var timeContdown = 0, contContdown = 0;
var max = 0;
var energy_res;
var doing = false, canPress = false, shipyard = false, inMoon = false;
var descriptionText, resourcesText, resourcesIcon, timeText, nameText, levelText, imgInfo, posibleText;
var firstShipName, unityDuration, totalDuration, firstLavel, firstImg, otherShips;

setTimeout(initial, 0);

function initial(){
  body = document.body.id;
  inMoon = (document.getElementsByName('ogame-moon')[0].content == 'true');
  universeSpeed = parseInt(document.getElementsByName('ogame-universe-speed')[0].content);
  if(body == "research") level = "Level: ";
  if(body == "shipyard" || body == "defense") shipyard = true;
  if(body == "resources" || body == "station"){
    if(body == "station" && inMoon == false) startImg = 9;
    size = "300";
    level = "Level: ";
  }
  container = document.getElementById("detail");
  descriptionText = document.getElementById("descriptionText");
  colorImg = document.getElementsByClassName('on');
  resourcesIcon = document.getElementsByClassName('descriptionIcon');
  resourcesText = [document.getElementById("cost1"), document.getElementById("cost2"), document.getElementById("cost3")];
  timeText = document.getElementById("buildDuration");
  nameText = document.getElementById("nameText");
  levelText = document.getElementById("levelText");
  imgInfo = document.getElementById("imgBlackInfo");
  colorButton = document.getElementById("build-it");
  posibleText = document.getElementById("possibleInTime");
  inputCantConteiner = document.getElementById('inputCantConteiner');
  inputCant = document.getElementById('number');
  maxlink = document.getElementById('maxlink');
  energy_res = document.getElementById('resources_energy');
  cancelButton = document.getElementById('cancelButton');
  if(inputCant != null) inputCant.value = 0;
  url += getDireccionApi(body);
  loadJSON(url, (res) => {
    info = res;
    doing = info.doing.active && shipyard == false;
    for(let i = 0 ; i<colorImg.length ; i++){
      if(info[info.listInfo[startImg + i]].tech == true && (!inMoon || body == 'station')){
        if(document.getElementById("resources_metal").innerHTML < info[info.listInfo[startImg + i]].metal || document.getElementById("resources_crystal").innerHTML < info[info.listInfo[startImg + i]].crystal || document.getElementById("resources_deuterium").innerHTML < info[info.listInfo[startImg + i]].deuterium || doing){
          if(doing == true && info.doing.item == info.listInfo[startImg + i]){
            timeContdown = info.doing.time - Math.floor((new Date().getTime() - info.doing.init)/1000);
            contdownText = document.createElement("span");
            contdownText.classList.add('time');
            contdownText.innerText = segundosATiempo(timeContdown);
            colorImg[i].children[0].children[0].appendChild(contdownText);
            setInterval(() => {
              contdownText.innerText = segundosATiempo(timeContdown - contContdown);
              contContdown++;
              if((timeContdown - contContdown) < 0) setTimeout(() => {location.reload();}, 1000);
            }, 1000);
          }else{
            if(info[info.listInfo[startImg + i]].name != "Solar Satellite") colorImg[i].classList.add('disabled');
          }
        }
      }else{
        colorImg[i].classList.add('off');
      }
    }
    if(inMoon == true && body == 'station') imgInfo.classList.add('moonImg');
    if(shipyard == true){
      if(info.doing.length > 0){
        let timeContShip = 0;
        let timeNowAux = Math.floor(info.doing[0].timeNow);
        firstShipName = document.getElementById("firstShipName");
        unityDuration = document.getElementById("Unityduration");
        totalDuration = document.getElementById("Totalduration");
        otherShips = document.getElementById("otherShips");
        firstLavel = document.getElementById("firstLavel");
        firstImg = document.getElementsByClassName("imgFirstShip")[0];
        firstShipName.innerText = info.doing[0].name;
        unityDuration.innerText = segundosATiempo(timeNowAux);
        firstLavel.innerText = info.doing[0].cant;
        firstImg.id = info.doing[0].item;
        timeContShip += info.doing[0].time*(info.doing[0].cant-1) + info.doing[0].timeNow;
        for(let i=1 ; i<info.doing.length ; i++){
          timeContShip += info.doing[i].time*info.doing[i].cant;
          let elemAux = document.createElement("div");
          elemAux.classList.add("imgListShip");
          elemAux.id = info.doing[i].item;
          elemAux.innerText = info.doing[i].cant;
          otherShips.appendChild(elemAux);
        }
        timeContShip = Math.floor(timeContShip);
        console.log(timeContShip);
        totalDuration.innerText = segundosATiempo(timeContShip);
        setInterval(() => {
          timeNowAux -= 1;
          timeContShip -= 1;
          if(timeNowAux < 0){
            info.doing[0].cant--;
            if(info.doing[0].cant <= 0){
                location.reload();
            }else{
              timeNowAux = info.doing[0].time;
              firstLavel.innerText = info.doing[0].cant;
            }
          }
          unityDuration.innerText = segundosATiempo(timeNowAux);
          totalDuration.innerText = segundosATiempo(timeContShip);
          if(timeContShip < 0) location.reload();
        }, 1000);
      }else{
         document.getElementById("shipInfoBuilding").style.display = 'none';
      }
    }
  });
}

function toggleDescription(id){
  if(toggle == "void" && id != "void"){
    toggle = id;
    container.style.height = size + "px";
    container.style.transform = "translateY(0px)";
    if(inputCant != null){
      inputCant.value = '';
      inputCant.select();
    }
    setInfo();//pone la info en el div
  }else{
    if(toggle == id || id == "void"){
      toggle = "void";//cierra el divisor
      container.style.transform = "translateY(" + size + "px)";
    }else{
      toggle = id;
      setInfo();//cambia la info del div
    }
  }
}

function setInfo(){
  let totalRosources = [metal_res.innerText, crystal_res.innerText, deuterium_res.innerText, energy_res.innerText];
  let resourcesList = [info[toggle].metal, info[toggle].crystal, info[toggle].deuterium, info[toggle].energy];
  let cont = 0;
  for(let i = 0 ; i<3 ; i++){//limpia los 3 mostradores de recursos
    for(let j = 0 ; j<4 ; j++){//no muestra la imagen
      resourcesIcon[i].classList.remove(elementList[j]);
    }
    resourcesText[i].classList.remove("overmark");
    resourcesText[i].innerHTML = "";
  }
  max = Infinity; // maximo de objetos que se pueden contruir con los recursos actuales
  for(let i = 0 ; i<4 && cont<3 ; i++){
    if(resourcesList[i] != 0){
      resourcesIcon[cont].classList.add(elementList[i]);
      resourcesText[cont].innerHTML = formatNumber(resourcesList[i]);
      if(cont == 2 && info[toggle].energyNeed != undefined){
        let classAux = 'undermark';
        if(info[toggle].energyNeed > totalRosources[i]){
          resourcesText[cont].classList.add("overmark");
          classAux = 'overmark';
        }
        resourcesText[cont].innerHTML += "<span class='" + classAux + "'> (+" + info[toggle].energyNeed + ")</span>";
      }else{
        if(resourcesList[i] > totalRosources[i]) resourcesText[cont].classList.add("overmark");// si no tenes los recursos lo escribe en rojo
      }
      if(totalRosources[i]/resourcesList[i] < max) max = Math.floor(totalRosources[i]/resourcesList[i]);
      cont++;
    }
  }
  if(body == 'resources'){
    if(toggle == "solarSatellite"){
      inputCantConteiner.style.display = 'block';
    }else{
      inputCantConteiner.style.display = 'none';
    }
  }
  nameText.innerHTML = info[toggle].name;
  levelText.innerHTML = ((toggle == 'solarSatellite') ? 'Number: ' : level) + info[toggle].level;
  timeText.innerHTML = segundosATiempo(tiempoParaEdificios(info[toggle].metal + info[toggle].crystal));// calcula el tiempo y lo pasa a segundos
  descriptionText.innerHTML = info[toggle].description;
  imgInfo.id = toggle;
  canPress = true;
  if((info[toggle].tech == false) || doing || (inMoon && body != 'station') || (totalRosources[0] < info[toggle].metal) || (totalRosources[1] < info[toggle].crystal) || (totalRosources[2] < info[toggle].deuterium)){
    canPress = false;
    colorButton.classList.add("build-it_disabled");
    posibleText.innerHTML = segundosATiempo(minimoPara(totalRosources, resourcesList));
    if(info[toggle].tech == false) posibleText.innerHTML = " req. are no met";
    if(doing) cancelButton.style.display = (info.doing.item == toggle) ? 'block' : 'none';
  }else{
    posibleText.innerHTML = " now";
    colorButton.classList.remove("build-it_disabled");
  }
  if(!doing && shipyard){
    cancelButton.style.display = estaEnLaLista(info.doing, toggle) ? 'block' : 'none';
  }
  if(inMoon){
    posibleText.innerHTML = " unknown";
    if(body == 'defense') levelText.innerHTML = 'Number: 0';
  }
  if(maxlink != null) maxlink.innerText = '[max. ' + max + ']'; //setea el maximo de objetos a contruir
}

function estaEnLaLista(lista, item){
  let res = false;
  for(let i = 0 ; i<lista.length && !res ; i++){
    if(lista[i].item == item) res = true;
  }
  return res;
}

function getDireccionApi(body){
  let res = body;
  if(body == "resources" || body == "station") res = "buildings";
  return res;
}

function tiempoParaEdificios(recursos){// esta medido en segundos
  let divisor = 2500 * (1+info.time.mult) * Math.pow(2,info.time.elev) * universeSpeed;
  return Math.floor(60*recursos/divisor);
}

function minimoPara(resources, objetivo){
  let aumento = [metal, crystal, deuterium];
  let max_res = 0;
  let aux = 0;
  for(let i = 0 ; i<3; i++){
    if((objetivo[i] - resources[i]) > 0) aux = (objetivo[i] - resources[i])/(aumento[i]/3600);
    if(!isFinite(aux)) return Infinity;
    if(aux > max_res) max_res = aux;
  }
  return Math.floor(max_res);
}

function setMax(){
  if(inputCant != null && maxlink != null) inputCant.value = max;
}

function sendInproveRequest(){
  if(toggle == "solarSatellite"){
    sendShipyardRequest();
  }else{
    if(canPress == true){
      loadJSON('./api/set/sendBuildRequest?obj=' + toggle, (obj) => {
        console.log(obj);
        if(obj.ok == true){
          location.reload();
        }else{
          sendPopUp(obj.mes);
        }
      });
    }
  }
}

function sendResearchRequest(){
  if(canPress == true){
    loadJSON('./api/set/sendResearchRequest?obj=' + toggle, (obj) => {
      console.log(obj);
      if(obj.ok == true){
        location.reload();
      }else{
        sendPopUp(obj.mes);
      }
    });
  }
}

function sendShipyardRequest(){
  if(canPress == true){
    loadJSON('./api/set/sendShipyardRequest?obj=' + toggle + '&cant=' + inputCant.value, (obj) => {
      console.log(obj);
      if(obj.ok == true){
        location.reload();
      }else{
        sendPopUp(obj.mes);
      }
    });
  }
}

function cancelBuilding(){
  loadJSON('./api/set/cancelBuildRequest', (obj) => {
    console.log(obj);
    if(obj.ok == true){
      location.reload();
    }else{
      sendPopUp(obj.mes);
    }
  });
}

function cancelResearch(){
  loadJSON('./api/set/cancelResearchRequest', (obj) => {
    console.log(obj);
    if(obj.ok == true){
      location.reload();
    }else{
      sendPopUp(obj.mes);
    }
  });
}

function cancelShipyard(shipyardName = null){
  if(shipyardName == null) shipyardName = toggle;
  loadJSON('./api/set/cancelShipyardRequest?obj=' + shipyardName, (obj) => {
    console.log(obj);
    if(obj.ok == true){
      location.reload();
    }else{
      sendPopUp(obj.mes);
    }
  });
}
