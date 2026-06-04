import { getWotds } from "../definitions/scraper";
import { getFirstUnsentDef, saveSentChannelDefId } from "./store";
import templates from "../definitions/templates";
import logger from "../../logger";
import { logChatId } from "../../config";
import type { TelegramClient } from "../../shared/telegram/client";

export async function sendWord(
  client: TelegramClient,
  chatId: string,
  saveWotd: boolean,
): Promise<void> {
  logger.info("Retrieving current WOTD...");

  const scrapedDefinitions = await getWotds();
  const defToSend = await getFirstUnsentDef(scrapedDefinitions);

  if (defToSend === undefined) {
    logger.info("No unsent WOTD found");
    if (logChatId != null) {
      await client.sendMessage(logChatId, "No unsent WOTD found");
    }
    return;
  }

  const msgOpts = { parse_mode: "HTML" as const, disable_web_page_preview: true };
  const promises: Array<Promise<unknown>> = [
    client.sendMessage(chatId, templates.definition(defToSend) + "\n\n#WordOfTheDay", msgOpts),
  ];

  if (saveWotd) {
    promises.push(saveSentChannelDefId(defToSend.defId));
  }

  if (defToSend.gif !== undefined) {
    promises.push(client.sendDocument(chatId, defToSend.gif));
  }

  logger.info(`sending wotd '${defToSend.word}' to channel`);
  await Promise.all(promises);
}
