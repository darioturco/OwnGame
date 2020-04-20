//Script que usa toda pagina del juego. Contiene funciones varis de uso general 
var metal_res, crystal_res, deuterium_res, clock;
var metal = 0, crystal = 0, deuterium = 0;
var popUp, popUpText;

function initFunction(obj){ // Funcion que se ejecuta apenas carga un pagina
  clock = document.getElementById("Clock");
  popUp = document.getElementById("PopUpDiv");
  popUpText = document.getElementById("PopUpText");
  metal_res = document.getElementById("resources_metal");
  crystal_res = document.getElementById("resources_crystal");
  deuterium_res = document.getElementById("resources_deuterium");
  metal = Math.floor(parseInt(document.getElementsByName('ogame-add-metal')[0].content));
  crystal = Math.floor(parseInt(document.getElementsByName('ogame-add-crystal')[0].content));
  deuterium = Math.floor(parseInt(document.getElementsByName('ogame-add-deuterium')[0].content));
  actualizaFecha();
  setInterval(() => {
    actualizaFecha();
  }, 1000);
}

function actualizaFecha(){ // Se ejecuta cada un segunda y updatea el reloj de la esquina derecha
  let fecha = new Date();
  clock.innerHTML = fecha.getDate() + "." + (fecha.getMonth()+1) + "." + fecha.getFullYear() + " " + ((fecha.getHours() < 10) ? ('0'+fecha.getHours()) : (fecha.getHours())) + ":" + ((fecha.getMinutes() < 10) ? ('0'+fecha.getMinutes()) : (fecha.getMinutes())) + ":" + ((fecha.getSeconds() < 10) ? ('0'+fecha.getSeconds()) : (fecha.getSeconds()));
}

function segundosATiempo(seg){ // Dado un numero de segundos le da el formato tiempo (x dias n horas m minutos s segundos) xd nh mm ss
  if(!isFinite(seg)) return " unknown";
  if(seg < 0) return " now";
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

function removeVaca(own, gal, sys, pos){ // funcion utilizada para eliminar una vaca de la lista de vacas del jugador logeado
  own.parentElement.parentElement.style.display = 'none';
  loadJSON('./api/set/addVaca?coor={"galaxy":' + gal + ',"system":' + sys + ',"pos":' + pos + '}', (obj) => {
    console.log(obj);
  });
}

function setOptions(){ // funcion que utilisa la pagina Opcions.html para comunicarse con la api
  let esp = document.getElementById('inputEspionage').value;
  let small = document.getElementById('inputSmall').value;
  let large = document.getElementById('inputLarge').value;
  loadJSON('./api/set/setOptions?esp=' + esp + '&sml=' + small + '&lar=' + large, (obj) => {
    if(obj.ok == true){
      location.reload(); //actualiza la pagina si todo salio bien
    }else{
      sendPopUp(obj.mes);
    }
  });
}

function formatNumber (num) { // apartir de un numero te lo pasa al formato lindo. Cada tres digitos pone un punto y respeta el signo de la entrada
  let res = num;
  let sign = Math.sign(num);
  if(isFinite(num)){
    res = '';
    num = Math.abs(num);
    while(num > 999){
      res = '.' + completaDigitos(num%1000) + res;
      num = Math.floor(num / 1000);
    }
    res = num + res;
    if(sign == -1) res = '-' + res;
  }
  return res;
}

function completaDigitos (inn) { // apartir de un numero string si tiene 2 caracteres o meno te lo rellena con 0 adelante hasta tener un string de 3 caracteres. Si tiene mas de 2 caracteres te devuelve el string igual
  let result = inn;
  if(inn < 100){
    result = '0' + inn;
    if(inn < 10){
      result = '00' + inn;
      if(inn <= 0) result = '000';
    }
  }
  return result;
}

function sendPopUp(message){ // Aparece un mensage pop up por 3s que dice el texto message
  popUp.style.display = "block";
  popUp.classList.add("popUpActive");
  popUpText.innerText = message;
  setTimeout(() => {
    console.log("Se apreto el boton");
    popUp.style.display = "none";
    popUp.classList.remove("popUpActive");
  }, 3000);

}

/*<div id="attack_alert" class="tooltip eventToggle soon" title="">
              <a href="https://s163-en.ogame.gameforge.com/game/index.php?page=eventList"></a>
                            </div>*/
