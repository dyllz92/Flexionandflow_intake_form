const { test, expect } = require("@playwright/test");

test.describe("Step 2 Navigation - Debug & Validation", () => {
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
          el.dispatchEvent(new Event("change", { bubbles: true }));
        }
      });
    });

    // Select gender
    await page.click('label:has-text("Male")');

    // Navigate to Step 2
    await page.waitForFunction(() => {
      const nextBtn = document.getElementById("nextBtn");
      return nextBtn && !nextBtn.disabled;
    });
    await page.click("#nextBtn");
    await page.waitForSelector('[data-step="2"].active');
  });

  test("should show validation errors when fields are missing", async ({
    page,
  }) => {
    // Try to click Next without filling required fields (force click on disabled button)
    await page.click("#nextBtn", { force: true });

    // Check if validation message appears
    await page.waitForTimeout(1000); // Give time for validation to run
    const validationMessage = await page
      .locator("#stepValidationMessage")
      .textContent();
    console.log("Validation message:", validationMessage);

    expect(validationMessage).toBeTruthy();
    expect(validationMessage).toContain("Please select");
  });

  test("should successfully navigate when all fields are filled", async ({
    page,
  }) => {
    // Fill all required Step 2 fields systematically

    // 1. Visit Reason - click directly on button
    await page.click('button:has-text("Pain / Tension relief")');
    await page.waitForTimeout(500);

    // 2. Referral Source
    await page.click('button:has-text("Google")');
    await page.waitForTimeout(500);

    // 3. Sleep Quality - set slider value
    await page.evaluate(() => {
      const slider = document.getElementById("sleepQuality");
      if (slider) {
        slider.value = "8";
        slider.dispatchEvent(new Event("input", { bubbles: true }));
        slider.dispatchEvent(new Event("change", { bubbles: true }));
      }
    });

    // 4. Stress Level - set slider value
    await page.evaluate(() => {
      const slider = document.getElementById("stressLevel");
      if (slider) {
        slider.value = "4";
        slider.dispatchEvent(new Event("input", { bubbles: true }));
        slider.dispatchEvent(new Event("change", { bubbles: true }));
      }
    });

    // 5. Exercise Frequency
    await page.click('button:has-text("1-3 days per week")');
    await page.waitForTimeout(500);

    // 6. Previous Massage Experience
    await page.click('button:has-text("No")');
    await page.waitForTimeout(500);

    // Check that Next button becomes enabled
    await page.waitForFunction(
      () => {
        const nextBtn = document.getElementById("nextBtn");
        return nextBtn && !nextBtn.disabled;
      },
      { timeout: 10000 },
    );

    // Click Next and verify navigation to Step 3
    await page.click("#nextBtn");
    await page.waitForSelector('[data-step="3"].active', { timeout: 8000 });

    const step3Visible = await page.isVisible('[data-step="3"].active');
    expect(step3Visible).toBe(true);
  });

  test("should show specific error messages for each missing field", async ({
    page,
  }) => {
    // Test each field validation individually

    // Fill all but visit reason
    await page.click('button:has-text("Google")'); // referral
    await page.evaluate(() => {
      document.getElementById("sleepQuality").value = "8";
      document
        .getElementById("sleepQuality")
        .dispatchEvent(new Event("input", { bubbles: true }));
      document.getElementById("stressLevel").value = "4";
      document
        .getElementById("stressLevel")
        .dispatchEvent(new Event("input", { bubbles: true }));
    });
    await page.click('button:has-text("1-3 days per week")'); // exercise
    await page.click('button:has-text("No")'); // massage

    await page.click("#nextBtn");
    const visitReasonError = await page
      .locator("#stepValidationMessage")
      .textContent();
    expect(visitReasonError).toContain("reason for your visit");

    // Now add visit reason but remove referral source
    await page.click('button:has-text("Pain / Tension relief")');
    // Remove referral selection by clicking another button if needed
    await page.evaluate(() => {
      document
        .querySelectorAll('input[name="referralSource"]')
        .forEach((input) => {
          input.checked = false;
        });
    });

    await page.click("#nextBtn");
    const referralError = await page
      .locator("#stepValidationMessage")
      .textContent();
    expect(referralError).toContain("how you heard about us");
  });
});
