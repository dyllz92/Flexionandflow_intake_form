const fs = require('fs');
const path = require('path');

/**
 * MetadataStore - Manages JSON metadata files for analytics
 * Stores alongside PDFs in both Google Drive and local filesystem
 */
class MetadataStore {
  constructor(driveUploader) {
    this.driveUploader = driveUploader;
    this.metadataCache = new Map();
    this.cacheTimestamp = null;
    this.CACHE_TTL = 5 * 60 * 1000; // 5 minutes
  }

  /**
   * Extract analytics-relevant fields from form data
   */
  extractAnalyticsFields(formData) {
    const health = Array.isArray(formData.healthChecks)
      ? formData.healthChecks
      : (formData.healthChecks ? [formData.healthChecks] : []);

    return {
      filename: null, // Set by caller
      submissionDate: new Date().toISOString(),
      formType: formData.formType || 'seated',
      client: {
        fullName: formData.fullName || formData.name || 'Unknown',
        mobile: formData.mobile || null,
        email: formData.email || null,
        gender: formData.gender || null
      },
      ao: {
        role: formData.aoRole || null,
        feelingPre: parseInt(formData.feelingPre) || null,
        firstTimeAOWellness: formData.firstTimeAOWellness || null,
        therapistName: formData.therapistName || null
      },
      bodyMap: {
        marksCount: formData.muscleMapMarks ?
          (typeof formData.muscleMapMarks === 'string'
            ? JSON.parse(formData.muscleMapMarks).length
            : formData.muscleMapMarks.length)
          : 0
      },
      preferences: {
        pressure: formData.pressurePreference || null
      },
      tableSpecific: {
        oilPreference: formData.tableOilPreference || null,
        positionComfort: formData.tablePositionComfort || null
      },
      health: {
        healthChecks: health,
        hasReviewNote: !!formData.reviewNote,
        hasAvoidNotes: !!formData.avoidNotes
      },
      marketing: {
        emailOptIn: formData.emailOptIn === true || formData.emailOptIn === 'on',
        smsOptIn: formData.smsOptIn === true || formData.smsOptIn === 'on'
      },
      consent: {
        consentAll: formData.consentAll === true || formData.consentAll === 'on'
      },
      feedback: {
        feelingPost: parseInt(formData.feelingPost) || null,
        wouldRecommend: formData.wouldRecommend || null,
        hasComments: !!formData.feedbackComments,
        comments: formData.feedbackComments || null
      }
    };
  }

  /**
   * Save metadata alongside PDF
   */
  async saveMetadata(formData, pdfFilename) {
    try {
      // Extract analytics fields
      const metadata = this.extractAnalyticsFields(formData);
      metadata.filename = pdfFilename;

      // Generate JSON filename from PDF filename
      const jsonFilename = pdfFilename.replace('.pdf', '.json');

      // Convert to JSON buffer
      const jsonBuffer = Buffer.from(JSON.stringify(metadata, null, 2));

      // Upload to both Google Drive and local storage
      if (this.driveUploader) {
        try {
          await this.driveUploader.uploadMetadata(jsonBuffer, jsonFilename);
        } catch (error) {
          console.error('Failed to upload metadata to Google Drive:', error.message);
          // Fall through to local save
        }
      }

      // Also save locally
      const localMetadataDir = path.join(__dirname, '..', 'metadata');

      // Create metadata directory if it doesn't exist
      if (!fs.existsSync(localMetadataDir)) {
        fs.mkdirSync(localMetadataDir, { recursive: true });
      }

      const localPath = path.join(localMetadataDir, jsonFilename);
      fs.writeFileSync(localPath, JSON.stringify(metadata, null, 2));

      // Invalidate cache
      this.clearCache();

      console.log(`Metadata saved: ${jsonFilename}`);
      return metadata;
    } catch (error) {
      console.error('Error saving metadata:', error);
      throw error;
    }
  }

  /**
   * Load all metadata from local storage
   */
  loadLocalMetadata() {
    const metadataDir = path.join(__dirname, '..', 'metadata');
    const metadata = [];

    if (!fs.existsSync(metadataDir)) {
      return metadata;
    }

    try {
      const files = fs.readdirSync(metadataDir).filter(f => f.endsWith('.json'));

      for (const file of files) {
        try {
          const content = fs.readFileSync(path.join(metadataDir, file), 'utf8');
          const data = JSON.parse(content);
          metadata.push(data);
        } catch (error) {
          console.error(`Error parsing metadata file ${file}:`, error.message);
        }
      }
    } catch (error) {
      console.error('Error reading metadata directory:', error);
    }

    return metadata;
  }

  /**
   * List all metadata (with caching)
   * Prefers Google Drive, falls back to local storage
   */
  async listAllMetadata() {
    // Check cache
    if (this.metadataCache.size > 0 && this.cacheTimestamp &&
        Date.now() - this.cacheTimestamp < this.CACHE_TTL) {
      return Array.from(this.metadataCache.values());
    }

    let allMetadata = [];

    // Try loading from Google Drive first
    if (this.driveUploader && this.driveUploader.isConfigured()) {
      try {
        console.log('[Analytics] Loading metadata from Google Drive...');
        allMetadata = await this.driveUploader.loadAllMetadataFromDrive();
      } catch (error) {
        console.error('[Analytics] Error loading from Google Drive:', error.message);
        // Fall through to local storage
      }
    }

    // Fall back to local storage if Google Drive returned nothing
    if (allMetadata.length === 0) {
      console.log('[Analytics] Falling back to local metadata storage...');
      allMetadata = this.loadLocalMetadata();
    }

    // Update cache
    this.metadataCache.clear();
    for (const item of allMetadata) {
      const key = item.filename || `unknown_${Date.now()}`;
      this.metadataCache.set(key, item);
    }
    this.cacheTimestamp = Date.now();

    console.log(`[Analytics] Loaded ${allMetadata.length} total metadata records`);
    return allMetadata;
  }

  /**
   * Get metadata by date range
   */
  async getMetadataByDateRange(startDate, endDate) {
    const allMetadata = await this.listAllMetadata();

    return allMetadata.filter(item => {
      const submissionDate = new Date(item.submissionDate);
      return submissionDate >= startDate && submissionDate <= endDate;
    });
  }

  /**
   * Clear cache
   */
  clearCache() {
    this.metadataCache.clear();
    this.cacheTimestamp = null;
  }
}

module.exports = MetadataStore;
