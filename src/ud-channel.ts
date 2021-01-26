import * as TelegramBot from 'node-telegram-bot-api'
import * as scheduler from 'node-schedule'
import logger from './logger'
import { bot } from './index'
import templates from './templates'
import { getFirstUnsentDef, saveSentChannelDef } from './storage/channel'
import { getWotds } from './urban-api/scraper'

const channelId: string | undefined = process.env.CHANNEL_ID
const channelPostTime: string | undefined = process.env.CHANNEL_POST_TIME

const msgOpts: TelegramBot.SendMessageOptions = {
  parse_mode: 'HTML',
  disable_web_page_preview: true
}

export default {
  async init () {
    if (channelId === undefined) {
      logger.warn('CHANNEL_ID is not defined, aborting WOTD')
      return
    }

    if (channelPostTime === undefined) {
      logger.warn('CHANNEL_POST_TIME is not defined, aborting WOTD')
      return
    }

    if (channelPostTime === 'ONSTART') {
      await this.sendWord(channelId, true)
    } else {
      logger.log(`Scheduling channel posts at ${channelPostTime} ...`)
      scheduler.scheduleJob(channelPostTime, () => {
        void this.sendWord(channelId, true)
      })
    }
  },

  async sendWord (chatId: string, saveWotd: boolean) {
    const promises: Array<Promise<any>> = []
    promises.push(bot.logToTelegram('Retrieving current WOTD...'))
    logger.info('Retrieving current WOTD...')

    const scrapedDefinitions = await getWotds()
    const defToSend = await getFirstUnsentDef(scrapedDefinitions)

    if (defToSend !== undefined) {
      promises.push(bot.sendMessage(chatId, templates.channelPost(defToSend), msgOpts))

      if (saveWotd) {
        promises.push(saveSentChannelDef(defToSend))
      }

      if (defToSend.gif !== undefined) {
        promises.push(bot.sendDocument(chatId, defToSend.gif))
      }

      logger.info(`sending definition '${defToSend.defId}' to channel`)
    } else {
      promises.push(bot.logToTelegram('No unsent WOTD found'))
      logger.info('No unsent WOTD found')
    }
    await Promise.all(promises)
  }
}
