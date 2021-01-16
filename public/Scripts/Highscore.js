var dropDown;
var dropDownAll;
var prendido = true;
var info = null;
var pag = -1;
var listPos, listLast, listName, listPoints, listCoor;
var highscoreSpan;
var position;

setTimeout(() => {
  dropDown = document.getElementById('dropDown');
  dropDownAll = document.getElementById('dropDownList');
  highscoreSpan = document.getElementById('highscoreSpan');
  listPos = document.getElementsByClassName('positionField');
  listLast = document.getElementsByClassName('stats_counter');
  listName = document.getElementsByClassName('playername');
  listPoints = document.getElementsByClassName('scoreField');
  listCoor = document.getElementsByClassName('coorPlayer');
  loadJSON('./api/highscore', (res) => {
    info = res.info;
    position = res.newPos;
    highscoreSpan.innerText = '(' + position + ')';
    changePag(calculatePag(position));
    console.log(res.info);
  });
}, 0);

function clickDropDown(){
  if(prendido == true){
    dropDownAll.style.display = 'none';
  }else{
    dropDownAll.style.display = 'block';
  }
  prendido = !prendido;
}

function changePag(n){
  if(pag != n){
    pag = n;
    dropDown.innerText = (n*100-99) + ' - ' + (n*100)
    let num;
    let change = 0;
    for(let i = 0 ; i<100 ; i++){ // Actualiza toda la info
      num = pag*100-99+i;
      listPos[i].innerText = num;
      if(info[num-1] == undefined){
        listLast[i].classList.remove('undermark');
        listLast[i].classList.remove('overmark');
        listLast[i].innerText = '-';
        listName[i].innerText = '-';
        listPoints[i].innerText = '-';
        listCoor[i].innerText = '-';
      }else{
        change = info[num-1].lastRank - info[num-1].rank;
        listLast[i].classList.remove('undermark');
        listLast[i].classList.remove('overmark');
        listLast[i].innerText = '';
        if(change > 0){
          listLast[i].innerText = '+ ';
          listLast[i].classList.add('undermark');
        }else if (change < 0){
          listLast[i].innerText = '- ';
          listLast[i].classList.add('overmark');
        }
        listLast[i].innerText += Math.abs(change);
        listName[i].innerText = info[num-1].name;
        listPoints[i].innerText = info[num-1].points;
        listCoor[i].innerText = '[' + info[num-1].coor.gal + ':' + info[num-1].coor.sys + ':' + info[num-1].coor.pos + ']';
      }
    }
  }
  clickDropDown();
}

function calculatePag(n){
  return Math.floor(n/100) + 1;
}

function goToGalaxyByHishcore(pos){
  if(info[pos-1] != undefined){
    window.location = './Ogame_Galaxy.html?gal=' + info[pos-1].coor.gal + '&sys=' + info[pos-1].coor.sys;
  }
}

function goToPlayerOverview(pos){
  if(info[pos-1] != undefined){
    window.location = './Change.html?name=' + info[pos-1].name;
  }
}
