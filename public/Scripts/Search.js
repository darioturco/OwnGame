var inputIn;
var rows, playerSearch, planetSearch, coorSearch, coordinatesLink;
setTimeout(() => {
  inputIn = document.getElementById('inputSearchPlayer');
  rows = document.getElementsByClassName('rowSearch');
  playerSearch = document.getElementsByClassName('playerSearch');
  planetSearch = document.getElementsByClassName('planetSearch');
  coorSearch = document.getElementsByClassName('coorSearch');
  coordinatesLink = document.getElementsByClassName('coordinatesLink');
}, 0);

function setSearch(){
  let playerName = inputIn.value;
  loadJSON('./api/searchPlayer?name=' + playerName, (obj) => {
    if(obj.ok == true){
      for(let i = 0 ; i<8 ; i++){
        if(i < obj.names.length){
          rows[i].style.display = 'table-row';
          playerSearch[i].innerText = playerName;
          planetSearch[i].innerText = obj.names[i];
          coorSearch[i].innerText = '[' + obj.coors[i].galaxy + ':' + obj.coors[i].system + ':' + obj.coors[i].pos + ']';
          coordinatesLink[i].href = './Ogame_Galaxy.html?gal=' + obj.coors[i].galaxy + '&sys=' + obj.coors[i].system;//coordinatesLink
        }else{
          rows[i].style.display = 'none';
        }
      }
    }else{
      inputIn.value = "Not Found";
    }
  });
}
