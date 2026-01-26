# Form Type Selection Screen - Quick Test Checklist

**Test Duration**: ~5-10 minutes
**Scope**: Hemisphere form type selection screen only

---

## Pre-Test Checklist

- [ ] Hard refresh the page (Ctrl+Shift+R / Cmd+Shift+R)
- [ ] Clear browser cache if needed
- [ ] Open DevTools (F12) to check for console errors
- [ ] Ensure "Hemisphere Wellness" is selected (not "Flexion & Flow")

---

## Visual Inspection (2 min)

### Desktop (1024px+)
```
LOGO:
[ ] Hemisphere logo is visible (real image)
[ ] Logo is approximately 120px height
[ ] Logo is centered

HEADER:
[ ] Title: "Welcome to Hemisphere Wellness" in WHITE
[ ] Subtitle: "Select your intake type" in light gray
[ ] Text is readable and centered

CARDS:
[ ] EXACTLY TWO cards visible (seated + table)
[ ] NO third card (verify no duplicates)
[ ] Cards are side-by-side
[ ] Cards have dark backgrounds
[ ] Cards have subtle borders
[ ] Cards have soft shadows
[ ] Spacing between cards is balanced

ICONS:
[ ] Chair icon visible in first card (80px)
[ ] Table icon visible in second card (90px)
[ ] Icons are clearly visible (not too dark)
[ ] Icons are properly centered

TEXT:
[ ] "Seated Massage Intake" heading visible and white
[ ] "Table Massage Intake" heading visible and white
[ ] Both headings readable

BUTTONS:
[ ] "Start Form" buttons visible
[ ] Buttons have purple gradient (not outline)
[ ] Buttons are properly sized

FOOTER:
[ ] "Your information is kept private and secure" readable
[ ] "Change provider" link visible and underlined
[ ] Footer text is light gray (readable)
```

### Mobile (375px - 480px)
```
LOGO:
[ ] Hemisphere logo visible
[ ] Logo sized appropriately for mobile

HEADER:
[ ] Title readable
[ ] Subtitle readable
[ ] No text overflow

CARDS:
[ ] EXACTLY TWO cards visible (no duplicates)
[ ] Cards are stacked vertically
[ ] Cards have consistent width/height
[ ] Proper spacing between cards
[ ] No horizontal scrolling

ICONS:
[ ] Icons visible and properly sized
[ ] Icons centered in cards

BUTTONS:
[ ] Buttons visible and tappable (44px+ touch area)
[ ] Text readable

FOOTER:
[ ] Text readable
[ ] Link visible and tappable
```

---

## Functionality Test (2 min)

### Navigation
```
[ ] Click/tap "Seated Massage Intake" card → navigates to /intake?form=seated
[ ] Click/tap "Table Massage Intake" card → navigates to /intake?form=table
[ ] Click "Change provider" → goes back to brand selection page
```

### Interactions
```
[ ] Hover card → background darkens slightly
[ ] Hover card → border becomes slightly purple
[ ] Hover card → shadow enlarges
[ ] Hover card → card lifts up slightly (visual feedback)
[ ] Hover icon → icon becomes brighter
[ ] Hover button → button brightens
[ ] Click button → visual press effect (slight lift reduction)
```

### Form Submission
```
[ ] After selecting "Seated": Seated intake form loads
[ ] After selecting "Table": Table intake form loads
[ ] No console errors on either form
```

---

## Keyboard Navigation Test (2 min)

### Tabbing
```
[ ] Tab → First card gets focus (visible outline/ring)
[ ] Tab → Second card gets focus (visible outline/ring)
[ ] Tab → "Change provider" link gets focus (visible outline)
[ ] Shift+Tab → Focus moves backward
```

### Activation
```
[ ] Focus on card → Enter key → navigates to form
[ ] Focus on card → Space key → navigates to form (or shows focus)
[ ] Focus on link → Enter → navigates to brand selection
```

### Focus Visibility
```
[ ] Focus outline is purple colored
[ ] Focus outline is visible on dark background
[ ] Focus outline is clearly distinguishable
```

---

## Accessibility Check (1 min)

### Color Contrast
```
[ ] White text (#FFFFFF) on dark background: READABLE ✓
[ ] Light gray text (#DCDCDC) on dark background: READABLE ✓
[ ] Purple accent (#9D4EDD) on dark background: VISIBLE ✓
```

