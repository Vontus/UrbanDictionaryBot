import axios, { AxiosPromise, AxiosTransformer, AxiosRequestConfig } from "axios";
import cache from "./ud-cache";
import { UdDefinition } from "./ud-definition";
import logger from "../logger";

let urbanUrl: string = "http://api.urbandictionary.com/v0/";

export default {
  async defineDefId (defid: number): Promise<UdDefinition> {
    logger.log(`asking ud for ${defid}...`);
    let data = (await udDefine({ defid })).data
    if (data && data.length > 0) {
      cache.addDefinitions(data);
    }
    return data[0];
  },
  async defineTerm (term: string): Promise<UdDefinition[]> {
    
    let cacheDefinitions: UdDefinition[] = cache.getDefinitions(term);

    if (cacheDefinitions) {
      logger.log(`serving "${term}" from cache...`);
      return cacheDefinitions;
    } else {
        logger.log(`asking ud for "${term}"...`);
        let data = (await udDefine({ term })).data
        if (data && data.length > 0) {
          cache.addDefinitions(data);
        }
        return data;
    }
  },

  random (): AxiosPromise<UdDefinition[]> {
    return axios.request<UdDefinition[]>({
      method: "GET",
      url: urbanUrl + "random",
      transformResponse: getAxiosTransformer()
    });
  }
};

async function udDefine (params: any) {
  return await axios.request<UdDefinition[]>({
    method: "GET",
    url: urbanUrl + "define",
    params,
    transformResponse: getAxiosTransformer()
  })
}

function getAxiosTransformer (): AxiosTransformer[] {
  let arr: AxiosTransformer[] = [];
  arr = arr.concat(
    axios.defaults.transformResponse ? axios.defaults.transformResponse : [],
    (r: any) => {
      let defs: UdDefinition[] = []
      r.list.forEach((element: any) => {
        defs.push(new UdDefinition(element))
      });
      return defs;
    },
  )
  return arr
}