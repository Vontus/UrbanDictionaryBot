import { InlineQueryResultArticle } from 'node-telegram-bot-api'
import { UdDefinition } from './urban-api/ud-definition'
import templates from './templates'
import udKeyboards from './ud-keyboards'

export default {
  getResults (definitions: UdDefinition[]): InlineQueryResultArticle[] {
    return definitions.map(def => {
      return {
        type: 'article',
        title: def.word,
        id: def.defId.toString(),
        description: def.definition,
        reply_markup: udKeyboards.inlineKeyboardResponse(def.word),
        input_message_content: {
          message_text: templates.inlineDefinition(def),
          parse_mode: 'HTML',
          disable_web_page_preview: true
        }
      }
    })
  }
}
