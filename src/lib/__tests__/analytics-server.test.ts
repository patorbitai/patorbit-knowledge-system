"use strict";

import { describe, expect, it, vi, beforeEach, afterAll } from "vitest";
import { promises as fs } from "fs";
import path from "path";
import os from "os";

const { createMany, findMany } = vi.hoisted(() => ({
  createMany: vi.fn(),
  findMany: vi.fn(),
}));

vi.mock("@/lib/prisma", () => ({
  prisma: { analyticsEvent: { createMany, findMany } },
}));

let tmpDir: string;
let mod: typeof import("@/lib/analytics-server");

beforeEach(async () => {
  vi.resetModules();
  createMany.mockReset().mockResolvedValue({ count: 1 });
  findMany.mockReset().mockResolvedValue([]);
  tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), "patorbit-analytics-"));
  process.env.ANALYTICS_ALLOW_WRITE = "1";
  process.env.PATORBIT_ANALYTICS_DIR = tmpDir;
  mod = await import("@/lib/analytics-server");
});

afterAll(() => {
  delete process.env.ANALYTICS_ALLOW_WRITE;
  delete process.env.PATORBIT_ANALYTICS_DIR;
});

const deadLetterPath = () => path.join(tmpDir, "events.jsonl");

describe("normalizeBatch", () => {
  const base = {
    event: "match_viewed",
    ts: "2026-09-22T00:00:00.000Z",
    sessionId: "sess-1",
    props: { score: 62 },
  };

  it("preserves the client-generated id (retry idempotency)", () => {
    const out = mod.normalizeBatch([{ ...base, id: "evt-abc" }]);
    expect(out).toHaveLength(1);
    expect(out[0].id).toBe("evt-abc");
    expect(out[0].event).toBe("match_viewed");
    expect(out[0].props).toEqual({ score: 62 });
  });

  it("generates an id when the client omits one", () => {
    const out = mod.normalizeBatch([base]);
    expect(out[0].id).toBeTruthy();
  });

  it("never lets two records in one batch share a primary key", () => {
    const out = mod.normalizeBatch([
      { ...base, id: "dup" },
      { ...base, id: "dup" },
    ]);
    expect(out).toHaveLength(2);
    expect(out[0].id).not.toBe(out[1].id);
  });

  it("keeps sensitive prop keys out of storage", () => {
    const out = mod.normalizeBatch([
      { ...base, props: { email: "a@b.c", password: "x", score: 1 } },
    ]);
    expect(out[0].props).toEqual({ score: 1 });
  });

  it("drops unknown events and malformed records", () => {
    const out = mod.normalizeBatch([
      { ...base, event: "not_a_tracked_event" },
      null,
      "nope",
      base,
    ]);
    expect(out).toHaveLength(1);
    expect(out[0].event).toBe("match_viewed");
  });
});

describe("appendEvents", () => {
  it("inserts with skipDuplicates so beacon retries dedupe", async () => {
    const ok = await mod.appendEvents([
      { id: "e1", event: "gap_viewed", ts: new Date().toISOString(), sessionId: "s" },
    ]);
    expect(ok).toBe(true);
    expect(createMany).toHaveBeenCalledTimes(1);
    const arg = createMany.mock.calls[0][0];
    expect(arg.skipDuplicates).toBe(true);
    expect(arg.data[0]).toMatchObject({ id: "e1", event: "gap_viewed", sessionId: "s" });
    expect(arg.data[0].ts).toBeInstanceOf(Date);
  });

  it("dead-letters records when the database is unavailable", async () => {
    createMany.mockRejectedValueOnce(new Error("db down"));
    const ok = await mod.appendEvents([
      { id: "e1", event: "tailoring_completed", ts: new Date().toISOString(), sessionId: "s" },
    ]);
    expect(ok).toBe(false);
    const raw = await fs.readFile(deadLetterPath(), "utf8");
    expect(raw).toContain("tailoring_completed");
  });

  it("drains the dead-letter backlog on the next successful write and clears it", async () => {
    createMany.mockRejectedValueOnce(new Error("db down"));
    await mod.appendEvents([
      { id: "lost", event: "resume_exported", ts: new Date().toISOString(), sessionId: "s" },
    ]);

    createMany.mockClear().mockResolvedValue({ count: 1 });
    const ok = await mod.appendEvents([
      { id: "fresh", event: "match_viewed", ts: new Date().toISOString(), sessionId: "s" },
    ]);
    expect(ok).toBe(true);

    // First insert is the new record; second insert is the drained backlog.
    expect(createMany).toHaveBeenCalledTimes(2);
    const drained = createMany.mock.calls[1][0];
    expect(drained.data[0]).toMatchObject({ id: "lost", event: "resume_exported" });
    await expect(fs.readFile(deadLetterPath(), "utf8")).rejects.toThrow();
  });

  it("readEvents drains the backlog even without new traffic", async () => {
    createMany.mockRejectedValueOnce(new Error("db down"));
    await mod.appendEvents([
      { id: "backlogged", event: "evidence_viewed", ts: new Date().toISOString(), sessionId: "s" },
    ]);
    createMany.mockClear().mockResolvedValue({ count: 1 });
    findMany.mockResolvedValue([]);

    await mod.readEvents();
    expect(createMany).toHaveBeenCalledTimes(1);
    expect(createMany.mock.calls[0][0].data[0]).toMatchObject({ id: "backlogged" });
  });
});

describe("readEvents", () => {
  it("maps database rows back into analytics records", async () => {
    findMany.mockResolvedValue([
      {
        id: "r1",
        event: "suggestion_edited",
        ts: new Date("2026-09-22T10:00:00Z"),
        sessionId: "sess-9",
        props: { section: "skills" },
      },
      {
        id: "r2",
        event: "made_up_event",
        ts: new Date("2026-09-22T11:00:00Z"),
        sessionId: "sess-9",
        props: null,
      },
    ]);
    const out = await mod.readEvents();
    expect(out).toHaveLength(1);
    expect(out[0]).toMatchObject({
      id: "r1",
      event: "suggestion_edited",
      sessionId: "sess-9",
      props: { section: "skills" },
    });
    expect(out[0].ts).toBe("2026-09-22T10:00:00.000Z");
    // newest-first ordering is delegated to the database query
    expect(findMany.mock.calls[0][0]).toMatchObject({ orderBy: { ts: "desc" } });
  });

  it("returns an empty list instead of throwing when the database is down", async () => {
    findMany.mockRejectedValue(new Error("db down"));
    await expect(mod.readEvents()).resolves.toEqual([]);
  });
});
