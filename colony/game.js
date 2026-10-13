const $=id=>document.getElementById(id)
const KEY='ant-colony-v1'
let state,paused=false,particles=[],lastFrame=0,clock=0,hinted=-1
const reducedMotion=matchMedia('(prefers-reduced-motion: reduce)').matches
function valid(s){return s&&s.width===28&&s.height===28&&Array.isArray(s.pixels)&&s.pixels.length===784&&s.pixels.every(v=>Number.isInteger(v)&&v>=-1&&v<8)&&Number.isInteger(s.level)&&s.level>0&&s.level<=999&&s.total===784&&s.removed===s.pixels.filter(v=>v===-1).length&&Number.isInteger(s.moves)&&s.moves>=0&&['playing','won','lost'].includes(s.status)&&Array.isArray(s.stacks)&&s.stacks.length===4&&s.stacks.every(a=>Array.isArray(a)&&a.every(validBox))&&Array.isArray(s.slots)&&s.slots.length===5&&s.slots.every(b=>b===null||validBox(b))&&(!s.lastMove||typeof s.lastMove==='string')}
function validBox(b){return b&&Number.isInteger(b.color)&&b.color>=0&&b.color<8&&Number.isInteger(b.count)&&b.count>0&&b.count<=28&&Number.isInteger(b.id)}
function save(){try{localStorage.setItem(KEY,JSON.stringify(state))}catch(_){$('save-status').textContent='本浏览器无法保存进度'}}
try{const saved=JSON.parse(localStorage.getItem(KEY));if(valid(saved))state=saved}catch(_){}
if(!state)state=Colony.create(1)
function start(level){state=Colony.create(level);paused=false;particles=[];hinted=-1;clock=0;render();save()}
function boxElement(box,tag='div'){const el=document.createElement(tag);el.className='box';el.style.setProperty('--color',Colony.COLORS[box.color].hex);el.textContent=box.count;el.setAttribute('aria-label',`${Colony.COLORS[box.color].name}方块，${box.count}个像素`);return el}
function render(){
  $('level').textContent=state.level
  $('progress-fill').style.width=`${state.removed/state.total*100}%`
  $('progress-text').textContent=`搬运进度 ${Math.floor(state.removed/state.total*100)}%`
  $('moves').textContent=`投放 ${state.moves} 次`
  const slots=$('slots');slots.replaceChildren()
  state.slots.forEach((box,i)=>{const el=document.createElement('div');el.className='slot';el.setAttribute('aria-label',`工作槽 ${i+1}`);if(box){const b=boxElement(box);if(Colony.available(state,box.color)<0)b.classList.add('waiting');el.append(b)}else{el.classList.add('empty');el.textContent='·'}slots.append(el)})
  $('slot-count').textContent=`${state.slots.filter(Boolean).length} / 5`
  const stacks=$('stacks');stacks.replaceChildren()
  state.stacks.forEach((stack,column)=>{const el=document.createElement('div');el.className='stack';if(stack.length){for(let depth=Math.min(2,stack.length-1);depth>=1;depth--){const behind=boxElement(stack[depth]);behind.classList.add('behind');if(depth===2)behind.classList.add('second');behind.setAttribute('aria-hidden','true');el.append(behind)}const top=boxElement(stack[0],'button');top.dataset.column=column;top.disabled=paused||state.status!=='playing'||!state.slots.includes(null);if(hinted===column)top.classList.add('hinted');top.addEventListener('click',()=>{if(paused)return;if(Colony.activate(state,column)){hinted=-1;render();save()}});el.append(top)}else{const done=document.createElement('div');done.className='finished-stack';done.textContent='✓';el.append(done)}const label=document.createElement('span');label.className='depth';label.textContent=stack.length?`剩余 ${stack.length} 盒`:'已搬空';el.append(label);stacks.append(el)})
  $('undo').disabled=!state.lastMove||paused
  $('hint').disabled=paused||state.status!=='playing'
  $('pause').textContent=paused?'▶':'Ⅱ';$('pause').setAttribute('aria-label',paused?'继续游戏':'暂停游戏')
  const active=state.slots.filter(Boolean),working=active.some(b=>Colony.available(state,b.color)>=0)
  $('message').textContent=hinted>=0?'亮起的方块可以搬走当前露出的像素':active.length&&!working?'当前颜色被挡住了，试试露在外面的颜色':!state.slots.includes(null)?'工作槽已满，等待蚂蚁搬空方块':'选择下方方块，让同色蚂蚁开始搬运'
  const overlay=$('overlay');overlay.hidden=!paused&&state.status==='playing'
  if(paused){$('overlay-title').textContent='休息一下';$('overlay-text').textContent='蚂蚁也在等你回来，进度已保存。';$('overlay-action').textContent='继续游戏'}
  else if(state.status==='won'){$('overlay-title').textContent='搬运完成！';$('overlay-text').textContent=`${state.moves} 次投放，像素图案全部清空。准备挑战下一幅图案？`;$('overlay-action').textContent='下一关'}
  else if(state.status==='lost'){$('overlay-title').textContent='工作槽堵住了';$('overlay-text').textContent='所有方块的颜色都被挡住了。撤销上一次投放，或重新挑战。';$('overlay-action').textContent='重新挑战'}
  drawPicture()
}
function setupCanvas(canvas){const ratio=Math.min(devicePixelRatio||1,2),w=canvas.clientWidth,h=canvas.clientHeight;if(canvas.width!==Math.round(w*ratio)||canvas.height!==Math.round(h*ratio)){canvas.width=Math.round(w*ratio);canvas.height=Math.round(h*ratio)}const ctx=canvas.getContext('2d');ctx.setTransform(ratio,0,0,ratio,0,0);ctx.clearRect(0,0,w,h);return {ctx,w,h}}
function drawPicture(){const {ctx,w,h}=setupCanvas($('picture')),cw=w/state.width,ch=h/state.height;ctx.fillStyle='#875239';ctx.fillRect(0,0,w,h);state.pixels.forEach((color,i)=>{if(color<0)return;const x=(i%state.width)*cw,y=Math.floor(i/state.width)*ch;ctx.fillStyle=Colony.COLORS[color].hex;ctx.fillRect(x+.5,y+.5,cw-1,ch-1);ctx.fillStyle='#ffffff28';ctx.fillRect(x+1,y+1,cw-2,Math.max(1,ch*.18));ctx.fillStyle='#00000018';ctx.fillRect(x+1,y+ch*.78,cw-2,ch*.15)});for(const p of particles){const age=performance.now()-p.born;if(age>650)continue;const x=(p.index%28+.5)*cw,y=(Math.floor(p.index/28)+.5)*ch+age*.025;ctx.globalAlpha=1-age/650;ctx.fillStyle=Colony.COLORS[p.color].hex;ctx.fillRect(x-cw*.3,y-ch*.3,cw*.6,ch*.6);ctx.globalAlpha=1}}
function drawAnt(ctx,x,y,angle,color,phase){ctx.save();ctx.translate(x,y);ctx.rotate(angle);ctx.strokeStyle='#6b3e27';ctx.lineWidth=1.5;for(let i=-1;i<=1;i++){const swing=Math.sin(phase+i)*2;ctx.beginPath();ctx.moveTo(i*3,0);ctx.lineTo(i*3+swing,6);ctx.lineTo(i*3+3,9);ctx.moveTo(i*3,0);ctx.lineTo(i*3-swing,-6);ctx.lineTo(i*3+3,-9);ctx.stroke()}ctx.fillStyle='#8b5135';for(const [a,r] of [[-6,4.5],[0,3],[5,3]]){ctx.beginPath();ctx.ellipse(a,0,r,r*.8,0,0,Math.PI*2);ctx.fill()}ctx.fillStyle='#33251a';ctx.fillRect(6,-2,2,1);ctx.fillRect(6,1,2,1);if(color!==null){ctx.fillStyle=Colony.COLORS[color].hex;ctx.fillRect(9,-3,6,6)}ctx.restore()}
function drawAnts(time){const {ctx,w,h}=setupCanvas($('ants'));state.slots.forEach((box,slot)=>{if(!box||Colony.available(state,box.color)<0)return;for(let n=0;n<2;n++){const t=((time/1800+n*.5+slot*.13)%1),x=(slot+.5)*w/5+(w/2-(slot+.5)*w/5)*t,y=9+(h-25)*t;drawAnt(ctx,x,y,Math.atan2(h-25,w/2-(slot+.5)*w/5),box.color,time/90+n)}})}
function frame(time){const elapsed=lastFrame?Math.min(time-lastFrame,250):0;lastFrame=time;if(!paused&&!document.hidden&&state.status==='playing'&&!$('instructions').open){clock+=elapsed;if(clock>=180){clock=0;const events=Colony.tick(state,1);if(!reducedMotion)particles.push(...events.map(e=>({...e,born:time})));if(events.length||state.status!=='playing'){render();save()}}particles=particles.filter(p=>time-p.born<650);if(particles.length)drawPicture();drawAnts(time)}requestAnimationFrame(frame)}
$('pause').addEventListener('click',()=>{if(state.status!=='playing')return;paused=!paused;render();save()})
$('restart').addEventListener('click',()=>{if(confirm('重新开始本关？当前搬运进度将被替换。'))start(state.level)})
$('overlay-action').addEventListener('click',()=>{if(paused){paused=false;render()}else start(state.status==='won'?Math.min(999,state.level+1):state.level)})
$('undo').addEventListener('click',()=>{try{const previous=Colony.undo(state);if(previous&&valid(previous)){state=previous;particles=[];hinted=-1;render();save()}}catch(_){state.lastMove=null;render()}})
$('hint').addEventListener('click',()=>{hinted=Colony.hint(state);render();if(hinted<0)$('message').textContent='暂时没有可用的顶部方块。等待工作槽腾空，或撤销上次投放。'})
$('help').addEventListener('click',()=>{$('instructions').showModal()})
$('close-help').addEventListener('click',()=>{$('instructions').close()})
window.addEventListener('resize',()=>{drawPicture();drawAnts(performance.now())})
document.addEventListener('visibilitychange',()=>{lastFrame=0;clock=0;save()})
window.addEventListener('pagehide',save)
render();requestAnimationFrame(frame)
