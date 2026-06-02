import * as fs from "fs/promises";
import * as path from "path";
import { UdDefinition } from "../definitions/definition";
import { dataPath, maxChannelDefs } from "../../config";

interface ChannelData {
  sentDefIds: number[];
}

const channelFile = path.join(dataPath, "channel.json");

async function read(): Promise<ChannelData> {
  try {
    return JSON.parse(await fs.readFile(channelFile, "utf8")) as ChannelData;
  } catch {
    return { sentDefIds: [] };
  }
}

async function write(data: ChannelData): Promise<void> {
  await fs.mkdir(path.dirname(channelFile), { recursive: true });
  await fs.writeFile(channelFile, JSON.stringify(data, null, 2), "utf8");
}

export async function saveSentChannelDefId(defId: number): Promise<void> {
  const data = await read();
  const ids = data.sentDefIds.slice(0, maxChannelDefs - 1);
  ids.unshift(defId);
  await write({ sentDefIds: ids });
}

export async function getFirstUnsentDef(defs: UdDefinition[]): Promise<UdDefinition | undefined> {
  const { sentDefIds } = await read();
  return defs.find((def) => !sentDefIds.includes(def.defId));
}
