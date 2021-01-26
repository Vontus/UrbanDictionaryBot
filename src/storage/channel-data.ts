import { UdDefinition } from '../urban-api/ud-definition'

export class ChannelData {
  public sentDefinitions: UdDefinition[]

  public constructor (sentDefinitions?: UdDefinition[]) {
    this.sentDefinitions = sentDefinitions ?? []
  }
}
