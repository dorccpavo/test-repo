const test = require('node:test')
const assert = require('node:assert/strict')
const {generate,countSolutions} = require('../utils/sudoku')
for(const difficulty of [0,1,2]) test(`difficulty ${difficulty}: valid grid and unique puzzle`,()=>{
  for(let round=0;round<3;round++) {
    const {puzzle,solution} = generate(difficulty)
    const valid = values => assert.deepEqual(values.slice().sort(),[1,2,3,4,5,6,7,8,9])
    for(let i=0;i<9;i++) {
      valid(solution.slice(i*9,i*9+9))
      valid(Array.from({length:9},(_,r)=>solution[r*9+i]))
      valid(Array.from({length:9},(_,k)=>solution[(Math.floor(i/3)*3+Math.floor(k/3))*9+(i%3)*3+k%3]))
    }
    assert.equal(countSolutions(puzzle),1)
    assert.ok(puzzle.filter(v=>!v).length>=30)
    puzzle.forEach((v,i)=>{if(v)assert.equal(v,solution[i])})
  }
})
