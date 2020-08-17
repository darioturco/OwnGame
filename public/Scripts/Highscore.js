var dropDown;
var dropDownAll;
var prendido = true;
var info = null;
var pag = -1;
var listPos, listLast, listName, listPoints;

setTimeout(() => {
  dropDown = document.getElementById('dropDown');
  dropDownAll = document.getElementById('dropDownList');
  listPos = document.getElementsByClassName('positionField');
  listLast = document.getElementsByClassName('stats_counter');
  listName = document.getElementsByClassName('playername');
  listPoints = document.getElementsByClassName('scoreField');
  loadJSON('./api/highscore', (res) => {
    info = res.info;
    changePag(parseInt(dropDown.dataset.pag));
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
    for(let i = 0 ; i<100 ; i++){//actualiza toda la info
      let num = pag*100-99+i;
      listPos[i].innerText = num;
      if(info[num-1] == undefined){
        listLast[i].classList.remove('undermark');
        listLast[i].classList.remove('overmark');
        listLast[i].innerText = '-';
        listName[i].innerText = '-';
        listPoints[i].innerText = '-';
      }else{
        listLast[i].classList.remove('undermark');
        listLast[i].classList.remove('overmark');
        // falta setear listLats
        //listLast[i].innerText = ;
        listName[i].innerText = info[num-1].name;
        listPoints[i].innerText = info[num-1].points;

      }
    }
  }

  clickDropDown();
}

function goToGalaxyByHishcore(pos){
  window.location = './Ogame_Galaxy.html?gal=' + info[pos-1].coor.gal + '&sys=' + info[pos-1].coor.sys;
  console.log(pos);
}
