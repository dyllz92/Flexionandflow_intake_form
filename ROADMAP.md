# Seated Massage Intake Form - Project Roadmap

**Project Goal:** Build a locally-hosted web app for clients to complete intake forms via mobile browser, with secure PDF storage in Google Drive.

**Last Updated:** January 21, 2026

---

## Current Status
- ✅ Repository initialized
- ✅ Core implementation complete
- ✅ MVP features functional
- ⏳ Minor UI/UX refinements in progress

---

## Plan Overview

A locally-hosted web form accessible via QR code for clients to complete massage therapy intake forms on their phones. The app will capture client information, agreements, signatures, and save submissions as PDFs to Google Drive for HIPAA-compliant storage.

---

## File Locations

- Home page: [views/index.html](views/index.html)
- Server & routes: [server.js](server.js)
  - Routes: `/`, `/intake`, `/api/submit-form`, `/api/health`
  - PDF filename format generation
- Universal intake form (UI): [views/intake.html](views/intake.html)
- Client logic (universal form): [public/js/intake-form.js](public/js/intake-form.js)
- Conditional field handling: [public/js/conditionalFields.js](public/js/conditionalFields.js)
- Signature capture: [public/js/signature.js](public/js/signature.js)
- Body map component (unchanged): [public/js/muscleMap.js](public/js/muscleMap.js)
  - Hidden field name persisted: `muscleMapMarks`
- Styles (forms + sticky actions): [public/css/forms.css](public/css/forms.css)
- PDF generation: [utils/pdfGenerator.js](utils/pdfGenerator.js)
- Google Drive upload (with local fallback): [utils/driveUploader.js](utils/driveUploader.js)
- Success page: [views/success.html](views/success.html)
- Launcher script (Windows): [run-app.bat](run-app.bat)

---

## Implementation Steps

### 1. Set up project foundation
- [x] Initialize Node.js project with package.json
- [x] Set up Express server
- [x] Create basic HTML/CSS/JS structure
- [x] Configure environment variables (.env)
- [ ] Set up public access solution (ngrok/cloudflare tunnel)
- [ ] Configure HTTPS for secure transmission

### 2. Create intake form UI (Unified)
- [x] Home page shows one primary CTA: Start Intake
- [x] Single universal, checkbox-first intake form (mobile-friendly)
  - [x] Details (fullName, mobile, email, companyTeam, 18+)
  - [x] Consent + signature
  - [x] Body map component (unchanged)
  - [x] Quick health check
  - [x] Today’s focus (reasons, focus/avoid)
  - [x] Preferences (pressure, work-related injury)
  - [x] Optional notes + marketing opt-in
- [x] Client-side validation and progressive disclosure

### 3. Implement PDF generation
- [x] Choose and install PDF library (PDFKit)
- [x] Design PDF template layout
- [x] Implement form data to PDF conversion
- [x] Include signature in PDF output

### 4. Integrate Google Drive API
- [x] Set up Google Cloud project
- [x] Create service account credentials
- [x] Install Google Drive API client library
- [x] Implement OAuth 2.0 authentication
- [x] Create PDF upload functionality
- [x] Set up dedicated Drive folder

### 5. Add privacy and security features
- [x] Implement HTTPS with self-signed certificate
- [x] Add data encryption in transit
- [x] Ensure no local persistence after upload
- [x] Add privacy disclosure text
- [x] Implement secure session handling

### 6. Interactive Body Map
- [x] Component remains unchanged (UI, styling, behaviour, schema)
- [x] Dot placement + click-to-remove
- [x] Integrated into the single intake form
- [ ] Replace with actual SVG body maps (Female Body Map.svg / Male Body Map.svg)

---

## Requirements Defined

### Home Page Design
- ✅ Welcome message for clients
- ✅ Display Flexion & Flow logo
- ✅ One primary button: Start Seated Chair Massage Intake

### Form 1: Quick 60-Second Intake (Option 2)
**Basic Information:**
- Name, Mobile
- Company/Team (Well Corp / Hemisphere / AO / Other)

**Treatment Details:**
- Areas for help (tick up to 2): Neck / Shoulders / Upper back / Lower back / Arms-hands / Head-jaw / Stress / Other
- Areas to avoid (text field)
- Pressure preference (Light / Medium / Firm)

**Health Screening (tick any):**
- Sick/feverish
- Recent injury or surgery (last 3 months)
- Taking blood thinners
- Heart condition/pacemaker
- Pregnant
- Skin infection/open wound in treatment area
- Numbness/pins and needles
- None of the above

**Additional:**
- Anything important to know? (optional text)

**Consent & Signature:**
- Confirmation checkbox
- Digital signature
- Date

### Form 2: Detailed Intake (Option 1)
**Client Details:**
- Full name, Mobile, Email (optional), DOB (optional)

**Work Details:**
- Company/Team, Role, Today's shift time, Best time to be seen, Preferred session length

