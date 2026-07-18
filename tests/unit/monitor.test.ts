import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { metric, snapshot, _resetMetrics } from "@/lib/monitor";

beforeEach(() => {
  const base = new Date("2026-07-18T12:00:00Z");
  vi.useFakeTimers({ now: base });
  _resetMetrics();
});

afterEach(() => {
  vi.useRealTimers();
  _resetMetrics();
});

describe("monitor", () => {
  it("returns empty snapshot when no metrics recorded", () => {
    const s = snapshot();
    expect(s.metrics).toEqual({});
    expect(s.uptime).toBeGreaterThanOrEqual(0);
    expect(s.startedAt).toBeDefined();
  });

  it("records a metric event and reports count", () => {
    metric("test.event");
    const s = snapshot();
    expect(s.metrics["test.event"]).toBeDefined();
    expect(s.metrics["test.event"]!.total).toBe(1);
    expect(s.metrics["test.event"]!.recent5m).toBe(1);
    expect(s.metrics["test.event"]!.recent1h).toBe(1);
  });

  it("records multiple events of the same metric", () => {
    metric("test.event");
    metric("test.event");
    metric("test.event");

    const s = snapshot();
    expect(s.metrics["test.event"]!.total).toBe(3);
    expect(s.metrics["test.event"]!.recent5m).toBe(3);
  });

  it("supports labeled metrics", () => {
    metric("checkout.started", "landing-page");
    metric("checkout.started", "proyecto-starter");
    metric("checkout.error", "stripe_session_failed");

    const s = snapshot();
    expect(s.metrics["checkout.started:landing-page"]!.total).toBe(1);
    expect(s.metrics["checkout.started:proyecto-starter"]!.total).toBe(1);
    expect(s.metrics["checkout.error:stripe_session_failed"]!.total).toBe(1);
  });

  it("records lastEvent timestamp", () => {
    const now = new Date("2026-07-18T12:00:00Z");
    vi.setSystemTime(now);

    metric("test.event");

    const s = snapshot();
    expect(s.metrics["test.event"]!.lastEvent).toBe(now.toISOString());
  });

  it("reports correct recent5m count after time passes", () => {
    metric("test.event"); // t=0

    vi.advanceTimersByTime(4 * 60_000); // +4 min
    metric("test.event"); // within 5m window

    vi.advanceTimersByTime(2 * 60_000); // +6 min total
    // first event is now outside 5m window, second is still inside

    const s = snapshot();
    expect(s.metrics["test.event"]!.total).toBe(2);
    expect(s.metrics["test.event"]!.recent5m).toBe(1);
  });

  it("reports correct recent1h count after time passes", () => {
    metric("test.event"); // t=0

    vi.advanceTimersByTime(30 * 60_000); // +30 min
    metric("test.event"); // within 1h window

    vi.advanceTimersByTime(60 * 60_000 + 1000); // +90 min 1s total, both outside 1h
    // Sweep in snapshot removes keys with no recent events

    const s = snapshot();
    // Both events are outside the 1h window so the key is swept
    expect(s.metrics["test.event"]).toBeUndefined();
  });

  it("does not count events older than 1h in any window", () => {
    metric("test.event"); // t=0

    vi.advanceTimersByTime(5 * 60_000); // +5 min
    metric("test.event"); // within 5m window

    vi.advanceTimersByTime(65 * 60_000); // +70 min total
    // Both events are outside the 1h window, key will be swept

    const s = snapshot();
    expect(s.metrics["test.event"]).toBeUndefined();
  });

  it("events within 1h window are still accessible after sweep", () => {
    metric("stale"); // t=0

    vi.advanceTimersByTime(65 * 60_000); // +65 min
    // Stale event is now outside 1h window
    // This metric call triggers sweep which removes "stale"
    metric("fresh"); // t=65min

    const s = snapshot();
    expect(s.metrics["stale"]).toBeUndefined();
    expect(s.metrics["fresh"]!.total).toBe(1);
    expect(s.metrics["fresh"]!.recent5m).toBe(1);
    expect(s.metrics["fresh"]!.recent1h).toBe(1);
  });

  it("handles multiple distinct metric names", () => {
    metric("a");
    metric("b");
    metric("c");

    const s = snapshot();
    expect(Object.keys(s.metrics)).toHaveLength(3);
    expect(s.metrics["a"]!.total).toBe(1);
    expect(s.metrics["b"]!.total).toBe(1);
    expect(s.metrics["c"]!.total).toBe(1);
  });

  it("resets metrics between tests", () => {
    metric("before");
    _resetMetrics();

    const s = snapshot();
    expect(s.metrics["before"]).toBeUndefined();
  });

  it("metric with label creates compound key", () => {
    metric("test.event", "important");
    const s = snapshot();
    expect(s.metrics["test.event:important"]).toBeDefined();
    expect(s.metrics["test.event:important"]!.total).toBe(1);
  });

  it("multiple calls to same labeled metric accumulate", () => {
    metric("test.event", "important");
    metric("test.event", "important");
    const s = snapshot();
    expect(s.metrics["test.event:important"]!.total).toBe(2);
  });

  it("metric without label uses name as key", () => {
    metric("test.event");
    const s = snapshot();
    expect(s.metrics["test.event"]).toBeDefined();
    expect(s.metrics["test.event:undefined"]).toBeUndefined();
  });
});
