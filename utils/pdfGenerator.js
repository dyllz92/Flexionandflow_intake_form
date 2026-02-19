const PDFDocument = require("pdfkit");

/**
 * Generate a PDF from form data
 * @param {Object} formData - The form submission data
 * @returns {Promise<Buffer>} PDF buffer
 */
async function generatePDF(formData) {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({
        size: "A4",
        margins: { top: 50, bottom: 50, left: 50, right: 50 },
      });

      const chunks = [];

      doc.on("data", (chunk) => chunks.push(chunk));
      doc.on("end", () => resolve(Buffer.concat(chunks)));
      doc.on("error", reject);

      // Brand name and colors
      const brandName = "Flexion and Flow";
      const brandColor = "#9D4EDD"; // Purple theme

      // Determine form type title
      const formType = formData.formType || "intake";
      let formTypeTitle;
      if (formType === "feedback") {
        formTypeTitle = "Post-Session Feedback";
      } else {
        formTypeTitle = "Client Intake Form";
      }

      // Header
      doc
        .fontSize(20)
        .fillColor(brandColor)
        .text(brandName, { align: "center" });

      doc.fontSize(16).text(formTypeTitle, { align: "center" });

      doc.moveDown(1);
      doc
        .strokeColor(brandColor)
        .lineWidth(2)
        .moveTo(50, doc.y)
        .lineTo(545, doc.y)
        .stroke();

      doc.moveDown(1);

      // Submission info
      const submittedDate = formData.submissionDate
        ? new Date(formData.submissionDate)
        : new Date();
      const formattedDate = submittedDate.toLocaleString("en-AU", {
        dateStyle: "full",
        timeStyle: "short",
        timeZone: "Australia/Sydney",
      });
      doc
        .fontSize(9)
        .fillColor("#666")
        .text(`Submitted: ${formattedDate}`, { align: "right" });

      doc.moveDown(1);

      // Generate appropriate form based on type
      if (formType === "feedback") {
        generateFeedbackForm(doc, formData, brandColor);
      } else {
        generateUniversalForm(doc, formData, brandColor, formType);
      }

      // Signature section
      doc.moveDown(1.5);
      doc
        .fontSize(12)
        .fillColor("#000")
        .text("Signature:", { continued: false });

      doc.moveDown(0.5);

      if (formData.signature) {
        try {
          const sig = String(formData.signature || "");
          if (sig.indexOf("text:") === 0) {
            // Render typed signature text
            const txt = sig.slice(5);
            doc.moveDown(0.2);
            try {
              doc.font("Times-Italic");
            } catch (e) {
              /* ignore */
            }
            doc.fontSize(28).fillColor("#000").text(txt, { continued: false });
            try {
              doc.font("Times-Roman");
            } catch (e) {
              /* ignore */
            }
          } else {
            const signatureData = sig.replace(/^data:image\/\w+;base64,/, "");
            const signatureBuffer = Buffer.from(signatureData, "base64");
            doc.image(signatureBuffer, {
              fit: [200, 50],
              align: "left",
            });
          }
        } catch (error) {
          console.error("Error adding signature to PDF:", error);
          doc.fontSize(10).text("[Signature image error]");
        }
      }

      doc.moveDown(0.5);
      const signedDate = formData.signedAt
        ? new Date(formData.signedAt)
        : formData.submissionDate
          ? new Date(formData.submissionDate)
          : new Date();
      const formattedSignedDate = signedDate.toLocaleString("en-AU", {
        dateStyle: "full",
        timeStyle: "short",
        timeZone: "Australia/Sydney",
      });
      doc.fontSize(9).fillColor("#666").text(`Signed: ${formattedSignedDate}`);

      // Footer
      doc
        .fontSize(8)
        .fillColor("#999")
        .text(
          "This document contains confidential health information and should be stored securely.",
          50,
          doc.page.height - 70,
          { align: "center", width: 495 },
        );

      doc.end();
    } catch (error) {
      reject(error);
    }
  });
}

