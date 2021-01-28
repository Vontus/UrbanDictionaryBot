import { UdBot } from './ud-bot'
import udChannel from './ud-channel'
import logger from './logger'
import util from './util'

const botToken: string = util.getRequiredEnvVar('BOT_TOKEN')

logger.log('Starting...')
const bot = new UdBot(botToken, { polling: true })

const start = async (): Promise<void> => {
  await udChannel.init()
}

void start()

export { bot }
