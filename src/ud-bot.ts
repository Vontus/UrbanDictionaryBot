import * as TelegramBot from 'node-telegram-bot-api'
import * as format from 'string-template'

import UrbanApi from './urban-api'
import templates from './templates'
import util from './util'
import logger from './logger'
import * as scheduler from 'node-schedule'
import udKeyboards from './ud-keyboards'
import inlineResults from './inline-results'
import { BotCommand } from './bot-command'
import { UdDefinition } from './urban-api/ud-definition'
import strings from './strings'
import formatter from './formatter'
import { addStats, getTodayTotalStats } from './storage/stats'
import { InteractionType } from './storage/stats-data'
import * as YAML from 'yamljs'

let logChatId: number | null = process.env.LOG_CHAT_ID ? parseInt(process.env.LOG_CHAT_ID, 10) : null
let ownerId: number | null = process.env.OWNER_ID ? parseInt(process.env.OWNER_ID, 10) : null

let userBot: TelegramBot.User

export class UdBot extends TelegramBot {
  public constructor (token: string, options: TelegramBot.ConstructorOptions) {
    super(token, options)

    this.on('message', (msg) => this.routeMessage(msg))
    this.on('error', (error) => this.handleError(error))
    this.on('callback_query', callbackQuery => this.handleCallbackQuery(callbackQuery))
    this.on('inline_query', query => this.onInlineQuery(query))
    this.on('chosen_inline_result', chosenResult => this.onChosenInlineResult(chosenResult))

    if (logChatId) {
      scheduler.scheduleJob(process.env.STATS_POST_TIME || '0 0 0 * * *', async () => {
        if (logChatId) {
          await this.sendStats(logChatId)
        }
      })
    }
  }

  async onChosenInlineResult (chosenInlineResult: TelegramBot.ChosenInlineResult) {
    await addStats(chosenInlineResult.from.id, InteractionType.InlineQuery)
  }

  async onInlineQuery (inlineQuery: TelegramBot.InlineQuery) {
    if (inlineQuery.query) {
      const definitions = await UrbanApi.defineTerm(inlineQuery.query)
      await this.answerInlineQuery(inlineQuery.id, inlineResults.getResults(definitions))
    } else {
      await this.answerInlineQuery(inlineQuery.id, [])
    }
  }

  async routeMessage (message: TelegramBot.Message) {
    if (message.chat.id === logChatId) {
      return this.handleLogChat(message)
    }

    if (message.chat.type === 'private') {
      return this.handlePrivateChat(message)
    } else if (message.left_chat_member && message.left_chat_member.id !== userBot.id) {
      return this.leaveChat(message.chat.id)
    }
  }

  async handlePrivateChat (message: TelegramBot.Message) {
    if (!message.text) {
      return this.sendHelp(message.chat)
    }

    let text: string = message.text

    if (util.isArabic(text)) {
      return this.sendArabicResponse(message.chat)
    }

    if (text[0] === '/') {
      return this.handleCommand(new BotCommand(message))
    }

    // Or else...
    return Promise.all([
      this.handleUdQuery(message),
      addStats(message.chat.id, InteractionType.Message)
    ])
  }

  async handleUdQuery (message: TelegramBot.Message) {
    if (message.text) {
      let text: string = message.text

      const defs = await UrbanApi.defineTerm(text)

      if (defs && defs.length > 0) {
        return this.sendDefinition(message.chat.id, defs, 0, true)
      } else {
        return this.sendMessage(
          message.chat.id,
          format(strings.noResults, text),
          { parse_mode: 'HTML' })
      }
    }
  }

  async handleLogChat (message: TelegramBot.Message) {
    if (message.text && message.text.startsWith('/') && message.from && message.from.id === ownerId) {
      await this.handleAdminCommand(new BotCommand(message))
    }
  }

