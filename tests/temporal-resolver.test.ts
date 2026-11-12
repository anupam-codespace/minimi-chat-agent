import { describe, it, expect } from "vitest";
import { TemporalResolver } from "../src/lib/temporal/resolver";

describe("TemporalResolver", () => {
  // Reference date: Thursday, November 12, 2026, 14:30:00 UTC
  const refDate = new Date(Date.UTC(2026, 10, 12, 14, 30, 0));

  it("resolves exact calendar dates like '3 November'", () => {
    const res = TemporalResolver.resolveDate("What did I ask you on 3 November?", refDate);
    expect(res).not.toBeNull();
    expect(res?.resolvedDateString).toBe("2026-11-03");
    expect(res?.isRelative).toBe(false);
  });

  it("resolves exact calendar date with explicit year '3 November 2026'", () => {
    const res = TemporalResolver.resolveDate("What did I ask on 3 November 2026?", refDate);
    expect(res).not.toBeNull();
    expect(res?.resolvedDateString).toBe("2026-11-03");
  });

  it("resolves 'On Monday' to previous Monday (Nov 9, 2026)", () => {
    const res = TemporalResolver.resolveDate(
      "On Monday we shortlisted 5 CRM tools for a 20-person sales team.",
      refDate
    );
    expect(res).not.toBeNull();
    expect(res?.resolvedDateString).toBe("2026-11-09");
    expect(res?.isRelative).toBe(true);
  });

  it("resolves 'Last Tuesday' relative to Thursday", () => {
    const res = TemporalResolver.resolveDate(
      "Last Tuesday I asked you about Postgres hosting.",
      refDate
    );
    expect(res).not.toBeNull();
    expect(res?.isRelative).toBe(true);
    // Tuesday is day 2; refDate Thursday is day 4. (4 + 7 - 2)%7 = 2 days ago (Nov 10) or last week (Nov 3)
    expect(["2026-11-10", "2026-11-03"]).toContain(res?.resolvedDateString);
  });

  it("resolves 'yesterday'", () => {
    const res = TemporalResolver.resolveDate("What did you say yesterday?", refDate);
    expect(res).not.toBeNull();
    expect(res?.resolvedDateString).toBe("2026-11-11");
    expect(res?.isRelative).toBe(true);
  });

  it("returns null for non-temporal general queries", () => {
    const res = TemporalResolver.resolveDate("How do I configure Postgres pgvector?", refDate);
    expect(res).toBeNull();
  });
});

