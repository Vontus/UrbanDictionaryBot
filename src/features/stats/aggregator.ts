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
  const updated = [...stats];
  const userStats = updated.find((s) => s.userId === userId);
  if (userStats !== undefined) {
    const interaction = userStats.interactions.find((i) => i.interactionType === interactionType);
    if (interaction !== undefined) {
      interaction.amount++;
    } else {
      userStats.interactions.push({ interactionType, amount: 1 });
    }
  } else {
    updated.push({ userId, interactions: [{ interactionType, amount: 1 }] });
  }
  return updated;
}
