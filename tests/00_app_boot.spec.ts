import { test, expect } from "@playwright/test";
import { smokeConfig } from "./smoke.config";

test.describe("App Boot", () => {
  test("should load the application and show app shell", async ({ page }) => {
    // Navigate to the base URL
    await page.goto("/");

    // Wait for the app shell to be visible
    await expect(page.getByTestId("app-shell")).toBeVisible();

    // Verify page title
    await expect(page).toHaveTitle(/Flexion.*Flow.*Intake Form/);

    // Verify main logo is visible (specific to header logo)
    await expect(page.locator(".logo-large")).toBeVisible();

    // Verify the page loads within reasonable time
    const startTime = Date.now();
    await page.waitForLoadState("domcontentloaded");
    const loadTime = Date.now() - startTime;
    expect(loadTime).toBeLessThan(5000); // 5 second timeout
  });

  test("should respond to health check endpoint", async ({ request }) => {
    const response = await request.get("/__version");
    expect(response.status()).toBe(200);

    const data = await response.json();
    expect(data).toHaveProperty("time");
  });
});
