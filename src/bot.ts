import * as TelegramBot from 'node-telegram-bot-api'

import { UdResponse } from './urban-dictionary/ud-response';
import ud from './urban-dictionary'
import templates from './templates'
import util from './util'
import logger from './logger'

let bot: TelegramBot
let logChatId: number
let ownerId: number
let userBot: TelegramBot.User;

export default {
  start (token: string) {
    if (process.env.LOG_CHAT_ID) {
      logChatId = parseInt(process.env.LOG_CHAT_ID);
    }

    if (process.env.OWNER_ID) {
      ownerId = parseInt(process.env.OWNER_ID)
    }

    bot = new TelegramBot(token, { polling: true })

    bot.on('message', (msg) => this.routeMessage(msg))
    bot.on('error', (error) => this.handleError(error))

    bot.getMe()
      .then(response => userBot = response)
  },

  routeMessage (message: TelegramBot.Message) {
    logger.log(message)
    if (message.chat.id === logChatId) {
      this.handleLogChat(message)
      return
    }

    if (message.chat.type == "private") {
      this.handlePrivateChat(message)
    } else if (message.left_chat_member && message.left_chat_member.id !== userBot.id) {
      bot.leaveChat(message.chat.id)
    }
  },

  handlePrivateChat (message: TelegramBot.Message) {
    if (!message.text) {
      this.sendHelp(message.chat)
      return;
    }
    
    let text : string = message.text

    if (util.isArabic(text)) {
      this.sendArabicResponse(message.chat)
      return
    }

    if (text[0] === "/") {
      this.handleCommand(message)
      return
    }

    // Or else...
    this.handleUdQuery(message)
  },

  handleUdQuery (message: TelegramBot.Message) {
    if (message.text) {
      let text: string = message.text

      ud.define(text)
        .then((response: UdResponse) => {
          if (response.hasDefinitions()) {
            bot.sendMessage(message.chat.id, templates.definition(response.list[0]), { parse_mode: "HTML", disable_web_page_preview: true })
          } else {
            bot.sendMessage(message.chat.id, templates.noResults(text), { parse_mode: "HTML" })
          }
        })
    } else {
      logger.error('Message has no text')
    }
  },

  handleLogChat (message: TelegramBot.Message) {
    if (message.text && message.text.startsWith("/")) {
      this.handleAdminCommand(message);
    }
  },

  handleCommand (message: TelegramBot.Message) {
    if (message.from && message.from.id == ownerId) {
      this.handleAdminCommand(message);
    }

    logger.log("handling command...")
  },

  handleAdminCommand (message: TelegramBot.Message) {
    if (message.text && message.text.startsWith("/eval")) {
      // split only by first space
      let toExec = message.text.split(/ (.+)/g)[1].replace(/\n/g, " ");
      let result;
      try {
        result = eval(toExec);
      } catch (error) {
        result = error;
      }
      if (result) {
        let resultStr = result.toString()
        logger.log('result: ', resultStr);
        if (resultStr.length < 500) {
          bot.sendMessage(message.chat.id, resultStr);
        }
      }
    }
  },

  sendArabicResponse (chat: TelegramBot.Chat) {
    bot.sendMessage(chat.id, templates.arabicResponse())
  },

  sendHelp (chat: TelegramBot.Chat) {
    bot.sendMessage(chat.id, "sending help...")
  },

  handleError (error: any) {
    logger.error("Error: ", error)
    bot.sendMessage(logChatId, error.toString())
  }
}