function shuffle(values) {
  const result = values.slice()
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[result[i], result[j]] = [result[j], result[i]]
  }
  return result
}
function candidates(board, index) {
  const row = Math.floor(index / 9), col = index % 9
  return [1,2,3,4,5,6,7,8,9].filter(value => {
    for (let k = 0; k < 9; k++) {
      if (board[row * 9 + k] === value || board[k * 9 + col] === value) return false
      const r = Math.floor(row / 3) * 3 + Math.floor(k / 3)
      const c = Math.floor(col / 3) * 3 + k % 3
      if (board[r * 9 + c] === value) return false
    }
    return true
  })
}
function countSolutions(input, limit = 2) {
  const board = input.slice()
  function search() {
    let index = -1, options = null
    for (let i = 0; i < 81; i++) {
      if (board[i]) continue
      const values = candidates(board, i)
      if (!values.length) return 0
      if (!options || values.length < options.length) { index = i; options = values }
    }
    if (index === -1) return 1
    let count = 0
    for (const value of options) {
      board[index] = value
      count += search()
      if (count >= limit) break
    }
    board[index] = 0
    return count
  }
  return search()
}
function generate(difficulty = 0) {
  const order = () => shuffle([0,1,2]).flatMap(group => shuffle([0,1,2]).map(i => group * 3 + i))
  const rows = order(), cols = order(), digits = shuffle([1,2,3,4,5,6,7,8,9])
  const solution = rows.flatMap(r => cols.map(c => digits[(r * 3 + Math.floor(r / 3) + c) % 9]))
  const puzzle = solution.slice(), target = [38,46,52][difficulty] || 38
  let removed = 0
  for (const index of shuffle(Array.from({length:81}, (_, i) => i))) {
    const old = puzzle[index]
    puzzle[index] = 0
    if (countSolutions(puzzle) !== 1) puzzle[index] = old
    else removed++
    if (removed >= target) break
  }
  return {puzzle, solution}
}
module.exports = {generate, countSolutions, candidates}
