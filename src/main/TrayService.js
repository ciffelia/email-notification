import EventEmitter from 'events'
import path from 'path'
import { Menu, Tray } from 'electron'

class TrayService extends EventEmitter {
  constructor () {
    super()

    this.init = this.init.bind(this)
    this.handleClick = this.handleClick.bind(this)
    this.handleExitClick = this.handleExitClick.bind(this)

    this.iconPath = path.join(__static, 'icon.png')
  }

  init () {
    this.tray = new Tray(this.iconPath)
    this.tray.setToolTip('email-notification')

    const menu = Menu.buildFromTemplate([
      { label: 'Exit', type: 'normal', click: this.handleExitClick }
    ])
    this.tray.setContextMenu(menu)

    this.tray.on('click', this.handleClick)
  }

  handleClick () {
    this.emit('click')
  }

  handleExitClick () {
    this.emit('exit')
  }
}

export default TrayService
