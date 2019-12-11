import { remote } from 'electron'

const resizeToContentAndMoveWindow = position => {
  const browserWindow = remote.getCurrentWindow()
  const displaySize = remote.screen.getPrimaryDisplay().size

  const width = document.documentElement.offsetWidth
  const height = document.documentElement.offsetHeight
  browserWindow.setSize(width, height)

  let x, y
  switch (position) {
    case 'center':
      x = (displaySize.width - width) / 2
      y = (displaySize.height - height) / 2
      break
    case 'bottomRight':
      x = displaySize.width - width
      y = displaySize.height - height - 40
      break
  }
  browserWindow.setPosition(Math.round(x), Math.round(y))
}

export default resizeToContentAndMoveWindow
