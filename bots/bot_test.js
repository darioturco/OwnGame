const fetch = require('node-fetch');
var token = "";
var id = ""

// La idea de los test es tener un conjunto de test que tardan mucho tiempo, pero
// testean todo, y otro conjunto que tardan menos pero algunas cosas no las testean
completeTests = {

  // Primero crear una cuenta nueva y verificar que se haya hecho bien
  test1CreateNewAcount: await function(){

    return true
  }
  // Agregarle recursos
  // Construir algunos edificios
  // Investigar algo
  // Colonizar algo
  // etc...



}

console.log("Running Tests...");

res = true
for test in completeTests{
  res = test() && res
}

if(res){
  console.log("Tests Passed.");
}else{
  console.log("Tests Fails.");
}
