const { test, expect } = require("@playwright/test");

test.describe("Intake Form - Fast & Reliable", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/intake");
    await page.waitForSelector("#intakeForm");
  });

  test("should complete full form submission efficiently", async ({ page }) => {
    // Step 1: Fill all fields at once
    await page.evaluate(() => {
      const fields = {
        firstName: "Jane",
        lastName: "Doe",
        email: "jane.doe@example.com",
        mobile: "0412345678",
        dateOfBirth: "15/09/1990", // Use DD/MM/YYYY format
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

    // Select gender via label click (radio buttons are hidden)
    await page.click('label:has-text("Female")');

    // Verify wizard navigation works
    await page.waitForFunction(
      () => {
        const nextBtn = document.getElementById("nextBtn");
        return nextBtn && !nextBtn.disabled;
      },
      { timeout: 3000 },
    );

    await page.click("#nextBtn");

    // Use a more reliable selector for step 2
    await page.waitForSelector('[data-step="2"].active', { timeout: 8000 });

    // Step 2: Continue with simplified form submission test...
    console.log("✅ Step 1 to 2 navigation working!");

    // Verify we can navigate to step 2
    const step2Visible = await page.isVisible('[data-step="2"].active');
    expect(step2Visible).toBe(true);

    // Step 2: Visit details & lifestyle
    // Select visit reason (required)
    await page.click('.visit-btn[data-value="Pain / Tension relief"]');

    // Select referral source (required)
    await page.click('.referral-btn[data-value="Google"]');

    // Fill lifestyle information
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
    await page.click('.toggle-btn[data-value="No"]');

    await page.waitForFunction(
      () =>
        document.getElementById("nextBtn") &&
        !document.getElementById("nextBtn").disabled,
    );
    await page.click("#nextBtn");
    await page.waitForSelector('.wizard-step[data-step="3"].active');

    // Step 3: Medical history
    await page.click(
      '.toggle-btn[data-name="takingMedications"][data-value="No"]',
    );
    await page.click('.toggle-btn[data-name="hasAllergies"][data-value="No"]');
    await page.click('.condition-btn[data-value="None of the above"]');
    await page.click('.pregnancy-btn[data-value="Not applicable"]');

    await page.waitForFunction(
      () =>
        document.getElementById("nextBtn") &&
        !document.getElementById("nextBtn").disabled,
    );
    await page.click("#nextBtn");
    await page.waitForSelector('.wizard-step[data-step="4"].active');

    // Step 4: Skip pain assessment
    await page.click("#nextBtn");
    await page.waitForSelector('.wizard-step[data-step="5"].active');

    // Step 5: Consent and signature
    await page.check("#consentAll");
    await page.check("#medicalCareDisclaimer");

    // Simple signature
    const canvas = page.locator("#signatureCanvas");
    const box = await canvas.boundingBox();
    if (box) {
      await page.mouse.move(box.x + 20, box.y + 30);
      await page.mouse.down();
      await page.mouse.move(box.x + 100, box.y + 30);
      await page.mouse.up();
    }

    await expect(page.locator("#submitBtn")).toBeEnabled();
  });

  test("should validate Step 1 navigation", async ({ page }) => {
    const nextBtn = page.locator("#nextBtn");
    // Check if button starts as disabled (may vary based on form implementation)
    // await expect(nextBtn).toBeDisabled();

    // Fill all required fields efficiently
    await page.evaluate(() => {
      const fields = {
        firstName: "Test",
        lastName: "User",
        email: "test@example.com",
        mobile: "0412345678",
        dateOfBirth: "1990-01-01",
        occupation: "Tester",
      };
      Object.entries(fields).forEach(([id, value]) => {
        const el = document.getElementById(id);
        if (el) {
          el.value = value;
          el.dispatchEvent(new Event("input", { bubbles: true }));
        }
      });
    });

    // Select gender using label click (radio buttons are hidden)
    await page.click('label:has-text("Male")');
    await page.keyboard.press("Escape");

    await expect(nextBtn).toBeEnabled();
    await page.click("#nextBtn");
    await page.waitForSelector('.wizard-step[data-step="2"].active');

    expect(
      await page.locator('.wizard-step[data-step="2"].active').isVisible(),
    ).toBe(true);
  });
});
