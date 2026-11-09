/** Business time zone used for scheduling and display. */
export const BUSINESS_TZ = "Australia/Sydney";

export function formatDateTime(iso: string, opts: Intl.DateTimeFormatOptions = { weekday: "short", day: "numeric", month: "short", hour: "numeric", minute: "2-digit" }) {
  return new Date(iso).toLocaleString("en-AU", { ...opts, timeZone: BUSINESS_TZ });
}

/** yyyy-mm-dd of an instant in the business time zone. */
export function businessDay(iso: string | Date): string {
  const parts = new Intl.DateTimeFormat("en-CA", { timeZone: BUSINESS_TZ, year: "numeric", month: "2-digit", day: "2-digit" }).formatToParts(
    typeof iso === "string" ? new Date(iso) : iso,
  );
  const get = (t: string) => parts.find((p) => p.type === t)!.value;
  return `${get("year")}-${get("month")}-${get("day")}`;
}

/** Offset in minutes of the business time zone at a given instant (e.g. +660 for AEDT). */
function tzOffsetMinutes(at: Date): number {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: BUSINESS_TZ,
    hourCycle: "h23",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  }).formatToParts(at);
  const get = (t: string) => Number(parts.find((p) => p.type === t)!.value);
  const asUtc = Date.UTC(get("year"), get("month") - 1, get("day"), get("hour"), get("minute"), get("second"));
  return Math.round((asUtc - at.getTime()) / 60000);
}

/** Convert a wall-clock "yyyy-mm-ddThh:mm" in the business time zone to a UTC Date. */
export function fromBusinessLocal(local: string): Date {
  const naive = new Date(`${local}:00Z`);
  const offset = tzOffsetMinutes(new Date(naive.getTime() - tzOffsetMinutes(naive) * 60000));
  return new Date(naive.getTime() - offset * 60000);
}

/** Convert a UTC instant to "yyyy-mm-ddThh:mm" wall-clock in the business time zone (for datetime-local inputs). */
export function toBusinessLocal(iso: string): string {
  const d = new Date(iso);
  const shifted = new Date(d.getTime() + tzOffsetMinutes(d) * 60000);
  return shifted.toISOString().slice(0, 16);
}
