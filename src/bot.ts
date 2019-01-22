import * as TelegramBot from 'node-telegram-bot-api'
import ud from './urban-dictionary'
import { UrbanResponse } from './urban-dictionary/urban-response';
import { AxiosResponse } from 'axios';

let bot : TelegramBot

export default {
  start (token: string) {
    bot = new TelegramBot(token, { polling: true })

    bot.onText(/.*/, (msg) => this.handleText(msg))
  },

  handleText (message: TelegramBot.Message) {
    if (message.text) {
      ud.define(message.text)
        .then(({ data: response }: AxiosResponse<UrbanResponse>) => {
          bot.sendMessage(message.chat.id, response.list[0].definition)
        })
    }
  }
}