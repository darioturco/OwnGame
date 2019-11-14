var metal_res, crystal_res, deuterium_res;
var metal = 0, crystal = 0, deuterium = 0;

function initFunction(obj){
  console.log(obj);
  metal_res = document.getElementById("resources_metal");
  crystal_res = document.getElementById("resources_crystal");
  deuterium_res = document.getElementById("resources_deuterium");
  metal = obj.add.addMetal;
  crystal = obj.add.addCrystal;
  deuterium = obj.add.addDeuterium;
  metal_res.innerHTML = obj.resources.metal;
  crystal_res.innerHTML = obj.resources.crystal;
  deuterium_res.innerHTML = obj.resources.deuterium;
  setInterval(() => {
    metal_res.innerHTML = parseInt(metal_res.innerHTML) + metal;
    crystal_res.innerHTML = parseInt(crystal_res.innerHTML) + crystal;
    deuterium_res.innerHTML = parseInt(deuterium_res.innerHTML) + deuterium;
    //actualiza la hora
  }, 1000);
  document.body.removeAttribute("onload");
}
