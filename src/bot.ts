import * as TelegramBot from 'node-telegram-bot-api'
import { AxiosResponse } from 'axios';

import { UdResponse } from './urban-dictionary/ud-response';
import ud from './urban-dictionary'
import templates from './templates'
import util from './util'

let bot : TelegramBot

export default {
  start (token: string) {
    bot = new TelegramBot(token, { polling: true })

    bot.on('message', (msg) => this.routeMessage(msg))
  },

  routeMessage (message: TelegramBot.Message) {
    if (process.env.LOG_CHAT_ID) {
      let logChatId = parseInt(process.env.LOG_CHAT_ID);
      if (message.chat.id === logChatId) {
        this.handleLogChat(message)
        return
      }
    }

    if (message.chat.type == "private") {
      this.handlePrivateChat(message)
    } else {
      console.error('chat type: ', message.chat.type)
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
      .then(({ data: response }: AxiosResponse<UdResponse>) => {
        if (response.hasDefinitions()) {
          bot.sendMessage(message.chat.id, templates.definition(response.list[0]), { parse_mode: "HTML", disable_web_page_preview: true })
        } else {
          bot.sendMessage(message.chat.id, templates.noResults(text), { parse_mode: "HTML" })
        }
      })
    } else {
      console.error('Message has no text')
    }
  },

  handleLogChat (message: TelegramBot.Message) {
    console.log('log message', message.text)
  },

  handleCommand (message: TelegramBot.Message) {
    bot.sendMessage(message.chat.id, "handling command...")
  },

  sendArabicResponse (chat: TelegramBot.Chat) {
    bot.sendMessage(chat.id, templates.arabicResponse())
  },

  sendHelp (chat: TelegramBot.Chat) {
    bot.sendMessage(chat.id, "sending help...")
  }
}