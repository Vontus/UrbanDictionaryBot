import scraper from './scraper'
import * as scheduler from 'node-schedule'
import { UdChannelDef } from './ud-channel-def';
import logger from '../logger';
import bot from '../bot';

let channelPostTime = process.env.CHANNEL_POST_TIME

export default {
  init () {
    if (channelPostTime) {
      logger.log(`Scheduling channel posts at ${channelPostTime} ...`)
      scheduler.scheduleJob(channelPostTime, async () => {
        let defs: UdChannelDef[] = await scraper.getPageDefinitions()
        logger.debug('scraped definitions: ', defs)
      })
    } else {
      logger.warn("Couldn't schedule channel posts, CHANNEL_POST_TIME is not defined")
    }
  }
}