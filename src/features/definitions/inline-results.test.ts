import { describe, it, expect } from "vitest";
import { truncateHtml, buildMessageText } from "./inline-results";
import type { UdDefinition } from "./definition";

// ─── helpers ────────────────────────────────────────────────────────────────

function repeat(char: string, n: number): string {
  return char.repeat(n);
}

function makeDefinition(overrides: {
  word?: string;
  formattedDefinition?: string;
  formattedExample?: string;
  permalink?: string;
} = {}): UdDefinition {
  return {
    defId: 1,
    word: overrides.word ?? "test",
    definition: "raw definition",
    formattedDefinition: overrides.formattedDefinition ?? "a short definition",
    example: "raw example",
    formattedExample: overrides.formattedExample ?? "<i>a short example</i>",
    permalink:
      overrides.permalink ??
      "https://www.urbandictionary.com/define.php?term=test",
    author: "author",
    gif: undefined,
    formatLinks: () => "",
  } as unknown as UdDefinition;
}

const TELEGRAM_LIMIT = 4096;

// ─── truncateHtml ────────────────────────────────────────────────────────────

describe("truncateHtml", () => {
  it("returns text unchanged when shorter than maxLength", () => {
    expect(truncateHtml("hello world", 100, "...")).toBe("hello world");
  });

  it("returns text unchanged when exactly at maxLength", () => {
    const text = repeat("a", 50);
    expect(truncateHtml(text, 50, "...")).toBe(text);
  });

  it("truncates plain text and appends suffix", () => {
    const text = repeat("a ", 100); // 200 chars
    const result = truncateHtml(text, 50, "...");
    expect(result.length).toBeLessThanOrEqual(50);
    expect(result.endsWith("...")).toBe(true);
  });

  it("backs up to the last word boundary", () => {
    // "aaa bbb ccc" truncated to 9 chars with "..." suffix → target=6 → "aaa bb" → back to "aaa"
    const result = truncateHtml("aaa bbb ccc", 9, "...");
    expect(result).toBe("aaa...");
  });

  it("removes an incomplete HTML tag at the truncation point", () => {
    const text = "some text <a href=\"https://example.com\">link</a> more text here now";
    const result = truncateHtml(text, 20, "...");
    expect(result).not.toMatch(/<[^>]*$/);
    expect(result.length).toBeLessThanOrEqual(20);
  });

  it("preserves a complete HTML tag that fits within the budget", () => {
    const link = '<a href="https://x.com">word</a>';
    const text = `before ${link} after that we have more words that push past the limit here`;
    const result = truncateHtml(text, 50, "...");
    expect(result).not.toMatch(/<[^>]*$/);
  });

  it("handles text with no spaces gracefully", () => {
    const text = repeat("x", 100);
    const result = truncateHtml(text, 20, "...");
    expect(result.length).toBeLessThanOrEqual(20);
    expect(result.endsWith("...")).toBe(true);
  });
});

// ─── buildMessageText ────────────────────────────────────────────────────────

describe("buildMessageText", () => {
  it("returns the full message when both fields fit", () => {
    const result = buildMessageText(makeDefinition());
    expect(result.length).toBeLessThanOrEqual(TELEGRAM_LIMIT);
    expect(result).not.toContain("Read more");
  });

  it("does not truncate when a long definition still fits within the total limit", () => {
    // ~1500 chars def + short example — well under 4096
    const result = buildMessageText(makeDefinition({ formattedDefinition: repeat("word ", 300) }));
    expect(result).not.toContain("Read more");
    expect(result.length).toBeLessThanOrEqual(TELEGRAM_LIMIT);
  });

  it("truncates only the definition when it alone pushes the total over the limit", () => {
    const longDefinition = repeat("word ", 900); // ~4500 chars
    const shortExample = "<i>short</i>";
    const result = buildMessageText(makeDefinition({ formattedDefinition: longDefinition, formattedExample: shortExample }));
    expect(result.length).toBeLessThanOrEqual(TELEGRAM_LIMIT);
    expect(result).toContain("Read more");
    // The short example must appear verbatim — it was not truncated
    expect(result).toContain(shortExample);
  });

  it("truncates only the example when it alone pushes the total over the limit", () => {
    const shortDefinition = "a short definition";
    const longExample = `<i>${repeat("word ", 900)}</i>`;
    const result = buildMessageText(makeDefinition({ formattedDefinition: shortDefinition, formattedExample: longExample }));
    expect(result.length).toBeLessThanOrEqual(TELEGRAM_LIMIT);
    expect(result).toContain("Read more");
    // The short definition must appear verbatim — it was not truncated
    expect(result).toContain(shortDefinition);
  });

  it("truncates both fields when both are very long", () => {
    const longDefinition = repeat("word ", 1000);
    const longExample = `<i>${repeat("word ", 1000)}</i>`;
    const result = buildMessageText(makeDefinition({ formattedDefinition: longDefinition, formattedExample: longExample }));
    expect(result.length).toBeLessThanOrEqual(TELEGRAM_LIMIT);
    expect(result.split("Read more").length - 1).toBe(2);
  });

  it("never exceeds TELEGRAM_LIMIT even with maximum-length inputs", () => {
    const maxDefinition = repeat("a ", 3000);
    const maxExample = `<i>${repeat("b ", 3000)}</i>`;
    const result = buildMessageText(
      makeDefinition({ word: repeat("w", 50), formattedDefinition: maxDefinition, formattedExample: maxExample }),
    );
    expect(result.length).toBeLessThanOrEqual(TELEGRAM_LIMIT);
  });

  it("does not produce a broken HTML tag when truncation falls mid-tag", () => {
    const prefix = repeat("word ", 390);
    const definitionWithTag = `${prefix}<a href="https://urbandictionary.com/define.php?term=something-very-long">linked word</a>`;
    const result = buildMessageText(makeDefinition({ formattedDefinition: definitionWithTag }));
    expect(result).not.toMatch(/<[^>]*$/m);
    expect(result.length).toBeLessThanOrEqual(TELEGRAM_LIMIT);
  });

  it("includes the permalink in the Read more link", () => {
    const permalink = "https://www.urbandictionary.com/define.php?term=bong";
    const longDefinition = repeat("word ", 1000);
    const result = buildMessageText(makeDefinition({ formattedDefinition: longDefinition, permalink }));
    expect(result).toContain(`href="${permalink}"`);
  });
});
