import strings from '../strings'

export class UdApiNotAvailableError extends Error {
  constructor () {
    super(strings.apiDown)
  }
}
