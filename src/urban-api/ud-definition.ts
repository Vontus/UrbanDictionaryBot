import encode from '../encoder'
import formatter from '../formatter'

const wordLinkRegex = /\[([^[\]]+)\]/g

export class UdDefinition {
  defId: number
  definition: string
  formattedDefinition: string
  permalink: string
  thumbsUp: number
  thumbsDown: number
  author: string
  word: string
  example: string
  formattedExample: string
  gif: string | undefined

  constructor (jsonObject: any) {
    this.defId = jsonObject.defid
    this.definition = encode(jsonObject.definition)
    this.permalink = encode(jsonObject.permalink)
    this.thumbsUp = jsonObject.thumbs_up
    this.thumbsDown = jsonObject.thumbs_down
    this.author = encode(jsonObject.author)
    this.word = encode(jsonObject.word)
    this.example = encode(jsonObject.example)
    this.gif = jsonObject.gif

    this.formattedDefinition = this.formatLinks(this.definition)
    this.formattedExample = formatter.italic(this.formatLinks(this.example, formatter.ITALIC_CLOSE_TAG, formatter.ITALIC_OPEN_TAG))
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
