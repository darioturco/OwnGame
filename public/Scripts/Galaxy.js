var planets = [], estados = [], colonyImg = [], vacasButtons = [], espList = [];
var galaxy = 1, system = 1;
var galaxyText, systemText;
var playerName, planetName, moons, debris, actions, colonized;
var debrisConteiner, debrisMetal, debrisCrystal, debrisNeed, debrisCord;
var moonContainer, moonSize, moonCord;
var debrisList;
var debrisActive = -1, moonActive = -1;
var sendEspionage, sendSmall, sendLarge;
var probeText, recyText, smallText, largeText, usedSlotsText;
var probe, recy, small, large, usedSlots, maxSlots;
var spyDiv = undefined, spyClose = undefined;
var spyDate, spyPlanetInfo;
var fleetDivSpy, defenceDivSpy, researchDivSpy, buildingDivSpy, moonDivSpy;
var resourcesSpy, fleetSpy, defenceSpy, researchSpy, buildingSpy, moonSpy;
var phalanxDiv, phalanxClose, phalanxGeneralInfo, phalanxList, phalanxFirstElement;
var phalanxTime = [], phalanxFleet = [], phalanxShow = [];
var ready = false;

setTimeout(() => {
  moonConteiner = document.getElementById('canvasMoon');
  debrisConteiner = document.getElementById('canvasDebris');
  debrisMetal = document.getElementById('DebrisMetal');
  debrisCrystal = document.getElementById('DebrisCrystal');
  debrisNeed = document.getElementById('DebrisNeed');
  debrisCord = document.getElementById('DebrisCord');
  moonSize = document.getElementById('MoonSize');
  moonCord = document.getElementById('MoonCord');
  galaxyText = document.getElementById('galaxy_input');
  systemText = document.getElementById('system_input');
  colonized = document.getElementById('colonized');
  probeText = document.getElementById("probeValue");
  recyText = document.getElementById("recyclerValue");
  smallText = document.getElementById("smallValue");
  largeText = document.getElementById("largeValue");
  usedSlotsText = document.getElementById("slotValue");
  phalanxDiv = document.getElementById("phalanxReport");
  phalanxClose = document.getElementById("phalanxDivReport");
  phalanxGeneralInfo = document.getElementById("phalanxBasicInfo");
  phalanxList = document.getElementById("phalanxList");
  phalanxFirstElement = document.getElementById("phalanxListElement1");
  playerName = document.getElementsByClassName('status');
  planetName = document.getElementsByClassName('planetName');
  moons = document.getElementsByClassName('ListMoon');
  debris = document.getElementsByClassName('ListDebris');
  colonyImg = document.getElementsByClassName('colonyImg');
  actions = document.getElementsByClassName('action');
  vacasButtons = document.getElementsByClassName("icon_mail");
  sendEspionage = parseInt(document.getElementsByName('ogame-espionage')[0].content);
  sendSmall = parseInt(document.getElementsByName('ogame-small-cargos')[0].content);
  sendLarge = parseInt(document.getElementsByName('ogame-large-cargos')[0].content);
  phalanxTime.push(phalanxFirstElement.children[1]);
  phalanxFleet.push(phalanxFirstElement.children[3]);
  probe = parseInt(probeText.dataset.value);
  recy = parseInt(recyText.dataset.value);
  small = parseInt(smallText.dataset.value);
  large = parseInt(largeText.dataset.value);
  usedSlots = parseInt(usedSlotsText.dataset.used);
  maxSlots = parseInt(usedSlotsText.dataset.max);
  phalanxShow.push(false);
  for(let i = 1 ; i<=15 ; i++){
    planets.push(document.getElementById('Planet'+i));
  }
  document.onkeyup = function(tecla){
    if(tecla.key == 'Enter') loadSystem(parseInt(galaxyText.value), parseInt(systemText.value));
  };
  loadSystem(parseInt(galaxyText.value), parseInt(systemText.value));
  loadJSON('./api/readMessages', (obj) => {
    for(let i = 0 ; i<obj.list.length ; i++){
      if(obj.list[i].type === 2 && !obj.list[i].data.moon) {
        espList.push(obj.list[i]);
      }
    }
  });
  ready = true;
}, 0);

