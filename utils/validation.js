const Joi = require("joi");

// Common validation schemas
const nameSchema = Joi.string().trim().min(1).max(50).required();
const emailSchema = Joi.string().email().required();
const phoneSchema = Joi.string().trim().min(10).max(20).allow("").optional();
const dateSchema = Joi.date().iso().optional();
const textAreaSchema = Joi.string().trim().max(2000).allow("").optional();
const requiredTextAreaSchema = Joi.string().trim().min(1).max(2000).required();

// Schema for client intake form submission
const intakeFormSchema = Joi.object({
  // Form metadata
  formType: Joi.string().valid("intake").required(),
  selectedBrand: Joi.string().valid("flexion", "hemisphere").required(),

  // Step 1: Personal Information
  firstName: nameSchema,
  lastName: nameSchema,
  email: emailSchema,
  mobile: phoneSchema,
  dateOfBirth: dateSchema,
  gender: Joi.string()
    .valid("Male", "Female", "Other", "Prefer not to say")
    .required(),
  emergencyContactName: Joi.string().trim().max(100).allow("").optional(),
  emergencyContactPhone: phoneSchema,

  // Step 2: Visit Information
  visitGoal: Joi.array().items(Joi.string().max(100)).max(10).optional(),
  visitGoalOther: Joi.string().max(200).allow("").optional(),
  exerciseFrequency: Joi.string()
    .valid(
      "Never",
      "Very Low (1 day per week)",
      "Low (2 days per week)",
      "Moderate (3-4 days per week)",
      "High (5-6 days per week)",
      "Very High (Daily)",
      "Athlete (Multiple times per day)",
    )
    .allow("")
    .optional(),
  exerciseType: Joi.array().items(Joi.string().max(100)).max(15).optional(),
  exerciseTypeOther: Joi.string().max(200).allow("").optional(),
  sleepQuality: Joi.number().integer().min(1).max(10).optional(),
  stressLevel: Joi.number().integer().min(1).max(10).optional(),
  lifestyleFactors: textAreaSchema,

  // Step 3: Health Information
  medicalConditions: Joi.array()
    .items(Joi.string().max(100))
    .max(50)
    .optional(),
  medicalConditionsOther: Joi.string().max(500).allow("").optional(),
  seenOtherProvider: Joi.string().valid("yes", "no").allow("").optional(),
  otherProviderDetails: textAreaSchema,
  allergies: textAreaSchema,
  medications: textAreaSchema,

  // Step 4: Pain/Symptoms Information
  painLevel: Joi.number().integer().min(0).max(10).optional(),
  painAreas: Joi.array().items(Joi.string().max(100)).max(20).optional(),
  painAreasOther: Joi.string().max(200).allow("").optional(),
  symptomDescriptors: Joi.array()
    .items(Joi.string().max(100))
    .max(30)
    .optional(),
  symptomDescriptorsOther: Joi.string().max(200).allow("").optional(),
  painHistory: textAreaSchema,
  muscleMapData: Joi.string().max(10000).allow("").optional(), // JSON string of muscle map selections

  // Step 5: Consent
  consentTreatment: Joi.boolean().valid(true).required(),
  consentMarketing: Joi.boolean().optional(),
  signature: Joi.string().max(50000).allow("").optional(), // Base64 signature data

  // Optional fields that might be added dynamically
  additionalNotes: textAreaSchema,
  referralSource: Joi.string().max(100).allow("").optional(),
});

// Schema for feedback form submission
const feedbackFormSchema = Joi.object({
  // Form metadata
  formType: Joi.string().valid("feedback").required(),

  // Session information
  clientName: Joi.string().trim().min(1).max(100).required(),
  sessionDate: Joi.date().iso().required(),
  sessionType: Joi.string().max(100).required(),
  sessionTypeOther: Joi.string().max(200).allow("").optional(),
  sessionDuration: Joi.string().max(50).required(),

  // Feedback
  overallSatisfaction: Joi.number().integer().min(1).max(10).required(),
  painRelief: Joi.number().integer().min(1).max(10).optional(),
  therapistRating: Joi.number().integer().min(1).max(10).required(),
  facilityRating: Joi.number().integer().min(1).max(10).required(),

  // Text feedback
  positiveAspects: textAreaSchema,
  improvements: textAreaSchema,
  additionalComments: textAreaSchema,

  // Recommendation
  wouldRecommend: Joi.string().valid("yes", "no", "maybe").required(),

  // Contact info for follow-up
  email: emailSchema.optional(),
  allowFollowUp: Joi.boolean().optional(),
});

