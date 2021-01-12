import * as $ from 'cheerio'
import axios from 'axios'
import { UdChannelDef } from './ud-channel-def'
const url = 'https://www.urbandictionary.com/'

export default {
  async getPageDefinitions (page: number = 1): Promise<UdChannelDef[]> {
    const params = page && page !== 1 ? { page } : null

    const html = (await axios.request<string>({
      method: 'GET',
      url: url,
      params
    })).data

    const defs: UdChannelDef[] = []

    $('.def-panel', html).each((_index, elem) => {
      const defid = $(elem).data('defid')
      const gif = $(elem).find('.gif img').attr('src')
      const date = $(elem).find('.ribbon').text()
      const word = $(elem).find('.word').text()

      defs.push(new UdChannelDef(defid, word, date, gif))
    })

    return defs
  }
}
