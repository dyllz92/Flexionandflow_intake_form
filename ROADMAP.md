# Seated Massage Intake Form - Project Roadmap

**Project Goal:** Build a locally-hosted web app for clients to complete intake forms via mobile browser, with secure PDF storage in Google Drive.

**Last Updated:** February 5, 2026

---


## 🚀 Updated Roadmap Summary

### ✅ Current Status (95% Complete)
- ✅ Repository initialized
- ✅ Core implementation complete
- ✅ MVP features functional
- ✅ Universal intake form with 6-step wizard
- ✅ Step-by-step navigation with validation
- ✅ Home page with dual form selection buttons
- ✅ Interactive body mapping with PNG/SVG fallback
- ✅ Railway deployment configuration (complete)
- ✅ Production deployment to Railway (complete)
- ✅ All config files and CI/CD improvements (see below)
- ⏳ Mobile device testing pending
- ⏳ QR code generation pending

---

## 📝 Recent Improvements (Jan 2026)

- Removed Azure/Vercel deploys; Railway is now the sole deployment target
- Added config-as-code: `railway.toml`, `.nvmrc`, `.env.example`, `.npmrc`, `Procfile`
- Improved CI: added test script, fixed engine/lockfile warnings, removed Azure workflow
- Updated README and documentation for Railway deployment
- Added/updated package-lock.json and packageManager field
- General code cleanup and workflow improvements

---

---

## ð Next Priorities (No Deadlines)

### February 2026 ? UX & Content Fixes (Track Progress)

High Priority
- [ ] Fix "FOOTSGRAY" typo on landing page badge (should be "FOOTSCRAY")
- [ ] Replace date-of-birth picker with a historical-friendly input (typed date or day/month/year selects)
- [ ] Resolve feedback form step indicator (remove or implement actual steps)
- [ ] Clarify "I Feel Fine Today" logic (mutually exclusive or explanatory copy)
- [ ] Add disabled button feedback (inline validation or highlight missing required fields)

Medium Priority
- [ ] Remove slider defaults or require deliberate interaction (sleep/stress/feeling)
- [ ] Compact button groups (exercise frequency and similar multi-choice sections)
- [ ] Improve health conditions layout (multi-column or categorized list)
- [ ] Improve consent text readability (line-height, bullets, or summary + full link)
- [ ] Make entire landing page cards clickable (not just icon/button)
- [ ] Ensure section naming matches content (e.g., "About You & Your Visit")
- [ ] Declaration/consent viewing: open modal or inline expand instead of navigating away

Low Priority
- [ ] Add subtle hover states for interactive elements
- [ ] Pre-fill feedback form from intake when same session
- [ ] Add signature canvas guidance ("Sign here" cue + empty state)
- [ ] Add smooth transitions between steps
- [ ] Add confirmation/success screens after submission


### Priority 1 — IMMEDIATE

**Mobile Device Testing (iOS/Android)**
- Test signature capture on real devices
- Verify form submission flow end-to-end
- Validate PDF generation and Drive upload
- Check responsive design on various screen sizes
- Est. time: 2–3 hours

**QR Code Generation**
- Add qrcode npm package
- Generate QR code linking to deployment URL
- Display on home page or separate QR page
- Print-friendly QR code version
- Est. time: 1 hour


### Priority 2 — SHORT-TERM

**Error Logging & Monitoring**
- Set up Railway metrics or Sentry
- Add error tracking for PDF generation failures
- Monitor Google Drive API quota usage
- Log form submission success/failure rates
- Est. time: 2–3 hours

### Priority 3 — TESTING & VALIDATION

**Comprehensive Testing**
- Test with various form data combinations
- Verify PDF accuracy with different inputs
- Confirm Google Drive folder organization
- Test local PDF fallback
- Est. time: 2–3 hours

**User Acceptance Testing (UAT)**
- Get feedback from massage therapists
- Test with actual client scenarios
- Validate signature capture quality
- Confirm consent flow clarity
- Est. time: 4–5 hours

### Priority 4 — POLISH & OPTIMIZATION

**Performance Optimization**
- Minimize unused dependencies (evaluate Puppeteer)
- Optimize PDF generation performance
- Cache static assets
- Monitor page load time
- Est. time: 1–2 hours

**UX Refinements**
- Add loading indicators for PDF generation
- Improve error messages
- Add success feedback on form submission
- Consider accessibility improvements (WCAG)
- Est. time: 2–3 hours

---

## ✅ What’s Already Done

| Feature | Status |
|---|---|
| 6-step wizard form | ✅ Complete |
| Both form options (Quick + Detailed) | ✅ Complete |
| PDF generation with signatures | ✅ Complete |
| Google Drive integration | ✅ Complete |
| Local PDF fallback | ✅ Complete |
| Body map with PNG/SVG fallback | ✅ Complete |
| Mobile-responsive design | ✅ Complete |
| Railway deployment config | ✅ Ready |
| Privacy & security features | ✅ Complete |

---

## 🏁 MVP Launch Readiness

**Current:** 90% complete

**Ready after completing:**
- Priority 1 tasks (Mobile testing + QR codes)
- Priority 2 tasks (Railway deployment + monitoring)

**Success Criteria**
- ✅ Wizard form fully functional with validation
- ✅ PDF generation working with form data + signature
- ✅ Google Drive upload confirmed
- ✅ Home page displays both form options
- ✅ Railway deployment ready
- ⏳ Mobile testing passed
- ⏳ Production URL live and accessible
- ⏳ QR code generated for easy access
- ⏳ Error logging configured

---

## ⚠️ Known Issues

| Issue | Workaround | Resolution |
|---|---|---|
| HTTPS on localhost | Use ngrok/Cloudflare tunnel | By design |
| Puppeteer size | Evaluate if actually used | Review & remove if unused |
| Body map PNGs large | SVG fallback available | Already implemented |
| QR code not generated | Manual URL entry | Implement soon |

---

## 🛠️ Tech Stack

- **Frontend:** HTML5, CSS3, Vanilla JavaScript
- **Backend:** Node.js + Express
- **PDF Generation:** PDFKit
- **Storage:** Google Drive API
- **Hosting:** Railway

---

## 🗂️ Task Priority Board

| Priority | Task | Status | Owner |
|---|---|---|---|
| 🚩 P1 | Mobile device testing | TODO | Team |
| ✅ P1 | Production deployment | Complete | DevOps |
| 🟡 P2 | QR code generation | TODO | Dev |
| 🟡 P2 | Error logging setup | TODO | DevOps |
| 🟠 P3 | Comprehensive testing | TODO | QA |
| 🟠 P3 | User acceptance testing | TODO | Team |
| 🔵 P4 | Performance optimization | TODO | Dev |
| 🔵 P4 | UX refinements | TODO | Design/Dev |

---

## 🚧 Future Enhancements (Post-MVP)

### Phase 2
- Admin dashboard for viewing submissions
- Email notifications on form submission
- Multi-language support
- Form analytics/reporting
- Duplicate submission detection
- Form scheduling/appointment booking

### Phase 3
- Mobile app version (iOS/Android)
- Offline form capability with sync
- Advanced analytics dashboard
- Integration with massage scheduling software
- Customizable intake forms per therapist
