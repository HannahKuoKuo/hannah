import { describe, expect, it } from "vitest";
import { addDays, daysBetweenInclusive, isIsoDay, resolveRange } from "@/lib/date-range";
import { filtersToQuery, parseFilters } from "@/lib/filters";

describe("date ranges", () => {
  it("validates ISO days strictly", () => {
    expect(isIsoDay("2026-02-28")).toBe(true);
    expect(isIsoDay("2026-02-30")).toBe(false);
    expect(isIsoDay("28/02/2026")).toBe(false);
  });

  it("anchors presets to the latest data day", () => {
    const r = resolveRange({ range: "7d" }, "2026-11-08");
    expect(r).toMatchObject({ from: "2026-11-02", to: "2026-11-08", days: 7, previous: { from: "2026-10-26", to: "2026-11-01" } });
  });

  it("defaults to 30 days for unknown or incomplete input", () => {
    expect(resolveRange({ range: "bogus" }, "2026-11-08").days).toBe(30);
    expect(resolveRange({ range: "custom", from: "nope" }, "2026-11-08").preset).toBe("30d");
  });

  it("accepts custom ranges and swaps reversed dates", () => {
    const r = resolveRange({ range: "custom", from: "2026-11-05", to: "2026-11-01" }, "2026-11-08");
    expect(r).toMatchObject({ from: "2026-11-01", to: "2026-11-05", days: 5, previous: { from: "2026-10-27", to: "2026-10-31" } });
  });

  it("handles month boundaries", () => {
    expect(addDays("2026-02-28", 1)).toBe("2026-03-01");
    expect(daysBetweenInclusive("2026-01-01", "2026-12-31")).toBe(365);
  });
});

describe("filters", () => {
  it("parses and round-trips URL filters", () => {
    const f = parseFilters({ range: "custom", from: "2026-10-01", to: "2026-10-31", platform: "linkedin", source: "real" }, "2026-11-08");
    expect(f.platform).toBe("LINKEDIN");
    expect(f.source).toBe("real");
    expect(filtersToQuery(f)).toBe("range=custom&from=2026-10-01&to=2026-10-31&platform=linkedin&source=real");
  });

  it("ignores invalid values", () => {
    const f = parseFilters({ platform: "myspace", source: "x", campaign: "a;drop" }, "2026-11-08");
    expect(f).toMatchObject({ platform: undefined, source: "all", campaignId: undefined });
  });
});
