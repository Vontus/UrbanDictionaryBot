import { describe, it, expect, vi, beforeEach } from "vitest";

// logToTelegram must be best-effort: a Telegram outage while *reporting* an
// error (or logging "Bot started") must never throw, or it would surface as an
// unhandled rejection and crash-loop the process. See issue #56.
vi.mock("./config", async () => {
  const actual = await vi.importActual<typeof import("./config")>("./config");
  return { ...actual, logChatId: "12345", statsPostTime: undefined };
});

import { UdBot } from "./ud-bot";
import type { TelegramClient } from "./shared/telegram/client";

describe("UdBot error logging resilience", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  const makeBot = (sendMessage: TelegramClient["sendMessage"]): UdBot => {
    const client = { sendMessage } as unknown as TelegramClient;
    return new UdBot(client);
  };

  it("logToTelegram does not throw when Telegram is down", async () => {
    const sendMessage = vi
      .fn()
      .mockRejectedValue(new Error("Telegram API error on sendMessage: Bad Gateway"));
    const bot = makeBot(sendMessage as unknown as TelegramClient["sendMessage"]);

    await expect(bot.logToTelegram("Bot started")).resolves.toBeUndefined();
    expect(sendMessage).toHaveBeenCalledWith("12345", "Bot started");
  });

  it("handleError does not throw when Telegram is down", async () => {
    const sendMessage = vi
      .fn()
      .mockRejectedValue(new Error("Telegram API error on sendMessage: Gateway Timeout"));
    const bot = makeBot(sendMessage as unknown as TelegramClient["sendMessage"]);

    await expect(
      bot.handleError(new Error("getUpdates failed: Bad Gateway")),
    ).resolves.toBeUndefined();
  });

  it("logToTelegram sends through the client when Telegram is up", async () => {
    const sendMessage = vi.fn().mockResolvedValue({});
    const bot = makeBot(sendMessage as unknown as TelegramClient["sendMessage"]);

    await bot.logToTelegram("hello", { foo: "bar" });

    expect(sendMessage).toHaveBeenCalledWith(
      "12345",
      'hello\n\n{"foo":"bar"}',
    );
  });
});
