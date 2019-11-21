var metal_res, crystal_res, deuterium_res, clock;
var metal = 0, crystal = 0, deuterium = 0;
var energyTotal = 0;//guarda el total de la energia del planeta
var universeSpeed = 1;

function initFunction(obj){
  universeSpeed = obj.speedTime;
  clock = document.getElementById("Clock");
  metal_res = document.getElementById("resources_metal");
  crystal_res = document.getElementById("resources_crystal");
  deuterium_res = document.getElementById("resources_deuterium");
  metal = Math.floor(obj.add.metal/3600);
  crystal = Math.floor(obj.add.crystal/3600);
  deuterium = Math.floor(obj.add.deuterium/3600);
  metal_res.innerHTML = obj.resources.metal;
  crystal_res.innerHTML = obj.resources.crystal;
  deuterium_res.innerHTML = obj.resources.deuterium;
  actualizaFecha();
  //energyTotal = obj.energyTotal; agregar en obj
  setInterval(() => {
    metal_res.innerHTML = parseInt(metal_res.innerHTML) + metal;
    crystal_res.innerHTML = parseInt(crystal_res.innerHTML) + crystal;
    deuterium_res.innerHTML = parseInt(deuterium_res.innerHTML) + deuterium;
    actualizaFecha();
  }, 1000);
  //document.body.removeAttribute("onload");
}

function actualizaFecha(){
  let fecha = new Date();
  clock.innerHTML = fecha.getDate() + "." + (fecha.getMonth()+1) + "." + fecha.getFullYear() + " " + ((fecha.getHours() < 10) ? ('0'+fecha.getHours()) : (fecha.getHours())) + ":" + ((fecha.getMinutes() < 10) ? ('0'+fecha.getMinutes()) : (fecha.getMinutes())) + ":" + ((fecha.getSeconds() < 10) ? ('0'+fecha.getSeconds()) : (fecha.getSeconds()));
}

/*<div id="attack_alert" class="tooltip eventToggle soon" title="">
              <a href="https://s163-en.ogame.gameforge.com/game/index.php?page=eventList"></a>
                            </div>*/
