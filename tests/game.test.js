const test = require('node:test')
const assert = require('node:assert/strict')
let definition, stored
global.Page = value => { definition=value }
global.wx = {getStorageSync:()=>stored,setStorageSync:(_,value)=>{stored=JSON.parse(JSON.stringify(value))},showModal:()=>{}}
require('../pages/game/game')
function page() {
  const p={...definition,data:JSON.parse(JSON.stringify(definition.data)),setData(values){Object.assign(this.data,values)}}
  p.onLoad()
  return p
}
test('input, notes, undo, fixed cells, save and completion',()=>{
  stored=null
  const p=page(), i=p.game.puzzle.indexOf(0)
  p.select({currentTarget:{dataset:{index:i}}})
  p.toggleNotes()
  p.enter({currentTarget:{dataset:{value:3}}})
  assert.deepEqual(p.game.notes[i],[3]); assert.equal(p.game.board[i],0)
  p.toggleNotes()
  const wrong=p.game.solution[i]%9+1
  p.enter({currentTarget:{dataset:{value:wrong}}})
  assert.equal(p.game.mistakes,1); assert.ok(p.data.cells[i].className.includes('error'))
  p.undo(); assert.equal(p.game.board[i],0); assert.deepEqual(p.game.notes[i],[3])
  p.hint(); assert.equal(p.game.board[i],p.game.solution[i])
  const resumed=page(); assert.deepEqual(resumed.game.board,p.game.board)
  const fixed=p.game.puzzle.findIndex(v=>v)
  p.select({currentTarget:{dataset:{index:fixed}}}); p.erase()
  assert.equal(p.game.board[fixed],p.game.puzzle[fixed])
  p.game.board=p.game.solution.slice(); p.afterChange()
  assert.equal(p.data.completed,true); assert.equal(p.data.remaining,0)
})
