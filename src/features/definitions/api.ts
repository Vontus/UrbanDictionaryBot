import { UdDefinition } from "./definition";
import { DefinitionCache } from "./cache";
import { searchTerm } from "./scraper";
import { UdApiNotAvailableError } from "../../exceptions/UdApiNotAvailableError";
import logger from "../../logger";

const urbanUrl = "http://api.urbandictionary.com/v0/";
const cache = new DefinitionCache();

export default {
  async defineTerm(term: string): Promise<UdDefinition[]> {
    const cached = cache.get(term);
    if (cached != null) {
      logger.log(`serving "${term}" from cache...`);
      return cached;
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
      cache.set(term, definitions);
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
