import Debug from 'debug';
let log = Debug('tgbot')
let debug = log.extend('debug')
let error = log.extend('error')
let info = log.extend('info')

export default {
  log,
  debug,
  error,
  info
}
