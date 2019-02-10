import bot from './bot'

let token: string = process.env.BOT_TOKEN || ''

if (!token) {
  console.error("BOT_TOKEN is not set in .env")
  process.exit()
}

const start = async () => {
  bot.start(token)
}

start()
