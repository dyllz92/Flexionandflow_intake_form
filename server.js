const express = require("express");
const path = require("path");
const fs = require("fs");
const os = require("os");
const cors = require("cors");
require("dotenv").config();

const pdfGenerator = require("./utils/pdfGenerator");
const driveUploader = require("./utils/driveUploader");
const MetadataStore = require("./utils/metadataStore");
const MasterFileManager = require("./utils/masterFileManager");

const app = express();
const PORT = Number(process.env.PORT) || 3000;
const publicDir = path.join(__dirname, "public");
const distDir = path.join(__dirname, "dist");
const buildDir = path.join(__dirname, "build");
const spaDir = fs.existsSync(distDir)
  ? distDir
  : fs.existsSync(buildDir)
    ? buildDir
    : null;

function getLocalIPv4() {
  const nets = os.networkInterfaces();
  for (const name of Object.keys(nets)) {
    for (const net of nets[name] || []) {
      if (net.family === "IPv4" && !net.internal) return net.address;
    }
  }
  return null;
}

// Middleware
// CORS configuration - restrict origins in production
const corsOptions = {
  origin:
    process.env.NODE_ENV === "production"
      ? (process.env.ALLOWED_ORIGINS || "").split(",").filter(Boolean)
      : true, // Allow all origins in development
  credentials: true,
};
app.use(cors(corsOptions));
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));
app.use(express.static(publicDir));

// Serve a favicon to avoid 404 noise from browsers
app.get("/favicon.ico", (req, res) => {
  try {
    return res.sendFile(path.join(publicDir, "img", "Flexion_Flow_Logo.png"));
  } catch (err) {
    return res.status(204).end();
  }
});

// Ensure required directories exist
const requiredDirs = [
  path.join(__dirname, "metadata"),
  path.join(__dirname, "pdfs"),
  path.join(__dirname, "public"),
];

requiredDirs.forEach((dir) => {
  if (!fs.existsSync(dir)) {
    try {
      fs.mkdirSync(dir, { recursive: true });
      console.log(`[Init] Created directory: ${dir}`);
    } catch (error) {
      console.error(`[Init] Failed to create directory ${dir}:`, error.message);
    }
  }
});

// Initialize modules
const metadataStore = new MetadataStore(driveUploader);
const masterFileManager = new MasterFileManager();

// Serve built SPA assets when available
if (spaDir) {
  app.use(express.static(spaDir));
}

// Routes - Serve HTML pages
// Form type selection (Seated vs Table) - main landing page
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "views", "index.html"));
});

// Legacy route redirect
app.get("/select-form", (req, res) => {
  res.redirect("/");
});

app.get("/intake", (req, res) => {
  res.set("Cache-Control", "no-store");
  res.sendFile(path.join(__dirname, "views", "intake.html"));
});

app.get("/feedback", (req, res) => {
  res.set("Cache-Control", "no-store");
  res.sendFile(path.join(__dirname, "views", "feedback.html"));
});

app.get("/soap", (req, res) => {
  res.set("Cache-Control", "no-store");
  res.sendFile(path.join(__dirname, "views", "soap.html"));
});

// Static pages
app.get("/privacy", (req, res) => {
  res.sendFile(path.join(__dirname, "views", "privacy.html"));
});

app.get("/terms", (req, res) => {
  res.sendFile(path.join(__dirname, "views", "terms.html"));
});

// Diagnostics endpoint for deploy/version info
app.get("/__version", (req, res) => {
  res.json({
    commit: process.env.RAILWAY_GIT_COMMIT_SHA || null,
    branch: process.env.RAILWAY_GIT_BRANCH || null,
    time: new Date().toISOString(),
  });
});

// Deprecated routes: redirect to single intake form
app.get("/quick-form", (req, res) => {
  res.redirect("/intake");
});

app.get("/detailed-form", (req, res) => {
  res.redirect("/intake");
});

app.get("/success", (req, res) => {
  res.sendFile(path.join(__dirname, "views", "success.html"));
});

// Input validation helpers
function sanitizeString(str, maxLength = 500) {
  if (typeof str !== "string") return "";
  return str.trim().slice(0, maxLength);
}

function isValidEmail(email) {
  if (!email) return true; // Email is optional
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email) && email.length <= 254;
}

function isValidPhone(phone) {
  if (!phone) return false;
  // Allow digits, spaces, hyphens, parentheses, plus sign
  const phoneRegex = /^[\d\s\-()+ ]{6,20}$/;
  return phoneRegex.test(phone);
}

