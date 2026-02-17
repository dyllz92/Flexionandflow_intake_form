import { test, expect } from '@playwright/test';

test.describe('Debug Step 2 Validation Issues', () => {
  test('should show validation state at each step of filling Step 2', async ({ page }) => {
    await page.goto('/intake');

    // Expose validation state to window for debugging
    await page.evaluate(() => {
      window._DEBUG_VALIDATION = true;
      window._getValidationState = function(stepNum) {
        const getValidationState = (stepNum) => {
          const state = { valid: true, message: '', fields: [] };
          const invalidate = (element, message) => {
            if (state.valid) state.message = message;
            state.valid = false;
            if (element) state.fields.push(element);
          };

          if (stepNum === 2) {
            const visitGoalsInputs = document.querySelectorAll('input[name="visitGoals"]');
            const visitGoals = document.querySelectorAll('input[name="visitGoals"]:checked');
            const referralSourceInputs = document.querySelectorAll('input[name="referralSource"]');
            const referralSource = document.querySelectorAll('input[name="referralSource"]:checked');
            const occupation = document.getElementById('occupation');
            const sleepQuality = document.getElementById('sleepQuality');
            const stressLevel = document.getElementById('stressLevel');
            const exerciseFrequencyInputs = document.querySelectorAll('input[name="exerciseFrequency"]');
            const exerciseFrequency = document.querySelectorAll('input[name="exerciseFrequency"]:checked');
            const previousMassageInputs = document.querySelectorAll('input[name="previousMassage"]');
            const previousMassage = document.querySelectorAll('input[name="previousMassage"]:checked');

            if (visitGoalsInputs.length && visitGoals.length === 0) invalidate(visitGoalsInputs[0], 'Missing: visitGoals');
            else if (referralSourceInputs.length && referralSource.length === 0) invalidate(referralSourceInputs[0], 'Missing: referralSource');
            else if (!occupation || !occupation.value.trim()) invalidate(occupation, 'Missing: occupation');
            else if (sleepQuality && sleepQuality.hasAttribute('required') && !sleepQuality.value) invalidate(sleepQuality, 'Missing: sleepQuality');
            else if (stressLevel && stressLevel.hasAttribute('required') && !stressLevel.value) invalidate(stressLevel, 'Missing: stressLevel');
            else if (exerciseFrequencyInputs.length && exerciseFrequency.length === 0) invalidate(exerciseFrequencyInputs[0], 'Missing: exerciseFrequency');
            else if (previousMassageInputs.length && previousMassage.length === 0) invalidate(previousMassageInputs[0], 'Missing: previousMassage');
          }
          return state;
        };
        return getValidationState(stepNum);
      };
    });

    // Complete Step 1
    await page.fill('#firstName', 'Debug');
    await page.fill('#lastName', 'Test');
    await page.fill('#email', 'debug@example.com');
    await page.fill('#mobile', '0412345678');
    await page.fill('#dateOfBirth', '15/06/1990');

    await page.click('#nextBtn');
    await page.waitForSelector('[data-step="2"].active');

    // Now on Step 2 - fill fields one by one and check validation
    console.log('=== Starting Step 2 Validation Debug ===');

    // Check initial state
    let validation = await page.evaluate(() => window._getValidationState(2));
    console.log('Initial state:', validation);

    // 1. Add visit goal
    await page.check('input[name="visitGoals"][value="Pain / Tension relief"]');
    validation = await page.evaluate(() => window._getValidationState(2));
    console.log('After adding visit reason:', validation);

    // 2. Add referral source
    await page.check('input[name="referralSource"][value="Google"]');
    validation = await page.evaluate(() => window._getValidationState(2));
    console.log('After adding referral source:', validation);

    // 3. Fill occupation
    await page.fill('#occupation', 'Test Occupation');
    validation = await page.evaluate(() => window._getValidationState(2));
    console.log('After filling occupation:', validation);

    // 4. Check sleep quality
    await page.locator('#sleepQuality').evaluate(el => {
      console.log('SleepQuality element:', { value: el.value, required: el.hasAttribute('required') });
      el.value = '7';
      el.dispatchEvent(new Event('input', { bubbles: true }));
      el.dispatchEvent(new Event('change', { bubbles: true }));
    });
    validation = await page.evaluate(() => window._getValidationState(2));
    console.log('After setting sleep quality:', validation);

    // 5. Check stress level
    await page.locator('#stressLevel').evaluate(el => {
      console.log('StressLevel element:', { value: el.value, required: el.hasAttribute('required') });
      el.value = '6';
      el.dispatchEvent(new Event('input', { bubbles: true }));
      el.dispatchEvent(new Event('change', { bubbles: true }));
    });
    validation = await page.evaluate(() => window._getValidationState(2));
    console.log('After setting stress level:', validation);

    // 6. Set exercise frequency
    await page.check('input[name="exerciseFrequency"][value="3-4 days per week"]');
    validation = await page.evaluate(() => window._getValidationState(2));
    console.log('After setting exercise frequency:', validation);

    // 7. Set previous massage
    await page.check('input[name="previousMassage"][value="Yes"]');
    validation = await page.evaluate(() => window._getValidationState(2));
    console.log('After setting previous massage:', validation);

    // Check if next button is enabled
    const isNextEnabled = await page.evaluate(() => !document.getElementById('nextBtn').disabled);
    console.log('Is Next button enabled?', isNextEnabled);

    // Final check - get actual wizard validation state
    const finalValidation = await page.evaluate(() => window.wizard?.validateCurrentStep?.());
    console.log('Final wizard validation result:', finalValidation);

    // Get all form field values
    const formValues = await page.evaluate(() => {
      const form = document.getElementById('intakeForm');
      const formData = new FormData(form);
      const data = {};
      formData.forEach((value, key) => {
        if (data[key]) {
          if (Array.isArray(data[key])) {
            data[key].push(value);
          } else {
            data[key] = [data[key], value];
          }
        } else {
          data[key] = value;
        }
      });
      return data;
    });
    console.log('Form values:', formValues);

    expect(isNextEnabled).toBe(true);
  });
});
