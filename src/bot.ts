import * as TelegramBot from 'node-telegram-bot-api'

import UrbanApi from './urban-api'
import templates from './templates'
import util from './util'
import logger from './logger'
import udKeyboards from './ud-keyboards'
import { BotCommand } from './bot-command'
import { UdDefinition } from './urban-api/ud-definition'
import formatter from './formatter'
import strings from './strings'
import * as format from 'string-template'

let botToken: string = util.getRequiredEnvVar('BOT_TOKEN')
let logChatId: number | null = process.env.LOG_CHAT_ID ? parseInt(process.env.LOG_CHAT_ID, 10) : null
let ownerId: number | null = process.env.OWNER_ID ? parseInt(process.env.OWNER_ID, 10) : null

let bot: TelegramBot = new TelegramBot(botToken, { polling: true })
let userBot: TelegramBot.User

export default {
  bot,

  async start () {
    bot.on('message', (msg) => this.routeMessage(msg))
    bot.on('error', (error) => this.handleError(error))
    bot.on('callback_query', callbackQuery => this.handleCallbackQuery(callbackQuery))

    userBot = await bot.getMe()
  },

  async routeMessage (message: TelegramBot.Message) {
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
            bot.sendMessage(message.chat.id, format(strings.noResults, text), { parse_mode: 'HTML' })
          }
        })
    }
  },

  handleLogChat (message: TelegramBot.Message) {
    if (message.text && message.text.startsWith('/')) {
      this.handleAdminCommand(new BotCommand(message))
    }
  },

  async handleCommand (command: BotCommand) {
    if (command.label === 'start') {
      if (command.args.length > 0) {
        let word = formatter.fromB64(command.args[0])
        let defs = (await UrbanApi.defineTerm(word))
        this.sendDefinition(command.message.chat.id, defs, 0, true)
      } else {
        bot.sendMessage(command.message.chat.id, 'Type the word or expression you want to search.')
      }
      return
    }

    if (command.label === 'help') {
      this.sendHelp(command.message.chat)
    }
  },

  handleAdminCommand (command: BotCommand) {
    if (command.label === 'eval') {
      if (command.fullArgs != null) {
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
      } else {
        bot.sendMessage(command.message.chat.id, 'Please specify the code to eval')
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
    bot.sendMessage(chat.id, strings.arabicResponse)
  },

  sendHelp (chat: TelegramBot.Chat) {
    bot.sendMessage(chat.id, 'I can help you find out about english slang by sending a message here or via inline mode! 😎')
  },

  handleError (error: any) {
    logger.error(error)
    this.logToTelegram(error)
  },

  logToTelegram (message: string) {
    if (logChatId) {
      bot.sendMessage(logChatId, message)
    }
  }
}
