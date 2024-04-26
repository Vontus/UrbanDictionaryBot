export default {
  help: "I can help you find out about english slang by sending a message here or via inline mode! 😎",
  noResults: "¯\\_(ツ)_/¯\nThere aren't any definitions for <b>{0}</b> yet.",
  noResultsShort: "No results   ¯\\_(ツ)_/¯",
  arabicResponse:
    "This bot is only available in English.\nاین ربات فقط به زبان انگلیسی کار می‌کند.",
  donateLink: "https://t.me/UrbanDictionary/1486",
  unexpectedError:
    "There was an unexpected error when trying to fulfill your request.",
  unexpectedErrorShort: "Unexpected error",
  apiDown:
    "The Urban Dictionary API is currently not available, or there was an error with your query.",
  apiDownShort: "The Urban Dictionary API isn't working",

  commands: {
    start: {
      default: "Type the word or expression you want to search.",
      badArgument:
        "The argument you provided is not a valid word or expression.",
    },
    about:
      'Bot created by @Vontus using this awesome <a href="https://github.com/yagop/node-telegram-bot-api">API</a>.\n\n<a href="https://github.com/Vontus/UrbanDictionaryBot">Bot source</a>',
    donate:
      'You will be redirected to the Urban Dictionary channel: <a href="https://t.me/UrbanDictionary/1486">💸 Donate</a>.',
    stats: {
      dateFormat: "YYYY-MM-DD",
      wrongDateFormat: "Date {0} is not valid. Please use format {1}.",
      wrongDateOrder: "The second date must be after the first.",
    },
  },
};
