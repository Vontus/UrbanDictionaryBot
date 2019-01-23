import * as Fs from "fs";
import * as replace from "string-template";
import { UrbanDefinition } from "./urban-dictionary/urban-definition";

let definitionTemplate = Fs.readFileSync("./resources/templates/definition.txt", "utf8").toString();

export default {
  definition(data: UrbanDefinition) {
    return replace(definitionTemplate, data);
  }
};