import { readDay, writeDay } from "./store";
import { aggregate, addInteraction } from "./aggregator";

export { InteractionType } from "./types";
export { yesterday, parseDate, isSameDay, formatDate } from "./date";

export async function addStats(userId: number, interactionType: import("./types").InteractionType): Promise<void> {
  const today = new Date();
  await writeDay(today, addInteraction(await readDay(today), userId, interactionType));
}

export async function getStatsFrom(date: Date): Promise<Record<string, number> & { "unique-users": number }> {
  return aggregate(await readDay(date));
}
