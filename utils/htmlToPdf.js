const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

async function generatePDFWithPuppeteer(data) {
    // Read preview template
    const tplPath = path.join(__dirname, '..', 'views', 'preview.html');
    let tpl = fs.readFileSync(tplPath, 'utf8');

    // Prepare body map image reference (prefer public image files)
    const gender = (data.gender || '').toLowerCase();
    let imageUrl = '/img/Body Map.png';
    if (gender === 'female') imageUrl = '/img/Female Body Map.png';
    else if (gender === 'male') imageUrl = '/img/Male Body Map.png';

    // If local file exists, point to file:// path so Puppeteer can load it without server
    const candidates = [
        path.join(__dirname, '..', 'public', 'img', gender === 'female' ? 'Female Body Map.png' : 'Male Body Map.png'),
        path.join(__dirname, '..', 'public', 'img', 'Body Map.png')
    ];
    let fileImage = null;
    for (const c of candidates) {
        if (fs.existsSync(c)) { fileImage = c; break; }
    }

    const bodyMapSrc = fileImage ? 'file://' + fileImage.replace(/\\/g, '/') : imageUrl;

    // Prepare markers HTML (absolute positioned divs with percent positions)
    let marks = [];
    try { marks = typeof data.muscleMapMarks === 'string' ? JSON.parse(data.muscleMapMarks) : (data.muscleMapMarks || []); } catch(e) { marks = [] }
    const markersHtml = marks.map(m => {
        // the client canvas is 400x600 default; compute percent
        const px = (m.x || 0) / 400 * 100;
        const py = (m.y || 0) / 600 * 100;
        return `<div class="marker" style="left:${px}%; top:${py}%;" title="${m.x},${m.y}"></div>`;
    }).join('\n');

    // Replace placeholders
    tpl = tpl.replace('%%FULL_NAME%%', escapeHtml(data.fullName || ''))
        .replace('%%MOBILE%%', escapeHtml(data.mobile || ''))
        .replace('%%EMAIL%%', escapeHtml(data.email || ''))
        .replace('%%GENDER%%', escapeHtml(data.gender || ''))
        .replace('%%BODY_MAP_IMAGE%%', bodyMapSrc)
        .replace('%%BODY_MAP_MARKERS%%', markersHtml)
        .replace('%%BODY_MAP_MARKS_TEXT%%', escapeHtml(marks.map((m,i)=>`#${i+1}: x=${m.x}, y=${m.y}`).join('; ')))
        .replace('%%PRESSURE%%', escapeHtml(data.pressurePreference || ''))
        .replace('%%HEALTH_FLAGS%%', escapeHtml(Array.isArray(data.healthChecks) ? data.healthChecks.join('; ') : (data.healthChecks || 'None')))
        .replace('%%REVIEW_NOTE%%', escapeHtml(data.reviewNote || ''))
        .replace('%%AVOID_NOTES%%', escapeHtml(data.avoidNotes || ''))
        .replace('%%EMAIL_OPTIN%%', data.emailOptIn ? 'Yes' : 'No')
        .replace('%%SMS_OPTIN%%', data.smsOptIn ? 'Yes' : 'No')
        .replace('%%TERMS%%', data.termsAccepted ? 'Yes' : 'No')
        .replace('%%TREATMENT%%', data.treatmentConsent ? 'Yes' : 'No')
        .replace('%%PUBLIC_OK%%', data.publicSettingOk ? 'Yes' : 'No')
        .replace('%%SIGNATURE_IMAGE%%', data.signature ? `<img src="${data.signature}" style="max-width:320px; height:auto;"/>` : '');

    // Launch puppeteer and render
    const browser = await puppeteer.launch({ args: ['--no-sandbox','--disable-setuid-sandbox'] });
    const page = await browser.newPage();

    await page.setContent(tpl, { waitUntil: 'networkidle0' });

    // Give a small delay for any fonts/images
    await page.waitForTimeout(300);

    const pdfBuffer = await page.pdf({ format: 'A4', printBackground: true, margin: { top: '20mm', bottom: '20mm', left: '15mm', right: '15mm' } });

    await browser.close();
    return pdfBuffer;
}

function escapeHtml(s) {
    if (!s) return '';
    return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

module.exports = {
    generatePDFWithPuppeteer
};