### Screen Reader (optional)
```
[ ] Image has alt text: "Hemisphere Wellness Logo"
[ ] Links have descriptive text
[ ] Headings properly structured (h1)
[ ] Buttons are announced as buttons
```

### Icons
```
[ ] Icons have aria-hidden="true" (not read by screen readers)
[ ] Icons are decorative (content is in text)
```

---

## Comparison Test - Flexion Untouched (1 min)

```
SWITCH TO FLEXION:
[ ] Click "Change provider"
[ ] Select "Flexion & Flow"
[ ] Verify light blue background (original Flexion theme)
[ ] Verify light/white cards (original styling)
[ ] Verify NO purple accents
[ ] Verify original blue color scheme
[ ] All original Flexion styling present and unchanged

SWITCH BACK TO HEMISPHERE:
[ ] Select "Hemisphere Wellness" again
[ ] Dark theme reapplies correctly
[ ] Purple accents visible
[ ] Proper contrast returns
```

---

## Console Check (1 min)

```
[ ] Open DevTools (F12)
[ ] Go to Console tab
[ ] Verify NO errors (red messages)
[ ] Verify NO warnings (yellow messages)
[ ] Test is clean ✓
```

---

## Card Duplicate Check

### Visual Count
```
[ ] Count cards on page: SHOULD BE 2
    - Card 1: "Seated Massage Intake" with Chair icon
    - Card 2: "Table Massage Intake" with Table icon
[ ] If more than 2 cards visible: FAIL - investigate
```

### HTML Verification (DevTools)
```
[ ] Right-click page → Inspect
[ ] Find <div class="forms-container">
[ ] Count <div class="form-card"> elements
[ ] Should show exactly 2 cards
[ ] If more: duplicate in HTML (need to fix)
```

---

## Common Issues & Quick Fixes

| Symptom | Solution |
|---------|----------|
| Placeholder "H" showing instead of logo | Hard refresh (Ctrl+Shift+R), clear cache |
| Dark background not showing | Check if Hemisphere brand is selected |
| Text too faint/hard to read | Check DevTools > Colors, should be #FFFFFF or #DCDCDC |
| Three cards visible | Hard refresh, check browser cache, inspect HTML |
| Icons too dark | Check if filters applying (should see brightness boost on hover) |
| Purple colors missing | Verify `[data-brand="hemisphere"]` in CSS is loaded |
| No hover effects | Clear browser cache, hard refresh |

---

## Sign-Off Checklist

✅ **Visual**
- [ ] Dark premium theme showing
- [ ] Hemisphere logo visible (real image)
- [ ] High contrast white text
- [ ] Only 2 cards (no duplicates)
- [ ] Proper spacing and sizing

✅ **Functionality**
- [ ] Seated card works
- [ ] Table card works
- [ ] Change provider works
- [ ] No console errors

✅ **Keyboard/Accessibility**
- [ ] Tab navigation works
- [ ] Focus visible
- [ ] Text readable

✅ **Brand Isolation**
- [ ] Hemisphere looks premium/dark
- [ ] Flexion remains light/blue
- [ ] No style contamination

---

## Test Result Summary

| Category | Status | Notes |
|----------|--------|-------|
| Visual Design | ☐ Pass ☐ Fail | |
| Functionality | ☐ Pass ☐ Fail | |
| Keyboard Nav | ☐ Pass ☐ Fail | |
| Accessibility | ☐ Pass ☐ Fail | |
| Brand Isolation | ☐ Pass ☐ Fail | |
| Console Clean | ☐ Pass ☐ Fail | |

---

## Notes

```
Date Tested: _______________
Tested By: _______________
Browser/Device: _______________
Issues Found: (if any)
_______________________________________________________________

Actions Taken:
_______________________________________________________________

Overall Status: ☐ Pass ☐ Fail
```

---

## If You Find Issues

1. **Screenshot it** - Take a screenshot of the issue
2. **Note the steps** - How to reproduce it
3. **Check console** - Any errors? (F12 → Console)
4. **Try hard refresh** - Sometimes fixes rendering issues
5. **Different browser?** - Test in another browser
6. **Report it** - Share findings for investigation

---

## Quick Pass Criteria

✅ All items in each section checked = **PASS**
❌ Any item unchecked or failed = **FAIL** (investigate)

**Recommendation**: If visual test passes but you're unsure, run full test from FORM_TYPE_SELECTION_UPDATE.md

---

**Test Time**: 5-10 minutes
**Difficulty**: Easy (visual + click testing)
**Confidence Level**: High (should be obvious if working correctly)
