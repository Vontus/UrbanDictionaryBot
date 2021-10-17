import { UdDefinition } from './urban-api/ud-definition'
import { CallbackQuery, InlineKeyboardMarkup } from 'node-telegram-bot-api'
import UrbanApi from './urban-api'
import formatter from './formatter'
import strings from './strings'
import { channelLink } from './config'

export default {
  buildFromDefinition (buttonResponse: UdButtonResponse): InlineKeyboardMarkup {
    const defs = buttonResponse.definitions

    const channelButton = {
      text: '📣 Urban Dictionary Channel',
      url: channelLink
    }

    const donateButton = {
      text: '☕️ Buy me a coffee',
      url: strings.donateLink
    }

    const pos = buttonResponse.position
    const previous = pos - 1
    const next = pos + 1
    const first = 0
    const last = defs.length - 1

    function callbackData (position: number): string {
      return defs.length > 1 ? formatter.compress(`${defs[pos].word}_${position}`) : 'ignore'
    }

    const navigationButtons = [{
      text: '⏪ Previous',
      callback_data: callbackData(pos === first ? last : previous)
    }, {
      text: `${pos + 1}/${defs.length}`,
      callback_data: 'ignore'
    }, {
      text: '⏩ Next',
      callback_data: callbackData(pos === last ? first : next)
    }]

    const keyboard: InlineKeyboardMarkup = {
      inline_keyboard: [navigationButtons, [donateButton, channelButton]]
    }

    return keyboard
  },

  inlineKeyboardResponse (word: string): InlineKeyboardMarkup {
    const redirectButton = {
      text: '➕ More info',
      url: formatter.startUrl(word)
    }

    const keyboard: InlineKeyboardMarkup = {
      inline_keyboard: [[redirectButton]]
    }

    return keyboard
  },

  async parseButtonClick (callbackQuery: CallbackQuery): Promise<UdButtonResponse> {
    if (callbackQuery.data == null) {
      throw new Error('Callback query has no data')
    }

    const word = formatter.decompress(callbackQuery.data)

    if (word == null) {
      throw new Error('Word is null')
    }

    const splitterPosition = word.lastIndexOf('_')
    const term = word.substr(0, splitterPosition)
    const pos: number = parseInt(word.substr(splitterPosition + 1), 10)
    const definitions = await UrbanApi.defineTerm(term)

    return {
      definitions: definitions,
      position: pos
    }
  }
}

export interface UdButtonResponse {
  definitions: UdDefinition[]
  position: number
}
