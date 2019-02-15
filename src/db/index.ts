import * as mongoose from 'mongoose'
import logger from '../logger'
import { Message as TgMessage } from 'node-telegram-bot-api'

import messageSchema from './schemas/message'

let mongoUrl: string

if (process.env.MONGO_URL) {
  mongoUrl = process.env.MONGO_URL
} else {
  logger.error('MONGO_URL is not defined in .ENV')
  throw new Error('MONGO_URL is not defined in .ENV')
}

mongoose.connect(mongoUrl, { useNewUrlParser: true })

const MessageModel: mongoose.Model<mongoose.Document> = mongoose.model('Message', messageSchema)

export default {
  async saveMessage (tgMsg: TgMessage): Promise<void> {
    const message: mongoose.Document = new MessageModel({ text: tgMsg.text })
    await message.save()
  }
}
