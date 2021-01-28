import { UdDefinition } from '../urban-api/ud-definition'

export class ChannelData {
  public sentDefIds: number[]

  public constructor (sentDefIds?: number[]) {
    this.sentDefIds = sentDefIds ?? []
  }
}
