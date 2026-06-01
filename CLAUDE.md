# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev          # Start with nodemon (hot reload, inspector on port 6068)
npm run start        # Run directly with ts-node
npm run lint         # ESLint check
npm run lint:fix     # ESLint auto-fix
npm run pretty       # Prettier format
```

No test suite is configured — `@types/jest` is a dev dependency but no test scripts or test files exist.

## Environment Setup

Copy `.env.example` to `.env`. The only required variable is `BOT_TOKEN`. All others enable optional features:

| Variable | Purpose |
|---|---|
| `BOT_TOKEN` | **Required.** Telegram bot token from BotFather |
| `BOT_USERNAME` | Required for generating `t.me/<username>?start=…` deep links in inline results |
| `LOG_CHAT_ID` + `ADMIN_ID` | Enables error logging and admin commands in a private Telegram chat |
| `CHANNEL_ID` + `CHANNEL_POST_TIME` | Enables scheduled Word of the Day posts to a channel; `ONSTART` fires immediately on boot |
| `WOTD_ANNOUNCEMENT_TIME` | Preview of next WOTD sent to log chat before posting; `ONSTART` fires immediately on boot |
| `STATS_POST_TIME` | Cron expression to auto-post daily stats to the log chat |
| `DATA_PATH` | Directory for persistent JSON storage (default: `./data/`) |
| `CHANNEL_LINK` | URL shown on the inline keyboard "Urban Dictionary Channel" button |
| `MAX_CHANNEL_DEFS` | How many sent definition IDs to keep to avoid reposting (default: 10) |
| `MESSAGE_CHARACTER_LIMIT` | Max message length before replacing the definition with a permalink fallback (default: 4096) |
| `NTBA_FIX_319` | Set to `"true"` to suppress a node-telegram-bot-api deprecation warning |

Cron expressions use `node-schedule` format (6 fields: `s m h dom mon dow`).

## Architecture

The bot is a single long-running Node.js process using `node-telegram-bot-api` in polling mode. `src/index.ts` creates one `UdBot` instance and calls `udChannel.init()`.

**Request flow:** `UdBot` routes incoming messages and inline queries to `UrbanApi.defineTerm`, which checks an in-memory cache first, then the UD REST API, then falls back to a cheerio scrape of `urbandictionary.com` if the API is down. Results are formatted via `templates.ts` (reads `.txt` files from `resources/templates/`) and sent with an inline keyboard.

**Inline keyboard navigation:** Callback data is `{term}_{position}` compressed with `lz-string` → base64. `parseButtonClick` splits on the **last** `_` to separate term from position, then re-fetches definitions (hits cache). Navigation wraps around cyclically.

**WOTD channel feature (`ud-channel.ts`):** `getWotds()` scrapes the UD homepage with no search term to get featured words. `getFirstUnsentDef` compares against `data/channel.json` to skip already-posted definitions. If the definition has a `.gif` field it is sent as a separate `sendDocument` call.

**`UdDefinition` construction:** All string fields are HTML-encoded on construction (`encoder.ts`). Inline `[bracketed links]` in definition and example text are converted to Telegram HTML `<a>` tags pointing to bot deep links. Example text is wrapped in `<i>` tags with italic tags interleaved around links.

**Persistent storage:** JSON files written to `DATA_PATH`. `channel.json` holds `{ sentDefIds: number[] }`. Stats are stored per day as `stats/YYYY-MM-DD.json` with per-user interaction counts (`messages`, `button-clicks`, `inline-queries`).

**Admin commands** (sent in `LOG_CHAT_ID` by `ADMIN_ID`):

| Command | Behavior |
|---|---|
| `/stats [YYYY-MM-DD]` | Posts stats for the given date (defaults to today) |
| `/wotd` | Sends WOTD preview to the log chat without saving |
| `/wotd ch` or `/wotd channel` | Posts to the configured channel and records the def ID |
| `/wotd <chatId>` | Posts WOTD to an arbitrary chat ID |
