var selects = [];
var controls = [];
var open = [];

function resourcesInitial(){
  //carga los datos desde el servidor
  for(let i = 1 ; i<=6 ; i++){
    selects.push(document.getElementById("dropdown" + i));
    controls.push(document.getElementById("downButton" + i));
    open.push(false);
  }
}

function clickSelect(num){
  for(let i = 0 ; i<6 ; i++){
    if(i == num-1){
      if(open[i] == true){
        selects[i].style.display = "none";
      }else{
        selects[i].style.display = "block";
      }
      open[i] = !open[i];
    }else{
      if(open[i] == true){
        selects[i].style.display = "none";
        open[i] = false;
      }
    }
  }
}

function setDropdown(val, num){
  controls[num-1].innerText = val + "%";
  if(val >= 70){
    controls[num-1].className = "undermark";//verde (undermark)
  }else{
    if(val >= 40){
      controls[num-1].className = "middlemark";//amarillo (middlemark)
    }else {
      controls[num-1].className = "overmark";//rojo (overmark)
    }
  }
  clickSelect(num);
}
