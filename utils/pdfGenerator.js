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
            
            // Header
            doc.fontSize(20)
               .fillColor('#2c5f7d')
               .text('Flexion & Flow', { align: 'center' });
            
            doc.fontSize(16)
               .text('Seated Chair Massage Intake Form', { align: 'center' });
            
                doc.fontSize(10)
                    .fillColor('#666')
                    .text('Universal Seated Chair Massage Intake', { align: 'center' });
            
            doc.moveDown(1);
            doc.strokeColor('#2c5f7d')
               .lineWidth(2)
               .moveTo(50, doc.y)
               .lineTo(545, doc.y)
               .stroke();
            
            doc.moveDown(1);
            
            // Submission info
            doc.fontSize(9)
               .fillColor('#666')
               .text(`Submitted: ${new Date(formData.submissionDate).toLocaleString()}`, { align: 'right' });
            
            doc.moveDown(1);
            
            // Generate appropriate form based on type
            generateUniversalForm(doc, formData);
            
            // Signature section
            doc.moveDown(1.5);
            doc.fontSize(12)
               .fillColor('#000')
               .text('Signature:', { continued: false });
            
            doc.moveDown(0.5);
            
            if (formData.signature) {
                try {
                    const signatureData = formData.signature.replace(/^data:image\/\w+;base64,/, '');
                    const signatureBuffer = Buffer.from(signatureData, 'base64');
                    doc.image(signatureBuffer, {
                        fit: [200, 50],
                        align: 'left'
                    });
                } catch (error) {
                    console.error('Error adding signature to PDF:', error);
                    doc.fontSize(10).text('[Signature image error]');
                }
            }
            
            doc.moveDown(0.5);
                const signedTs = formData.signedAt ? new Date(formData.signedAt).toLocaleString() : (formData.signatureDate || new Date(formData.submissionDate).toLocaleDateString());
                doc.fontSize(9)
                    .fillColor('#666')
                    .text(`Signed: ${signedTs}`);
            
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

function generateUniversalForm(doc, data) {
    doc.fillColor('#000');

    addSection(doc, 'Client Details');
    addField(doc, 'Full name', data.fullName);
    addField(doc, 'Mobile', data.mobile);
    addField(doc, 'Email', data.email || 'Not provided');
    addField(doc, 'Company/Team', formatValue(data.companyTeam, data.companyTeamOther));
    addField(doc, '18+ confirmed', data.ageConfirm18Plus ? 'Yes' : 'No');

    addSection(doc, 'Body Map');
    if (data.muscleMapMarks && data.muscleMapMarks !== '[]') {
        try {
            const marks = JSON.parse(data.muscleMapMarks);
            addField(doc, 'Discomfort areas marked', marks.length > 0 ? `${marks.length} area(s) marked on body map` : 'None');
        } catch (e) {
            // Silently ignore parse errors
            addField(doc, 'Discomfort areas marked', 'Parse error');
        }
    } else {
        addField(doc, 'Discomfort areas marked', 'None');
    }

    addSection(doc, "Today's Focus");
    addField(doc, 'Reasons today', formatArrayValue(data.reasonsToday, data.reasonsOtherText));
    addField(doc, 'Areas to focus', formatArrayValue(data.focusAreas, data.focusOtherText));
    addField(doc, 'Areas to avoid', formatArrayValue(data.avoidAreas, data.avoidOtherText));

    addSection(doc, 'Preferences');
    addField(doc, 'Pressure preference', data.pressurePreference || 'Not specified');
    addField(doc, 'Work-related injury', data.workRelatedInjury || 'Not specified');

    addSection(doc, 'Quick Health Check');
    addField(doc, 'Items flagged', formatArrayValue(data.healthChecks) || 'None flagged');
    if (data.reviewedByTherapist) {
        addField(doc, 'Reviewed by therapist', 'Yes');
        if (data.reviewNote) addField(doc, 'Review note', data.reviewNote);
    }

    if (data.notes) {
        addSection(doc, 'Notes');
        addField(doc, 'Notes', data.notes);
    }

    addSection(doc, 'Consent');
    addField(doc, 'Consent given', data.consentGiven ? 'Yes' : 'No');
    addField(doc, 'Status', data.status || 'submitted');
}

function addSection(doc, title) {
    doc.moveDown(1);
    doc.fontSize(12)
       .fillColor('#2c5f7d')
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
