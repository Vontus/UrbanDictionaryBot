import * as TelegramBot from 'node-telegram-bot-api'
import scraper from './scraper'
import * as scheduler from 'node-schedule'
import logger from '../logger'
import { bot } from '../index'
import urbanApi from '../urban-api'
import templates from '../templates'
import storage from '../storage'

const channelId: string | undefined = process.env.CHANNEL_ID
const channelPostTime: string | undefined = process.env.CHANNEL_POST_TIME

const msgOpts: TelegramBot.SendMessageOptions = {
  parse_mode: 'HTML',
  disable_web_page_preview: true
}

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
      bot.logToTelegram('Retrieving current WOTD...')
      logger.info('Retrieving current WOTD...')

      const scrapedDefinitions = await scraper.getPageDefinitions()
      logger.info('scraped definitions: ', scrapedDefinitions)
      const channelDefToSend = await storage.getFirstUnsentDef(scrapedDefinitions)

      if (channelDefToSend) {
        const defToSend = await urbanApi.defineDefId(channelDefToSend.defId)
        bot.sendMessage(channelId, templates.channelPost(defToSend), msgOpts)
        storage.saveSentChannelDef(channelDefToSend)

        logger.info(`sending definition '${defToSend.defid}' to channel`)
      } else {
        bot.logToTelegram('No unsent WOTD found')
        logger.info('No unsent WOTD found')
      }
    })
  }
}
