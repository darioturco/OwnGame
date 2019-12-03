var imgReward, titleReward, infoReward, task1, task2, task3, reward;
var titleList = ['Basic supply','Planet defence','Planet supplies','The first ship','Fleet action','Deep space','Expanding your empire','Empire supplies','Debris field','Battle Army'];
var mission = 1;

setTimeout(() => {
  titleReward = document.getElementById('titleReward');
  imgReward = document.getElementById('imgReward_1');
  infoReward = document.getElementById('infoReward');
  task1 = document.getElementById('task1');
  task2 = document.getElementById('task2');
  task3 = document.getElementById('task3');
  reward = document.getElementById('rewardText');
}, 0);


function switchMission(num){
  if(num != mission){
    titleReward.innerText = 'Task ' + num + ' - ' + titleList[num-1];
    imgReward.id = 'imgReward_' + num;

    mission = num;
  }
}
