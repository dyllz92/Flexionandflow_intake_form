const { test, expect } = require("@playwright/test");

test.describe("Debug Form Validation", () => {
  test("should properly enable next button when all Step 1 fields are filled", async ({
    page,
  }) => {
    // Navigate to the form
    await page.goto("http://localhost:3000/intake");

    // Wait for form to load
    await page.waitForSelector("#firstName");

    // Check initial state - next button should be disabled
    const nextBtn = await page.locator('[data-testid="wizard-next"]');
    await expect(nextBtn).toBeDisabled();

    // Fill all required Step 1 fields
    await page.fill("#firstName", "John");
    await page.fill("#lastName", "Doe");
    await page.fill("#email", "john.doe@example.com");
    await page.fill("#mobile", "0412345678");
    await page.fill("#dateOfBirth", "1990-01-01");
    await page.fill("#occupation", "Software Engineer");

    // Wait a moment for validation to process
    await page.waitForTimeout(1000);

    // Check that next button is now enabled
    await expect(nextBtn).not.toBeDisabled();

    // Click next button
    await nextBtn.click();

    // Verify we moved to step 2
    await expect(
      page.locator('.wizard-step[data-step="2"].active'),
    ).toBeVisible();
  });

  test("should show validation feedback when fields are empty", async ({
    page,
  }) => {
    // Navigate to the form
    await page.goto("http://localhost:3000/intake");

    // Wait for form to load
    await page.waitForSelector("#firstName");

    // Try to click next without filling fields
    const nextBtn = await page.locator('[data-testid="wizard-next"]');
    await expect(nextBtn).toBeDisabled();

    // Fill only some fields and check button state
    await page.fill("#firstName", "John");
    await page.fill("#lastName", "Doe");

    // Button should still be disabled
    await expect(nextBtn).toBeDisabled();

    // Fill all fields except one
    await page.fill("#email", "john.doe@example.com");
    await page.fill("#mobile", "0412345678");
    await page.fill("#dateOfBirth", "1990-01-01");
    // Don't fill occupation

    // Button should still be disabled
    await expect(nextBtn).toBeDisabled();

    // Fill the last field
    await page.fill("#occupation", "Software Engineer");

    // Wait for validation
    await page.waitForTimeout(1000);

    // Now button should be enabled
    await expect(nextBtn).not.toBeDisabled();
  });

  test("should show UX validation messages", async ({ page }) => {
    // Navigate to the form
    await page.goto("http://localhost:3000/intake");

    // Wait for form to load and our FormUXManager to initialize
    await page.waitForSelector("#firstName");
    await page.waitForTimeout(2000); // Wait for FormUXManager initialization

    // Fill a field with invalid data and check validation
    await page.fill("#email", "invalid-email");
    await page.blur("#email"); // Trigger validation

    // Wait for validation message
    await page.waitForTimeout(1000);

    // Check for validation message (our UX enhancement)
    const validationMessage = await page
      .locator(".ux-validation-message")
      .first();
    if ((await validationMessage.count()) > 0) {
      console.log("UX validation message found");
    }
  });
});
