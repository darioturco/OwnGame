const fun = require('./funciones_auxiliares');

// Expedition event dialogue strings: https://ogame.fandom.com/wiki/Expedition
const retrasoExp = ["Your expedition went into a sector full of particle storms. This set the energy stores to overload and most of the ships main systems crashed. Your mechanics where able to avoid the worst, but the expedition is going to return with a big delay.",
                    "The expeditions flagship collided with a foreign ship when it jumped into the fleet without any warning. The foreign ship exploded and the damage to the flagship was substantial. As soon as the needed repair are carried out the fleet will begin to make their way back as the expedition can not continue in those conditions.",
                    "For unknown reasons the expeditions jump went totally wrong. It nearly landed in the heart of a sun. Fortunately it landed in a known system, but the jump back is going to take longer then thought.",
                    "The solar wind of a red giant ruined the expeditions jump and it will take quite some time to calculate the return jump. There was nothing besides the emptiness of space between the stars in that sector. The fleet will return later than expected.",
                    "Your navigator made a grave error in his computations that caused the expeditions jump to be miscalculated. Not only did the fleet miss the target completely, but the return trip will take a lot more time than originally planned.",
                    "The new navigation module is still buggy. The expedition's jump not only led them in the wrong direction, but it used all the Deuterium fuel. Fortunately the fleets jump got them close to the departure planet's moon. A bit disappointed the expedition now returns without impulse power. The return trip will take longer than expected."];
const perdidaExp = ["The only thing left from the expedition was the following radio transmission: Zzzrrt Oh no! Krrrzzzzt That zrrrtrzt looks krgzzzz like .. AHH! Krzzzzzzzztzzzz... Transmision terminated",
                    "Your crew betrayed you, they decided to go rogue and start their own settlement. The last transmission received made it seem likely they will not return.",
                    "Contact with the expedition fleet was suddenly lost. Our scientists are still trying to establish contact, but it seems the fleet is lost forever.",
                    "The last transmission we received from the expedition fleet was this magnificent picture of the opening of a black hole.",
                    "The entire fleet has been gulped by a black hold, the contact was lost.",
                    "A core meltdown of the lead ship leads to a chain reaction, which destroys the entire expedition fleet in a spectacular explosion."];
const separacionExp = ["Some ships crashed becouse of bad calculation of the rute.",
                       "We found an extrange virus in a desert planet. Some members of the crew had dead by the virus. Fortunately not people survived, but unfortunately, there is no enough members to drive back all the ships.",
                       "It seem we fall in the of a huge empire, they ship was realy large. Only a few were lucky to be able to scape alive",
                       "The captain of your biggest ship got drunk and start to fire our ouw ship. We left the ex-captain on the first asteroid seen.",
                       "A group of aliens attacked us, we tried to fight but our weapons seem harmless to them. Fortunately our ship were faster than the aliens but not everyone survived.",
                       "A part of your crew betrayed you and start a internal war between your fleet."];
const navesExp = ["We found a spaceship graveyard. Some of the technicians from the expedition fleet were able to get some of the ships to work again.",
                  "We found a deserted pirate station. There are some old ships lying in the hangar. Our technicians are figuring out whether some of them are still useful or not.",
                  "Your expedition ran into the shipyards of a colony that was deserted eons ago. In the shipyards hanger they discover some ships that could be salvaged. The technicians are trying to get some of them to fly again.",
                  "Our expedition found a planet which was almost destroyed during a certain chain of wars. There are different ships floating around in the orbit. The technicians are trying to repair some of them. Maybe we will also get information about what happened here.",
                  "We came across the remains of a previous expedition! Our technicians will try to get some of the ships to work again.",
                  "Our expedition ran into an old automatic shipyard. Some of the ships are still in the production phase and our technicians are currently trying to reactivate the yards energy generators.",
                  "We found the remains of an armada. The technicians directly went to the almost intact ships to try to get them to work again.",
                  "We found the planet of an extinct civilization. We are able to see a giant intact space station, orbiting. Some of your technicians and pilots went to the surface looking for some ships which could still be used.",
                  "A small fleet wants to join our ranks. It seems they betrayed the empire where they had belonged."];
