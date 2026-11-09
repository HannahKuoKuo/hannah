import { PermissionError } from "../session";

export type ActionResult<T = undefined> =
  | { ok: true; data?: T; message?: string }
  | { ok: false; error: string; fieldErrors?: Record<string, string[] | undefined> };

/** Convert thrown errors into a user-safe result without leaking internals. */
export function failure(err: unknown, fallback = "Something went wrong. Please try again."): ActionResult<never> {
  if (err instanceof PermissionError) return { ok: false, error: err.message };
  console.error("action failed:", err instanceof Error ? err.name : "unknown");
  return { ok: false, error: fallback };
}
