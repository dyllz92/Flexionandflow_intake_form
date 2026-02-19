const express = require("express");
const path = require("path");
const fs = require("fs");
const logger = require("../utils/logger");

const router = express.Router();

// Define views directory
const viewsDir = path.join(__dirname, "..", "views");

// Helper function to send HTML files
const sendHtml = (res, filename) => {
  const filePath = path.join(viewsDir, filename);
  res.sendFile(filePath, (err) => {
    if (err) {
      logger.error(`Error sending ${filename}`, { error: err.message });
      res.status(404).send("Page not found");
    }
  });
};

// Page routes
router.get("/", (req, res) => {
  sendHtml(res, "index.html");
});

router.get("/select-form", (req, res) => {
  sendHtml(res, "index.html");
});

router.get("/intake", (req, res) => {
  sendHtml(res, "intake.html");
});

router.get("/feedback", (req, res) => {
  sendHtml(res, "feedback.html");
});

router.get("/soap", (req, res) => {
  sendHtml(res, "soap.html");
});

router.get("/success", (req, res) => {
  sendHtml(res, "success.html");
});

router.get("/privacy", (req, res) => {
  sendHtml(res, "privacy.html");
});

router.get("/terms", (req, res) => {
  sendHtml(res, "terms.html");
});

router.get("/quick-form", (req, res) => {
  sendHtml(res, "intake.html");
});

router.get("/detailed-form", (req, res) => {
  sendHtml(res, "intake.html");
});

module.exports = router;
