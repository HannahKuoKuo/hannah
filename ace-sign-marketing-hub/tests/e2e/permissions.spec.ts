import { expect, test } from "@playwright/test";

test("role switch changes what the user can do", async ({ page }) => {
  await page.goto("/settings");
  await expect(page.getByText("Disabled").first()).toBeVisible();
  await page.getByLabel("Act as").selectOption({ label: "Demo Viewer (viewer)" });
  await expect(page.getByText(/Now acting as Demo Viewer/)).toBeVisible();

  await page.goto("/campaigns/cmp_wayfinding");
  await expect(page.getByRole("button", { name: "Publish…" })).toHaveCount(0);
  await page.goto("/analytics");
  await expect(page.getByText("Your role cannot import data.")).toBeVisible();

  await page.goto("/settings");
  await page.getByLabel("Act as").selectOption({ label: "Demo Manager (manager)" });
  await expect(page.getByText(/Now acting as Demo Manager/)).toBeVisible();
  await expect(page.getByText("report.export").first()).toBeVisible();
});