function generateUniversalForm(
  doc,
  data,
  brandColor = "#9D4EDD",
  formType = "intake",
) {
  doc.fillColor("#000");

  // ── Step 1: Client Details ──
  addSection(doc, "Client Details", brandColor);
  addField(doc, "Full name", data.fullName);
  if (data.preferredName) addField(doc, "Preferred name", data.preferredName);
  addField(doc, "Email", data.email || "Not provided");
  addField(doc, "Mobile", data.mobile);
  if (data.dateOfBirth) addField(doc, "Date of birth", data.dateOfBirth);
  if (data.gender) addField(doc, "Gender", data.gender);
  if (data.pronouns) addField(doc, "Pronouns", data.pronouns);
  if (data.pronounsSelfDescribe)
    addField(doc, "Pronouns (self-described)", data.pronounsSelfDescribe);
  if (data.occupation) addField(doc, "Occupation", data.occupation);

  // Emergency contact
  if (data.emergencyName || data.emergencyPhone) {
    addSection(doc, "Emergency Contact", brandColor);
    addField(doc, "Name", data.emergencyName || "Not provided");
    if (data.emergencyRelationship)
      addField(doc, "Relationship", data.emergencyRelationship);
    addField(doc, "Phone", data.emergencyPhone || "Not provided");
  }

  // ── Step 2: About Your Visit ──
  addSection(doc, "Visit Details", brandColor);

  // Visit goals
  if (data.visitGoals) {
    const goals = Array.isArray(data.visitGoals)
      ? data.visitGoals
      : [data.visitGoals];
    addField(doc, "What brings you in", goals.join(", "));
  }
  if (data.visitGoalOther)
    addField(doc, "Other visit reason", data.visitGoalOther);

  // Referral
  if (data.referralSource)
    addField(doc, "How did you hear about us", data.referralSource);
  if (data.referral_person) addField(doc, "Referred by", data.referral_person);

  // Lifestyle
  addSection(doc, "Lifestyle", brandColor);
  if (data.sleepQuality)
    addField(doc, "Sleep quality (1-10)", data.sleepQuality);
  if (data.stressLevel) addField(doc, "Stress level (1-10)", data.stressLevel);
  if (data.exerciseFrequency)
    addField(doc, "Exercise frequency", data.exerciseFrequency);
  if (data.exerciseDetails)
    addField(doc, "Exercise details", data.exerciseDetails);

  // Previous massage
  if (data.previousMassage)
    addField(doc, "Previous massage experience", data.previousMassage);
  if (data.last_treatment_when)
    addField(doc, "Last treatment", data.last_treatment_when);
  if (data.previousMassageDetails)
    addField(doc, "Previous massage details", data.previousMassageDetails);

  // ── Step 3: Health History ──
  addSection(doc, "Health History", brandColor);
  addField(
    doc,
    "Taking medications",
    data.takingMedications || "Not specified",
  );
  if (data.takingMedications === "Yes" && data.medicationsList) {
    addField(doc, "Medications", data.medicationsList);
  }

  addField(doc, "Has allergies", data.hasAllergies || "Not specified");
  if (data.hasAllergies === "Yes" && data.allergiesList) {
    addField(doc, "Allergies", data.allergiesList);
  }

  // Medical conditions
  if (data.medicalConditions) {
    const conditions =
      typeof data.medicalConditions === "string"
        ? data.medicalConditions
            .split(",")
            .map((c) => c.trim())
            .filter(Boolean)
        : Array.isArray(data.medicalConditions)
          ? data.medicalConditions
          : [];
    if (conditions.length > 0) {
      addFieldList(doc, "Medical conditions", conditions);
    } else {
      addField(doc, "Medical conditions", "None reported");
    }
  } else {
    addField(doc, "Medical conditions", "None reported");
  }
  if (data.conditionsDetails)
    addField(doc, "Condition details", data.conditionsDetails);

  // Pregnancy
  addField(
    doc,
    "Pregnant / breastfeeding",
    data.pregnantBreastfeeding || "Not specified",
  );
  if (data.pregnantBreastfeeding === "Yes" && data.pregnancy_weeks) {
    addField(doc, "Weeks along", data.pregnancy_weeks);
  }

  if (data.additionalHealthInfo)
    addField(doc, "Additional health info", data.additionalHealthInfo);

  // Legacy health checks
  if (Array.isArray(data.healthChecks) && data.healthChecks.length) {
    addFieldList(doc, "Health issues flagged", data.healthChecks);
  }
  if (data.reviewNote) addField(doc, "Health review notes", data.reviewNote);

  // ── Step 4: Pain & Signals ──
  addSection(doc, "Pain & Signals", brandColor);
  if (
    data.painLevel !== undefined &&
    data.painLevel !== null &&
    data.painLevel !== ""
  ) {
    addField(doc, "Pain level (0-10)", String(data.painLevel));
  } else if (data.painNotSure) {
    addField(doc, "Pain level", "Not sure");
  } else {
    addField(doc, "Pain level", "Not reported");
  }

  if (data.painCause) addField(doc, "Symptom cause", data.painCause);

  if (data.painDescriptors) {
    const descriptors =
      typeof data.painDescriptors === "string"
        ? data.painDescriptors
            .split(",")
            .map((d) => d.trim())
            .filter(Boolean)
        : Array.isArray(data.painDescriptors)
          ? data.painDescriptors
          : [];
    if (descriptors.length > 0) {
      addField(doc, "Symptom descriptors", descriptors.join(", "));
    }
  }
  if (data.painDescriptorOther)
    addField(doc, "Other symptom details", data.painDescriptorOther);

  if (data.worseToday) addField(doc, "Worse than usual today", data.worseToday);

  addField(
    doc,
    "Pressure preference",
    data.pressurePreference || "Not specified",
  );

  if (data.areasToAvoid) addField(doc, "Areas to avoid", data.areasToAvoid);

  if (data.bodyAreas) {
    const areas =
      typeof data.bodyAreas === "string"
        ? data.bodyAreas
            .split(",")
            .map((a) => a.trim())
            .filter(Boolean)
        : Array.isArray(data.bodyAreas)
          ? data.bodyAreas
          : [];
    if (areas.length > 0) {
      addField(doc, "Body areas of discomfort", areas.join(", "));
    }
  }

  // Body map image
  if (data.muscleMapImage) {
    try {
      doc.addPage();
      doc
        .fontSize(11)
        .fillColor(brandColor)
        .text("Body Map with Marked Areas", { align: "center" });
      doc.moveDown(0.5);

      const imgWidth = 350;
      const imgX = Math.max(50, (doc.page.width - imgWidth) / 2);

      const imageData = data.muscleMapImage.replace(
        /^data:image\/\w+;base64,/,
        "",
      );
      const imageBuffer = Buffer.from(imageData, "base64");
      doc.image(imageBuffer, imgX, doc.y, { width: imgWidth });
      doc.moveDown(2);
    } catch (err) {
      console.error("Error embedding muscle map image:", err);
      addField(doc, "Body map image", "Could not embed image");
    }
  } else if (data.muscleMapMarks) {
    try {
      const marks =
        typeof data.muscleMapMarks === "string"
          ? JSON.parse(data.muscleMapMarks)
          : data.muscleMapMarks;
      if (Array.isArray(marks) && marks.length > 0) {
        addField(
          doc,
          "Discomfort areas marked",
          `${marks.length} area(s) marked on body map`,
        );
      }
    } catch (e) {
      console.error("Error processing body map:", e);
    }
  }

  if (data.avoidNotes) addField(doc, "Avoid notes", data.avoidNotes);
  if (data.otherHealthConcernText)
    addField(doc, "Other health concern", data.otherHealthConcernText);

  // ── Step 5: Consent ──
  addSection(doc, "Consent & Agreement", brandColor);
  addField(
    doc,
    "Privacy & treatment consent",
    data.consentAll ? "Agreed" : "Not agreed",
  );
  addField(
    doc,
    "Medical care disclaimer",
    data.medicalCareDisclaimer ? "Acknowledged" : "Not acknowledged",
  );
  if (typeof data.emailOptIn !== "undefined") {
    addField(
      doc,
      "Email communications opt-in",
      data.emailOptIn ? "Yes" : "No",
    );
  }
}

