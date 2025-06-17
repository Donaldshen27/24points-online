// pages/waiting/waiting.js
const app = getApp()

Page({
  data: {
    roomCode: '',
    isHost: false,
    players: [],
    isReady: false,
    allReady: false,
    countdown: 0,
    gameModes: [
      { id: 'classic', name: '经典模式' },
      { id: 'super', name: '超级模式' },
      { id: 'extended', name: '扩展模式' }
    ],
    selectedModeIndex: 0
  },

  onLoad(options) {
    const { roomCode, isHost } = options
    this.setData({
      roomCode,
      isHost: isHost === 'true'
    })

    // 设置事件监听
    this.setupSocketListeners()

    // 如果是加入房间，发送加入请求
    if (!this.data.isHost) {
      app.sendSocketMessage('join-room', {
        roomCode,
        playerName: app.globalData.userInfo?.nickName || '玩家',
        playerId: app.globalData.playerId
      })
    }
  },

  onUnload() {
    // 离开房间
    if (this.data.roomCode) {
      app.sendSocketMessage('leave-room', {
        roomCode: this.data.roomCode
      })
    }
  },

  setupSocketListeners() {
    const eventBus = app.globalData.eventBus

    // 房间更新
    eventBus.on('room-updated', (data) => {
      this.handleRoomUpdate(data)
    })

    // 玩家加入
    eventBus.on('player-joined', (data) => {
      this.handlePlayerJoined(data)
    })

    // 玩家离开
    eventBus.on('player-left', (data) => {
      this.handlePlayerLeft(data)
    })

    // 玩家准备
    eventBus.on('player-ready', (data) => {
      this.handlePlayerReady(data)
    })

    // 游戏开始倒计时
    eventBus.on('game-starting', (data) => {
      this.handleGameStarting(data)
    })

    // 游戏开始
    eventBus.on('game-started', () => {
      wx.redirectTo({
        url: `/pages/game/game?roomCode=${this.data.roomCode}`
      })
    })
  },

  handleRoomUpdate(data) {
    const { players } = data
    const currentPlayer = players.find(p => p.id === app.globalData.playerId)
    
    this.setData({
      players: players.map(p => ({
        id: p.id,
        name: p.name,
        ready: p.ready,
        avatarUrl: p.avatarUrl
      })),
      isReady: currentPlayer?.ready || false,
      allReady: players.length === 2 && players.every(p => p.ready)
    })
  },

  handlePlayerJoined(data) {
    const { player } = data
    wx.showToast({
      title: `${player.name} 加入了房间`,
      icon: 'none'
    })
    
    // 请求房间更新
    app.sendSocketMessage('get-room-info', {
      roomCode: this.data.roomCode
    })
  },

  handlePlayerLeft(data) {
    const { playerId } = data
    const player = this.data.players.find(p => p.id === playerId)
    
    if (player) {
      wx.showToast({
        title: `${player.name} 离开了房间`,
        icon: 'none'
      })
    }

    // 更新玩家列表
    const players = this.data.players.filter(p => p.id !== playerId)
    this.setData({
      players,
      allReady: false
    })
  },

  handlePlayerReady(data) {
    const { playerId, ready } = data
    const players = this.data.players.map(p => {
      if (p.id === playerId) {
        return { ...p, ready }
      }
      return p
    })

    this.setData({
      players,
      allReady: players.length === 2 && players.every(p => p.ready)
    })
  },

  handleGameStarting(data) {
    const { countdown } = data
    this.setData({ countdown })

    // 倒计时
    const timer = setInterval(() => {
      const countdown = this.data.countdown - 1
      if (countdown <= 0) {
        clearInterval(timer)
      }
      this.setData({ countdown })
    }, 1000)
  },

  // 复制房间号
  copyRoomCode() {
    wx.setClipboardData({
      data: this.data.roomCode,
      success: () => {
        wx.showToast({
          title: '房间号已复制',
          icon: 'success'
        })
      }
    })
  },

  // 切换准备状态
  toggleReady() {
    const ready = !this.data.isReady
    
    app.sendSocketMessage('player-ready', {
      roomCode: this.data.roomCode,
      ready
    })

    this.setData({ isReady: ready })
  },

  // 开始游戏
  startGame() {
    if (!this.data.allReady) {
      wx.showToast({
        title: '请等待所有玩家准备',
        icon: 'none'
      })
      return
    }

    app.sendSocketMessage('start-game', {
      roomCode: this.data.roomCode,
      gameMode: this.data.gameModes[this.data.selectedModeIndex].id
    })
  },

  // 离开房间
  leaveRoom() {
    wx.showModal({
      title: '确认离开',
      content: '确定要离开房间吗？',
      success: (res) => {
        if (res.confirm) {
          app.sendSocketMessage('leave-room', {
            roomCode: this.data.roomCode
          })
          
          wx.navigateBack()
        }
      }
    })
  },

  // 游戏模式选择
  onModeChange(e) {
    const selectedModeIndex = e.detail.value
    this.setData({ selectedModeIndex })

    if (this.data.isHost) {
      app.sendSocketMessage('update-game-mode', {
        roomCode: this.data.roomCode,
        gameMode: this.data.gameModes[selectedModeIndex].id
      })
    }
  }
})