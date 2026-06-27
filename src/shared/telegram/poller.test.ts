import { describe, it, expect, vi, afterEach } from "vitest";
import { Poller, isTransientError } from "./poller";

const flush = (): Promise<void> => new Promise((r) => setTimeout(r, 0));

describe("isTransientError", () => {
  it.each([
    "getUpdates failed: Bad Gateway",
    "getUpdates failed: Gateway Timeout",
    "getUpdates failed: Service Unavailable",
    "request timed out",
    "fetch failed",
    "read ECONNRESET",
    "connect ECONNREFUSED 1.2.3.4",
    "getaddrinfo ENOTFOUND api.telegram.org",
    "getaddrinfo EAI_AGAIN api.telegram.org",
    "The operation was aborted",
  ])("classifies %j as transient", (message) => {
    expect(isTransientError(new Error(message))).toBe(true);
  });

  it("classifies AbortError / TimeoutError by name", () => {
    const abort = new Error("aborted");
    abort.name = "AbortError";
    const timeout = new Error("timeout");
    timeout.name = "TimeoutError";
    expect(isTransientError(abort)).toBe(true);
    expect(isTransientError(timeout)).toBe(true);
  });

  it("does not classify auth/logic errors as transient", () => {
    expect(isTransientError(new Error("getUpdates failed: Unauthorized"))).toBe(false);
    expect(isTransientError(new Error("Bad Request: chat not found"))).toBe(false);
  });
});

describe("Poller", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("delivers updates to onUpdate and advances the offset", async () => {
    // First call returns one update; subsequent calls never resolve so the
    // poll loop parks instead of spinning.
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce({
        json: () =>
          Promise.resolve({
            ok: true,
            result: [{ update_id: 41, message: { text: "hi" } }],
          }),
      })
      .mockReturnValue(new Promise(() => {}));
    vi.stubGlobal("fetch", fetchMock);

    const onUpdate = vi.fn();
    const onError = vi.fn();
    const poller = new Poller("token", onUpdate, onError);

    poller.start();
    await flush();
    poller.stop();

    expect(onUpdate).toHaveBeenCalledWith({
      update_id: 41,
      message: { text: "hi" },
    });
    expect(onError).not.toHaveBeenCalled();
    // offset advanced past update 41
    expect(fetchMock.mock.calls[1][0]).toContain("offset=42");
  });

  it("does NOT route transient getUpdates failures through onError", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce({
        json: () => Promise.resolve({ ok: false, description: "Bad Gateway" }),
      })
      .mockReturnValue(new Promise(() => {}));
    vi.stubGlobal("fetch", fetchMock);

    const onError = vi.fn();
    const poller = new Poller("token", vi.fn(), onError);

    poller.start();
    await flush();
    poller.stop();

    expect(onError).not.toHaveBeenCalled();
  });

  it("routes non-transient failures through onError", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce({
        json: () => Promise.resolve({ ok: false, description: "Unauthorized" }),
      })
      .mockReturnValue(new Promise(() => {}));
    vi.stubGlobal("fetch", fetchMock);

    const onError = vi.fn();
    const poller = new Poller("token", vi.fn(), onError);

    poller.start();
    await flush();
    poller.stop();

    expect(onError).toHaveBeenCalledTimes(1);
    expect((onError.mock.calls[0][0] as Error).message).toContain("Unauthorized");
  });
});
