import axios, { AxiosPromise } from "axios";
import { UrbanResponse } from "./urban-response";

let urbanUrl: string = "http://api.urbandictionary.com/v0/";

export default {
  define (term: string): AxiosPromise<UrbanResponse> {
    return axios.request<UrbanResponse>({
      method: "GET",
      url: urbanUrl + "define",
      params: { term },
      transformResponse: (r: UrbanResponse) => r
    });
  },

  random (): AxiosPromise<UrbanResponse> {
    return axios.request<UrbanResponse>({
      method: "GET",
      url: urbanUrl + "random",
      transformResponse: (r: UrbanResponse) => r
    });
  }
};
