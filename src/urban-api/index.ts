import axios, { AxiosResponse, AxiosResponseTransformer } from 'axios'
import cache from './ud-cache'
import { UdDefinition } from './ud-definition'
import logger from '../logger'
import { UdApiNotAvailableError } from '../exceptions/UdApiNotAvailableError'
import { searchTerm } from './scraper'

const urbanUrl: string = 'http://api.urbandictionary.com/v0/'

export default {
  async defineDefId (defId: number): Promise<UdDefinition> {
    logger.log(`asking ud for ${defId}...`)
    const data = (await udRequest('define', { defId })).data
    if (data.length > 0) {
      cache.addDefinitions(data)
    }
    return data[0]
  },

  async defineTerm (term: string): Promise<UdDefinition[]> {
    const cacheDefinitions: UdDefinition[] = cache.getDefinitions(term)

    if (cacheDefinitions != null) {
      logger.log(`serving "${term}" from cache...`)
      return cacheDefinitions
    } else {
      logger.log(`asking ud for "${term}"...`)
      let definitions: UdDefinition[]
      try {
        definitions = (await udRequest('define', { term })).data
      } catch (apiError) {
        try {
          definitions = await searchTerm(term)
        } catch (webError) {
          logger.error('apiError', apiError)
          logger.error('webError', webError)
          throw new UdApiNotAvailableError()
        }
      }
      if (definitions.length > 0) {
        cache.addDefinitions(definitions)
      }
      return definitions
    }
  },

  async random (): Promise<UdDefinition[]> {
    const data = (await udRequest('random')).data
    cache.addDefinitions(data)
    return data
  }
}

async function udRequest (method: string, params?: any): Promise<AxiosResponse<UdDefinition[]>> {
  return await axios.request<UdDefinition[]>({
    method: 'GET',
    url: urbanUrl + method,
    timeout: 2000,
    params,
    transformResponse: getAxiosTransformer()
  })
}

function getAxiosTransformer (): AxiosResponseTransformer[] {
  let arr: AxiosResponseTransformer[] = []
  arr = arr.concat(
    axios.defaults.transformResponse ?? [],
    (r: any) => {
      const defs: UdDefinition[] = []
      if (r.list != null) {
        r.list.forEach((element: any) => {
          defs.push(new UdDefinition(element))
        })
      }
      return defs
    }
  )
  return arr
}
