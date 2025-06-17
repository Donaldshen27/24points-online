// pages/lobby/lobby.js
const app = getApp()

Page({
  data: {
    userInfo: null,
    showJoinModal: false,
    roomCode: ''
  },

  onLoad() {
    // 获取用户信息
    if (app.globalData.userInfo) {
      this.setData({
        userInfo: app.globalData.userInfo
      })
    } else {
      // 获取用户信息
      wx.getUserProfile({
        desc: '用于展示用户信息',
        success: (res) => {
          app.globalData.userInfo = res.userInfo
          this.setData({
            userInfo: res.userInfo
          })
        },
        fail: () => {
          // 用户拒绝授权，使用默认信息
          this.setData({
            userInfo: {
              nickName: '游客' + Math.floor(Math.random() * 10000),
              avatarUrl: ''
            }
          })
        }
      })
    }

    // 生成玩家ID
    if (!app.globalData.playerId) {
      app.globalData.playerId = 'player_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9)
    }
  },

  // 创建房间
  createRoom() {
    wx.showLoading({
      title: '创建房间中...'
    })

    app.sendSocketMessage('create-room', {
      playerName: this.data.userInfo?.nickName || '玩家',
      playerId: app.globalData.playerId
    })

    // 监听房间创建成功
    app.globalData.eventBus.once('room-created', (data) => {
      wx.hideLoading()
      const { roomCode } = data
      app.globalData.roomCode = roomCode
      
      wx.navigateTo({
        url: `/pages/waiting/waiting?roomCode=${roomCode}&isHost=true`
      })
    })

    // 监听错误
    app.globalData.eventBus.once('error', (data) => {
      wx.hideLoading()
      wx.showToast({
        title: data.message || '创建房间失败',
        icon: 'none'
      })
    })
  },

  // 显示加入房间弹窗
  showJoinDialog() {
    this.setData({
      showJoinModal: true,
      roomCode: ''
    })
  },

  // 隐藏加入房间弹窗
  hideJoinDialog() {
    this.setData({
      showJoinModal: false,
      roomCode: ''
    })
  },

  // 输入房间号
  onRoomCodeInput(e) {
    this.setData({
      roomCode: e.detail.value.toUpperCase()
    })
  },

  // 加入房间
  joinRoom() {
    const { roomCode } = this.data
    
    if (!roomCode || roomCode.length !== 6) {
      wx.showToast({
        title: '请输入6位房间号',
        icon: 'none'
      })
      return
    }

    wx.showLoading({
      title: '加入房间中...'
    })

    app.sendSocketMessage('join-room', {
      roomCode,
      playerName: this.data.userInfo?.nickName || '玩家',
      playerId: app.globalData.playerId
    })

    // 监听加入成功
    app.globalData.eventBus.once('room-joined', (data) => {
      wx.hideLoading()
      app.globalData.roomCode = roomCode
      
      wx.navigateTo({
        url: `/pages/waiting/waiting?roomCode=${roomCode}&isHost=false`
      })
    })

    // 监听错误
    app.globalData.eventBus.once('error', (data) => {
      wx.hideLoading()
      wx.showToast({
        title: data.message || '加入房间失败',
        icon: 'none'
      })
    })
  },

  // 快速匹配
  quickMatch() {
    wx.showToast({
      title: '功能开发中...',
      icon: 'none'
    })
  },

  // 单机练习
  practiceMode() {
    wx.navigateTo({
      url: '/pages/practice/practice'
    })
  },

  // 空函数，防止事件冒泡
  noop() {}
})