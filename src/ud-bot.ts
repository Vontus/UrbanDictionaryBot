import * as TelegramBot from "node-telegram-bot-api";
import * as format from "string-template";
import { scheduleJob } from "node-schedule";
import YAML from "yamljs";
import moment from "moment";

import UrbanApi from "./urban-api";
import templates from "./templates";
import { isArabic } from "./util";
import logger from "./logger";
import udKeyboards from "./ud-keyboards";
import inlineResults from "./inline-results";
import { BotCommand } from "./bot-command";
import { UdDefinition } from "./urban-api/ud-definition";
import strings from "./strings";
import formatter from "./formatter";
import { addStats, getStatsFrom } from "./storage/stats";
import { InteractionType } from "./storage/stats-data";
import udChannel from "./ud-channel";
import { UdApiNotAvailableError } from "./exceptions/UdApiNotAvailableError";
import {
  adminId,
  channelId,
  logChatId,
  statsPostTime,
  messageCharacterLimit,
} from "./config";
import encode from "./encoder";

export class UdBot extends TelegramBot {
  public constructor(token: string, options: TelegramBot.ConstructorOptions) {
    super(token, options);

    this.on("message", (msg) => {
      void this.routeMessage(msg);
    });
    this.on("error", (error) => void this.handleError(error));
    this.on(
      "callback_query",
      (callbackQuery) => void this.handleCallbackQuery(callbackQuery),
    );
    this.on("inline_query", (query) => void this.onInlineQuery(query));
    this.on(
      "chosen_inline_result",
      (chosenResult) => void this.onChosenInlineResult(chosenResult),
    );

    void this.schedulePostStats();
  }

  async schedulePostStats(): Promise<void> {
    if (logChatId != null && statsPostTime != null) {
      logger.log(`Scheduling posting stats at ${statsPostTime}`);
      scheduleJob(statsPostTime, () => {
        if (logChatId != null) {
          void this.sendStats(logChatId, moment().subtract(1, "day"));
        }
      });
    }
  }

  async onChosenInlineResult(
    chosenInlineResult: TelegramBot.ChosenInlineResult,
  ): Promise<void> {
    await addStats(chosenInlineResult.from.id, InteractionType.InlineQuery);
  }

  async onInlineQuery(inlineQuery: TelegramBot.InlineQuery): Promise<void> {
    try {
      if (inlineQuery.query == null || inlineQuery.query.length <= 0) {
        const randomResult = await UrbanApi.random();
        await this.answerInlineQuery(
          inlineQuery.id,
          inlineResults.getResults(randomResult),
          {
            cache_time: 0,
          },
        );
        return;
      }

      const definitions = await UrbanApi.defineTerm(inlineQuery.query);

      if (definitions == null || definitions.length <= 0) {
        await this.answerInlineQuery(inlineQuery.id, [], {
          switch_pm_text: strings.noResultsShort,
          switch_pm_parameter: "ignore",
        });
        return;
      }

      await this.answerInlineQuery(
        inlineQuery.id,
        inlineResults.getResults(definitions),
      );
    } catch (error) {
      // Todo remove as
      await this.handleError(error as Error);
      const text =
        error instanceof UdApiNotAvailableError
          ? strings.apiDownShort
          : strings.unexpectedErrorShort;

      await this.answerInlineQuery(inlineQuery.id, [], {
        switch_pm_text: text,
        switch_pm_parameter: "ignore",
      });
    }
  }

  async routeMessage(message: TelegramBot.Message): Promise<void> {
    try {
      if (message.chat.id.toString() === logChatId) {
        await this.handleLogChat(message);
      }

      if (message.chat.type === "private") {
        await this.handlePrivateChat(message);
      } else if (message.left_chat_member != null) {
        await this.leaveChat(message.chat.id);
      }
    } catch (error) {
      // Todo remove as
      await this.handleError(error as Error, message);
      const text =
        error instanceof UdApiNotAvailableError
          ? error.message
          : strings.unexpectedError;

      await this.sendMessage(message.chat.id, text);
    }
  }

  async handlePrivateChat(message: TelegramBot.Message): Promise<void> {
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
      await this.sendMessage(chatId, format(strings.noResults, encode(text)), {
        parse_mode: "HTML",
      });
      return;
    }

