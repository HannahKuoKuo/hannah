import { expect, test } from "@playwright/test";

test("mobile navigation works without horizontal scroll", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Open navigation" }).click();
  await page.getByRole("dialog").getByRole("link", { name: "Content Planner" }).click();
  await expect(page.getByRole("heading", { name: "Content Planner" })).toBeVisible();
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
  expect(overflow).toBeLessThanOrEqual(1);
});
