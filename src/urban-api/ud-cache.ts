import { UdDefinition } from './ud-definition'

interface IDictionary {
  [index: string]: UdDefinition[]
}

const cache = {} as IDictionary

export default {
  addDefinitions (definitions: UdDefinition[]) {
    const word: string = definitions[0].word
    cache[normalizeWord(word)] = definitions
  },

  getDefinitions (word: string) {
    return cache[normalizeWord(word)]
  }
}

function normalizeWord (word: string): string {
  return word.toLowerCase()
}
