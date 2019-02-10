import { UdDefinition } from "./ud-definition";

interface IDictionary {
  [index: string]: UdDefinition[];
}

let cache = {} as IDictionary

export default {
  addDefinitions (definitions: UdDefinition[]) {
    let word: string = definitions[0].word
    cache[normalizeWord(word)] = definitions
  },

  getDefinitions (word: string) {
    return cache[normalizeWord(word)]
  }
}

function normalizeWord (string: string): string {
  return string.toLowerCase()
}