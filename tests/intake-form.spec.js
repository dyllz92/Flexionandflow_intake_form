import { test, expect } from '@playwright/test';

test.describe('Intake Form Submission Flow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/intake');
    // Enable E2E mode if the app supports it
    await page.evaluate(() => {
      window._E2E_MODE = true;
    });
  });

  test('should complete Step 1 - Your Details', async ({ page }) => {
    // Verify we're on Step 1
    const stepCount = await page.textContent('#stepCount');
    expect(stepCount).toContain('Step 1 of 4');

    // Fill in required fields
    await page.fill('#firstName', 'John');
    await page.fill('#lastName', 'Doe');
    await page.fill('#email', 'john.doe@example.com');
    await page.fill('#mobile', '0412345678');

    // Fill date of birth (DD/MM/YYYY)
    await page.fill('#dateOfBirth', '15/06/1990');

    // Wait for form to validate
    await page.waitForTimeout(500);

    // Next button should be enabled
    const nextBtn = page.locator('#nextBtn');
    await expect(nextBtn).toBeEnabled();
  });

  test('should complete Step 2 - About Your Visit and proceed to Step 3', async ({ page }) => {
    // First, complete Step 1
    await page.fill('#firstName', 'Jane');
    await page.fill('#lastName', 'Smith');
    await page.fill('#email', 'jane.smith@example.com');
    await page.fill('#mobile', '0487654321');
    await page.fill('#dateOfBirth', '22/03/1985');

    // Click Next to go to Step 2
    await page.click('#nextBtn');

    // Verify we're on Step 2
    await page.waitForSelector('.wizard-step[data-step="2"].active', { timeout: 5000 });
    const stepCount = await page.textContent('#stepCount');
    expect(stepCount).toContain('Step 2 of 4');

    // IMPORTANT: Checkboxes are hidden with CSS (display: none)
    // Click on the visible labels instead of the hidden inputs

    // Fill in visit reasons by clicking the visible label
    const painReasonLabel = page.locator('.checkbox-group.compact label:has(input[name="visitReasons"][value="Relieve pain / tension"])');
    await painReasonLabel.click();
    await page.waitForTimeout(100);

    // Fill in referral source by clicking the visible label
    const googleLabel = page.locator('.radio-group.compact label:has(input[name="referralSource"][value="Google"])');
    await googleLabel.click();
    await page.waitForTimeout(100);

    // Fill in occupation
    await page.fill('#occupation', 'Software Engineer');
    await page.waitForTimeout(100);

    // Adjust sleep quality slider (has default value of 5, so technically always valid)
    const sleepQualitySlider = page.locator('#sleepQuality');
    await sleepQualitySlider.evaluate(el => {
      el.value = '7';
      el.dispatchEvent(new Event('input', { bubbles: true }));
      el.dispatchEvent(new Event('change', { bubbles: true }));
    });
    await page.waitForTimeout(100);

    // Adjust stress level slider (has default value of 5, so technically always valid)
    const stressLevelSlider = page.locator('#stressLevel');
    await stressLevelSlider.evaluate(el => {
      el.value = '6';
      el.dispatchEvent(new Event('input', { bubbles: true }));
      el.dispatchEvent(new Event('change', { bubbles: true }));
    });
    await page.waitForTimeout(100);

    // Fill in exercise frequency by clicking the visible label
    const exerciseLabel = page.locator('.radio-group.compact label:has(input[name="exerciseFrequency"][value="3-4 days per week"])');
    await exerciseLabel.click();
    await page.waitForTimeout(100);

    // Fill in previous massage experience by clicking the visible label
    const massageLabel = page.locator('.radio-group.inline.compact label:has(input[name="previousMassage"][value="Yes"])');
    await massageLabel.click();
    await page.waitForTimeout(100);

    // Trigger validation update by calling wizard's update function
    await page.evaluate(() => {
      if (window.wizard && window.wizard.updateButtonStates) {
        window.wizard.updateButtonStates();
      }
    });

    // Wait a bit more for button state to update
    await page.waitForTimeout(250);

    // Verify Next button is enabled
    const nextBtn = page.locator('#nextBtn');
    await expect(nextBtn).toBeEnabled();

    // Click Next to proceed to Step 3
    await page.click('#nextBtn');

    // Verify we're on Step 3
    await page.waitForSelector('.wizard-step[data-step="3"].active', { timeout: 5000 });
    const newStepCount = await page.textContent('#stepCount');
    expect(newStepCount).toContain('Step 3 of 4');
  });

  test('should complete entire form submission', async ({ page }) => {
    // Step 1: Your Details
    await page.fill('#firstName', 'Test');
    await page.fill('#lastName', 'User');
    await page.fill('#email', 'test.user@example.com');
    await page.fill('#mobile', '0412345678');
    await page.fill('#dateOfBirth', '10/01/1992');

    await page.click('#nextBtn');
    await page.waitForSelector('.wizard-step[data-step="2"].active');

    // Step 2: About Your Visit
    // Click visible labels instead of hidden inputs
    const reasonLabel = page.locator('.checkbox-group.compact label:has(input[name="visitReasons"][value="Relieve stress / anxiety"])');
    await reasonLabel.click();

    const referralLabel = page.locator('.radio-group.compact label:has(input[name="referralSource"][value="Word of mouth"])');
    await referralLabel.click();

    await page.fill('#occupation', 'Designer');

    // Set sliders using evaluate to ensure proper event dispatch
    await page.locator('#sleepQuality').evaluate(el => {
      el.value = '8';
      el.dispatchEvent(new Event('input', { bubbles: true }));
      el.dispatchEvent(new Event('change', { bubbles: true }));
    });

    await page.locator('#stressLevel').evaluate(el => {
      el.value = '4';
      el.dispatchEvent(new Event('input', { bubbles: true }));
      el.dispatchEvent(new Event('change', { bubbles: true }));
    });

    const exerciseLabel = page.locator('.radio-group.compact label:has(input[name="exerciseFrequency"][value="1-2 days per week"])');
    await exerciseLabel.click();

    const noMassageLabel = page.locator('.radio-group.inline.compact label:has(input[name="previousMassage"][value="No"])');
    await noMassageLabel.click();

    await page.waitForTimeout(750);
    await page.click('#nextBtn');
    await page.waitForSelector('.wizard-step[data-step="3"].active');

    // Step 3: Health History
    // Click visible labels for radio buttons
    const noMedsLabel = page.locator('.radio-group.inline label:has(input[name="takingMedications"][value="No"])');
    await noMedsLabel.click();

    const noAllergiesLabel = page.locator('.radio-group.inline label:has(input[name="hasAllergies"][value="No"])');
    await noAllergiesLabel.click();

    const noInjuriesLabel = page.locator('.radio-group.inline label:has(input[name="hasRecentInjuries"][value="No"])');
    await noInjuriesLabel.click();

    // Click the "I Feel Fine Today" checkbox label
    const fineLabel = page.locator('.checkbox-group label:has(input[name="medicalConditions"][value="I Feel Fine Today"])');
    await fineLabel.click();

    const noProviderLabel = page.locator('.radio-group.inline label:has(input[name="seenOtherProvider"][value="No"])');
    await noProviderLabel.click();

    const notApplicableLabel = page.locator('.radio-group.inline label:has(input[name="pregnantBreastfeeding"][value="Not applicable"])');
    await notApplicableLabel.click();

    await page.waitForTimeout(750);
    await page.click('#nextBtn');
    await page.waitForSelector('.wizard-step[data-step="4"].active');

    // Step 4: Consent & Signature
    // Agree to the consent
    await page.check('#consentAll');

    // Draw a simple signature on the canvas
    const canvas = page.locator('#signatureCanvas');
    const box = await canvas.boundingBox();
    if (box) {
      const x1 = box.x + 20;
      const y1 = box.y + 30;
      const x2 = box.x + 100;
      const y2 = box.y + 30;

      await page.mouse.move(x1, y1);
      await page.mouse.down();
      await page.mouse.move(x2, y2);
      await page.mouse.up();
    }

    await page.waitForTimeout(500);

    // Verify submit button is enabled
    const submitBtn = page.locator('#submitBtn');
    await expect(submitBtn).toBeEnabled();

    // Note: actual submission might fail without a real backend
    // This test verifies the form is fillable and ready for submission
  });
});
