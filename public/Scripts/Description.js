var toggle = -1;
var container;
var info;
var size = "250";
setTimeout(initial, 0);

function initial(){
  let body = document.body.id;
  info = getInfoPage(body, "Player", 0);
  if(body == "resources" || body == "station"){
    size = "300";
  }
  container = document.getElementById("detail");
}

function getInfoPage(page, player, planet){ // Esta funcion va a esta en el servidor(API)
  return {1: {
            name: "Metal Mine",
            duration: "0s",
            nivel: 1,
            metal: 500,
            crystal: 500,
            deuterium: 0,
            energy: 82,
            decription: "Used in the extraction of metal ore, metal mines are of primary importance to all emerging and established empires."},
          2: {}};
}

function toggleDescription(id){
  if(toggle == -1 && id != -1){
    toggle = id;
    container.style.height = size + "px";
    container.style.transform = "translateY(0px)";
  }else{
    if(toggle == id || id == -1){
      toggle = -1
      container.style.height = "0px";//cierra el div
      container.style.transform = "translateY(" + size + "px)";
    }else{
      toggle = id;
    }
  }
}
