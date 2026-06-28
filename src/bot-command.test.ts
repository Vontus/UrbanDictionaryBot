import { describe, it, expect } from "vitest";
import { BotCommand } from "./bot-command";
import type { Message } from "./shared/telegram/types";

const makeMessage = (text: string): Message =>
  ({ text }) as unknown as Message;

describe("BotCommand", () => {
  it("parses a command with no arguments", () => {
    const cmd = new BotCommand(makeMessage("/wotd"));
    expect(cmd.label).toBe("wotd");
    expect(cmd.fullArgs).toBeNull();
    expect(cmd.args).toEqual([]);
  });

  it("parses a command with a single argument", () => {
    const cmd = new BotCommand(makeMessage("/stats 2025-06-01"));
    expect(cmd.label).toBe("stats");
    expect(cmd.fullArgs).toBe("2025-06-01");
    expect(cmd.args).toEqual(["2025-06-01"]);
  });

  it("parses a command with multiple arguments", () => {
    const cmd = new BotCommand(makeMessage("/wotd ch extra"));
    expect(cmd.label).toBe("wotd");
    expect(cmd.fullArgs).toBe("ch extra");
    expect(cmd.args).toEqual(["ch", "extra"]);
  });

  it("lowercases the command label", () => {
    const cmd = new BotCommand(makeMessage("/WOTD"));
    expect(cmd.label).toBe("wotd");
  });

  it("extracts the label correctly when args follow (no off-by-one)", () => {
    const cmd = new BotCommand(makeMessage("/start hello"));
    expect(cmd.label).toBe("start");
    expect(cmd.fullArgs).toBe("hello");
  });

  it("throws when the message has no text", () => {
    expect(() => new BotCommand({} as unknown as Message)).toThrow(
      "Invalid command message",
    );
  });

  it("throws when the text does not start with a slash", () => {
    expect(() => new BotCommand(makeMessage("hello"))).toThrow(
      "Invalid command message",
    );
  });
});