function normalizeList(value, maxItems = 24, maxLength = 120) {
  const list = Array.isArray(value) ? value : value ? [value] : [];
  return list
    .map((item) => sanitizeString(String(item), maxLength))
    .filter(Boolean)
    .slice(0, maxItems);
}

function formatList(label, items) {
  if (!items || items.length === 0) return `${label}: NR`;
  return `${label}: ${items.join(", ")}`;
}

function extractOpenAIText(payload) {
  if (!payload) return "";
  if (typeof payload.output_text === "string" && payload.output_text.trim()) {
    return payload.output_text.trim();
  }
  if (Array.isArray(payload.output)) {
    const text = payload.output
      .flatMap((item) => item.content || [])
      .filter((part) => part && part.type === "output_text" && part.text)
      .map((part) => part.text)
      .join("\n")
      .trim();
    if (text) return text;
  }
  return "";
}

// API endpoint - Generate SOAP note
app.post("/api/generate-soap", async (req, res) => {
  try {
    if (!process.env.OPENAI_API_KEY) {
      return res.status(503).json({
        success: false,
        message: "AI generation is not configured. Please set OPENAI_API_KEY.",
      });
    }

    const payload = req.body || {};

    const clientName = sanitizeString(payload.clientName, 100) || "NR";
    const sessionDate = sanitizeString(payload.sessionDate, 40) || "NR";
    const sessionDuration = sanitizeString(payload.sessionDuration, 40) || "NR";

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
    const objectiveNotes = sanitizeString(payload.objectiveNotes, 800) || "NR";
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

    const model = process.env.OPENAI_MODEL || "gpt-5.2";

    const response = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model,
        instructions,
        input: promptLines.join("\n"),
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
    console.error("SOAP generation error:", error.message);
    return res.status(500).json({
      success: false,
      message: "An error occurred while generating the SOAP note.",
    });
  }
});

