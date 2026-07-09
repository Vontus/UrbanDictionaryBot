import { z } from "zod";

// Schema for a single definition item as returned by the Urban Dictionary
// REST API (http://api.urbandictionary.com/v0/ — endpoints `define` / `random`).
//
// It is intentionally tolerant: only the fields consumed by `UdDefinition` are
// described, missing optional fields fall back to sensible defaults, and unknown
// extra fields are ignored. This lets the bot keep working if the API adds or
// omits fields, while still rejecting structurally broken payloads.
export const udApiDefinitionSchema = z.object({
  defid: z.number(),
  word: z.string(),
  definition: z.string(),
  example: z.string().default(""),
  permalink: z.string().default(""),
  author: z.string().default(""),
  // `gif` is not part of the REST API response (it only comes from the
  // scraper), but it is kept here as optional so the same shape can be reused.
  gif: z.string().optional(),
});

export const udApiResponseSchema = z.object({
  list: z.array(udApiDefinitionSchema).default([]),
});

export type UdApiDefinition = z.infer<typeof udApiDefinitionSchema>;
export type UdApiResponse = z.infer<typeof udApiResponseSchema>;
