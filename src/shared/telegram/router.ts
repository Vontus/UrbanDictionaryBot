import type { Update, Message, CallbackQuery, InlineQuery, ChosenInlineResult } from "./types";

export interface UpdateHandlers {
  onMessage?: (msg: Message) => Promise<void>;
  onCallbackQuery?: (query: CallbackQuery) => Promise<void>;
  onInlineQuery?: (query: InlineQuery) => Promise<void>;
  onChosenInlineResult?: (result: ChosenInlineResult) => Promise<void>;
}

export function route(update: Update, handlers: UpdateHandlers, onError: (e: Error) => void): void {
  const dispatch = async (): Promise<void> => {
    if (update.message != null && handlers.onMessage != null) {
      await handlers.onMessage(update.message);
    } else if (update.callback_query != null && handlers.onCallbackQuery != null) {
      await handlers.onCallbackQuery(update.callback_query);
    } else if (update.inline_query != null && handlers.onInlineQuery != null) {
      await handlers.onInlineQuery(update.inline_query);
    } else if (update.chosen_inline_result != null && handlers.onChosenInlineResult != null) {
      await handlers.onChosenInlineResult(update.chosen_inline_result);
    }
  };

  dispatch().catch(onError);
}
