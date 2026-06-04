import { Cron } from "croner";

import UrbanApi from "./features/definitions/api";
import templates from "./features/definitions/templates";
import keyboards from "./features/definitions/keyboards";
import inlineResults from "./features/definitions/inline-results";
import formatter, { truncateHtml } from "./features/definitions/formatter";
import encode from "./features/definitions/encoder";
import { UdDefinition } from "./features/definitions/definition";
import { isArabic } from "./util";
import logger from "./logger";
import { BotCommand } from "./bot-command";
import strings from "./strings";
import {
  addStats,
  getStatsFrom,
  InteractionType,
  yesterday,
  parseDate,
  isSameDay,
  formatDate,
} from "./features/stats";
import { sendWord as sendChannelWord } from "./features/channel/sender";
import { UdApiNotAvailableError } from "./exceptions/UdApiNotAvailableError";
import {
  adminId,
  channelId,
  logChatId,
  statsPostTime,
  messageCharacterLimit,
} from "./config";
import { TelegramClient } from "./shared/telegram/client";
import type { SendMessageOptions, EditMessageTextOptions } from "./shared/telegram/client";
import type { Message, Chat, CallbackQuery, InlineQuery, ChosenInlineResult } from "./shared/telegram/types";
import type { UpdateHandlers } from "./shared/telegram/router";

const DEFINITION_TRUNCATION_MARGIN = 100; // safety buffer + room for the "Read more" suffix

export class UdBot {
  constructor(private client: TelegramClient) {
    void this.schedulePostStats();
  }

  getHandlers(): UpdateHandlers {
    return {
      onMessage: (msg) => this.routeMessage(msg),
      onCallbackQuery: (query) => this.handleCallbackQuery(query),
      onInlineQuery: (query) => this.onInlineQuery(query),
      onChosenInlineResult: (result) => this.onChosenInlineResult(result),
    };
  }

  sendMessage(chatId: number | string, text: string, options?: SendMessageOptions): Promise<Message> {
    return this.client.sendMessage(chatId, text, options);
  }

  sendDocument(chatId: number | string, document: string): Promise<Message> {
    return this.client.sendDocument(chatId, document);
  }

  async schedulePostStats(): Promise<void> {
    if (logChatId != null && statsPostTime != null) {
      logger.log(`Scheduling posting stats at ${statsPostTime}`);
      new Cron(statsPostTime, () => {
        if (logChatId != null) {
          void this.sendStats(logChatId, yesterday());
        }
      });
    }
  }

  async onChosenInlineResult(chosenInlineResult: ChosenInlineResult): Promise<void> {
    await addStats(chosenInlineResult.from.id, InteractionType.InlineQuery);
  }

  async onInlineQuery(inlineQuery: InlineQuery): Promise<void> {
    try {
      if (inlineQuery.query == null || inlineQuery.query.length <= 0) {
        const randomResult = await UrbanApi.random();
        await this.client.answerInlineQuery(
          inlineQuery.id,
          inlineResults.getResults(randomResult),
          { cache_time: 0 },
        );
        return;
      }

      const definitions = await UrbanApi.defineTerm(inlineQuery.query);

      if (definitions == null || definitions.length <= 0) {
        await this.client.answerInlineQuery(inlineQuery.id, [], {
          switch_pm_text: strings.noResultsShort,
          switch_pm_parameter: "ignore",
        });
        return;
      }

      await this.client.answerInlineQuery(inlineQuery.id, inlineResults.getResults(definitions));
    } catch (error) {
      await this.handleError(error as Error);
      const text =
        error instanceof UdApiNotAvailableError
          ? strings.apiDownShort
          : strings.unexpectedErrorShort;

      await this.client.answerInlineQuery(inlineQuery.id, [], {
        switch_pm_text: text,
        switch_pm_parameter: "ignore",
      });
    }
  }

  async routeMessage(message: Message): Promise<void> {
    try {
      if (message.chat.id.toString() === logChatId) {
        await this.handleLogChat(message);
      }

      if (message.chat.type === "private") {
        await this.handlePrivateChat(message);
      } else if (message.left_chat_member != null) {
        await this.client.leaveChat(message.chat.id);
      }
    } catch (error) {
      await this.handleError(error as Error, message);
      const text =
        error instanceof UdApiNotAvailableError
          ? error.message
          : strings.unexpectedError;

      await this.client.sendMessage(message.chat.id, text);
    }
  }

