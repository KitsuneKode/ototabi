import { test, expect } from "@playwright/test";

test.describe("auth page", () => {
  test("loads sign-in route", async ({ page }) => {
    const response = await page.goto("/auth");
    expect(response?.ok()).toBeTruthy();
    await expect(page).toHaveURL(/\/auth/);
    await expect(page.locator("body")).toBeVisible();
  });
});