// Schema for SOAP note generation
const soapGenerationSchema = Joi.object({
  // Client and session info
  clientName: Joi.string().trim().min(1).max(100).required(),
  sessionDate: Joi.string().required(),
  sessionType: Joi.string().max(100).required(),
  sessionTypeOther: Joi.string().max(200).allow("").optional(),
  sessionDuration: Joi.string().max(50).required(),

  // SOAP components
  freeText: Joi.string().max(3000).allow("").optional(),
  subjectiveNotes: Joi.string().max(800).allow("").optional(),
  objectiveNotes: Joi.string().max(800).allow("").optional(),
  assessmentNotes: Joi.string().max(800).allow("").optional(),
  planNotes: Joi.string().max(800).allow("").optional(),

  // Pain assessment
  painScale: Joi.number().integer().min(0).max(10).optional(),

  // Arrays for quick selections
  subjectiveSymptoms: Joi.array()
    .items(Joi.string().max(100))
    .max(20)
    .optional(),
  aggravatingFactors: Joi.array()
    .items(Joi.string().max(100))
    .max(10)
    .optional(),
  relievingFactors: Joi.array().items(Joi.string().max(100)).max(10).optional(),
  objectiveFindings: Joi.array()
    .items(Joi.string().max(100))
    .max(20)
    .optional(),
  assessmentImpression: Joi.array()
    .items(Joi.string().max(100))
    .max(10)
    .optional(),
  treatmentProvided: Joi.array()
    .items(Joi.string().max(100))
    .max(20)
    .optional(),
  homeCare: Joi.array().items(Joi.string().max(100)).max(10).optional(),
});

/**
 * Validation middleware factory
 * @param {Joi.Schema} schema - Joi schema to validate against
 * @param {string} property - Property of req to validate (default: 'body')
 * @returns {Function} Express middleware function
 */
function validate(schema, property = "body") {
  return (req, res, next) => {
    const { error, value } = schema.validate(req[property], {
      abortEarly: false, // Include all errors, not just the first
      stripUnknown: true, // Remove unknown fields
      convert: true, // Convert strings to appropriate types
    });

    if (error) {
      const errors = error.details.map((detail) => ({
        field: detail.path.join("."),
        message: detail.message,
        value: detail.context?.value,
      }));

      return res.status(400).json({
        success: false,
        message: "Validation failed",
        errors: errors,
      });
    }

    // Replace req[property] with the validated and sanitized value
    req[property] = value;
    next();
  };
}

/**
 * Sanitize HTML input to prevent XSS
 * @param {string} input - Input string to sanitize
 * @returns {string} Sanitized string
 */
function sanitizeHtml(input) {
  if (typeof input !== "string") return input;

  return input
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#x27;")
    .replace(/\//g, "&#x2F;");
}

/**
 * Deep sanitize an object's string properties
 * @param {Object} obj - Object to sanitize
 * @returns {Object} Sanitized object
 */
function sanitizeObject(obj) {
  if (!obj || typeof obj !== "object") return obj;

  if (Array.isArray(obj)) {
    return obj.map((item) =>
      typeof item === "string" ? sanitizeHtml(item) : sanitizeObject(item),
    );
  }

  const sanitized = {};
  for (const [key, value] of Object.entries(obj)) {
    if (typeof value === "string") {
      sanitized[key] = sanitizeHtml(value);
    } else if (typeof value === "object") {
      sanitized[key] = sanitizeObject(value);
    } else {
      sanitized[key] = value;
    }
  }

  return sanitized;
}

module.exports = {
  intakeFormSchema,
  feedbackFormSchema,
  soapGenerationSchema,
  validate,
  sanitizeHtml,
  sanitizeObject,
};
