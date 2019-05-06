import { UdChannelDef } from '../ud-channel/ud-channel-def'
import { ChannelData } from './channel-data'
import * as jsonfile from 'jsonfile'
import * as path from 'path'
import * as fs from 'fs'

const channelFile = path.join(process.env.DATA_PATH || '.', 'channel.json')
const maxChannelDefs = process.env.MAX_CHANNEL_DEFS ? parseInt(process.env.MAX_CHANNEL_DEFS, 10) : 10

async function saveSentChannelDef (channelDef: UdChannelDef): Promise<void> {
  const channelData = await getChannelData()

  const defs = channelData.sentDefinitions.slice(0, maxChannelDefs)
  defs.unshift(channelDef)
  channelData.sentDefinitions = defs

  writeChannelFile(channelData)
}

/**
 * Busca la primera definición que no se haya enviado ya al canal de entre las que se le pasan por parámetros
 * @param searchDefs Definiciones entre las que buscar
 */
async function getFirstUnsentDef (searchDefs: UdChannelDef[]): Promise<UdChannelDef | undefined> {
  const channelData = await getChannelData()
  const sentDefs = channelData.sentDefinitions

  const def = searchDefs.find(
    searchDef => !sentDefs.find(
      sentDef => sentDef.defId === searchDef.defId
    )
  )

  return def
}

async function getChannelData (): Promise<ChannelData> {
  if (fs.existsSync(channelFile)) {
    return jsonfile.readFile(channelFile)
  } else {
    return new ChannelData()
  }
}

async function writeChannelFile (chanData: ChannelData) {
  jsonfile.writeFile(channelFile, chanData)
}

export default {
  saveSentChannelDef,
  getFirstUnsentDef
}
