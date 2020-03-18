var selects = [];
var controls = [];
var open = [];
var values = [];
var inputsFleets, cantFleets;
var cuanticTimeText = null;
var cuanticTime = 0, valueMoon = -1;
var dropDownMoonOpen = false;
var selectMoon, controlMoon;

setTimeout(() => {
  inputsFleets = document.getElementsByClassName('fleetValues');
  cantFleets = document.getElementsByClassName('level');
  cuanticTimeText = document.getElementById('cuanticTimeCont');
  if(cuanticTimeText != null){
    cuanticTime = parseInt(cuanticTimeText.dataset.val);
    cuanticTimeText.innerText = segundosATiempo(cuanticTime);
  }
  for(let i = 1 ; i<=2 ; i++){
    selects.push(document.getElementById("dropdown" + i));
    controls.push(document.getElementById("downButton" + i));
    open.push(false);
    values.push(parseInt(selects[i-1].dataset.val));
    setDropdown(values[i-1]*10, i, true);
  }
  selectMoon = document.getElementById("dropdown3");
  controlMoon = document.getElementById("downButton3");
  for(let i = 0 ; i<cantFleets.length ; i++){
    if(cantFleets[i].innerText <= 0){
      inputsFleets[i].readOnly = true;
    }
  }
  if(cuanticTimeText != null){
    setInterval(() => {
      cuanticTime--;
      cuanticTimeText.innerText = segundosATiempo(cuanticTime);
    }, 1000);
  }
}, 0);

function clickSelect(num){
  for(let i = 0 ; i<2 ; i++){
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

function clickSelectMoon(){
  if(dropDownMoonOpen == true){
    selectMoon.style.display = "none";
  }else{
    selectMoon.style.display = "block";
  }
  dropDownMoonOpen = !dropDownMoonOpen;
}

function setDropdownMoon(val, text){
  controlMoon.innerText = text;
  valueMoon = parseInt(val);
  clickSelectMoon();
}

function recalculateButton(){
  console.log("Recalcula la pagina");
  loadJSON('./api/set/updateResourcesMoon?sunshade=' + values[0] + '&beam=' + values[1], (obj) => {
    if(obj.ok == true) location.reload();
  });
}
