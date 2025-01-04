import { UdDefinition } from "./ud-definition";

interface IDictionary {
  [index: string]: UdDefinition[];
}

const searchCache: IDictionary = {};

export function addSearchCache(search: string, definitions: UdDefinition[]) {
  searchCache[normalizeWord(search)] = definitions;
}

export function getSearchCache(word: string) {
  return searchCache[normalizeWord(word)];
}

function normalizeWord(word: string): string {
  return word.toLowerCase();
}
