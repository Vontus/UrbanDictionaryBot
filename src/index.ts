import { UdBot } from "./ud-bot";
import udChannel from "./ud-channel";
import logger from "./logger";
import { botToken } from "./config";

logger.log("Starting...");
const bot = new UdBot(botToken, { polling: true });

const start = async (): Promise<void> => {
  await udChannel.init();
};

void start();

export { bot };
