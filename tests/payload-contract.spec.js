import { test, expect } from "@playwright/test";

/**
 * Payload Contract Test
 *
 * This test verifies that the form submission payload includes required fields
 * with correct types and null/empty behavior. Prevents backend drift by ensuring
 * the contract between frontend and backend stays stable.
 *
 * Fields tested:
 * - painLevel: number 0-10 or empty string when not set
 * - painNotSure: boolean-like (on/off or empty/value)
 * - worseToday: "Yes" | "No" | "Not sure" or empty when not selected
 * - pressurePreference: "Light" | "Medium" | "Firm" | "Not sure" or empty
 * - areasToAvoid: string or empty
 * - consentAll: "on" (checkbox value)
 * - selectedBrand: string value
 * - formType: string value
 */

test.describe("Form Payload Contract", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/intake");
    await page.evaluate(() => {
      window._E2E_MODE = true;
    });
  });

  test("should submit complete payload with all required fields", async ({
    page,
  }) => {
    let capturedPayload = null;

    // Intercept the submission request
    page.on("request", (request) => {
      if (request.url().includes("/api/submit-form")) {
        try {
          const postData = request.postDataJSON();
          capturedPayload = postData;
          console.log("Captured payload:", JSON.stringify(postData, null, 2));
        } catch (e) {
          console.log("Could not parse payload as JSON");
        }
      }
    });

    // Allow the request to proceed but abort response to prevent actual submission
    await page.route("**/api/submit-form", (route) => {
      route.abort("blockedclient");
    });

    // === STEP 1: Your Details ===
    await page.fill("#firstName", "Test");
    await page.fill("#lastName", "Contract");
    await page.fill("#email", "contract@test.com");
    await page.fill("#mobile", "0412345678");
    await page.fill("#dateOfBirth", "15/06/1990");
    await page.waitForTimeout(250);
    await page.click("#nextBtn");

    // Ensure we're on Step 2
    await page.waitForSelector('.wizard-step[data-step="2"].active', {
      timeout: 5000,
    });

    // === STEP 2: About Your Visit ===
    // Visit reasons (at least one)
    await page.click('input[name="visitReasons"][value="General wellness"]');

    // Referral source
    await page.click('input[name="referralSource"][value="Friend / Family"]');

    // Occupation
    await page.fill('input[name="occupation"]', "Tester");

    // Pain level (set to 5)
    await page.locator("#painLevel").evaluate((el) => {
      el.value = "5";
      el.dispatchEvent(new Event("input", { bubbles: true }));
      el.dispatchEvent(new Event("change", { bubbles: true }));
    });

    // Worse today (set to "Yes")
    await page.click('input[name="worseToday"][value="Yes"]');

    // Pressure preference (set to "Medium")
    await page.click('input[name="pressurePreference"][value="Medium"]');

    // Areas to avoid (set to something)
    await page.fill("#areasToAvoid", "Right shoulder");

    // Exercise frequency
    await page.click(
      'input[name="exerciseFrequency"][value="2-3 times per week"]',
    );

    // Previous massage
    await page.click('input[name="previousMassage"][value="Yes"]');

    // Sleep quality slider
    await page.locator("#sleepQuality").evaluate((el) => {
      el.value = "7";
      el.dispatchEvent(new Event("input", { bubbles: true }));
      el.dispatchEvent(new Event("change", { bubbles: true }));
    });

    // Stress level slider
    await page.locator("#stressLevel").evaluate((el) => {
      el.value = "6";
      el.dispatchEvent(new Event("input", { bubbles: true }));
      el.dispatchEvent(new Event("change", { bubbles: true }));
    });

    await page.waitForTimeout(250);
    await page.evaluate(() => {
      if (window.wizard && window.wizard.updateButtonStates) {
        window.wizard.updateButtonStates();
      }
    });
    await page.click("#nextBtn");

    // === STEP 3: Health History ===
    await page.waitForSelector('.wizard-step[data-step="3"].active', {
      timeout: 5000,
    });

    // Taking medications: No
    await page.click('input[name="takingMedications"][value="No"]');

    // Allergies: No
    await page.click('input[name="allergies"][value="No"]');

    // Recent injuries: No
    await page.click('input[name="recentInjuries"][value="No"]');

    // Medical conditions (at least one)
    await page.click('input[name="medicalConditions"][value="None"]');

    // Seen other provider: No
    await page.click('input[name="seenOtherProvider"][value="No"]');

    // Pregnant/breastfeeding: No
    await page.click('input[name="pregnantBreastFeeding"][value="No"]');

    await page.waitForTimeout(250);
    await page.click("#nextBtn");

    // === STEP 4: Consent & Signature ===
    await page.waitForSelector('.wizard-step[data-step="4"].active', {
      timeout: 5000,
    });

    // Check consent
    await page.click("#consentAll");

    // Draw a simple signature
    const canvas = page.locator("canvas").first();
    const boundingBox = await canvas.boundingBox();
    if (boundingBox) {
      const x = boundingBox.x + 50;
      const y = boundingBox.y + 30;
      await page.mouse.move(x, y);
      await page.mouse.down();
      await page.mouse.move(x + 100, y + 50);
      await page.mouse.up();
    }

    await page.waitForTimeout(250);

    // Click submit
    await page.click("#submitBtn");

    // Wait for the request to be captured
    await page.waitForTimeout(1000);

    // Verify payload was captured
    expect(capturedPayload).toBeTruthy();

    // === CONTRACT ASSERTIONS ===

    // 1. Core identification fields
    expect(capturedPayload.firstName).toBe("Test");
    expect(capturedPayload.lastName).toBe("Contract");
    expect(capturedPayload.email).toBe("contract@test.com");

    // 2. Pain-related fields (main requirement)
    expect(capturedPayload).toHaveProperty("painLevel");
    expect(capturedPayload.painLevel).toBe("5"); // Should be string from form

    expect(capturedPayload).toHaveProperty("painNotSure");
    // painNotSure should be empty/absent or 'on' if checked
    expect(
      capturedPayload.painNotSure === "" ||
        capturedPayload.painNotSure === "on" ||
        !capturedPayload.painNotSure,
    ).toBe(true);

    // 3. Worse than usual field
    expect(capturedPayload).toHaveProperty("worseToday");
    expect(capturedPayload.worseToday).toBe("Yes");

    // 4. Pressure preference field
    expect(capturedPayload).toHaveProperty("pressurePreference");
    expect(capturedPayload.pressurePreference).toBe("Medium");

    // 5. Areas to avoid field
    expect(capturedPayload).toHaveProperty("areasToAvoid");
    expect(capturedPayload.areasToAvoid).toBe("Right shoulder");

    // 6. Consent fields
    expect(capturedPayload).toHaveProperty("consentAll");
    expect(capturedPayload.consentAll).toBe(true); // Should be boolean after processing

    // 7. Metadata fields
    expect(capturedPayload).toHaveProperty("submissionDate");
    expect(capturedPayload).toHaveProperty("status");
    expect(capturedPayload.status).toBe("submitted");

    // 8. Form identification
    expect(capturedPayload).toHaveProperty("formType");
    expect(capturedPayload).toHaveProperty("selectedBrand");

    console.log("✓ All payload contract assertions passed");
  });

  test('should submit payload with empty optional fields as empty/null (no "N/A")', async ({
    page,
  }) => {
    let capturedPayload = null;

    page.on("request", (request) => {
      if (request.url().includes("/api/submit-form")) {
        try {
          const postData = request.postDataJSON();
          capturedPayload = postData;
        } catch (e) {
          // ignore
        }
      }
    });

    await page.route("**/api/submit-form", (route) => {
      route.abort("blockedclient");
    });

    // Minimal form completion - skip optional fields
    await page.fill("#firstName", "Min");
    await page.fill("#lastName", "Payload");
    await page.fill("#email", "min@test.com");
    await page.fill("#mobile", "0412345678");
    await page.fill("#dateOfBirth", "15/06/1990");
    await page.waitForTimeout(250);
    await page.click("#nextBtn");

    await page.waitForSelector('.wizard-step[data-step="2"].active', {
      timeout: 5000,
    });

    // Fill only REQUIRED fields on Step 2
    await page.click('input[name="visitReasons"][value="General wellness"]');
    await page.click('input[name="referralSource"][value="Friend / Family"]');
    await page.fill('input[name="occupation"]', "Tester");
    await page.click(
      'input[name="exerciseFrequency"][value="2-3 times per week"]',
    );
    await page.click('input[name="previousMassage"][value="Yes"]');

    // Do NOT fill optional fields:
    // - painLevel
    // - painNotSure
    // - worseToday
    // - pressurePreference
    // - areasToAvoid

    await page.waitForTimeout(250);
    await page.evaluate(() => {
      if (window.wizard && window.wizard.updateButtonStates) {
        window.wizard.updateButtonStates();
      }
    });
    await page.click("#nextBtn");

    await page.waitForSelector('.wizard-step[data-step="3"].active', {
      timeout: 5000,
    });

    // Minimal health history
    await page.click('input[name="takingMedications"][value="No"]');
    await page.click('input[name="allergies"][value="No"]');
    await page.click('input[name="recentInjuries"][value="No"]');
    await page.click('input[name="medicalConditions"][value="None"]');
    await page.click('input[name="seenOtherProvider"][value="No"]');
    await page.click('input[name="pregnantBreastFeeding"][value="No"]');

    await page.waitForTimeout(250);
    await page.click("#nextBtn");

    await page.waitForSelector('.wizard-step[data-step="4"].active', {
      timeout: 5000,
    });
    await page.click("#consentAll");

    // Simple signature
    const canvas = page.locator("canvas").first();
    const boundingBox = await canvas.boundingBox();
    if (boundingBox) {
      const x = boundingBox.x + 50;
      const y = boundingBox.y + 30;
      await page.mouse.move(x, y);
      await page.mouse.down();
      await page.mouse.move(x + 50, y + 30);
      await page.mouse.up();
    }

    await page.waitForTimeout(250);
    await page.click("#submitBtn");
    await page.waitForTimeout(1000);

    expect(capturedPayload).toBeTruthy();

    // === Contract: Optional fields should be empty/null, NOT "N/A" ===
    const emptyOrNull = (val) => val === "" || val === null || !val;

    // These optional fields should NOT be present or should be empty
    if (capturedPayload.painLevel !== undefined) {
      expect(
        emptyOrNull(capturedPayload.painLevel) ||
          /^\d+$/.test(capturedPayload.painLevel),
      ).toBe(true);
    }

    if (capturedPayload.painNotSure !== undefined) {
      expect(
        emptyOrNull(capturedPayload.painNotSure) ||
          capturedPayload.painNotSure === "on",
      ).toBe(true);
    }

    if (capturedPayload.worseToday !== undefined) {
      expect(emptyOrNull(capturedPayload.worseToday)).toBe(true);
    }

    if (capturedPayload.pressurePreference !== undefined) {
      expect(emptyOrNull(capturedPayload.pressurePreference)).toBe(true);
    }

    if (capturedPayload.areasToAvoid !== undefined) {
      expect(emptyOrNull(capturedPayload.areasToAvoid)).toBe(true);
    }

    // Never submit "N/A" for conditional fields
    Object.entries(capturedPayload).forEach(([key, value]) => {
      if (value === "N/A") {
        throw new Error(
          `Field "${key}" sent "N/A" - should be empty/null instead`,
        );
      }
    });

    console.log("✓ Optional fields correctly submitted as empty/null");
  });
});
