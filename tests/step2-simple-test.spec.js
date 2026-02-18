const { test, expect } = require("@playwright/test");

test.describe("Step 2 Navigation - Simple Test", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/intake");
    await page.waitForSelector("#intakeForm");

    // Complete Step 1 first
    await page.evaluate(() => {
      const fields = {
        firstName: "Test",
        lastName: "User",
        email: "test@example.com",
        mobile: "0412345678",
        dateOfBirth: "15/09/1990",
        occupation: "Tester",
      };
      Object.entries(fields).forEach(([fieldId, value]) => {
        const el = document.getElementById(fieldId);
        if (el) {
          el.value = value;
          el.dispatchEvent(new Event("input", { bubbles: true }));
        }
      });
    });

    // Select gender
    await page.click('label:has-text("Male")');

    // Navigate to Step 2
    await page.waitForFunction(
      () => !document.getElementById("nextBtn").disabled,
    );
    await page.click("#nextBtn");
    await page.waitForSelector('[data-step="2"].active');
  });

  test("should enable Next button when all Step 2 fields are completed", async ({
    page,
  }) => {
    // Initially button should be disabled
    let isDisabled = await page.evaluate(
      () => document.getElementById("nextBtn").disabled,
    );
    expect(isDisabled).toBe(true);

    // Fill each field and check button state

    // 1. Visit Reason
    await page.click('button:has-text("Pain / Tension relief")');
    await page.waitForTimeout(500);

    // 2. Referral Source
    await page.click('button:has-text("Google")');
    await page.waitForTimeout(500);

    // 3. Sleep Quality
    await page.evaluate(() => {
      const slider = document.getElementById("sleepQuality");
      if (slider) {
        slider.value = "8";
        slider.dispatchEvent(new Event("input", { bubbles: true }));
        slider.dispatchEvent(new Event("change", { bubbles: true }));
      }
    });
    await page.waitForTimeout(500);

    // 4. Stress Level
    await page.evaluate(() => {
      const slider = document.getElementById("stressLevel");
      if (slider) {
        slider.value = "4";
        slider.dispatchEvent(new Event("input", { bubbles: true }));
        slider.dispatchEvent(new Event("change", { bubbles: true }));
      }
    });
    await page.waitForTimeout(500);

    // 5. Exercise Frequency
    await page.click('button:has-text("1-3 days per week")');
    await page.waitForTimeout(500);

    // 6. Previous Massage Experience
    await page.click('button:has-text("No")');
    await page.waitForTimeout(1000);

    // Check that button is now enabled
    isDisabled = await page.evaluate(
      () => document.getElementById("nextBtn").disabled,
    );
    expect(isDisabled).toBe(false);

    // Now try to navigate to Step 3
    await page.click("#nextBtn");
    await page.waitForSelector('[data-step="3"].active', { timeout: 8000 });

    const step3Visible = await page.isVisible('[data-step="3"].active');
    expect(step3Visible).toBe(true);

    console.log("✅ Step 2 to Step 3 navigation working!");
  });

  test("should show proper validation messages", async ({ page }) => {
    // Test the validation message functionality by triggering validation manually
    await page.evaluate(() => {
      // Manually trigger the showValidationErrors function
      if (window.wizard && window.wizard.validateCurrentStep) {
        const isValid = window.wizard.validateCurrentStep();
        console.log("Manual validation result:", isValid);
        if (!isValid) {
          // This should trigger the showValidationErrors function
          document.dispatchEvent(new Event("change"));
        }
      }
    });

    await page.waitForTimeout(1000);

    // Check if validation message exists
    const validationMessageExists = await page
      .locator("#stepValidationMessage")
      .isVisible();
    console.log("Validation message element exists:", validationMessageExists);

    // For now, just check that the validation structure is in place
    expect(validationMessageExists).toBe(true);
  });
});
