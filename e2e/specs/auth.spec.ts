import { test, expect } from "@playwright/test";

test.describe("auth page", () => {
  test("loads sign-in route", async ({ page }) => {
    const response = await page.goto("/auth/signin");
    expect(response?.ok()).toBeTruthy();
    await expect(page).toHaveURL(/\/auth\/signin/);
    await expect(page.locator("body")).toBeVisible();
  });
});
