# Testing / Regression Checklist

Use this checklist to verify the single universal intake form works end-to-end.

- Body map E2E: select dots → submit → ensure PDF includes same body map selection(s); hidden input `muscleMapMarks` unchanged.
- Required validation: `fullName`, `mobile` (AU-friendly), `consentGiven`, `signature` must be present to enable Submit.
- Conditional “Other” fields: show only when the corresponding “Other” option is selected; hide and clear value when deselected.
- Red-flag banner: checking any health screening item shows the banner with “Reviewed by therapist” + note; submission remains allowed.
- Decline path: “Decline / Not Treated” submits with `status=declined` and optional `declineReason`; PDF shows status.
- PDF generation: succeeds and includes client details, consent + signature + timestamp, health screening selections, focus/avoid selections + pressure, and body map marks.
- Drive upload: still succeeds; local fallback works when `ALLOW_LOCAL_PDF_FALLBACK=true`.
- Filename: `ChairMassageIntake_{fullName}_{YYYY-MM-DD}_{HHmm}.pdf`.
