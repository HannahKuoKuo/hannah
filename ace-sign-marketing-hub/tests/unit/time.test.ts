import { describe, expect, it } from "vitest";
import { businessDay, fromBusinessLocal, toBusinessLocal } from "@/lib/time";

describe("Sydney time helpers", () => {
  it("converts wall-clock times during daylight saving (AEDT, +11)", () => {
    expect(fromBusinessLocal("2026-11-10T09:00").toISOString()).toBe("2026-11-09T22:00:00.000Z");
    expect(toBusinessLocal("2026-11-09T22:00:00.000Z")).toBe("2026-11-10T09:00");
  });

  it("converts wall-clock times in standard time (AEST, +10)", () => {
    expect(fromBusinessLocal("2026-06-15T09:00").toISOString()).toBe("2026-06-14T23:00:00.000Z");
  });

  it("reports the Sydney calendar day", () => {
    expect(businessDay("2026-11-09T14:00:00Z")).toBe("2026-11-10");
  });
});
