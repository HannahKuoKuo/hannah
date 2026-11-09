import { expect, test } from "@playwright/test";

test("create, edit, review and delete a campaign", async ({ page }) => {
  await page.goto("/campaigns");
  await page.getByRole("button", { name: "New campaign" }).click();
  const dialog = page.getByRole("dialog");
  await dialog.getByLabel("Campaign name").fill("x");
  await dialog.getByRole("button", { name: "Create campaign" }).click();
  await expect(dialog.getByText("Name must be at least 3 characters")).toBeVisible();

  await dialog.getByLabel("Campaign name").fill("E2E Test Campaign");
  await dialog.getByLabel("Platform").selectOption("LINKEDIN");
  await dialog.getByLabel("Budget (AUD)").fill("1200");
  await dialog.getByLabel("Start date").fill("2026-12-01");
  await dialog.getByLabel("End date").fill("2026-11-01");
  await dialog.getByRole("button", { name: "Create campaign" }).click();
  await expect(dialog.getByText("End date must be on or after the start date")).toBeVisible();
  await dialog.getByLabel("End date").fill("2026-12-31");
  await dialog.getByRole("button", { name: "Create campaign" }).click();

  await expect(page).toHaveURL(/\/campaigns\/[a-z0-9]+$/);
  await expect(page.getByRole("heading", { name: "E2E Test Campaign" })).toBeVisible();

  await page.getByLabel("Campaign name").fill("E2E Test Campaign (edited)");
  await page.getByRole("button", { name: "Save changes" }).click();
  await expect(page.getByRole("heading", { name: "E2E Test Campaign (edited)" })).toBeVisible();

  await page.getByRole("button", { name: "Delete" }).click();
  await page.getByRole("dialog").getByRole("button", { name: "Delete campaign" }).click();
  await expect(page).toHaveURL(/\/campaigns$/);
  // role queries skip the hidden, previously visited detail page that Next keeps mounted
  await expect(page.getByRole("link", { name: "E2E Test Campaign (edited)" })).toHaveCount(0);
});

test("ad variation approval and blocked publishing", async ({ page }) => {
  await page.goto("/campaigns/cmp_shopfront");
  await page.getByRole("button", { name: "Approve" }).click();
  await expect(page.getByText("Approved")).toHaveCount(2);
  await page.getByRole("button", { name: "Publish…" }).click();
  await page.getByRole("dialog").getByRole("button", { name: "Publish" }).click();
  await expect(page.getByText(/Publishing is disabled/)).toBeVisible();
});

test("Ad Launcher generates copy and saves a draft campaign", async ({ page }) => {
  await page.goto("/ad-launcher");
  await page.getByLabel("Variations").selectOption("2");
  await page.getByRole("button", { name: "Generate ad copy" }).click();
  await expect(page.getByText("2 variations")).toBeVisible();
  await expect(page.getByText("Template copy")).toBeVisible();
  await page.getByRole("button", { name: /Save 2 as draft campaign/ }).click();
  await page.getByRole("dialog").getByLabel("Campaign name").fill("E2E Launcher Draft");
  await page.getByRole("dialog").getByRole("button", { name: "Save draft" }).click();
  await expect(page.getByRole("heading", { name: "E2E Launcher Draft" })).toBeVisible();
  await expect(page.getByText("Ad variations (2)")).toBeVisible();
  await page.getByRole("button", { name: "Submit for review" }).first().click();
  await expect(page.getByText("In review").first()).toBeVisible();
});
