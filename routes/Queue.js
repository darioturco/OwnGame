class Queue {
  constructor() {
    this.queue = [];
  }

  // Agrega un objeto ordendolo por time
  addElement(obj){ // obj = {time: Int, player: String}
    let pri = 0;
    let fin = this.queue.length - 1;
    let mid = Math.floor((pri+fin) / 2);
    while(pri <= fin){
      if(this.queue[mid].time == obj.time){
        if(this.queue[mid].player != obj.player){
          this.queue.splice(mid, 0, obj);
        }
        return;
      }else if(this.queue[mid].time < obj.time){
        pri = mid + 1;
      }else{
        fin = mid - 1;
      }
      mid = Math.floor((pri+fin) / 2);
    }
    this.queue.splice(mid+1, 0, obj);
    return;
  }

  next(){
    if(this.queue.length > 0){
      return this.queue[0];
    }else{
      return undefined;
    }
  }

  useNext(){
    return this.queue.shift();
  }

  remove(obj){
    let pri = 0;
    let fin = this.queue.length - 1;
    let mid = Math.floor((pri+fin) / 2);
    while(pri <= fin){
      if(this.queue[mid].time == obj.time){
        if(this.queue[mid].player == obj.player){
          this.queue.splice(mid, 1);
          return true;
        }else{
          return false;
        }
      }else if(this.queue[mid].time < obj.time){
        pri = mid + 1;
      }else{
        fin = mid - 1;
      }
      mid = Math.floor((pri+fin) / 2);
    }
    return false;
  }

  get length(){
    return this.queue.length;
  }

  get isEmpty(){
    return this.queue.length == 0;
  }
}

const exp = {
  Queue: Queue
};

module.exports = exp;
