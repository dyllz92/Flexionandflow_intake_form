# Signature Validation Fix - Test Plan

## Issue Description
The form was blocking submission when a drawn signature existed but no typed signature text was present. Fixed to allow submission when EITHER signature method (draw or type) has valid input.

## Test Environment
- Desktop and mobile browsers
- Both brand themes: Flexion & Flow and Hemisphere

## Test Cases

### Test 1: Draw Method Only
**Precondition:** User is on Step 5 with 'Draw Signature' selected
**Steps:**
1. Draw a signature on the canvas
2. Ensure NO text in typed signature input
3. Check consent checkbox
4. Click Submit button

**Expected Result:** Submit button is ENABLED and form submits successfully

**Status:** [ ] Pass [ ] Fail [ ] N/A

---

### Test 2: Type Method Only  
**Precondition:** User is on Step 5 with 'Type Signature' selected
**Steps:**
1. Ensure canvas is blank (no drawn signature)
2. Type a signature in the typed signature input
3. Check consent checkbox
4. Click Submit button

**Expected Result:** Submit button is ENABLED and form submits successfully

**Status:** [ ] Pass [ ] Fail [ ] N/A

---

### Test 3: Draw Method with Empty Canvas (Should Block)
**Precondition:** User is on Step 5 with 'Draw Signature' selected
**Steps:**
1. Ensure canvas is completely blank (no drawing)
2. Ensure typed signature input is empty
3. Check consent checkbox
4. Try to click Submit button

**Expected Result:** Submit button is DISABLED and shows tooltip "Please provide a signature (draw or type)." or blocks submission with alert

**Status:** [ ] Pass [ ] Fail [ ] N/A

---

### Test 4: Type Method with Empty Input (Should Block)
**Precondition:** User is on Step 5 with 'Type Signature' selected
**Steps:**
1. Ensure canvas is blank
2. Leave typed signature input empty
3. Check consent checkbox
4. Try to click Submit button

**Expected Result:** Submit button is DISABLED or submission is blocked with alert "Please provide a signature (draw or type)."

**Status:** [ ] Pass [ ] Fail [ ] N/A

---

### Test 5: Switching Methods Clears Irrelevant Data
**Precondition:** User has a drawn signature on canvas
**Steps:**
1. Draw a signature on canvas
2. Switch to 'Type Signature' method
3. Observe the typed signature input and canvas behavior

**Expected Result:** 
- Canvas becomes non-interactive (pointer-events: none)
- Drawn signature is cleared when user starts typing
- Validation only checks typed text

**Status:** [ ] Pass [ ] Fail [ ] N/A

---

### Test 6: Draw to Type to Draw Flow
**Precondition:** User is on Step 5
**Steps:**
1. Draw a signature → note submit button state
2. Switch to Type mode and enter text → note submit button state
3. Click "Clear" button in type mode
4. Switch back to Draw mode
5. Note canvas and validation state

**Expected Result:**
- Submit button enabled after each valid signature
- Error messages appear when transitioning to invalid state
- Canvas properly restored and validated

**Status:** [ ] Pass [ ] Fail [ ] N/A

---

### Test 7: Consent Checkbox Still Required
**Precondition:** User is on Step 5
**Steps:**
1. Provide valid signature (either draw or type)
2. DO NOT check the consent checkbox
3. Try to submit

**Expected Result:** Submission is blocked with alert "Please confirm you have read and agreed to the Terms and consent to treatment."

**Status:** [ ] Pass [ ] Fail [ ] N/A

---

### Test 8: Browser Resize Handling
**Precondition:** User has drawn a signature
**Steps:**
1. Draw a signature on canvas
2. Resize browser window
3. Check canvas still shows signature
4. Verify validation still works

**Expected Result:** 
- Signature preserved during resize
- Canvas properly scaled
- Validation continues to work

**Status:** [ ] Pass [ ] Fail [ ] N/A

---

### Test 9: Mobile Touch Support
**Precondition:** Mobile device/touch simulator
**Steps:**
1. Navigate to Step 5 on mobile
2. Use touch to draw signature
3. Switch to type method
4. Type signature with keyboard
5. Submit form

**Expected Result:**
- Touch drawing works on canvas
- Type method works on mobile
- Submit succeeds with valid signature

**Status:** [ ] Pass [ ] Fail [ ] N/A

---

### Test 10: Pixel Detection Accuracy
**Precondition:** User on Step 5
**Steps:**
1. Draw just a single tiny dot on canvas
2. Try to submit with consent checked

**Expected Behavior:** System properly detects the dot as a valid signature
- If dot has pixel data → submission succeeds
- If detection fails → submit is blocked

**Status:** [ ] Pass [ ] Fail [ ] N/A

---

## Overall Test Summary

| Test # | Description | Desktop | Mobile | Notes |
|--------|-------------|---------|--------|-------|
| 1 | Draw only | [ ] | [ ] | |
| 2 | Type only | [ ] | [ ] | |
| 3 | Empty draw | [ ] | [ ] | |
| 4 | Empty type | [ ] | [ ] | |
| 5 | Method switching | [ ] | [ ] | |
| 6 | Draw→Type→Draw | [ ] | [ ] | |
| 7 | Consent required | [ ] | [ ] | |
| 8 | Resize handling | [ ] | [ ] | |
| 9 | Touch support | [ ] | N/A | Mobile only |
| 10 | Pixel detection | [ ] | [ ] | |

## Verification Checklist

- [ ] Changes committed to git
- [ ] All 10 test cases pass on desktop
- [ ] All 10 test cases pass on mobile (except 9)
- [ ] Both brand themes tested (Flexion & Flow, Hemisphere)
- [ ] PDF submission includes signature correctly
- [ ] Error messages are clear and helpful
- [ ] Form state persists correctly when navigating between steps

## Known Behaviors

1. When switching from Draw to Type mode, the drawn signature is automatically cleared (line 212-213 in signature.js)
2. Canvas pixel analysis may fail in sandboxed environments - fallback to flag-based detection
3. Pixel data comparison checks for any non-zero alpha channel

## Debugging Tips

If tests fail, check browser console for:
- `window.isSignatureValid()` - should return boolean
- `window.signaturePad.hasDrawnContent()` - should return boolean
- `window.typedSignatureText` - should contain typed signature
- `document.querySelector('input[name="signatureMethod"]:checked').value` - should be 'draw' or 'type'
