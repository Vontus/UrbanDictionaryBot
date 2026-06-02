import type { InlineQueryResultArticle } from "../../shared/telegram/types";
import { UdDefinition } from "./definition";
import templates from "./templates";
import keyboards from "./keyboards";

export default {
  getResults(definitions: UdDefinition[]): InlineQueryResultArticle[] {
    return definitions.map((def) => ({
      type: "article",
      title: def.word,
      id: def.defId.toString(),
      description: def.definition,
      reply_markup: keyboards.inlineKeyboardResponse(def.word),
      input_message_content: {
        message_text: templates.inlineDefinition(def),
        parse_mode: "HTML" as const,
        disable_web_page_preview: true,
      },
    }));
  },
};
