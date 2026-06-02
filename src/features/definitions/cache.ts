import { UdDefinition } from "./definition";

export class DefinitionCache {
  private cache = new Map<string, UdDefinition[]>();

  get(word: string): UdDefinition[] | undefined {
    return this.cache.get(word.toLowerCase());
  }

  set(word: string, definitions: UdDefinition[]): void {
    this.cache.set(word.toLowerCase(), definitions);
  }
}
