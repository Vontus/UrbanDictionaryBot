import { User } from "node-telegram-bot-api";
import logger from "./logger";

let botUsername: string;

if (process.env.BOT_USERNAME) {
  botUsername = process.env.BOT_USERNAME
}

export default {
  bold (text: string) {
    return `<b>${text}</b>`;
  },

  link (description: string, url: string) {
    return `<a href=\"${url}\">${description}</a>`;
  },

  mention (user: User, description?: string) {
    return this.link(description || user.first_name, `tg://user?id=${user.id}`);
  },

  code (text: string) {
    return `<code>${text}</code>`;
  },

  startUrl(query: string): string {
    if (botUsername) {
      return `https://t.me/${botUsername}?start=${this.toB64(query)}`;
    }
    logger.error("Bot username not defined in environment")
    throw new Error("Bot username not defined in environment")
  },

  toB64 (text: string): string {
    return Buffer.from(text).toString('base64')
  },

  fromB64 (text: string): string {
    return Buffer.from(text, 'base64').toString('ascii')
  }
}