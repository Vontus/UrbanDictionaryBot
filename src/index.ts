import { TelegramClient } from "./shared/telegram/client";
import { Poller } from "./shared/telegram/poller";
import { route } from "./shared/telegram/router";
import { UdBot } from "./ud-bot";
import { init as initChannel } from "./features/channel";
import logger from "./logger";
import { botToken } from "./config";

const client = new TelegramClient(botToken);
export const bot = new UdBot(client);

const poller = new Poller(
  botToken,
  (update) => route(update, bot.getHandlers(), (e) => void bot.handleError(e)),
  (error) => void bot.handleError(error),
);

const start = async (): Promise<void> => {
  await bot.logToTelegram("Bot started");
  await initChannel(client);
  poller.start();
};

logger.log("Starting...");
void start();
