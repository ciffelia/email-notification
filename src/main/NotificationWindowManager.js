import { BrowserWindow, shell } from 'electron'

class NotificationWindowManager {
  constructor (winURL) {
    this.winURL = winURL
  }

  async init () {
    this.window = new BrowserWindow({
      resizable: false,
      movable: false,
      minimizable: false,
      maximizable: false,
      closable: false,
      focusable: false,
      alwaysOnTop: true,
      fullscreenable: false,
      skipTaskbar: true,
      show: false,
      frame: false,
      transparent: true,
      webPreferences: {
        devTools: process.env.NODE_ENV !== 'production',
        nodeIntegration: true
      }
    })

    this.window.on('will-navigate', (e, url) => {
      shell.openExternal(url)
      e.preventDefault()
    })

    await this.window.loadURL(this.winURL + '?displayMode=notification')
  }

  updateMessageList (messageList) {
    this.window.webContents.send('updateMessageList', messageList)
    this.window.show()
  }
}

export default NotificationWindowManager
