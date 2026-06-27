import { describe, it, expect } from "vitest";
import { udApiResponseSchema, udApiDefinitionSchema } from "./ud-api-schema";

describe("udApiDefinitionSchema", () => {
  const validItem = {
    defid: 123,
    word: "test",
    definition: "a thing",
    example: "an example",
    permalink: "http://urbandictionary.com/define.php?term=test&defid=123",
    author: "someone",
  };

  it("accepts a fully populated item", () => {
    const result = udApiDefinitionSchema.safeParse(validItem);
    expect(result.success).toBe(true);
  });

  it("defaults missing optional string fields to empty strings", () => {
    const result = udApiDefinitionSchema.parse({
      defid: 1,
      word: "test",
      definition: "a thing",
    });
    expect(result.example).toBe("");
    expect(result.permalink).toBe("");
    expect(result.author).toBe("");
    expect(result.gif).toBeUndefined();
  });

  it("ignores unknown extra fields", () => {
    const result = udApiDefinitionSchema.parse({
      ...validItem,
      thumbs_up: 100,
      written_on: "2020-01-01",
    });
    expect(result.word).toBe("test");
    expect("thumbs_up" in result).toBe(false);
  });

  it("rejects an item missing required fields", () => {
    expect(udApiDefinitionSchema.safeParse({ word: "test" }).success).toBe(false);
  });

  it("rejects an item with a wrong-typed defid", () => {
    expect(
      udApiDefinitionSchema.safeParse({ ...validItem, defid: "123" }).success,
    ).toBe(false);
  });
});

describe("udApiResponseSchema", () => {
  const validItem = {
    defid: 123,
    word: "test",
    definition: "a thing",
    example: "an example",
    permalink: "http://urbandictionary.com/define.php",
    author: "someone",
  };

  it("parses a valid response with a list of definitions", () => {
    const result = udApiResponseSchema.parse({ list: [validItem] });
    expect(result.list).toHaveLength(1);
    expect(result.list[0].word).toBe("test");
  });

  it("defaults a missing list to an empty array", () => {
    const result = udApiResponseSchema.parse({});
    expect(result.list).toEqual([]);
  });

  it("parses an empty list (no results)", () => {
    const result = udApiResponseSchema.parse({ list: [] });
    expect(result.list).toEqual([]);
  });

  it("rejects corrupt data where list is not an array", () => {
    expect(udApiResponseSchema.safeParse({ list: "nope" }).success).toBe(false);
  });

  it("rejects a list containing a structurally broken item", () => {
    const result = udApiResponseSchema.safeParse({
      list: [validItem, { not: "a definition" }],
    });
    expect(result.success).toBe(false);
  });

  it("rejects a null payload", () => {
    expect(udApiResponseSchema.safeParse(null).success).toBe(false);
  });
});
