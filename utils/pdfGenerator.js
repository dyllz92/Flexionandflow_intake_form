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
               .text(formData.formType === 'quick' ? 'Quick 60-Second Form' : 'Detailed Intake Form', { align: 'center' });
            
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
            if (formData.formType === 'quick') {
                generateQuickForm(doc, formData);
            } else {
                generateDetailedForm(doc, formData);
            }
            
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
            doc.fontSize(9)
               .fillColor('#666')
               .text(`Date: ${formData.signatureDate || new Date(formData.submissionDate).toLocaleDateString()}`);
            
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

function generateQuickForm(doc, data) {
    doc.fillColor('#000');
    
    addSection(doc, 'Basic Information');
    addField(doc, 'Name', data.name);
    addField(doc, 'Mobile', data.mobile);
    addField(doc, 'Company/Team', formatValue(data.company, data.companyOther));
    
    addSection(doc, 'Treatment Details');
    addField(doc, 'Areas for help', formatArrayValue(data.treatmentArea, data.treatmentAreaOther));
    addField(doc, 'Areas to avoid', data.areasToAvoid || 'None');
    addField(doc, 'Pressure preference', data.pressure);
    
    addSection(doc, 'Health Screening');
    addField(doc, 'Conditions', formatArrayValue(data.healthCondition) || 'None of the above');
    addField(doc, 'Additional information', data.additionalInfo || 'None');
    
    addSection(doc, 'Consent');
    addField(doc, 'Consent given', data.consent ? 'Yes' : 'No');
}

function generateDetailedForm(doc, data) {
    doc.fillColor('#000');
    
    addSection(doc, 'Client Details');
    addField(doc, 'Full name', data.fullName);
    addField(doc, 'Mobile', data.mobile);
    addField(doc, 'Email', data.email || 'Not provided');
    addField(doc, 'Date of birth', data.dob || 'Not provided');
    
    addSection(doc, 'Work Details');
    addField(doc, 'Company/Team', formatValue(data.workCompany, data.workCompanyOther));
    addField(doc, 'Role', data.role || 'Not specified');
    addField(doc, 'Shift time', data.shiftTime || 'Not specified');
    addField(doc, 'Best time to be seen', data.bestTime || 'Not specified');
    addField(doc, 'Preferred session length', data.sessionLength || 'Not specified');
    
    if (data.emergencyName || data.emergencyPhone) {
        addSection(doc, 'Emergency Contact');
        addField(doc, 'Name', data.emergencyName || 'Not provided');
        addField(doc, 'Relationship', data.emergencyRelationship || 'Not provided');
        addField(doc, 'Phone', data.emergencyPhone || 'Not provided');
    }
    
    addSection(doc, 'Treatment Goals');
    addField(doc, 'Areas needing help', formatArrayValue(data.helpArea, data.helpAreaOther));
    addField(doc, 'Main goal', formatValue(data.mainGoal, data.mainGoalOther));
    addField(doc, 'Focus on first', data.focusFirst || 'Not specified');
    addField(doc, 'Areas to avoid', data.areasAvoid || 'None');
    addField(doc, 'Pressure sensitivity', formatValue(data.sensitivity, data.sensitivityWhere));
    addField(doc, 'Pressure preference', data.pressurePref || 'Not specified');
    
    if (data.painLevel || data.symptom || data.duration) {
        addSection(doc, 'Symptoms');
        addField(doc, 'Pain level (0-10)', data.painLevel || 'Not provided');
        addField(doc, 'Symptoms', formatArrayValue(data.symptom, data.symptomOther));
        addField(doc, 'Duration', data.duration || 'Not specified');
        addField(doc, 'Makes it worse', data.makesWorse || 'Not specified');
        addField(doc, 'What helps', data.whatHelps || 'Not specified');
        addField(doc, 'Work factors', formatArrayValue(data.workFactor, data.workFactorOther));
    }
    
    addSection(doc, 'Health Check');
    if (data.recent48h) {
        addField(doc, 'Last 48 hours', formatArrayValue(data.recent48h));
    }
    if (data.generalHealth) {
        addField(doc, 'General health conditions', formatArrayValue(data.generalHealth, data.generalHealthOther));
    }
    if (data.healthDetails) {
        addField(doc, 'Health details', data.healthDetails);
    }
    addField(doc, 'Medications', formatValue(data.medications, data.medicationsDetails));
    addField(doc, 'Allergies', formatValue(data.allergies, data.allergiesDetails));
    
    addSection(doc, 'Current Status');
    addField(doc, 'Stress level', data.stressLevel || 'Not provided');
    addField(doc, 'Sleep quality', data.sleepQuality || 'Not provided');
    addField(doc, 'Hydration', data.hydration || 'Not provided');
    if (data.additionalNotes) {
        addField(doc, 'Additional notes', data.additionalNotes);
    }
    
    addSection(doc, 'Consent');
    addField(doc, 'Information accurate', data.consentAccurate ? 'Confirmed' : 'Not confirmed');
    addField(doc, 'Consent to treatment', data.consentTreatment ? 'Yes' : 'No');
    addField(doc, 'Understands can stop', data.consentStop ? 'Yes' : 'No');
    addField(doc, 'Marketing consent', data.consentMarketing ? 'Yes' : 'No');
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
