const express = require("express");
const rateLimit = require("express-rate-limit");
const {
  validate,
  feedbackFormSchema,
  intakeFormSchema,
  soapGenerationSchema,
  sanitizeObject,
} = require("../utils/validation");
const logger = require("../utils/logger");
const pdfGenerator = require("../utils/pdfGenerator");
const driveUploader = require("../utils/driveUploader");
const MetadataStore = require("../utils/metadataStore");
const MasterFileManager = require("../utils/masterFileManager");

const router = express.Router();

// Initialize stores
const metadataStore = new MetadataStore();
const masterFileManager = new MasterFileManager();

// Rate limiters for API endpoints
const soapLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: "Too many SOAP generation requests. Please wait and try again.",
  },
});

const submitFormLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 40,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: "Too many submissions. Please wait and try again.",
  },
});

// Rate limiter for error logging
const errorLogLimiter = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutes
  max: 50, // Allow more error logs but still prevent spam
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: "Too many error reports. Please wait and try again.",
  },
});

// Helper functions
function sanitizeString(str, maxLength) {
  if (!str || typeof str !== "string") return "";
  return str
    .replace(/[<>&"'\\/]/g, "")
    .trim()
    .substring(0, maxLength);
}

function normalizeList(list) {
  if (!Array.isArray(list)) return [];
  return list
    .filter((item) => typeof item === "string" && item.trim())
    .slice(0, 10);
}

function formatList(title, items) {
  return items.length > 0 ? `${title}: ${items.join(", ")}` : "";
}

function extractOpenAIText(result) {
  if (result?.choices?.[0]?.message?.content) {
    const text = result.choices[0].message.content.trim();
    if (text) return text;
  }

  if (result?.content) {
    const text = Array.isArray(result.content)
      ? result.content
          .map((c) => (typeof c.text === "string" ? c.text : ""))
          .join("\\n")
          .trim()
      : String(result.content).trim();
    if (text) return text;
  }

  return "";
}

// API endpoint - Error logging for client-side error boundaries
router.post("/log-error", errorLogLimiter, async (req, res) => {
  try {
    const {
      containerId,
      error,
      stack,
      context,
      timestamp,
      userAgent,
      url,
      errorCount,
    } = req.body;

    // Validate required fields
    if (!error || !containerId) {
      return res.status(400).json({
        success: false,
        message: "Missing required error information",
      });
    }

    // Create structured error log entry
    const errorLog = {
      type: "client_error_boundary",
      containerId: sanitizeString(containerId, 100),
      error: sanitizeString(error, 500),
      stack: sanitizeString(stack, 2000),
      context: sanitizeString(context, 200),
      timestamp: timestamp || new Date().toISOString(),
      userAgent: sanitizeString(userAgent, 500),
      url: sanitizeString(url, 500),
      errorCount: parseInt(errorCount) || 1,
      requestId: req.id,
      serverTimestamp: new Date().toISOString(),
    };

    // Log the error using the logger system
    logger.error("Client-side error boundary triggered", errorLog);

    // Also log to a special error boundary log for analysis
    logger.error("Error Boundary Report", {
      category: "error_boundary",
      severity: errorCount > 3 ? "critical" : "high",
      ...errorLog,
    });

    res.json({
      success: true,
      message: "Error logged successfully",
      errorId: req.id,
    });
  } catch (err) {
    logger.error("Error logging endpoint failed", {
      error: err.message,
      requestId: req.id,
    });

    res.status(500).json({
      success: false,
      message: "Failed to log error",
    });
  }
});

// API endpoint - Generate SOAP note
router.post(
  "/generate-soap",
  soapLimiter,
  validate(soapGenerationSchema),
  async (req, res) => {
    try {
      if (!process.env.OPENAI_API_KEY) {
        return res.status(503).json({
          success: false,
          message:
            "AI generation is not configured. Please set OPENAI_API_KEY.",
        });
      }

      const payload = req.body || {};

      const clientName = sanitizeString(payload.clientName, 100) || "NR";
      const sessionDate = sanitizeString(payload.sessionDate, 40) || "NR";
      const sessionDuration =
        sanitizeString(payload.sessionDuration, 40) || "NR";

      let sessionType = sanitizeString(payload.sessionType, 60);
      const sessionTypeOtherText = sanitizeString(
        payload.sessionTypeOtherText,
        120,
      );
      if (sessionType === "Other" && sessionTypeOtherText) {
        sessionType = sessionTypeOtherText;
      }
      sessionType = sessionType || "NR";

      const freeText = sanitizeString(payload.freeText, 3000) || "NR";
      const subjectiveNotes =
        sanitizeString(payload.subjectiveNotes, 800) || "NR";
      const objectiveNotes =
        sanitizeString(payload.objectiveNotes, 800) || "NR";
      const assessmentNotes =
        sanitizeString(payload.assessmentNotes, 800) || "NR";
      const planNotes = sanitizeString(payload.planNotes, 800) || "NR";

      const painScale = Number(payload.painScale || 0);
      const painScaleText =
        Number.isFinite(painScale) && painScale > 0 ? `${painScale}/10` : "NR";

      const subjectiveSymptoms = normalizeList(payload.subjectiveSymptoms);
      const aggravatingFactors = normalizeList(payload.aggravatingFactors);
      const relievingFactors = normalizeList(payload.relievingFactors);
      const objectiveFindings = normalizeList(payload.objectiveFindings);
      const assessmentImpression = normalizeList(payload.assessmentImpression);
      const treatmentProvided = normalizeList(payload.treatmentProvided);
      const homeCare = normalizeList(payload.homeCare);

      const promptLines = [
        "Session info:",
        `- Client: ${clientName}`,
        `- Date: ${sessionDate}`,
        `- Type: ${sessionType}`,
        `- Duration: ${sessionDuration}`,
        "",
        "Freeform summary:",
        freeText,
        "",
        "Quick prompts:",
        formatList("Subjective symptoms", subjectiveSymptoms),
        `Pain scale: ${painScaleText}`,
        formatList("Aggravating factors", aggravatingFactors),
        formatList("Relieving factors", relievingFactors),
        `Subjective notes: ${subjectiveNotes}`,
        formatList("Objective findings", objectiveFindings),
        `Objective notes: ${objectiveNotes}`,
        formatList("Assessment impression", assessmentImpression),
        `Assessment notes: ${assessmentNotes}`,
        formatList("Treatment provided", treatmentProvided),
        formatList("Home care", homeCare),
        `Plan notes: ${planNotes}`,
      ];

      const instructions = [
        "You are a clinical documentation assistant for massage therapy notes.",
        "Create a concise SOAP note in medical shorthand using only the provided information.",
        "Do not add new symptoms, diagnoses, vitals, or medications.",
        "If something is not provided, use NR (not reported).",
        "Output exactly 4 lines labeled S:, O:, A:, P:.",
        "Keep it brief and editable, no markdown or extra commentary.",
      ].join(" ");

      const model = process.env.OPENAI_MODEL || "gpt-4o";

      const response = await fetch("https://api.openai.com/v1/responses", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        },
        body: JSON.stringify({
          model,
          instructions,
          input: promptLines.join("\\n"),
          max_output_tokens: 500,
          temperature: 0.2,
        }),
      });

      const result = await response.json();
      if (!response.ok) {
        const message = result?.error?.message || "AI request failed";
        return res.status(500).json({ success: false, message });
      }

      const soapNote = extractOpenAIText(result);
      if (!soapNote) {
        return res.status(500).json({
          success: false,
          message: "AI response was empty. Please try again.",
        });
      }

      return res.json({ success: true, soapNote });
    } catch (error) {
      logger.error("SOAP generation error", {
        error: error.message,
        requestId: req.id,
      });
      return res.status(500).json({
        success: false,
        message: "An error occurred while generating the SOAP note.",
      });
    }
  },
);

