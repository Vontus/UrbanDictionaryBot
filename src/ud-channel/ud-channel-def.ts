export class UdChannelDef {
  defId: number
  gif: string | undefined
  date: string
  word: string

  public constructor (defId: number, word: string, date: string, gif: string) {
    this.defId = defId
    this.gif = gif
    this.date = date
    this.word = word
  }
}
