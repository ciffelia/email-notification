import EventEmitter from 'events'
import path from 'path'
import { Menu, Tray } from 'electron'

class TrayService extends EventEmitter {
  constructor () {
    super()

    this.init = this.init.bind(this)
    this._handleClick = this._handleClick.bind(this)
    this._handleExitClick = this._handleExitClick.bind(this)

    this._iconPath = this._getIconPath()
  }

  init () {
    this._tray = new Tray(this._iconPath.default)
    this._tray.setToolTip('email-notification')

    const menu = Menu.buildFromTemplate([
      { label: 'Exit', type: 'normal', click: this._handleExitClick }
    ])
    this._tray.setContextMenu(menu)

    this._tray.on('click', this._handleClick)
  }

  showBadge () {
    this._tray.setImage(this._iconPath.badge)
  }

  hideBadge () {
    this._tray.setImage(this._iconPath.default)
  }

  _getIconPath () {
    if (process.platform === 'win32') {
      return {
        default: path.join(__static, 'icon.ico'),
        badge: path.join(__static, 'icon-with-badge.ico')
      }
    } else {
      return {
        default: path.join(__static, 'icon.png'),
        badge: path.join(__static, 'icon-with-badge.png')
      }
    }
  }

  _handleClick () {
    this.emit('click')
  }

  _handleExitClick () {
    this.emit('exit')
  }
}

export default TrayService