function loadSystem(gal, sys){
  if(gal < 0) gal = 0;
  if(gal > 9) gal = 9;
  if(sys < 0) sys = 0;
  if(sys > 499) sys = 499;
  galaxyText.value = gal;
  systemText.value = sys;
  galaxy = gal;
  system = sys;
  loadJSON('./api/galaxy?gal=' + gal + '&sys=' + sys, (obj) => {
    // console.log(obj);
    let cont = 0;
    debrisList = [];
    moonList = [];
    estados = [];
    pressMoon(-1);//apaga el cartel de la luna
    pressDebris(-1);//apaga el cartel de los escombros
    for(let i = 1 ; i<=15 ; i++){
      if(obj['pos'+i].active){    // Si es el plantea de la posicion i esta colonizado
        cont++;
        planets[i-1].src = './Imagenes/Planets/Miniatures/Planet_' + obj['pos'+i].type + '_' + obj['pos'+i].color + '_Mini.gif';
        playerName[i-1].innerHTML = obj['pos'+i].player + getEstado(obj['pos'+i].estado);
        //remover todas las posibles classes de estados
        playerName[i-1].classList.add(obj['pos'+i].estado);
        planetName[i-1].innerHTML = obj['pos'+i].name;
        colonyImg[i-1].style.display = 'none';
        if(obj['pos'+i].moon){
           moons[i-1].classList.add('activeMoon');
         }else{
           moons[i-1].classList.remove('activeMoon');
         }
        if(obj['pos'+i].debris){
          debris[i-1].classList.add('debrisField');
        }else{
          debris[i-1].classList.remove('debrisField');
        }
        if(playerActualName == obj['pos'+i].player){
          actions[i-1].style.display = 'none';
        }else{
          actions[i-1].style.display = 'block';
        }
        if(obj['pos'+i].esVaca){
          vacasButtons[i-1].classList.add("icon_mail_active");
        }else{
          vacasButtons[i-1].classList.remove("icon_mail_active");
        }
      }else{
        planets[i-1].src = './Imagenes/None.gif';
        playerName[i-1].innerHTML = '';
        planetName[i-1].innerHTML = '';
        colonyImg[i-1].style.display = 'inline';
        actions[i-1].style.display = 'none';
        moons[i-1].classList.remove('activeMoon');
        debris[i-1].classList.remove('debrisField');
      }
      estados.push(obj['pos'+i].estado);
      debrisList.push({debris: obj['pos'+i].debris, metal: obj['pos'+i].metalDebris, crystal: obj['pos'+i].crystalDebris});
      moonList.push({active: obj['pos'+i].moon, size: obj['pos'+i].moonSize, name: obj['pos'+i].moonName});
    }
    colonized.innerHTML = cont + " Planets colonised";
  });
}

function getEstado(est){
  res = "";
  if(est != 'activo') res = '(' + est[0] + ')';
  return res;
}

function pressMoon(num){
  if(moonActive == num){
    moonActive = -1;
    moonConteiner.style.display = 'none'; //cierra el div
  }else{
    moonActive = num;
    if(num >= 0){ //actualiza datos de la luna
      moonCord.innerHTML = '['+galaxy+':'+system+':'+num+']';
      moonSize.innerHTML = moonList[num-1].size + ' Km';
      moonConteiner.style.top = ((num-1)*33+76) + 'px';
      moonConteiner.style.display = 'block';
      debrisConteiner.style.display = 'none'; // cierra el div de debris
    }else{
      moonConteiner.style.display = 'none';
    }
  }
}

function pressDebris(num){
  if(debrisActive == num){
    debrisActive = -1;
    debrisConteiner.style.display = 'none';//cierra el div
  }else{
    debrisActive = num;
    if(num >= 0){
      debrisMetal.innerHTML = 'Metal: ' + formatNumber(debrisList[num-1].metal);
      debrisCrystal.innerHTML = 'Crystal: ' + formatNumber(debrisList[num-1].crystal);
      debrisNeed.innerHTML = 'Recyclers needed: ' + formatNumber(Math.ceil((debrisList[num-1].metal + debrisList[num-1].crystal)/20000));
      debrisCord.innerHTML = '['+galaxy+':'+system+':'+num+']';
      debrisConteiner.style.top = ((num-1)*33+76) + 'px';
      debrisConteiner.style.display = 'block';
      moonConteiner.style.display = 'none'; // cierra el div de moon
    }else{
      debrisConteiner.style.display = 'none';
    }
  }
}

