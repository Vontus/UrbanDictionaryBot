import * as TelegramBot from 'node-telegram-bot-api'
import scraper from './scraper'
import * as scheduler from 'node-schedule'
import { UdChannelDef } from './ud-channel-def'
import logger from '../logger'
import bot from '../bot'
import urbanApi from '../urban-api'
import templates from '../templates'

const channelId: string | undefined = process.env.CHANNEL_ID
const channelPostTime: string | undefined = process.env.CHANNEL_POST_TIME

export default {
  init () {
    if (!channelId) {
      logger.warn('CHANNEL_ID is not defined, aborting post schedule')
      return
    }

    if (!channelPostTime) {
      logger.warn('CHANNEL_POST_TIME is not defined, aborting post schedule')
      return
    }

    logger.log(`Scheduling channel posts at ${channelPostTime} ...`)
    scheduler.scheduleJob(channelPostTime, async () => {
      const defIds: UdChannelDef[] = await scraper.getPageDefinitions()
      const def = await urbanApi.defineDefId(defIds[0].defId)
      const msgOpts: TelegramBot.SendMessageOptions = {
        parse_mode: 'HTML',
        disable_web_page_preview: true
      }
      bot.bot.sendMessage(channelId, templates.channelPost(def), msgOpts)
      logger.debug('scraped definitions: ', defIds)
      logger.debug(`sending definition '${def.defid}' to channel`)
    })
  }
}
