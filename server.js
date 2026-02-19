const express = require("express");
const path = require("path");
const fs = require("fs");
const os = require("os");
const cors = require("cors");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
require("dotenv").config();

// Validate environment configuration early
const config = require("./utils/config");

const pdfGenerator = require("./utils/pdfGenerator");
const driveUploader = require("./utils/driveUploader");
const MetadataStore = require("./utils/metadataStore");
const MasterFileManager = require("./utils/masterFileManager");
const logger = require("./utils/logger");
const { requestIdMiddleware } = require("./utils/requestId");

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
const isProduction = process.env.NODE_ENV === "production";
const allowedOrigins = (process.env.ALLOWED_ORIGINS || "")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

if (isProduction && allowedOrigins.length === 0) {
  console.warn(
    "[CORS] NODE_ENV=production but ALLOWED_ORIGINS is empty. Only same-origin requests will be allowed.",
  );
}

const corsOptions = {
  origin: (origin, callback) => {
    if (!isProduction) return callback(null, true);

    // Allow same-origin / server-to-server requests without an Origin header
    if (!origin) return callback(null, true);

    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }

    return callback(new Error("Not allowed by CORS"));
  },
  credentials: true,
};
app.use(cors(corsOptions));

// Add request ID tracking early in the middleware chain
app.use(requestIdMiddleware);

app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "'unsafe-inline'", "https://cdn.jsdelivr.net"],
        styleSrc: [
          "'self'",
          "'unsafe-inline'",
          "https://cdn.jsdelivr.net",
          "https://fonts.googleapis.com",
        ],
        fontSrc: ["'self'", "https://fonts.gstatic.com"],
        imgSrc: ["'self'", "data:"],
        connectSrc: ["'self'"],
      },
    },
  }),
);
app.use(express.json({ limit: "2mb" }));
app.use(express.urlencoded({ extended: true, limit: "2mb" }));
app.use(express.static(publicDir));

// Request/Response logging middleware
app.use((req, res, next) => {
  // Log incoming request
  logger.request(req);

  // Override res.end to log response
  const originalEnd = res.end;
  res.end = function (...args) {
    logger.response(req, res, {
      duration: req.duration,
      contentLength: res.get("Content-Length"),
    });
    originalEnd.apply(this, args);
  };

  next();
});

// Basic API abuse protection
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 300,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: "Too many API requests. Please try again shortly.",
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

app.use("/api", apiLimiter);

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
      logger.info("Directory created", { path: dir });
    } catch (error) {
      logger.error("Failed to create directory", {
        path: dir,
        error: error.message,
      });
    }
  }
});

// Initialize modules
const metadataStore = new MetadataStore(driveUploader);
const masterFileManager = new MasterFileManager();

// Import route modules
const pageRoutes = require("./routes/pages");
const apiRoutes = require("./routes/api");
const utilRoutes = require("./routes/utils");

// Serve built SPA assets when available
if (spaDir) {
  app.use(express.static(spaDir));
}

// Mount route modules
app.use(utilRoutes); // Utility routes (health, version, favicon)
app.use("/api", apiRoutes); // API routes with /api prefix
app.use(pageRoutes); // Page routes

// All other routes are now handled by the route modules above

// Global error handling middleware for Express
app.use((err, req, res, next) => {
  logger.error("Express Error", {
    method: req.method,
    path: req.path,
    error: err.message,
    stack: err.stack,
    requestId: req.id,
  });

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
logger.info("Environment Configuration", {
  NODE_ENV: process.env.NODE_ENV || "development",
  PORT: PORT,
  googleDriveConfigured: driveUploader.isConfigured(),
  publicDirectoryExists: fs.existsSync(publicDir),
});

// Validate critical paths
const criticalPaths = [
  { path: publicDir, name: "public" },
  { path: path.join(__dirname, "metadata"), name: "metadata" },
  { path: path.join(__dirname, "pdfs"), name: "pdfs" },
  { path: path.join(__dirname, "views"), name: "views" },
  { path: path.join(__dirname, "utils"), name: "utils" },
];

logger.info("Path Validation");
for (const { path: p, name } of criticalPaths) {
  const exists = fs.existsSync(p);
  logger.info("Path check", { name, exists, path: p });
  if (!exists && (name === "views" || name === "utils" || name === "public")) {
    logger.error("Critical directory missing", { name, path: p });
    process.exit(1);
  }
}

// Start server with error handling
// Listen on 0.0.0.0 to accept connections from any interface (required for Docker/Railway)
logger.info("Starting server", { port: PORT });

const server = app.listen(PORT, "0.0.0.0", () => {
  logger.info("Server callback triggered", { port: PORT });

  const ip = getLocalIPv4();
  logger.info("Server started successfully", {
    port: PORT,
    localUrl: `http://localhost:${PORT}`,
    networkUrl: `http://${ip ?? "localhost"}:${PORT}`,
    nodeEnv: process.env.NODE_ENV || "development",
  });

  // Only show detailed startup message in development
  if (process.env.NODE_ENV !== "production") {
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
  }

  logger.info("Server fully initialized and ready to accept requests");
});

logger.info("Server listen called, waiting for callback");

// Final confirmation that module loaded successfully
logger.info("Server module fully loaded, process will remain active");

server.on("error", (error) => {
  logger.error("Server error", { error: error.message, code: error.code });
  if (error.code === "EADDRINUSE") {
    logger.error("Port already in use", { port: PORT });
  }
  process.exit(1);
});

// Error handling
process.on("uncaughtException", (error) => {
  logger.error("Uncaught Exception", {
    error: error.message,
    stack: error.stack,
  });
  // Gracefully shut down - continuing after an uncaught exception can leave
  // the process in an undefined state. Let the process manager restart us.
  logger.error("Shutting down due to uncaught exception");
  server.close(() => {
    process.exit(1);
  });
  // Force exit after 5 seconds if graceful shutdown stalls
  setTimeout(() => {
    logger.error("Forced exit after uncaught exception");
    process.exit(1);
  }, 5000);
});

process.on("unhandledRejection", (error) => {
  logger.error("Unhandled Rejection", {
    error: error.message || error,
    stack: error && error.stack,
  });
  // Treat unhandled rejections the same as uncaught exceptions
  logger.error("Shutting down due to unhandled rejection");
  server.close(() => {
    process.exit(1);
  });
  setTimeout(() => {
    logger.error("Forced exit after unhandled rejection");
    process.exit(1);
  }, 5000);
});

// Graceful shutdown handling for Railway/Docker
process.on("SIGTERM", () => {
  logger.info("SIGTERM received, shutting down gracefully");
  server.close(() => {
    logger.info("Server closed");
    process.exit(0);
  });
  // Force exit after 10 seconds
  setTimeout(() => {
    logger.error("Forced exit due to timeout");
    process.exit(1);
  }, 10000);
});

process.on("SIGINT", () => {
  logger.info("SIGINT received, shutting down gracefully");
  server.close(() => {
    logger.info("Server closed");
    process.exit(0);
  });
});
