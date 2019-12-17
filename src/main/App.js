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

    const winURL = process.env.WEBPACK_DEV_SERVER_URL || 'app://./index.html'
    this._notificationWindowManager = new NotificationWindowManager(winURL)
    this._detailWindowManager = new DetailWindowManager(winURL)

    this._trayService = new TrayService()
    this._imap = new IMAPGateway()
  }

  async init () {
    if (app.isReady()) {
      this._handleAppReady()
    } else {
      app.once('ready', this._handleAppReady)
    }

    await this._imap.init(this.config.imap)
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

    this._initTray()

    await this._notificationWindowManager.init()
    ipcMain.on('showMessageDetail', (e, message) => {
      this._detailWindowManager.showMessage(message)
    })

    this._imap.on('serverEventOccurred', this._updateMessageList)
    this._imap.on('error', this._handleImapError)
  }

  async _initTray () {
    this._trayService.init()
    this._trayService.on('click', this._updateMessageList)
    this._trayService.on('exit', () => { app.exit() })
  }

  async _updateMessageList () {
    this._notificationWindowManager.updateMessageList(null)

    const unreadMessages = await this._imap.fetchUnreadMessages()
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
      this._imap.init(this.config.imap)
    }, 3000)
  }
}

export default App
