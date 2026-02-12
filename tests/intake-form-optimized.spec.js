const { test, expect } = require("@playwright/test");

test.describe("Intake Form - Optimized", () => {
  test.beforeEach(async ({ page }) => {
    // Set a reasonable timeout for each test
    test.setTimeout(15000);

    await page.goto("/intake");
    // Wait for form to be fully loaded
    await page.waitForSelector("#wizardForm");
  });

  // Helper function to fill Step 1 efficiently
  const fillStep1 = async (page) => {
    // Fill all Step 1 fields at once using evaluate for maximum speed
    await page.evaluate(() => {
      const fields = {
        firstName: "Jane",
        lastName: "Doe",
        email: "jane.doe@example.com",
        phone: "0412345678",
        dateOfBirth: "1990-01-01",
        occupation: "Designer",
      };

      Object.entries(fields).forEach(([fieldId, value]) => {
        const el = document.getElementById(fieldId);
        if (el) {
          el.value = value;
          el.dispatchEvent(new Event("input", { bubbles: true }));
          el.dispatchEvent(new Event("change", { bubbles: true }));
        }
      });
    });

    // Select gender button
    await page.click('.gender-btn[data-value="Female"]');

    // Dismiss any date picker interference immediately
    await page.keyboard.press("Escape");

    // Wait for next button to be enabled (much faster than arbitrary timeout)
    await page.waitForFunction(
      () => {
        const nextBtn = document.getElementById("nextBtn");
        return nextBtn && !nextBtn.disabled;
      },
      { timeout: 3000 },
    );
  };

  test("should complete entire intake form flow efficiently", async ({
    page,
  }) => {
    // Step 1: Personal Information
    await fillStep1(page);
    await page.click("#nextBtn");
    await page.waitForSelector('.wizard-step[data-step="2"].active');

    // Step 2: Visit Information - batch operations for speed
    await page.click('.visit-btn[data-value="Relieve stress"]');
    await page.click('.referral-btn[data-value="Word of mouth"]');

    // Set slider values efficiently using evaluate
    await page.evaluate(() => {
      const sleepSlider = document.getElementById("sleepQuality");
      const stressSlider = document.getElementById("stressLevel");

      if (sleepSlider) {
        sleepSlider.value = "8";
        sleepSlider.dispatchEvent(new Event("input", { bubbles: true }));
      }
      if (stressSlider) {
        stressSlider.value = "4";
        stressSlider.dispatchEvent(new Event("input", { bubbles: true }));
      }
    });

    await page.click('.exercise-btn[data-value="1-3 days per week"]');
    await page.click('.toggle-btn[data-value="No"]'); // No previous massage

    // Wait for validation to complete
    await page.waitForFunction(
      () => {
        const nextBtn = document.getElementById("nextBtn");
        return nextBtn && !nextBtn.disabled;
      },
      { timeout: 2000 },
    );

    await page.click("#nextBtn");
    await page.waitForSelector('.wizard-step[data-step="3"].active');

    // Step 3: Health History - batch click operations
    await page.click(
      '.toggle-btn[data-name="takingMedications"][data-value="No"]',
    );
    await page.click('.toggle-btn[data-name="hasAllergies"][data-value="No"]');
    await page.click('.condition-btn[data-value="None of the above"]');
    await page.click('.pregnancy-btn[data-value="Not applicable"]');

    await page.waitForFunction(
      () => {
        const nextBtn = document.getElementById("nextBtn");
        return nextBtn && !nextBtn.disabled;
      },
      { timeout: 2000 },
    );

    await page.click("#nextBtn");
    await page.waitForSelector('.wizard-step[data-step="4"].active');

    // Step 4: Pain Assessment (skip - optional step)
    await page.click("#nextBtn");
    await page.waitForSelector('.wizard-step[data-step="5"].active');

    // Step 5: Consent & Signature
    await page.check("#consentAll");
    await page.check("#medicalCareDisclaimer");

    // Draw simple signature efficiently
    const canvas = page.locator("#signatureCanvas");
    const box = await canvas.boundingBox();
    if (box) {
      await page.mouse.move(box.x + 20, box.y + 30);
      await page.mouse.down();
      await page.mouse.move(box.x + 100, box.y + 30);
      await page.mouse.up();
    }

    // Verify submit button is enabled - final validation
    await expect(page.locator("#submitBtn")).toBeEnabled();
  });

  test("should validate required fields on Step 1", async ({ page }) => {
    // Initially next button should be disabled
    const nextBtn = page.locator("#nextBtn");
    await expect(nextBtn).toBeDisabled();

    // Fill partial info - should still be disabled
    await page.evaluate(() => {
      document.getElementById("firstName").value = "Test";
      document.getElementById("lastName").value = "User";
    });

    await expect(nextBtn).toBeDisabled();

    // Fill all required fields
    await fillStep1(page);

    // Now button should be enabled
    await expect(nextBtn).toBeEnabled();
  });

  test("should navigate successfully from Step 1 to Step 2", async ({
    page,
  }) => {
    await fillStep1(page);

    await page.click("#nextBtn");
    await page.waitForSelector('.wizard-step[data-step="2"].active', {
      timeout: 3000,
    });

    // Verify we successfully navigated to Step 2
    const step2Active = await page
      .locator('.wizard-step[data-step="2"].active')
      .isVisible();
    expect(step2Active).toBe(true);

    // Verify Step 1 is no longer active
    const step1Active = await page
      .locator('.wizard-step[data-step="1"].active')
      .isVisible();
    expect(step1Active).toBe(false);
  });

  test("should handle date picker interference correctly", async ({ page }) => {
    // Fill fields that might trigger date picker
    await page.fill("#firstName", "Test");
    await page.fill("#lastName", "User");
    await page.fill("#email", "test@example.com");
    await page.fill("#phone", "0412345678");

    // Click date field which might open picker
    await page.click("#dateOfBirth");
    await page.fill("#dateOfBirth", "1990-01-01");

    // Dismiss any date picker interference
    await page.keyboard.press("Escape");

    // Fill remaining fields
    await page.fill("#occupation", "Tester");
    await page.click('.gender-btn[data-value="Male"]');

    // Should be able to navigate despite date picker
    await page.waitForFunction(() => {
      const nextBtn = document.getElementById("nextBtn");
      return nextBtn && !nextBtn.disabled;
    });

    await page.click("#nextBtn");
    await page.waitForSelector('.wizard-step[data-step="2"].active');

    const step2Active = await page
      .locator('.wizard-step[data-step="2"].active')
      .isVisible();
    expect(step2Active).toBe(true);
  });
});
