import type { Message, InlineKeyboardMarkup, InlineQueryResult } from "./types";

export interface SendMessageOptions {
  parse_mode?: "HTML" | "Markdown" | "MarkdownV2";
  disable_web_page_preview?: boolean;
  reply_markup?: InlineKeyboardMarkup;
}

export interface EditMessageTextOptions {
  chat_id?: number | string;
  message_id?: number;
  parse_mode?: "HTML" | "Markdown" | "MarkdownV2";
  disable_web_page_preview?: boolean;
  reply_markup?: InlineKeyboardMarkup;
}

export interface AnswerInlineQueryOptions {
  cache_time?: number;
  switch_pm_text?: string;
  switch_pm_parameter?: string;
}

export class TelegramClient {
  constructor(private token: string) {}

  private async call<T>(method: string, body: Record<string, unknown>): Promise<T> {
    const res = await fetch(`https://api.telegram.org/bot${this.token}/${method}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const data = (await res.json()) as { ok: boolean; result: T; description?: string };
    if (!data.ok) throw new Error(`Telegram API error on ${method}: ${data.description}`);
    return data.result;
  }

  sendMessage(chatId: number | string, text: string, options?: SendMessageOptions): Promise<Message> {
    return this.call("sendMessage", { chat_id: chatId, text, ...options });
  }

  editMessageText(text: string, options: EditMessageTextOptions): Promise<Message | boolean> {
    return this.call("editMessageText", { text, ...options });
  }

  answerInlineQuery(inlineQueryId: string, results: InlineQueryResult[], options?: AnswerInlineQueryOptions): Promise<boolean> {
    return this.call("answerInlineQuery", { inline_query_id: inlineQueryId, results, ...options });
  }

  answerCallbackQuery(callbackQueryId: string, options?: { text?: string }): Promise<boolean> {
    return this.call("answerCallbackQuery", { callback_query_id: callbackQueryId, ...options });
  }

  sendDocument(chatId: number | string, document: string): Promise<Message> {
    return this.call("sendDocument", { chat_id: chatId, document });
  }

  leaveChat(chatId: number | string): Promise<boolean> {
    return this.call("leaveChat", { chat_id: chatId });
  }
}