function galaxyChange(add){
  let galaxyVal = parseInt(galaxyText.value) + add;
  if(galaxyVal > 9) galaxyVal = 1;
  if(galaxyVal < 1) galaxyVal = 9;
  galaxyText.value = galaxyVal;
}
function systemChange(add){
  let systemVal = parseInt(systemText.value) + add;
  if(systemVal > 499) systemVal = 1;
  if(systemVal < 1) systemVal = 499;
  systemText.value = systemVal;
}

function updatePanel(nave){
  usedSlots++;
  usedSlotsText.innerText = usedSlots + '/' + maxSlots;
  switch (nave) {
  case 0: // Espionage
    probeText.innerText = probe;
    break;
  case 1: // Recicladores
    recyText.innerText = recy;
    break;
  case 2: // Large Cargos
    largeText.innerText = large;
    break;
  case 3: // Small Cargos
    smallText.innerText = small;
    break;
  }
}

function pressGo(){
  loadSystem(parseInt(galaxyText.value), parseInt(systemText.value));
}

function doExpedition(){
  window.location.href = './Ogame_Fleet.html?gal=' + galaxy + '&sys=' + system + '&pos=16&mis=0';
}

function colonize(pos){
  window.location.href = './Ogame_Fleet.html?gal=' + galaxy + '&sys=' + system + '&pos=' + pos + '&mis=1';
}

function addVaca(pos){
  loadJSON('./api/set/addVaca?coor={"gal":' + galaxy + ',"sys":' + system + ',"pos":' + pos + '}&playerName=' + playerName[pos-1].innerText + '&planetName=' + planetName[pos-1].innerText + '&estado=' + estados[pos-1], (obj) => {
    if(obj.ok){
      if(obj.deleted){
        vacasButtons[pos-1].classList.remove("icon_mail_active");
      }else{
        vacasButtons[pos-1].classList.add("icon_mail_active");
      }
    }else{
      sendPopUp(obj.mes);
    }
  });
}

function getReport(num){
  let index = -1;
  for(let i = 0 ; i<espList.length && index === -1; i++ ){
    if(equalCoor(espList[i].data.coor, {gal: galaxy, sys: system, pos: num})){
      index = i;
    }
  }
  if(index === -1){
    sendPopUp("There is no report from that player.");
  }else{
    // Muestro el reporte de espionage espList[index]
    seeCompleteReport(index);
  }
}

function seeCompleteReport(num){
  if(spyDiv === undefined){
    loadSpyDivs();
    if(spyDiv !== undefined) seeCompleteReport(num);
  }else{
    spyDiv.style.display = "block";
    spyDiv.classList.remove("closeBackgroud");
    spyDiv.classList.add("openBackgroud");
    spyClose.style.display = "block";
    spyClose.classList.remove("closeBackgroud");
    spyClose.classList.add("openBackgroud");

    // Pongo la informacion del informe
    let item;
    spyDate.innerText = "Date: " + espList[num].date;
    spyPlanetInfo.innerHTML = espList[num].data.playerName + " (" +espList[num].data.planetName + ") <a href='./Ogame_Galaxy.html?gal=" + espList[num].data.coor.gal + "&sys=" + espList[num].data.coor.sys + "'>" + coorToCorch(espList[num].data.coor) + "</a>";
    for(item in espList[num].data.resources){
      resourcesSpy[item].innerText = espList[num].data.resources[item];
    }
    if(espList[num].data.fleet != undefined){
      fleetDivSpy.style.display = 'block';
      for(item in espList[num].data.fleet){
        fleetSpy[item].innerText = espList[num].data.fleet[item];
      }
    }else{
      fleetDivSpy.style.display = 'none';
    }
    if(espList[num].data.defense != undefined){
      defenceDivSpy.style.display = 'block';
      for(item in espList[num].data.defense){
        defenceSpy[item].innerText = espList[num].data.defense[item];
      }
    }else{
      defenceDivSpy.style.display = 'none';
    }
    if(espList[num].data.research != undefined){
      researchDivSpy.style.display = 'block';
      for(item in espList[num].data.research){
        researchSpy[item].innerText = espList[num].data.research[item];
      }
    }else{
      researchDivSpy.style.display = 'none';
    }

    if(espList[num].data.buildings != undefined){
      if(espList[num].data.moon){
        buildingDivSpy.style.display = 'none';
        moonDivSpy.style.display = 'block';
        for(item in espList[num].data.buildings){
          moonSpy[item].innerText = espList[num].data.buildings[item];
        }
      }else{
        buildingDivSpy.style.display = 'block';
        moonDivSpy.style.display = 'none';
        for(item in espList[num].data.buildings){
          buildingSpy[item].innerText = espList[num].data.buildings[item];
        }
      }
    }else{
      buildingDivSpy.style.display = 'none';
      moonDivSpy.style.display = 'none';
    }
  }
}

