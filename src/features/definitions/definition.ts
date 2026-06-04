import encode from "./encoder";
import formatter from "./formatter";

const wordLinkRegex = /\[([^[\]]+)\]/g;

export class UdDefinition {
  defId: number;
  definition: string;
  formattedDefinition: string;
  permalink: string;
  author: string;
  word: string;
  example: string;
  formattedExample: string;
  gif: string | undefined;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  constructor(jsonObject: any) {
    this.defId = jsonObject.defid;
    this.definition = encode(jsonObject.definition);
    this.permalink = encode(jsonObject.permalink);
    this.author = encode(jsonObject.author ?? "");
    this.word = encode(jsonObject.word);
    this.example = encode(jsonObject.example);
    this.gif = jsonObject.gif;

    this.formattedDefinition = this.stripBrackets(this.definition);
    this.formattedExample = formatter.italic(this.stripBrackets(this.example));
  }

  stripBrackets(text: string): string {
    return text.replace(wordLinkRegex, (match) => match.slice(1, -1));
  }
}
