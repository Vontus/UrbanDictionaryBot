import { UdDefinition } from './urban-api/ud-definition'
import { CallbackQuery, InlineKeyboardMarkup } from 'node-telegram-bot-api'
import UrbanApi from './urban-api'
import formatter from './formatter'
import strings from './strings'
import { channelLink } from './config'

export default {
  buildFromDefinition (buttonResponse?: UdButtonResponse): InlineKeyboardMarkup {
    const keyboard: InlineKeyboardMarkup = {
      inline_keyboard: []
    }

    const channelButton = {
      text: '📣 Urban Dictionary Channel',
      url: channelLink
    }

    const donateButton = {
      text: '💸 Donate',
      url: strings.donateLink
    }

    if (buttonResponse) {
      const { definitions: defs, position: pos, term } = buttonResponse
  
      function callbackData (position: number): string {
        return defs.length > 1 ? formatter.compress(`${term}_${position}`) : 'ignore'
      }
  
      const navigationButtons = [{
        text: '⏪ Previous',
        callback_data: callbackData((pos - 1 + defs.length) % defs.length)
      }, {
        text: `${pos + 1}/${defs.length}`,
        callback_data: pos === 0 ? 'ignore' : callbackData(0)
      }, {
        text: '⏩ Next',
        callback_data: callbackData((pos + 1) % defs.length)
      }]

      keyboard.inline_keyboard.push(navigationButtons)
    }

    keyboard.inline_keyboard.push([donateButton, channelButton])

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
    const term = word.substring(0, splitterPosition)
    const pos: number = parseInt(word.substring(splitterPosition + 1), 10)
    const definitions = await UrbanApi.defineTerm(term)

    return {
      term,
      definitions: definitions,
      position: pos
    }
  }
}

export interface UdButtonResponse {
  definitions: UdDefinition[]
  position: number,
  term: string
}
