import encode from '../encoder'
import { UdWordLink } from './ud-word-link';
import formatter from '../formatter';

const wordLinkRegex = /\[([^\[\]]+)\]/g

export class UdDefinition {
  defid: number;
  definition: string;
  formattedDefinition: string;
  permalink: string;
  thumbs_up: number;
  thumbs_down: number;
  sound_urls: string[];
  author: string;
  word: string;
  written_on: Date;
  example: string;
  formattedExample: string;

  constructor (jsonObject: any) {
    this.defid = jsonObject.defid;
    this.definition = encode(jsonObject.definition);
    this.permalink = encode(jsonObject.permalink);
    this.thumbs_up = jsonObject.thumbs_up;
    this.thumbs_down = jsonObject.thumbs_down;
    this.sound_urls = jsonObject.sound_urls;
    this.author = encode(jsonObject.author);
    this.word = encode(jsonObject.word);
    this.written_on = jsonObject.written_on;
    this.example = encode(jsonObject.example);

    this.formattedDefinition = this.formatLinks(this.definition);
    this.formattedExample = this.formatLinks(this.example);
  }

  findLinks(text: string): UdWordLink[] {
    let links: UdWordLink[] = [];
    let matches = text.match(wordLinkRegex);
    if (matches) {
      for (let i = 0; i < matches.length; i++) {
        links.push(new UdWordLink("test", 1));
      }
    }

    return links;
  }

  formatLinks(text: string): string {
    return text.replace(wordLinkRegex, (match) => {
      let word = match.slice(1, -1)
      return formatter.link(word, formatter.startUrl(word));
    })
  }
}