app.post("/api/submit-form", async (req, res) => {
  try {
    const formData = req.body;
    const isFeedbackForm = formData.formType === "feedback";

    // Validate and sanitize name (support both firstName/lastName and legacy fullName)
    let fullName;
    if (formData.firstName && formData.lastName) {
      const firstName = sanitizeString(formData.firstName, 50);
      const lastName = sanitizeString(formData.lastName, 50);
      if (!firstName || firstName.length < 1) {
        return res.status(400).json({
          success: false,
          message: "Please provide a valid first name",
        });
      }
      if (!lastName || lastName.length < 1) {
        return res.status(400).json({
          success: false,
          message: "Please provide a valid last name",
        });
      }
      formData.firstName = firstName;
      formData.lastName = lastName;
      fullName = `${firstName} ${lastName}`;
    } else {
      fullName = sanitizeString(formData.name || formData.fullName, 100);
      if (!fullName || fullName.length < 2) {
        return res.status(400).json({
          success: false,
          message: "Please provide a valid name (at least 2 characters)",
        });
      }
    }
    formData.fullName = fullName;
    formData.name = fullName;

    // Validate email format (if provided)
    if (formData.email && !isValidEmail(formData.email)) {
      return res.status(400).json({
        success: false,
        message: "Please provide a valid email address",
      });
    }
    formData.email = sanitizeString(formData.email, 254);

    // Validate phone (required for intake forms)
    if (!isFeedbackForm && !isValidPhone(formData.mobile)) {
      return res.status(400).json({
        success: false,
        message: "Please provide a valid phone number",
      });
    }
    formData.mobile = sanitizeString(formData.mobile, 20);

    // NEW: Sanitize pronouns and gender fields
    formData.pronouns = sanitizeString(formData.pronouns, 50);
    formData.pronounsSelfDescribe = sanitizeString(
      formData.pronounsSelfDescribe,
      50,
    );
    formData.gender = sanitizeString(formData.gender, 50);
    formData.genderSelfDescribe = sanitizeString(
      formData.genderSelfDescribe,
      50,
    );
    formData.preferredName = sanitizeString(formData.preferredName, 50);

    // Sanitize text fields
    formData.reviewNote = sanitizeString(formData.reviewNote, 1000);
    formData.otherHealthConcernText = sanitizeString(
      formData.otherHealthConcernText,
      500,
    );
    formData.comments = sanitizeString(formData.comments, 2000);
    formData.occupation = sanitizeString(formData.occupation, 100);
    formData.medicationsList = sanitizeString(formData.medicationsList, 1000);
    formData.allergiesList = sanitizeString(formData.allergiesList, 1000);
    formData.conditionsDetails = sanitizeString(
      formData.conditionsDetails,
      2000,
    );
    formData.emergencyName = sanitizeString(formData.emergencyName, 100);
    formData.emergencyRelationship = sanitizeString(
      formData.emergencyRelationship,
      100,
    );
    formData.emergencyPhone = sanitizeString(formData.emergencyPhone, 20);

    // Sanitize new Step 2 fields
    formData.painLevel = formData.painLevel
      ? parseInt(formData.painLevel, 10)
      : null;
    formData.painNotSure = !!formData.painNotSure; // Convert to boolean
    formData.worseToday = sanitizeString(formData.worseToday, 20);
    formData.pressurePreference = sanitizeString(
      formData.pressurePreference,
      20,
    );
    formData.areasToAvoid = sanitizeString(formData.areasToAvoid, 500);

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

    // Signature is optional - no validation required

    // E2E Test Mode: Mock successful submission without processing
    if (
      process.env.E2E_MODE === "true" ||
      req.headers["x-e2e-mode"] === "true"
    ) {
      console.log("E2E Mode: Mocking form submission");
      return res.json({
        success: true,
        message: "Form submitted successfully (E2E mode)",
        fileId: "e2e-test-mock-id",
      });
    }

    // Generate PDF with PDFKit
    console.log("Generating PDF...");
    const pdfBuffer = await pdfGenerator.generatePDF(formData);

    // Create filename: FULLNAME_DATE_TIME_FORMNAME.pdf
    const clientName = (formData.fullName || formData.name || "Client")
      .replace(/[^a-z0-9\s]/gi, "") // Remove special chars
      .trim()
      .replace(/\s+/g, "_"); // Replace spaces with underscores

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
    console.log("Uploading to Google Drive...");
    const uploadResult = await driveUploader.uploadPDF(pdfBuffer, filename);

    console.log("Form submitted successfully:", uploadResult);

    // Save metadata for analytics and update master files
    try {
      const metadata = await metadataStore.saveMetadata(formData, filename);
      console.log("Metadata saved for analytics");

      // Update master file with new entry
      await masterFileManager.appendToMasterFile(metadata, formData.formType);
      console.log("Master file updated");
    } catch (error) {
      console.warn(
        "Failed to save metadata or update master file (non-fatal):",
        error.message,
      );
    }

    res.json({
      success: true,
      message: "Form submitted successfully",
      fileId: uploadResult.fileId,
    });
  } catch (error) {
    console.error("Error processing form:", error);
    // Don't expose internal error details to client
    res.status(500).json({
      success: false,
      message:
        "An error occurred while processing your form. Please try again.",
    });
  }
});

// Health check endpoint
const healthPayload = () => {
  try {
    return {
      status: "ok",
      timestamp: new Date().toISOString(),
      uptimeSeconds: Math.round(process.uptime()),
      googleDriveConfigured:
        driveUploader && typeof driveUploader.isConfigured === "function"
          ? driveUploader.isConfigured()
          : false,
    };
  } catch (error) {
    console.error("[Health] Error generating health payload:", error.message);
    return {
      status: "ok",
      timestamp: new Date().toISOString(),
      uptimeSeconds: Math.round(process.uptime()),
      googleDriveConfigured: false,
    };
  }
};

app.get("/health", (req, res) => {
  try {
    res.status(200).json(healthPayload());
  } catch (error) {
    console.error("[Health] Error in /health endpoint:", error.message);
    res
      .status(200)
      .json({ status: "ok", uptime: Math.round(process.uptime()) });
  }
});

app.get("/api/health", (req, res) => {
  try {
    res.status(200).json(healthPayload());
  } catch (error) {
    console.error("[Health] Error in /api/health endpoint:", error.message);
    res
      .status(200)
      .json({ status: "ok", uptime: Math.round(process.uptime()) });
  }
});

// Global error handling middleware for Express
app.use((err, req, res, next) => {
  console.error("[Express Error]", req.method, req.path);
  console.error("Error:", err.message);
  if (err.stack) console.error(err.stack);

  // Don't crash the server - return error response
  if (!res.headersSent) {
    res.status(err.status || 500).json({
      error:
        process.env.NODE_ENV === "production"
          ? "Internal server error"
          : err.message,
    });
  }
});