function closeSpyReport(e){
  if(e.id === 'spyCross' || !document.getElementById("spyReport").contains(e.target)){
    spyDiv.classList.add("closeBackgroud");
    spyDiv.classList.remove("openBackgroud");
    spyClose.classList.add("closeBackgroud");
    spyClose.classList.remove("openBackgroud");
  }
}

function equalCoor(coor1, coor2){
  return coor1.gal === coor2.gal && coor1.sys === coor2.sys && coor1.pos === coor2.pos;
}

function goToPlayerOverview(num){
  if(playerName[num-1] != ''){
    window.location = './Change.html?name=' + playerName[num-1].innerHTML;
  }
}

async function sendToMine(){
  if(!(isNaN(parseInt(debrisActive)) || debrisActive < 0 || debrisActive > 15) && ready){
    if(usedSlots < maxSlots){
      if(recy > 0){
        let data = {};
        ready = false;
        let totalRecy = Math.min(debrisActive, Math.ceil((debrisList[debrisActive-1].metal + debrisList[debrisActive-1].crystal)/20000));
        data.ships = zeroFleet();
        data.ships.recycler = totalRecy;
        data.coorDesde = {gal: parseInt(document.getElementsByName('ogame-planet-galaxy')[0].content),
                          sys: parseInt(document.getElementsByName('ogame-planet-system')[0].content),
                          pos: parseInt(document.getElementsByName('ogame-planet-position')[0].content)};
        data.coorHasta = {gal: galaxy, sys: system, pos: debrisActive};
        data.destination = 3; // 1 = planeta, 2 = moon, 3 = debris
        data.porce = 10;
        data.mission = 2;
        data.resources = {metal: 0, crystal: 0, deuterium: 0};
        let res = await fetch('./api/set/addFleetMovement', {method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify(data)});
        let objRes = await res.json();
        ready = true;
        if(objRes.ok){
          recy -= totalRecy;
          updatePanel(1);
          sendTick();
        }else{
          sendPopUp(objRes.mes);
        }

      }else{
        sendPopUp("No hay recicladores para enviar.");
      }
    }else{
      sendPopUp("No hay espacio para mas flotas.");
    }
  }
}

async function sackFunction(num){
  if(!(isNaN(parseInt(num)) || num < 0 || num > 15) && ready){
    let data = {};
    ready = false;
    data.ships = zeroFleet();
    if(usedSlots < maxSlots){
      if(large >= sendLarge){
        data.ships.largeCargo = sendLarge;
        large -= sendLarge;
        updatePanel(2);
      }else if(small >= sendSmall){
        data.ships.smallCargo = sendSmall;
        small -= sendSmall;
        updatePanel(3);
      }else{
        sendPopUp("No hay suficientes naves de carga.");
        return;
      }
    }else{
      sendPopUp("No hay espacio para mas flotas.");
      return;
    }
    data.coorDesde = {gal: parseInt(document.getElementsByName('ogame-planet-galaxy')[0].content),
                      sys: parseInt(document.getElementsByName('ogame-planet-system')[0].content),
                      pos: parseInt(document.getElementsByName('ogame-planet-position')[0].content)};
    data.coorHasta = {gal: galaxy, sys: system, pos: num};
    data.destination = 1; // 1 = planeta, 2 = moon, 3 = debris
    data.porce = 10;
    data.mission = 7;
    data.resources = {metal: 0, crystal: 0, deuterium: 0};
    let res = await fetch('./api/set/addFleetMovement', {method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify(data)});
    let objRes = await res.json();
    ready = true;
    if(objRes.ok){
      sendTick();
    }else{
      sendPopUp(objRes.mes);
    }
  }
}

