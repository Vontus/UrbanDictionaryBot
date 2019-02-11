import mongoose from 'mongoose'
import logger from '../logger'

let mongoUrl: string

if (process.env.MONGO_URL) {
  mongoUrl = process.env.MONGO_URL
} else {
  logger.error('MONGO_URL is not defined in .ENV')
  throw new Error('MONGO_URL is not defined in .ENV')
}

mongoose.connect(mongoUrl, {useNewUrlParser: true});

const Cat = mongoose.model('Cat', new mongoose.Schema({ name: String }));

const kitty = new Cat({ name: 'Zildjian' });
kitty.save().then(() => console.log('meow'));
