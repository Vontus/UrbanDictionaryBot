export default {
  help: "Yo! I’m your go-to for English slang. Just type something here or try inline mode. Let’s decode the lingo! 😎",
  noResults:
    "¯\\_(ツ)_/¯\nNo love for <b>{0}</b> yet. Looks like a slang mystery!",
  noResultsShort: "Nope, no hits ¯\\_(ツ)_/¯",
  arabicResponse:
    "Sorry, this bot only speaks English slang.\nمتأسفم، این ربات فقط به زبان انگلیسی کار می‌کند.",
  unexpectedError:
    "Oops! Something went sideways while handling your request. Try again, maybe?",
  unexpectedErrorShort: "Uh-oh, something broke!",
  definitionTooLong:
    'Whoa, this definition is <b>too legendary</b> to fit here. Check it out on <a href="{0}">Urban Dictionary</a>!',
  apiDown:
    "Looks like Urban Dictionary is taking a nap, or something went wrong with your request. Try again later!",
  apiDownShort: "Urban Dictionary is out of service, oops!",

  commands: {
    start: {
      default:
        "Ready to dive into slang? Just type your word or expression. Let’s go!",
      badArgument:
        "Hmm, that doesn’t look like a proper word or expression. Wanna try again?",
    },
    about:
      'Bot powered by @Vontus.\n\nCheck out the <a href="https://github.com/Vontus/UrbanDictionaryBot">source code</a> here.',
    stats: {
      dateFormat: "YYYY-MM-DD",
      wrongDateFormat:
        "Uh-oh, {0} doesn’t fit the date format. Use {1} instead!",
      wrongDateOrder:
        "Time travel? The second date should be after the first. Try again!",
    },
  },
};
