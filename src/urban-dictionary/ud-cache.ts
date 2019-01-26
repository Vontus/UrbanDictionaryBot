import { UdResponse } from "./ud-response";

interface IDictionary {
  [index: string]: UdResponse;
}

let cache = {} as IDictionary

export default {
  addResponse (response: UdResponse) {
    let word: string = response.list[0].word
    cache[normalizeWord(word)] = response
  },

  getResponse (word: string) {
    return cache[normalizeWord(word)]
  }
}

function normalizeWord (string: string): string {
  return string.toLowerCase()
}