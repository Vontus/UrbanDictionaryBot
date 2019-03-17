export class UdChannelDef {
  defId: number
  gif: string
  sentDate: Date

  public constructor (defId: number, gif: string, sentDate: Date) {
    this.defId = defId
    this.gif = gif
    this.sentDate = sentDate
  }
}
