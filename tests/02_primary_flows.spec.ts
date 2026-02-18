import { test, expect } from "@playwright/test";
import { smokeConfig, FlowStep } from "./smoke.config.stable";
import * as fs from "fs";

test.describe("Primary Flows", () => {
  test("should complete intake form submission flow", async ({ page }) => {
    const flow = smokeConfig.flows.intakeSubmission;

    // Enable E2E safe mode to prevent real submissions
    await page.addInitScript(() => {
      window._E2E_MODE = true;
    });

    // === COMPREHENSIVE INSTRUMENTATION ===
    // Initialize error tracking on page
    await page.addInitScript(() => {
      (window as any).consoleErrors = [];
    });

    // Capture console messages and errors for diagnostics
    page.on("console", (msg) => {
      const type = msg.type();
      if (type === "error") {
        // Store in page context for goToStep() diagnostics
        page.evaluate((errorMsg) => {
          (window as any).consoleErrors?.push(errorMsg);
          if ((window as any).consoleErrors?.length > 20) {
            (window as any).consoleErrors.shift();
          }
        }, msg.text());

        // Also log to console during test execution
        console.log(`[CONSOLE ERROR] ${msg.text()}`);
      } else if (type === "warning") {
        console.log(`[CONSOLE WARNING] ${msg.text()}`);
      }
    });

    // Capture page errors (JavaScript exceptions)
    page.on("pageerror", (err) => {
      console.log(`[PAGE ERROR] ${err.message}`);
      console.log(`[STACK] ${err.stack}`);
    });

    // Capture request failures
    page.on("requestfailed", (request) => {
      console.log(
        `[REQUEST FAILED] ${request.method()} ${request.url()} - ${request.failure()?.errorText}`,
      );
    });

    // Capture frame navigation
    page.on("framenavigated", (frame) => {
      console.log(`[FRAME NAVIGATED] ${frame.url()}`);
    });

    // Capture page close
    page.once("close", () => {
      console.log(`[PAGE CLOSED] Page context was closed unexpectedly`);
    });

    // Navigate to the flow start route
    await page.goto(flow.startRoute);

    // Wait for the form to be ready
    await expect(page.getByTestId("intake-form")).toBeVisible();

    // Execute each step in the flow
    try {
      for (const step of flow.steps) {
        console.log(
          `[STEP] Executing action: ${step.action} on ${step.locator}`,
        );
        await executeFlowStep(page, step);

        // Add a small delay between steps for stability
        await page.waitForTimeout(200);
      }
    } catch (error) {
      // Capture screenshot and debug info on failure
      console.log(`[ERROR DURING FLOW] ${error}`);
      try {
        const screenshot = await page.screenshot({ path: "test-failure.png" });
        console.log(`[SCREENSHOT] Saved to test-failure.png`);
      } catch (e) {
        console.log(`[SCREENSHOT FAILED] Could not capture screenshot: ${e}`);
      }
      throw error;
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

    // Navigate to step 2 using robust helper
    await goToStep(page, 2, ["intake-step-1", "intake-step-2"]);

    // Go back to step 1
    await page.getByTestId("wizard-back").click();
    await expect(page.getByTestId("intake-step-1")).toBeVisible();
    await expect(page.getByTestId("intake-step-2")).not.toBeVisible();

    // Verify form data persisted
    await expect(page.getByTestId("firstName")).toHaveValue("Test");
    await expect(page.getByTestId("lastName")).toHaveValue("User");
  });

  test("should validate required fields", async ({ page }) => {
    await page.goto("/intake");

    // Try to proceed without filling required fields
    // The button should be disabled, so we try to click with force
    try {
      await page
        .getByTestId("wizard-next")
        .click({ force: true, timeout: 1000 });
    } catch (e) {
      // Expected - button is disabled and won't respond to clicks
      console.log("Button click failed as expected (button is disabled)");
    }

    // Should still be on step 1 (validation should prevent progression)
    await expect(page.getByRole("heading", { name: /Step 1/ })).toBeVisible();

    // Verify the button is indeed disabled
    const nextBtn = page.getByTestId("wizard-next");
    await expect(nextBtn).toBeDisabled();
  });

  test("should not submit form when clicking Next button (regression test)", async ({
    page,
  }) => {
    // This test verifies that the Next button uses type="button" and proper event handling
    // to prevent form submission
    await page.goto("/intake");

    // Record the initial URL before any navigation
    const initialUrl = page.url();

    // Fill Step 1 fields
    await page.getByTestId("firstName").fill("John");
    await page.getByTestId("lastName").fill("Doe");
    await page.getByTestId("email").fill("john@example.com");
    await page.getByTestId("mobile").fill("0412345678");
    await page.getByTestId("dateOfBirth").fill("01/01/1990");

    // Click Next button and verify step transition
    await goToStep(page, 2, ["intake-step-1", "intake-step-2"]);

    // Verify URL has not changed (no full page reload)
    expect(page.url()).toBe(initialUrl);
  });

  test("should block submit on step 4 until required consents are checked", async ({
    page,
  }) => {
    await page.addInitScript(() => {
      window._E2E_MODE = true;
    });

    await page.goto("/intake");
    await expect(page.getByTestId("intake-form")).toBeVisible();

    // Step 1
    await page.getByTestId("firstName").fill("Regression");
    await page.getByTestId("lastName").fill("Tester");
    await page.getByTestId("email").fill("regression.tester@example.com");
    await page.getByTestId("mobile").fill("0412345678");
    await page.getByTestId("dateOfBirth").fill("01/01/1990");
    await expect(page.getByTestId("wizard-next")).toBeEnabled();
    await goToStep(page, 2, [
      "intake-step-1",
      "intake-step-2",
      "intake-step-3",
      "intake-step-4",
    ]);

    // Step 2
    await page.getByTestId("occupation").fill("Engineer");
    await page.getByTestId("sleepQuality").fill("7");
    await page.getByTestId("stressLevel").fill("4");
    await setFormChoice(page, "visitGoals", "Pain / Tension relief");
    await setFormChoice(page, "referralSource", "Google");
    await setFormChoice(page, "exerciseFrequency", "3-4 days per week");
    await setFormChoice(page, "previousMassage", "No");
    await expect(page.getByTestId("wizard-next")).toBeEnabled();
    await goToStep(page, 3, [
      "intake-step-1",
      "intake-step-2",
      "intake-step-3",
      "intake-step-4",
    ]);

    // Step 3
    await setFormChoice(page, "takingMedications", "No");
    await setFormChoice(page, "hasAllergies", "No");
    await setFormChoice(page, "hasRecentInjuries", "No");
    await setFormChoice(page, "medicalConditions", "I Feel Fine Today");
    await setFormChoice(page, "pregnantBreastfeeding", "Not applicable");
    await expect(page.getByTestId("wizard-next")).toBeEnabled();
    await goToStep(page, 4, [
      "intake-step-1",
      "intake-step-2",
      "intake-step-3",
      "intake-step-4",
    ]);

    // Step 4 consent gating
    await expect(page.getByTestId("intake-step-4")).toBeVisible();
    await assertSubmitBlocked(page);

    await page.getByTestId("consent-care").check();
    await assertSubmitBlocked(page);

    await page.getByTestId("medical-disclaimer").check();
    await expect(page.getByTestId("submit-intake")).toBeEnabled();

    await page.getByTestId("submit-intake").click();
    await expect(page.getByTestId("intake-success")).toBeVisible({
      timeout: 10000,
    });
  });
});

async function setFormChoice(page: any, fieldName: string, fieldValue: string) {
  await page.evaluate(
    ({ name, value }) => {
      const form = document.querySelector(
        '[data-testid="intake-form"]',
      ) as HTMLFormElement | null;
      if (!form) {
        throw new Error("Intake form not found");
      }

      const node = form.elements.namedItem(name);
      if (!node) {
        throw new Error(`Form field group "${name}" not found`);
      }

      const candidates =
        "length" in (node as any)
          ? Array.from(node as any)
          : [node as HTMLInputElement];

      const match = candidates.find(
        (el: any) => (el as HTMLInputElement).value === value,
      ) as HTMLInputElement | undefined;
      if (!match) {
        throw new Error(`Value "${value}" not found in "${name}"`);
      }

      match.checked = true;
      match.dispatchEvent(new Event("input", { bubbles: true }));
      match.dispatchEvent(new Event("change", { bubbles: true }));
      match.dispatchEvent(new Event("click", { bubbles: true }));

      if (window.wizard && window.wizard.updateButtonStates) {
        window.wizard.updateButtonStates();
      }
    },
    { name: fieldName, value: fieldValue },
  );
}

async function assertSubmitBlocked(page: any) {
  const submit = page.getByTestId("submit-intake");
  await expect(submit).toBeVisible();

  const disabled = await submit.isDisabled();
  if (disabled) {
    await expect(submit).toBeDisabled();
    return;
  }

  await submit.click({ force: true });
  await expect(page.getByTestId("intake-step-4")).toBeVisible();
}

async function executeFlowStep(page: any, step: FlowStep) {
  // Close any open date pickers or dialogs before executing action
  try {
    await page.keyboard.press("Escape");
    await page.waitForTimeout(50);
  } catch (e) {
    // Ignore if no dialog is open
  }

  // Also try clicking the main form area to close any popups
  try {
    const formHeader = page.locator("h1");
    if (await formHeader.isVisible()) {
      await formHeader.click().catch(() => {});
    }
  } catch (e) {
    // Ignore
  }

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

        // If it's a date field, blur and close any date picker
        if (inputType === "date" || inputType === "text") {
          try {
            await locator.blur();
            // Wait a bit for any popup to close
            await page.waitForTimeout(100);
          } catch (e) {
            // Ignore errors
          }
        }
      }
      // Trigger validation update after field fill
      await page.evaluate(() => {
        if (window.wizard && window.wizard.updateButtonStates) {
          window.wizard.updateButtonStates();
        }
      });
      break;
    case "click":
      // For checkboxes and radio buttons that might be hidden, try clicking with force or via label
      const clickIsVisible = await locator.isVisible().catch(() => false);
      const clickIsEnabled = await locator.isEnabled().catch(() => false);

      // Add special logging for Next button clicks
      if (step.locator === "wizard-next" || step.locator.includes("next")) {
        console.log(`[NEXT CLICK ATTEMPT] About to click Next button`);
        console.log(
          `[NEXT BUTTON STATE] Visible: ${clickIsVisible}, Enabled: ${clickIsEnabled}, Page URL: ${page.url()}`,
        );
      }

      if (!clickIsVisible) {
        // Try to click the parent label if element is not visible
        try {
          const parentLabel = page.locator(`label:has(${step.locator})`);
          const labelVisible = await parentLabel.isVisible().catch(() => false);
          if (labelVisible) {
            await parentLabel.click();
          } else {
            // Force click the hidden element
            await locator.click({ force: true });
          }
        } catch (e) {
          console.log(`[CLICK ERROR] Failed to click element: ${e}`);
          throw e;
        }
      } else if (clickIsVisible && !clickIsEnabled) {
        // Button is visible but disabled - try to click with force (for validation testing)
        try {
          await locator.click({ force: true, timeout: 100 });
        } catch (e) {
          // It's ok if force click on disabled button fails - that's expected behavior
          console.log(
            `[DISABLED BUTTON] Button was disabled, skipping click as expected`,
          );
        }
      } else {
        try {
          // Use the correctly typed locator for clicking
          await locator.click();

          // After clicking Next, wait briefly to ensure step transition starts
          await page.waitForTimeout(300);
        } catch (e) {
          console.log(`[CLICK ERROR] Failed to click visible element: ${e}`);
          throw e;
        }
      }

      // Add logging after click for Next button
      if (step.locator === "wizard-next" || step.locator.includes("next")) {
        console.log(`[NEXT CLICKED] Successfully clicked Next button`);
      }

      // Trigger validation update after click
      try {
        await page.evaluate(() => {
          if (window.wizard && window.wizard.updateButtonStates) {
            window.wizard.updateButtonStates();
          }
        });
      } catch (e) {
        // Ignore evaluation errors (page might be navigating)
        console.log(`[VALIDATION UPDATE SKIPPED] Page may be navigating: ${e}`);
      }
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

const pageConsoleErrorBuffer = new WeakMap<any, string[]>();
const pagesWithConsoleCapture = new WeakSet<any>();

function ensureConsoleErrorCapture(page: any) {
  if (pagesWithConsoleCapture.has(page)) {
    return;
  }

  const errorBuffer: string[] = [];
  pageConsoleErrorBuffer.set(page, errorBuffer);

  page.on("console", (msg: any) => {
    if (msg.type() !== "error") {
      return;
    }
    errorBuffer.push(msg.text());
    if (errorBuffer.length > 20) {
      errorBuffer.shift();
    }
  });

  pagesWithConsoleCapture.add(page);
}

/**
 * Navigate to a wizard step via `data-testid="wizard-next"` and assert target visibility.
 * Usage: `await goToStep(page, 2, ["intake-step-1", "intake-step-2", "intake-step-3"])`.
 * Logs detailed diagnostics only when the transition fails.
 */
async function goToStep(page: any, targetStep: number, stepTestIds: string[]) {
  ensureConsoleErrorCapture(page);

  if (targetStep < 1 || targetStep > stepTestIds.length) {
    throw new Error(
      `Invalid target step ${targetStep}. Must be between 1 and ${stepTestIds.length}`,
    );
  }

  const targetStepTestId = stepTestIds[targetStep - 1];
  const previousStepTestId =
    targetStep > 1 ? stepTestIds[targetStep - 2] : null;

  try {
    await page.getByTestId("wizard-next").click();

    await expect(page.getByTestId(targetStepTestId)).toBeVisible({
      timeout: 5000,
    });

    if (previousStepTestId) {
      const previousStep = page.getByTestId(previousStepTestId);
      const isHiddenOrDetached = await previousStep
        .isVisible()
        .then((visible) => !visible)
        .catch(() => true);

      expect(isHiddenOrDetached).toBe(true);
    }
  } catch (error) {
    const diagnostics = await page
      .evaluate(
        (targetTestId: string, stepIds: string[]) => {
          let visibleStepId = "none";
          for (const stepId of stepIds) {
            const el = document.querySelector(`[data-testid="${stepId}"]`);
            if (el && (el as HTMLElement).offsetParent !== null) {
              visibleStepId = stepId;
              break;
            }
          }

          const targetElement = document.querySelector(
            `[data-testid="${targetTestId}"]`,
          );

          return {
            url: window.location.href,
            visibleStep: visibleStepId,
            targetExists: !!targetElement,
            targetVisible:
              !!targetElement &&
              (targetElement as HTMLElement).offsetParent !== null,
            readyState: document.readyState,
          };
        },
        targetStepTestId,
        stepTestIds,
      )
      .catch(() => ({
        url: "unavailable",
        visibleStep: "none",
        targetExists: false,
        targetVisible: false,
        readyState: "unavailable",
      }));

    const recentErrors = (pageConsoleErrorBuffer.get(page) || []).slice(-20);

    console.error(`STEP TRANSITION FAILED (target step ${targetStep})`);
    console.error(`current URL: ${diagnostics.url}`);
    console.error(`current visible step testid: ${diagnostics.visibleStep}`);
    console.error(
      `target step exists in DOM: ${String(diagnostics.targetExists)}, visible: ${String(diagnostics.targetVisible)}`,
    );
    console.error(`page readyState: ${diagnostics.readyState}`);
    console.error(`last 20 console errors (${recentErrors.length}):`);
    if (recentErrors.length === 0) {
      console.error(`[none]`);
    } else {
      recentErrors.forEach((err, idx) => {
        console.error(`[${idx + 1}] ${err}`);
      });
    }

    throw new Error(
      `Failed to navigate to step ${targetStep}: ${error instanceof Error ? error.message : String(error)}`,
    );
  }
}
