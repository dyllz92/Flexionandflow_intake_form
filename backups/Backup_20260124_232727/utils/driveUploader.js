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
        this.folderId = process.env.GOOGLE_DRIVE_FOLDER_ID;
        this.allowLocalFallback = String(process.env.ALLOW_LOCAL_PDF_FALLBACK).toLowerCase() === 'true';
        
        // Try to initialize Google Drive API
        this.initialize();
    }
    
    initialize() {
        try {
            let credentials;

            // Check if credentials are provided as JSON string in env var (for cloud deployment)
            if (process.env.GOOGLE_SERVICE_ACCOUNT_KEY) {
                credentials = JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_KEY);
                console.log('✅ Using Google credentials from environment variable');
            } else {
                // Fall back to file path (for local development)
                const credentialsPath = process.env.GOOGLE_SERVICE_ACCOUNT_KEY_PATH || './google-credentials.json';

                if (fs.existsSync(credentialsPath)) {
                    credentials = JSON.parse(fs.readFileSync(credentialsPath, 'utf8'));
                    console.log('✅ Using Google credentials from file');
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
            console.error('⚠️  Error initializing Google Drive:', error.message);
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
            const fileMetadata = {
                name: filename,
                mimeType: 'application/pdf'
            };
            
            // Add to specific folder if configured
            if (this.folderId) {
                fileMetadata.parents = [this.folderId];
            }
            
            const media = {
                mimeType: 'application/pdf',
                body: require('stream').Readable.from(pdfBuffer)
            };
            
            const response = await this.drive.files.create({
                requestBody: fileMetadata,
                media: media,
                fields: 'id, webViewLink, webContentLink'
            });
            
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
            console.log('Falling back to local storage...');
            return await this.saveLocally(pdfBuffer, filename);
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
