import * as TelegramBot from 'node-telegram-bot-api'
import { AxiosResponse } from 'axios';

import ud from './urban-dictionary'
import { UrbanResponse } from './urban-dictionary/urban-response';
import templates from './templates'

let bot : TelegramBot

export default {
  start (token: string) {
    bot = new TelegramBot(token, { polling: true })

    bot.onText(/.*/, (msg) => this.routeMessage(msg))
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
      this.handleUdQuery(message)
    } else {
      console.error('chat type: ', message.chat.type)
    }
  },

  handlePrivateChat (message: TelegramBot.Message) {
    if (message.text && message.text[0] === "/") {
      this.handleUdQuery(message)
    } else {
      this.sendHelp(message.chat)
    }
  },

  handleUdQuery (message: TelegramBot.Message) {
    if (message.text) {
      let text: string = message.text
      
      ud.define(text)
      .then(({ data: response }: AxiosResponse<UrbanResponse>) => {
        if (response.hasDefinitions()) {
          bot.sendMessage(message.chat.id, templates.definition(response.list[0]), { parse_mode: "HTML" })
        } else {
          bot.sendMessage(message.chat.id, templates.noResults(text), { parse_mode: "HTML"})
        }
      })
    } else {
      console.error('Message has no text')
    }
  },

  handleLogChat (message: TelegramBot.Message) {
    console.log('log message', message.text)
  },

  sendHelp (chat: TelegramBot.Chat) {
    bot.sendMessage(chat.id, "sending help...")
  }
}