var sendEspionage, sendSmall, sendLarge;

setTimeout(() => {
  sendEspionage = parseInt(document.getElementsByName('ogame-espionage')[0].content);
  sendSmall = parseInt(document.getElementsByName('ogame-small-cargos')[0].content);
  sendLarge = parseInt(document.getElementsByName('ogame-large-cargos')[0].content);
}, 0);

function removeVaca(own, gal, sys, pos){ // funcion utilizada para eliminar una vaca de la lista de vacas del jugador logeado
  loadJSON('./api/set/addVaca?coor={"gal":' + gal + ',"sys":' + sys + ',"pos":' + pos + '}', (obj) => {
    if(obj.ok){
      own.parentElement.parentElement.style.display = 'none';
    }else{
      sendPopUp(obj.mes);
    }
  });
}

function sendEspionage(gal, sys, pos){
  console.log(gal);
  console.log(sys);
  console.log(pos);
}

function spyReport(gal, sys, pos){
  console.log("Report");
}

function personalAttack(gal, sys, pos){
  window.location.href = './Ogame_Fleet.html?gal=' + gal + '&sys=' + sys + '&pos=' + pos + '&mis=7';
}

function vacaAttack(gal, sys, pos){
  console.log(gal);
  console.log(sys);
  console.log(pos);
}
