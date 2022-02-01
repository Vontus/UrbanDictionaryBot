import axios, { AxiosResponse, AxiosResponseTransformer } from 'axios'
import { UdDefinition } from './ud-definition'
import logger from '../logger'
import { UdApiNotAvailableError } from '../exceptions/UdApiNotAvailableError'
import { searchTerm } from './scraper'
import { addSearchCache, getSearchCache } from './ud-cache'

const urbanUrl: string = 'http://api.urbandictionary.com/v0/'

export default {
  async defineTerm (term: string): Promise<UdDefinition[]> {
    const cacheDefinitions: UdDefinition[] = getSearchCache(term)

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
        addSearchCache(term, definitions)
      }
      return definitions
    }
  },

  async random (): Promise<UdDefinition[]> {
    return (await udRequest('random')).data
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
