import type { Update } from "./types";

export class Poller {
  private offset = 0;
  private running = false;

  constructor(
    private token: string,
    private onUpdate: (update: Update) => void,
    private onError: (error: Error) => void,
  ) {}

  start(): void {
    this.running = true;
    void this.poll();
  }

  stop(): void {
    this.running = false;
  }

  private async poll(): Promise<void> {
    while (this.running) {
      try {
        const updates = await this.getUpdates();
        for (const update of updates) {
          this.offset = update.update_id + 1;
          this.onUpdate(update);
        }
      } catch (error) {
        this.onError(error as Error);
        await new Promise((r) => setTimeout(r, 5000));
      }
    }
  }

  private async getUpdates(): Promise<Update[]> {
    const res = await fetch(
      `https://api.telegram.org/bot${this.token}/getUpdates?offset=${this.offset}&timeout=30`,
      { signal: AbortSignal.timeout(35000) },
    );
    const data = (await res.json()) as { ok: boolean; result: Update[]; description?: string };
    if (!data.ok) throw new Error(`getUpdates failed: ${data.description}`);
    return data.result;
  }
}
