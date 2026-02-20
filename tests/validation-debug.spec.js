const { test, expect } = require("@playwright/test");

test.describe("Form Validation Debug", () => {
  test("debug form validation state", async ({ page }) => {
    // Enable console logging
    page.on("console", (msg) => console.log("BROWSER:", msg.text()));
    page.on("pageerror", (error) => console.log("PAGE ERROR:", error.message));

    // Navigate to form
    await page.goto("http://localhost:3000/intake");

    // Wait for page to load completely
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(3000); // Wait for JS initialization

    // Check if FormUXManager loaded
    const formUXManagerExists = await page.evaluate(() => {
      return window.FormUXManager !== undefined;
    });
    console.log("FormUXManager exists:", formUXManagerExists);

    // Check wizard validation function
    const wizardVExists = await page.evaluate(() => {
      return typeof validateCurrentStep !== "undefined";
    });
    console.log("validateCurrentStep exists:", wizardVExists);

    // Get initial button state
    const nextBtn = page.locator("#nextBtn");
    const initialDisabled = await nextBtn.getAttribute("disabled");
    console.log("Initial button disabled:", initialDisabled !== null);

    // Fill one field and check state
    await page.fill("#firstName", "John");
    await page.waitForTimeout(1000);

    const afterFirstNameDisabled = await nextBtn.getAttribute("disabled");
    console.log("After firstName disabled:", afterFirstNameDisabled !== null);

    // Check validation state programmatically
    const validationResult = await page.evaluate(() => {
      if (typeof validateCurrentStep !== "undefined") {
        return validateCurrentStep();
      }
      return "validation function not found";
    });
    console.log("Step validation result:", validationResult);

    // Fill all required fields
    await page.fill("#lastName", "Doe");
    await page.fill("#email", "john.doe@example.com");
    await page.fill("#mobile", "0412345678");
    await page.fill("#dateOfBirth", "1990-01-01");
    await page.fill("#occupation", "Engineer");

    // Wait for validation to process
    await page.waitForTimeout(2000);

    // Check final validation state
    const finalValidationResult = await page.evaluate(() => {
      if (typeof validateCurrentStep !== "undefined") {
        return validateCurrentStep();
      }
      return "validation function not found";
    });
    console.log("Final step validation result:", finalValidationResult);

    const finalButtonDisabled = await nextBtn.getAttribute("disabled");
    console.log("Final button disabled:", finalButtonDisabled !== null);

    // Check which fields are still invalid
    const fieldStates = await page.evaluate(() => {
      const fields = [
        "firstName",
        "lastName",
        "email",
        "mobile",
        "dateOfBirth",
        "occupation",
      ];
      return fields.map((fieldId) => {
        const field = document.getElementById(fieldId);
        return {
          id: fieldId,
          value: field ? field.value : "not found",
          hasValue: field ? field.value.trim().length > 0 : false,
        };
      });
    });
    console.log("Field states:", JSON.stringify(fieldStates, null, 2));
  });
});