/**
 * Generate a simpler feedback form PDF
 */
function generateFeedbackForm(doc, data, brandColor = "#9D4EDD") {
  doc.fillColor("#000");

  addSection(doc, "Contact Details", brandColor);
  addField(doc, "Full name", data.fullName);
  if (data.mobile) addField(doc, "Mobile", data.mobile);
  if (data.email) addField(doc, "Email", data.email);

  addSection(doc, "Session Details", brandColor);
  if (data.therapistName) addField(doc, "Therapist", data.therapistName);

  addSection(doc, "Feedback", brandColor);
  addField(
    doc,
    "Post-session feeling (1-10)",
    data.feelingPost || "Not provided",
  );
  addField(
    doc,
    "Would recommend AO wellness",
    data.wouldRecommend || "Not provided",
  );

  if (data.feedbackComments) {
    addField(doc, "Additional comments", data.feedbackComments);
  }
}

function addSection(doc, title, brandColor = "#9D4EDD") {
  doc.moveDown(1);
  doc.fontSize(12).fillColor(brandColor).text(title, { underline: true });
  doc.moveDown(0.5);
}

function addField(doc, label, value) {
  const bottomMargin = doc.page.margins ? doc.page.margins.bottom : 50;
  if (doc.y > doc.page.height - bottomMargin - 40) {
    doc.addPage();
  }

  doc
    .fontSize(10)
    .fillColor("#333")
    .text(label + ": ", { continued: true })
    .fillColor("#000")
    .text(value || "Not provided");

  doc.moveDown(0.3);
}

function addFieldList(doc, label, arr) {
  if (!Array.isArray(arr) || arr.length === 0) {
    addField(doc, label, "None");
    return;
  }

  const bottomMargin = doc.page.margins ? doc.page.margins.bottom : 50;
  if (doc.y > doc.page.height - bottomMargin - 40) doc.addPage();
  doc
    .fontSize(10)
    .fillColor("#333")
    .text(label + ":");
  doc.moveDown(0.2);
  doc.fontSize(10).fillColor("#000");
  arr.forEach((item) => {
    const line = typeof item === "string" ? item : JSON.stringify(item);
    doc.text("- " + line, { indent: 12 });
  });
  doc.moveDown(0.4);
}

module.exports = {
  generatePDF,
};
