import * as $ from 'cheerio'
import axios from 'axios'
import { UdChannelDef } from './ud-channel-def';
const url = "https://www.urbandictionary.com/"

const DEFAULT_PAGE = 1

export default {
  async getPageDefinitions(page?: number): Promise<UdChannelDef[]> {
    page = page || DEFAULT_PAGE;

    const html = (await axios.request<string>({
      method: "GET",
      url: url,
      params: { page }
    })).data

    let defs: UdChannelDef[] = []

    $('.def-panel', html).each((_index, elem) => {
      let defid = $(elem).data('defid')
      let gif = $(elem).find('.gif img').attr('src')

      defs.push(new UdChannelDef(defid, gif))
    })

    return defs;
  }
}