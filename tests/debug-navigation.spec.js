const { test, expect } = require("@playwright/test");

test.describe("Wizard Navigation Debug", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/intake");
    await page.waitForSelector("#intakeForm", { timeout: 10000 });
  });

  test("debug form step navigation", async ({ page }) => {
    // Fill required fields
    await page.fill("#firstName", "Jane");
    await page.fill("#lastName", "Doe");
    await page.fill("#email", "jane@example.com");
    await page.fill("#mobile", "0412345678");
    await page.fill("#dateOfBirth", "15/09/1990");
    await page.fill("#occupation", "Designer");

    // Click gender label (since radio buttons are hidden)
    await page.click('label:has-text("Female")');

    // Check if all required fields are filled
    const validationResult = await page.evaluate(() => {
      const requiredFields = [
        "firstName",
        "lastName",
        "email",
        "mobile",
        "dateOfBirth",
        "occupation",
      ];
      const results = {};

      requiredFields.forEach((fieldId) => {
        const field = document.getElementById(fieldId);
        results[fieldId] = field ? field.value : "NOT FOUND";
      });

      const genderSelected = document.querySelector(
        'input[name="gender"]:checked',
      );
      results.gender = genderSelected ? genderSelected.value : "NOT SELECTED";

      return results;
    });

    console.log("Field values:", validationResult);

    // Check Next button state
    const nextBtnInfo = await page.evaluate(() => {
      const nextBtn = document.getElementById("nextBtn");
      return {
        exists: !!nextBtn,
        disabled: nextBtn?.disabled,
        visible: nextBtn ? getComputedStyle(nextBtn).display !== "none" : false,
        text: nextBtn?.textContent?.trim(),
      };
    });

    console.log("Next button info:", nextBtnInfo);

    // Try clicking next
    if (nextBtnInfo.exists && !nextBtnInfo.disabled) {
      await page.click("#nextBtn");

      // Wait briefly for transition
      await page.waitForTimeout(500);

      // Check what step is now active
      const stepInfo = await page.evaluate(() => {
        const step1 = document.querySelector('.wizard-step[data-step="1"]');
        const step2 = document.querySelector('.wizard-step[data-step="2"]');

        return {
          step1Active: step1?.classList.contains("active") || false,
          step2Active: step2?.classList.contains("active") || false,
          step1Display: step1 ? getComputedStyle(step1).display : "NOT FOUND",
          step2Display: step2 ? getComputedStyle(step2).display : "NOT FOUND",
        };
      });

      console.log("Step states after click:", stepInfo);

      if (!stepInfo.step2Active) {
        // Check for validation errors
        const validationErrors = await page.evaluate(() => {
          const errorMessages = Array.from(
            document.querySelectorAll(".field-error, .step-validation-message"),
          )
            .map((el) => el.textContent.trim())
            .filter((text) => text.length > 0);
          return errorMessages;
        });

        console.log("Validation errors:", validationErrors);
      }

      expect(stepInfo.step2Active).toBe(true);
    } else {
      console.log("Cannot click Next button - disabled or not found");
      expect(nextBtnInfo.exists).toBe(true);
      expect(nextBtnInfo.disabled).toBe(false);
    }
  });
});
