import { describe, it, expect } from "vitest";
import encode from "./encoder";

describe("encode", () => {
  it("returns empty string for null", () => {
    expect(encode(null)).toBe("");
  });

  it("returns empty string for undefined", () => {
    expect(encode(undefined)).toBe("");
  });

  it("escapes &", () => {
    expect(encode("a & b")).toBe("a &amp; b");
  });

  it("escapes <", () => {
    expect(encode("<b>bold</b>")).toBe("&lt;b&gt;bold&lt;/b&gt;");
  });

  it("escapes >", () => {
    expect(encode("1 > 0")).toBe("1 &gt; 0");
  });

  it('escapes "', () => {
    expect(encode('"quoted"')).toBe("&quot;quoted&quot;");
  });

  it("escapes multiple special chars in one string", () => {
    expect(encode('<a href="x">link & text</a>')).toBe(
      '&lt;a href=&quot;x&quot;&gt;link &amp; text&lt;/a&gt;',
    );
  });

  it("leaves plain text unchanged", () => {
    expect(encode("hello world")).toBe("hello world");
  });
});
