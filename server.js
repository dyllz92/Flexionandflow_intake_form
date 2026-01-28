const express = require('express');
const path = require('path');
const fs = require('fs');
const os = require('os');
const cors = require('cors');
require('dotenv').config();

const pdfGenerator = require('./utils/pdfGenerator');
const driveUploader = require('./utils/driveUploader');
const MetadataStore = require('./utils/metadataStore');
const AnalyticsService = require('./utils/analyticsService');
const { authMiddleware, login, logout } = require('./utils/authMiddleware');
const AnalyticsController = require('./controllers/analyticsController');

const app = express();
const PORT = Number(process.env.PORT) || 3000;
const publicDir = path.join(__dirname, 'public');
const distDir = path.join(__dirname, 'dist');
const buildDir = path.join(__dirname, 'build');
const spaDir = fs.existsSync(distDir) ? distDir : (fs.existsSync(buildDir) ? buildDir : null);

function getLocalIPv4() {
    const nets = os.networkInterfaces();
    for (const name of Object.keys(nets)) {
        for (const net of nets[name] || []) {
            if (net.family === 'IPv4' && !net.internal) return net.address;
        }
    }
    return null;
}

// Middleware
// CORS configuration - restrict origins in production
const corsOptions = {
    origin: process.env.NODE_ENV === 'production'
        ? (process.env.ALLOWED_ORIGINS || '').split(',').filter(Boolean)
        : true, // Allow all origins in development
    credentials: true
};
app.use(cors(corsOptions));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(express.static(publicDir));

// Initialize analytics modules
const metadataStore = new MetadataStore(driveUploader);
const analyticsService = new AnalyticsService(metadataStore);
const analyticsController = new AnalyticsController(analyticsService);

// Serve built SPA assets when available
if (spaDir) {
    app.use(express.static(spaDir));
}

// Routes - Serve HTML pages
// Form type selection (Seated vs Table) - main landing page
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'views', 'index.html'));
});

// Legacy route redirect
app.get('/select-form', (req, res) => {
    res.redirect('/');
});

app.get('/intake', (req, res) => {
    res.set('Cache-Control', 'no-store');
    res.sendFile(path.join(__dirname, 'views', 'intake.html'));
});

app.get('/feedback', (req, res) => {
    res.set('Cache-Control', 'no-store');
    res.sendFile(path.join(__dirname, 'views', 'feedback.html'));
});
// Diagnostics endpoint for deploy/version info
app.get('/__version', (req, res) => {
    res.json({
        commit: process.env.RAILWAY_GIT_COMMIT_SHA || null,
        branch: process.env.RAILWAY_GIT_BRANCH || null,
        time: new Date().toISOString()
    });
});

// Deprecated routes: redirect to single intake form
app.get('/quick-form', (req, res) => {
    res.redirect('/intake');
});

app.get('/detailed-form', (req, res) => {
    res.redirect('/intake');
});

app.get('/success', (req, res) => {
    res.sendFile(path.join(__dirname, 'views', 'success.html'));
});

// Analytics dashboard page
app.get('/analytics', (req, res) => {
    res.set('Cache-Control', 'no-store');
    res.sendFile(path.join(__dirname, 'views', 'analytics.html'));
});

// Input validation helpers
function sanitizeString(str, maxLength = 500) {
    if (typeof str !== 'string') return '';
    return str.trim().slice(0, maxLength);
}

function isValidEmail(email) {
    if (!email) return true; // Email is optional
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email) && email.length <= 254;
}

function isValidPhone(phone) {
    if (!phone) return false;
    // Allow digits, spaces, hyphens, parentheses, plus sign
    const phoneRegex = /^[\d\s\-()+ ]{6,20}$/;
    return phoneRegex.test(phone);
}

