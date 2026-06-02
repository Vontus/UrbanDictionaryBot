import { describe, it, expect } from "vitest";
import { aggregate, addInteraction } from "./aggregator";
import { InteractionType } from "./types";

describe("aggregate", () => {
  it("returns zero unique-users for empty stats", () => {
    expect(aggregate([])).toEqual({ "unique-users": 0 });
  });

  it("sums interactions across all users", () => {
    const stats = [
      { userId: 1, interactions: [{ interactionType: InteractionType.Message, amount: 3 }] },
      { userId: 2, interactions: [{ interactionType: InteractionType.Message, amount: 2 }] },
    ];
    expect(aggregate(stats)[InteractionType.Message]).toBe(5);
  });

  it("counts unique users correctly", () => {
    const stats = [
      { userId: 1, interactions: [] },
      { userId: 2, interactions: [] },
      { userId: 1, interactions: [] },
    ];
    expect(aggregate(stats)["unique-users"]).toBe(2);
  });

  it("groups multiple interaction types separately", () => {
    const stats = [
      {
        userId: 1,
        interactions: [
          { interactionType: InteractionType.Message, amount: 2 },
          { interactionType: InteractionType.ButtonClick, amount: 5 },
        ],
      },
    ];
    const result = aggregate(stats);
    expect(result[InteractionType.Message]).toBe(2);
    expect(result[InteractionType.ButtonClick]).toBe(5);
  });
});

describe("addInteraction", () => {
  it("creates a new user entry if the user does not exist", () => {
    const result = addInteraction([], 42, InteractionType.Message);
    expect(result).toHaveLength(1);
    expect(result[0].userId).toBe(42);
    expect(result[0].interactions[0]).toEqual({ interactionType: InteractionType.Message, amount: 1 });
  });

  it("increments an existing interaction for a known user", () => {
    const initial = [
      { userId: 1, interactions: [{ interactionType: InteractionType.Message, amount: 2 }] },
    ];
    const result = addInteraction(initial, 1, InteractionType.Message);
    expect(result[0].interactions[0].amount).toBe(3);
  });

  it("adds a new interaction type for an existing user", () => {
    const initial = [
      { userId: 1, interactions: [{ interactionType: InteractionType.Message, amount: 1 }] },
    ];
    const result = addInteraction(initial, 1, InteractionType.ButtonClick);
    expect(result[0].interactions).toHaveLength(2);
  });

  it("does not mutate the input array", () => {
    const initial = [
      { userId: 1, interactions: [{ interactionType: InteractionType.Message, amount: 1 }] },
    ];
    addInteraction(initial, 1, InteractionType.Message);
    expect(initial[0].interactions[0].amount).toBe(1);
  });

  it("preserves unrelated users untouched", () => {
    const initial = [
      { userId: 1, interactions: [{ interactionType: InteractionType.Message, amount: 1 }] },
      { userId: 2, interactions: [{ interactionType: InteractionType.Message, amount: 5 }] },
    ];
    const result = addInteraction(initial, 1, InteractionType.Message);
    expect(result[1].interactions[0].amount).toBe(5);
  });
});
