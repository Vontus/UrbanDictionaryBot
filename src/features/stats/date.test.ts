import { describe, it, expect } from "vitest";
import { formatDate, parseDate, isSameDay } from "./date";

describe("formatDate", () => {
  it("formats a date as YYYY-MM-DD", () => {
    expect(formatDate(new Date(2025, 0, 5))).toBe("2025-01-05");
  });

  it("pads single-digit months and days with zeros", () => {
    expect(formatDate(new Date(2025, 0, 1))).toBe("2025-01-01");
  });

  it("handles December correctly", () => {
    expect(formatDate(new Date(2025, 11, 31))).toBe("2025-12-31");
  });
});

describe("parseDate", () => {
  it("parses a valid date string", () => {
    const d = parseDate("2025-06-01");
    expect(d).not.toBeNull();
    expect(formatDate(d!)).toBe("2025-06-01");
  });

  it("returns null for wrong format", () => {
    expect(parseDate("01/06/2025")).toBeNull();
    expect(parseDate("2025/06/01")).toBeNull();
    expect(parseDate("not-a-date")).toBeNull();
  });

  it("returns null for an impossible date", () => {
    expect(parseDate("2025-02-30")).toBeNull();
    expect(parseDate("2025-13-01")).toBeNull();
  });
});

describe("isSameDay", () => {
  it("returns true for the same date", () => {
    expect(isSameDay(new Date(2025, 0, 1), new Date(2025, 0, 1))).toBe(true);
  });

  it("returns false for different dates", () => {
    expect(isSameDay(new Date(2025, 0, 1), new Date(2025, 0, 2))).toBe(false);
  });

  it("returns false for same day different months", () => {
    expect(isSameDay(new Date(2025, 0, 1), new Date(2025, 1, 1))).toBe(false);
  });
});
