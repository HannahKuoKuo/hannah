import { expect, test } from "@playwright/test";

test("create a post and move it through approval", async ({ page }) => {
  await page.goto("/content-planner?month=2026-12");
  await expect(page.getByRole("heading", { name: "December 2026" })).toBeVisible();
  await page.getByRole("button", { name: "New post" }).click();
  const dialog = page.getByRole("dialog");
  await dialog.getByRole("button", { name: "Create draft" }).click();
  await expect(dialog.getByText("Title is required")).toBeVisible();

  await dialog.getByLabel("Title (internal)").fill("E2E holiday post");
  await dialog.getByLabel("Scheduled for").fill("2026-12-15T10:30");
  await dialog.getByLabel("Post copy").fill("Season's greetings from the team.");
  await dialog.getByRole("button", { name: "Create draft" }).click();
  await expect(dialog).toBeHidden();

  await page.getByRole("button", { name: /E2E holiday post/ }).click();
  await page.getByRole("dialog").getByRole("button", { name: "Submit for review" }).click();
  await expect(page.getByRole("dialog")).toBeHidden();

  await page.getByRole("button", { name: /E2E holiday post/ }).first().click();
  const review = page.getByRole("dialog");
  await review.getByRole("button", { name: "Request changes" }).click();
  await expect(review.getByText("Add a note explaining the requested changes.")).toBeVisible();
  await review.getByRole("button", { name: "Approve" }).click();
  await expect(review).toBeHidden();

  await page.getByRole("button", { name: "List" }).click();
  await expect(page.getByRole("button", { name: /E2E holiday post/ })).toContainText("Approved");
  await expect(page.getByRole("button", { name: /E2E holiday post/ })).toContainText("10:30");

  await page.getByRole("button", { name: /E2E holiday post/ }).click();
  page.once("dialog", (d) => d.accept());
  await page.getByRole("dialog").getByRole("button", { name: "Delete" }).click();
  await expect(page.getByText("No posts this month")).toBeVisible();
});
