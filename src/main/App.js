import { app, ipcMain, protocol } from 'electron'
import { createProtocol, installVueDevtools } from 'vue-cli-plugin-electron-builder/lib'

import NotificationWindowManager from './NotificationWindowManager'
import DetailWindowManager from './DetailWindowManager'
import IMAPGateway from './IMAPGateway'
import config from '../../config'

class App {
  constructor () {
    this.updateMessageList = this.updateMessageList.bind(this)
    this.handleAppReady = this.handleAppReady.bind(this)

    // Scheme must be registered before the app is ready
    protocol.registerSchemesAsPrivileged([{ scheme: 'app', privileges: { secure: true, standard: true } }])

    const winURL = process.env.WEBPACK_DEV_SERVER_URL || 'app://./index.html'
    this.notificationWindowManager = new NotificationWindowManager(winURL)
    this.detailWindowManager = new DetailWindowManager(winURL)

    this.imap = new IMAPGateway()
  }

  async init () {
    app.once('ready', this.handleAppReady)

    await this.imap.init(config.imap)
  }

  async updateMessageList () {
    const unreadMessages = await this.imap.fetchUnreadMessages()
    this.notificationWindowManager.updateMessageList(unreadMessages)
  }

  async handleAppReady () {
    if (process.env.NODE_ENV !== 'production' && !process.env.IS_TEST) {
      try {
        await installVueDevtools()
      } catch (e) {
        console.error('Vue Devtools failed to install:', e.toString())
      }
    }
    if (!process.env.WEBPACK_DEV_SERVER_URL) createProtocol('app')

    await this.notificationWindowManager.init()

    ipcMain.on('showMessage', (e, message) => {
      this.detailWindowManager.showMessage(message)
    })

    this.imap.on('newMailReceived', this.updateMessageList)
    await this.updateMessageList()
  }
}

export default App
