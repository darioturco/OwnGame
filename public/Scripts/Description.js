var toggle = "void";
var url = "http://localhost:3000/api/";
var colorImg = [];
var colorButton = null;
var startImg = 0;
var container;
var level = "Number: ";
var info = undefined;
var size = "250";
var elementList = ["metal", "crystal", "deuterium", "energy"];
var descriptionText, resourcesText, resourcesIcon, timeText, nameText, levelText, imgInfo;
setTimeout(initial, 0);

function initial(){
  let body = document.body.id;
  if(body == "research") level = "Level: ";
  if(body == "resources" || body == "station"){
    if(body == "station") startImg = 9;
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
  url += getDireccionApi(body);
  loadJSON(url, (res) => {
    info = res;
    for(let i = 0 ; i<colorImg.length ; i++){
      if(info[info.listInfo[startImg + i]].tech == false){
        colorImg[i].classList.add('off');
      }else{
        if(document.getElementById("resources_metal").innerHTML < info[info.listInfo[startImg + i]].metal || document.getElementById("resources_crystal").innerHTML < info[info.listInfo[startImg + i]].crystal || document.getElementById("resources_deuterium").innerHTML < info[info.listInfo[startImg + i]].deuterium){
          colorImg[i].classList.add('disabled');
        }
      }
    }
  });
}

function toggleDescription(id){
  if(toggle == "void" && id != "void"){
    toggle = id;
    container.style.height = size + "px";
    container.style.transform = "translateY(0px)";
    setInfo();//pone la info en el div
  }else{
    if(toggle == id || id == "void"){
      toggle = "void";
      container.style.height = "0px";//cierra el div
      container.style.transform = "translateY(" + size + "px)";
    }else{
      toggle = id;
      setInfo();//cambia la info del div
    }
  }
}

function setInfo(){
  let resourcesList = [info[toggle].metal, info[toggle].crystal, info[toggle].deuterium, info[toggle].energy];
  let cont = 0;
  for(let i = 0 ; i<3 ; i++){//limpia los 3 mostradores de recursos
    for(let j = 0 ; j<4 ; j++){//no muestra la imagen
      resourcesIcon[i].classList.remove(elementList[j]);
    }
    resourcesText[i].innerHTML = "";
  }
  for(let i = 0 ; i<4 && cont<3 ; i++){
    if(resourcesList[i] != 0){
      resourcesIcon[cont].classList.add(elementList[i]);
      resourcesText[cont].innerHTML = resourcesList[i];
      cont++;
    }
  }
  nameText.innerHTML = info[toggle].name;
  levelText.innerHTML = level + info[toggle].level;
  timeText.innerHTML = segundosATiempo(tiempoParaEdificios(info[toggle].metal + info[toggle].crystal));// tiene que ser calculado apartir de los recurso que usa y de las fabricas de robot/nanobots
  descriptionText.innerHTML = info[toggle].description;
  imgInfo.id = toggle;
  if((info[toggle].tech == false) || (metal_res.innerHTML < info[toggle].metal) || (crystal_res.innerHTML < info[toggle].crystal) || (deuterium_res.innerHTML < info[toggle].deuterium)){
    colorButton.classList.add("build-it_disabled");
  }else{
    colorButton.classList.remove("build-it_disabled");
  }
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

function segundosATiempo(seg){
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
