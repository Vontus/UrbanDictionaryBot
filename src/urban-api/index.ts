import axios, { AxiosPromise, AxiosTransformer, AxiosRequestConfig } from 'axios'
import cache from './ud-cache'
import { UdDefinition } from './ud-definition'
import logger from '../logger'

let urbanUrl: string = 'http://api.urbandictionary.com/v0/'

export default {
  async defineDefId (defid: number): Promise<UdDefinition> {
    logger.log(`asking ud for ${defid}...`)
    let data = (await udRequest('define', { defid })).data
    if (data && data.length > 0) {
      cache.addDefinitions(data)
    }
    return data[0]
  },
  async defineTerm (term: string): Promise<UdDefinition[]> {

    let cacheDefinitions: UdDefinition[] = cache.getDefinitions(term)

    if (cacheDefinitions) {
      logger.log(`serving "${term}" from cache...`)
      return cacheDefinitions
    } else {
      logger.log(`asking ud for "${term}"...`)
      let data = (await udRequest('define', { term })).data
      if (data && data.length > 0) {
        cache.addDefinitions(data)
      }
      return data
    }
  },

  async random (): Promise<UdDefinition[]> {
    let data = (await udRequest('random')).data
    cache.addDefinitions(data)
    return data
  }
}

async function udRequest (method: string, params?: any) {
  return axios.request<UdDefinition[]>({
    method: 'GET',
    url: urbanUrl + method,
    params,
    transformResponse: getAxiosTransformer()
  })
}

function getAxiosTransformer (): AxiosTransformer[] {
  let arr: AxiosTransformer[] = []
  arr = arr.concat(
    axios.defaults.transformResponse ? axios.defaults.transformResponse : [],
    (r: any) => {
      let defs: UdDefinition[] = []
      r.list.forEach((element: any) => {
        defs.push(new UdDefinition(element))
      })
      return defs
    }
  )
  return arr
}
