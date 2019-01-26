import axios, { AxiosPromise, AxiosTransformer } from "axios";
import { UdResponse } from "./ud-response";
import cache from "./ud-cache";

let urbanUrl: string = "http://api.urbandictionary.com/v0/";

export default {
  define (term: string): Promise<UdResponse> {
    
    let cacheResponse = cache.getResponse(term);

    if (cacheResponse) {
      return Promise.resolve(cacheResponse);
    } else {
      return new Promise((resolve, reject) => {
        axios.request<UdResponse>({
          method: "GET",
          url: urbanUrl + "define",
          params: { term },
          transformResponse: getAxiosTransformer()
        })
          .then((response) => {
            return resolve(response.data);
          })
          .catch((err) => {
            return reject(err);
          })
      })
    }
  },

  random (): AxiosPromise<UdResponse> {
    return axios.request<UdResponse>({
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
      return new UdResponse(r);
    },
  )
  return arr
}