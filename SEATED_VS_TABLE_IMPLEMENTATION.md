# Seated vs Table Massage Intake Form Implementation

## Overview

Successfully implemented differentiated intake forms for Seated and Table massage types with form-type-specific fields, validation, and PDF generation. Maintains fast user experience with pre-selected defaults and conditional field visibility.

**Implementation Date**: 2026-01-27
**Status**: Ready for Testing
**Estimated User Time**: Under 60 seconds for both form types

---

## Summary of Changes

### Key Features Implemented

1. **Form Type Detection & Storage**
   - URL parameter `?form=seated` or `?form=table` controls form type
   - Stored in localStorage via `setSelectedFormType()` for consistency
   - Auto-retrieved if user returns to form without selecting brand

2. **Seated Form**
   - All existing functionality preserved
   - No new required fields added
   - Simpler, faster flow (no table-specific prompts)
   - Single consent sentence: "...I'm comfortable receiving seated massage in a shared workplace/event setting."

3. **Table Form** (2 new required fields with defaults pre-selected)
   - **Oil / Skin Contact** (required, default: "Oil/skin contact OK")
     - Options: OK | Prefer no oil | Sensitive/allergic
     - Conditional: If "Sensitive/allergic" → show "Allergy/sensitivity details" textarea (required)
   - **Position Comfort** (required, default: "Fine face down and face up")
     - Options: Fine both | Trouble with one position
     - Conditional: If "Trouble" → show "Position details" textarea (required)
   - Updated consent sentence: "...Table massage may involve oil/skin contact and professional draping - you can request changes at any time."

4. **Auto-Hide & Conditional Logic**
   - Table fields hidden completely for seated form (not just CSS display:none)
   - Table fields shown for table form
   - Conditional detail fields (allergy details, position details) appear/disappear instantly as user selects options
   - Hidden fields cleared from state when switching form types
   - Defaults pre-selected when table form is loaded (reduces required taps)

