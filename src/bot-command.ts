import { Message } from "node-telegram-bot-api";
import logger from "./logger";

export class BotCommand {
  label: string;
  args: string[];
  message: Message;

  constructor (mess: Message) {
    if (!mess.text || !mess.text.startsWith("/")) {
      logger.error("Invalid command message", mess)
      throw new Error("Invalid command message")
    }

    let split = mess.text.split(" ");

    this.label = split[0].slice(1);
    this.args = split.slice(1)
    this.message = mess;
  }
}