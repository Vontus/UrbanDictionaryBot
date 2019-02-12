const mongoose = require('mongoose')
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

mongoose.connect(mongoUrl, {useNewUrlParser: true});

const MessageModel = mongoose.model('Message', messageSchema);

// const kitty = new Cat({ name: 'Zildjian' });
// kitty.save().then(() => console.log('meow'));

export default {
  saveMessage (tgMsg: TgMessage) {
    const message = new MessageModel({ text: tgMsg.text })
    message.save().then(() => console.log('aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa'))
  }
}