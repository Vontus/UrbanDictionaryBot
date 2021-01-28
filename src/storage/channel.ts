import { ChannelData } from './channel-data'
import * as jsonfile from 'jsonfile'
import * as path from 'path'
import * as fs from 'fs'
import { UdDefinition } from '../urban-api/ud-definition'

const channelFile = path.join(process.env.DATA_PATH ?? '.', 'channel.json')
const maxChannelDefs = parseInt(process.env.MAX_CHANNEL_DEFS ?? '10')

export async function saveSentChannelDefId (channelDefId: number): Promise<void> {
  const channelData = await getChannelData()

  const defs = channelData.sentDefIds.slice(0, maxChannelDefs - 1)
  defs.unshift(channelDefId)
  channelData.sentDefIds = defs

  return await writeChannelFile(channelData)
}

export async function getFirstUnsentDef (searchDefs: UdDefinition[]): Promise<UdDefinition | undefined> {
  const { sentDefIds } = (await getChannelData())

  const def = searchDefs
    .find(
      searchDef => sentDefIds.find(
        sentDefId => sentDefId === searchDef.defId
      ) == null
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