// SPA fallback for built frontend; keeps API routes untouched
if (spaDir) {
  app.get("*", (req, res, next) => {
    if (req.path.startsWith("/api")) return next();
    if (req.method !== "GET") return next();
    return res.sendFile(path.join(spaDir, "index.html"));
  });
}

// Log environment configuration for debugging
console.log("[Init] Environment Configuration:");
console.log(`  NODE_ENV: ${process.env.NODE_ENV || "development"}`);
console.log(`  PORT: ${PORT}`);
console.log(`  Google Drive configured: ${driveUploader.isConfigured()}`);
console.log(`  Public directory exists: ${fs.existsSync(publicDir)}`);

// Validate critical paths
const criticalPaths = [
  { path: publicDir, name: "public" },
  { path: path.join(__dirname, "metadata"), name: "metadata" },
  { path: path.join(__dirname, "pdfs"), name: "pdfs" },
  { path: path.join(__dirname, "views"), name: "views" },
  { path: path.join(__dirname, "utils"), name: "utils" },
];

console.log("[Init] Path Validation:");
for (const { path: p, name } of criticalPaths) {
  const exists = fs.existsSync(p);
  console.log(`  ${name}: ${exists ? "✓" : "✗"} ${p}`);
  if (!exists && (name === "views" || name === "utils" || name === "public")) {
    console.error(`[FATAL] Critical directory missing: ${name}`);
    process.exit(1);
  }
}

// Start server with error handling
// Listen on 0.0.0.0 to accept connections from any interface (required for Docker/Railway)
console.log("[Init] About to start listening on port", PORT);

const server = app.listen(PORT, "0.0.0.0", () => {
  console.log(
    `[Server] Callback triggered - server is now listening on port ${PORT}`,
  );

  const ip = getLocalIPv4();
  console.log(`\n${"=".repeat(50)}`);
  console.log(`Flexion and Flow Intake Form Server`);
  console.log(`${"=".repeat(50)}`);
  console.log(`\n Server running at:`);
  console.log(`   Local:   http://localhost:${PORT}`);
  console.log(`   Network: http://${ip ?? "localhost"}:${PORT}`);
  console.log(`\n To access from mobile devices:`);
  console.log(`   1. Make sure your phone is on the same WiFi`);
  console.log(`   2. Find your computer's IP address`);
  console.log(`   3. Open http://${ip ?? "localhost"}:${PORT} on your phone`);
  console.log(`\n For internet access, use ngrok or Cloudflare Tunnel`);
  console.log(`\n${"=".repeat(50)}\n`);

  console.log(
    "[Init] Server is fully initialized and ready to accept requests",
  );
});

console.log("[Init] app.listen() called, waiting for callback...");

// Keep-alive monitor to ensure the process doesn't exit unexpectedly
setInterval(() => {
  console.log(
    "[Monitor] Server still running, uptime:",
    Math.round(process.uptime()),
    "seconds",
  );
}, 30000); // Log every 30 seconds

// Final confirmation that module loaded successfully
console.log("[Init] Server module fully loaded, process will remain active");

server.on("error", (error) => {
  console.error("[Server] Error:", error.message);
  if (error.code === "EADDRINUSE") {
    console.error(`Port ${PORT} is already in use`);
  }
  process.exit(1);
});

// Error handling
process.on("uncaughtException", (error) => {
  console.error("[Process] Uncaught Exception:", error.message);
  console.error(error.stack);
  // Don't exit immediately - try to keep the server running
  console.error(
    "[Process] Attempting to continue running despite uncaught exception",
  );
});

process.on("unhandledRejection", (error) => {
  console.error("[Process] Unhandled Rejection:", error.message || error);
  if (error && error.stack) {
    console.error(error.stack);
  }
  // Don't exit immediately - try to keep the server running
  console.error(
    "[Process] Attempting to continue running despite unhandled rejection",
  );
});

// Graceful shutdown handling for Railway/Docker
process.on("SIGTERM", () => {
  console.log("[Server] SIGTERM received, shutting down gracefully...");
  server.close(() => {
    console.log("[Server] Server closed");
    process.exit(0);
  });
  // Force exit after 10 seconds
  setTimeout(() => {
    console.error("[Server] Forced exit due to timeout");
    process.exit(1);
  }, 10000);
});

process.on("SIGINT", () => {
  console.log("[Server] SIGINT received, shutting down gracefully...");
  server.close(() => {
    console.log("[Server] Server closed");
    process.exit(0);
  });
});
