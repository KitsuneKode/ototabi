import { test, expect } from "@playwright/test";

test.describe("studio path", () => {
  test("dashboard route loads for host shell", async ({ page }) => {
    const response = await page.goto("/dashboard");
    expect(response?.status()).toBeLessThan(500);
    await expect(page.locator("body")).toBeVisible();
  });
});
