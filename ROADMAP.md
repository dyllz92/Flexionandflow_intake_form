# Seated Massage Intake Form - Project Roadmap

**Project Goal:** Build a locally-hosted web app for clients to complete intake forms via mobile browser, with secure PDF storage in Google Drive.

**Last Updated:** January 20, 2026

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

## Implementation Steps

### 1. Set up project foundation
- [x] Initialize Node.js project with package.json
- [x] Set up Express server
- [x] Create basic HTML/CSS/JS structure
- [x] Configure environment variables (.env)
- [x] Set up public access solution (ngrok/cloudflare tunnel)
- [x] Configure HTTPS for secure transmission

### 2. Create intake form UI
- [x] Create home page with logo and welcome message
- [ ] Add two form option buttons (Currently: only one button shown)
- [x] Design short form layout for mobile browsers
  - [x] Essential client information fields
  - [x] Basic consent agreement
  - [x] Signature capture
- [x] Design detailed form layout for mobile browsers
  - [x] Comprehensive client information fields
  - [x] Medical history fields
  - [x] Detailed consent agreement
  - [x] Signature capture
- [x] Implement client-side validation for both forms

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

### 6. Interactive Muscle Map (NEW)
- [x] Create canvas-based body diagram
- [x] Implement dot placement for marking discomfort areas
- [x] Add click-to-remove functionality for dots
- [x] Integrate with both intake forms
- [ ] Replace with actual SVG body maps (Female Body Map.svg / Male Body Map.svg)

---

## Requirements Defined

### Home Page Design
- ✅ Welcome message for clients
- ✅ Display Flexion & Flow logo
- ✅ Two form options:
  - **"I'm short on time"** → Quick 60-second form
  - **"I need to provide you specific information"** → Detailed intake form

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

2. **SVG Body Maps:**
   - Female Body Map.svg and Male Body Map.svg files exist but not yet integrated
   - Currently using canvas-drawn simple body outline
   - Next step: Replace with detailed SVG diagrams

---

## Technical Decisions

### Tech Stack (Proposed)
- **Frontend:** HTML5, CSS3, Vanilla JavaScript
- **Backend:** Node.js + Express
- **PDF Generation:** TBD (PDFKit or jsPDF)
- **Storage:** Google Drive API
- **Hosting:** Local network server

### Privacy & Compliance
- HIPAA compliance considerations
- No local data storage after upload
- Encrypted transmission
- Clear consent and privacy disclosures

---

## Notes & Updates

### January 20, 2026
- Updated roadmap to reflect actual implementation status
- Most core features are complete and functional
- Identified remaining tasks:
  - Home page needs to display both form options (Quick + Detailed)
  - Muscle map visualization needs to use actual SVG body diagrams instead of canvas drawing
- Added interactive muscle map feature (canvas-based with dot placement)
- Server running successfully on port 8080
- PDF generation and Google Drive integration working

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
