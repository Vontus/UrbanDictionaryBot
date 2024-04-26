import * as Fs from "fs";
import * as format from "string-template";
import { UdDefinition } from "./urban-api/ud-definition";

const definitionTemplate = readTemplate("definition");
const channelPostTemplate = readTemplate("channel-post");
const inlineDefinitionTemplate = readTemplate("inline-definition");

export default {
  definition(data: UdDefinition): string {
    return format(definitionTemplate, data);
  },

  channelPost(data: UdDefinition): string {
    return format(channelPostTemplate, data);
  },

  inlineDefinition(data: UdDefinition): string {
    return format(inlineDefinitionTemplate, data);
  },
};

function readTemplate(name: string): string {
  return Fs.readFileSync(
    `./resources/templates/${name}.txt`,
    "utf8",
  ).toString();
}
