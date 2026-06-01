# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Before committing

Always run these before creating a commit — there is no CI:

```bash
npm run lint
npm test
npm run build
```

## Commands

```bash
npm run build        # Compile TypeScript to dist/
npm run dev          # Start with nodemon (hot reload, ts-node, inspector on port 6068)
npm run start        # Run compiled dist/index.js (production mode, requires .env)
npm run lint         # ESLint check
npm run lint:fix     # ESLint auto-fix
npm test             # Run test suite (vitest)
npm run test:watch   # Vitest in watch mode
```

Deploy to the Pi:

```bash
DEPLOY_HOST=user@host ./scripts/deploy.sh
```

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

Cron expressions use 6-field format (seconds first): `s m h dom mon dow`.

## Architecture

Single long-running Node.js process. `src/index.ts` creates a `TelegramClient`, a `UdBot`, and a `Poller`, then calls `initChannel`.

**Structure:**

```
src/
├── features/
│   ├── definitions/   # UD API, scraper, cache, formatter, keyboards, templates
│   ├── channel/       # WOTD scheduling (croner), sender, store
│   └── stats/         # Aggregator, file store, date helpers
├── shared/
│   └── telegram/      # TelegramClient (fetch), Poller (getUpdates), router, types
├── ud-bot.ts          # UdBot: orchestrates handlers, admin commands, stats display
├── bot-command.ts     # Parses /command arg1 arg2 from a Message
├── config.ts          # zod schema — validates all env vars at startup
├── index.ts           # Entry point
├── logger.ts          # debug-based logger
├── strings.ts         # User-facing text
└── util.ts            # isArabic
```

**Request flow:** `Poller` calls `getUpdates`, `router.route()` dispatches each update to `UdBot`'s handlers. Messages and inline queries hit `features/definitions/api.ts`, which checks an in-memory `DefinitionCache`, then the UD REST API, then falls back to a cheerio scrape of `urbandictionary.com`.

**Inline keyboard navigation:** Callback data is `{term}_{position}` compressed with `lz-string` → base64. `parseButtonClick` in `features/definitions/keyboards.ts` splits on the last `_` to get term and position, then re-fetches (hits cache). Navigation wraps cyclically.

**WOTD channel feature:** `features/channel/` — `getWotds()` scrapes the UD homepage. `getFirstUnsentDef` compares against `data/channel.json`. GIFs are sent as a separate `sendDocument` call. Scheduling via `croner`.

**Persistent storage:** JSON files in `DATA_PATH`. `channel.json` holds `{ sentDefIds: number[] }`. Stats are stored per day as `stats/YYYY-MM-DD.json`.

**Admin commands** (sent in `LOG_CHAT_ID` by `ADMIN_ID`):

| Command | Behavior |
|---|---|
| `/stats [YYYY-MM-DD]` | Posts stats for the given date (defaults to today) |
| `/wotd` | Sends WOTD preview to the log chat without saving |
| `/wotd ch` / `/wotd channel` | Posts to the configured channel and records the def ID |
| `/wotd <chatId>` | Posts WOTD to an arbitrary chat ID |

## Production dependencies

Only 5 packages ship to the Pi (`npm ci --omit=dev`): `cheerio`, `croner`, `debug`, `lz-string`, `zod`.
