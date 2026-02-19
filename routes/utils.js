const express = require("express");
const path = require("path");
const fs = require("fs");
const logger = require("../utils/logger");
const config = require("../utils/config");

const router = express.Router();

// Health check payload function
const healthPayload = () => {
  try {
    const pkg = require("../package.json");
    const publicDir = path.join(__dirname, "..", "public");

    // Check various system components
    const checks = {
      drive: require("../utils/driveUploader").isConfigured
        ? require("../utils/driveUploader").isConfigured()
        : false,
      directories: {
        public: fs.existsSync(publicDir),
        metadata: fs.existsSync(path.join(__dirname, "..", "metadata")),
        pdfs: fs.existsSync(path.join(__dirname, "..", "pdfs")),
        views: fs.existsSync(path.join(__dirname, "..", "views")),
      },
      environment: {
        nodeEnv: config.get("NODE_ENV"),
        port: config.get("PORT"),
        googleDriveConfigured: config.get("googleDriveConfigured"),
        openAIConfigured: config.get("openAIConfigured"),
        allowLocalFallback: config.get("allowLocalFallback"),
      },
    };

    // Determine overall health status
    const allDirsExist = Object.values(checks.directories).every(Boolean);
    const hasStorage = checks.drive || checks.environment.allowLocalFallback;
    const isHealthy = allDirsExist && hasStorage;

    return {
      status: isHealthy ? "healthy" : "degraded",
      timestamp: new Date().toISOString(),
      version: pkg.version,
      nodeVersion: process.version,
      uptimeSeconds: Math.round(process.uptime()),
      environment: process.env.NODE_ENV || "development",
      checks,
      memory: {
        used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
        total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024),
        rss: Math.round(process.memoryUsage().rss / 1024 / 1024),
      },
    };
  } catch (error) {
    logger.error("Error generating health payload", { error: error.message });
    return {
      status: "error",
      timestamp: new Date().toISOString(),
      uptimeSeconds: Math.round(process.uptime()),
      error: "Health check failed",
    };
  }
};

// Health check endpoints
router.get("/health", (req, res) => {
  try {
    const health = healthPayload();
    const statusCode =
      health.status === "healthy"
        ? 200
        : health.status === "degraded"
          ? 200
          : 503;

    res.status(statusCode).json(health);
  } catch (error) {
    logger.error("Error in /health endpoint", {
      error: error.message,
      requestId: req.id,
    });
    res.status(503).json({
      status: "error",
      timestamp: new Date().toISOString(),
      uptime: Math.round(process.uptime()),
      error: "Health check failed",
    });
  }
});

router.get("/api/health", (req, res) => {
  try {
    const health = healthPayload();
    const statusCode =
      health.status === "healthy"
        ? 200
        : health.status === "degraded"
          ? 200
          : 503;

    res.status(statusCode).json(health);
  } catch (error) {
    logger.error("Error in /api/health endpoint", {
      error: error.message,
      requestId: req.id,
    });
    res.status(503).json({
      status: "error",
      timestamp: new Date().toISOString(),
      uptime: Math.round(process.uptime()),
      error: "Health check failed",
    });
  }
});

// Version endpoint
router.get("/__version", (req, res) => {
  try {
    const pkg = require("../package.json");
    res.json({
      name: pkg.name,
      version: pkg.version,
      nodeVersion: process.version,
      environment: process.env.NODE_ENV || "development",
    });
  } catch (error) {
    logger.error("Error in /__version endpoint", {
      error: error.message,
      requestId: req.id,
    });
    res.status(500).json({ error: "Could not retrieve version information" });
  }
});

// Favicon handler
router.get("/favicon.ico", (req, res) => {
  const faviconPath = path.join(
    __dirname,
    "..",
    "public",
    "img",
    "favicon.ico",
  );

  if (fs.existsSync(faviconPath)) {
    res.sendFile(faviconPath);
  } else {
    // Send a 204 No Content response if favicon doesn't exist
    res.status(204).end();
  }
});

module.exports = router;
