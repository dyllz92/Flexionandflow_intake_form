const fs = require("fs");
const path = require("path");
const { Readable } = require("stream");
const { google } = require("googleapis");
const logger = require("./logger");

/**
 * Google Drive uploader with fallback to local storage
 */
class DriveUploader {
  constructor() {
    this.configured = false;
    this.drive = null;
    this.folderId = process.env.GOOGLE_DRIVE_FOLDER_ID || null;
    this.allowLocalFallback =
      String(process.env.ALLOW_LOCAL_PDF_FALLBACK).toLowerCase() === "true";

    if (!this.folderId) {
      logger.warn(
        "GOOGLE_DRIVE_FOLDER_ID not set - uploads will default to Drive root",
      );
    }

    // Best practice: Use GOOGLE_SERVICE_ACCOUNT_KEY_PATH to point to your credentials file location.
    // Example: $env:GOOGLE_SERVICE_ACCOUNT_KEY_PATH = "utils/amplified-alpha-485305-u5-8deb1fe12e2a.json"

    try {
      let credentials = null;
      const credentialsPath = process.env.GOOGLE_SERVICE_ACCOUNT_KEY_PATH;

      if (credentialsPath) {
        try {
          const absPath = path.isAbsolute(credentialsPath)
            ? credentialsPath
            : path.resolve(__dirname, "..", credentialsPath);
          const raw = fs.readFileSync(absPath, "utf8");
          credentials = JSON.parse(raw);
          logger.info("Using Google credentials from file", {
            path: credentialsPath,
          });
        } catch (e) {
          logger.warn("Could not load credentials from path", {
            path: credentialsPath,
            error: e.message,
          });
        }
      }

      if (!credentials && process.env.GOOGLE_SERVICE_ACCOUNT_KEY) {
        try {
          credentials = JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_KEY);
          console.log(
            `✅ Using Google credentials from GOOGLE_SERVICE_ACCOUNT_KEY env var`,
          );
        } catch (e) {
          logger.warn(
            "Could not parse GOOGLE_SERVICE_ACCOUNT_KEY environment variable",
          );
        }
      }

      if (credentials) {
        const auth = new google.auth.GoogleAuth({
          credentials,
          scopes: ["https://www.googleapis.com/auth/drive.file"],
        });

        this.drive = google.drive({ version: "v3", auth });
        this.configured = true;
        logger.info("Google Drive API configured successfully");
      } else {
        logger.warn("Google Drive not configured - PDFs will be saved locally");
        logger.info(
          "Add GOOGLE_SERVICE_ACCOUNT_KEY env var or google-credentials.json to enable",
        );
      }
    } catch (error) {
      logger.error("Error initializing Google Drive", { error: error.message });
      logger.info("PDFs will be saved locally instead");
      this.configured = false;
    }
  }

  isLikelyDriveId(id) {
    // Shared Drive IDs are typically 19 characters long and start with a digit
    // Regular folder IDs can vary, but are generally shorter or have different patterns
    return id && id.length === 19 && /^\d/.test(id);
  }

  isConfigured() {
    return this.configured;
  }

  /**
   * Upload PDF to Google Drive or save locally
   * @param {Buffer} pdfBuffer - The PDF file buffer
   * @param {String} filename - The filename for the PDF
   * @returns {Promise<Object>} Upload result
   */
  async uploadPDF(pdfBuffer, filename) {
    if (this.configured && this.drive) {
      // Log what we're treating the folderId as
      if (this.folderId && this.isLikelyDriveId(this.folderId)) {
        console.log(
          `ℹ️ Treating folderId as a Shared Drive ID (likely root of a Shared Drive): ${this.folderId.slice(0, 6)}...${this.folderId.slice(-4)}`,
        );
      } else if (this.folderId) {
        console.log(
          `ℹ️ Treating folderId as a folder ID: ${this.folderId.slice(0, 6)}...${this.folderId.slice(-4)}`,
        );
      } else {
        console.log(
          "ℹ️ No folder ID configured; uploading to default Drive root",
        );
      }
      return await this.uploadToGoogleDrive(pdfBuffer, filename);
    } else {
      if (this.allowLocalFallback) {
        console.log(
          "⚠️  Google Drive not configured - using local fallback by env setting",
        );
        return await this.saveLocally(pdfBuffer, filename);
      }
      throw new Error(
        "Google Drive is not configured and local fallback is disabled. Set ALLOW_LOCAL_PDF_FALLBACK=true to allow local saves.",
      );
    }
  }

  /**
   * Upload to Google Drive
   */
  async uploadToGoogleDrive(pdfBuffer, filename) {
    try {
      let fileMetadata = {
        name: filename,
        mimeType: "application/pdf",
      };

      let createParams = {
        requestBody: fileMetadata,
        media: {
          mimeType: "application/pdf",
          body: Readable.from(pdfBuffer),
        },
        fields: "id, webViewLink, webContentLink",
        supportsAllDrives: true,
      };

      // If folderId is a likely drive ID, upload to the root of the Shared Drive
      if (this.isLikelyDriveId(this.folderId)) {
        // For Shared Drive root, do NOT set parents, but set driveId
        createParams.driveId = this.folderId;
        createParams.includeItemsFromAllDrives = true;
        createParams.corpora = "drive";
        // No parents: uploads to root of the Shared Drive
        logger.info("Uploading to root of Shared Drive (no parents set)");
      } else if (this.folderId) {
        // For a folder (in My Drive or Shared Drive), set parents
        fileMetadata.parents = [this.folderId];
        logger.info("Uploading to folder", {
          folderId: this.folderId.slice(0, 6) + "..." + this.folderId.slice(-4),
        });
      }

      const response = await this.drive.files.create(createParams);

      logger.driveUpload(filename, response.data);

      return {
        success: true,
        method: "google-drive",
        fileId: response.data.id,
        webViewLink: response.data.webViewLink,
        filename: filename,
      };
    } catch (error) {
      logger.error("Error uploading to Google Drive", {
        error: error.message,
        filename,
        apiResponse: error.response?.data,
      });

      if (this.allowLocalFallback) {
        logger.info(
          "Falling back to local storage (ALLOW_LOCAL_PDF_FALLBACK=true)",
        );
        return await this.saveLocally(pdfBuffer, filename);
      }

      throw new Error(
        "Google Drive upload failed and local fallback is disabled. Set ALLOW_LOCAL_PDF_FALLBACK=true to allow local saves.",
      );
    }
  }

  /**
   * Preflight check: verify the target folder or drive exists and is accessible.
   * Logs the result.
   */
  async verifyTarget() {
    if (!this.configured || !this.drive) {
      console.log("Google Drive not configured, cannot verify target.");
      return false;
    }
    try {
      if (this.isLikelyDriveId(this.folderId)) {
        // Shared Drive IDs cannot be checked with files.get
        console.log(
          "Target is a Shared Drive ID. To check root, list files or folders in the drive.",
        );
        // Optionally, list root files to check access
        const res = await this.drive.files.list({
          driveId: this.folderId,
          includeItemsFromAllDrives: true,
          supportsAllDrives: true,
          corpora: "drive",
          pageSize: 1,
        });
        if (res && res.status === 200) {
          console.log("✅ Able to list files in Shared Drive root.");
          return true;
        }
        console.log("⚠️  Could not list files in Shared Drive root.");
        return false;
      } else {
        // Check if folder exists and is a folder
        const res = await this.drive.files.get({
          fileId: this.folderId,
          fields: "id, name, mimeType",
          supportsAllDrives: true,
        });
        if (
          res &&
          res.data &&
          res.data.mimeType === "application/vnd.google-apps.folder"
        ) {
          console.log(
            `✅ Target folder exists: ${res.data.name} (${res.data.id})`,
          );
          return true;
        } else {
          console.log("⚠️  Target exists but is not a folder:", res.data);
          return false;
        }
      }
    } catch (error) {
      console.error("Error verifying target:", error.message);
      if (error.response && error.response.data) {
        console.error("Google API response:", error.response.data);
      }
      return false;
    }
  }
  /**
   * Upload metadata (JSON) to Google Drive or save locally
   * @param {Buffer} metadataBuffer - The JSON file buffer
   * @param {String} filename - The filename for the metadata JSON
   * @returns {Promise<Object>} Upload result
   */
  async uploadMetadata(metadataBuffer, filename) {
    if (this.configured && this.drive) {
      return await this.uploadMetadataToGoogleDrive(metadataBuffer, filename);
    } else {
      return await this.saveMetadataLocally(metadataBuffer, filename);
    }
  }

  /**
   * Upload metadata to Google Drive
   */
  async uploadMetadataToGoogleDrive(metadataBuffer, filename) {
    try {
      let fileMetadata = {
        name: filename,
        mimeType: "application/json",
      };

      let createParams = {
        requestBody: fileMetadata,
        media: {
          mimeType: "application/json",
          body: Readable.from(metadataBuffer),
        },
        fields: "id",
        supportsAllDrives: true,
      };

      // Same logic as PDFs
      if (this.isLikelyDriveId(this.folderId)) {
        createParams.driveId = this.folderId;
        createParams.includeItemsFromAllDrives = true;
        createParams.corpora = "drive";
      } else if (this.folderId) {
        fileMetadata.parents = [this.folderId];
      }

      const response = await this.drive.files.create(createParams);

      console.log(`✅ Uploaded metadata to Google Drive: ${filename}`);
      return {
        success: true,
        method: "google-drive",
        fileId: response.data.id,
        filename: filename,
      };
    } catch (error) {
      console.error("Error uploading metadata to Google Drive:", error.message);
      console.log("Falling back to local metadata storage...");
      return await this.saveMetadataLocally(metadataBuffer, filename);
    }
  }

  /**
   * Save metadata JSON locally
   */
  async saveMetadataLocally(metadataBuffer, filename) {
    try {
      // Use Google Drive synced folder if available, otherwise use local metadata
      const googleDrivePath =
        process.env.GOOGLE_DRIVE_LOCAL_PATH ||
        "G:\\Shared drives\\App Uploads\\Intake Forms";
      let metadataDir;

      // Check if Google Drive path exists and is accessible
      if (fs.existsSync(googleDrivePath)) {
        metadataDir = path.join(googleDrivePath, "metadata");
        console.log("💾 Using Google Drive synced path for metadata saves");
      } else {
        metadataDir = path.join(__dirname, "..", "metadata");
        console.log("💾 Using local metadata folder");
      }

      // Create metadata directory if it doesn't exist
      if (!fs.existsSync(metadataDir)) {
        fs.mkdirSync(metadataDir, { recursive: true });
      }

      const filepath = path.join(metadataDir, filename);
      fs.writeFileSync(filepath, metadataBuffer);

      console.log(`💾 Saved metadata locally: ${filename}`);
      return {
        success: true,
        method: "local",
        filepath: filepath,
        filename: filename,
      };
    } catch (error) {
      console.error("Error saving metadata locally:", error);
      throw new Error("Failed to save metadata: " + error.message);
    }
  }

  /**
   * List all metadata JSON files from Google Drive
   * @returns {Promise<Array>} Array of file objects with id and name
   */
  async listMetadataFiles() {
    if (!this.configured || !this.drive) {
      console.log("Google Drive not configured, cannot list metadata files.");
      return [];
    }

    try {
      const files = [];
      let pageToken = null;

      do {
        const params = {
          q: "mimeType='application/json' and name contains '.json' and trashed=false",
          fields: "nextPageToken, files(id, name, createdTime)",
          pageSize: 100,
          supportsAllDrives: true,
          includeItemsFromAllDrives: true,
        };

        // Add folder/drive context
        if (this.isLikelyDriveId(this.folderId)) {
          params.driveId = this.folderId;
          params.corpora = "drive";
        } else if (this.folderId) {
          params.q += ` and '${this.folderId}' in parents`;
        }

        if (pageToken) {
          params.pageToken = pageToken;
        }

        const response = await this.drive.files.list(params);

        if (response.data.files) {
          files.push(...response.data.files);
        }

        pageToken = response.data.nextPageToken;
      } while (pageToken);

      console.log(`📂 Found ${files.length} metadata files in Google Drive`);
      return files;
    } catch (error) {
      console.error(
        "Error listing metadata files from Google Drive:",
        error.message,
      );
      return [];
    }
  }

  /**
   * Download and parse a metadata JSON file from Google Drive
   * @param {string} fileId - The Google Drive file ID
   * @returns {Promise<Object|null>} Parsed JSON object or null on error
   */
  async downloadMetadataFile(fileId) {
    if (!this.configured || !this.drive) {
      return null;
    }

    try {
      const response = await this.drive.files.get({
        fileId: fileId,
        alt: "media",
        supportsAllDrives: true,
      });

      return response.data;
    } catch (error) {
      console.error(
        `Error downloading metadata file ${fileId}:`,
        error.message,
      );
      return null;
    }
  }

  /**
   * Load all metadata from Google Drive
   * @returns {Promise<Array>} Array of metadata objects
   */
  async loadAllMetadataFromDrive() {
    const files = await this.listMetadataFiles();
    const metadata = [];

    for (const file of files) {
      try {
        const data = await this.downloadMetadataFile(file.id);
        if (data) {
          metadata.push(data);
        }
      } catch (error) {
        console.error(`Error loading metadata ${file.name}:`, error.message);
      }
    }

    console.log(
      `✅ Loaded ${metadata.length} metadata records from Google Drive`,
    );
    return metadata;
  }

  /**
   * Save PDF locally as fallback
   */
  async saveLocally(pdfBuffer, filename) {
    try {
      // Use Google Drive synced folder if available, otherwise use local pdfs
      const googleDrivePath =
        process.env.GOOGLE_DRIVE_LOCAL_PATH ||
        "G:\\Shared drives\\App Uploads\\Intake Forms";
      let pdfsDir;

      // Check if Google Drive path exists and is accessible
      if (fs.existsSync(googleDrivePath)) {
        pdfsDir = googleDrivePath;
        console.log("💾 Using Google Drive synced path for local saves");
      } else {
        pdfsDir = path.join(__dirname, "..", "pdfs");
        console.log("💾 Using local pdfs folder");
      }

      // Create directory if it doesn't exist
      if (!fs.existsSync(pdfsDir)) {
        fs.mkdirSync(pdfsDir, { recursive: true });
      }

      const filepath = path.join(pdfsDir, filename);
      fs.writeFileSync(filepath, pdfBuffer);

      console.log(`💾 Saved locally: ${filename}`);
      console.log(`   Location: ${filepath}`);

      return {
        success: true,
        method: "local",
        filepath: filepath,
        filename: filename,
      };
    } catch (error) {
      console.error("Error saving PDF locally:", error);
      throw new Error("Failed to save PDF: " + error.message);
    }
  }
}

// Export singleton instance
module.exports = new DriveUploader();
