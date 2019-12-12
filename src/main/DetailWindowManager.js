import path from 'path'
import { BrowserWindow, shell } from 'electron'

class DetailWindowManager {
  constructor (winURL) {
    this._winURL = winURL
    this._windows = new Set()
  }

  async showMessage (message) {
    const newWindow = new BrowserWindow({
      resizable: false,
      maximizable: false,
      fullscreenable: false,
      icon: path.join(__static, 'icon.png'),
      show: false,
      frame: false,
      transparent: true,
      webPreferences: {
        devTools: process.env.NODE_ENV !== 'production',
        nodeIntegration: true
      }
    })

    newWindow.on('will-navigate', (e, url) => {
      shell.openExternal(url)
      e.preventDefault()
    })

    newWindow.once('ready-to-show', () => {
      newWindow.show()
    })

    newWindow.once('closed', () => {
      this._windows.delete(newWindow)
    })

    this._windows.add(newWindow)

    await newWindow.loadURL(this._winURL + '?displayMode=detail')
    newWindow.webContents.send('updateMessage', message)
  }
}

export default DetailWindowManager
