const fs = require('fs');
const path = require('path');
const { google } = require('googleapis');

/**
 * Google Drive uploader with fallback to local storage
 */
class DriveUploader {
    constructor() {
        this.configured = false;
        this.drive = null;
        this.folderId = process.env.GOOGLE_DRIVE_FOLDER_ID || '10iOVUY8J-h9GI9B14lmZ-QX42WyGQE4x';
        this.allowLocalFallback = String(process.env.ALLOW_LOCAL_PDF_FALLBACK).toLowerCase() === 'true';

        // Best practice: Use GOOGLE_SERVICE_ACCOUNT_KEY_PATH to point to your credentials file location.
        // Example: $env:GOOGLE_SERVICE_ACCOUNT_KEY_PATH = "utils/amplified-alpha-485305-u5-8deb1fe12e2a.json"

        // Log folderId/driveId for debugging (masking for safety)
        if (process.env.GOOGLE_DRIVE_FOLDER_ID) {
            const id = process.env.GOOGLE_DRIVE_FOLDER_ID;
            console.log(
                `ℹ️ GOOGLE_DRIVE_FOLDER_ID is set: ${id.slice(0, 6)}...${id.slice(-4)}`
            );
        } else {
            const id = this.folderId;
            console.log(
                `ℹ️ Using fallback folderId: ${id.slice(0, 6)}...${id.slice(-4)}`
            );
        }

        // Try to initialize Google Drive API
        this.initialize();
        /**
         * Defensive check: is the folderId a Shared Drive ID or a folder ID?
         * Shared Drive IDs start with '0A', folder IDs usually with '1' or '0B'
         */
        isLikelyDriveId(id) {
            return typeof id === 'string' && id.startsWith('0A') && id.length === 19;
        }
    }
    
