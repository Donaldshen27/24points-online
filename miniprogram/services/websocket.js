// WebSocket服务封装
class WebSocketService {
  constructor() {
    this.socketTask = null
    this.isConnected = false
    this.messageQueue = []
    this.reconnectTimer = null
    this.reconnectCount = 0
    this.maxReconnectAttempts = 5
    this.eventHandlers = {}
  }

  // 连接WebSocket
  connect(url) {
    if (this.socketTask) {
      return Promise.resolve()
    }

    return new Promise((resolve, reject) => {
      this.socketTask = wx.connectSocket({
        url,
        header: {
          'content-type': 'application/json'
        },
        success: () => {
          console.log('WebSocket连接请求发送成功')
        },
        fail: (err) => {
          console.error('WebSocket连接失败:', err)
          reject(err)
        }
      })

      this.socketTask.onOpen(() => {
        console.log('WebSocket连接已打开')
        this.isConnected = true
        this.reconnectCount = 0
        
        // 发送排队的消息
        this.flushMessageQueue()
        
        resolve()
      })

      this.socketTask.onMessage((res) => {
        this.handleMessage(res.data)
      })

      this.socketTask.onError((err) => {
        console.error('WebSocket错误:', err)
        this.isConnected = false
        this.reconnect()
      })

      this.socketTask.onClose(() => {
        console.log('WebSocket连接已关闭')
        this.isConnected = false
        this.socketTask = null
        this.reconnect()
      })
    })
  }

  // 重连
  reconnect() {
    if (this.reconnectCount >= this.maxReconnectAttempts) {
      console.error('WebSocket重连次数已达上限')
      wx.showToast({
        title: '网络连接失败',
        icon: 'none'
      })
      return
    }

    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer)
    }

    this.reconnectCount++
    const delay = Math.min(1000 * Math.pow(2, this.reconnectCount - 1), 10000)

    console.log(`WebSocket将在${delay}ms后重连，第${this.reconnectCount}次`)

    this.reconnectTimer = setTimeout(() => {
      const app = getApp()
      if (app && app.globalData.socketUrl) {
        this.connect(app.globalData.socketUrl)
      }
    }, delay)
  }

  // 发送消息
  send(type, payload = {}) {
    const message = {
      type,
      payload,
      timestamp: Date.now()
    }

    if (this.isConnected && this.socketTask) {
      this.socketTask.send({
        data: JSON.stringify(message),
        success: () => {
          console.log('消息发送成功:', type)
        },
        fail: (err) => {
          console.error('消息发送失败:', err)
          this.messageQueue.push(message)
        }
      })
    } else {
      // 如果未连接，将消息加入队列
      this.messageQueue.push(message)
    }
  }

  // 处理接收到的消息
  handleMessage(data) {
    try {
      const message = JSON.parse(data)
      const { type, payload } = message

      console.log('收到消息:', type, payload)

      // 触发对应的事件处理器
      if (this.eventHandlers[type]) {
        this.eventHandlers[type].forEach(handler => {
          handler(payload)
        })
      }

      // 触发全局事件总线
      const app = getApp()
      if (app && app.globalData.eventBus) {
        app.globalData.eventBus.emit(type, payload)
      }
    } catch (err) {
      console.error('消息解析失败:', err)
    }
  }

  // 注册事件处理器
  on(eventType, handler) {
    if (!this.eventHandlers[eventType]) {
      this.eventHandlers[eventType] = []
    }
    this.eventHandlers[eventType].push(handler)
  }

  // 移除事件处理器
  off(eventType, handler) {
    if (this.eventHandlers[eventType]) {
      this.eventHandlers[eventType] = this.eventHandlers[eventType].filter(h => h !== handler)
    }
  }

  // 发送队列中的消息
  flushMessageQueue() {
    while (this.messageQueue.length > 0) {
      const message = this.messageQueue.shift()
      this.send(message.type, message.payload)
    }
  }

  // 断开连接
  disconnect() {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer)
      this.reconnectTimer = null
    }

    if (this.socketTask) {
      this.socketTask.close({
        success: () => {
          console.log('WebSocket连接已主动关闭')
        }
      })
      this.socketTask = null
    }

    this.isConnected = false
    this.messageQueue = []
    this.eventHandlers = {}
  }

  // 获取连接状态
  getConnectionState() {
    return {
      isConnected: this.isConnected,
      reconnectCount: this.reconnectCount,
      queuedMessages: this.messageQueue.length
    }
  }
}

// 导出单例
module.exports = new WebSocketService()