const recursosExp = ["Mineral belts around an unknown planet contained resources. The expedition ships are coming back with the resources founded.",
                     "Your expedition ran into some spaceship wrecks from an old battle. Some of the components could be saved.",
                     "The expedition found a radioactive planetoid with an extremely toxic atmosphere. After multiple scans, it shows that it has loads of resources. With the help of automated drones, we tried to harvest as many resources as possible.",
                     "On a tiny moon with its own atmosphere your expediton found some huge raw resources storage. The crew on the ground is trying to lift and load that natural treasure.",
                     "Your expedition discovered a small asteroid from which some resources could be harvested.",
                     "On an isolated planetoid we found some easily accessible resources fields and harvested some successfully.",
                     "We met a small convoy of civil ships which needed food and medicine desperately. In exchange to that we got loads of useful resources.",
                     "Your expedition found an ancient, fully loaded but deserted freighter convoy. Some of the resources could be rescued.",
                     "Your expedition fleet reports the discovery of a giant alien ship wreck. They were not able to learn from their technologies but they were able to divide the ship into its main components and made some useful resources out of it.",
                     "Your expedition met a friendly civilization. They gave us a lot of gifts in exchange of our best food, it was an exelent change.",
                     "We found a small fleet from another empire exploring the area, our weapons were superior then we took the resources they have found."];
const batallaPiratasExp = ["We needed to fight some pirates which were, fortunately, only a few.",
                           "Some primitive barbarians are attacking us with spaceships that can't even be named as such. If the fire gets serious we will be forced to fire back.",
                           "Your expedition had an unpleasant rendezvous with some space pirates.",
                           "Our expedition reports that a Moa Tikarr and his wild troops request our unconditional capitulation. If they are going to get serious they will have to learn that our ships are able to defend themselves.",
                           "We caught some radio transmissions from some drunk pirates. Seems like we will be under attack soon.",
                           "Some really desperate space pirates tried to capture our expedition fleet.",
                           "That emergency signal that the expedition team followed was in reality an ambush set up by some Star Buccaneers. A fight could not be avoided."];
const batallaAliensExp  = ["We needed to fight some aliens which were, fortunately, only a few.",
                           "Some exotic looking ships attacked the expedition fleet without warning!",
                           "Your expedition fleet made some unfriendly first contact with unknown species.",
                           "The expeditions fleet reports contact with unknown ships. The sensor readings are not decipherable, but it seems that the alien ships are activating their weapon system.",
                           "Our expedition was attacked by a small group of unknown ships!",
                           "Your expedition fleet seems to have flown into territory that belongs to an unknown but really aggressive and warlike alien race.",
                           "We had a bit of difficulty pronouncing the dialect of the alien race correctly. Our diplomat accidentally called `Fire!` instead of `Peace!`."];
