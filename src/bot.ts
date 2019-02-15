import * as TelegramBot from 'node-telegram-bot-api'

import UrbanApi from './urban-api'
import templates from './templates'
import util from './util'
import logger from './logger'
import udKeyboards from './ud-keyboards'
import { BotCommand } from './bot-command'
import { UdDefinition } from './urban-api/ud-definition'
import formatter from './formatter'

let botToken: string = util.getRequiredEnvVar('BOT_TOKEN')
let logChatId: number | null = process.env.LOG_CHAT_ID ? parseInt(process.env.LOG_CHAT_ID, 10) : null
let ownerId: number | null = process.env.OWNER_ID ? parseInt(process.env.OWNER_ID, 10) : null

let bot: TelegramBot = new TelegramBot(botToken, { polling: true })
let userBot: TelegramBot.User

export default {
  bot,

  start () {
    bot.on('message', (msg) => this.routeMessage(msg))
    bot.on('error', (error) => this.handleError(error))
    bot.on('callback_query', callbackQuery => this.handleCallbackQuery(callbackQuery))

    bot.getMe()
      .then(response => userBot = response)
  },

  async routeMessage (message: TelegramBot.Message) {
    logger.log(message)
    if (message.chat.id === logChatId) {
      this.handleLogChat(message)
      return
    }

    if (message.chat.type === 'private') {
      this.handlePrivateChat(message)
    } else if (message.left_chat_member && message.left_chat_member.id !== userBot.id) {
      bot.leaveChat(message.chat.id)
    }
  },

  handlePrivateChat (message: TelegramBot.Message) {
    if (!message.text) {
      this.sendHelp(message.chat)
      return
    }

    let text: string = message.text

    if (util.isArabic(text)) {
      this.sendArabicResponse(message.chat)
      return
    }

    if (text[0] === '/') {
      this.handleCommand(new BotCommand(message))
      return
    }

    // Or else...
    this.handleUdQuery(message)
  },

  handleUdQuery (message: TelegramBot.Message) {
    if (message.text) {
      let text: string = message.text

      UrbanApi.defineTerm(text)
        .then((defs: UdDefinition[]) => {
          if (defs && defs.length > 0) {
            this.sendDefinition(message.chat.id, defs, 0, true)
          } else {
            bot.sendMessage(message.chat.id, templates.noResults(text), { parse_mode: 'HTML' })
          }
        })
    } else {
      logger.error('Message has no text')
    }
  },

  handleLogChat (message: TelegramBot.Message) {
    if (message.text && message.text.startsWith('/')) {
      this.handleAdminCommand(new BotCommand(message))
    }
  },

  async handleCommand (command: BotCommand) {
    let message = command.message
    if (message.from && message.from.id === ownerId) {
      this.handleAdminCommand(command)
    }

    if (command.label === 'start') {
      if (command.args.length > 0) {
        let word = formatter.fromB64(command.args[0])
        let defs = (await UrbanApi.defineTerm(word))
        this.sendDefinition(message.chat.id, defs, 0, true)
      } else {
        bot.sendMessage(message.chat.id, 'Type the word or expression you want to search.')
      }
    }
  },

  handleAdminCommand (command: BotCommand) {
    if (command.label === 'eval') {
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
          bot.sendMessage(command.message.chat.id, resultStr)
        }
      }
    }
  },

  async handleCallbackQuery (callbackQuery: TelegramBot.CallbackQuery) {
    if (!callbackQuery.message) {
      logger.error('No message received from callbackQuery')
      return
    }

    if (callbackQuery.data === 'ignore') {
      bot.answerCallbackQuery({
        callback_query_id: callbackQuery.id
      })
      return
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

    bot.editMessageText(templates.definition(def), editMessOptions)
  },

  sendDefinition (chatId: number | string, defs: UdDefinition[], pos: number, keyboard?: boolean) {
    let msgOptions: TelegramBot.SendMessageOptions = {
      parse_mode: 'HTML',
      disable_web_page_preview: true,
      reply_markup: keyboard ? udKeyboards.buildFromDefinition({ definitions: defs, position: 0 }) : undefined
    }
    bot.sendMessage(chatId, templates.definition(defs[pos]), msgOptions)
  },

  sendArabicResponse (chat: TelegramBot.Chat) {
    bot.sendMessage(chat.id, templates.arabicResponse())
  },

  sendHelp (chat: TelegramBot.Chat) {
    bot.sendMessage(chat.id, 'sending help...')
  },

  handleError (error: any) {
    logger.error('Error: ', error)
    if (logChatId) {
      bot.sendMessage(logChatId, error.toString())
    }
  }
}
