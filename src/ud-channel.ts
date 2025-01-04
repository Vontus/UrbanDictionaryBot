import * as TelegramBot from "node-telegram-bot-api";
import * as scheduler from "node-schedule";
import logger from "./logger";
import { bot } from "./index";
import templates from "./templates";
import { getFirstUnsentDef, saveSentChannelDefId } from "./storage/channel";
import { getWotds } from "./urban-api/scraper";
import {
  channelId,
  channelPostTime,
  logChatId,
  wotdAnnouncementTime,
} from "./config";

const msgOpts: TelegramBot.SendMessageOptions = {
  parse_mode: "HTML",
  disable_web_page_preview: true,
};

export default {
  async init() {
    if (channelId == null) {
      logger.warn("CHANNEL_ID is not defined, aborting WOTD");
      return;
    }

    if (channelPostTime == null) {
      logger.warn("CHANNEL_POST_TIME is not defined, aborting WOTD");
      return;
    }

    if (wotdAnnouncementTime === "ONSTART") {
      logChatId && (await this.sendWord(logChatId, false));
    } else if (wotdAnnouncementTime != null) {
      logger.log(`Scheduling WOTD announcement at ${wotdAnnouncementTime}`);
      scheduler.scheduleJob(wotdAnnouncementTime, () => {
        logChatId != null && void this.sendWord(logChatId, false);
      });
    }

    if (channelPostTime === "ONSTART") {
      await this.sendWord(channelId, true);
    } else {
      logger.log(`Scheduling channel WOTD at ${channelPostTime}`);
      scheduler.scheduleJob(channelPostTime, () => {
        channelId != null && void this.sendWord(channelId, true);
      });
    }
  },

  async sendWord(chatId: string, saveWotd: boolean) {
    const promises: Array<Promise<unknown>> = [];
    logger.info("Retrieving current WOTD...");

    const scrapedDefinitions = await getWotds();
    const defToSend = await getFirstUnsentDef(scrapedDefinitions);

    if (defToSend === undefined) {
      promises.push(bot.logToTelegram("No unsent WOTD found"));
      logger.info("No unsent WOTD found");
      return;
    }

    promises.push(
      bot.sendMessage(chatId, templates.channelPost(defToSend), msgOpts),
    );

    if (saveWotd) {
      promises.push(saveSentChannelDefId(defToSend.defId));
    }

    if (defToSend.gif !== undefined) {
      promises.push(bot.sendDocument(chatId, defToSend.gif));
    }

    logger.info(`sending wotd '${defToSend.word}' to channel`);
    await Promise.all(promises);
  },
};
