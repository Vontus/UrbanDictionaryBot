import { Message } from 'node-telegram-bot-api'
import logger from './logger'

export class BotCommand {
  label: string
  args: string[]
  fullArgs: string
  message: Message

  constructor (mess: Message) {
    if (!mess.text || !mess.text.startsWith('/')) {
      logger.error('Invalid command message', mess)
      throw new Error('Invalid command message')
    }

    let txt = mess.text

    this.label = txt.substr(1, txt.indexOf(' ') - 1).toLowerCase()
    this.fullArgs = txt.substr(txt.indexOf(' ') + 1)
    this.args = this.fullArgs.split(' ')
    this.message = mess
  }
}