**Emergency Contact (optional):**
- Name, Relationship, Phone

**Section 1: Treatment Goals**
- Areas needing help (tick up to 3): Neck, Shoulders, Upper back, Mid back, Lower back, Arms/forearms/hands, Head/jaw, Hips/glutes, General stress/tension, Other
- Main goal: Reduce tightness/pain, Reduce stress/anxiety, Improve focus/energy, Headache relief, Recovery from long shifts, Other
- Focus areas (text)
- Areas to avoid (text)
- Sensitivity to pressure/touch (Yes/No + where)
- Pressure preference (Light / Medium / Firm)

**Section 2: Symptoms Snapshot (optional)**
- Pain level (0-10 scale)
- Main symptoms (checkboxes)
- Duration, What makes it worse, What helps
- Relevant work factors

**Section 3: Health Check**
- Last 48 hours conditions (5 items)
- General health conditions (18+ items)
- Details field if anything ticked
- Medications (Yes/No + details)
- Allergies/sensitivities (Yes/No + details)

**Section 4: Current Status**
- Stress levels, Sleep quality, Hydration
- Additional notes

**Section 5: Consent & Terms**
- Treatment notes display
- 3 consent checkboxes (2 required, 1 optional marketing)
- Digital signature
- Date

### Technical Decisions Made

- **Network Access:** ✅ Internet accessible (WiFi or mobile network)
  - Requires public-facing hosting or tunneling solution (ngrok/cloudflare tunnel)
  - QR code will link to accessible URL
- **Logo:** ✅ Flexion & Flow logo added (Flexioin & Flow Logo.svg)

### Open Questions

1. **Home Page Improvement:**
   - Should display both form options prominently ("Quick Form" and "Detailed Form")
   - Currently only shows one button to intake form

2. ~~**SVG Body Maps:**~~ ✅ RESOLVED (January 21, 2026)
   - ~~Female Body Map.svg and Male Body Map.svg files exist but not yet integrated~~
   - ~~Currently using canvas-drawn simple body outline~~
   - ~~Next step: Replace with detailed SVG diagrams~~
   - **Resolution:** Gender-based body maps now integrated using PNG images with fallback to canvas drawing

---

## Technical Decisions

### Tech Stack
- **Frontend:** HTML5, CSS3, Vanilla JavaScript
- **Backend:** Node.js + Express
- **PDF Generation:** PDFKit (confirmed)
- **Storage:** Google Drive API (with local fallback)
- **Hosting:** Local network server

### Privacy & Compliance
- HIPAA compliance considerations
- No local data storage after upload
- Encrypted transmission
- Clear consent and privacy disclosures

---

## Notes & Updates

### January 21, 2026 (Evening Update - Part 3)
- ✅ Form cleanup and UI refinements
  - Removed "Decline / Not Treated" button from sticky action bar
  - Removed "Work-related injury" field from Preferences section
  - Removed "alert-section" class from Quick Health Check section (removed red box styling)
  - Added 20px margin-top to healthBanner for better spacing from checkboxes
  - Updated [views/intake.html](views/intake.html) to remove declined button and work-related injury field
  - Updated [public/js/intake-form.js](public/js/intake-form.js) to remove decline functionality

### January 21, 2026 (Evening Update - Part 2)
- ✅ Major form restructuring and UX improvements
  - Updated Body Map section with clearer instructions: "Please select on the body map below, the areas you feel most discomfort or pain"
  - Renamed "Today's Focus" to "What brings you to see me today?"
  - Removed redundant options: Neck/shoulder tension, Upper back tightness, Forearm/wrist/hand tightness, General tension
  - Added new wellness-focused options: Gym soreness, Improve sleep, Relaxation/self-care, Sports recovery
  - Removed "Areas to focus" section (covered by body map)
  - Removed "Areas to avoid" section
  - Added "I consent to treatment of the below areas" with checkbox list for all treatable areas
- ✅ Enhanced health screening with detailed disclaimers
  - Created new [public/js/healthDisclaimers.js](public/js/healthDisclaimers.js) with condition-specific guidance
  - When a health condition is selected, detailed disclaimer appears with safe practice information
  - 17 comprehensive disclaimers covering: pregnancy, surgery, injuries, heart conditions, pacemakers, blood clots, blood thinners, high blood pressure, diabetes, cancer treatment, osteoporosis, epilepsy, skin conditions, fever, allergies, numbness/tingling, and dizziness
  - Disclaimers provide context-appropriate guidance to both client and therapist
- ✅ Form validation updates
  - Updated [public/js/intake-form.js](public/js/intake-form.js) to remove references to deleted fields (focusAreas, avoidAreas)
  - Maintained "Other" field conditional logic for remaining checkbox groups

