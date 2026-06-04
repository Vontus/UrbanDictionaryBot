import * as Fs from "fs";
import { UdDefinition } from "./definition";

const definitionTemplate = readTemplate("definition");

export default {
  definition(data: Pick<UdDefinition, "permalink" | "word" | "author" | "formattedDefinition" | "formattedExample">): string {
    return format(definitionTemplate, data);
  },
};

function readTemplate(name: string): string {
  return Fs.readFileSync(`./resources/templates/${name}.txt`, "utf8").toString();
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function format(template: string, data: any): string {
  return template.replace(/\{(\w+)\}/g, (_, k) => String(data[k] ?? ""));
}
