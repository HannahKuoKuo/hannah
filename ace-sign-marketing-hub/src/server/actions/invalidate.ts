import { refresh, revalidatePath } from "next/cache";

/**
 * Called after every successful mutation. A change to one record can affect the
 * dashboard, lists and reports, so purge the whole client cache (revalidatePath)
 * and re-render the page the user is on (refresh).
 */
export function invalidateAll() {
  revalidatePath("/", "layout");
  refresh();
}
