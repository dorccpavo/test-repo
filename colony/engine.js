(function(root){
  const COLORS=[{name:'泥土',hex:'#ad6248'},{name:'草绿',hex:'#51cc63'},{name:'湖蓝',hex:'#55c9ee'},{name:'暖黄',hex:'#ffd54b'},{name:'莓红',hex:'#f24b69'},{name:'紫罗兰',hex:'#ac70ef'},{name:'云白',hex:'#edf6f4'},{name:'深灰',hex:'#444552'}]
  function art(level){
    const width=28,height=28,pixels=Array(width*height).fill(0)
    const set=(x,y,c)=>{if(x>=0&&x<width&&y>=0&&y<height)pixels[y*width+x]=c}
    const rect=(x,y,w,h,c)=>{for(let j=y;j<y+h;j++)for(let i=x;i<x+w;i++)set(i,j,c)}
    if(level%3===1){
      rect(0,0,28,10,2);rect(0,10,28,2,6);rect(0,22,28,6,1)
      rect(18,2,5,5,3);rect(17,3,7,3,3)
      rect(5,14,18,7,4);rect(4,16,20,3,4);rect(8,21,12,2,7)
      rect(13,5,1,13,7)
      for(let y=5;y<15;y++)rect(14,y,Math.min(9,y-4),1,6)
      for(let y=8;y<16;y++)rect(13-(y-7),y,y-7,1,3)
      rect(2,24,4,1,3);rect(22,25,4,1,3)
    }else if(level%3===2){
      rect(0,0,28,28,2);rect(0,21,28,7,1)
      for(const [x,y,c] of [[7,9,4],[20,12,5],[13,4,3]]){
        rect(x,y+3,1,13,1);rect(x-3,y-1,7,3,c);rect(x-4,y,9,3,c);rect(x-2,y-3,5,7,c);rect(x-1,y-1,3,3,3);rect(x+1,y+7,3,2,1)
      }
      rect(1,3,5,2,6);rect(21,4,5,2,6)
    }else{
      rect(0,0,28,28,5);rect(0,23,28,5,1)
      rect(6,14,16,10,3);rect(10,17,5,7,0);rect(18,16,3,4,2)
      for(let y=5;y<14;y++)rect(14-(y-4),y,(y-4)*2,1,4)
      rect(20,5,2,6,7);rect(21,3,3,1,6)
      rect(2,3,5,3,6);rect(4,2,3,1,6);rect(23,18,3,5,1)
    }
    return {width,height,pixels}
  }
  function exposed(state,index){
    const {width,height,pixels}=state,x=index%width,y=Math.floor(index/width)
    return pixels[index]>=0&&(x===0||y===0||x===width-1||y===height-1||pixels[index-1]===-1||pixels[index+1]===-1||pixels[index-width]===-1||pixels[index+width]===-1)
  }
  function available(state,color){return state.pixels.findIndex((v,i)=>v===color&&exposed(state,i))}
  function create(level=1){
    const image=art(level),simulation={...image,pixels:image.pixels.slice()},order=[]
    while(simulation.pixels.some(v=>v>=0)){
      const counts=COLORS.map((_,c)=>simulation.pixels.reduce((n,v,i)=>n+(v===c&&exposed(simulation,i)?1:0),0))
      const color=counts.indexOf(Math.max(...counts)),limit=level===1?28:22
      let count=0
      while(count<limit){const i=available(simulation,color);if(i<0)break;simulation.pixels[i]=-1;count++}
      order.push({color,count})
    }
    const stacks=Array.from({length:4},()=>[])
    order.forEach((box,i)=>stacks[i%4].push({...box,id:i}))
    return {...image,level,stacks,slots:Array(5).fill(null),removed:0,total:image.pixels.length,moves:0,status:'playing',lastMove:null}
  }
  function activate(state,column){
    if(state.status!=='playing')return false
    const slot=state.slots.indexOf(null),box=state.stacks[column]?.[0]
    if(slot<0||!box)return false
    state.lastMove=JSON.stringify({...state,lastMove:null})
    state.slots[slot]={...box};state.stacks[column].shift();state.moves++;settle(state);return true
  }
  function settle(state){
    if(state.removed===state.total)state.status='won'
    else if(state.slots.every(Boolean)&&state.slots.every(box=>available(state,box.color)<0))state.status='lost'
  }
  function harvest(state,slot,index){
    const box=state.slots[slot]
    if(state.status!=='playing'||!box||state.pixels[index]!==box.color||!exposed(state,index))return false
    state.pixels[index]=-1;state.removed++;box.count--
    if(box.count===0)state.slots[slot]=null
    settle(state);return true
  }
  function tick(state,budget=2){
    if(state.status!=='playing')return []
    const events=[]
    state.slots.forEach((box,slot)=>{
      if(!box)return
      for(let n=0;n<budget&&box.count>0;n++){
        const index=available(state,box.color);if(index<0)break
        state.pixels[index]=-1;state.removed++;box.count--;events.push({index,color:box.color,slot})
      }
      if(box.count===0)state.slots[slot]=null
    })
    settle(state)
    return events
  }
  function undo(state){return state.lastMove?JSON.parse(state.lastMove):null}
  function hint(state){return state.stacks.findIndex(stack=>stack.length&&available(state,stack[0].color)>=0)}
  const api={COLORS,create,activate,tick,undo,hint,available,exposed,harvest,settle}
  if(typeof module!=='undefined')module.exports=api;else root.Colony=api
})(globalThis)
