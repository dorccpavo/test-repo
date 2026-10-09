const {generate} = require('../../utils/sudoku')
const STORAGE = 'sudoku-game-v1'
Page({
  data: {difficulty:0, levels:['轻松','进阶','挑战'], numbers:[1,2,3,4,5,6,7,8,9], cells:[], selected:-1, noteMode:false, elapsed:'00:00', mistakes:0, completed:false, remaining:81},
  onLoad() {
    const saved = wx.getStorageSync(STORAGE)
    if (saved && this.validSave(saved)) {
      this.game = saved
      this.setData({difficulty:saved.difficulty, mistakes:saved.mistakes, completed:saved.completed})
      this.render()
    } else this.newGame()
  },
  validSave(s) {
    return Array.isArray(s.solution) && s.solution.length === 81 && s.solution.every(v => Number.isInteger(v) && v >= 1 && v <= 9) && ['puzzle','board','notes'].every(key => Array.isArray(s[key]) && s[key].length === 81) && s.board.every(v => Number.isInteger(v) && v >= 0 && v <= 9) && s.notes.every(n => Array.isArray(n) && n.every(v => Number.isInteger(v) && v >= 1 && v <= 9)) && Number.isFinite(s.seconds) && s.seconds >= 0 && [0,1,2].includes(s.difficulty)
  },
  onShow() { this.startTimer() },
  onHide() { this.stopTimer(); this.save() },
  onUnload() { this.stopTimer(); this.save() },
  startTimer() {
    this.stopTimer()
    this.timer = setInterval(() => {
      if (!this.game || this.game.completed) return
      this.game.seconds++
      this.setData({elapsed:this.timeLabel()})
    },1000)
  },
  stopTimer() { if (this.timer) clearInterval(this.timer) },
  timeLabel() { const s = this.game.seconds; return `${String(Math.floor(s / 60)).padStart(2,'0')}:${String(s % 60).padStart(2,'0')}` },
  save() { if (this.game) wx.setStorageSync(STORAGE,this.game) },
  newGame() {
    const {puzzle,solution} = generate(this.data.difficulty)
    this.game = {puzzle,solution,board:puzzle.slice(),notes:Array.from({length:81},()=>[]),seconds:0,mistakes:0,difficulty:this.data.difficulty,completed:false}
    this.history = []
    this.setData({selected:-1,noteMode:false,mistakes:0,completed:false})
    this.render(); this.save()
  },
  requestNew() {
    wx.showModal({title:'开始新的一局？',content:'当前进度将被替换。',success:r=>{if(r.confirm)this.newGame()}})
  },
  changeDifficulty(e) {
    const next = Number(e.detail.value)
    if (next === this.data.difficulty) return
    wx.showModal({title:'切换难度？',content:'切换后会开始新的一局。',success:r=>{if(r.confirm){this.setData({difficulty:next});this.newGame()}}})
  },
  select(e) { this.setData({selected:Number(e.currentTarget.dataset.index)}); this.render() },
  toggleNotes() { this.setData({noteMode:!this.data.noteMode}) },
  snapshot() { (this.history || (this.history=[])).push({board:this.game.board.slice(),notes:this.game.notes.map(n=>n.slice())}) },
  enter(e) {
    const i = this.data.selected, value = Number(e.currentTarget.dataset.value)
    if (i < 0 || this.game.puzzle[i] || this.game.completed) return
    this.snapshot()
    if (this.data.noteMode) {
      if (this.game.board[i]) { this.history.pop(); return }
      const notes = this.game.notes[i]
      this.game.notes[i] = notes.includes(value) ? notes.filter(n=>n!==value) : notes.concat(value).sort()
    } else {
      this.game.board[i] = value; this.game.notes[i] = []
      if(value !== this.game.solution[i]) this.game.mistakes++
    }
    this.afterChange()
  },
  erase() {
    const i = this.data.selected
    if(i < 0 || this.game.puzzle[i] || this.game.completed) return
    this.snapshot(); this.game.board[i]=0; this.game.notes[i]=[]; this.afterChange()
  },
  undo() {
    if(this.game.completed || !this.history || !this.history.length) return
    const last = this.history.pop()
    this.game.board=last.board; this.game.notes=last.notes; this.afterChange()
  },
  hint() {
    if(this.game.completed) return
    let i = this.data.selected
    if(i < 0 || this.game.puzzle[i] || this.game.board[i] === this.game.solution[i]) i=this.game.board.findIndex((v,j)=>v!==this.game.solution[j])
    if(i<0)return
    this.snapshot(); this.game.board[i]=this.game.solution[i]; this.game.notes[i]=[]
    this.setData({selected:i}); this.afterChange()
  },
  afterChange() {
    this.game.completed=this.game.board.every((v,i)=>v===this.game.solution[i])
    this.render(); this.save()
    if(this.game.completed) wx.showModal({title:'恭喜完成！',content:`用时 ${this.timeLabel()}，累计错误 ${this.game.mistakes} 次。`,showCancel:false})
  },
  render() {
    const {board,puzzle,solution,notes} = this.game, selected=this.data.selected
    const row=Math.floor(selected/9), col=selected%9
    const cells=board.map((value,i)=>{
      const r=Math.floor(i/9),c=i%9
      const related=selected>=0 && (r===row || c===col || (Math.floor(r/3)===Math.floor(row/3)&&Math.floor(c/3)===Math.floor(col/3)))
      return {index:i,value:value||'',notes:[1,2,3,4,5,6,7,8,9].map(n=>notes[i].includes(n)?n:''),className:[puzzle[i]?'fixed':'editable',related?'related':'',selected>=0&&value&&value===board[selected]?'same':'',i===selected?'selected':'',value&&value!==solution[i]?'error':'',c===2||c===5?'box-right':'',r===2||r===5?'box-bottom':''].join(' ')}
    })
    this.setData({cells,elapsed:this.timeLabel(),mistakes:this.game.mistakes,completed:this.game.completed,remaining:board.filter(v=>!v).length})
  }
})