    return await this.sendDefinition(chatId, defs, 0, text);
  }

  async handleLogChat(message: TelegramBot.Message): Promise<void> {
    if (
      message.text?.startsWith("/") &&
      adminId != null &&
      message.from?.id.toString() === adminId
    ) {
      await this.handleAdminCommand(new BotCommand(message));
    }
  }

  async handleCallbackQuery(
    callbackQuery: TelegramBot.CallbackQuery,
  ): Promise<void> {
    if (callbackQuery.message == null) {
      logger.error("No message received from callbackQuery");
      await this.answerCallbackQuery(callbackQuery.id);
      return;
    }

    if (callbackQuery.data === "ignore") {
      await this.answerCallbackQuery(callbackQuery.id);
      return;
    }

    let text;

    try {
      const buttonResponse = await udKeyboards.parseButtonClick(callbackQuery);
      const def = buttonResponse.definitions[buttonResponse.position];
      const inlineKeyboard = udKeyboards.buildFromDefinition(buttonResponse);

      const editMessOptions: TelegramBot.EditMessageTextOptions = {
        chat_id: callbackQuery.message.chat.id,
        disable_web_page_preview: true,
        message_id: callbackQuery.message.message_id,
        parse_mode: "HTML",
        reply_markup: inlineKeyboard,
      };

      await Promise.all([
        this.editMessageText(this.buildDefinition(def), editMessOptions),
        addStats(callbackQuery.message.chat.id, InteractionType.ButtonClick),
      ]);
    } catch (error) {
      // Todo remove as
      await this.handleError(error as Error);
      text =
        error instanceof UdApiNotAvailableError
          ? strings.apiDown
          : strings.unexpectedError;
    }
    await this.answerCallbackQuery(callbackQuery.id, { text });
  }

  buildDefinition(def: UdDefinition): string {
    let definitionString = templates.definition(def);

    if (definitionString.length > messageCharacterLimit) {
      definitionString = format(strings.definitionTooLong, def.permalink);
    }

    return definitionString;
  }

  async sendDefinition(
    chatId: number | string,
    defs: UdDefinition[],
    pos: number,
    keyboardTerm?: string,
  ): Promise<void> {
    const msgOptions: TelegramBot.SendMessageOptions = {
      parse_mode: "HTML",
      disable_web_page_preview: true,
      reply_markup: udKeyboards.buildFromDefinition(
        keyboardTerm
          ? { term: keyboardTerm, definitions: defs, position: 0 }
          : undefined,
      ),
    };
    const definitionString = this.buildDefinition(defs[pos]);
    await this.sendMessage(chatId, definitionString, msgOptions);
  }

  async sendArabicResponse(chat: TelegramBot.Chat): Promise<void> {
    await this.sendMessage(chat.id, strings.arabicResponse);
  }

  async sendHelp(chat: TelegramBot.Chat): Promise<void> {
    await this.sendMessage(chat.id, strings.help);
  }

  async handleError(
    error: Error,
    message?: TelegramBot.Message,
  ): Promise<void> {
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
        msg += "\n\n";
        msg += JSON.stringify(moreInfo);
      }

      await this.sendMessage(logChatId, msg);
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
      await this.sendMessage(
        command.message.chat.id,
        `Error executing command:\n${JSON.stringify(err)}`,
      );
      throw err;
    }
  }

  async handleWotdCommand(command: BotCommand): Promise<void> {
    let chatId: string = command.message.chat.id.toString();
    let saveWord: boolean = false;
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

    await udChannel.sendWord(chatId, saveWord);
  }

  async handleStatsCommand(command: BotCommand): Promise<void> {
    const { dateFormat, wrongDateFormat } = strings.commands.stats;
    const from = command.args[0];
    const fromMoment = from != null ? moment(from, dateFormat, true) : moment();

    if (!fromMoment.isValid()) {
      await this.sendMessage(
        command.message.chat.id,
        format(wrongDateFormat, from, dateFormat),
      );
    }

    await this.sendStats(command.message.chat.id, fromMoment);
  }

  async sendStats(
    chatId: number | string,
    fromMoment: moment.Moment,
  ): Promise<void> {
    const message = fromMoment.isSame(moment(), "day")
      ? "Today's Stats:"
      : "Stats from " + fromMoment.format(strings.commands.stats.dateFormat);
    await this.sendMessage(
      chatId,
      message + "\n\n" + YAML.stringify(await getStatsFrom(fromMoment)),
    );
  }

  async handleStartCommand(command: BotCommand): Promise<void> {
    if (command.args.length <= 0) {
      await this.sendMessage(
        command.message.chat.id,
        strings.commands.start.default,
      );
      return;
    }

    if (command.args[0] === "ignore") {
      return;
    }

    const word = formatter.decompress(command.args[0]);

    if (!word) {
      await this.sendMessage(
        command.message.chat.id,
        strings.commands.start.badArgument,
      );
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
        await this.sendMessage(
          command.message.chat.id,
          strings.commands.about,
          { parse_mode: "HTML", disable_web_page_preview: true },
        );
        break;
      case "random":
        await this.sendDefinition(
          command.message.chat.id,
          await UrbanApi.random(),
          0,
        );
        break;
      case "help":
        await this.sendHelp(command.message.chat);
        break;
      default:
        if (
          adminId != null &&
          command.message.from?.id.toString() === adminId
        ) {
          await this.handleAdminCommand(command);
        } else {
          await this.sendHelp(command.message.chat);
        }
        break;
    }
  }
}
