var selects = [];
var controls = [];
var open = [];
var values = [];

setTimeout(() => {
  for(let i = 1 ; i<=4 ; i++){
    selects.push(document.getElementById("dropdown" + i));
    controls.push(document.getElementById("downButton" + i));
    open.push(false);
    values.push(parseInt(selects[i-1].dataset.val));
    setDropdown(values[i-1]*10, i, true);
  }
}, 0)

function clickSelect(num){
  for(let i = 0 ; i<4 ; i++){
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

function setDropdown(val, num, init = false){
  controls[num-1].innerText = val + "%";
  values[num-1] = val/10;
  if(val >= 70){
    controls[num-1].className = "undermark";//verde (undermark)
  }else{
    if(val >= 40){
      controls[num-1].className = "middlemark";//amarillo (middlemark)
    }else {
      controls[num-1].className = "overmark";//rojo (overmark)
    }
  }
  if(init == false) clickSelect(num);
}

function recalculateButton(){

  loadJSON('./api/set/updateResources?metal=' + values[0] + '&crystal=' + values[1] + '&deuterium=' + values[2] + '&energy=' + values[3], (obj) => {
    if(obj.ok == true) location.reload();
  });
}
