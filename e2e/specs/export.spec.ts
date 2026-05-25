import { test, expect } from "@playwright/test";

test.describe("export route", () => {
  test("export page shell responds without server error", async ({ page }) => {
    const response = await page.goto("/export/e2e-smoke-placeholder");
    expect(response?.status()).toBeLessThan(500);
    await expect(page.locator("body")).toBeVisible();
  });
});