  async handleCallbackQuery (callbackQuery: TelegramBot.CallbackQuery) {
    if (!callbackQuery.message) {
      logger.error('No message received from callbackQuery')
      return
    }

    if (callbackQuery.data === 'ignore') {
      return this.answerCallbackQuery(callbackQuery.id)
    }

    let buttonResponse = await udKeyboards.parseButtonClick(callbackQuery)
    let def = buttonResponse.definitions[buttonResponse.position]
    let inlineKeyboard = udKeyboards.buildFromDefinition(buttonResponse)

    let editMessOptions: TelegramBot.EditMessageTextOptions = {
      chat_id: callbackQuery.message.chat.id,
      disable_web_page_preview: true,
      message_id: callbackQuery.message.message_id,
      parse_mode: 'HTML',
      reply_markup: inlineKeyboard
    }

    return Promise.all([
      this.editMessageText(templates.definition(def), editMessOptions),
      addStats(callbackQuery.message.chat.id, InteractionType.ButtonClick)
    ])
  }

  async sendDefinition (chatId: number | string, defs: UdDefinition[], pos: number, keyboard?: boolean) {
    let msgOptions: TelegramBot.SendMessageOptions = {
      parse_mode: 'HTML',
      disable_web_page_preview: true,
      reply_markup: keyboard ? udKeyboards.buildFromDefinition({ definitions: defs, position: 0 }) : undefined
    }
    return this.sendMessage(chatId, templates.definition(defs[pos]), msgOptions)
  }

  async sendArabicResponse (chat: TelegramBot.Chat) {
    return this.sendMessage(chat.id, strings.arabicResponse)
  }

  async sendHelp (chat: TelegramBot.Chat) {
    return this.sendMessage(chat.id, strings.help)
  }

  async handleError (error: any) {
    logger.error(error)
    return this.logToTelegram(error)
  }

  async logToTelegram (message: string) {
    if (logChatId) {
      return this.sendMessage(logChatId, message)
    }
  }

  async handleAdminCommand (command: BotCommand) {
    switch (command.label) {
      case 'eval':
        await this.handleEvalCommand(command)
        break
      case 'stats':
        await this.handleStatsCommand(command)
    }
  }

  async handleStatsCommand (command: BotCommand) {
    return this.sendStats(command.message.chat.id)
  }

  async sendStats (chatId: number) {
    return this.sendMessage(chatId, "Today's Stats:\n\n" + YAML.stringify(await getTodayTotalStats()))
  }

  async handleEvalCommand (command: BotCommand) {
    if (command.fullArgs !== null) {
      let toExec = command.fullArgs
      let result
      try {
        // tslint:disable-next-line:no-eval
        result = eval(toExec)
      } catch (error) {
        result = error
      }
      if (result) {
        let resultStr = result.toString()
        logger.log('result: ', resultStr)
        if (resultStr.length < 500) {
          return this.sendMessage(command.message.chat.id, resultStr)
        }
      }
    } else {
      return this.sendMessage(command.message.chat.id, strings.commands.eval.noargs)
    }
  }

  async handleCommand (command: BotCommand) {
    switch (command.label) {
      case 'start':
        if (command.args.length > 0) {
          let word = formatter.decompress(command.args[0])
          let defs = (await UrbanApi.defineTerm(word))
          await this.sendDefinition(command.message.chat.id, defs, 0, true)
        } else {
          await this.sendMessage(command.message.chat.id, strings.commands.start)
        }
        break
      case 'about':
        await this.sendMessage(
          command.message.chat.id,
          strings.commands.about,
          { parse_mode: 'HTML', disable_web_page_preview: true }
        )
        break
      case 'donate':
        await this.sendMessage(
          command.message.chat.id,
          strings.commands.donate,
          { parse_mode: 'HTML', disable_web_page_preview: true })
        break
      case 'random':
        await this.sendDefinition(
          command.message.chat.id,
          await UrbanApi.random(),
          0,
          true
        )
        break
      case 'help':
      default:
        await this.sendHelp(command.message.chat)
        break
    }
  }
}
