import * as Fs from "fs";
import { UdDefinition } from "./definition";
import { truncateHtml } from "./formatter";
import { messageCharacterLimit } from "../../config";

const TRUNCATION_MARGIN = 100; // safety buffer + room for the "Read more" suffix

const definitionTemplate = readTemplate("definition");

export default {
  definition(data: Pick<UdDefinition, "permalink" | "word" | "formattedDefinition" | "formattedExample">): string {
    return format(definitionTemplate, data);
  },
};

export function buildDefinitionText(definition: UdDefinition, limit = messageCharacterLimit): string {
  const full = format(definitionTemplate, definition);
  if (full.length <= limit) return full;

  const readMore = ` <a href="${definition.permalink}">Read more</a>`;
  const shell = format(definitionTemplate, { ...definition, formattedDefinition: "", formattedExample: "" });
  const available = limit - shell.length - TRUNCATION_MARGIN;
  const half = Math.floor(available / 2);

  // Each field gets the space the other doesn't use, guaranteed at least half
  const definitionBudget = available - Math.min(definition.formattedExample.length, half);
  const exampleBudget    = available - Math.min(definition.formattedDefinition.length, half);

  return format(definitionTemplate, {
    ...definition,
    formattedDefinition: truncateHtml(definition.formattedDefinition, definitionBudget, `...${readMore}`),
    formattedExample: truncateHtml(definition.formattedExample, exampleBudget, `...${readMore}`),
  });
}

function readTemplate(name: string): string {
  return Fs.readFileSync(`./resources/templates/${name}.txt`, "utf8").toString();
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function format(template: string, data: any): string {
  return template.replace(/\{(\w+)\}/g, (_, k) => String(data[k] ?? ""));
}
