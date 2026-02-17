const { test, expect } = require("@playwright/test");

test.describe("Wizard.js Loading Test", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/intake");
    await page.waitForSelector("#intakeForm");
  });

  test("should load wizard.js and initialize properly", async ({ page }) => {
    // Check if wizard.js loaded and wizard object exists
    const wizardExists = await page.evaluate(() => {
      return {
        wizardObject: typeof window.wizard !== "undefined",
        currentStep: window.wizard?.getCurrentStep?.(),
        nextBtn: !!document.getElementById("nextBtn"),
        prevBtn: !!document.getElementById("prevBtn"),
        steps: document.querySelectorAll(".wizard-step").length,
        stepIndicators: document.querySelectorAll(".step-indicator .step")
          .length,
      };
    });

    console.log("Wizard initialization status:", wizardExists);

    expect(wizardExists.wizardObject).toBe(true);
    expect(wizardExists.currentStep).toBe(1);
    expect(wizardExists.nextBtn).toBe(true);
    expect(wizardExists.steps).toBeGreaterThan(0);
  });

  test("should have all required form fields", async ({ page }) => {
    const formFields = await page.evaluate(() => {
      return {
        firstName: !!document.getElementById("firstName"),
        lastName: !!document.getElementById("lastName"),
        email: !!document.getElementById("email"),
        mobile: !!document.getElementById("mobile"),
        dateOfBirth: !!document.getElementById("dateOfBirth"),
        genderOptions: document.querySelectorAll('input[name="gender"]').length,
      };
    });

    console.log("Form fields status:", formFields);

    // All required fields should exist
    expect(formFields.firstName).toBe(true);
    expect(formFields.lastName).toBe(true);
    expect(formFields.email).toBe(true);
    expect(formFields.mobile).toBe(true);
    expect(formFields.dateOfBirth).toBe(true);
    expect(formFields.genderOptions).toBeGreaterThan(0);
  });
});