async function spyFunction(num, moon){
  if(!(isNaN(parseInt(num)) || num < 0 || num > 15) && ready){
    if(usedSlots < maxSlots){
      if(probe >= sendEspionage){
        let data = {};
        ready = false;
        data.ships = zeroFleet();
        data.ships.espionageProbe = sendEspionage;
        data.coorDesde = {gal: parseInt(document.getElementsByName('ogame-planet-galaxy')[0].content),
                          sys: parseInt(document.getElementsByName('ogame-planet-system')[0].content),
                          pos: parseInt(document.getElementsByName('ogame-planet-position')[0].content)};
        data.coorHasta = {gal: galaxy, sys: system, pos: num};
        data.destination = moon ? 2 : 1; // 1 = planeta, 2 = moon, 3 = debris
        data.porce = 10;
        data.mission = 5;
        data.resources = {metal: 0, crystal: 0, deuterium: 0};
        let res = await fetch('./api/set/addFleetMovement', {method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify(data)});
        let objRes = await res.json();
        ready = true;
        if(objRes.ok){
          probe -= sendEspionage;
          updatePanel(0);
          sendTick();
        }else{
          sendPopUp(objRes.mes);
        }
      }else{
        sendPopUp("No hay suficientes sondas de espionage.");
      }
    }else{
      sendPopUp("No hay espacio para mas flotas.");
    }
  }
}

async function usePhalanx(num){
  if(!(isNaN(parseInt(num)) || num < 0 || num > 15) && ready){
    ready = false;
    loadJSON('./api/usePhalanx?gal=' + galaxy + '&sys=' + system + '&pos=' + num, (objRes) => {
      if(objRes.ok){
        if(objRes.data.length === 0){
          sendPopUp("No fleet movement on that planet.");
        }else{
          // Mustro el resultado del phalanxeo
          showPhalanxInfo(objRes.data);
        }
      }else{
        sendPopUp(objRes.mes);
      }
      ready = true;
    });
  }else{
    sendPopUp("No se puede usar el phalanx en esa posicion.");
  }
}

function showPhalanxInfo(list){
  phalanxDiv.style.display = "block";
  phalanxDiv.classList.remove("closeBackgroud");
  phalanxDiv.classList.add("openBackgroud");
  phalanxClose.style.display = "block";
  phalanxClose.classList.remove("closeBackgroud");
  phalanxClose.classList.add("openBackgroud");
  phalanxGeneralInfo.innerText = "Cantidad de flotas: " + list.length;
  for(let i = 0 ; i<list.length ; i++){
    if(phalanxTime.length <= i){ // Agrego un elemento a la lista de movimiento
      let newElement = phalanxFirstElement.cloneNode(true);
      newElement.id = 'phalanxListElement' + (i+1);
      phalanxList.appendChild(newElement);
      phalanxTime.push(newElement.children[1]);
      phalanxFleet.push(newElement.children[3]);
      newElement.children[2].dataset.num = i;
      phalanxShow.push(false);
    }
    // Completo la informacion en esa posicion
    phalanxShow[i] = false;
    phalanxTime[i].innerText = segundosATiempo((list[i].llegada - list[i].time) / 1000);
    phalanxFleet[i].style.display = 'none';
    let navesText = "";
    for(let item in list[i].ships){
      if(list[i].ships[item] != 0) navesText += item + ": " + list[i].ships[item] + " <br> ";
    }
    navesText += "<br> Metal: " + list[i].resources.metal + " <br> ";
    navesText += "Crystal: " + list[i].resources.crystal + " <br> ";
    navesText += "Deuterium: " + list[i].resources.deuterium + " <br> ";
    phalanxFleet[i].innerHTML = navesText;
  }
}

function openPhalanxInfo(e){
  let num = parseInt(e.dataset.num);
  if(phalanxShow[num]){
    phalanxFleet[num].style.display = 'none';
  }else{
    phalanxFleet[num].style.display = 'block';
  }
  phalanxShow[num] = !phalanxShow[num];
}

function closePhalanxReport(e){
  if(e.id === 'phalanxCross' || !phalanxDiv.contains(e.target)){
    phalanxDiv.classList.add("closeBackgroud");
    phalanxDiv.classList.remove("openBackgroud");
    phalanxClose.classList.add("closeBackgroud");
    phalanxClose.classList.remove("openBackgroud");
  }
}

