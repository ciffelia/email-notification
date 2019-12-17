'use strict'

import { protocol } from 'electron'
import App from './App'
import loadConfig from './loadConfig'

(async () => {
  // Scheme must be registered before the app is ready
  protocol.registerSchemesAsPrivileged([{ scheme: 'app', privileges: { secure: true, standard: true } }])

  const config = await loadConfig()

  const app = new App(config)
  app.init()
})()
