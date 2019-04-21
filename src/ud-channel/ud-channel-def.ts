export class UdChannelDef {
  defId: number
  gif: string | undefined

  public constructor (defId: number, gif: string) {
    this.defId = defId
    this.gif = gif
  }
}
