export type {
  Message,
  Chat,
  User,
  CallbackQuery,
  InlineQuery,
  ChosenInlineResult,
  Update,
} from "@grammyjs/types";

// Outgoing types (constructed by us) — defined here to avoid discriminated
// union strictness from @grammyjs/types for objects we build ourselves.

export interface InlineKeyboardButton {
  text: string;
  url?: string;
  callback_data?: string;
}

export interface InlineKeyboardMarkup {
  inline_keyboard: InlineKeyboardButton[][];
}

export interface InlineQueryResultArticle {
  type: "article";
  id: string;
  title: string;
  description?: string;
  reply_markup?: InlineKeyboardMarkup;
  input_message_content: {
    message_text: string;
    parse_mode?: "HTML" | "Markdown" | "MarkdownV2";
    disable_web_page_preview?: boolean;
  };
}

export type InlineQueryResult = InlineQueryResultArticle;
