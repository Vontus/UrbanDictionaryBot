import { User } from "node-telegram-bot-api";
import logger from "./logger";

let botUsername: string;

if (process.env.BOT_USERNAME) {
  botUsername = process.env.BOT_USERNAME
}

export default {
  ITALIC_OPEN_TAG: '<i>',
  ITALIC_CLOSE_TAG: '</i>',
  BOLD_OPEN_TAG: '<b>',
  BOLD_CLOSE_TAG: '</b>',
  CODE_OPEN_TAG: '<code>',
  CODE_CLOSE_TAG: '</code>',

  italic (text: string): string {
    return this.ITALIC_OPEN_TAG + text + this.ITALIC_CLOSE_TAG;
  },

  bold (text: string): string {
    return this.BOLD_OPEN_TAG + text + this.BOLD_CLOSE_TAG;
  },

  code (text: string) {
    return this.CODE_OPEN_TAG + text + this.CODE_CLOSE_TAG;
  },

  link (description: string, url: string) {
    return `<a href=\"${url}\">${description}</a>`;
  },

  mention (user: User, description?: string) {
    return this.link(description || user.first_name, `tg://user?id=${user.id}`);
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