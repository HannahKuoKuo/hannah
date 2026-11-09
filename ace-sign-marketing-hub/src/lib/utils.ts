import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const aud = new Intl.NumberFormat("en-AU", { style: "currency", currency: "AUD", maximumFractionDigits: 0 });
const aud2 = new Intl.NumberFormat("en-AU", { style: "currency", currency: "AUD", minimumFractionDigits: 2 });
const compact = new Intl.NumberFormat("en-AU", { notation: "compact", maximumFractionDigits: 1 });
const whole = new Intl.NumberFormat("en-AU");

export const formatCurrency = (n: number) => aud.format(n);
export const formatCurrencyPrecise = (n: number) => aud2.format(n);
export const formatCompact = (n: number) => compact.format(n);
export const formatNumber = (n: number) => whole.format(n);
export const formatPercent = (n: number, digits = 2) => `${(n * 100).toFixed(digits)}%`;

/** Safe ratio helpers - return null when the denominator is zero so the UI can show "—". */
export function ratio(numerator: number, denominator: number): number | null {
  return denominator > 0 ? numerator / denominator : null;
}

export function percentChange(current: number, previous: number): number | null {
  return previous > 0 ? (current - previous) / previous : null;
}
