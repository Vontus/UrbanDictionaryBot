import * as TelegramBot from 'node-telegram-bot-api'
import scraper from './scraper'
import * as scheduler from 'node-schedule'
import logger from '../logger'
import { bot } from '../index'
import urbanApi from '../urban-api'
import templates from '../templates'
import channelStorage from '../storage/channel'

const channelId: string | undefined = process.env.CHANNEL_ID
const channelPostTime: string | undefined = process.env.CHANNEL_POST_TIME

const msgOpts: TelegramBot.SendMessageOptions = {
  parse_mode: 'HTML',
  disable_web_page_preview: true
}

export default {
  async init () {
    if (!channelId) {
      logger.warn('CHANNEL_ID is not defined, aborting WOTD')
      return
    }

    if (!channelPostTime) {
      logger.warn('CHANNEL_POST_TIME is not defined, aborting WOTD')
      return
    }

    if (channelPostTime === 'ONSTART') {
      await this.sendWord(channelId, true)
    } else {
      logger.log(`Scheduling channel posts at ${channelPostTime} ...`)
      scheduler.scheduleJob(channelPostTime, async () => {
        await this.sendWord(channelId, true)
      })
    }

  },

  async sendWord (chatId: string, saveWotd: boolean) {
    const promises: Promise<any>[] = []
    promises.push(bot.logToTelegram('Retrieving current WOTD...'))
    logger.info('Retrieving current WOTD...')

    const scrapedDefinitions = await scraper.getPageDefinitions()
    logger.info('scraped definitions: ', scrapedDefinitions)
    const channelDefToSend = await channelStorage.getFirstUnsentDef(scrapedDefinitions)

    if (channelDefToSend) {
      const defToSend = await urbanApi.defineDefId(channelDefToSend.defId)

      if (!defToSend) {
        await bot.logToTelegram("Couldn't find WOTD to send")
        return
      }

      promises.push(bot.sendMessage(chatId, templates.channelPost(defToSend), msgOpts))

      if (saveWotd) {
        promises.push(channelStorage.saveSentChannelDef(channelDefToSend))
      }

      if (channelDefToSend.gif) {
        promises.push(bot.sendDocument(chatId, channelDefToSend.gif))
      }

      logger.info(`sending definition '${defToSend.defid}' to channel`)
    } else {
      promises.push(bot.logToTelegram('No unsent WOTD found'))
      logger.info('No unsent WOTD found')
    }
    await Promise.all(promises)
  }
}
