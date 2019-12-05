var buttonSwitch, imgReward, titleReward, infoReward, task1, task2, task3, reward;
var titleList = ['Basic supply', 'Planet defence', 'Planet supplies', 'The first ship', 'Fleet action', 'Deep space', 'Expanding your empire', 'Empire supplies', 'Debris field', 'Battle Army'];
var rewardList = ['200 units metal + 100 units crystal', '+1 rocket launcher', '2,000 metal + 500 crystals', '1500 deuterium', ' 2 espionage probes', '2 heavy fighters, 5 small cargoes', '1 large cargo, 3 small cargoes, 5000 of each resorces', '7500 metal, 5000 crystal, 2000 deuterium', '1 recycler', '10 light fighters, 3 heavy fighters, 1 Battleship'];
var task1List = ['Upgrade metal mine to level 4','Upgrade the deuterium synthesizer to level 2','Upgrade your metal mine onto level 10','Build a research laboratory with level 1','Research the combustion drive on level 3','Research the impulse drive on level 1','Research the impulse drive on level 3','Upgrade your metal mine onto level 17','Research the combustion drive on level 6','Research the ion technology on level 2'];
var task2List = ['Upgrade crystal mine to level 2','Build a shipyard of level 1','Upgrade your crystal mine onto level 7','Research the combustion drive on level 2','Research the espionage technology on level 2','Research the armour technology on level 1','Build a colony ship','Upgrade your crystal mine onto level 15','Research the shielding technology on level 2','Research the impulse drive on level 4'];
var task3List = ['Upgrade solar power plant to level 4','Build a rocket launcher','Upgrade the deuterium synthesizer to level 5','Build a small cargo','Build an espionage probe','Research the astrophysics on level 1','Found a colony','Upgrade the deuterium synthesizer to level 12','Build a recycler','Build 2 crusiers'];
var infoList = ['To expand your home planet you first of all, will need enough resources. You can produce these via mines. Secure your basic supply by expanding your metal and crystal mines. Please note that the upkeep of supply buildings use up a lot of energy. You can produce this energy by, for example, using solar power plants.',
                'To protect your resources from enemy pillagers, you should think about the expansion of your defence facilities early on. You can, for example, read up about what you need to build a rocket launcher in the rocket launcher techtree. You need deuterium to expand your defence facilities. Hence you should establish a basic production of this resource first.',
                'After the foundations for supply have been laid, you should intensify them. Please always make sure there is enough energy available.',
                'Ships as well as rocket launchers can protect you from opponents. They have the advantage that they can additionally be used for offensive purposes. However, ships and modern defence facilities have to be researched first. You will need a research lab to do that.',
                'Another way to get hold of resources is to pillage foreign planets. However, beware that some planets are very well protected. To find out information about foreign planets, you can spy on them.',
                'The universe is an endless ocean of space. Time and time again, researchers attempt to explore unknown territories and come across opponents, abnormalities and new resource sources. A respected emperor like you should allow yourself this luxury and send some brave researchers on expeditions. Simple espionage probes do not have a sufficient range and deliver inaccurate data.',
                'An emperor is always anxious to expand his empire. You have already laid the foundations for this on your home planet, but at some point it will be completely expanded. Develop new planets early on, to get hold of resources more quickly and to get hold of new building spaces. Through flexible air traffic between the planets, you also have a powerful device to protect your resources from enemy attacks.',
                'An empire need ha produccion stable of basic resources, the mines that are support by a stable energy system are ideal but sometimes, is not easy rech it. To buy a solar satelite can be a good and chep idea for get a efficien energy system for the produccion. But be carfull one attack y all will be red.',
                'After fighting in the Orbit, debris fields are formed from metal- and crystal residues from fired ships. The decomposition of this debris offers you an important alternative method to win resources.',
                'You need a army for attack other player a get a lot of resources. This strategy can be boosted with a fleet of recicles that grab the debris of the enemy army and some lost of your fleet, you just need to be preparete. After that are ready for play Ogame like you want.']
var mission = 1;

setTimeout(() => {
  titleReward = document.getElementById('titleReward');
  imgReward = document.getElementById('imgReward_1');
  infoReward = document.getElementById('infoReward');
  task1 = document.getElementById('task1');
  task2 = document.getElementById('task2');
  task3 = document.getElementById('task3');
  reward = document.getElementById('rewardText');
  buttonSwitch = document.getElementsByClassName('tooltipHTML');
}, 0);

function switchMission(num){
  if(num != mission){
    buttonSwitch[mission-1].classList.remove('currentpage');
    buttonSwitch[num-1].classList.add('currentpage');
    titleReward.innerText = 'Task ' + num + ' - ' + titleList[num-1];
    imgReward.id = 'imgReward_' + num;
    task1.innerText = task1List[num-1];
    task2.innerText = task2List[num-1];
    task3.innerText = task3List[num-1];
    reward.innerText = 'Reward: ' + rewardList[num-1];
    infoReward.innerText = infoList[num-1];
    mission = num;
  }
}

function validateMission(){
  console.log(mission);
}
