export default {
  help: 'I can help you find out about english slang by sending a message here or via inline mode! 😎',
  noResults: "¯\\_(ツ)_/¯\nThere aren't any definitions for <b>{0}</b> yet.",
  arabicResponse: 'This bot is only available in English.\nاین ربات فقط به زبان انگلیسی کار می‌کند.',
  donateLink: 'https://www.buymeacoffee.com/vontus',
  unexpectedError: 'There was an unexpected error when trying to fulfill your request.',

  commands: {
    start: 'Type the word or expression you want to search.',
    about: 'Bot created by @Vontus using this awesome <a href="https://github.com/yagop/node-telegram-bot-api">API</a>.\n\n<a href="https://github.com/Vontus/UrbanDictionaryBot">Bot source</a>',
    donate: 'Help me stay awake and coding! <a href="https://www.buymeacoffee.com/vontus">Buy me a coffee ☕️</a>.',
    stats: {
      dateFormat: 'YYYY-MM-DD',
      wrongDateFormat: 'Date {0} is not valid. Please use format {1}.',
      wrongDateOrder: 'The second date must be after the first.'
    }
  }
}
