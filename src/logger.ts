import Debug from 'debug';
let log = Debug('tgbot')
let debug = log.extend('debug')
let error = log.extend('error')

export default {
  log,
  debug,
  error
}
