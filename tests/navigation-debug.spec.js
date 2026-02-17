const { test, expect } = require("@playwright/test");

test.describe("Simple Navigation Debug", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/intake");
    await page.waitForSelector("#intakeForm");
  });

  test("should navigate from Step 1 to Step 2", async ({ page }) => {
    // Listen for console messages and errors
    page.on("console", (msg) => console.log("BROWSER LOG:", msg.text()));
    page.on("pageerror", (error) =>
      console.log("BROWSER ERROR:", error.message),
    );

    // Fill Step 1 fields
    await page.evaluate(() => {
      const fields = {
        firstName: "Jane",
        lastName: "Doe",
        email: "jane.doe@example.com",
        mobile: "0412345678",
        dateOfBirth: "15/09/1990",
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

    // Select gender by clicking label
    await page.click('label:has-text("Female")');

    // Wait for Next button to be enabled
    await page.waitForFunction(
      () => {
        const btn = document.getElementById("nextBtn");
        return btn && !btn.disabled;
      },
      { timeout: 5000 },
    );

    // Add debug logging before clicking Next
    await page.evaluate(() => {
      console.log("[TEST DEBUG] About to click Next button");
      console.log(
        "[TEST DEBUG] Current step:",
        window.wizard?.getCurrentStep?.(),
      );
      console.log(
        "[TEST DEBUG] Validation state:",
        window.wizard?.validateCurrentStep?.(),
      );

      // Check if wizard is initialized
      if (!window.wizard) {
        console.error("[TEST DEBUG] window.wizard not found!");
      }
    });

    // Click Next button
    await page.click("#nextBtn");

    // Give it a moment to process
    await page.waitForTimeout(1000);

    // Check what happened
    const debugInfo = await page.evaluate(() => {
      return {
        currentStep: window.wizard?.getCurrentStep?.(),
        step1Active: document.querySelector('[data-step="1"].active') !== null,
        step2Active: document.querySelector('[data-step="2"].active') !== null,
        wizardExists: !!window.wizard,
      };
    });

    console.log("DEBUG INFO:", debugInfo);

    // Wait for step 2 to become active
    await page.waitForSelector('[data-step="2"].active', { timeout: 6000 });

    // Verify step 2 is visible
    const isStep2Active = await page.isVisible('[data-step="2"].active');
    expect(isStep2Active).toBe(true);
  });
});
