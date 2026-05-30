var buttonSwitch, imgReward, titleReward, infoReward, task1, task2, task3, reward;
var missionsData = [];
var mission = 1;

const LABELS = {
  building: {
    metalMine: 'Metal Mine', crystalMine: 'Crystal Mine', solarPlant: 'Solar Plant',
    deuteriumMine: 'Deuterium Synthesizer', researchLab: 'Research Laboratory', shipyard: 'Shipyard'
  },
  research: {
    combustion: 'Combustion Drive', espionage: 'Espionage Technology', laser: 'Laser Technology',
    impulse: 'Impulse Drive', armour: 'Armour Technology', astrophysics: 'Astrophysics',
    shielding: 'Shielding Technology', ion: 'Ion Technology'
  },
  fleet: {
    smallCargo: 'Small Cargo', heavyFighter: 'Heavy Fighter', espionageProbe: 'Espionage Probe',
    largeCargo: 'Large Cargo', cruiser: 'Cruiser', lightFighter: 'Light Fighter',
    battleship: 'Battleship', recycler: 'Recycler'
  },
  defense:  { rocketLauncher: 'Rocket Launcher' },
  resource: { metal: 'Metal', crystal: 'Crystal', deuterium: 'Deuterium' },
};

function reqText(r) {
  if (r.type === 'building') return `Upgrade ${LABELS.building[r.key] || r.key} to level ${r.level}`;
  if (r.type === 'research') return `Research ${LABELS.research[r.key] || r.key} to level ${r.level}`;
  if (r.type === 'fleet')    return `Build ${r.count} ${LABELS.fleet[r.key] || r.key}${r.count > 1 ? 's' : ''}`;
  if (r.type === 'defense')  return `Build ${r.count} ${LABELS.defense[r.key] || r.key}${r.count > 1 ? 's' : ''}`;
  if (r.type === 'colony')   return 'Found a colony';
  return '';
}

function rewText(rewardArr) {
  return rewardArr.map(r => {
    const name = (LABELS[r.type] || {})[r.key] || r.key;
    return `${r.amount.toLocaleString()} ${name}${r.type !== 'resource' && r.amount > 1 ? 's' : ''}`;
  }).join(', ');
}

function renderMission(num) {
  const m = missionsData[num - 1];
  if (!m) return;
  titleReward.innerText = `Task ${num} - ${m.title}`;
  imgReward.id = `imgReward_${num}`;
  infoReward.innerText = m.info;
  task1.innerText = reqText(m.requirements[0] || {});
  task2.innerText = reqText(m.requirements[1] || {});
  task3.innerText = reqText(m.requirements[2] || {});
  reward.innerText = `Reward: ${rewText(m.reward)}`;
}

function switchMission(num) {
  if (num !== mission) {
    buttonSwitch[mission - 1].classList.remove('currentpage');
    buttonSwitch[num - 1].classList.add('currentpage');
    mission = num;
    renderMission(num);
  }
}

function validateMission() {
  loadJSON('./api/set/updateRewards?mission=' + mission, (obj) => {
    if (obj.ok == true) {
      location.reload();
    } else {
      sendPopUp(obj.mes);
    }
  });
}

setTimeout(() => {
  titleReward   = document.getElementById('titleReward');
  imgReward     = document.getElementById('imgReward_1');
  infoReward    = document.getElementById('infoReward');
  task1         = document.getElementById('task1');
  task2         = document.getElementById('task2');
  task3         = document.getElementById('task3');
  reward        = document.getElementById('rewardText');
  buttonSwitch  = document.getElementsByClassName('tooltipHTML');

  loadJSON('./api/missions', (data) => {
    missionsData = data;
    renderMission(1);
  });
}, 0);
