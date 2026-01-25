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
    if (data.gender) addField(doc, 'Gender', data.gender);

    // Body map: include an image (if available) and draw marks
    addSection(doc, 'Body Map');
    if (data.muscleMapMarks) {
        try {
            const marks = typeof data.muscleMapMarks === 'string' ? JSON.parse(data.muscleMapMarks) : data.muscleMapMarks;
            addField(doc, 'Discomfort areas marked', Array.isArray(marks) && marks.length > 0 ? `${marks.length} area(s) marked on body map` : 'None');

            // Attempt to include a body map image from public/img based on gender
            const gender = (data.gender || '').toLowerCase();
            const imgCandidates = [];
            if (gender === 'female') {
                imgCandidates.push(path.join(__dirname, '..', 'public', 'img', 'Female Body Map.png'));
                imgCandidates.push(path.join(__dirname, '..', 'public', 'img', 'Female_Body_Chart.png'));
            } else {
                imgCandidates.push(path.join(__dirname, '..', 'public', 'img', 'Male Body Map.png'));
                imgCandidates.push(path.join(__dirname, '..', 'public', 'img', 'Male_Body_Chart.png'));
            }

            // Fallback to a generic candidate
            imgCandidates.push(path.join(__dirname, '..', 'public', 'img', 'Body Map.png'));

            let imagePath = null;
            for (const p of imgCandidates) {
                if (fs.existsSync(p)) { imagePath = p; break; }
            }

            // Reserve space for the image and draw marks scaled to a default canvas size
            // Use a larger image on its own page for a clearer copy
            const imgWidth = 420;
            const imgX = Math.max(50, (doc.page.width - imgWidth) / 2);
            const startY = doc.y + 6;

            // Default canvas size used by the client when no image present
            const defaultCanvas = { width: 400, height: 600 };

            if (imagePath) {
                try {
                    // Put image on its own page for clarity
                    doc.addPage();
                    doc.fontSize(11).fillColor('#2c5f7d').text('Body Map (with markers)', { align: 'center' });
                    doc.moveDown(0.5);
                    doc.image(imagePath, imgX, doc.y, { width: imgWidth });
                    const imageTopY = doc.y;
                    // Compute scaled height from image dimensions (approx)
                    // pdfkit will scale maintaining aspect; we read actual image dimensions via fs when possible
                    // Use a safe scaling factor based on default canvas width
                    const scale = imgWidth / defaultCanvas.width;

                    // Draw marks as small circles over the image
                    marks.forEach(mark => {
                        const mx = imgX + (mark.x || 0) * scale;
                        const my = imageTopY + (mark.y || 0) * scale;
                        doc.circle(mx, my, 6).fill('#1e90ff').stroke('#0b5ed7');
                    });

                    // Add textual listing of marks for clarity
                    if (Array.isArray(marks) && marks.length) {
                        const marksText = marks.map((m, i) => {
                            return `#${i+1}: x=${m.x || 0}, y=${m.y || 0}${m.timestamp ? `, ${m.timestamp}` : ''}`;
                        }).join('; ');
                        addField(doc, 'Body map marks', marksText);
                    }

                    // Move cursor below image (small gap)
                    doc.moveDown(1);
                } catch (err) {
                    addField(doc, 'Body map image', 'Error embedding image');
                }
            } else {
                // No image: draw a simple placeholder box and plot marks relative to default canvas
                const boxX = imgX;
                const boxW = imgWidth;
                const boxH = Math.round(defaultCanvas.height * (imgWidth / defaultCanvas.width));
                doc.rect(boxX, startY, boxW, boxH).stroke('#ddd');
                doc.fontSize(9).fillColor('#666').text('Body diagram (no image available)', boxX, startY + 6, { width: boxW, align: 'center' });

                marks.forEach(mark => {
                    const mx = boxX + (mark.x || 0) * (boxW / defaultCanvas.width);
                    const my = startY + (mark.y || 0) * (boxH / defaultCanvas.height);
                    doc.circle(mx, my, 6).fill('#1e90ff').stroke('#0b5ed7');
                });

                if (Array.isArray(marks) && marks.length) {
                    const marksText = marks.map((m, i) => `#${i+1}: x=${m.x || 0}, y=${m.y || 0}${m.timestamp ? `, ${m.timestamp}` : ''}`).join('; ');
                    addField(doc, 'Body map marks', marksText);
                }

                doc.moveDown( Math.ceil(boxH / 12) );
            }

        } catch (e) {
            addField(doc, 'Discomfort areas marked', 'Parse error');
        }
    } else {
        addField(doc, 'Discomfort areas marked', 'None');
    }

    addSection(doc, "Preferences");
    addField(doc, 'Pressure preference', data.pressurePreference || 'Not specified');

    addSection(doc, 'Quick Health Check');
    if (Array.isArray(data.healthChecks) && data.healthChecks.length) {
        addFieldList(doc, 'Items flagged', data.healthChecks);
    } else {
        addField(doc, 'Items flagged', data.healthChecks || 'None');
    }
    // Include any therapist review note if provided
    if (data.reviewNote) addField(doc, 'Review note', data.reviewNote);

    if (data.avoidNotes) {
        addSection(doc, 'Anything to avoid');
        addField(doc, 'Avoid', data.avoidNotes);
    }

    // Add a Questions & Answers detailed section
    addSection(doc, 'Questions & Answers');
    addField(doc, 'Pressure preference', data.pressurePreference || 'Not specified');
    if (data.avoidNotes) addField(doc, 'Anything to avoid', data.avoidNotes);
    if (data.otherHealthConcernText) addField(doc, 'Other health concern', data.otherHealthConcernText);
    if (typeof data.emailOptIn !== 'undefined') addField(doc, 'Email opt-in', data.emailOptIn ? 'Yes' : 'No');
    if (typeof data.smsOptIn !== 'undefined') addField(doc, 'SMS opt-in', data.smsOptIn ? 'Yes' : 'No');

    addSection(doc, 'Consent');
    addField(doc, 'Consent (terms, treatment & public setting)', data.consentAll ? 'Yes' : 'No');
    if (data.signedAt) addField(doc, 'Signed at', data.signedAt);
    addField(doc, 'Status', data.status || 'submitted');

    // Full responses: include any remaining fields not already shown above
    const shown = new Set([
        'fullName','mobile','email','gender','muscleMapMarks','pressurePreference','healthChecks','reviewNote','avoidNotes','otherHealthConcernText','emailOptIn','smsOptIn','consentAll','signature','signedAt','status','submissionDate','createdAt','updatedAt','formType'
    ]);

    addSection(doc, 'Full responses (summary)');
    const keys = Object.keys(data).sort();
    keys.forEach(key => {
        if (shown.has(key)) return;

        const val = data[key];

        if (key === 'signature') {
            addField(doc, 'Signature included', val ? 'Yes' : 'No');
            return;
        }

        if (key === 'muscleMapMarks') {
            // already handled above
            return;
        }

        if (Array.isArray(val)) {
            addFieldList(doc, key, val);
            return;
        }

        if (typeof val === 'boolean') {
            addField(doc, key, val ? 'Yes' : 'No');
            return;
        }

        if (typeof val === 'object' && val !== null) {
            try { addField(doc, key, JSON.stringify(val)); } catch(e) { addField(doc, key, String(val)); }
            return;
        }

        if (typeof val === 'string') {
            addField(doc, key, val.length > 800 ? val.substring(0,800) + '…' : val);
            return;
        }

        if (typeof val !== 'undefined') {
            addField(doc, key, String(val));
            return;
        }

        addField(doc, key, 'Not provided');
    });
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
