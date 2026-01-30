const fs = require('fs');
const path = require('path');

/**
 * MasterFileManager - Automatically updates master JSON files with new submissions
 * Maintains master_feedback.json and master_intakes.json with aggregated data
 */
class MasterFileManager {
  constructor() {
    this.pdfDir = path.join(__dirname, '..', 'pdfs');
    this.masterFeedbackPath = path.join(this.pdfDir, 'master_feedback.json');
    this.masterIntakesPath = path.join(this.pdfDir, 'master_intakes.json');
  }

  /**
   * Get the appropriate master file path based on form type
   */
  getMasterFilePath(formType) {
    if (formType === 'feedback') {
      return this.masterFeedbackPath;
    }
    // seated, table, or any other intake form types
    return this.masterIntakesPath;
  }

  /**
   * Read current master file safely
   */
  readMasterFile(filePath) {
    try {
      if (!fs.existsSync(filePath)) {
        console.log(`[MasterFile] Creating new master file: ${filePath}`);
        return [];
      }

      const content = fs.readFileSync(filePath, 'utf8');
      let data = JSON.parse(content);

      // Ensure it's an array
      if (!Array.isArray(data)) {
        console.warn(`[MasterFile] Master file was not an array, converting...`);
        data = [data];
      }

      return data;
    } catch (error) {
      console.error(`[MasterFile] Error reading master file ${filePath}:`, error.message);
      throw new Error(`Failed to read master file: ${error.message}`);
    }
  }

  /**
   * Write master file with backup
   */
  writeMasterFile(filePath, data) {
    try {
      // Create backup if file exists
      if (fs.existsSync(filePath)) {
        const backupPath = `${filePath}.backup`;
        fs.copyFileSync(filePath, backupPath);
        console.log(`[MasterFile] Backup created: ${backupPath}`);
      }

      // Ensure pdfs directory exists
      if (!fs.existsSync(this.pdfDir)) {
        fs.mkdirSync(this.pdfDir, { recursive: true });
      }

      // Write new data
      fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
      console.log(`[MasterFile] Updated: ${filePath} with ${data.length} entries`);

      return true;
    } catch (error) {
      console.error(`[MasterFile] Error writing master file ${filePath}:`, error.message);
      throw new Error(`Failed to write master file: ${error.message}`);
    }
  }

  /**
   * Check if entry already exists by filename
   */
  entryExists(entries, filename) {
    return entries.some(entry => entry.filename === filename);
  }

  /**
   * Append metadata to appropriate master file
   */
  async appendToMasterFile(metadata, formType) {
    try {
      const filePath = this.getMasterFilePath(formType);

      console.log(`[MasterFile] Appending to ${formType} master file...`);

      // Read current master file
      let entries = this.readMasterFile(filePath);

      // Check for duplicates
      if (this.entryExists(entries, metadata.filename)) {
        console.warn(`[MasterFile] Entry already exists: ${metadata.filename}, skipping duplicate`);
        return { success: true, isDuplicate: true, entries: entries };
      }

      // Append new entry
      entries.push(metadata);

      // Write updated file
      this.writeMasterFile(filePath, entries);

      console.log(`[MasterFile] Successfully added entry for ${metadata.filename}`);
      return { success: true, isDuplicate: false, entries: entries };
    } catch (error) {
      console.error('[MasterFile] Error appending to master file:', error.message);
      // Don't throw - log as non-fatal error since individual metadata is already saved
      console.warn('[MasterFile] Submission successful but master file update failed. File can be re-aggregated later.');
      return { success: false, error: error.message };
    }
  }

  /**
   * Rebuild master files from individual metadata files
   * Useful for fixing or re-aggregating master files
   */
  rebuildMasterFiles() {
    try {
      const metadataDir = path.join(__dirname, '..', 'metadata');

      if (!fs.existsSync(metadataDir)) {
        console.log('[MasterFile] No metadata directory found, creating empty master files...');
        this.writeMasterFile(this.masterFeedbackPath, []);
        this.writeMasterFile(this.masterIntakesPath, []);
        return { success: true, message: 'Empty master files created' };
      }

      const feedbackEntries = [];
      const intakeEntries = [];

      const files = fs.readdirSync(metadataDir).filter(f => f.endsWith('.json'));

      for (const file of files) {
        try {
          const content = fs.readFileSync(path.join(metadataDir, file), 'utf8');
          const data = JSON.parse(content);

          if (data.formType === 'feedback') {
            feedbackEntries.push(data);
          } else {
            // seated, table, etc. - all intake forms
            intakeEntries.push(data);
          }
        } catch (error) {
          console.warn(`[MasterFile] Failed to parse metadata file ${file}:`, error.message);
        }
      }

      // Write both master files
      this.writeMasterFile(this.masterFeedbackPath, feedbackEntries);
      this.writeMasterFile(this.masterIntakesPath, intakeEntries);

      console.log(`[MasterFile] Rebuilt master files: ${feedbackEntries.length} feedback, ${intakeEntries.length} intakes`);

      return {
        success: true,
        message: `Rebuilt master files from ${files.length} metadata files`,
        feedbackCount: feedbackEntries.length,
        intakeCount: intakeEntries.length
      };
    } catch (error) {
      console.error('[MasterFile] Error rebuilding master files:', error.message);
      return { success: false, error: error.message };
    }
  }
}

module.exports = MasterFileManager;
