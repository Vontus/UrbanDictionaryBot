import logger from "../../logger";
import type { Update } from "./types";

// Telegram-side outages and network blips are expected and recoverable: the
// poll loop already backs off and retries, so they should be logged locally
// rather than routed through a Telegram-dependent error reporter. See issue #56.
const TRANSIENT_ERROR_PATTERNS = [
  /Bad Gateway/i,
  /Gateway Timeout/i,
  /Service Unavailable/i,
  /timed? ?out/i,
  /ECONNRESET/i,
  /ECONNREFUSED/i,
  /ENOTFOUND/i,
  /EAI_AGAIN/i,
  /network/i,
  /fetch failed/i,
  /aborted/i,
];

export const isTransientError = (error: Error): boolean =>
  error.name === "AbortError" ||
  error.name === "TimeoutError" ||
  TRANSIENT_ERROR_PATTERNS.some((p) => p.test(error.message));

export class Poller {
  private offset = 0;
  private running = false;
  private backoffMs = 5000;
  private static readonly MIN_BACKOFF_MS = 5000;
  private static readonly MAX_BACKOFF_MS = 60000;

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
        this.backoffMs = Poller.MIN_BACKOFF_MS;
        for (const update of updates) {
          this.offset = update.update_id + 1;
          this.onUpdate(update);
        }
      } catch (error) {
        const err = error as Error;
        if (isTransientError(err)) {
          // Recoverable upstream blip: log and keep polling.
          logger.warn(`getUpdates transient error, retrying: ${err.message}`);
        } else {
          this.onError(err);
        }
        await new Promise((r) => setTimeout(r, this.nextBackoff()));
      }
    }
  }

  private nextBackoff(): number {
    const delay = this.backoffMs;
    // Exponential backoff with jitter for sustained outages.
    this.backoffMs = Math.min(this.backoffMs * 2, Poller.MAX_BACKOFF_MS);
    return delay + Math.floor(Math.random() * 1000);
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
