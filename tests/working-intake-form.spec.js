import { test, expect } from '@playwright/test';

test.describe('Intake Form - Working Tests', () => {
  test('should complete intake form Step 1 and Step 2', async ({ page }) => {
    await page.goto('/intake');

    // Step 1: Fill required fields
    console.log('Filling Step 1...');
    await page.fill('#firstName', 'Test');
    await page.fill('#lastName', 'User');
    await page.fill('#email', 'test@example.com');
    await page.fill('#mobile', '0412345678');
    await page.fill('#dateOfBirth', '15/06/1990');

    // Wait for validation
    await page.waitForTimeout(500);

    // Verify Next button is enabled
    const nextBtn = page.locator('#nextBtn');
    await expect(nextBtn).toBeEnabled();

    // Click Next to go to Step 2
    console.log('Navigating to Step 2...');
    await page.click('#nextBtn');
    await page.waitForSelector('.wizard-step[data-step="2"].active');

    // Step 2: Fill fields - click on LABELS not inputs (since inputs are hidden)
    console.log('Filling Step 2...');

    // Click on "Relieve pain / tension" label (not the hidden checkbox)
    const painLabel = page.locator('.checkbox-group.compact label:has(input[name="visitReasons"][value="Relieve pain / tension"])');
    await painLabel.click();
    await page.waitForTimeout(100);

    // Click on "Google" referral source
    const googleLabel = page.locator('.radio-group.compact label:has(input[name="referralSource"][value="Google"])');
    await googleLabel.click();
    await page.waitForTimeout(100);

    // Fill occupation
    await page.fill('#occupation', 'Software Engineer');
    await page.waitForTimeout(100);

    // Adjust sliders
    await page.locator('#sleepQuality').evaluate(el => {
      el.value = '7';
      el.dispatchEvent(new Event('input', { bubbles: true }));
      el.dispatchEvent(new Event('change', { bubbles: true }));
    });
    await page.waitForTimeout(100);

    await page.locator('#stressLevel').evaluate(el => {
      el.value = '6';
      el.dispatchEvent(new Event('input', { bubbles: true }));
      el.dispatchEvent(new Event('change', { bubbles: true }));
    });
    await page.waitForTimeout(100);

    // Click on "3-4 days per week" exercise frequency
    const exerciseLabel = page.locator('.radio-group.compact label:has(input[name="exerciseFrequency"][value="3-4 days per week"])');
    await exerciseLabel.click();
    await page.waitForTimeout(100);

    // Click on "Yes" for previous massage
    const massageLabel = page.locator('.radio-group.inline.compact label:has(input[name="previousMassage"][value="Yes"])');
    await massageLabel.click();
    await page.waitForTimeout(100);

    // Trigger validation update
    await page.evaluate(() => {
      if (window.wizard && window.wizard.updateButtonStates) {
        window.wizard.updateButtonStates();
      }
    });

    // Wait for button state update
    await page.waitForTimeout(250);

    // Verify Next button is enabled
    await expect(nextBtn).toBeEnabled();
    console.log('Step 2 complete, Next button is enabled!');

    // Click Next to proceed to Step 3
    await page.click('#nextBtn');
    await page.waitForSelector('.wizard-step[data-step="3"].active');

    // Verify we're on Step 3
    const step3Heading = page.locator('h2').filter({ hasText: /Step 3/ });
    await expect(step3Heading).toBeVisible();
    console.log('Successfully navigated to Step 3!');
  });
});
