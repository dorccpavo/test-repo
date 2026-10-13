const test=require('node:test')
const assert=require('node:assert/strict')
const {create,activate,tick,undo,available}=require('../colony/engine')
test('all three pictures have exact supplies and a reachable winning sequence',()=>{
  for(let level=1;level<=3;level++){
    const s=create(level),counts=Array(8).fill(0),supply=Array(8).fill(0)
    s.pixels.forEach(c=>counts[c]++)
    s.stacks.flat().forEach(b=>supply[b.color]+=b.count)
    assert.deepEqual(supply,counts)
    const order=s.stacks.flat().sort((a,b)=>a.id-b.id)
    for(const box of order){
      const column=s.stacks.findIndex(stack=>stack[0]?.id===box.id)
      assert.ok(column>=0);assert.equal(activate(s,column),true)
      let guard=0
      while(s.slots.some(Boolean)&&guard++<100)tick(s,3)
      assert.ok(guard<100,'generated sequence must not stall')
    }
    assert.equal(s.status,'won');assert.equal(s.removed,s.total)
  }
})
test('capacity, pause-independent model undo, and blocked loss',()=>{
  const s=create();const before=JSON.stringify(s)
  assert.ok(activate(s,0));tick(s)
  assert.equal(JSON.stringify(undo(s)),before)
  for(let i=0;i<4;i++)activate(s,i)
  assert.equal(activate(s,0),false)
  const stuck=create();stuck.pixels.fill(0);stuck.slots=Array.from({length:5},()=>({color:1,count:5,id:0}))
  assert.equal(available(stuck,1),-1);tick(stuck);assert.equal(stuck.status,'lost')
})
