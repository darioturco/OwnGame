var listaFleets = [];

setTimeout(() => {
  let i = 0;
  let elem = document.getElementById("timer" + i);
  while(elem != null){
    let obj = {};
    let timeAux = Math.ceil((parseInt(elem.dataset.time) - new Date().getTime()) / 1000);
    elem.innerText = segundosATiempo(timeAux);
    obj.mostrando = false;
    obj.timerText = elem;
    obj.timerVal = timeAux;
    obj.timerTotal = Math.ceil(parseInt(elem.dataset.total/1000));
    obj.idas = (elem.dataset.ida == "True");
    obj.navesProgreso = document.getElementById("nave" + i);;
    obj.infoDiv = document.getElementById("info" + i);
    listaFleets.push(obj);
    actualizaDesplazamiento(i);
    i += 1;
    elem = document.getElementById("timer" + i);
  }
  setInterval(() => {
    for(let i = 0 ; i<listaFleets.length ; i++){
      listaFleets[i].timerVal -= 1;
      listaFleets[i].timerText.innerText = segundosATiempo(listaFleets[i].timerVal);
      actualizaDesplazamiento(i);
      // if(listaFleets[i].timerVal < 0) reloadPage();
    }
  }, 1000);
}, 0);

function actualizaDesplazamiento(index){
  if(listaFleets[index].idas){
    listaFleets[index].navesProgreso.style["margin-left"] = ((listaFleets[index].timerTotal - listaFleets[index].timerVal) / listaFleets[index].timerTotal) * 272 + "px";
  }else{
    listaFleets[index].navesProgreso.style["margin-left"] = (272 - ((listaFleets[index].timerTotal - listaFleets[index].timerVal) / listaFleets[index].timerTotal) * 272) + "px";
  }
}

function returnFleet(num){
  loadJSON('./api/set/returnFleet?num=' + num, (obj) => {
    if(obj.ok == true){
      location.reload();
    }else{
      sendPopUp(obj.mes);
    }
  });
}

function showFleet(num){
  if(listaFleets[num].mostrando){
    listaFleets[num].infoDiv.style.display = "none";
  }else{
    listaFleets[num].infoDiv.style.display = "block";
  }
  listaFleets[num].mostrando = !listaFleets[num].mostrando;
}

function reloadPage(){
  location.reload();
}
