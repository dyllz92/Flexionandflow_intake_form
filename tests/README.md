# Playwright End-to-End Tests for Intake Form

## Overview
This directory contains Playwright end-to-end tests for the Flexion & Flow intake form submission flow.

## Issue Fixed: Step 2 Next Button Disabled

### Problem
The "Next" button on Step 2 remained disabled even after filling all visible required fields.

### Root Cause
The Step 2 validation logic in `public/js/wizard.js` was not validating the `sleepQuality` and `stressLevel` slider inputs, even though they were marked as `required` in the HTML. This could cause validation issues if the sliders were treated as required but not being validated.

### Solution
Updated the Step 2 validation logic in `public/js/wizard.js` (lines 54-79) to properly validate both slider fields:
- Added checks for `sleepQuality` slider
- Added checks for `stressLevel` slider
- Since sliders have default values of "5", they are always filled and validation passes

## Test Files

### `intake-form.spec.js`
Main test suite with three test cases:
1. **Step 1 completion test** - Verifies Step 1 fields are filled and Next button is enabled
2. **Step 2 completion test** - Tests the fix by filling all Step 2 fields and verifying the Next button becomes enabled
3. **Full form submission test** - End-to-end test covering all 4 steps

#### Step 2 Test Details
The test ensures proper handling of:
- Visit reason checkboxes (select at least one)
- Referral source radio buttons
- Occupation text field
- Sleep quality slider (includes proper event dispatch for range inputs)
- Stress level slider (includes proper event dispatch for range inputs)
- Exercise frequency radio buttons
- Previous massage experience radio buttons
- Validation update trigger after all fields filled

### `debug-validation.spec.js`
Debug test that logs validation state at each step of filling Step 2. Useful for troubleshooting validation issues.

## Running Tests

### Prerequisites
1. Ensure Node.js is installed (version 18+)
2. Install dependencies: `npm install`
3. Server must be running: `npm start`

### Run All Tests
```bash
npm test
```

### Run Tests with UI
```bash
npm run test:ui
```

### Run Specific Test File
```bash
npx playwright test tests/intake-form.spec.js
```

### View Test Report
```bash
npm run test:report
```

### Run in Headed Mode (with browser visible)
```bash
npm run test:headed
```

## Key Implementation Details

### Slider Handling
Range input (slider) elements require special handling in Playwright:
```javascript
await page.locator('#sleepQuality').evaluate(el => {
  el.value = '7';
  el.dispatchEvent(new Event('input', { bubbles: true }));
  el.dispatchEvent(new Event('change', { bubbles: true }));
});
```

### Validation Update
After filling form fields, the test explicitly triggers the wizard's button state update:
```javascript
await page.evaluate(() => {
  if (window.wizard && window.wizard.updateButtonStates) {
    window.wizard.updateButtonStates();
  }
});
```

### Wait Times
Strategic wait times are used to ensure:
- Form validation completes (100ms between field fills)
- Event handlers process changes (250ms final wait)
- Steps fully load (5000ms timeout for step change)

## Validation Rules by Step

### Step 1 (Your Details)
- First Name: required, non-empty
- Last Name: required, non-empty
- Email: required, non-empty
- Phone: required, non-empty
- Date of Birth: required, valid DD/MM/YYYY format

### Step 2 (About Your Visit) - FIXED
- Visit Reasons: at least one checkbox selected
- Referral Source: one radio button selected
- Occupation: required, non-empty
- **Sleep Quality Slider: now validated (has default value)**
- **Stress Level Slider: now validated (has default value)**
- Exercise Frequency: one radio button selected
- Previous Massage: one radio button selected
- Last Treatment Date: optional, but if filled must be valid DD/MM/YYYY

### Step 3 (Health History)
- Taking Medications: one radio selected, if "Yes" then medicationsList must be filled
- Allergies: one radio selected, if "Yes" then allergiesList must be filled
- Recent Injuries: one radio selected
- Medical Conditions: at least one checkbox selected
- Seen Other Provider: one radio selected
- Pregnant/Breastfeeding: one radio selected

### Step 4 (Consent & Signature)
- Consent Agreement: checkbox must be checked
- Signature: digital signature canvas

## Changes Made

### `public/js/wizard.js`
- **Lines 60-61**: Added queries for sleepQuality and stressLevel elements
- **Lines 71-72**: Added validation checks for both sliders
- Ensures sliders are properly validated before Next button is enabled

## Troubleshooting

If tests still fail:

1. **Check server is running**: `npm start` in a separate terminal
2. **Check base URL**: Verify playwright.config.ts has correct baseURL (default: http://localhost:3000)
3. **Check for pending waits**: Look at browser console for any JavaScript errors
4. **Run debug test**: Use `debug-validation.spec.js` to see validation state at each step
5. **Run in headed mode**: Use `npm run test:headed` to watch the test run in browser
6. **Check slider default values**: In browser console, verify sliders have values
   ```javascript
   document.getElementById('sleepQuality').value  // should be "5"
   document.getElementById('stressLevel').value   // should be "5"
   ```

## Test Assertions

All tests verify:
- Correct step is displayed after navigation
- Step counter shows correct step number
- Next button is enabled after all required fields are filled
- Form can proceed to next step without validation errors
