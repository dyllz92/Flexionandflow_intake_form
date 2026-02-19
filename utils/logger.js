const winston = require("winston");
const path = require("path");

// Create logs directory if it doesn't exist
const fs = require("fs");
const logsDir = path.join(__dirname, "..", "logs");
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

// Custom format for console output
const consoleFormat = winston.format.combine(
  winston.format.colorize(),
  winston.format.timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
  winston.format.printf(({ timestamp, level, message, ...meta }) => {
    let msg = `${timestamp} [${level}]: ${message}`;

    // Add metadata if present
    const metaStr =
      Object.keys(meta).length > 0 ? ` ${JSON.stringify(meta)}` : "";
    return msg + metaStr;
  }),
);

// Custom format for file output
const fileFormat = winston.format.combine(
  winston.format.timestamp(),
  winston.format.json(),
);

// Determine log level based on environment
const logLevel =
  process.env.LOG_LEVEL ||
  (process.env.NODE_ENV === "production" ? "info" : "debug");

// Create the logger
const logger = winston.createLogger({
  level: logLevel,
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.splat(),
  ),
  defaultMeta: {
    service: "flexion-flow-intake",
    version: require("../package.json").version,
  },
  transports: [
    // Console output
    new winston.transports.Console({
      format: consoleFormat,
    }),

    // Error log file
    new winston.transports.File({
      filename: path.join(logsDir, "error.log"),
      level: "error",
      format: fileFormat,
      maxsize: 5242880, // 5MB
      maxFiles: 3,
    }),

    // Combined log file
    new winston.transports.File({
      filename: path.join(logsDir, "combined.log"),
      format: fileFormat,
      maxsize: 5242880, // 5MB
      maxFiles: 5,
    }),
  ],
});

// In production, don't log to console
if (process.env.NODE_ENV === "production") {
  logger.clear();
  logger.add(
    new winston.transports.File({
      filename: path.join(logsDir, "error.log"),
      level: "error",
      format: fileFormat,
      maxsize: 5242880,
      maxFiles: 3,
    }),
  );
  logger.add(
    new winston.transports.File({
      filename: path.join(logsDir, "combined.log"),
      format: fileFormat,
      maxsize: 5242880,
      maxFiles: 5,
    }),
  );
}

// Add custom log methods for common use cases
logger.request = (req, meta = {}) => {
  logger.info("HTTP Request", {
    method: req.method,
    url: req.originalUrl || req.url,
    ip: req.ip || req.connection?.remoteAddress,
    userAgent: req.get("User-Agent"),
    requestId: req.id,
    ...meta,
  });
};

logger.response = (req, res, meta = {}) => {
  logger.info("HTTP Response", {
    method: req.method,
    url: req.originalUrl || req.url,
    statusCode: res.statusCode,
    responseTime: res.get("X-Response-Time"),
    requestId: req.id,
    ...meta,
  });
};

logger.formSubmission = (formData, result, meta = {}) => {
  logger.info("Form Submission", {
    formType: formData.formType,
    clientName: formData.firstName + " " + formData.lastName,
    email: formData.email,
    success: result.success,
    filename: result.filename,
    uploadedToDrive: result.driveFileId ? true : false,
    ...meta,
  });
};

logger.driveUpload = (filename, result, meta = {}) => {
  logger.info("Drive Upload", {
    filename,
    fileId: result.id,
    webViewLink: result.webViewLink,
    size: result.size,
    ...meta,
  });
};

module.exports = logger;
