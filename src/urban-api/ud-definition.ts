import encode from '../encoder'
import { UdWordLink } from './ud-word-link'
import formatter from '../formatter'

const wordLinkRegex = /\[([^[\]]+)\]/g

export class UdDefinition {
  defid: number
  definition: string
  formattedDefinition: string
  permalink: string
  thumbsUp: number
  thumbsDown: number
  soundUrls: string[]
  author: string
  word: string
  writtenOn: Date
  example: string
  formattedExample: string

  constructor (jsonObject: any) {
    this.defid = jsonObject.defid
    this.definition = encode(jsonObject.definition)
    this.permalink = encode(jsonObject.permalink)
    this.thumbsUp = jsonObject.thumbs_up
    this.thumbsDown = jsonObject.thumbs_down
    this.soundUrls = jsonObject.sound_urls
    this.author = encode(jsonObject.author)
    this.word = encode(jsonObject.word)
    this.writtenOn = jsonObject.written_on
    this.example = encode(jsonObject.example)

    this.formattedDefinition = this.formatLinks(this.definition)
    this.formattedExample = formatter.italic(this.formatLinks(this.example, formatter.ITALIC_CLOSE_TAG, formatter.ITALIC_OPEN_TAG))
  }

  findLinks (text: string): UdWordLink[] {
    const links: UdWordLink[] = []
    const matches = text.match(wordLinkRegex)
    if (matches != null) {
      for (let i = 0; i < matches.length; i++) {
        links.push(new UdWordLink('test', 1))
      }
    }

    return links
  }

  formatLinks (text: string, prefix?: string, suffix?: string): string {
    return text.replace(wordLinkRegex, (match) => {
      const word = match.slice(1, -1)
      return (prefix ?? '') +
        formatter.link(word, formatter.startUrl(word)) +
        (suffix ?? '')
    })
  }
}
