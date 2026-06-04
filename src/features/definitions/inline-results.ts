import type { InlineQueryResultArticle } from "../../shared/telegram/types";
import type { UdDefinition } from "./definition";
import templates from "./templates";
import keyboards from "./keyboards";
import { truncateHtml } from "./formatter";
import { messageCharacterLimit } from "../../config";

const TRUNCATION_MARGIN = 100; // safety buffer + room for the "Read more" suffix

export function buildMessageText(definition: UdDefinition): string {
  const full = templates.definition(definition);
  if (full.length <= messageCharacterLimit) return full;

  const readMore = ` <a href="${definition.permalink}">Read more</a>`;
  const shell = templates.definition({ ...definition, formattedDefinition: "", formattedExample: "" });
  const available = messageCharacterLimit - shell.length - TRUNCATION_MARGIN;
  const half = Math.floor(available / 2);

  // Each field gets the space the other doesn't use, guaranteed at least half
  const definitionBudget = available - Math.min(definition.formattedExample.length, half);
  const exampleBudget    = available - Math.min(definition.formattedDefinition.length, half);

  return templates.definition({
    ...definition,
    formattedDefinition: truncateHtml(definition.formattedDefinition, definitionBudget, `...${readMore}`),
    formattedExample: truncateHtml(definition.formattedExample, exampleBudget, `...${readMore}`),
  });
}

export default {
  getResults(definitions: UdDefinition[]): InlineQueryResultArticle[] {
    return definitions.map((definition) => ({
      type: "article",
      title: definition.word,
      id: definition.defId.toString(),
      description: definition.definition,
      reply_markup: keyboards.inlineKeyboardResponse(definition.word),
      input_message_content: {
        message_text: buildMessageText(definition),
        parse_mode: "HTML" as const,
        disable_web_page_preview: true,
      },
    }));
  },
};
