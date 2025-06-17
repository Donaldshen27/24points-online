// pages/game/game.js
const app = getApp()
const Calculator = require('../../utils/calculator')

Page({
  data: {
    roomCode: '',
    gameState: 'WAITING', // WAITING, PLAYING, SOLVING, ROUND_END, GAME_OVER
    centerCards: [],
    playerCards: [],
    opponent: {
      name: '',
      cardCount: 10,
      cards: []
    },
    player: {
      name: '',
      cardCount: 10
    },
    selectedCards: [],
    solutionSteps: [],
    currentOperation: null,
    isSolving: false,
    countdown: 30,
    statusMessage: '',
    isWinner: false,
    gameOverMessage: '',
    countdownTimer: null
  },

  onLoad(options) {
    const { roomCode } = options
    this.setData({ roomCode })
    
    // 设置WebSocket事件监听
    this.setupSocketListeners()
    
    // 加入房间
    app.sendSocketMessage('join-room', { roomCode })
  },

  onUnload() {
    // 清理定时器
    if (this.data.countdownTimer) {
      clearInterval(this.data.countdownTimer)
    }
    
    // 离开房间
    app.sendSocketMessage('leave-room', { roomCode: this.data.roomCode })
  },

  setupSocketListeners() {
    // 使用事件总线监听Socket消息
    if (!app.globalData.eventBus) {
      app.globalData.eventBus = {
        handlers: {},
        on(event, handler) {
          if (!this.handlers[event]) {
            this.handlers[event] = []
          }
          this.handlers[event].push(handler)
        },
        emit(event, data) {
          if (this.handlers[event]) {
            this.handlers[event].forEach(handler => handler(data))
          }
        },
        off(event, handler) {
          if (this.handlers[event]) {
            this.handlers[event] = this.handlers[event].filter(h => h !== handler)
          }
        }
      }
    }

    const eventBus = app.globalData.eventBus

    // 游戏开始
    eventBus.on('game-started', (data) => {
      this.handleGameStarted(data)
    })

    // 新回合
    eventBus.on('new-round', (data) => {
      this.handleNewRound(data)
    })

    // 玩家抢答
    eventBus.on('player-claiming', (data) => {
      this.handlePlayerClaiming(data)
    })

    // 回合结束
    eventBus.on('round-ended', (data) => {
      this.handleRoundEnded(data)
    })

    // 游戏结束
    eventBus.on('game-over', (data) => {
      this.handleGameOver(data)
    })

    // 玩家断线
    eventBus.on('player-disconnected', (data) => {
      wx.showToast({
        title: '对手已断线',
        icon: 'none'
      })
    })
  },

  handleGameStarted(data) {
    const { players, currentPlayer } = data
    const opponent = players.find(p => p.id !== app.globalData.playerId)
    
    this.setData({
      gameState: 'PLAYING',
      player: {
        name: currentPlayer.name,
        cardCount: 10
      },
      opponent: {
        name: opponent.name,
        cardCount: 10,
        cards: Array(10).fill({})
      }
    })
  },

  handleNewRound(data) {
    const { centerCards } = data
    
    this.setData({
      gameState: 'PLAYING',
      centerCards: centerCards.map(card => ({
        ...card,
        selected: false
      })),
      selectedCards: [],
      solutionSteps: [],
      isSolving: false,
      statusMessage: '寻找等于24的组合'
    })
  },

  handlePlayerClaiming(data) {
    const { playerId } = data
    const isMe = playerId === app.globalData.playerId
    
    if (isMe) {
      this.startSolving()
    } else {
      this.setData({
        statusMessage: '对手正在解答...'
      })
    }
  },

  handleRoundEnded(data) {
    const { winner, loser, solution, playerCards, opponentCards } = data
    const isWinner = winner === app.globalData.playerId
    
    this.setData({
      gameState: 'ROUND_END',
      statusMessage: isWinner ? '回合胜利! 🎉' : '回合失败 😢',
      playerCards: playerCards,
      'player.cardCount': playerCards.length,
      'opponent.cardCount': opponentCards.length,
      'opponent.cards': Array(opponentCards.length).fill({})
    })

    // 3秒后开始新回合
    setTimeout(() => {
      app.sendSocketMessage('ready-for-next-round', { roomCode: this.data.roomCode })
    }, 3000)
  },

  handleGameOver(data) {
    const { winner, reason } = data
    const isWinner = winner === app.globalData.playerId
    
    this.setData({
      gameState: 'GAME_OVER',
      isWinner,
      gameOverMessage: reason
    })
  },

  // 抢答
  claimSolution() {
    app.sendSocketMessage('claim-solution', { roomCode: this.data.roomCode })
  },

  // 开始解答
  startSolving() {
    this.setData({
      gameState: 'SOLVING',
      isSolving: true,
      countdown: 30,
      statusMessage: '请输入你的解答'
    })

    // 开始倒计时
    const timer = setInterval(() => {
      const countdown = this.data.countdown - 1
      if (countdown <= 0) {
        clearInterval(timer)
        this.submitSolution()
      } else {
        this.setData({ countdown })
      }
    }, 1000)

    this.setData({ countdownTimer: timer })
  },

  // 选择卡片
  selectCard(e) {
    if (this.data.gameState !== 'SOLVING' || !this.data.isSolving) return

    const { index } = e.currentTarget.dataset
    const card = this.data.centerCards[index]
    
    // 如果已经在解答中使用了，不能再选
    const usedValues = []
    this.data.solutionSteps.forEach(step => {
      if (!usedValues.includes(step.left)) usedValues.push(step.left)
      if (!usedValues.includes(step.right)) usedValues.push(step.right)
    })
    
    if (usedValues.includes(card.value)) {
      wx.showToast({
        title: '该卡片已使用',
        icon: 'none'
      })
      return
    }

    // 添加到选中的卡片
    const selectedCards = [...this.data.selectedCards, card]
    
    // 更新UI
    const centerCards = this.data.centerCards.map((c, i) => ({
      ...c,
      selected: i === index || c.selected
    }))
    
    this.setData({ selectedCards, centerCards })

    // 如果选了两张卡片，等待选择运算符
    if (selectedCards.length === 2) {
      this.setData({
        statusMessage: '请选择运算符'
      })
    }
  },

  // 选择运算符
  selectOperator(e) {
    if (this.data.selectedCards.length !== 2) {
      wx.showToast({
        title: '请先选择两张卡片',
        icon: 'none'
      })
      return
    }

    const { op } = e.currentTarget.dataset
    const [card1, card2] = this.data.selectedCards
    
    // 创建运算
    try {
      const operation = Calculator.createOperation(card1.value, op, card2.value)
      
      // 添加到解答步骤
      const solutionSteps = [...this.data.solutionSteps, operation]
      
      // 重置选择
      const centerCards = this.data.centerCards.map(c => ({
        ...c,
        selected: false
      }))
      
      this.setData({
        solutionSteps,
        selectedCards: [],
        centerCards,
        statusMessage: solutionSteps.length < 3 ? '继续选择卡片' : '点击提交答案'
      })

      // 如果已经有3个步骤，自动检查是否等于24
      if (solutionSteps.length === 3) {
        const finalResult = solutionSteps[2].result
        if (Math.abs(finalResult - 24) < 0.0001) {
          this.setData({
            statusMessage: '答案正确! 点击提交 ✓'
          })
        } else {
          this.setData({
            statusMessage: `结果是 ${Calculator.formatNumber(finalResult)}，不是 24`
          })
        }
      }
    } catch (error) {
      wx.showToast({
        title: error.message,
        icon: 'none'
      })
    }
  },

  // 提交答案
  submitSolution() {
    if (this.data.countdownTimer) {
      clearInterval(this.data.countdownTimer)
    }

    const solution = {
      cards: this.data.centerCards.map(c => ({ id: c.id, value: c.value })),
      operations: this.data.solutionSteps
    }

    app.sendSocketMessage('submit-solution', {
      roomCode: this.data.roomCode,
      solution
    })

    this.setData({
      isSolving: false,
      statusMessage: '等待结果...'
    })
  },

  // 取消解答
  cancelSolution() {
    if (this.data.countdownTimer) {
      clearInterval(this.data.countdownTimer)
    }

    this.setData({
      gameState: 'PLAYING',
      isSolving: false,
      selectedCards: [],
      solutionSteps: [],
      centerCards: this.data.centerCards.map(c => ({
        ...c,
        selected: false
      })),
      statusMessage: '寻找等于24的组合'
    })
  },

  // 请求再来一局
  requestRematch() {
    app.sendSocketMessage('request-rematch', {
      roomCode: this.data.roomCode
    })
    
    wx.showToast({
      title: '等待对手确认...',
      icon: 'loading'
    })
  },

  // 返回大厅
  backToLobby() {
    wx.redirectTo({
      url: '/pages/lobby/lobby'
    })
  }
})