import { test, expect } from "@playwright/test";
import { smokeConfig, FlowStep } from "./smoke.config";

test.describe("Primary Flows", () => {
  test("should complete intake form submission flow", async ({ page }) => {
    const flow = smokeConfig.flows.intakeSubmission;

    // Enable E2E safe mode to prevent real submissions
    await page.addInitScript(() => {
      window._E2E_MODE = true;
    });

    // Navigate to the flow start route
    await page.goto(flow.startRoute);

    // Wait for the form to be ready
    await expect(page.getByTestId("intake-form")).toBeVisible();

    // Execute each step in the flow
    for (const step of flow.steps) {
      await executeFlowStep(page, step);

      // Add a small delay between steps for stability
      await page.waitForTimeout(200);
    }

    // Verify the success condition
    switch (flow.successAssertion.type) {
      case "testid":
        await expect(page.getByTestId(flow.successAssertion.value)).toBeVisible(
          { timeout: 10000 },
        );
        break;
      case "url":
        await expect(page).toHaveURL(new RegExp(flow.successAssertion.value));
        break;
      case "text":
        await expect(page.getByText(flow.successAssertion.value)).toBeVisible({
          timeout: 10000,
        });
        break;
      case "roleHeading":
        await expect(
          page.getByRole("heading", { name: flow.successAssertion.value }),
        ).toBeVisible({ timeout: 10000 });
        break;
    }
  });

  test("should navigate through intake form steps without submitting", async ({
    page,
  }) => {
    await page.goto("/intake");

    // Verify form loads
    await expect(page.getByTestId("intake-form")).toBeVisible();

    // Fill minimal required fields for step 1
    await page.getByTestId("firstName").fill("Test");
    await page.getByTestId("lastName").fill("User");
    await page.getByTestId("email").fill("test@example.com");
    await page.getByTestId("mobile").fill("0412 345 678");
    await page.getByTestId("dateOfBirth").fill("01/01/1990");

    // Navigate to step 2
    await page.getByTestId("next-step-btn").click();
    await expect(page.getByRole("heading", { name: /Step 2/ })).toBeVisible();

    // Go back to step 1
    await page.getByTestId("prev-step-btn").click();
    await expect(page.getByRole("heading", { name: /Step 1/ })).toBeVisible();

    // Verify form data persisted
    await expect(page.getByTestId("firstName")).toHaveValue("Test");
    await expect(page.getByTestId("lastName")).toHaveValue("User");
  });

  test("should validate required fields", async ({ page }) => {
    await page.goto("/intake");

    // Try to proceed without filling required fields
    await page.getByTestId("next-step-btn").click();

    // Should still be on step 1 (validation should prevent progression)
    await expect(page.getByRole("heading", { name: /Step 1/ })).toBeVisible();

    // There should be some indication of validation error
    // This could be error messages, field highlighting, etc.
    // The exact implementation depends on how the app handles validation
  });
});

async function executeFlowStep(page: any, step: FlowStep) {
  let locator;

  // Get the appropriate locator based on type
  switch (step.type) {
    case "testid":
      locator = page.getByTestId(step.locator);
      break;
    case "role":
      locator = page.getByRole(step.locator);
      break;
    case "text":
      locator = page.getByText(step.locator);
      break;
    case "css":
      locator = page.locator(step.locator);
      break;
    default:
      locator = page.locator(step.locator);
  }

  // Execute the action
  switch (step.action) {
    case "fill":
      // Special handling for sliders (range inputs)
      const inputType = await locator.getAttribute?.("type");
      if (inputType === "range") {
        await locator.evaluate((el, value) => {
          el.focus();
          el.value = value;
          el.dispatchEvent(new Event("input", { bubbles: true }));
          el.dispatchEvent(new Event("change", { bubbles: true }));
          el.blur();
        }, step.value || "5");
      } else {
        await locator.fill(step.value || "");
      }
      break;
    case "click":
      await locator.click();
      break;
    case "check":
      // For checkboxes, click the label if input is hidden
      const isVisible = await locator.isVisible();
      if (!isVisible) {
        // Find and click the associated label instead
        const labelLocator = page.locator(`label:has(${step.locator})`);
        await labelLocator.click();
      } else {
        await locator.check();
      }
      break;
    case "select":
      await locator.selectOption(step.value || "");
      break;
    case "wait":
      switch (step.type) {
        case "roleHeading":
          if (typeof step.locator === "object" && step.locator.level) {
            await page
              .getByRole("heading", {
                name: step.locator.name,
                level: step.locator.level,
              })
              .waitFor({ state: "visible" });
          } else {
            await page
              .getByRole("heading", {
                name:
                  typeof step.locator === "string"
                    ? step.locator
                    : step.locator.name,
              })
              .waitFor({ state: "visible" });
          }
          break;
        default:
          await locator.waitFor({ state: "visible" });
      }
      break;
  }
}
