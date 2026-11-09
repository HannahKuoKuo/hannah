import { expect, test } from "@playwright/test";

const GOOD = `date,campaign,platform,impressions,clicks,spend,conversions,revenue,engagements,leads
2026-11-07,E2E Imported Campaign,facebook,5000,80,120.50,4,1500,90,5
2026-11-08,E2E Imported Campaign,facebook,5200,85,126.00,3,,95,4
`;
const BAD = `date,campaign,platform,impressions,clicks,spend
2026-11-07,Bad,facebook,100,500,10
not-a-date,Bad,facebook,100,5,10
`;

test("CSV import validates, imports, reports and can be undone", async ({ page }) => {
  await page.goto("/analytics");
  const input = page.getByLabel("CSV file");

  await input.setInputFiles({ name: "bad.csv", mimeType: "text/csv", buffer: Buffer.from(BAD) });
  await expect(page.getByText("0 of 2 rows valid")).toBeVisible();
  await expect(page.getByText("clicks cannot exceed impressions")).toBeVisible();
  await expect(page.getByRole("button", { name: /Import 0 rows/ })).toBeDisabled();
  await page.getByRole("button", { name: "Cancel" }).click();

  await input.setInputFiles({ name: "good.csv", mimeType: "text/csv", buffer: Buffer.from(GOOD) });
  await expect(page.getByText("2 of 2 rows valid")).toBeVisible();
  await expect(page.getByText(/E2E Imported Campaign · Facebook · 2 rows · new/)).toBeVisible();
  await page.getByRole("button", { name: "Import 2 rows" }).click();
  await expect(page.getByText(/Imported 2 rows/)).toBeVisible();
  await expect(page.getByText("good.csv")).toBeVisible();

  await page.goto("/?range=7d&source=real");
  await expect(page.getByText("Includes demo data.")).toHaveCount(0);
  await expect(page.getByLabel("Key metrics").getByText("$247", { exact: true })).toBeVisible(); // $120.50 + $126.00, rounded
  await expect(page.getByRole("link", { name: "E2E Imported Campaign" })).toBeVisible();

  await page.goto("/analytics");
  await page.getByRole("button", { name: "Undo import good.csv" }).click();
  await page.getByRole("dialog").getByRole("button", { name: "Undo import" }).click();
  await expect(page.getByText("No imports yet.")).toBeVisible();
});
