import { test, expect } from '@playwright/test';

test('simple test - just load the form and check Step 1 visibility', async ({ page }) => {
  await page.goto('/intake');

  // Wait for the form to load
  await page.waitForSelector('#intakeForm', { timeout: 5000 });

  // Check that Step 1 form section is visible
  const step1 = await page.locator('.wizard-step[data-step="1"]').isVisible();
  console.log('Step 1 visible?', step1);
  expect(step1).toBe(true);

  // Check that all Step 1 required fields exist
  const firstNameInput = await page.locator('#firstName').isVisible();
  console.log('First name input visible?', firstNameInput);
  expect(firstNameInput).toBe(true);

  const nextBtn = await page.locator('#nextBtn').isVisible();
  console.log('Next button visible?', nextBtn);
  expect(nextBtn).toBe(true);

  // Fill Step 1 fields
  console.log('Filling Step 1 fields...');
  await page.fill('#firstName', 'Test');
  await page.fill('#lastName', 'User');
  await page.fill('#email', 'test@example.com');
  await page.fill('#mobile', '0412345678');
  await page.fill('#dateOfBirth', '15/06/1990');

  // Wait a moment for validation
  await page.waitForTimeout(500);

  // Check if next button is enabled
  const isEnabled = await page.locator('#nextBtn').isEnabled();
  console.log('Next button enabled?', isEnabled);

  if (!isEnabled) {
    // Debug: Check validation state
    const validationMsg = await page.locator('#stepValidationMessage').textContent();
    console.log('Validation message:', validationMsg);
  }

  expect(isEnabled).toBe(true);

  // Try clicking next
  console.log('Clicking next button...');
  await page.click('#nextBtn');

  // Wait for Step 2 to become visible
  console.log('Waiting for Step 2 to appear...');
  await page.waitForSelector('.wizard-step[data-step="2"].active', { timeout: 5000 });

  const step2 = await page.locator('.wizard-step[data-step="2"]').isVisible();
  console.log('Step 2 visible?', step2);
  expect(step2).toBe(true);

  // Check if Step 2 checkbox inputs are visible
  const visitReasonsCheckbox = await page.locator('input[name="visitReasons"]').first().isVisible();
  console.log('Visit reasons checkbox visible?', visitReasonsCheckbox);
  expect(visitReasonsCheckbox).toBe(true);
});