    initialize() {
        try {
            let credentials;

            // Check if credentials are provided as JSON string in env var (for cloud deployment)
            if (process.env.GOOGLE_SERVICE_ACCOUNT_KEY) {
                credentials = JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_KEY);
                console.log('✅ Using Google credentials from environment variable');
            } else {
                // Fall back to file path (for local development or custom path)
                const credentialsPath = process.env.GOOGLE_SERVICE_ACCOUNT_KEY_PATH || './google-credentials.json';

                if (fs.existsSync(credentialsPath)) {
                    credentials = JSON.parse(fs.readFileSync(credentialsPath, 'utf8'));
                    console.log(`✅ Using Google credentials from file: ${credentialsPath}`);
                }
            }

            if (credentials) {
                const auth = new google.auth.GoogleAuth({
                    credentials,
                    scopes: ['https://www.googleapis.com/auth/drive.file']
                });

                this.drive = google.drive({ version: 'v3', auth });
                this.configured = true;
                console.log('✅ Google Drive API configured successfully');
            } else {
                console.log('⚠️  Google Drive not configured - PDFs will be saved locally');
                console.log('   Add GOOGLE_SERVICE_ACCOUNT_KEY env var or google-credentials.json to enable');
            }
        } catch (error) {
            console.error('⚠️  Error initializing Google Drive:', error);
            console.log('   PDFs will be saved locally instead');
            this.configured = false;
        }
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
            if (this.isLikelyDriveId(this.folderId)) {
                console.log(
                    `ℹ️ Treating folderId as a Shared Drive ID (likely root of a Shared Drive): ${this.folderId.slice(0, 6)}...${this.folderId.slice(-4)}`
                );
            } else {
                console.log(
                    `ℹ️ Treating folderId as a folder ID: ${this.folderId.slice(0, 6)}...${this.folderId.slice(-4)}`
                );
            }
            return await this.uploadToGoogleDrive(pdfBuffer, filename);
        } else {
            if (this.allowLocalFallback) {
                console.log('⚠️  Google Drive not configured - using local fallback by env setting');
                return await this.saveLocally(pdfBuffer, filename);
            }
            throw new Error('Google Drive is not configured and local fallback is disabled. Set ALLOW_LOCAL_PDF_FALLBACK=true to allow local saves.');
        }
    }
    
    /**
     * Upload to Google Drive
     */
    async uploadToGoogleDrive(pdfBuffer, filename) {
        try {
            let fileMetadata = {
                name: filename,
                mimeType: 'application/pdf'
            };

            let createParams = {
                requestBody: fileMetadata,
                media: {
                    mimeType: 'application/pdf',
                    body: require('stream').Readable.from(pdfBuffer)
                },
                fields: 'id, webViewLink, webContentLink',
                supportsAllDrives: true
            };

            // If folderId is a likely drive ID, upload to the root of the Shared Drive
            if (this.isLikelyDriveId(this.folderId)) {
                // For Shared Drive root, do NOT set parents, but set driveId
                createParams.driveId = this.folderId;
                createParams.includeItemsFromAllDrives = true;
                createParams.corpora = 'drive';
                // No parents: uploads to root of the Shared Drive
                console.log('ℹ️ Uploading to root of Shared Drive (no parents set)');
            } else if (this.folderId) {
                // For a folder (in My Drive or Shared Drive), set parents
                fileMetadata.parents = [this.folderId];
                console.log('ℹ️ Uploading to folder:', this.folderId.slice(0, 6) + '...' + this.folderId.slice(-4));
            }

            const response = await this.drive.files.create(createParams);

            console.log(`✅ Uploaded to Google Drive: ${filename}`);
            console.log(`   File ID: ${response.data.id}`);

            return {
                success: true,
                method: 'google-drive',
                fileId: response.data.id,
                webViewLink: response.data.webViewLink,
                filename: filename
            };

        } catch (error) {
            console.error('Error uploading to Google Drive:', error.message);
            if (error.response && error.response.data) {
                console.error('Google API response:', error.response.data);
            }
            console.error('Failed filename:', filename);
            console.log('Falling back to local storage...');
            return await this.saveLocally(pdfBuffer, filename);
        }
        /**
         * Preflight check: verify the target folder or drive exists and is accessible.
         * Logs the result.
         */
        async verifyTarget() {
            if (!this.configured || !this.drive) {
                console.log('Google Drive not configured, cannot verify target.');
                return false;
            }
            try {
                if (this.isLikelyDriveId(this.folderId)) {
                    // Shared Drive IDs cannot be checked with files.get
                    console.log('Target is a Shared Drive ID. To check root, list files or folders in the drive.');
                    // Optionally, list root files to check access
                    const res = await this.drive.files.list({
                        driveId: this.folderId,
                        includeItemsFromAllDrives: true,
                        supportsAllDrives: true,
                        corpora: 'drive',
                        pageSize: 1
                    });
                    if (res && res.status === 200) {
                        console.log('✅ Able to list files in Shared Drive root.');
                        return true;
                    }
                    console.log('⚠️  Could not list files in Shared Drive root.');
                    return false;
                } else {
                    // Check if folder exists and is a folder
                    const res = await this.drive.files.get({
                        fileId: this.folderId,
                        fields: 'id, name, mimeType',
                        supportsAllDrives: true
                    });
                    if (res && res.data && res.data.mimeType === 'application/vnd.google-apps.folder') {
                        console.log(`✅ Target folder exists: ${res.data.name} (${res.data.id})`);
                        return true;
                    } else {
                        console.log('⚠️  Target exists but is not a folder:', res.data);
                        return false;
                    }
                }
            } catch (error) {
                console.error('Error verifying target:', error.message);
                if (error.response && error.response.data) {
                    console.error('Google API response:', error.response.data);
                }
                return false;
            }
        }
    }
    
    /**
     * Save PDF locally as fallback
     */
    async saveLocally(pdfBuffer, filename) {
        try {
            const pdfsDir = path.join(__dirname, '..', 'pdfs');
            
            // Create pdfs directory if it doesn't exist
            if (!fs.existsSync(pdfsDir)) {
                fs.mkdirSync(pdfsDir, { recursive: true });
            }
            
            const filepath = path.join(pdfsDir, filename);
            fs.writeFileSync(filepath, pdfBuffer);
            
            console.log(`💾 Saved locally: ${filename}`);
            console.log(`   Location: ${filepath}`);
            
            return {
                success: true,
                method: 'local',
                filepath: filepath,
                filename: filename
            };
            
        } catch (error) {
            console.error('Error saving PDF locally:', error);
            throw new Error('Failed to save PDF: ' + error.message);
        }
    }
}

// Export singleton instance
module.exports = new DriveUploader();
