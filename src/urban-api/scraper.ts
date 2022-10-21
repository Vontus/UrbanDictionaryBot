import $ from 'cheerio'
import axios from 'axios'
import { UdDefinition } from './ud-definition'

const cleanUrl = 'https://www.urbandictionary.com'
const defineUrl = `${cleanUrl}/define.php`

function scrapeDefinition (htmlElement: cheerio.Element): UdDefinition {
  const permalink = $(htmlElement).find('.word').attr('href')
  const def = {
    defid: $(htmlElement).data('defid'),
    definition: replaceLinks($(htmlElement).find('.meaning')),
    example: replaceLinks($(htmlElement).find('.example')),
    permalink: permalink != null ? `${cleanUrl}${permalink}` : null,
    thumbs_up: parseInt($(htmlElement).find('a.up .count').text()),
    thumbs_down: parseInt($(htmlElement).find('a.down .count').text()),
    author: $(htmlElement).find('.contributor a').text(),
    word: $(htmlElement).find('.word').text(),
    gif: $(htmlElement).find('.gif img').attr('src')
  }

  return new UdDefinition(def)
}

async function requestWeb (page?: number, term?: string): Promise<string> {
  const params = {
    page: page !== 1 ? page : null,
    term
  }

  return (await axios.request<string>({
    method: 'GET',
    url: defineUrl,
    params
  })).data
}

export async function getWotds (): Promise<UdDefinition[]> {
  const html = await requestWeb()

  const defs: UdDefinition[] = []

  $('.definition', html).each((_index, element) => {
    defs.push(scrapeDefinition(element))
  })

  return defs
}

export async function searchTerm (term: string): Promise<UdDefinition[]> {
  const html = await requestWeb(1, term)
  const defs: UdDefinition[] = []

  if ($('.shrug', html).length > 0) {
    return []
  }

  const lastPageLink = $('.pagination li:last-child a').attr('href')
  let pages = 1
  if (lastPageLink != null) {
    pages = parseInt(lastPageLink?.substr(lastPageLink.lastIndexOf('=') + 1))
  }

  for (let page = 1; page <= pages && defs.length < 10; page++) {
    const pageHtml = page === 1 ? html : await requestWeb(page, term)

    $('.def-panel', pageHtml).each((_index, element) => {
      if (!$(element).find('.ribbon').text().includes('Word of the Day')) {
        defs.push(scrapeDefinition(element))
      }
    })
  }

  return defs
}

function replaceLinks (element: cheerio.Cheerio): string {
  element.find('a').each((_index, link) => {
    $(link).html(`[${$(link).text()}]`)
  })

  element.find('br').replaceWith('\n')

  return element.text()
}
