import { describe, it, expect } from "vitest";
import formatter, { truncateHtml } from "./formatter";

describe("formatter", () => {
  it("bold wraps text in <b> tags", () => {
    expect(formatter.bold("hello")).toBe("<b>hello</b>");
  });

  it("italic wraps text in <i> tags", () => {
    expect(formatter.italic("hello")).toBe("<i>hello</i>");
  });

  it("link produces an <a> tag", () => {
    expect(formatter.link("Urban", "https://example.com")).toBe(
      '<a href="https://example.com">Urban</a>',
    );
  });

  it("code wraps text in <code> tags", () => {
    expect(formatter.code("snippet")).toBe("<code>snippet</code>");
  });

  describe("truncateHtml", () => {
    it("returns text unchanged when shorter than maxLength", () => {
      expect(truncateHtml("hello world", 100, "...")).toBe("hello world");
    });

    it("returns text unchanged when exactly at maxLength", () => {
      const text = "a".repeat(50);
      expect(truncateHtml(text, 50, "...")).toBe(text);
    });

    it("truncates plain text and appends suffix", () => {
      const result = truncateHtml("a ".repeat(100), 50, "...");
      expect(result.length).toBeLessThanOrEqual(50);
      expect(result.endsWith("...")).toBe(true);
    });

    it("backs up to the last word boundary", () => {
      // target=6 → "aaa bb" → backs up to "aaa"
      expect(truncateHtml("aaa bbb ccc", 9, "...")).toBe("aaa...");
    });

    it("removes an incomplete HTML tag at the truncation point", () => {
      const text = 'some text <a href="https://example.com">link</a> more text here now';
      const result = truncateHtml(text, 20, "...");
      expect(result).not.toMatch(/<[^>]*$/);
      expect(result.length).toBeLessThanOrEqual(20);
    });

    it("preserves a complete HTML tag that fits within the budget", () => {
      const text = `before <a href="https://x.com">word</a> after that we have more words pushing past the limit`;
      expect(truncateHtml(text, 50, "...")).not.toMatch(/<[^>]*$/);
    });

    it("handles text with no spaces gracefully", () => {
      const result = truncateHtml("x".repeat(100), 20, "...");
      expect(result.length).toBeLessThanOrEqual(20);
      expect(result.endsWith("...")).toBe(true);
    });
  });

  describe("compress / decompress", () => {
    it("round-trips a simple string", () => {
      const text = "hello world";
      expect(formatter.decompress(formatter.compress(text))).toBe(text);
    });

    it("round-trips a string with underscores and digits (callback data format)", () => {
      const text = "some slang term_3";
      expect(formatter.decompress(formatter.compress(text))).toBe(text);
    });

    it("strips trailing = from compressed output", () => {
      expect(formatter.compress("test")).not.toMatch(/=$/);
    });
  });
});