5. **Validation Rules**
   - Step 1 (Details): Name + Phone required (unchanged)
   - Step 2 (Today's Focus / Preferences):
     - All forms: Pressure preference required
     - Table forms ONLY: Oil preference required, Position comfort required
     - If table field shows conditional section: that detail field becomes required
     - Errors show at field level with clear messages
   - Step 3 (Health Check): Unchanged (health issues trigger requirement for additional info)
   - Step 4 (Avoid): Optional (unchanged)
   - Step 5 (Consent): Consent + valid signature (draw OR type) required

6. **Signature Validation** (method-aware)
   - Accepts either draw OR type (not both required)
   - If draw selected: Canvas must have drawn content
   - If type selected: Typed text must have content (≥1 character)
   - Single validation message: "Please provide a signature (draw or type)."

7. **PDF Generation**
   - Form type title: "Seated Chair Massage Intake Form" vs "Table Massage Intake Form"
   - Table PDFs include new section: "Table-Specific Preferences"
   - Table PDFs show:
     - Oil choice (and allergy details if provided)
     - Position comfort (and details if provided)
   - Seated PDFs do NOT include table section
   - Filename format: `{NAME}_{DATE}_{TIME}_{FORM_TYPE}.pdf`
     - Example (seated): `Dylan_Ennis_2026-01-27_142530_Seated_Chair_Massage_Intake.pdf`
     - Example (table): `Dylan_Ennis_2026-01-27_142530_Table_Massage_Intake.pdf`

---

## Files Modified

### 1. `public/js/brand.js` (68 lines added)
**Purpose**: Add form type storage and management functions

**Changes**:
- Added `FORM_TYPE_STORAGE_KEY = 'selectedFormType'`
- New functions:
  - `getSelectedFormType()` - Retrieve from localStorage
  - `setSelectedFormType(formType)` - Store in localStorage
  - `clearSelectedFormType()` - Remove from localStorage
  - `getFormTypeDisplayName(formType)` - Get display string

### 2. `views/intake.html` (140 lines added/modified)
**Purpose**: Add form type detection, table fields, and dynamic content

**Changes**:
- Added hidden field: `<input type="hidden" id="formType" name="formType">`
- Added table-specific fields in Step 2:
  - Oil / Skin Contact section (with conditional allergy details)
  - Position Comfort section (with conditional position details)
- Updated consent checkbox to use dynamic text (`#consentText` span)
- Replaced initialization script (40 lines) with:
  - Form type detection from URL parameter
  - Form type storage to localStorage
  - Dynamic title update based on form type
  - Dynamic consent text based on form type
  - Table field visibility control
  - New function: `initTableFieldVisibility(formType)`
  - New function: `clearTableFieldValues()`

### 3. `public/js/intake-form.js` (70 lines added/modified)
**Purpose**: Handle table field conditional visibility and form submission

**Changes**:
- Added event listeners for table field conditional visibility (50 lines):
  - Oil allergy details: shows/hides & clears based on "sensitive" selection
  - Position details: shows/hides & clears based on "trouble" selection
  - Real-time visibility updates as user changes selections
- Updated form submission:
  - Changed hardcoded `formType: 'universal'` to dynamic form type from hidden field
  - Falls back to localStorage if field unavailable

### 4. `public/js/wizard.js` (100 lines modified)
**Purpose**: Add validation for table-specific fields

**Changes**:
- **Step 2 Validation** (expanded from 4 lines to 40 lines):
  - Pressure preference required (all forms)
  - If table form:
    - Oil preference required
    - If oil === "sensitive": allergy details required
    - Position comfort required
    - If position === "trouble": position details required
- **Step 2 Error Messages** (expanded validation error handling):
  - Specific messages for each missing field
  - Error displays at field level
  - Only shows messages for relevant (non-hidden) fields

### 5. `utils/pdfGenerator.js` (16 lines modified)
**Purpose**: Add table-specific PDF content and form type title

**Changes**:
- Form type detection: `const formType = formData.formType || 'seated'`
- Dynamic title: Shows "Table Massage Intake Form" or "Seated Chair Massage Intake Form"
- Updated `generateUniversalForm()` call to pass formType parameter
- Added table-specific section in PDF (after Preferences):
  - Oil / Skin contact choice
  - Allergy details (if sensitive selected)
  - Position comfort choice
  - Position details (if trouble selected)

### 6. `server.js` (3 lines modified)
**Purpose**: Update PDF filename based on form type

**Changes**:
- Extract form type from formData
- Dynamic form name: `'Table_Massage_Intake'` or `'Seated_Chair_Massage_Intake'`
- Filename now reflects actual form type used

---

## Validation Logic - Detailed

### Step 1: Details (Unchanged)
- ✓ Full Name required
- ✓ Phone required
- Gender optional

### Step 2: Today's Focus / Preferences
**All Forms**:
- ✓ Pressure preference required

**Table Forms ONLY**:
- ✓ Oil/Skin contact required
- → If "Sensitive/allergic" selected: ✓ Allergy details required
- ✓ Position comfort required
- → If "Trouble with one position" selected: ✓ Position details required

**Error Messages**:
- "Please select a pressure preference."
- "Please select an oil/skin contact preference."
- "Please provide allergy/sensitivity details."
- "Please select position comfort preference."
- "Please provide position details."

### Step 3: Health Check (Unchanged)
- If any health flag checked (except "No issues"): ✓ Additional information required

### Step 4: Anything to Avoid (Unchanged)
- Optional - always passes validation

### Step 5: Consent & Signature (Updated consent text)
- ✓ Consent checkbox checked
- ✓ Valid signature (draw OR type):
  - If draw method: Canvas has drawn content
  - If type method: Text input has ≥1 character

---

## Field Clearing & State Management

### When Switching Form Types
1. If user somehow switches from table → seated:
   - `clearTableFieldValues()` removes all table field data
   - Radio buttons unchecked
   - Textareas cleared
   - Validation no longer checks hidden table fields

2. If user switches from seated → table:
   - Table fields show
   - Defaults pre-selected (oil="ok", position="ok")
   - User can submit without touching them (saves taps)

### Conditional Field Auto-Hide
1. **Oil Allergy Details**:
   - Hidden by default
   - Shows when user selects "Sensitive/allergic"
   - Hides + clears immediately when user selects other option
   - Clear action also clears error message

2. **Position Details**:
   - Hidden by default
   - Shows when user selects "Trouble with one position"
   - Hides + clears immediately when user selects "Fine both positions"
   - Clear action also clears error message

---

## Testing Checklist

### A. Seated Form Flow

**Navigation & Visibility**:
- [ ] User selects "Seated Massage Intake" on form selection page
- [ ] URL is `/intake?form=seated`
- [ ] Page title shows "Seated Chair Massage Intake"
- [ ] Form title shows "Seated Chair Massage Intake"
- [ ] NO table oil section visible
- [ ] NO table position section visible

**Step 1 - Details**:
- [ ] Enter full name
- [ ] Enter mobile number
- [ ] Gender remains optional
- [ ] Next button enabled only when name + mobile filled
- [ ] Next button successfully advances to Step 2

**Step 2 - Today's Focus**:
- [ ] Body map visible and clickable
- [ ] Can mark/unmark areas
- [ ] Pressure preference options visible (Light, Medium, Firm)
- [ ] Cannot advance without selecting pressure
- [ ] Next button shows error if pressure not selected
- [ ] No oil/position fields visible
- [ ] Next button advances to Step 3 when pressure selected

**Step 3 - Health Check**:
- [ ] Health condition checkboxes visible
- [ ] Can select multiple conditions
- [ ] If any condition selected (except "No issues"):
  - [ ] Health banner appears
  - [ ] "Additional information" textarea required
  - [ ] Cannot advance without text input
- [ ] If "No issues" selected:
  - [ ] Other conditions auto-unchecked
  - [ ] Can advance without additional info
- [ ] Next button works correctly

**Step 4 - Avoid**:
- [ ] "Anything to avoid?" textarea visible (optional)
- [ ] Can leave empty
- [ ] Next button always enabled

**Step 5 - Consent & Signature**:
- [ ] Page title remains unchanged
- [ ] Consent text includes: "...I'm comfortable receiving seated massage in a shared workplace/event setting."
- [ ] Consent text does NOT mention oil/skin contact or table-specific phrases
- [ ] Can draw signature on canvas OR type signature (not both required)
- [ ] Submit button disabled until both consent checked AND valid signature provided
- [ ] Submit button enabled once requirements met
- [ ] Form successfully submits

**PDF Output - Seated**:
- [ ] PDF generated successfully
- [ ] Filename: `{NAME}_{DATE}_{TIME}_Seated_Chair_Massage_Intake.pdf`
- [ ] PDF title: "Seated Chair Massage Intake Form"
- [ ] PDF does NOT include "Table-Specific Preferences" section
- [ ] PDF does NOT show oil/position data

---

### B. Table Form Flow

**Navigation & Visibility**:
- [ ] User selects "Table Massage Intake" on form selection page
- [ ] URL is `/intake?form=table`
- [ ] Page title shows "Table Massage Intake"
- [ ] Form title shows "Table Massage Intake"
- [ ] Table oil section visible
- [ ] Table position section visible

**Step 1 - Details** (unchanged):
- [ ] Same as seated: name, phone, optional gender
- [ ] Next button works correctly

**Step 2 - Today's Focus**:
- [ ] Pressure preference visible (unchanged)
- [ ] Oil / Skin Contact section visible
  - [ ] Three radio options visible
  - [ ] "Oil/skin contact OK" is pre-selected (default)
- [ ] Position Comfort section visible
  - [ ] Two radio options visible
  - [ ] "Fine face down and face up" is pre-selected (default)

**Table Field Conditional Visibility**:
- [ ] Allergy details hidden by default
- [ ] When "Sensitive/allergic" selected:
  - [ ] Allergy textarea appears instantly
  - [ ] Label shows "Allergy/sensitivity details:"
  - [ ] Placeholder text visible: "Eg nut oils, fragrances, latex, eczema flare-ups"
- [ ] When switching to "Oil/skin contact OK" or "Prefer no oil":
  - [ ] Allergy textarea disappears instantly
  - [ ] Any entered text is cleared
  - [ ] Error message (if any) is cleared

- [ ] Position details hidden by default
- [ ] When "Trouble with one position" selected:
  - [ ] Position textarea appears instantly
  - [ ] Label shows "Position details:"
  - [ ] Placeholder text visible: "Which position and why? Eg pregnancy, reflux, vertigo, neck/back pain, breathing issues"
- [ ] When switching to "Fine face down and face up":
  - [ ] Position textarea disappears instantly
  - [ ] Any entered text is cleared
  - [ ] Error message (if any) is cleared

**Validation - Table Form**:
- [ ] Next button enabled by default (defaults pre-selected)
- [ ] Can advance to Step 3 without touching table fields
- [ ] If user clicks Next and one required field is still default:
  - [ ] Specific error message shows: "Please select a pressure preference" (if applicable)
  - [ ] Or "Please provide allergy/sensitivity details" (if sensitive was selected)
  - [ ] Or "Please provide position details" (if trouble was selected)

**Step 3-4** (unchanged from seated):
- [ ] Health check works same as seated
- [ ] Avoid notes same as seated

**Step 5 - Consent & Signature**:
- [ ] Consent text includes: "...Table massage may involve oil/skin contact and professional draping - you can request changes at any time."
- [ ] Consent text does NOT include "workplace/event setting" phrase
- [ ] Signature validation same as seated

**PDF Output - Table**:
- [ ] PDF generated successfully
- [ ] Filename: `{NAME}_{DATE}_{TIME}_Table_Massage_Intake.pdf`
- [ ] PDF title: "Table Massage Intake Form"
- [ ] PDF includes "Table-Specific Preferences" section
- [ ] PDF shows selected oil choice
  - [ ] If "Sensitive/allergic": also shows allergy details entered
  - [ ] If "OK" or "Prefer no oil": allergy details not shown
- [ ] PDF shows selected position comfort
  - [ ] If "Trouble": also shows position details entered
  - [ ] If "Fine both": position details not shown

---

### C. Form Switching Tests

**Browser Back Button / Re-navigation**:
- [ ] User completes seated form
- [ ] User returns to form selection page
- [ ] User selects table form
- [ ] Form type correctly shows as table (fields visible, title updated)

**localStorage Persistence**:
- [ ] User selects seated form
- [ ] Opens developer console, confirms `getSelectedFormType() === 'seated'`
- [ ] User refreshes page
- [ ] Form type persists (still shows seated)
- [ ] User navigates to table form
- [ ] Form type changes correctly

---

### D. Signature Validation Tests

**Draw Method**:
- [ ] Select "Draw signature" radio
- [ ] Canvas appears
- [ ] Submit button disabled (red/grayed out)
- [ ] Draw a few strokes on canvas
- [ ] Submit button becomes enabled (green)
- [ ] Clear signature button removes drawing
- [ ] Submit button disabled again

**Type Method**:
- [ ] Select "Type signature" radio
- [ ] Canvas hides, text input appears
- [ ] Submit button disabled
- [ ] Type a single character
- [ ] Submit button becomes enabled
- [ ] Clear typed button empties field
- [ ] Submit button disabled again

**Method Switching**:
- [ ] Draw some strokes on canvas
- [ ] Submit button enabled
- [ ] Switch to "Type signature"
- [ ] Text input empty, submit button disabled (canvas drawing not used)
- [ ] Type a character in text input
- [ ] Submit button enabled
- [ ] Switch back to "Draw signature"
- [ ] Canvas still has strokes, submit button enabled
- [ ] Clear canvas
- [ ] Submit button disabled (text input not used)

---

### E. Mobile Responsiveness

**Screen Size < 480px**:
- [ ] Seated form displays correctly
- [ ] Table oil section responsive
- [ ] Table position section responsive
- [ ] Radio options stack correctly
- [ ] Conditional textareas fill width
- [ ] Buttons remain large enough for touch (≥44px)
- [ ] Signature canvas appropriately sized
- [ ] Table form works smoothly on mobile

---

### F. Accessibility

**Screen Reader**:
- [ ] Form title announced correctly ("Seated..." vs "Table...")
- [ ] Table field labels announced
- [ ] Conditional sections announced when they appear
- [ ] Error messages associated with fields

**Keyboard Navigation**:
- [ ] Tab through all form fields in logical order
- [ ] Tab includes table fields (when shown)
- [ ] Tab skips table fields (when hidden)
- [ ] All buttons reachable via keyboard
- [ ] Enter key submits form

---

### G. Error Handling

**Network / Server Errors**:
- [ ] If form submission fails: Loading overlay appears then disappears
- [ ] Error message shown to user
- [ ] Can retry submission
- [ ] Form data not lost

**Data Validation**:
- [ ] Special characters in name handled correctly in filename
- [ ] Spaces replaced with underscores in filename
- [ ] Unicode characters handled gracefully
- [ ] Empty optional fields don't cause errors

---

### H. Cross-Browser Testing

**Chrome/Edge**:
- [ ] All features work
- [ ] Table fields conditional visibility works
- [ ] Signature draw works
- [ ] PDF downloads correctly

**Firefox**:
- [ ] All features work
- [ ] Canvas functionality works
- [ ] Conditional fields work

**Safari** (if applicable):
- [ ] All features work
- [ ] Canvas touch input works
- [ ] localStorage works

---

## Implementation Statistics

| Metric | Value |
|--------|-------|
| Files Modified | 6 |
| Lines Added | ~420 |
| Lines Modified | ~50 |
| New Functions | 7 |
| Form Type Options | 2 |
| Table-Specific Fields | 2 |
| Conditional Sections | 2 |
| Validation Rules (Step 2) | Expanded 8x |
| PDF Sections (Table) | 1 new |

---

## Technical Debt & Future Enhancements

### Potential Future Improvements
1. Database schema: Add `formType` column to submissions table
2. Analytics: Track form type selection rate
3. Admin dashboard: Show metrics for seated vs table submissions
4. Email templates: Form type-specific confirmation emails
5. SMS notifications: Include form type in appointment reminders

### Known Limitations
1. Form type selection not reversible after selection (user must change brand to pick again)
2. Table fields not in separate step (kept in Step 2 to maintain speed goal)
3. No form type in success page confirmation (could show selected type)

---

## Deployment Checklist

- [ ] Code review completed
- [ ] All tests pass
- [ ] Browser compatibility verified
- [ ] Mobile testing completed
- [ ] Accessibility audit completed
- [ ] PDF generation verified with both form types
- [ ] Google Drive integration tested
- [ ] Fallback local PDF storage tested
- [ ] Documentation reviewed
- [ ] Merge to main branch
- [ ] Deploy to staging
- [ ] User acceptance testing (UAT)
- [ ] Deploy to production

---

## Questions / Contact

For issues or questions about this implementation, refer to the specific files and test scenarios above.

---

**Last Updated**: 2026-01-27
**Implemented By**: Claude Code
**Status**: Ready for QA Testing