  async handlePrivateChat(message: Message): Promise<void> {
    if (message.text == null) {
      return await this.sendHelp(message.chat);
    }

    const text: string = message.text;

    if (isArabic(text)) {
      return await this.sendArabicResponse(message.chat);
    }

    if (text[0] === "/") {
      return await this.handleCommand(new BotCommand(message));
    }

    await Promise.all([
      this.handleUdQuery(message.text, message.chat.id),
      addStats(message.chat.id, InteractionType.Message),
    ]);
  }

  async handleUdQuery(text: string, chatId: number): Promise<void> {
    const defs = await UrbanApi.defineTerm(text);

    if (defs == null || defs.length <= 0) {
      await this.client.sendMessage(chatId, formatPositional(strings.noResults, encode(text)), {
        parse_mode: "HTML",
      });
      return;
    }

    return await this.sendDefinition(chatId, defs, 0, text);
  }

  async handleLogChat(message: Message): Promise<void> {
    if (
      message.text?.startsWith("/") &&
      adminId != null &&
      message.from?.id.toString() === adminId
    ) {
      await this.handleAdminCommand(new BotCommand(message));
    }
  }

  async handleCallbackQuery(callbackQuery: CallbackQuery): Promise<void> {
    if (callbackQuery.message == null) {
      logger.error("No message received from callbackQuery");
      await this.client.answerCallbackQuery(callbackQuery.id);
      return;
    }

    if (callbackQuery.data === "ignore") {
      await this.client.answerCallbackQuery(callbackQuery.id);
      return;
    }

    let text;

    try {
      const buttonResponse = await keyboards.parseButtonClick(callbackQuery);
      const def = buttonResponse.definitions[buttonResponse.position];
      const inlineKeyboard = keyboards.buildFromDefinition(buttonResponse);

      const editMessOptions: EditMessageTextOptions = {
        chat_id: callbackQuery.message.chat.id,
        disable_web_page_preview: true,
        message_id: callbackQuery.message.message_id,
        parse_mode: "HTML",
        reply_markup: inlineKeyboard,
      };

      await Promise.all([
        this.client.editMessageText(this.buildDefinition(def), editMessOptions),
        addStats(callbackQuery.message.chat.id, InteractionType.ButtonClick),
      ]);
    } catch (error) {
      await this.handleError(error as Error);
      text =
        error instanceof UdApiNotAvailableError
          ? strings.apiDown
          : strings.unexpectedError;
    }
    await this.client.answerCallbackQuery(callbackQuery.id, { text });
  }

  buildDefinition(definition: UdDefinition): string {
    const full = templates.definition(definition);
    if (full.length <= messageCharacterLimit) return full;

    const readMore = ` <a href="${definition.permalink}">Read more</a>`;
    const shell = templates.definition({ ...definition, formattedDefinition: "", formattedExample: "" });
    const available = messageCharacterLimit - shell.length - DEFINITION_TRUNCATION_MARGIN;
    const half = Math.floor(available / 2);

    // Each field gets the space the other doesn't use, guaranteed at least half
    const definitionBudget = available - Math.min(definition.formattedExample.length, half);
    const exampleBudget    = available - Math.min(definition.formattedDefinition.length, half);

    return templates.definition({
      ...definition,
      formattedDefinition: truncateHtml(definition.formattedDefinition, definitionBudget, `...${readMore}`),
      formattedExample: truncateHtml(definition.formattedExample, exampleBudget, `...${readMore}`),
    });
  }

  async sendDefinition(
    chatId: number | string,
    defs: UdDefinition[],
    pos: number,
    keyboardTerm?: string,
  ): Promise<void> {
    const msgOptions: SendMessageOptions = {
      parse_mode: "HTML",
      disable_web_page_preview: true,
      reply_markup: keyboards.buildFromDefinition(
        keyboardTerm
          ? { term: keyboardTerm, definitions: defs, position: 0 }
          : undefined,
      ),
    };
    await this.client.sendMessage(chatId, this.buildDefinition(defs[pos]), msgOptions);
  }

