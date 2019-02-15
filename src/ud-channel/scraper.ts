import * as $ from 'cheerio'
import axios from 'axios'
import { UdChannelDef } from './ud-channel-def'
const url = 'https://www.urbandictionary.com/'

const DEFAULT_PAGE = 1

export default {
  async getPageDefinitions (page?: number): Promise<UdChannelDef[]> {
    page = page || DEFAULT_PAGE

    const html = (await axios.request<string>({
      method: 'GET',
      url: url,
      params: { page }
    })).data

    const defs: UdChannelDef[] = []

    $('.def-panel', html).each((_index, elem) => {
      const defid = $(elem).data('defid')
      const gif = $(elem).find('.gif img').attr('src')

      defs.push(new UdChannelDef(defid, gif))
    })

    return defs
  }
}
