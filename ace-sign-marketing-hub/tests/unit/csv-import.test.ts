import { describe, expect, it } from "vitest";
import { parseMetricsCsv, SAMPLE_IMPORT_CSV } from "@/lib/csv-import";
import { csvCell, toCsv } from "@/lib/csv";

describe("CSV import validation", () => {
  it("accepts the sample template", () => {
    const r = parseMetricsCsv(SAMPLE_IMPORT_CSV);
    expect(r.errors).toEqual([]);
    expect(r.rows).toHaveLength(3);
    expect(r.rows[1].revenue).toBeNull();
    expect(r.rows[0]).toMatchObject({ platform: "FACEBOOK", spend: 139.2, leads: 6 });
  });

  it("maps common export headers and AU dates", () => {
    const csv = `Day,Campaign name,Channel,Impressions,Link clicks,Amount spent (AUD)\n05/11/2026,Test,Meta,"1,200",30,"$45.50"\n`;
    const r = parseMetricsCsv(csv);
    expect(r.errors).toEqual([]);
    expect(r.rows[0]).toMatchObject({ date: "2026-11-05", platform: "FACEBOOK", impressions: 1200, clicks: 30, spend: 45.5, conversions: 0 });
  });

  it("reports missing required columns", () => {
    const r = parseMetricsCsv("date,campaign\n2026-11-01,X\n");
    expect(r.missingColumns).toEqual(["platform", "impressions", "clicks", "spend"]);
    expect(r.rows).toHaveLength(0);
  });

  it("reports row-level errors with line numbers", () => {
    const csv = [
      "date,campaign,platform,impressions,clicks,spend",
      "2026-11-01,A,facebook,100,5,10",
      "2026-13-01,A,facebook,100,5,10",
      "2026-11-02,A,tiktok,100,5,10",
      "2026-11-03,A,facebook,-5,5,10",
      "2026-11-04,A,facebook,10,50,10",
      "2026-11-01,a,facebook,100,5,10",
    ].join("\n");
    const r = parseMetricsCsv(csv);
    expect(r.rows).toHaveLength(1);
    const byRow = Object.fromEntries(r.errors.map((e) => [e.row, e.message]));
    expect(byRow[3]).toMatch(/not a valid date/);
    expect(byRow[4]).toMatch(/not recognised/);
    expect(byRow[5]).toMatch(/cannot be negative/);
    expect(byRow[6]).toMatch(/cannot exceed impressions/);
    expect(byRow[7]).toMatch(/duplicate of row 2/);
  });
});

describe("CSV export", () => {
  it("quotes and neutralises formula injection", () => {
    expect(csvCell('a,"b"')).toBe('"a,""b"""');
    expect(csvCell("=HYPERLINK(1)")).toBe("'=HYPERLINK(1)");
    expect(csvCell("-12.5")).toBe("-12.5");
    expect(toCsv(["x"], [[null]])).toBe("x\r\n\r\n");
  });
});
