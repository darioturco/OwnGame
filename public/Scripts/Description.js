var toggle = "void";
var container;
var level = "Number: ";
var info = undefined;
var size = "250";
var descriptionText, resources1Text, resources2Text, resources3Text, timeText, nameText, levelText, imgInfo;
setTimeout(initial, 0);

function initial(){
  let body = document.body.id;
  if(body == "research") level = "Level: ";
  if(body == "resources" || body == "station"){
    size = "300";
    level = "Level: ";
  }
  container = document.getElementById("detail");
  descriptionText = document.getElementById("descriptionText");
  resourcesText = [document.getElementById("cost1"), document.getElementById("cost2"), document.getElementById("cost3")];
  timeText = document.getElementById("buildDuration");
  nameText = document.getElementById("nameText");
  levelText = document.getElementById("levelText");
  imgInfo = document.getElementById("imgBlackInfo");
  loadJSON('http://localhost:3000/api/buildings', (res) => {info = res;});
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
      //cambia la info del div
    }
  }
}

function setInfo(){
  let resourcesList = [info[toggle].metal, info[toggle].crystal, info[toggle].deuterium, info[toggle].energy];
  let cont = 0;
  //limpia los 3 mostradores de recursos
  for(let i = 0 ; i<4 && cont<3 ; i++){
    if(resourcesList[i] != 0){
      resourcesText[cont].innerHTML = resourcesList[i];
      cont++;
    }
  }
  nameText.innerHTML = info[toggle].name;
  levelText.innerHTML = level + info[toggle].level;
  timeText.innerHTML = " " + info[toggle].time;// tiene que convertirlo a la unidad correcta
  descriptionText.innerHTML = info[toggle].description;
  imgInfo.id = toggle;
}
