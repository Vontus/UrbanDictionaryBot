import { Cron } from "croner";
import { sendWord } from "./sender";
import logger from "../../logger";
import { channelId, channelPostTime, logChatId, wotdAnnouncementTime } from "../../config";
import type { TelegramClient } from "../../shared/telegram/client";

export async function init(client: TelegramClient): Promise<void> {
  if (channelId == null) {
    logger.warn("CHANNEL_ID is not defined, aborting WOTD");
    return;
  }

  if (channelPostTime == null) {
    logger.warn("CHANNEL_POST_TIME is not defined, aborting WOTD");
    return;
  }

  if (wotdAnnouncementTime === "ONSTART") {
    logChatId != null && (await sendWord(client, logChatId, false));
  } else if (wotdAnnouncementTime != null) {
    logger.log(`Scheduling WOTD announcement at ${wotdAnnouncementTime}`);
    new Cron(wotdAnnouncementTime, () => {
      logChatId != null && void sendWord(client, logChatId, false);
    });
  }

  if (channelPostTime === "ONSTART") {
    await sendWord(client, channelId, true);
  } else {
    logger.log(`Scheduling channel WOTD at ${channelPostTime}`);
    new Cron(channelPostTime, () => {
      void sendWord(client, channelId as string, true);
    });
  }
}
