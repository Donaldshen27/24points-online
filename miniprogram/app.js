// app.js
const WebSocketService = require('./services/websocket')

App({
  globalData: {
    userInfo: null,
    socketUrl: 'wss://your-server-domain.com', // 需要替换为实际的服务器地址
    roomCode: null,
    playerId: null,
    gameState: null,
    eventBus: null
  },

  onLaunch() {
    // 展示本地存储能力
    const logs = wx.getStorageSync('logs') || []
    logs.unshift(Date.now())
    wx.setStorageSync('logs', logs)

    // 初始化事件总线
    this.initEventBus()

    // 获取用户信息
    wx.getSetting({
      success: res => {
        if (res.authSetting['scope.userInfo']) {
          wx.getUserInfo({
            success: res => {
              this.globalData.userInfo = res.userInfo
              if (this.userInfoReadyCallback) {
                this.userInfoReadyCallback(res)
              }
            }
          })
        }
      }
    })

    // 初始化WebSocket连接
    this.initSocket()
  },

  initEventBus() {
    this.globalData.eventBus = {
      handlers: {},
      on(event, handler) {
        if (!this.handlers[event]) {
          this.handlers[event] = []
        }
        this.handlers[event].push(handler)
      },
      once(event, handler) {
        const wrappedHandler = (data) => {
          handler(data)
          this.off(event, wrappedHandler)
        }
        this.on(event, wrappedHandler)
      },
      emit(event, data) {
        if (this.handlers[event]) {
          this.handlers[event].forEach(handler => handler(data))
        }
      },
      off(event, handler) {
        if (this.handlers[event]) {
          if (handler) {
            this.handlers[event] = this.handlers[event].filter(h => h !== handler)
          } else {
            // 如果没有指定handler，移除所有
            delete this.handlers[event]
          }
        }
      }
    }
  },

  initSocket() {
    WebSocketService.connect(this.globalData.socketUrl).catch(err => {
      console.error('WebSocket初始连接失败:', err)
    })
  },

  sendSocketMessage(type, payload) {
    WebSocketService.send(type, payload)
  },

  onHide() {
    // 应用进入后台时的处理
    console.log('应用进入后台')
  },

  onShow() {
    // 应用进入前台时的处理
    console.log('应用进入前台')
    // 检查WebSocket连接状态
    const state = WebSocketService.getConnectionState()
    if (!state.isConnected) {
      this.initSocket()
    }
  }
})