// API endpoint - Submit form
app.post('/api/submit-form', async (req, res) => {
    try {
        const formData = req.body;
        const isFeedbackForm = formData.formType === 'feedback';

        // Validate and sanitize name
        const name = sanitizeString(formData.name || formData.fullName, 100);
        if (!name || name.length < 2) {
            return res.status(400).json({
                success: false,
                message: 'Please provide a valid name (at least 2 characters)'
            });
        }
        formData.fullName = name;
        formData.name = name;

        // Validate email format (if provided)
        if (formData.email && !isValidEmail(formData.email)) {
            return res.status(400).json({
                success: false,
                message: 'Please provide a valid email address'
            });
        }
        formData.email = sanitizeString(formData.email, 254);

        // Validate phone (required for intake forms)
        if (!isFeedbackForm && !isValidPhone(formData.mobile)) {
            return res.status(400).json({
                success: false,
                message: 'Please provide a valid phone number'
            });
        }
        formData.mobile = sanitizeString(formData.mobile, 20);

        // Sanitize text fields
        formData.reviewNote = sanitizeString(formData.reviewNote, 1000);
        formData.otherHealthConcernText = sanitizeString(formData.otherHealthConcernText, 500);
        formData.comments = sanitizeString(formData.comments, 2000);
        formData.aoRoleOther = sanitizeString(formData.aoRoleOther, 100);

        // Require consent: support newer `consentAll` or legacy `termsAccepted`+`treatmentConsent`
        // Feedback forms don't require consent checkbox (just signature)
        const hasConsent = isFeedbackForm || !!formData.consentAll || (!!formData.termsAccepted && !!formData.treatmentConsent);
        if (!hasConsent) {
            return res.status(400).json({ success: false, message: 'Consent is required to proceed' });
        }

        // Signature is optional - no validation required
        
        // Generate PDF with PDFKit
        console.log('Generating PDF...');
        const pdfBuffer = await pdfGenerator.generatePDF(formData);
        
        // Create filename: FULLNAME_DATE_TIME_FORMNAME.pdf
        const clientName = (formData.fullName || formData.name || 'Client')
            .replace(/[^a-z0-9\s]/gi, '') // Remove special chars
            .trim()
            .replace(/\s+/g, '_'); // Replace spaces with underscores

        const now = new Date();
        const yyyy = now.getFullYear();
        const mm = String(now.getMonth() + 1).padStart(2, '0');
        const dd = String(now.getDate()).padStart(2, '0');
        const HH = String(now.getHours()).padStart(2, '0');
        const MM = String(now.getMinutes()).padStart(2, '0');
        const ss = String(now.getSeconds()).padStart(2, '0');

        const formType = formData.formType || 'seated';
        let formName;
        if (formType === 'feedback') {
            formName = 'Post_Session_Feedback';
        } else if (formType === 'table') {
            formName = 'Table_Massage_Intake';
        } else {
            formName = 'Seated_Chair_Massage_Intake';
        }
        const filename = `${clientName}_${yyyy}-${mm}-${dd}_${HH}${MM}${ss}_${formName}.pdf`;
        
        // Upload to Google Drive (or save locally if not configured)
        console.log('Uploading to Google Drive...');
        const uploadResult = await driveUploader.uploadPDF(pdfBuffer, filename);

        console.log('Form submitted successfully:', uploadResult);

        // Save metadata for analytics
        try {
            await metadataStore.saveMetadata(formData, filename);
            console.log('Metadata saved for analytics');
        } catch (error) {
            console.warn('Failed to save metadata (non-fatal):', error.message);
        }

        res.json({
            success: true,
            message: 'Form submitted successfully',
            fileId: uploadResult.fileId
        });

    } catch (error) {
        console.error('Error processing form:', error);
        // Don't expose internal error details to client
        res.status(500).json({
            success: false,
            message: 'An error occurred while processing your form. Please try again.'
        });
    }
});

// Authentication endpoints
app.post('/api/auth/login', login);
app.post('/api/auth/logout', authMiddleware, logout);

// Analytics endpoints (all require authentication)
app.get('/api/analytics/summary', authMiddleware, (req, res) =>
    analyticsController.getSummary(req, res));

app.get('/api/analytics/trends', authMiddleware, (req, res) =>
    analyticsController.getTrends(req, res));

app.get('/api/analytics/health-issues', authMiddleware, (req, res) =>
    analyticsController.getHealthIssues(req, res));

app.get('/api/analytics/therapists', authMiddleware, (req, res) =>
    analyticsController.getTherapists(req, res));

app.get('/api/analytics/pressure', authMiddleware, (req, res) =>
    analyticsController.getPressure(req, res));

app.get('/api/analytics/feeling-scores', authMiddleware, (req, res) =>
    analyticsController.getFeelingScores(req, res));

// Health check endpoint
const healthPayload = () => ({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptimeSeconds: Math.round(process.uptime()),
    googleDriveConfigured: typeof driveUploader.isConfigured === 'function' ? driveUploader.isConfigured() : false
});

app.get('/health', (req, res) => {
    res.status(200).json(healthPayload());
});

app.get('/api/health', (req, res) => {
    res.status(200).json(healthPayload());
});

// SPA fallback for built frontend; keeps API routes untouched
if (spaDir) {
    app.get('*', (req, res, next) => {
        if (req.path.startsWith('/api')) return next();
        if (req.method !== 'GET') return next();
        return res.sendFile(path.join(spaDir, 'index.html'));
    });
}

// Start server
app.listen(PORT, () => {
    const ip = getLocalIPv4();
    console.log(`\n${'='.repeat(50)}`);
    console.log(`🌟 Hemisphere Wellness Intake Form Server`);
    console.log(`${'='.repeat(50)}`);
    console.log(`\n📍 Server running at:`);
    console.log(`   Local:   http://localhost:${PORT}`);
    console.log(`   Network: http://${ip ?? 'localhost'}:${PORT}`);
    console.log(`\n💡 To access from mobile devices:`);
    console.log(`   1. Make sure your phone is on the same WiFi`);
    console.log(`   2. Find your computer's IP address`);
    console.log(`   3. Open http://${ip ?? 'localhost'}:${PORT} on your phone`);
    console.log(`\n🔗 For internet access, use ngrok or Cloudflare Tunnel`);
    console.log(`\n${'='.repeat(50)}\n`);
});

// Error handling
process.on('uncaughtException', (error) => {
    console.error('Uncaught Exception:', error);
});

process.on('unhandledRejection', (error) => {
    console.error('Unhandled Rejection:', error);
});
