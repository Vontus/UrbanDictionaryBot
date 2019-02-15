import Debug from 'debug'
let log = Debug('udbot')
let debug = log.extend('debug')
let warn = log.extend('warn')
let error = log.extend('error')
let info = log.extend('info')

export default {
  log,
  debug,
  warn,
  error,
  info
}
