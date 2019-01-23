import axios, { AxiosPromise } from "axios";
import { UrbanResponse } from "./urban-response";
import { UrbanDefinition } from "./urban-definition";
import encode from '../encoder';

let urbanUrl: string = "http://api.urbandictionary.com/v0/";

export default {
  define (term: string): AxiosPromise<UrbanResponse> {
    return axios.get(urbanUrl + "define", { params: { term }})
  },

  random (): AxiosPromise<UrbanResponse> {
    return axios.get(urbanUrl + "random");
  },
  
  encode (definition: UrbanDefinition): UrbanDefinition {
    return {
      defid: definition.defid,
      thumbs_up: definition.thumbs_up,
      thumbs_down: definition.thumbs_down,
      sound_urls: definition.sound_urls,
      written_on: definition.written_on,
      example: encode(definition.example),
      definition: encode(definition.definition),
      permalink: encode(definition.permalink),
      author: encode(definition.author),
      word: encode(definition.word),
    };
  }
};
