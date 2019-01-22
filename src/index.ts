import * as yargsParser from 'yargs-parser'
import bot from './bot'
require('dotenv').config()

// Process command line arguments and environment variables
const argv = yargsParser(process.argv.slice(2))

const log = typeof argv.log === 'boolean' ?
  argv.log : JSON.stringify(process.env.NODE_ENV) === 'development'

let token: string = process.env.BOT_TOKEN || ''

if (!token) {
  console.error("BOT_TOKEN is not set in .env")
  process.exit()
}

const start = async () => {
  bot.start(token)

  // try {
  //   await fastify.listen(port)
  //   fastify.log.info(`Matterhorn server started on port ${port}`)
  // } catch (err) {
  //   fastify.log.error(err)
  //   process.exit(1)
  // }
}

start()
