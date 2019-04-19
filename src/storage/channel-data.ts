import { UdChannelDef } from '../ud-channel/ud-channel-def'

export class ChannelData {
  public sentDefinitions: UdChannelDef[]

  public constructor (sentDefinitions?: UdChannelDef[]) {
    this.sentDefinitions = sentDefinitions || []
  }
}
