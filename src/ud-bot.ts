import * as TelegramBot from 'node-telegram-bot-api'
import * as format from 'string-template'

import UrbanApi from './urban-api'
import templates from './templates'
import util from './util'
import logger from './logger'
import udKeyboards from './ud-keyboards'
import inlineResults from './inline-results'
import { BotCommand } from './bot-command'
import { UdDefinition } from './urban-api/ud-definition'
import strings from './strings'
import formatter from './formatter'

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

    this.getMe()
      .then(response => {
        userBot = response
      })
  }

  async onInlineQuery (inlineQuery: TelegramBot.InlineQuery) {
    if (inlineQuery.query) {
      const definitions = await UrbanApi.defineTerm(inlineQuery.query)
      this.answerInlineQuery(inlineQuery.id, inlineResults.getResults(definitions))
    } else {
      this.answerInlineQuery(inlineQuery.id, [])
    }
  }

  async routeMessage (message: TelegramBot.Message) {
    if (message.chat.id === logChatId) {
      this.handleLogChat(message)
      return
    }

    if (message.chat.type === 'private') {
      this.handlePrivateChat(message)
    } else if (message.left_chat_member && message.left_chat_member.id !== userBot.id) {
      this.leaveChat(message.chat.id)
    }
  }

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
  }

  handleUdQuery (message: TelegramBot.Message) {
    if (message.text) {
      let text: string = message.text

      UrbanApi.defineTerm(text)
        .then((defs: UdDefinition[]) => {
          if (defs && defs.length > 0) {
            this.sendDefinition(message.chat.id, defs, 0, true)
          } else {
            this.sendMessage(
              message.chat.id,
              format(strings.noResults, text),
              { parse_mode: 'HTML' })
          }
        })
    }
  }

  handleLogChat (message: TelegramBot.Message) {
    if (message.text && message.text.startsWith('/') && message.from && message.from.id === ownerId) {
      this.handleAdminCommand(new BotCommand(message))
    }
  }

  async handleCallbackQuery (callbackQuery: TelegramBot.CallbackQuery) {
    if (!callbackQuery.message) {
      logger.error('No message received from callbackQuery')
      return
    }

    if (callbackQuery.data === 'ignore') {
      this.answerCallbackQuery({
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

    this.editMessageText(templates.definition(def), editMessOptions)
  }

  sendDefinition (chatId: number | string, defs: UdDefinition[], pos: number, keyboard?: boolean) {
    let msgOptions: TelegramBot.SendMessageOptions = {
      parse_mode: 'HTML',
      disable_web_page_preview: true,
      reply_markup: keyboard ? udKeyboards.buildFromDefinition({ definitions: defs, position: 0 }) : undefined
    }
    this.sendMessage(chatId, templates.definition(defs[pos]), msgOptions)
  }

  sendArabicResponse (chat: TelegramBot.Chat) {
    this.sendMessage(chat.id, strings.arabicResponse)
  }

  sendHelp (chat: TelegramBot.Chat) {
    this.sendMessage(chat.id, strings.help)
  }

  handleError (error: any) {
    logger.error(error)
    this.logToTelegram(error)
  }

  logToTelegram (message: string) {
    if (logChatId) {
      this.sendMessage(logChatId, message)
    }
  }

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
            this.sendMessage(command.message.chat.id, resultStr)
          }
        }
      } else {
        this.sendMessage(command.message.chat.id, strings.commands.eval.noargs)
      }
    }
  }

  async handleCommand (command: BotCommand) {
    switch (command.label) {
      case 'start':
        if (command.args.length > 0) {
          let word = formatter.decompress(command.args[0])
          let defs = (await UrbanApi.defineTerm(word))
          this.sendDefinition(command.message.chat.id, defs, 0, true)
        } else {
          this.sendMessage(command.message.chat.id, strings.commands.start)
        }
        break
      case 'about':
        this.sendMessage(
          command.message.chat.id,
          strings.commands.about,
          { parse_mode: 'HTML', disable_web_page_preview: true }
        )
        break
      case 'donate':
        this.sendMessage(
          command.message.chat.id,
          strings.commands.donate,
          { parse_mode: 'HTML', disable_web_page_preview: true })
        break
      case 'random':
        this.sendDefinition(
          command.message.chat.id,
          await UrbanApi.random(),
          0,
          true
        )
        break
      case 'help':
      default:
        this.sendHelp(command.message.chat)
        break
    }
  }
}
