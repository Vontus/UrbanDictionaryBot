import { Message } from 'node-telegram-bot-api'
import logger from './logger'

export class BotCommand {
  label: string
  fullArgs: string | null = null
  args: string[] = []
  message: Message

  constructor (mess: Message) {
    if (mess.text == null || !mess.text.startsWith('/')) {
      logger.error('Invalid command message', mess)
      throw new Error('Invalid command message')
    }

    const txt = mess.text
    const firstSpaceIndex = txt.indexOf(' ')
    const hasArgs = firstSpaceIndex > -1

    if (hasArgs) {
      const argsIndex = firstSpaceIndex + 1
      this.fullArgs = txt.substr(argsIndex)
      this.args = this.fullArgs.split(' ')
    }

    this.label = txt.substr(1, hasArgs ? firstSpaceIndex - 1 : undefined).toLowerCase()
    this.message = mess
  }
}
