import scraper from './scraper'
import * as scheduler from 'node-schedule'
import { UdChannelDef } from './ud-channel-def';
import logger from '../logger';
import bot from '../bot';
import urbanApi from '../urban-api';

const channelPostId = process.env.CHANNEL_POST_ID
const channelPostTime = process.env.CHANNEL_POST_TIME

export default {
  init () {
    if (!channelPostId) {
      logger.warn("Couldn't schedule channel posts, CHANNEL_POST_ID is not defined")
      return
    }

    if (!channelPostTime) {
      logger.warn("Couldn't schedule channel posts, CHANNEL_POST_TIME is not defined")
      return
    }

    if (channelPostTime && channelPostId) {
      logger.log(`Scheduling channel posts at ${channelPostTime} ...`)
      scheduler.scheduleJob(channelPostTime, async () => {
        let defIds: UdChannelDef[] = await scraper.getPageDefinitions()
        let def = await urbanApi.defineDefId(defIds[0].defId)
        bot.sendDefinition(channelPostId, [def], 0)
        logger.debug('scraped definitions: ', defIds)
        logger.debug('sending definition to channel: ', def.defid)
      })
    } else {
      logger.warn("Couldn't schedule channel posts, CHANNEL_POST_TIME is not defined")
    }
  }
}