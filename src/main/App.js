import { app, ipcMain } from 'electron'
import { createProtocol, installVueDevtools } from 'vue-cli-plugin-electron-builder/lib'

import NotificationWindowManager from './NotificationWindowManager'
import DetailWindowManager from './DetailWindowManager'
import IMAPGateway from './IMAPGateway'
import TrayService from './TrayService'
import isProduction from './isProduction'

class App {
  constructor (config) {
    this._updateMessageList = this._updateMessageList.bind(this)
    this._handleAppReady = this._handleAppReady.bind(this)
    this._handleImapError = this._handleImapError.bind(this)

    this.config = config
    this.winURL = process.env.WEBPACK_DEV_SERVER_URL || 'app://./index.html'
  }

  init () {
    if (app.isReady()) {
      this._handleAppReady()
    } else {
      app.once('ready', this._handleAppReady)
    }
  }

  async _handleAppReady () {
    if (!isProduction && !process.env.IS_TEST) {
      try {
        await installVueDevtools()
      } catch (e) {
        console.error('Vue Devtools failed to install:', e.toString())
      }
    }
    if (!process.env.WEBPACK_DEV_SERVER_URL) createProtocol('app')

    await Promise.all([
      this._initNotificationWindow(),
      this._initDetailWindow(),
      this._initTray(),
      this._initImap()
    ])
  }

  async _initNotificationWindow () {
    this._notificationWindowManager = new NotificationWindowManager(this.winURL)

    await this._notificationWindowManager.init()

    ipcMain.on('showMessageDetail', async (e, uid) => {
      const [window, message] = await Promise.all([
        this._detailWindowManager.createWindow(),
        this._imap.fetchMessage(uid)
      ])

      this._detailWindowManager.showMessage(window, message)
    })
  }

  async _initDetailWindow () {
    this._detailWindowManager = new DetailWindowManager(this.winURL)
  }

  async _initTray () {
    this._trayService = new TrayService()

    this._trayService.on('click', this._updateMessageList)
    this._trayService.on('exit', () => { app.exit() })

    this._trayService.init()
  }

  async _initImap () {
    this._imap = new IMAPGateway()

    this._imap.on('serverEventOccurred', this._updateMessageList)
    this._imap.on('error', this._handleImapError)

    await this._imap.init(this.config.imap)
  }

  async _updateMessageList () {
    this._notificationWindowManager.updateMessageList(null)

    const unreadMessages = await this._imap.fetchUnreadMessageHeaders()
    // 新しい順に並び替える
    const messageList = unreadMessages.reverse()

    this._notificationWindowManager.updateMessageList(messageList)

    if (messageList.length === 0) {
      this._trayService.hideBadge()
    } else {
      this._trayService.showBadge()
    }
  }

  _handleImapError (err) {
    console.warn('IMAP Error occurred. Reconnecting in 3 seconds.')
    console.warn(err)

    this._imap._disconnect()

    setTimeout(() => {
      this._initImap()
    }, 3000)
  }
}

export default App
