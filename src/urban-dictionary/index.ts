import axios, { AxiosPromise, AxiosTransformer } from "axios";
import { UrbanResponse } from "./urban-response";

let urbanUrl: string = "http://api.urbandictionary.com/v0/";

export default {
  define (term: string): AxiosPromise<UrbanResponse> {
    return axios.request<UrbanResponse>({
      method: "GET",
      url: urbanUrl + "define",
      params: { term },
      transformResponse: getAxiosTransformer()
    });
  },

  random (): AxiosPromise<UrbanResponse> {
    return axios.request<UrbanResponse>({
      method: "GET",
      url: urbanUrl + "random",
      transformResponse: getAxiosTransformer()
    });
  }
};

function getAxiosTransformer (): AxiosTransformer | AxiosTransformer[] | undefined {
  let arr: AxiosTransformer[] = [];
  arr = arr.concat(
    axios.defaults.transformResponse ? axios.defaults.transformResponse : [],
    (r: any) => {
      return new UrbanResponse(r);
    },
  )
  return arr
}