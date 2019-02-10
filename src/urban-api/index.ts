import axios, { AxiosPromise, AxiosTransformer } from "axios";
import cache from "./ud-cache";
import { UdDefinition } from "./ud-definition";

let urbanUrl: string = "http://api.urbandictionary.com/v0/";

export default {
  define (term: string): Promise<UdDefinition[]> {
    
    let cacheDefinitions: UdDefinition[] = cache.getDefinitions(term);

    if (cacheDefinitions) {
      console.debug('serving from cache...');
      return Promise.resolve(cacheDefinitions);
    } else {
      return new Promise((resolve, reject) => {
        console.debug('asking ud...');
        axios.request<UdDefinition[]>({
          method: "GET",
          url: urbanUrl + "define",
          params: { term },
          transformResponse: getAxiosTransformer()
        })
          .then(({ data }) => {
            if (data && data.length > 0) {
              cache.addDefinitions(data);
            }
            return resolve(data);
          })
          .catch((err) => {
            return reject(err);
          })
      })
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