const nadaExp = ["Your expedition took gorgeous pictures of a supernova. Nothing new could be obtained from the expedition, but at least there is good chance to win that 'Best Picture Of The Universe' competition in next months issue of OGame magazine.",
                 "A failure in the flagships reactor core nearly destroys the entire expedition fleet. Fortunately the technicians were more than competent and could avoid the worst. The repairs took quite some time and forced the expedition to return without having accomplished its goal.",
                 "A living being made out of pure energy came aboard and induced all the expedition members into some strange trance, causing them to only gazed at the hypnotizing patterns on the computer screens. When most of them finally snapped out of the hypnotic-like state, the expedition mission needed to be aborted as they had way to little Deuterium.",
                 "Despite the first, very promising scans of this sector, we unfortunately returned empty handed.",
                 "Due to a failure in the central computers of the flagship, the expedition mission had to be aborted. Unfortunately as a result of the computer malfunction, the fleet returns home empty handed.",
                 "A strange computer virus attacked the navigation system shortly after parting our home system. This caused the expedition fleet to fly in circles. Needless to say that the expedition wasn't really successful.",
                 "Your expedition has learned about the extensive emptiness of the space. There was not even one small asteroid or radiation or particle that could have made this expedition interesting.",
                 "Besides some quaint, small pets from a unknown marsh planet, this expedition brings nothing thrilling back from the trip.",
                 "Well, now we know that those red, class 5 anomalies do not only have chaotic effects on the ships navigation systems but also generate massive hallucination on the crew. The expedition didn't bring anything back.",
                 "Your expedition fleet followed odd signals for some time. At the end they noticed the signals were being sent from an old probe which was sent out generations ago to greet foreign species. The probe was saved and some museums of your home planet have already voiced their interest.",
                 "Your expedition nearly ran into a neutron stars gravitation field and needed some time to free itself. Because of that a lot of Deuterium was consumed and the expedition fleet had to come back without any results.",
                 "Our expedition team came across a strange colony that had been abandoned eons ago. After landing, our crew started to suffer from a high fever caused by an alien virus. It has been learned that this virus wiped out the entire civilization on the planet. Our expedition team is heading home to treat the sickened crew members. Unfortunately we had to abort the mission and we come home empty handed.",
                 "The expedition didn't find anything interesting."];

function contarPuntosShips(ships) {
  let cost = fun.costShipsAndDefenses();
  let res = 0;
  for (let item in ships) {
    if (item !== 'misil') res += ships[item] * cost[item].puntos;
  }
  return res;
}

function newPointsRandomFleet(puntos) {
  let res = fun.zeroShips();
  let cost = fun.costShipsAndDefenses();
  while (puntos > 4500) {
    for (let item in res) {
      if (cost[item].puntos < puntos && fun.randomBool()) {
        res[item] += 1;
        puntos -= cost[item].puntos;
      }
    }
  }
  return res;
}

function newCorrelativeRandomFleet(ships) {
  let res = fun.zeroShips();
  for (let item in res) {
    res[item] = Math.floor(ships[item] * (Math.random() + 0.5));
  }
  res.lightFighter += 12;
  return res;
}

function randomBattleTechs(research) {
  let res = {};
  res.weapons  = research.weapons  + Math.floor(Math.random() * 6 - 3);
  res.shielding = research.shielding + Math.floor(Math.random() * 6 - 3);
  res.armour   = research.armour   + Math.floor(Math.random() * 6 - 3);
  for (let item in res) {
    if (res[item] < 0) res[item] = 0;
  }
  return res;
}

