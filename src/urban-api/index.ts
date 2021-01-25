import axios, { AxiosTransformer } from 'axios'
import cache from './ud-cache'
import { UdDefinition } from './ud-definition'
import logger from '../logger'
import { UdApiNotAvailableError } from '../exceptions/UdApiNotAvailableError'

const urbanUrl: string = 'http://api.urbandictionary.com/v0/'

export default {
  async defineDefId (defid: number): Promise<UdDefinition> {
    logger.log(`asking ud for ${defid}...`)
    const data = (await udRequest('define', { defid })).data
    if (data && data.length > 0) {
      cache.addDefinitions(data)
    }
    return data[0]
  },
  async defineTerm (term: string): Promise<UdDefinition[]> {
    const cacheDefinitions: UdDefinition[] = cache.getDefinitions(term)

    if (cacheDefinitions) {
      logger.log(`serving "${term}" from cache...`)
      return cacheDefinitions
    } else {
      logger.log(`asking ud for "${term}"...`)
      const data = (await udRequest('define', { term })).data
      if (data && data.length > 0) {
        cache.addDefinitions(data)
      }
      return data
    }
  },

  async random (): Promise<UdDefinition[]> {
    const data = (await udRequest('random')).data
    cache.addDefinitions(data)
    return data
  }
}

async function udRequest (method: string, params?: any) {
  try {
    return await axios.request<UdDefinition[]>({
      method: 'GET',
      url: urbanUrl + method,
      timeout: 2000,
      params,
      transformResponse: getAxiosTransformer()
    })
  } catch (error) {
    logger.error(error)
    throw new UdApiNotAvailableError()
  }
}

function getAxiosTransformer (): AxiosTransformer[] {
  let arr: AxiosTransformer[] = []
  arr = arr.concat(
    axios.defaults.transformResponse ? axios.defaults.transformResponse : [],
    (r: any) => {
      const defs: UdDefinition[] = []
      if (r.list) {
        r.list.forEach((element: any) => {
          defs.push(new UdDefinition(element))
        })
      }
      return defs
    }
  )
  return arr
}
