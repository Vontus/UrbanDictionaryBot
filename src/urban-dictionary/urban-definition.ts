export class UrbanDefinition {
  defid: number;
  definition: string;
  permalink: string;
  thumbs_up: number;
  thumbs_down: number;
  sound_urls: string[];
  author: string;
  word: string;
  written_on: Date;
  example: string;

  constructor (jsonObject: any) {
    this.defid = jsonObject.defid;
    this.definition = jsonObject.definition;
    this.permalink = jsonObject.permalink;
    this.thumbs_up = jsonObject.thumbs_up;
    this.thumbs_down = jsonObject.thumbs_down;
    this.sound_urls = jsonObject.sound_urls;
    this.author = jsonObject.author;
    this.word = jsonObject.word;
    this.written_on = jsonObject.written_on;
    this.example = jsonObject.example;
  }
}
