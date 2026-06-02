import { IStatsData, InteractionType } from "./types";

export function aggregate(stats: IStatsData[]): Record<string, number> & { "unique-users": number } {
  const totals: Record<string, number> = {};
  for (const { interactions } of stats) {
    for (const { interactionType, amount } of interactions) {
      totals[interactionType] = (totals[interactionType] ?? 0) + amount;
    }
  }
  const uniqueUsers = new Set(stats.map((s) => s.userId)).size;
  return { ...totals, "unique-users": uniqueUsers };
}

export function addInteraction(
  stats: IStatsData[],
  userId: number,
  interactionType: InteractionType,
): IStatsData[] {
  const userIndex = stats.findIndex((s) => s.userId === userId);
  if (userIndex === -1) {
    return [...stats, { userId, interactions: [{ interactionType, amount: 1 }] }];
  }
  return stats.map((s, i) => {
    if (i !== userIndex) return s;
    const interactionIndex = s.interactions.findIndex((x) => x.interactionType === interactionType);
    if (interactionIndex === -1) {
      return { ...s, interactions: [...s.interactions, { interactionType, amount: 1 }] };
    }
    return {
      ...s,
      interactions: s.interactions.map((x, j) =>
        j === interactionIndex ? { ...x, amount: x.amount + 1 } : x,
      ),
    };
  });
}
