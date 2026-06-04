import type { InlineQueryResultArticle } from "../../shared/telegram/types";
import type { UdDefinition } from "./definition";
import { buildDefinitionText } from "./templates";
import keyboards from "./keyboards";
import { inlineCharacterLimit } from "../../config";

export default {
  getResults(definitions: UdDefinition[]): InlineQueryResultArticle[] {
    return definitions.map((definition) => ({
      type: "article",
      title: definition.word,
      id: definition.defId.toString(),
      description: definition.definition,
      reply_markup: keyboards.inlineKeyboardResponse(definition.word),
      input_message_content: {
        message_text: buildDefinitionText(definition, inlineCharacterLimit),
        parse_mode: "HTML" as const,
        disable_web_page_preview: true,
      },
    }));
  },
};
