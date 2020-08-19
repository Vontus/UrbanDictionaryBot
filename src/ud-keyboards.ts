import { UdDefinition } from './urban-api/ud-definition'
import { CallbackQuery, InlineKeyboardMarkup } from 'node-telegram-bot-api'
import UrbanApi from './urban-api'
import formatter from './formatter'
import strings from './strings'

let channelLink: string

if (process.env.CHANNEL_LINK) {
  channelLink = process.env.CHANNEL_LINK
}

export default {
  buildFromDefinition (buttonResponse: UdButtonResponse): InlineKeyboardMarkup {
    let defs = buttonResponse.definitions

    let channelButton = {
      text: '📣 Urban Dictionary Channel',
      url: channelLink
    }

    let donateButton = {
      text: '☕️ Buy me a coffee',
      url: strings.donateLink
    }

    let pos = buttonResponse.position
    let previous = pos - 1
    let next = pos + 1
    let first = 0
    let last = defs.length - 1

    function callbackData (position: number) {
      return defs.length > 1 ? formatter.compress(defs[pos].word + '_' + position) : 'ignore'
    }

    let navigationButtons = [{
      text: '⏪ Previous',
      callback_data: callbackData(pos === first ? last : previous)
    }, {
      text: (pos + 1) + '/' + defs.length,
      callback_data: 'ignore'
    }, {
      text: '⏩ Next',
      callback_data: callbackData(pos === last ? first : next)
    }]

    let keyboard: InlineKeyboardMarkup = {
      inline_keyboard: [navigationButtons, [donateButton, channelButton]]
    }

    return keyboard
  },

  inlineKeyboardResponse (word: string): InlineKeyboardMarkup {
    let redirectButton = {
      text: '➕ More info',
      url: formatter.startUrl(word)
    }

    let keyboard: InlineKeyboardMarkup = {
      inline_keyboard: [[redirectButton]]
    }

    return keyboard
  },

  async parseButtonClick (callbackQuery: CallbackQuery): Promise<UdButtonResponse> {
    if (callbackQuery.data) {
      const word = formatter.decompress(callbackQuery.data)

      if (!word) {
        throw new Error('Word is null')
      }

      const data = word.split('_')
      const term = data[0]
      const pos: number = parseInt(data[1], 10)
      const definitions = await UrbanApi.defineTerm(term)

      return {
        definitions: definitions,
        position: pos
      }
    }
    return Promise.reject()
  }
}

export interface UdButtonResponse {
  definitions: UdDefinition[]
  position: number
}
