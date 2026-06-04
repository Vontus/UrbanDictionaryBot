import { describe, it, expect } from "vitest";
import { buildDefinitionText } from "./templates";
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

// ─── buildMessageText ────────────────────────────────────────────────────────

describe("buildMessageText", () => {
  it("returns the full message when both fields fit", () => {
    const result = buildDefinitionText(makeDefinition());
    expect(result.length).toBeLessThanOrEqual(TELEGRAM_LIMIT);
    expect(result).not.toContain("Read more");
  });

  it("does not truncate when a long definition still fits within the total limit", () => {
    // ~1500 chars def + short example — well under 4096
    const result = buildDefinitionText(makeDefinition({ formattedDefinition: repeat("word ", 300) }));
    expect(result).not.toContain("Read more");
    expect(result.length).toBeLessThanOrEqual(TELEGRAM_LIMIT);
  });

  it("truncates only the definition when it alone pushes the total over the limit", () => {
    const longDefinition = repeat("word ", 900); // ~4500 chars
    const shortExample = "<i>short</i>";
    const result = buildDefinitionText(makeDefinition({ formattedDefinition: longDefinition, formattedExample: shortExample }));
    expect(result.length).toBeLessThanOrEqual(TELEGRAM_LIMIT);
    expect(result).toContain("Read more");
    // The short example must appear verbatim — it was not truncated
    expect(result).toContain(shortExample);
  });

  it("truncates only the example when it alone pushes the total over the limit", () => {
    const shortDefinition = "a short definition";
    const longExample = `<i>${repeat("word ", 900)}</i>`;
    const result = buildDefinitionText(makeDefinition({ formattedDefinition: shortDefinition, formattedExample: longExample }));
    expect(result.length).toBeLessThanOrEqual(TELEGRAM_LIMIT);
    expect(result).toContain("Read more");
    // The short definition must appear verbatim — it was not truncated
    expect(result).toContain(shortDefinition);
  });

  it("truncates both fields when both are very long", () => {
    const longDefinition = repeat("word ", 1000);
    const longExample = `<i>${repeat("word ", 1000)}</i>`;
    const result = buildDefinitionText(makeDefinition({ formattedDefinition: longDefinition, formattedExample: longExample }));
    expect(result.length).toBeLessThanOrEqual(TELEGRAM_LIMIT);
    expect(result.split("Read more").length - 1).toBe(2);
  });

  it("never exceeds TELEGRAM_LIMIT even with maximum-length inputs", () => {
    const maxDefinition = repeat("a ", 3000);
    const maxExample = `<i>${repeat("b ", 3000)}</i>`;
    const result = buildDefinitionText(
      makeDefinition({ word: repeat("w", 50), formattedDefinition: maxDefinition, formattedExample: maxExample }),
    );
    expect(result.length).toBeLessThanOrEqual(TELEGRAM_LIMIT);
  });

  it("does not produce a broken HTML tag when truncation falls mid-tag", () => {
    const prefix = repeat("word ", 390);
    const definitionWithTag = `${prefix}<a href="https://urbandictionary.com/define.php?term=something-very-long">linked word</a>`;
    const result = buildDefinitionText(makeDefinition({ formattedDefinition: definitionWithTag }));
    expect(result).not.toMatch(/<[^>]*$/m);
    expect(result.length).toBeLessThanOrEqual(TELEGRAM_LIMIT);
  });

  it("includes the permalink in the Read more link", () => {
    const permalink = "https://www.urbandictionary.com/define.php?term=bong";
    const longDefinition = repeat("word ", 1000);
    const result = buildDefinitionText(makeDefinition({ formattedDefinition: longDefinition, permalink }));
    expect(result).toContain(`href="${permalink}"`);
  });

  it("respects a custom limit passed as second argument", () => {
    const longDefinition = repeat("word ", 300); // ~1500 chars — under 4096 but over 1200
    const result = buildDefinitionText(makeDefinition({ formattedDefinition: longDefinition }), 1200);
    expect(result.length).toBeLessThanOrEqual(1200);
    expect(result).toContain("Read more");
  });
});
