import path from 'path'
import { BrowserWindow, shell } from 'electron'
import isProduction from './isProduction'

class NotificationWindowManager {
  constructor (winURL) {
    this._winURL = winURL
  }

  async init () {
    this._window = new BrowserWindow({
      resizable: false,
      movable: false,
      minimizable: false,
      maximizable: false,
      closable: false,
      focusable: false,
      alwaysOnTop: true,
      fullscreenable: false,
      skipTaskbar: true,
      icon: path.join(__static, 'icon.png'),
      show: false,
      frame: false,
      transparent: true,
      webPreferences: {
        devTools: !isProduction,
        nodeIntegration: true
      }
    })

    if (!isProduction) this._window.webContents.openDevTools()

    this._window.on('will-navigate', (e, url) => {
      shell.openExternal(url)
      e.preventDefault()
    })

    await this._window.loadURL(this._winURL + '?displayMode=notification')
  }

  updateMessageList (messageList) {
    this._window.webContents.send('updateMessageList', messageList)
  }
}

export default NotificationWindowManager
