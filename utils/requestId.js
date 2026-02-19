const crypto = require("crypto");

/**
 * Request ID tracking middleware
 * Adds unique request IDs to each request and includes them in logs
 */

function generateRequestId() {
  return crypto.randomBytes(8).toString("hex");
}

function requestIdMiddleware(req, res, next) {
  // Check if request already has an ID (from headers)
  req.id =
    req.get("X-Request-ID") || req.get("Request-ID") || generateRequestId();

  // Add to response headers for client tracking
  res.setHeader("X-Request-ID", req.id);

  // Store start time for duration tracking
  req.startTime = process.hrtime.bigint();

  // Override res.end to log request completion
  const originalEnd = res.end;
  res.end = function (...args) {
    // Calculate request duration
    if (req.startTime) {
      const duration =
        Number(process.hrtime.bigint() - req.startTime) / 1000000; // Convert to ms
      req.duration = Math.round(duration * 100) / 100; // Round to 2 decimal places
    }

    originalEnd.apply(this, args);
  };

  next();
}

module.exports = {
  requestIdMiddleware,
  generateRequestId,
};