function expedition(ships, research) {
  let res = {ships: ships,
             resources: fun.zeroResources(),
             time: 0,
             mueren: false,
             evento: 0,    // 0=Nada, 1=Retrazo, 2=Perdida total, 3=Perdida parcial, 4=Naves, 5=Recursos, 6=Batalla
             mensajes: []};

  let rand = Math.floor(Math.random() * 1000);

  if (rand < 100) {        // Se retrasa la flota
    res.time = Math.floor(Math.random() * 7200) + 5000;
    res.mensajes.push({type: 3, title: "Expedition", text: retrasoExp[0], data: {}});
    res.evento = 1;

  } else if (rand === 100) { // Se pierde la flota
    res.mueren = true;
    res.mensajes.push({type: 3, title: "Expedition", text: perdidaExp[0], data: {}});
    res.evento = 2;

  } else if (rand < 120) { // Se pierde parte de la flota
    if (fun.randomBool()) { // Se pierde un solo tipo de nave
      let eliminado = false;
      if (!fun.isZeroObj(ships)) {
        while (!eliminado) {
          for (let item in ships) {
            if (fun.randomBool() && ships[item] !== 0) {
              eliminado = true;
              ships[item] = 0;
              break;
            }
          }
        }
      }
    } else { // Se pierden un poco de cada nave
      for (let item in ships) {
        ships[item] -= Math.floor(Math.random() * ships[item]);
      }
    }
    res.mueren = fun.isZeroObj(ships);
    res.mensajes.push({type: 3, title: "Expedition", text: separacionExp[0], data: {}});
    res.evento = 3;

  } else if (rand < 350) { // Se encuentran naves
    let newShips = {};
    let puntos = 0;
    if (fun.randomBool()) { // Algoritmo de puntos
      puntos = Math.floor(contarPuntosShips(ships) * (0.4 + research.astrophysics * 0.02)) + 5000 + research.astrophysics * 1000;
      newShips = newPointsRandomFleet(puntos);
    } else { // Algoritmo de copia de flota
      newShips = newCorrelativeRandomFleet(ships);
    }
    if (fun.randomBool()) newShips['deathstar'] = 0; // Complica conseguir estrellas de la muerte
    for (let item in ships) {
      res.ships[item] += newShips[item];
    }
    res.mensajes.push({type: 3, title: "Expedition", text: navesExp[0], data: {}});
    res.evento = 4;

  } else if (rand < 600) { // Se encuentran recursos
    let puntos = Math.floor(contarPuntosShips(ships) * 0.02) * research.astrophysics;
    let resource = Math.floor(Math.random() * 3);
    switch (resource) {
      case 0:  res.resources.metal     = Math.floor(puntos * Math.random()) + 1; break;
      case 1:  res.resources.crystal   = Math.floor(puntos * Math.random() * 0.5) + 1; break;
      default: res.resources.deuterium = Math.floor(puntos * Math.random() * 0.2) + 1;
    }
    res.mensajes.push({type: 3, title: "Expedition", text: recursosExp[0], data: {}});
    res.evento = 5;

  } else if (rand < 650) { // Se encuentran muchos recursos
    let puntos = Math.floor(contarPuntosShips(ships) * 0.035) * (research.astrophysics + 1) + 100;
    res.resources.metal     = Math.floor(puntos * Math.random()) + 1000;
    res.resources.crystal   = Math.floor(puntos * Math.random() * 0.8) + 1000;
    res.resources.deuterium = Math.floor(puntos * Math.random() * 0.5) + 500;
    res.mensajes.push({type: 3, title: "Expedition", text: recursosExp[0], data: {}});
    res.evento = 5;

  } else if (rand < 800) { // Enfrentamiento
    let enemyTech  = randomBattleTechs(research);
    let enemyShips = {};
    let puntos = 0;

    if (fun.randomBool()) { // Batalla contra piratas
      puntos = Math.floor(contarPuntosShips(ships) * 0.85) + 5000;
      enemyShips = newPointsRandomFleet(puntos);
      res.mensajes.push({type: 3, title: "Expedition", text: batallaPiratasExp[0], data: {}});
    } else { // Batalla contra aliens
      for (let item in enemyTech) { enemyTech[item] += 2; }
      if (fun.randomBool()) {
        puntos = Math.floor(contarPuntosShips(ships) * 1.1) + 100000;
        enemyShips = newPointsRandomFleet(puntos);
      } else {
        enemyShips = newCorrelativeRandomFleet(ships);
      }
      res.mensajes.push({type: 3, title: "Expedition", text: batallaAliensExp[0], data: {}});
    }

    /* Simulo la batalla */
    let battleData/* = battle(ships, enemyShips, research, enemyTech)*/;
    /* Mando el mensage de la batalla */
    /*res.mensajes.push(battleData.message);*/
    res.mueren = fun.isZeroObj(ships);
    /* Falta devolver las naves que sobrevivieron en ships */
    res.evento = 6;

  } else { // No pasa nada en la expedicion
    res.mensajes.push({type: 3, title: "Expedition", text: nadaExp[0], data: {}});
  }

  res.ships.misil = 0; // No se pueden encontrar misiles en la expedicion
  return res;
}

module.exports = { expedition };
