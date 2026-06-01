import { z } from "zod";

const env = z
  .object({
    BOT_TOKEN: z.string(),
    BOT_USERNAME: z.string().optional(),
    LOG_CHAT_ID: z.string().optional(),
    ADMIN_ID: z.string().optional(),
    STATS_POST_TIME: z.string().optional(),
    CHANNEL_POST_TIME: z.string().optional(),
    WOTD_ANNOUNCEMENT_TIME: z.string().optional(),
    CHANNEL_ID: z.string().optional(),
    CHANNEL_LINK: z.string().optional(),
    DATA_PATH: z.string().default("./data/"),
    MAX_CHANNEL_DEFS: z.coerce.number().int().positive().default(10),
    MESSAGE_CHARACTER_LIMIT: z.coerce.number().int().positive().default(4096),
  })
  .parse(process.env);

export const botToken = env.BOT_TOKEN;
export const botUsername = env.BOT_USERNAME;
export const logChatId = env.LOG_CHAT_ID;
export const adminId = env.ADMIN_ID;
export const statsPostTime = env.STATS_POST_TIME;
export const channelPostTime = env.CHANNEL_POST_TIME;
export const wotdAnnouncementTime = env.WOTD_ANNOUNCEMENT_TIME;
export const channelId = env.CHANNEL_ID;
export const channelLink = env.CHANNEL_LINK;
export const dataPath = env.DATA_PATH;
export const maxChannelDefs = env.MAX_CHANNEL_DEFS;
export const messageCharacterLimit = env.MESSAGE_CHARACTER_LIMIT;
