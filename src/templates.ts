import * as Fs from 'fs'
import * as replace from 'string-template'
import { UdDefinition } from './urban-api/ud-definition'

let definitionTemplate = readTemplate('definition')
let channelPostTemplate = readTemplate('channel-post')
let noResultTemplate = readTemplate('no-results')
let arabicTemplate = readTemplate('arabic-response')

export default {
  definition (data: UdDefinition): string {
    return replace(definitionTemplate, data)
  },

  channelPost (data: UdDefinition): string {
    return replace(channelPostTemplate, data)
  },

  noResults (word: string): string {
    return replace(noResultTemplate, word)
  },

  arabicResponse (): string {
    return arabicTemplate
  }
}

function readTemplate (name: string): string {
  return Fs.readFileSync(`./resources/templates/${name}.txt`, 'utf8').toString()
}
