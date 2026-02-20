const logger = require("./logger");

/**
 * Environment variable validation and configuration
 */
class Config {
  constructor() {
    this.config = {};
    this.errors = [];
    this.warnings = [];

    this.validate();
  }

  /**
   * Validate environment variables and set defaults
   */
  validate() {
    // Required environment variables
    this.validateRequired("NODE_ENV", "development", [
      "development",
      "production",
      "test",
    ]);
    this.validateRequired("PORT", "3000", null, "number");

    // Optional but recommended for production
    if (this.config.NODE_ENV === "production") {
      this.validateProduction();
    }

    // Google Drive configuration - skip in development
    if (process.env.NODE_ENV !== "development") {
      this.validateGoogleDrive();
    }

    // OpenAI configuration (optional)
    this.validateOpenAI();

    // CORS configuration
    this.validateCORS();

    // Log level
    this.validateLogLevel();

    // PDF storage configuration
    this.validatePDFStorage();

    // Report results
    this.reportResults();
  }

  /**
   * Validate a required environment variable
   */
  validateRequired(
    key,
    defaultValue = null,
    allowedValues = null,
    type = "string",
  ) {
    let value = process.env[key];

    if (!value && defaultValue !== null) {
      value = defaultValue;
      this.warnings.push(`${key} not set, using default: ${defaultValue}`);
    }

    if (!value) {
      this.errors.push(`Required environment variable ${key} is not set`);
      return;
    }

    // Type conversion and validation
    if (type === "number") {
      const numValue = Number(value);
      if (isNaN(numValue)) {
        this.errors.push(`${key} must be a valid number, got: ${value}`);
        return;
      }
      value = numValue;
    } else if (type === "boolean") {
      value = value.toLowerCase() === "true";
    }

    // Validate allowed values
    if (allowedValues && !allowedValues.includes(value)) {
      this.errors.push(
        `${key} must be one of: ${allowedValues.join(", ")}, got: ${value}`,
      );
      return;
    }

    this.config[key] = value;
    process.env[key] = String(value); // Ensure it's set in process.env
  }

  /**
   * Validate production-specific requirements
   */
  validateProduction() {
    // In production, we want more strict configuration
    if (!process.env.ALLOWED_ORIGINS) {
      this.warnings.push(
        "ALLOWED_ORIGINS not set in production - CORS will be restrictive",
      );
    }

    // Recommend setting log level in production
    if (!process.env.LOG_LEVEL) {
      this.validateRequired("LOG_LEVEL", "info", [
        "error",
        "warn",
        "info",
        "debug",
      ]);
    }

    // Check if we have any storage method configured
    const hasGoogleDrive = this.hasGoogleDriveConfig();
    const hasLocalFallback = process.env.ALLOW_LOCAL_PDF_FALLBACK === "true";

    if (!hasGoogleDrive && !hasLocalFallback) {
      this.errors.push(
        "In production, either Google Drive must be configured or ALLOW_LOCAL_PDF_FALLBACK must be enabled",
      );
    }
  }

  /**
   * Validate Google Drive configuration
   */
  validateGoogleDrive() {
    const hasKeyPath = process.env.GOOGLE_SERVICE_ACCOUNT_KEY_PATH;
    const hasKeyEnv = process.env.GOOGLE_SERVICE_ACCOUNT_KEY;
    const hasFolderId = process.env.GOOGLE_DRIVE_FOLDER_ID;

    if (!hasKeyPath && !hasKeyEnv) {
      this.warnings.push(
        "Google Drive not configured - PDFs will be saved locally if ALLOW_LOCAL_PDF_FALLBACK is enabled",
      );
      return;
    }

    // If key is provided, validate folder ID
    if ((hasKeyPath || hasKeyEnv) && !hasFolderId) {
      this.warnings.push(
        "GOOGLE_DRIVE_FOLDER_ID not set - files will be saved to root of Google Drive",
      );
    }

    // Validate JSON format of service account key if provided as env var
    if (hasKeyEnv) {
      try {
        const parsed = JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_KEY);
        if (!parsed.type || !parsed.project_id || !parsed.client_email) {
          this.errors.push(
            "GOOGLE_SERVICE_ACCOUNT_KEY does not appear to be a valid service account key",
          );
        }
      } catch (error) {
        this.errors.push("GOOGLE_SERVICE_ACCOUNT_KEY is not valid JSON");
      }
    }

