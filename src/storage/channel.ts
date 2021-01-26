import { ChannelData } from './channel-data'
import * as jsonfile from 'jsonfile'
import * as path from 'path'
import * as fs from 'fs'
import { UdDefinition } from '../urban-api/ud-definition'

const channelFile = path.join(process.env.DATA_PATH ?? '.', 'channel.json')
const maxChannelDefs = parseInt(process.env.MAX_CHANNEL_DEFS ?? '10')

export async function saveSentChannelDef (channelDef: UdDefinition): Promise<void> {
  const channelData = await getChannelData()

  const defs = channelData.sentDefinitions.slice(0, maxChannelDefs - 1)
  defs.unshift(channelDef)
  channelData.sentDefinitions = defs

  return await writeChannelFile(channelData)
}

/**
 * Busca la primera definición que no se haya enviado ya al canal de entre las que se le pasan por parámetros
 * @param searchDefs Definiciones entre las que buscar
 */
export async function getFirstUnsentDef (searchDefs: UdDefinition[]): Promise<UdDefinition | undefined> {
  const channelData = await getChannelData()
  const sentDefs = channelData.sentDefinitions

  const def = searchDefs
    .find(
      searchDef => sentDefs.find(
        sentDef => sentDef.defId === searchDef.defId
      ) !== undefined
    )

  return def
}

async function getChannelData (): Promise<ChannelData> {
  if (fs.existsSync(channelFile)) {
    return await jsonfile.readFile(channelFile)
  } else {
    return new ChannelData()
  }
}

async function writeChannelFile (chanData: ChannelData): Promise<void> {
  return await jsonfile.writeFile(channelFile, chanData, { spaces: 2 })
}
