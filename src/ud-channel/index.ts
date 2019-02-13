import * as TelegramBot from 'node-telegram-bot-api'
import scraper from './scraper'
import * as scheduler from 'node-schedule'
import { UdChannelDef } from './ud-channel-def';
import logger from '../logger';
import bot from '../bot';
import urbanApi from '../urban-api';
import templates from '../templates'

const channelId = process.env.CHANNEL_ID
const channelPostTime = process.env.CHANNEL_POST_TIME

export default {
  init () {
    if (!channelId) {
      logger.warn("Couldn't schedule channel posts, CHANNEL_ID is not defined")
      return
    }

    if (!channelPostTime) {
      logger.warn("Couldn't schedule channel posts, CHANNEL_POST_TIME is not defined")
      return
    }

    if (channelPostTime && channelId) {
      logger.log(`Scheduling channel posts at ${channelPostTime} ...`)
      scheduler.scheduleJob(channelPostTime, async () => {
        let defIds: UdChannelDef[] = await scraper.getPageDefinitions()
        let def = await urbanApi.defineDefId(defIds[0].defId)
        let msgOpts: TelegramBot.SendMessageOptions = {
          parse_mode: "HTML",
          disable_web_page_preview: true,
        }
        bot.bot.sendMessage(channelId, templates.channelPost(def), msgOpts)
        logger.debug('scraped definitions: ', defIds)
        logger.debug(`sending definition '${def.defid}' to channel '${channelId}'`)
      })
    } else {
      logger.warn("Couldn't schedule channel posts, CHANNEL_POST_TIME is not defined")
    }
  }
}