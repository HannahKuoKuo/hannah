/** Date-range handling shared by the dashboard, analytics and report exports. All dates are UTC yyyy-mm-dd. */

export const RANGE_PRESETS = ["7d", "30d", "90d", "custom"] as const;
export type RangePreset = (typeof RANGE_PRESETS)[number];

export interface DateRange {
  from: string;
  to: string;
  preset: RangePreset;
  days: number;
  previous: { from: string; to: string };
}

const ISO_DAY = /^\d{4}-\d{2}-\d{2}$/;
const DAY_MS = 86_400_000;

export function isIsoDay(s: unknown): s is string {
  if (typeof s !== "string" || !ISO_DAY.test(s)) return false;
  const d = new Date(`${s}T00:00:00Z`);
  return !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === s;
}

export function addDays(iso: string, n: number): string {
  return new Date(new Date(`${iso}T00:00:00Z`).getTime() + n * DAY_MS).toISOString().slice(0, 10);
}

export function daysBetweenInclusive(from: string, to: string): number {
  return Math.round((new Date(`${to}T00:00:00Z`).getTime() - new Date(`${from}T00:00:00Z`).getTime()) / DAY_MS) + 1;
}

/**
 * Resolve a range from URL params. Presets end at `anchor` (the latest day with data),
 * so demo data stays visible even when it is older than today.
 */
export function resolveRange(params: { range?: string; from?: string; to?: string }, anchor: string): DateRange {
  let preset: RangePreset = RANGE_PRESETS.includes(params.range as RangePreset) ? (params.range as RangePreset) : "30d";
  let from: string;
  let to: string;

  if (preset === "custom" && isIsoDay(params.from) && isIsoDay(params.to)) {
    [from, to] = params.from <= params.to ? [params.from, params.to] : [params.to, params.from];
    // cap custom ranges at two years to keep queries bounded
    if (daysBetweenInclusive(from, to) > 731) from = addDays(to, -730);
  } else {
    if (preset === "custom") preset = "30d";
    const days = Number.parseInt(preset, 10);
    to = anchor;
    from = addDays(anchor, -(days - 1));
  }

  const days = daysBetweenInclusive(from, to);
  const prevTo = addDays(from, -1);
  return { from, to, preset, days, previous: { from: addDays(prevTo, -(days - 1)), to: prevTo } };
}

export function formatDay(iso: string, opts: Intl.DateTimeFormatOptions = { day: "numeric", month: "short", year: "numeric" }) {
  return new Date(`${iso}T00:00:00Z`).toLocaleDateString("en-AU", { ...opts, timeZone: "UTC" });
}
