const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');

/**
 * Generate a PDF from form data
 * @param {Object} formData - The form submission data
 * @returns {Promise<Buffer>} PDF buffer
 */
async function generatePDF(formData) {
    return new Promise((resolve, reject) => {
        try {
            const doc = new PDFDocument({
                size: 'A4',
                margins: { top: 50, bottom: 50, left: 50, right: 50 }
            });

            const chunks = [];

            doc.on('data', chunk => chunks.push(chunk));
            doc.on('end', () => resolve(Buffer.concat(chunks)));
            doc.on('error', reject);

            // Determine brand name and colors
            const isHemisphere = formData.selectedBrand === 'hemisphere';
            const brandName = isHemisphere ? 'Hemisphere Wellness' : 'Flexion & Flow';
            const brandColor = isHemisphere ? '#1a7a6c' : '#2c5f7d';

            // Determine form type title
            const formType = formData.formType || 'seated';
            const formTypeTitle = formType === 'table' ? 'Table Massage Intake Form' : 'Seated Chair Massage Intake Form';

            // Header
            doc.fontSize(20)
               .fillColor(brandColor)
               .text(brandName, { align: 'center' });

            doc.fontSize(16)
               .text(formTypeTitle, { align: 'center' });

            doc.moveDown(1);
            doc.strokeColor(brandColor)
               .lineWidth(2)
               .moveTo(50, doc.y)
               .lineTo(545, doc.y)
               .stroke();

            doc.moveDown(1);

            // Submission info
            const submittedDate = formData.submissionDate ? new Date(formData.submissionDate) : new Date();
            const formattedDate = submittedDate.toLocaleString('en-AU', {
                dateStyle: 'full',
                timeStyle: 'short',
                timeZone: 'Australia/Sydney'
            });
            doc.fontSize(9)
               .fillColor('#666')
               .text(`Submitted: ${formattedDate}`, { align: 'right' });

            doc.moveDown(1);

            // Generate appropriate form based on type
            generateUniversalForm(doc, formData, brandColor, formType);

            // Signature section
            doc.moveDown(1.5);
            doc.fontSize(12)
               .fillColor('#000')
               .text('Signature:', { continued: false });

            doc.moveDown(0.5);

            if (formData.signature) {
                try {
                    const sig = String(formData.signature || '');
                    if (sig.indexOf('text:') === 0) {
                        // Render typed signature text
                        const txt = sig.slice(5);
                        doc.moveDown(0.2);
                        try { doc.font('Times-Italic'); } catch (e) { /* ignore */ }
                        doc.fontSize(28).fillColor('#000').text(txt, { continued: false });
                        try { doc.font('Times-Roman'); } catch (e) { /* ignore */ }
                    } else {
                        const signatureData = sig.replace(/^data:image\/\w+;base64,/, '');
                        const signatureBuffer = Buffer.from(signatureData, 'base64');
                        doc.image(signatureBuffer, {
                            fit: [200, 50],
                            align: 'left'
                        });
                    }
                } catch (error) {
                    console.error('Error adding signature to PDF:', error);
                    doc.fontSize(10).text('[Signature image error]');
                }
            }

            doc.moveDown(0.5);
                const signedDate = formData.signedAt ? new Date(formData.signedAt) : (formData.submissionDate ? new Date(formData.submissionDate) : new Date());
                const formattedSignedDate = signedDate.toLocaleString('en-AU', {
                    dateStyle: 'full',
                    timeStyle: 'short',
                    timeZone: 'Australia/Sydney'
                });
                doc.fontSize(9)
                    .fillColor('#666')
                    .text(`Signed: ${formattedSignedDate}`);

            // Footer
            doc.fontSize(8)
               .fillColor('#999')
               .text('This document contains confidential health information and should be stored securely.',
                     50, doc.page.height - 70,
                     { align: 'center', width: 495 });

            doc.end();

        } catch (error) {
            reject(error);
        }
    });
}