### January 21, 2026 (Evening Update - Part 1)
- ✅ Added gender selection field to all forms (Male, Female, Non-binary, Prefer not to disclose)
  - Updated [views/intake.html](views/intake.html) with gender field in Details section
  - Updated [views/detailed-form.html](views/detailed-form.html) with gender field in Client Details section
  - Updated [views/quick-form.html](views/quick-form.html) with gender field in Basic Information section
- ✅ Integrated gender-based muscle map display
  - Modified [public/js/muscleMap.js](public/js/muscleMap.js) to load correct body map image based on gender selection
  - Female gender shows female body map ([public/img/Female_Body_Chart.png](public/img/Female_Body_Chart.png))
  - Male, Non-binary, and Prefer not to disclose show male body map ([public/img/Male_Body_Chart.png](public/img/Male_Body_Chart.png))
  - Muscle map clears when gender is changed to prevent confusion
- ✅ Enhanced conditional field hiding for better UX
  - Updated [public/js/intake-form.js](public/js/intake-form.js) to hide "Other" text fields until relevant checkbox is selected
  - Existing conditional logic already handles allergies and medications in detailed form via [public/js/conditionalFields.js](public/js/conditionalFields.js)
- ✅ Simplified Company/Team field
  - Changed from radio buttons to simple text input across all forms
  - Updated [views/intake.html](views/intake.html), [views/detailed-form.html](views/detailed-form.html), and [views/quick-form.html](views/quick-form.html)
  - Removed conditional "Other" field logic from [public/js/intake-form.js](public/js/intake-form.js)
- ✅ Added gender validation to all form submission handlers
  - Updated [public/js/intake-form.js](public/js/intake-form.js) for universal intake form
  - Updated [public/js/detailed-form.js](public/js/detailed-form.js) for detailed form
  - Updated [public/js/quick-form.js](public/js/quick-form.js) for quick form

### January 21, 2026 (Morning)
- Switched to a single universal intake form (no quick vs detailed split). [views/intake.html](views/intake.html), [public/js/intake-form.js](public/js/intake-form.js), redirects in [server.js](server.js#L25-L33)
- Updated home page to one CTA: Start Intake. [views/index.html](views/index.html)
- Kept body map component completely unchanged and integrated into the new form. [public/js/muscleMap.js](public/js/muscleMap.js), hidden field `muscleMapMarks` in [views/intake.html](views/intake.html)
- Updated PDF template to match the universal form. [utils/pdfGenerator.js](utils/pdfGenerator.js)
- Updated filename format: `ChairMassageIntake_{fullName}_{YYYY-MM-DD}_{HHmm}.pdf`. [server.js](server.js#L88-L96)
- Launcher clears ports and auto-opens the app; reads `PORT` from `.env`. [run-app.bat](run-app.bat)
- Health endpoint available: `/api/health` reports Drive configuration status. [server.js](server.js#L66-L74)
- Google Drive uploader supports local fallback when `ALLOW_LOCAL_PDF_FALLBACK=true`. [utils/driveUploader.js](utils/driveUploader.js)

### January 20, 2026
- Updated roadmap to reflect actual implementation status
- Most core features are complete and functional
- Identified remaining tasks:
  - Home page needs to display both form options (Quick + Detailed)
  - Muscle map visualization needs to use actual SVG body diagrams instead of canvas drawing
- Added interactive muscle map feature (canvas-based with dot placement)
- Server running successfully on port 3000
- PDF generation and Google Drive integration working

---

## Next Milestones (Q1 2026)
- [x] Replace canvas body map with gender-specific PNG diagrams (female/male) ✅ January 21, 2026
- [x] Add gender selection to all forms ✅ January 21, 2026
- [x] Enhanced conditional field hiding (Other fields, allergies, medications) ✅ January 21, 2026
- [ ] Robust validation and UX polish on mobile (sticky actions, banners)
- [ ] Basic unit tests for `pdfGenerator` and API routes
- [ ] Tunneling/HTTPS docs and task updates (ngrok/Cloudflare Tunnel)

---

## Testing / Regression
- Body map E2E: select dots → submit → reload record → PDF includes same selections.
- Required validation: fullName, mobile, consent, signature.
- Conditional “Other” fields appear only when selected.
- PDF generation succeeds.
- Drive upload succeeds; fallback works when enabled.

### January 19, 2026
- Added dual-form approach: Quick 60-second form vs. Detailed intake form
- Home page will feature Flexion & Flow logo, welcome message, and two form options
- Defined all form fields for both intake forms
- Confirmed: Internet-accessible via WiFi or mobile network (requires public URL solution)
- Ready to begin implementation pending logo file and Google Drive setup confirmationAO
- Ready to begin implementation pending logo file and network access decisions

---

## Future Enhancements (Post-MVP)

- [ ] Admin dashboard for viewing submissions
- [ ] Email notifications on form submission
- [ ] Multi-language support
- [ ] Form analytics/reporting
- [ ] Backup/export functionality
