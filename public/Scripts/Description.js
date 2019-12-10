var toggle = "void";
var url = "./api/";
var colorImg = [];
var colorButton = null;
var startImg = 0;
var container;
var universeSpeed = 0;
var level = "Number: ";
var info = undefined;
var size = "250";
var elementList = ["metal", "crystal", "deuterium", "energy"];
var inputCant = null, maxlink = null;
var max = 0;
var energy_res;
var doing = false, canPress = false;
var descriptionText, resourcesText, resourcesIcon, timeText, nameText, levelText, imgInfo, posibleText;
setTimeout(initial, 0);

function initial(){
  let body = document.body.id;
  if(body == "research") level = "Level: ";
  if(body == "resources" || body == "station"){
    if(body == "station") startImg = 9;
    size = "300";
    level = "Level: ";
  }
  universeSpeed = parseInt(document.getElementsByName('ogame-universe-speed')[0].content);
  container = document.getElementById("detail");
  descriptionText = document.getElementById("descriptionText");
  colorImg = document.getElementsByClassName('on');
  resourcesIcon = document.getElementsByClassName('descriptionIcon');
  resourcesText = [document.getElementById("cost1"), document.getElementById("cost2"), document.getElementById("cost3")];
  timeText = document.getElementById("buildDuration");
  nameText = document.getElementById("nameText");
  levelText = document.getElementById("levelText");
  imgInfo = document.getElementById("imgBlackInfo");
  colorButton = document.getElementById("build-it");
  posibleText = document.getElementById("possibleInTime");
  inputCant = document.getElementById('number');
  maxlink = document.getElementById('maxlink');
  energy_res = document.getElementById('resources_energy');
  url += getDireccionApi(body);
  loadJSON(url, (res) => {
    info = res;
    for(let i = 0 ; i<colorImg.length ; i++){
      if(info[info.listInfo[startImg + i]].tech == false){
        colorImg[i].classList.add('off');
      }else{
        if(document.getElementById("resources_metal").innerHTML < info[info.listInfo[startImg + i]].metal || document.getElementById("resources_crystal").innerHTML < info[info.listInfo[startImg + i]].crystal || document.getElementById("resources_deuterium").innerHTML < info[info.listInfo[startImg + i]].deuterium || info.doing != false){
          colorImg[i].classList.add('disabled');
        }
      }
    }
    doing = info.doing != false;
  });
}

function toggleDescription(id){
  if(toggle == "void" && id != "void"){
    toggle = id;
    container.style.height = size + "px";
    container.style.transform = "translateY(0px)";
    setInfo();//pone la info en el div
  }else{
    if(toggle == id || id == "void"){
      toggle = "void";//cierra el divisor
      container.style.transform = "translateY(" + size + "px)";
    }else{
      toggle = id;
      setInfo();//cambia la info del div
    }
  }
}

function setInfo(){
  let totalRosources = [metal_res.innerText, crystal_res.innerText, deuterium_res.innerText, energy_res.innerText];
  let resourcesList = [info[toggle].metal, info[toggle].crystal, info[toggle].deuterium, info[toggle].energy];
  let cont = 0;
  for(let i = 0 ; i<3 ; i++){//limpia los 3 mostradores de recursos
    for(let j = 0 ; j<4 ; j++){//no muestra la imagen
      resourcesIcon[i].classList.remove(elementList[j]);
    }
    resourcesText[i].classList.remove("overmark");
    resourcesText[i].innerHTML = "";
  }
  max = Infinity; // maximo de objetos que se pueden contruir con los recursos actuales
  for(let i = 0 ; i<4 && cont<3 ; i++){
    if(resourcesList[i] != 0){
      resourcesIcon[cont].classList.add(elementList[i]);
      resourcesText[cont].innerHTML = formatNumber(resourcesList[i]);
      if(cont == 2 && info[toggle].energyNeed != undefined){
        let classAux = 'undermark';
        if(info[toggle].energyNeed > totalRosources[i]){
          resourcesText[cont].classList.add("overmark");
          classAux = 'overmark';
        }
        resourcesText[cont].innerHTML += "<span class='" + classAux + "'> (+" + info[toggle].energyNeed + ")</span>";
      }else{
        if(resourcesList[i] > totalRosources[i]) resourcesText[cont].classList.add("overmark");// si no tenes los recursos lo escribe en rojo
      }
      if(totalRosources[i]/resourcesList[i] < max) max = Math.floor(totalRosources[i]/resourcesList[i]);
      cont++;
    }
  }
  nameText.innerHTML = info[toggle].name;
  levelText.innerHTML = ((toggle == 'solarSatellite') ? 'Number: ' : level) + info[toggle].level;
  timeText.innerHTML = segundosATiempo(tiempoParaEdificios(info[toggle].metal + info[toggle].crystal));// calcula el tiempo y lo pasa a segundos
  descriptionText.innerHTML = info[toggle].description;
  imgInfo.id = toggle;
  canPress = true;
  if((info[toggle].tech == false) || doing ||(totalRosources[0] < info[toggle].metal) || (totalRosources[1] < info[toggle].crystal) || (totalRosources[2] < info[toggle].deuterium)){
    canPress = false;
    colorButton.classList.add("build-it_disabled");
    posibleText.innerHTML = segundosATiempo(minimoPara(totalRosources, resourcesList));
    if(info[toggle].tech == false){
      posibleText.innerHTML = " req. are no met";
    }
  }else{
    posibleText.innerHTML = " now";
    colorButton.classList.remove("build-it_disabled");
  }
  if(maxlink != null) maxlink.innerText = '[max. ' + max + ']'; //setea el maximo de objetos a contruir
}

function getDireccionApi(body){
  let res = body;
  if(body == "resources" || body == "station") res = "buildings";
  return res;
}

function tiempoParaEdificios(recursos){// esta medido en segundos
  let divisor = 2500 * (1+info.time.mult) * Math.pow(2,info.time.elev) * universeSpeed;
  return Math.floor(60*recursos/divisor);
}

function minimoPara(resources, objetivo){
  let aumento = [metal, crystal, deuterium];
  let max_res = 0;
  let aux = 0;
  for(let i = 0 ; i<3; i++){
    if((objetivo[i] - resources[i]) > 0) aux = (objetivo[i] - resources[i])/(aumento[i]/3600);
    if(!isFinite(aux)) return Infinity;
    if(aux > max_res) max_res = aux;
  }
  return Math.floor(max_res);
}

function setMax(){
  if(inputCant != null && maxlink != null) inputCant.value = max;
}

function sendInproveRequest(){
  if(canPress == true){
    loadJSON('./api/set/sendBuildRequest?obj=' + toggle, (obj) => {
      console.log(obj);
      if(obj.ok == true) location.reload();//recargo la pagina
    });
  }
}

/*<li id="button1" class="on">
                                <div class="item_box supply1 tooltip js_hideTipOnMobile" title="">
	<div class="stationlarge buildingimg">

		<div class="construction">
            <div class="pusher" id="b_supply1" style="height: 38px; margin-top: 62px;">
            </div>
            <a class="slideIn timeLink active" href="javascript:void(0);" ref="1">
                <span class="time" id="test" name="zeit">1h 10m</span>
            </a>

			<a class="detail_button slideIn active" id="details1" ref="1" href="javascript:void(0);">
				<span class="eckeoben">
					<span style="font-size:11px;" class="undermark">22</span>
				</span>
				<span class="ecke">
					<span class="level">21                                            </span>
				</span>
			</a>
		</div>
	</div>
</div>

                        </li>*/
