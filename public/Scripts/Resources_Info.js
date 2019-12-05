var selects = [];
var controls = [];
var open = [];
var values = [];

setTimeout(() => {
  for(let i = 1 ; i<=5 ; i++){
    selects.push(document.getElementById("dropdown" + i));
    controls.push(document.getElementById("downButton" + i));
    open.push(false);

    values.push(selects[i-1].dataset.val);
  }
}, 0)

function clickSelect(num){
  for(let i = 0 ; i<5 ; i++){
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

function recalculateButton(){
  loadJSON('./api/set/updateResources', (obj) => {
    console.log(obj);
  });
}
