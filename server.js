const express = require('express');
const path = require('path');
const fs = require('fs');
const os = require('os');
const cors = require('cors');
require('dotenv').config();

const pdfGenerator = require('./utils/pdfGenerator');
const driveUploader = require('./utils/driveUploader');
const MetadataStore = require('./utils/metadataStore');
const MasterFileManager = require('./utils/masterFileManager');

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

// Ensure required directories exist
const requiredDirs = [
    path.join(__dirname, 'metadata'),
    path.join(__dirname, 'pdfs'),
    path.join(__dirname, 'public')
];

requiredDirs.forEach(dir => {
    if (!fs.existsSync(dir)) {
        try {
            fs.mkdirSync(dir, { recursive: true });
            console.log(`[Init] Created directory: ${dir}`);
        } catch (error) {
            console.error(`[Init] Failed to create directory ${dir}:`, error.message);
        }
    }
});

// Initialize modules
const metadataStore = new MetadataStore(driveUploader);
const masterFileManager = new MasterFileManager();

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

// Static pages
app.get('/privacy', (req, res) => {
    res.sendFile(path.join(__dirname, 'views', 'privacy.html'));
});

app.get('/terms', (req, res) => {
    res.sendFile(path.join(__dirname, 'views', 'terms.html'));
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
            formName = 'Table_Massage';
        } else {
            formName = 'Seated_Chair_Massage';
        }
        const filename = `${formName}_${clientName}_${yyyy}-${mm}-${dd}_${HH}${MM}${ss}.pdf`;
        
        // Upload to Google Drive (or save locally if not configured)
        console.log('Uploading to Google Drive...');
        const uploadResult = await driveUploader.uploadPDF(pdfBuffer, filename);

        console.log('Form submitted successfully:', uploadResult);

        // Save metadata for analytics and update master files
        try {
            const metadata = await metadataStore.saveMetadata(formData, filename);
            console.log('Metadata saved for analytics');

            // Update master file with new entry
            await masterFileManager.appendToMasterFile(metadata, formData.formType);
            console.log('Master file updated');
        } catch (error) {
            console.warn('Failed to save metadata or update master file (non-fatal):', error.message);
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

// Health check endpoint
const healthPayload = () => {
    try {
        return {
            status: 'ok',
            timestamp: new Date().toISOString(),
            uptimeSeconds: Math.round(process.uptime()),
            googleDriveConfigured: driveUploader && typeof driveUploader.isConfigured === 'function' ? driveUploader.isConfigured() : false
        };
    } catch (error) {
        console.error('[Health] Error generating health payload:', error.message);
        return {
            status: 'ok',
            timestamp: new Date().toISOString(),
            uptimeSeconds: Math.round(process.uptime()),
            googleDriveConfigured: false
        };
    }
};

app.get('/health', (req, res) => {
    try {
        res.status(200).json(healthPayload());
    } catch (error) {
        console.error('[Health] Error in /health endpoint:', error.message);
        res.status(200).json({ status: 'ok', uptime: Math.round(process.uptime()) });
    }
});

app.get('/api/health', (req, res) => {
    try {
        res.status(200).json(healthPayload());
    } catch (error) {
        console.error('[Health] Error in /api/health endpoint:', error.message);
        res.status(200).json({ status: 'ok', uptime: Math.round(process.uptime()) });
    }
});

// Global error handling middleware for Express
app.use((err, req, res, next) => {
    console.error('[Express Error]', req.method, req.path);
    console.error('Error:', err.message);
    if (err.stack) console.error(err.stack);

    // Don't crash the server - return error response
    if (!res.headersSent) {
        res.status(err.status || 500).json({
            error: process.env.NODE_ENV === 'production'
                ? 'Internal server error'
                : err.message
        });
    }
});

// SPA fallback for built frontend; keeps API routes untouched
if (spaDir) {
    app.get('*', (req, res, next) => {
        if (req.path.startsWith('/api')) return next();
        if (req.method !== 'GET') return next();
        return res.sendFile(path.join(spaDir, 'index.html'));
    });
}

// Log environment configuration for debugging
console.log('[Init] Environment Configuration:');
console.log(`  NODE_ENV: ${process.env.NODE_ENV || 'development'}`);
console.log(`  PORT: ${PORT}`);
console.log(`  Google Drive configured: ${driveUploader.isConfigured()}`);
console.log(`  Public directory exists: ${fs.existsSync(publicDir)}`);

// Validate critical paths
const criticalPaths = [
    { path: publicDir, name: 'public' },
    { path: path.join(__dirname, 'metadata'), name: 'metadata' },
    { path: path.join(__dirname, 'pdfs'), name: 'pdfs' },
    { path: path.join(__dirname, 'views'), name: 'views' },
    { path: path.join(__dirname, 'utils'), name: 'utils' }
];

console.log('[Init] Path Validation:');
for (const { path: p, name } of criticalPaths) {
    const exists = fs.existsSync(p);
    console.log(`  ${name}: ${exists ? '✓' : '✗'} ${p}`);
    if (!exists && (name === 'views' || name === 'utils' || name === 'public')) {
        console.error(`[FATAL] Critical directory missing: ${name}`);
        process.exit(1);
    }
}

// Start server with error handling
// Listen on 0.0.0.0 to accept connections from any interface (required for Docker/Railway)
console.log('[Init] About to start listening on port', PORT);

const server = app.listen(PORT, '0.0.0.0', () => {
    console.log(`[Server] Callback triggered - server is now listening on port ${PORT}`);

    const ip = getLocalIPv4();
    console.log(`\n${'='.repeat(50)}`);
    console.log(`Flexion and Flow Intake Form Server`);
    console.log(`${'='.repeat(50)}`);
    console.log(`\n Server running at:`);
    console.log(`   Local:   http://localhost:${PORT}`);
    console.log(`   Network: http://${ip ?? 'localhost'}:${PORT}`);
    console.log(`\n To access from mobile devices:`);
    console.log(`   1. Make sure your phone is on the same WiFi`);
    console.log(`   2. Find your computer's IP address`);
    console.log(`   3. Open http://${ip ?? 'localhost'}:${PORT} on your phone`);
    console.log(`\n For internet access, use ngrok or Cloudflare Tunnel`);
    console.log(`\n${'='.repeat(50)}\n`);

    console.log('[Init] Server is fully initialized and ready to accept requests');
});

console.log('[Init] app.listen() called, waiting for callback...');

// Keep-alive monitor to ensure the process doesn't exit unexpectedly
setInterval(() => {
    console.log('[Monitor] Server still running, uptime:', Math.round(process.uptime()), 'seconds');
}, 30000); // Log every 30 seconds

// Final confirmation that module loaded successfully
console.log('[Init] Server module fully loaded, process will remain active');

server.on('error', (error) => {
    console.error('[Server] Error:', error.message);
    if (error.code === 'EADDRINUSE') {
        console.error(`Port ${PORT} is already in use`);
    }
    process.exit(1);
});

// Error handling
process.on('uncaughtException', (error) => {
    console.error('[Process] Uncaught Exception:', error.message);
    console.error(error.stack);
    // Don't exit immediately - try to keep the server running
    console.error('[Process] Attempting to continue running despite uncaught exception');
});

process.on('unhandledRejection', (error) => {
    console.error('[Process] Unhandled Rejection:', error.message || error);
    if (error && error.stack) {
        console.error(error.stack);
    }
    // Don't exit immediately - try to keep the server running
    console.error('[Process] Attempting to continue running despite unhandled rejection');
});

// Graceful shutdown handling for Railway/Docker
process.on('SIGTERM', () => {
    console.log('[Server] SIGTERM received, shutting down gracefully...');
    server.close(() => {
        console.log('[Server] Server closed');
        process.exit(0);
    });
    // Force exit after 10 seconds
    setTimeout(() => {
        console.error('[Server] Forced exit due to timeout');
        process.exit(1);
    }, 10000);
});

process.on('SIGINT', () => {
    console.log('[Server] SIGINT received, shutting down gracefully...');
    server.close(() => {
        console.log('[Server] Server closed');
        process.exit(0);
    });
});
