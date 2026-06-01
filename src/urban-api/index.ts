import { UdDefinition } from "./ud-definition";
import logger from "../logger";
import { UdApiNotAvailableError } from "../exceptions/UdApiNotAvailableError";
import { searchTerm } from "./scraper";
import { addSearchCache, getSearchCache } from "./ud-cache";

const urbanUrl = "http://api.urbandictionary.com/v0/";

export default {
  async defineTerm(term: string): Promise<UdDefinition[]> {
    const cacheDefinitions = getSearchCache(term);

    if (cacheDefinitions != null) {
      logger.log(`serving "${term}" from cache...`);
      return cacheDefinitions;
    }

    logger.log(`asking ud for "${term}"...`);
    let definitions: UdDefinition[];
    try {
      definitions = await udRequest("define", { term });
    } catch (apiError) {
      try {
        definitions = await searchTerm(term);
      } catch (webError) {
        logger.error("apiError", apiError);
        logger.error("webError", webError);
        throw new UdApiNotAvailableError();
      }
    }
    if (definitions.length > 0) {
      addSearchCache(term, definitions);
    }
    return definitions;
  },

  async random(): Promise<UdDefinition[]> {
    return udRequest("random");
  },
};

async function udRequest(method: string, params?: Record<string, string>): Promise<UdDefinition[]> {
  const url = new URL(urbanUrl + method);
  if (params != null) {
    Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));
  }
  const res = await fetch(url.toString(), { signal: AbortSignal.timeout(10000) });
  if (!res.ok) throw new Error(`UD API error: ${res.status}`);
  const data = (await res.json()) as { list?: unknown[] };
  return (data.list ?? []).map((item) => new UdDefinition(item));
}
