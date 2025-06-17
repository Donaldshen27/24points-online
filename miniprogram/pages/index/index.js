// pages/index/index.js
const app = getApp()

Page({
  data: {
    
  },

  onLoad() {
    // 预加载用户信息
    this.getUserInfo()
  },

  getUserInfo() {
    // 尝试获取已保存的用户信息
    const userInfo = wx.getStorageSync('userInfo')
    if (userInfo) {
      app.globalData.userInfo = userInfo
    }
  },

  enterLobby() {
    // 检查网络连接
    wx.getNetworkType({
      success: (res) => {
        if (res.networkType === 'none') {
          wx.showToast({
            title: '请检查网络连接',
            icon: 'none'
          })
          return
        }
        
        // 进入大厅
        wx.navigateTo({
          url: '/pages/lobby/lobby'
        })
      }
    })
  }
})