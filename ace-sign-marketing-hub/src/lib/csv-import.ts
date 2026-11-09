import Papa from "papaparse";
import { z } from "zod";
import { isIsoDay } from "./date-range";

/** Metrics CSV import: parsing + row-level validation. Pure - no database access. */

export const IMPORT_MAX_BYTES = 2 * 1024 * 1024;
export const IMPORT_MAX_ROWS = 10_000;

export const IMPORT_COLUMNS = [
  { key: "date", required: true, help: "YYYY-MM-DD or DD/MM/YYYY" },
  { key: "campaign", required: true, help: "Campaign name (created if new)" },
  { key: "platform", required: true, help: "facebook, instagram, linkedin, google or email" },
  { key: "impressions", required: true, help: "Whole number" },
  { key: "clicks", required: true, help: "Whole number" },
  { key: "spend", required: true, help: "AUD, e.g. 125.40" },
  { key: "conversions", required: false, help: "Whole number" },
  { key: "revenue", required: false, help: "AUD - leave blank if not attributed" },
  { key: "engagements", required: false, help: "Whole number" },
  { key: "leads", required: false, help: "Whole number" },
] as const;

const HEADER_ALIASES: Record<string, string> = {
  day: "date",
  "reporting date": "date",
  "campaign name": "campaign",
  channel: "platform",
  source: "platform",
  impr: "impressions",
  "impr.": "impressions",
  "link clicks": "clicks",
  cost: "spend",
  "amount spent": "spend",
  "amount spent (aud)": "spend",
  "spend (aud)": "spend",
  "revenue (aud)": "revenue",
  "conversion value": "revenue",
  results: "conversions",
  engagement: "engagements",
  "post engagements": "engagements",
};

const PLATFORM_ALIASES: Record<string, "FACEBOOK" | "INSTAGRAM" | "LINKEDIN" | "GOOGLE" | "EMAIL"> = {
  facebook: "FACEBOOK",
  fb: "FACEBOOK",
  meta: "FACEBOOK",
  instagram: "INSTAGRAM",
  ig: "INSTAGRAM",
  linkedin: "LINKEDIN",
  google: "GOOGLE",
  "google ads": "GOOGLE",
  adwords: "GOOGLE",
  email: "EMAIL",
  newsletter: "EMAIL",
};

function normaliseHeader(h: string) {
  const k = h.trim().toLowerCase().replace(/\s+/g, " ");
  return HEADER_ALIASES[k] ?? k;
}

function normaliseDate(v: string): string | null {
  const s = v.trim();
  if (isIsoDay(s)) return s;
  const au = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/.exec(s);
  if (au) {
    const iso = `${au[3]}-${au[2].padStart(2, "0")}-${au[1].padStart(2, "0")}`;
    return isIsoDay(iso) ? iso : null;
  }
  return null;
}

const num = (v: unknown) => (typeof v === "string" ? v.replace(/[$,\s]/g, "").replace(/^AUD/i, "") : v);
const intField = (label: string, required: boolean) =>
  z.preprocess(
    (v) => (v === "" || v === undefined ? (required ? undefined : 0) : num(v)),
    z.coerce.number({ error: `${label} must be a number` }).int(`${label} must be a whole number`).min(0, `${label} cannot be negative`).max(1e9),
  );
const moneyField = (label: string) =>
  z.preprocess(
    (v) => num(v),
    z.coerce.number({ error: `${label} must be a number` }).min(0, `${label} cannot be negative`).max(1e8).transform((n) => Math.round(n * 100) / 100),
  );

export const importRowSchema = z
  .object({
    date: z.string({ error: "date is required" }).transform((v, ctx) => {
      const d = normaliseDate(v);
      if (!d) {
        ctx.addIssue({ code: "custom", message: `date '${v}' is not a valid date (use YYYY-MM-DD or DD/MM/YYYY)` });
        return z.NEVER;
      }
      return d;
    }),
    campaign: z.string({ error: "campaign is required" }).trim().min(1, "campaign is required").max(120),
    platform: z.string({ error: "platform is required" }).transform((v, ctx) => {
      const p = PLATFORM_ALIASES[v.trim().toLowerCase()];
      if (!p) {
        ctx.addIssue({ code: "custom", message: `platform '${v}' is not recognised` });
        return z.NEVER;
      }
      return p;
    }),
    impressions: intField("impressions", true),
    clicks: intField("clicks", true),
    spend: z.preprocess((v) => (v === "" ? undefined : v), moneyField("spend")),
    conversions: intField("conversions", false),
    revenue: z.preprocess((v) => (v === "" || v === undefined ? null : v), moneyField("revenue").nullable()),
    engagements: intField("engagements", false),
    leads: intField("leads", false),
  })
  .refine((r) => r.clicks <= r.impressions || r.impressions === 0, {
    message: "clicks cannot exceed impressions",
    path: ["clicks"],
    // only cross-check once every field is individually valid
    when: (payload) => payload.issues.length === 0,
  });

export type ImportRow = z.output<typeof importRowSchema>;

export interface ImportError {
  row: number; // 1-based line number in the file, header = 1
  field?: string;
  message: string;
}

export interface ParsedImport {
  rows: ImportRow[];
  errors: ImportError[];
  totalRows: number;
  missingColumns: string[];
}

export function parseMetricsCsv(text: string): ParsedImport {
  const parsed = Papa.parse<Record<string, string>>(text.replace(/^﻿/, ""), {
    header: true,
    skipEmptyLines: "greedy",
    transformHeader: normaliseHeader,
  });

  const headers = parsed.meta.fields ?? [];
  const missingColumns = IMPORT_COLUMNS.filter((c) => c.required && !headers.includes(c.key)).map((c) => c.key);
  if (missingColumns.length) {
    return { rows: [], errors: [{ row: 1, message: `Missing required column(s): ${missingColumns.join(", ")}` }], totalRows: 0, missingColumns };
  }

  const data = parsed.data;
  if (data.length > IMPORT_MAX_ROWS) {
    return { rows: [], errors: [{ row: 1, message: `File has ${data.length} rows; the limit is ${IMPORT_MAX_ROWS}.` }], totalRows: data.length, missingColumns };
  }

  const rows: ImportRow[] = [];
  const errors: ImportError[] = [];
  const seen = new Map<string, number>();

  data.forEach((raw, i) => {
    const line = i + 2;
    const result = importRowSchema.safeParse(raw);
    if (!result.success) {
      for (const issue of result.error.issues) {
        errors.push({ row: line, field: issue.path[0]?.toString(), message: issue.message });
      }
      return;
    }
    const key = `${result.data.campaign.toLowerCase()}|${result.data.platform}|${result.data.date}`;
    const dup = seen.get(key);
    if (dup) {
      errors.push({ row: line, message: `duplicate of row ${dup} (same campaign, platform and date)` });
      return;
    }
    seen.set(key, line);
    rows.push(result.data);
  });

  for (const e of parsed.errors) {
    errors.push({ row: (e.row ?? 0) + 2, message: `CSV format: ${e.message}` });
  }

  return { rows, errors, totalRows: data.length, missingColumns };
}

export const SAMPLE_IMPORT_CSV = `date,campaign,platform,impressions,clicks,spend,conversions,revenue,engagements,leads
2026-11-01,Example Retail Campaign,facebook,8200,118,139.20,5,2400,260,6
2026-11-02,Example Retail Campaign,facebook,7900,104,121.75,4,,231,4
2026-11-01,Example LinkedIn Campaign,linkedin,3100,22,141.60,2,,58,3
`;
