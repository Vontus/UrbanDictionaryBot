import bot from './bot'
import udChannel from './ud-channel'
import logger from './logger';

logger.log("Starting...")

const start = async () => {
  bot.start()

  udChannel.init()
}

start()
