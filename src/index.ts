import bot from './bot'
import udChannel from './ud-channel'
import logger from './logger';
import util from './util'

logger.log("Starting...")

let token: string = util.getRequiredEnvVar("BOT_TOKEN")

const start = async () => {
  bot.start(token)

  udChannel.init()
}

start()