    this.config.googleDriveConfigured = this.hasGoogleDriveConfig();
  }

  /**
   * Check if Google Drive is configured
   */
  hasGoogleDriveConfig() {
    return !!(
      process.env.GOOGLE_SERVICE_ACCOUNT_KEY_PATH ||
      process.env.GOOGLE_SERVICE_ACCOUNT_KEY
    );
  }

  /**
   * Validate OpenAI configuration
   */
  validateOpenAI() {
    const hasApiKey = process.env.OPENAI_API_KEY;
    const model = process.env.OPENAI_MODEL || "gpt-4o";

    if (!hasApiKey) {
      this.warnings.push(
        "OPENAI_API_KEY not set - SOAP note generation will be disabled",
      );
    } else {
      // Basic API key format validation
      if (!hasApiKey.startsWith("sk-")) {
        this.warnings.push(
          "OPENAI_API_KEY does not appear to be in the correct format (should start with sk-)",
        );
      }
    }

    this.config.openAIConfigured = !!hasApiKey;
    this.config.openAIModel = model;
  }

  /**
   * Validate CORS configuration
   */
  validateCORS() {
    const allowedOrigins = process.env.ALLOWED_ORIGINS;

    if (allowedOrigins) {
      const origins = allowedOrigins
        .split(",")
        .map((origin) => origin.trim())
        .filter(Boolean);

      // Validate each origin is a proper URL or localhost
      const invalidOrigins = origins.filter((origin) => {
        try {
          new URL(origin);
          return false;
        } catch {
          // Allow localhost patterns
          return (
            !origin.match(/^https?:\/\/localhost:\d+$/) &&
            !origin.match(/^https?:\/\/127\.0\.0\.1:\d+$/)
          );
        }
      });

      if (invalidOrigins.length > 0) {
        this.warnings.push(
          `Invalid CORS origins detected: ${invalidOrigins.join(", ")}`,
        );
      }

      this.config.allowedOrigins = origins;
    }
  }

  /**
   * Validate log level configuration
   */
  validateLogLevel() {
    const logLevel = process.env.LOG_LEVEL;
    const validLevels = ["error", "warn", "info", "debug"];

    if (logLevel && !validLevels.includes(logLevel)) {
      this.warnings.push(
        `Invalid LOG_LEVEL: ${logLevel}. Valid levels: ${validLevels.join(", ")}`,
      );
    }

    this.config.logLevel =
      logLevel || (this.config.NODE_ENV === "production" ? "info" : "debug");
  }

  /**
   * Validate PDF storage configuration
   */
  validatePDFStorage() {
    const allowLocalFallback = process.env.ALLOW_LOCAL_PDF_FALLBACK === "true";
    const hasGoogleDrive = this.hasGoogleDriveConfig();

    if (!hasGoogleDrive && !allowLocalFallback) {
      this.errors.push(
        "No PDF storage method configured. Either set up Google Drive or enable ALLOW_LOCAL_PDF_FALLBACK",
      );
    }

    this.config.allowLocalFallback = allowLocalFallback;
  }

  /**
   * Report validation results
   */
  reportResults() {
    if (this.errors.length > 0) {
      logger.error("Environment validation failed", { errors: this.errors });
      throw new Error(
        `Environment validation failed:\n${this.errors.join("\n")}`,
      );
    }

    if (this.warnings.length > 0) {
      logger.warn("Environment validation warnings", {
        warnings: this.warnings,
      });
    }

    logger.info("Environment validation completed", {
      nodeEnv: this.config.NODE_ENV,
      port: this.config.PORT,
      googleDriveConfigured: this.config.googleDriveConfigured,
      openAIConfigured: this.config.openAIConfigured,
      allowLocalFallback: this.config.allowLocalFallback,
    });
  }

  /**
   * Get configuration value
   */
  get(key) {
    return this.config[key];
  }

  /**
   * Get all configuration
   */
  getAll() {
    return { ...this.config };
  }

  /**
   * Check if the application is in production mode
   */
  isProduction() {
    return this.config.NODE_ENV === "production";
  }

  /**
   * Check if the application is in development mode
   */
  isDevelopment() {
    return this.config.NODE_ENV === "development";
  }

  /**
   * Check if the application is in test mode
   */
  isTest() {
    return this.config.NODE_ENV === "test";
  }
}

// Create and validate configuration
let config;
try {
  config = new Config();
} catch (error) {
  console.error("Failed to validate environment configuration:", error.message);
  process.exit(1);
}

module.exports = config;
