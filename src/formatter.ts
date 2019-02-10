import { User } from "node-telegram-bot-api";

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
  }
}