import os from 'os'
import path from 'path'
import fs from 'fs'

const loadConfig = async () => {
  const configPath = path.join(os.homedir(), '.email-notification.json')
  const configJson = await fs.promises.readFile(configPath)
  return JSON.parse(configJson)
}

export default loadConfig