// API endpoint - Submit form
router.post(
  "/submit-form",
  submitFormLimiter,
  (req, res, next) => {
    // Determine which validation schema to use based on form type
    const formType = req.body?.formType;
    const schema =
      formType === "feedback" ? feedbackFormSchema : intakeFormSchema;

    // Apply validation
    validate(schema)(req, res, next);
  },
  async (req, res) => {
    try {
      // formData is already validated and sanitized by Joi middleware
      const formData = sanitizeObject(req.body); // Additional XSS protection
      const isFeedbackForm = formData.formType === "feedback";

      // Create computed fields for compatibility with existing PDF generation
      if (formData.firstName && formData.lastName) {
        formData.fullName = `${formData.firstName} ${formData.lastName}`;
        formData.name = formData.fullName;
      }

      // Sanitize pregnancy weeks
      formData.pregnancy_weeks = sanitizeString(formData.pregnancy_weeks, 10);

      // Sanitize new Step 4 field
      formData.medicalCareDisclaimer = !!formData.medicalCareDisclaimer; // Convert to boolean

      // Require consent: support newer `consentAll` or legacy `termsAccepted`+`treatmentConsent`
      // Feedback forms don't require consent checkbox (just signature)
      const hasConsent =
        isFeedbackForm ||
        !!formData.consentAll ||
        (!!formData.termsAccepted && !!formData.treatmentConsent);
      if (!hasConsent) {
        return res
          .status(400)
          .json({ success: false, message: "Consent is required to proceed" });
      }

      // Signature is optional for both intake and feedback forms

      // E2E Test Mode: Mock successful submission without processing
      if (
        process.env.E2E_MODE === "true" ||
        req.headers["x-e2e-mode"] === "true"
      ) {
        logger.info("E2E Mode: Mocking form submission", {
          formType: req.body.formType,
          requestId: req.id,
        });
        return res.json({
          success: true,
          message: "Form submitted successfully (E2E mode)",
          fileId: "e2e-test-mock-id",
        });
      }

      // Generate PDF with PDFKit
      logger.info("Generating PDF", {
        formType: req.body.formType,
        clientName: req.body.firstName + " " + req.body.lastName,
        requestId: req.id,
      });
      const pdfBuffer = await pdfGenerator.generatePDF(formData);

      // Create filename: FULLNAME_DATE_TIME_FORMNAME.pdf
      const clientName = (formData.fullName || formData.name || "Client")
        .replace(/[^a-z0-9\\s]/gi, "") // Remove special chars
        .trim()
        .replace(/\\s+/g, "_"); // Replace spaces with underscores

      const now = new Date();
      const yyyy = now.getFullYear();
      const mm = String(now.getMonth() + 1).padStart(2, "0");
      const dd = String(now.getDate()).padStart(2, "0");
      const HH = String(now.getHours()).padStart(2, "0");
      const MM = String(now.getMinutes()).padStart(2, "0");
      const ss = String(now.getSeconds()).padStart(2, "0");

      const formType = formData.formType || "intake";
      let formName;
      if (formType === "feedback") {
        formName = "Post_Session_Feedback";
      } else {
        formName = "Client_Intake";
      }
      const filename = `${formName}_${clientName}_${yyyy}-${mm}-${dd}_${HH}${MM}${ss}.pdf`;

      // Upload to Google Drive (or save locally if not configured)
      logger.info("Uploading to Google Drive", { filename, requestId: req.id });
      const uploadResult = await driveUploader.uploadPDF(pdfBuffer, filename);

      logger.formSubmission(req.body, uploadResult);

      // Save metadata for analytics and update master files
      try {
        const metadata = await metadataStore.saveMetadata(formData, filename);
        logger.info("Metadata saved for analytics", {
          clientName: req.body.firstName + " " + req.body.lastName,
          requestId: req.id,
        });

        // Update master file with new entry
        await masterFileManager.appendToMasterFile(metadata, formData.formType);
        logger.info("Master file updated", { requestId: req.id });
      } catch (error) {
        logger.warn(
          "Failed to save metadata or update master file (non-fatal)",
          { error: error.message, requestId: req.id },
        );
      }

      res.json({
        success: true,
        message: "Form submitted successfully",
        fileId: uploadResult.fileId,
      });
    } catch (error) {
      logger.error("Error processing form", {
        error: error.message,
        requestId: req.id,
      });
      // Don't expose internal error details to client
      res.status(500).json({
        success: false,
        message:
          "An error occurred while processing your form. Please try again.",
      });
    }
  },
);

module.exports = router;
