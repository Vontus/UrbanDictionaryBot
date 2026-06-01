import * as fs from "fs/promises";
import * as path from "path";
import { IStatsData } from "./types";
import { dataPath } from "../../config";
import { formatDate } from "./date";

const statsFolder = path.join(dataPath, "stats/");

export function fileForDate(date: Date): string {
  return path.join(statsFolder, formatDate(date) + ".json");
}

export async function readDay(date: Date): Promise<IStatsData[]> {
  try {
    return JSON.parse(await fs.readFile(fileForDate(date), "utf8")) as IStatsData[];
  } catch {
    return [];
  }
}

export async function writeDay(date: Date, data: IStatsData[]): Promise<void> {
  const filePath = fileForDate(date);
  await fs.mkdir(path.dirname(filePath), { recursive: true });
  await fs.writeFile(filePath, JSON.stringify(data, null, 2), "utf8");
}
