//index.js
const app = getApp()
const moment = require('moment')

Page({
  data: {
    messages: [],
    avatarUrl: null,
    userInfo: null,
    input: ''
  },

  onLoad: function () {
    // 获取用户信息
    wx.getSetting({
      success: res => {
        if (res.authSetting['scope.userInfo']) {
          // 已经授权，可以直接调用 getUserInfo 获取头像昵称，不会弹框
          wx.getUserInfo({
            success: res => {
              this.setData({
                avatarUrl: res.userInfo.avatarUrl,
                userInfo: res.userInfo
              })
            }
          })
        }
      }
    })

    wx.cloud.database().collection('messages').watch({
      onChange: (data) => {
        console.log(data.docs)
        this.setData({
          messages: data.docs.map(msg => {
            return {
              ...msg,
              name: msg._openid.slice(0, 2),
              time: moment(msg.timestamp).format("MM/DD HH:mm:ss")
            }
          }).reverse()
        })
      },
      onError() {

      }
    })
  },

  onGetUserInfo: function (e) {
    if (!this.data.logged && e.detail.userInfo) {
      this.setData({
        logged: true,
        avatarUrl: e.detail.userInfo.avatarUrl,
        userInfo: e.detail.userInfo
      })
    }
  },

  onInput(event) {
    this.setData({
      input: event.detail.value
    })
  },

  sendMessage() {
    console.log(this.data)
    if (this.data.input) {
      wx.cloud.database().collection('messages').add({
        data: {
          text: this.data.input,
          timestamp: Date.now(),
          avatarUrl: this.data.avatarUrl
        }
      }).then(() => {
        this.setData({
          input: ''
        })
      })
    }
  },

  onGetOpenid: function () {
    // 调用云函数
    wx.cloud.callFunction({
      name: 'login',
      data: {},
      success: res => {
        console.log('[云函数] [login] user openid: ', res.result.openid)
        app.globalData.openid = res.result.openid
        wx.navigateTo({
          url: '../userConsole/userConsole',
        })
      },
      fail: err => {
        console.error('[云函数] [login] 调用失败', err)
        wx.navigateTo({
          url: '../deployFunctions/deployFunctions',
        })
      }
    })
  }
})