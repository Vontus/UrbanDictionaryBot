import * as Fs from 'fs'
import * as format from 'string-template'
import { UdDefinition } from './urban-api/ud-definition'

let definitionTemplate = readTemplate('definition')
let channelPostTemplate = readTemplate('channel-post')

export default {
  definition (data: UdDefinition): string {
    return format(definitionTemplate, data)
  },

  channelPost (data: UdDefinition): string {
    return format(channelPostTemplate, data)
  }
}

function readTemplate (name: string): string {
  return Fs.readFileSync(`./resources/templates/${name}.txt`, 'utf8').toString()
}