function generateUniversalForm(doc, data, brandColor = '#2c5f7d', formType = 'seated') {
    doc.fillColor('#000');

    addSection(doc, 'Client Details', brandColor);
    addField(doc, 'Full name', data.fullName);
    addField(doc, 'Mobile', data.mobile);
    addField(doc, 'Email', data.email || 'Not provided');
    if (data.gender) addField(doc, 'Gender', data.gender);

    // Body map: include the captured image if available
    addSection(doc, 'Body Map', brandColor);
    if (data.muscleMapMarks) {
        try {
            const marks = typeof data.muscleMapMarks === 'string' ? JSON.parse(data.muscleMapMarks) : data.muscleMapMarks;
            addField(doc, 'Discomfort areas marked', Array.isArray(marks) && marks.length > 0 ? `${marks.length} area(s) marked on body map` : 'None');

            // If we have a captured canvas image, use it
            if (data.muscleMapImage) {
                try {
                    doc.addPage();
                    doc.fontSize(11).fillColor(brandColor).text('Body Map with Marked Areas', { align: 'center' });
                    doc.moveDown(0.5);

                    const imgWidth = 350;
                    const imgX = Math.max(50, (doc.page.width - imgWidth) / 2);

                    // Remove the data:image prefix if present
                    const imageData = data.muscleMapImage.replace(/^data:image\/\w+;base64,/, '');
                    const imageBuffer = Buffer.from(imageData, 'base64');

                    doc.image(imageBuffer, imgX, doc.y, { width: imgWidth });
                    doc.moveDown(2);
                } catch (err) {
                    console.error('Error embedding muscle map image:', err);
                    addField(doc, 'Body map image', 'Could not embed image');
                }
            } else {
                // Fallback: show marks as text
                if (Array.isArray(marks) && marks.length) {
                    const marksText = marks.map((m, i) => `#${i+1}: x=${m.x || 0}, y=${m.y || 0}`).join('; ');
                    addField(doc, 'Body map marks', marksText);
                }
            }

        } catch (e) {
            console.error('Error processing body map:', e);
            addField(doc, 'Discomfort areas marked', 'Error processing body map');
        }
    } else {
        addField(doc, 'Discomfort areas marked', 'None');
    }

    addSection(doc, "Preferences", brandColor);
    addField(doc, 'Pressure preference', data.pressurePreference || 'Not specified');

    // Table-specific preferences
    if (formType === 'table') {
        addSection(doc, 'Table-Specific Preferences', brandColor);
        addField(doc, 'Oil / Skin contact', data.tableOilPreference || 'Not specified');
        if (data.tableOilPreference === 'sensitive' && data.tableOilAllergyDetails) {
            addField(doc, 'Allergy / sensitivity details', data.tableOilAllergyDetails);
        }
        addField(doc, 'Position comfort', data.tablePositionComfort || 'Not specified');
        if (data.tablePositionComfort === 'trouble' && data.tablePositionDetails) {
            addField(doc, 'Position details', data.tablePositionDetails);
        }
    }

    addSection(doc, 'Health Check', brandColor);
    if (Array.isArray(data.healthChecks) && data.healthChecks.length) {
        addFieldList(doc, 'Health issues flagged', data.healthChecks);
    } else {
        addField(doc, 'Health issues flagged', data.healthChecks || 'None');
    }

    // Include any additional health information if provided
    if (data.reviewNote) {
        addField(doc, 'Health Issues - Additional Information', data.reviewNote);
    }

    if (data.avoidNotes) {
        addSection(doc, 'Areas to Avoid', brandColor);
        addField(doc, 'Notes', data.avoidNotes);
    }

    if (data.otherHealthConcernText) {
        addField(doc, 'Other health concern details', data.otherHealthConcernText);
    }

    // Marketing Preferences
    if (typeof data.emailOptIn !== 'undefined' || typeof data.smsOptIn !== 'undefined') {
        addSection(doc, 'Marketing Preferences', brandColor);
        if (typeof data.emailOptIn !== 'undefined') addField(doc, 'Email updates opt-in', data.emailOptIn ? 'Yes' : 'No');
        if (typeof data.smsOptIn !== 'undefined') addField(doc, 'SMS updates opt-in', data.smsOptIn ? 'Yes' : 'No');
    }

    addSection(doc, 'Consent & Agreement', brandColor);
    addField(doc, 'Terms, treatment & public setting consent', data.consentAll ? 'Agreed' : 'Not agreed');
}

function addSection(doc, title, brandColor = '#2c5f7d') {
    doc.moveDown(1);
    doc.fontSize(12)
       .fillColor(brandColor)
       .text(title, { underline: true });
    doc.moveDown(0.5);
}

function addField(doc, label, value) {
    if (doc.y > 700) {
        doc.addPage();
    }

    doc.fontSize(10)
       .fillColor('#333')
       .text(label + ': ', { continued: true })
       .fillColor('#000')
       .text(value || 'Not provided');

    doc.moveDown(0.3);
}

function addFieldList(doc, label, arr) {
    if (!Array.isArray(arr) || arr.length === 0) {
        addField(doc, label, 'None');
        return;
    }

    if (doc.y > 700) doc.addPage();
    doc.fontSize(10).fillColor('#333').text(label + ':');
    doc.moveDown(0.2);
    doc.fontSize(10).fillColor('#000');
    arr.forEach(item => {
        const line = (typeof item === 'string') ? item : JSON.stringify(item);
        doc.text('- ' + line, { indent: 12 });
    });
    doc.moveDown(0.4);
}

function formatValue(value, otherValue) {
    if (!value) return 'Not provided';
    if (value === 'Other' && otherValue) {
        return `Other: ${otherValue}`;
    }
    return value;
}

function formatArrayValue(arr, otherValue) {
    if (!arr) return 'None';

    const values = Array.isArray(arr) ? arr : [arr];
    let result = values.filter(v => v && v !== 'Other').join(', ');

    if (values.includes('Other') && otherValue) {
        result += (result ? ', ' : '') + `Other: ${otherValue}`;
    }

    return result || 'None';
}

module.exports = {
    generatePDF
};
