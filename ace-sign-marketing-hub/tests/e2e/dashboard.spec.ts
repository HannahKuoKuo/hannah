import { expect, test } from "@playwright/test";

test("dashboard shows labelled demo KPIs and filters by range", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "Dashboard" })).toBeVisible();
  await expect(page.getByText("Includes demo data.")).toBeVisible();
  await expect(page.getByText("Ad spend")).toBeVisible();
  await expect(page.getByText(/Showing 10 Oct 2026 – 8 Nov 2026/)).toBeVisible();

  await page.getByRole("button", { name: "7 days" }).click();
  await expect(page).toHaveURL(/range=7d/);
  await expect(page.getByText(/Showing 2 Nov 2026 – 8 Nov 2026/)).toBeVisible();
  await expect(page.getByText("vs prior 7 days").first()).toBeVisible();

  await page.getByRole("combobox", { name: "Platform" }).selectOption("linkedin");
  await expect(page).toHaveURL(/platform=linkedin/);
  await expect(page.getByRole("link", { name: "Corporate Wayfinding – Facility Managers" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Shopfront Signage – Spring Retail Push" })).toHaveCount(0);
});

test("custom date range and empty state", async ({ page }) => {
  await page.goto("/?range=custom&from=2026-11-01&to=2026-11-03");
  await expect(page.getByText(/Showing 1 Nov 2026 – 3 Nov 2026/)).toBeVisible();
  await page.goto("/?source=real");
  await expect(page.getByText("No data for these filters")).toBeVisible();
});

test("CSV report download is labelled as demo", async ({ request }) => {
  const res = await request.get("/api/reports/performance?range=7d&type=campaigns");
  expect(res.status()).toBe(200);
  expect(res.headers()["content-disposition"]).toContain("INCLUDES-DEMO-DATA");
  const body = await res.text();
  expect(body).toContain("data_source");
  expect(body).toContain("TOTAL");
});
