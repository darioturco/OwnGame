var fleetList = [], espList = [], universeList = [], otherList = [];
var buttonsType, conteinerList = [];
var original, listNode;
var type = 2; // enrealidad empieza en 1 apenas se cargan los mensajes
var spyDiv = undefined, spyClose = undefined;
var spyDate, spyPlanetInfo;
var fleetDivSpy, defenceDivSpy, researchDivSpy, buildingDivSpy, moonDivSpy;
var resourcesSpy, fleetSpy, defenceSpy, researchSpy, buildingSpy, moonSpy;
var ready = false;

setTimeout(() => {
  original = document.getElementById('orginalMessage');
  listNode = document.getElementById('listNode');
  buttonsType = document.getElementsByClassName('buttonType');
  loadJSON('./api/readMessages', (obj) => {
    for(let i = 0 ; i<obj.list.length ; i++){
      switch (obj.list[i].type) {
        case 1:// fleet
          fleetList.push(obj.list[i]);
          break;
        case 2:// espionaje
          espList.push(obj.list[i]);
          break;
        case 3:// universe
          universeList.push(obj.list[i]);
          break;
        default:// other
          otherList.push(obj.list[i]);
      }
    }
    ready = true;
    messageList = obj.list;
    changeTypeMessage(1, true);
  });
}, 0);

// Carga todos los mensages de ese tipo
function changeTypeMessage(num, act = false){
  if((num != type) || act){
    let auxList = [fleetList, espList, universeList, otherList][num-1];
    buttonsType[type-1].classList.remove('ui-tabs-active');
    buttonsType[num-1].classList.add('ui-tabs-active');
    type = num;
    let hasta = Math.max(auxList.length, conteinerList.length);
    let noMes = false;
    for(let i = 0 ; i<hasta ; i++){
      if(i < conteinerList.length){
        if(i < auxList.length){
          cargaData(conteinerList[i], auxList[i], i);
        }else{
          conteinerList[i].style.display = 'none'; // Apaga el conteiner
        }
      }else{
        let auxNode = original.cloneNode(true); // Crea un nuevo conteiner
        auxNode.id = "";
        auxNode.children[0].dataset.num = i;
        listNode.appendChild(auxNode);
        conteinerList.push(auxNode);
        cargaData(auxNode, auxList[i], i);
      }
    }
  }
}

function cargaData(conteiner, obj, num){
  // Pone la info de ese mensaje en ese conteiner
  conteiner.children[1].innerHTML = obj.title;
  conteiner.children[2].innerHTML = obj.date;
  let text = '';
  switch (type) {
    case 1: // fleet
      text = JSON.stringify(obj.data);
      /* Muestro el informe de batalla bien */
      break;
    case 2: // espionaje

      // Muestro la informacion de espionaje
      text = obj.data.playerName + " (" + obj.data.planetName + ") <a href='./Ogame_Galaxy.html?gal=" + obj.data.coor.gal + "&sys=" + obj.data.coor.sys + "'>" + coorToCorch(obj.data.coor) + "</a>";
      text += "<br> <pre>Metal: " + Math.floor(obj.data.resources.metal) +
              "     Crystal: " + Math.floor(obj.data.resources.crystal) +
              "     Deuterium: " + Math.floor(obj.data.resources.deuterium) +
              "     Energy: " + Math.floor(obj.data.resources.energy) + "</pre>";
      if(obj.data.fleet != undefined){
        text += " <br> <pre>Fleet: " + cantObj(obj.data.fleet);
        if(obj.data.defense != undefined){
          text += "     Defenses: " + cantObj(obj.data.defense);
        }
        text += "</pre>";
      }
      // Pongo los botones para atacar
      text += "<input type='button' value='Small(" + getCantShips(obj.data.resources, 5000) + ")' onClick='sendCargos(" + getCantShips(obj.data.resources, 5000) + ", true, " + num + ")' />" +
              "<input type='button' value='Large(" + getCantShips(obj.data.resources, 25000) + ")' onClick='sendCargos(" + getCantShips(obj.data.resources, 25000) + ", false, " + num + ")' />" +
              "<input type='button' value='Attack' onClick='attackCustom(" + obj.data.coor.gal + ", " + obj.data.coor.sys + ", " + obj.data.coor.pos + ")' />" +
              "<input type='button' value='See Report' onClick='seeCompleteReport(" + num + ")'/>";
      break;
    default:
      text = obj.text;
  }
  conteiner.children[3].innerHTML = text;
  conteiner.style.display = 'block';
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
      resourcesSpy[item].innerText = Math.floor(espList[num].data.resources[item]);
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

async function sendCargos(cant, small, num){
  if(ready){
    let data = {};
    ready = false;
    data.ships = zeroFleet();
    if(small){
      data.ships.smallCargo = cant;
    }else{
      data.ships.largeCargo = cant;
    }

    data.coorDesde = {gal: parseInt(document.getElementsByName('ogame-planet-galaxy')[0].content),
                      sys: parseInt(document.getElementsByName('ogame-planet-system')[0].content),
                      pos: parseInt(document.getElementsByName('ogame-planet-position')[0].content)};

    data.coorHasta = {gal: espList[num].data.coor.gal, sys: espList[num].data.coor.sys, pos: espList[num].data.coor.pos};
    data.destination = espList[num].data.moon ? 2 : 1; // 1 = planeta, 2 = moon, 3 = debris
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

function attackCustom(gal, sys, pos){
  window.location.href = './Ogame_Fleet.html?gal=' + gal + '&sys=' + sys + '&pos=' + pos;
}

function cantObj(obj){
  let res = 0;
  for(let item in obj){
    res += obj[item];
  }
  return res;
}

function getCantShips(resources, cargo){
  let total = resources.metal + resources.crystal + resources.deuterium;
  return Math.ceil(total / cargo);
}

function deleteMessage(obj){
  let num = obj.dataset.num;
  let auxList = [fleetList, espList, universeList, otherList][type-1];
  loadJSON('./api/set/deleteMessages?all=false&id=' + auxList[num].date, (obj) => {
    console.log("Elimino uno solo.");
  });
  auxList.splice(num, 1);
  changeTypeMessage(type, true);
}

function deleteAllMessage(){
  switch (type) {
    case 1:// fleet
      fleetList = [];
      break;
    case 2:// espionaje
      espList = [];
      break;
    case 3:// universe
      universeList = [];
      break;
    default:// other
      otherList = [];
  }
  for(let i = 0 ; i<conteinerList.length ; i++){
    conteinerList[i].style.display = 'none';
  }
  loadJSON('./api/set/deleteMessages?all=true&id=' + type, (obj) => {
    console.log("Elimino todo.");
  });
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