function loadSpyDivs(){
  spyDiv = document.getElementById("spyReport");
  spyClose = document.getElementById("spyDivReport");
  fleetDivSpy = document.getElementById("spyFleet");
  defenceDivSpy = document.getElementById("spyDefence");
  researchDivSpy = document.getElementById("spyResearch");
  buildingDivSpy = document.getElementById("spyBuildings");
  moonDivSpy = document.getElementById("spyMoonBuildings");
  spyDate = document.getElementById("spyDateComplete");
  spyPlanetInfo = document.getElementById("spyPlanetInfo");
  resourcesSpy = {metal: document.getElementById("spyMetalContent"),
    crystal: document.getElementById("spyCrystalContent"),
    deuterium: document.getElementById("spyDeuteriumContent"),
    energy: document.getElementById("spyEnergyContent")}
  fleetSpy = { battlecruiser: document.getElementById("spyBattlecruiserContent"),
    battleship: document.getElementById("spyBattleshipContent"),
    bomber: document.getElementById("spyBomberContent"),
    colony: document.getElementById("spyColonyContent"),
    cruiser: document.getElementById("spyCruiserContent"),
    deathstar: document.getElementById("spyDeathstarContent"),
    destroyer: document.getElementById("spyDestroyerContent"),
    espionageProbe: document.getElementById("spyEspionageContent"),
    heavyFighter: document.getElementById("spyHeavyContent"),
    largeCargo: document.getElementById("spyLargeContent"),
    lightFighter: document.getElementById("spyLightContent"),
    recycler: document.getElementById("spyRecyclerContent"),
    smallCargo: document.getElementById("spySmallContent"),
    solarSatellite: document.getElementById("spySolarContent")};
  defenceSpy = {antiballisticMissile: document.getElementById("spyAntiMissilesContent"),
    gauss: document.getElementById("spyGaussContent"),
    heavyLaser: document.getElementById("spyHeavyLaserContent"),
    interplanetaryMissile: document.getElementById("spyMissilesContent"),
    ion: document.getElementById("spyIonContent"),
    largeShield: document.getElementById("spyLargeShieldContent"),
    lightLaser: document.getElementById("spyLightLaserContent"),
    plasma: document.getElementById("spyPlasmaContent"),
    rocketLauncher: document.getElementById("spyRocketLauncherContent"),
    smallShield: document.getElementById("spySmallShieldContent")};
  researchSpy = {armour: document.getElementById("spyArmourContent"),
    astrophysics: document.getElementById("spyAstrophysicsContent"),
    combustion: document.getElementById("spyCombustionDriveContent"),
    computer: document.getElementById("spyComputerContent"),
    energy: document.getElementById("spyEnergyTechContent"),
    espionage: document.getElementById("spyEspionageTechContent"),
    graviton: document.getElementById("spyGravitonContent"),
    hyperspace: document.getElementById("spyHyperspaceTechContent"),
    hyperspace_drive: document.getElementById("spyHyperspaceDriveContent"),
    impulse: document.getElementById("spyImpulseDriveContent"),
    intergalactic: document.getElementById("spyIntergalacticContent"),
    ion: document.getElementById("spyIonTechContent"),
    laser: document.getElementById("spyLaserTechContent"),
    plasma: document.getElementById("spyPlasmaTechContent"),
    shielding: document.getElementById("spyShieldingContent"),
    weapons: document.getElementById("spyWeaponsContent")};
  buildingSpy = {alliance: document.getElementById("spyAllianceContent"),
    crystalMine: document.getElementById("spyCrystalMineContent"),
    crystalStorage: document.getElementById("spyCrystalStorageContent"),
    deuteriumMine: document.getElementById("spyDeuteriumMineContent"),
    deuteriumStorage: document.getElementById("spyDeuteriumStorageContent"),
    fusionReactor: document.getElementById("spyFusionReactorContent"),
    metalMine: document.getElementById("spyMetalMineContent"),
    metalStorage: document.getElementById("spyMetalStorageContent"),
    naniteFactory: document.getElementById("spyNaniteFactoryContent"),
    researchLab: document.getElementById("spyResearchLabContent"),
    robotFactory: document.getElementById("spyRoboticsFactoryContent"),
    shipyard: document.getElementById("spyShipyardContent"),
    silo: document.getElementById("spySiloContent"),
    solarPlant: document.getElementById("spySolarPlantContent"),
    terraformer: document.getElementById("spyTerraformerContent")};
  moonSpy = {jumpGate: document.getElementById("spyJumpGateContent"),
    lunarBase: document.getElementById("spyLunarBaseContent"),
    lunarBeam: document.getElementById("spyLunarBeamContent"),
    lunarSunshade: document.getElementById("spyLunarSunshadeContent"),
    marketplace: document.getElementById("spyMarketplaceContent"),
    moonShield: document.getElementById("spyMoonShieldContent"),
    phalanx: document.getElementById("spyPhalanxContent"),
    spaceDock: document.getElementById("spySpaceDockContent")};
}
