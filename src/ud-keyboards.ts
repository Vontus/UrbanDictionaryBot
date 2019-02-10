import { UdDefinition } from "./urban-dictionary/ud-definition";
import { InlineKeyboardButton, CallbackQuery, InlineKeyboardMarkup } from "node-telegram-bot-api";
import UrbanApi from "./urban-dictionary";

const CALLBACK_PREV = 'prev'
const CALLBACK_NEXT = 'next'

let channelLink: string;

if (process.env.CHANNEL_LINK) {
  channelLink = process.env.CHANNEL_LINK
}

export default {
  buildFromDefinition (buttonResponse: UdButtonResponse): InlineKeyboardMarkup {
    let defs = buttonResponse.definitions

    let channelButton = {
      text: '📣 Channel',
      url: channelLink
    }

    let pos = buttonResponse.position
    let previous = pos -1;
    let next = pos +1;
    let first = 0;
    let last = defs.length -1;

    let navigationButtons = [{
        text: '⏪ Previous',
        callback_data: defs[pos].word + '_' + (pos === first ? last : previous)
      },{
        text: (pos + 1) + "/" + defs.length,
        callback_data: 'ignore'
      },{
        text: '⏩ Next',
        callback_data: defs[pos].word + '_' + (pos === last ? first: next)
      }]

    let keyboard: InlineKeyboardMarkup = {
      inline_keyboard: [navigationButtons, [channelButton]]
    }

    return keyboard;
  },

  async parseButtonClick (callbackQuery: CallbackQuery): Promise<UdButtonResponse> {
    if (callbackQuery.data) {
      let data = callbackQuery.data.split('_')
      let term = data[0]
      let pos: number = parseInt(data[1])
      let definitions = await UrbanApi.define(term)

      return {
        definitions: definitions.list,
        position: pos
      }
    }
    return Promise.reject();
  }
}

export interface UdButtonResponse {
  definitions: UdDefinition[];
  position: number;
}