import { describe, it, expect } from "vitest";
import formatter from "./formatter";

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
