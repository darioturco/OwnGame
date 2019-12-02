var metal_res, crystal_res, deuterium_res, clock;
var metal = 0, crystal = 0, deuterium = 0;
var energyTotal = 0;//guarda el total de la energia del planeta

function initFunction(obj){
  clock = document.getElementById("Clock");
  metal_res = document.getElementById("resources_metal");
  crystal_res = document.getElementById("resources_crystal");
  deuterium_res = document.getElementById("resources_deuterium");
  metal = Math.floor(parseInt(document.getElementsByName('ogame-add-metal')[0].content)/3600);
  crystal = Math.floor(parseInt(document.getElementsByName('ogame-add-crystal')[0].content)/3600);
  deuterium = Math.floor(parseInt(document.getElementsByName('ogame-add-deuterium')[0].content)/3600);
  actualizaFecha();
  setInterval(() => {
    metal_res.innerHTML = parseInt(metal_res.innerHTML) + metal;
    crystal_res.innerHTML = parseInt(crystal_res.innerHTML) + crystal;
    deuterium_res.innerHTML = parseInt(deuterium_res.innerHTML) + deuterium;
    actualizaFecha();
  }, 1000);
}

function actualizaFecha(){
  let fecha = new Date();
  clock.innerHTML = fecha.getDate() + "." + (fecha.getMonth()+1) + "." + fecha.getFullYear() + " " + ((fecha.getHours() < 10) ? ('0'+fecha.getHours()) : (fecha.getHours())) + ":" + ((fecha.getMinutes() < 10) ? ('0'+fecha.getMinutes()) : (fecha.getMinutes())) + ":" + ((fecha.getSeconds() < 10) ? ('0'+fecha.getSeconds()) : (fecha.getSeconds()));
}

function segundosATiempo(seg){
  if(!isFinite(seg)) return " unknown";
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

function removeVaca(own, gal, sys, pos){
  own.parentElement.parentElement.style.display = 'none';
  loadJSON('./api/set/addVaca?coor={"galaxy":' + gal + ',"system":' + sys + ',"pos":' + pos + '}', (obj) => {
    console.log(obj);
  });
}

function setOptions(){
  let esp = document.getElementById('inputEspionage').value;
  let small = document.getElementById('inputSmall').value;
  let large = document.getElementById('inputLarge').value;
  loadJSON('./api/set/setOptions?esp=' + esp + '&sml=' + small + '&lar=' + large, (obj) => {
    if(obj.ok == true) location.reload(); //actualiza la pagina si todo salio bien
  });
}

/*<div id="attack_alert" class="tooltip eventToggle soon" title="">
              <a href="https://s163-en.ogame.gameforge.com/game/index.php?page=eventList"></a>
                            </div>*/
