import { describe, it, expect, vi } from "vitest";
import { route } from "./router";
import type { Update } from "./types";

const makeUpdate = (partial: Partial<Update>): Update =>
  ({ update_id: 1, ...partial }) as Update;

describe("route", () => {
  it("dispatches message updates to onMessage", () => {
    const onMessage = vi.fn().mockResolvedValue(undefined);
    const update = makeUpdate({ message: { text: "hello" } as Update["message"] });
    route(update, { onMessage }, () => {});
    expect(onMessage).toHaveBeenCalledWith(update.message);
  });

  it("dispatches callback_query to onCallbackQuery", () => {
    const onCallbackQuery = vi.fn().mockResolvedValue(undefined);
    const update = makeUpdate({ callback_query: { id: "abc" } as Update["callback_query"] });
    route(update, { onCallbackQuery }, () => {});
    expect(onCallbackQuery).toHaveBeenCalledWith(update.callback_query);
  });

  it("dispatches inline_query to onInlineQuery", () => {
    const onInlineQuery = vi.fn().mockResolvedValue(undefined);
    const update = makeUpdate({ inline_query: { id: "xyz" } as Update["inline_query"] });
    route(update, { onInlineQuery }, () => {});
    expect(onInlineQuery).toHaveBeenCalledWith(update.inline_query);
  });

  it("dispatches chosen_inline_result to onChosenInlineResult", () => {
    const onChosenInlineResult = vi.fn().mockResolvedValue(undefined);
    const update = makeUpdate({ chosen_inline_result: { result_id: "r1" } as Update["chosen_inline_result"] });
    route(update, { onChosenInlineResult }, () => {});
    expect(onChosenInlineResult).toHaveBeenCalledWith(update.chosen_inline_result);
  });

  it("does not call a handler that is not registered", () => {
    const onMessage = vi.fn();
    const update = makeUpdate({ inline_query: { id: "xyz" } as Update["inline_query"] });
    route(update, { onMessage }, () => {});
    expect(onMessage).not.toHaveBeenCalled();
  });

  it("calls onError if a handler rejects", async () => {
    const error = new Error("boom");
    const onMessage = vi.fn().mockRejectedValue(error);
    const onError = vi.fn();
    const update = makeUpdate({ message: {} as Update["message"] });
    route(update, { onMessage }, onError);
    await new Promise((r) => setTimeout(r, 0));
    expect(onError).toHaveBeenCalledWith(error);
  });
});