  async sendArabicResponse(chat: Chat): Promise<void> {
    await this.client.sendMessage(chat.id, strings.arabicResponse);
  }

  async sendHelp(chat: Chat): Promise<void> {
    await this.client.sendMessage(chat.id, strings.help);
  }

  async handleError(error: Error, message?: Message): Promise<void> {
    logger.error(error);
    await this.logToTelegram(
      error.message,
      message != null
        ? {
            text: message.text,
            chatId: message.chat.id,
            username: message.from?.username,
          }
        : null,
    );
  }

  async logToTelegram(message: string, moreInfo?: unknown): Promise<void> {
    if (logChatId != null) {
      let msg = message;
      if (moreInfo != null) {
        msg += "\n\n" + JSON.stringify(moreInfo);
      }
      await this.client.sendMessage(logChatId, msg);
    }
  }

  async handleAdminCommand(command: BotCommand): Promise<void> {
    try {
      switch (command.label) {
        case "stats":
          await this.handleStatsCommand(command);
          break;
        case "wotd":
          await this.handleWotdCommand(command);
          break;
      }
    } catch (err) {
      await this.client.sendMessage(
        command.message.chat.id,
        `Error executing command:\n${JSON.stringify(err)}`,
      );
      throw err;
    }
  }

  async handleWotdCommand(command: BotCommand): Promise<void> {
    let chatId: string = command.message.chat.id.toString();
    let saveWord = false;
    if (command.args.length > 0) {
      if (command.args[0] === "ch" || command.args[0] === "channel") {
        saveWord = true;
        if (channelId != null) {
          chatId = channelId;
        } else {
          throw new Error("CHANNEL_ID is not defined");
        }
      } else {
        chatId = command.args[0];
      }
    }

    await sendChannelWord(this.client, chatId, saveWord);
  }

  async handleStatsCommand(command: BotCommand): Promise<void> {
    const { dateFormat, wrongDateFormat } = strings.commands.stats;
    const from = command.args[0];
    const fromDate = from != null ? parseDate(from) : new Date();

    if (fromDate == null) {
      await this.client.sendMessage(
        command.message.chat.id,
        formatPositional(wrongDateFormat, from, dateFormat),
      );
      return;
    }

    await this.sendStats(command.message.chat.id, fromDate);
  }

  async sendStats(chatId: number | string, date: Date): Promise<void> {
    const message = isSameDay(date, new Date())
      ? "Today's Stats:"
      : "Stats from " + formatDate(date);
    const stats = await getStatsFrom(date);
    await this.client.sendMessage(chatId, message + "\n\n" + JSON.stringify(stats, null, 2));
  }

  async handleStartCommand(command: BotCommand): Promise<void> {
    if (command.args.length <= 0) {
      await this.client.sendMessage(command.message.chat.id, strings.commands.start.default);
      return;
    }

    if (command.args[0] === "ignore") {
      return;
    }

    const word = formatter.decompress(command.args[0]);

    if (!word) {
      await this.client.sendMessage(command.message.chat.id, strings.commands.start.badArgument);
      return;
    }

    const defs = await UrbanApi.defineTerm(word);
    await this.sendDefinition(command.message.chat.id, defs, 0, word);
  }

  async handleCommand(command: BotCommand): Promise<void> {
    switch (command.label) {
      case "start":
        await this.handleStartCommand(command);
        break;
      case "about":
        await this.client.sendMessage(
          command.message.chat.id,
          strings.commands.about,
          { parse_mode: "HTML", disable_web_page_preview: true },
        );
        break;
      case "random":
        await this.sendDefinition(command.message.chat.id, await UrbanApi.random(), 0);
        break;
      case "help":
        await this.sendHelp(command.message.chat);
        break;
      default:
        if (adminId != null && command.message.from?.id.toString() === adminId) {
          await this.handleAdminCommand(command);
        } else {
          await this.sendHelp(command.message.chat);
        }
        break;
    }
  }
}

function formatPositional(template: string, ...args: unknown[]): string {
  return template.replace(/\{(\d+)\}/g, (_, i) => String(args[Number(i)] ?? ""));
}
