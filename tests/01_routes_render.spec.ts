import { test, expect } from "@playwright/test";
import { smokeConfig, PageAssertion } from "./smoke.config";

test.describe("Routes Render", () => {
  // Test each route from the config
  for (const route of smokeConfig.routesToCheck) {
    test(`should render route: ${route}`, async ({ page }) => {
      // Navigate to the route
      await page.goto(route);

      // Get assertions for this route
      const assertions = smokeConfig.pageAssertions.filter(
        (assertion: PageAssertion) => assertion.route === route,
      );

      // Verify each assertion for this route
      for (const assertion of assertions) {
        switch (assertion.type) {
          case "testid":
            await expect(page.getByTestId(assertion.locator)).toBeVisible();
            break;
          case "roleHeading":
            await expect(
              page.getByRole("heading", { name: assertion.locator }),
            ).toBeVisible();
            break;
          case "text":
            await expect(page.getByText(assertion.locator)).toBeVisible();
            break;
        }
      }
    });
  }

  test("should handle 404 for non-existent routes", async ({ page }) => {
    const response = await page.goto("/non-existent-route");

    // Express.js may return 200 for unknown routes if there's a wildcard handler,
    // or it may return 404. We accept both but ensure the page doesn't crash
    expect(response?.status()).toBeLessThan(500);

    // Verify the page has some content (not completely broken)
    const body = page.locator("body");
    await expect(body).toBeVisible();
  });
});
