import { app, ipcMain } from 'electron'
import { createProtocol, installVueDevtools } from 'vue-cli-plugin-electron-builder/lib'

import NotificationWindowManager from './NotificationWindowManager'
import DetailWindowManager from './DetailWindowManager'
import ImapGateway from './ImapGateway'
import TrayService from './TrayService'
import isProduction from './isProduction'

class App {
  constructor (config) {
    this._updateMessageList = this._updateMessageList.bind(this)
    this._updateTrayBadge = this._updateTrayBadge.bind(this)
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
      this._initTray()
    ])

    await this._initImap()
  }

  async _initNotificationWindow () {
    this._notificationWindowManager = new NotificationWindowManager(this.winURL)

    await this._notificationWindowManager.init()

    ipcMain.on('showMessageDetail', async (e, { imapAccountId, uid }) => {
      const [window, message] = await Promise.all([
        this._detailWindowManager.createWindow(),
        this._imaps[imapAccountId].fetchMessage(uid)
      ])

      this._detailWindowManager.showMessage(window, { imapAccountId, ...message })
    })
  }

  async _initDetailWindow () {
    this._detailWindowManager = new DetailWindowManager(this.winURL)

    ipcMain.on('markMessageAsRead', async (e, { imapAccountId, uid }) => {
      await this._imaps[imapAccountId].markMessageAsRead(uid)
    })
  }

  async _initTray () {
    this._trayService = new TrayService()

    this._trayService.on('click', this._updateMessageList)
    this._trayService.on('exit', () => { app.exit() })

    this._trayService.init()
  }

  async _initImap () {
    this._imaps = []

    const initImap = async imapConfig => {
      const imap = new ImapGateway(imapConfig)

      imap.on('newMailAvailable', this._updateMessageList)
      imap.on('mailboxUpdated', this._updateTrayBadge)
      imap.on('error', err => {
        this._handleImapError(err, imap)
      })

      try {
        await imap.init()
      } catch {
        // Errors will be caught in _handleImapError
      }

      this._imaps.push(imap)
    }

    await Promise.all(this.config.imap.map(initImap))

    setInterval(this._updateTrayBadge, 15 * 1000)
    await this._updateTrayBadge()
  }

  async _updateMessageList () {
    this._notificationWindowManager.updateLoading(true)

    const unreadMessages = []

    const fetchUnreadMessages = async (imap, i) => {
      if (!imap.isReady) return

      const messages = await imap.fetchUnreadMessageHeaders()
      unreadMessages.push(
        ...messages.map(message => ({ imapAccountId: i, ...message }))
      )
    }

    await Promise.all(this._imaps.map(fetchUnreadMessages))

    // 新しい順(日時降順)に並び替える
    unreadMessages.sort((a, b) => {
      return b.body.date - a.body.date
    })

    this._notificationWindowManager.updateMessageList(unreadMessages)
    this._notificationWindowManager.updateLoading(false)
  }

  async _updateTrayBadge () {
    let unreadCount = 0

    const countUnreadMessages = async imap => {
      if (!imap.isReady) return
      unreadCount += await imap.countUnreadMessages()
    }

    await Promise.all(this._imaps.map(countUnreadMessages))

    if (unreadCount === 0) {
      this._trayService.hideBadge()
    } else {
      this._trayService.showBadge()
    }
  }

  _handleImapError (err, imap) {
    console.warn('IMAP Error occurred. Reconnecting in 3 seconds.')
    console.warn(err)

    imap.terminate()

    setTimeout(async () => {
      try {
        await imap.init()
      } catch {
        // Errors will be caught in _handleImapError again
        return
      }

      await this._updateTrayBadge()
    }, 3000)
  }
}

export default App
