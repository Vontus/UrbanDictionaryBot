import { UdBot } from './ud-bot'
import udChannel from './ud-channel'
import logger from './logger'
import util from './util'

let botToken: string = util.getRequiredEnvVar('BOT_TOKEN')

const bot = new UdBot(botToken, { polling: true })

logger.log('Starting...')

const start = async () => {
  await udChannel.init()
}

start()

export { bot }
