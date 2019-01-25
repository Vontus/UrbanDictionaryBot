import * as Fs from "fs";
import * as replace from "string-template";
import { UrbanDefinition } from "./urban-dictionary/urban-definition";

let definitionTemplate = readTemplate("definition");
let noResultTemplate = readTemplate("no-results");
let arabicTemplate = readTemplate("arabic-response");

export default {
  definition(data: UrbanDefinition): string {
    return replace(definitionTemplate, data);
  },

  noResults(word: string): string {
    return replace(noResultTemplate, word)
  },

  arabicResponse(): string {
    return arabicTemplate
  }
};

function readTemplate(name: string): string {
  return Fs.readFileSync(`./resources/templates/${name}.txt`, "utf8").toString()
}