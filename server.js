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
const AnalyticsService = require('./utils/analyticsService');
const { authMiddleware, adminMiddleware, login, logout, register } = require('./utils/authMiddleware');
const UserStore = require('./utils/userStore');
const emailService = require('./utils/emailService');
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

// Initialize analytics modules
const metadataStore = new MetadataStore(driveUploader);
const masterFileManager = new MasterFileManager();
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

// Auth routes - serve analytics dashboard with hash routing
app.get('/login', (req, res) => {
    res.sendFile(path.join(__dirname, 'views', 'analytics.html'));
});

app.get('/register', (req, res) => {
    res.sendFile(path.join(__dirname, 'views', 'analytics.html'));
});

// Static pages
app.get('/analytics', (req, res) => {
    res.sendFile(path.join(__dirname, 'views', 'analytics.html'));
});

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

// Wrapper to handle async errors in routes
const asyncHandler = (fn) => (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(err => {
        console.error('[Route Error]', req.path, ':', err.message);
        console.error(err.stack);
        res.status(500).json({ error: 'Internal server error' });
    });
};

// Authentication endpoints
app.post('/api/auth/login', asyncHandler(login));
app.post('/api/auth/register', asyncHandler(register));
app.post('/api/auth/logout', authMiddleware, asyncHandler(logout));

// Admin user management endpoints
app.get('/api/admin/pending-users', authMiddleware, adminMiddleware, async (req, res) => {
    try {
        const userStore = new UserStore();
        const pendingUsers = await userStore.getPendingUsers();

        // Remove password hashes for security
        const safeUsers = pendingUsers.map(u => ({
            id: u.id,
            email: u.email,
            firstName: u.firstName,
            lastName: u.lastName,
            createdAt: u.createdAt
        }));

        res.json({ users: safeUsers });
    } catch (error) {
        console.error('Error fetching pending users:', error);
        res.status(500).json({ error: 'Failed to fetch pending users' });
    }
});

app.post('/api/admin/approve-user/:userId', authMiddleware, adminMiddleware, async (req, res) => {
    try {
        const { userId } = req.params;
        const userStore = new UserStore();

        // Update user status
        const user = await userStore.updateUserStatus(userId, 'approved', req.user.userId);

        // Send approval email
        await emailService.sendApprovalEmail(user.email, user.firstName);

        res.json({
            success: true,
            message: `User ${user.firstName} ${user.lastName} approved and notified by email`
        });
    } catch (error) {
        console.error('Error approving user:', error);
        res.status(500).json({ error: 'Failed to approve user' });
    }
});

app.post('/api/admin/reject-user/:userId', authMiddleware, adminMiddleware, async (req, res) => {
    try {
        const { userId } = req.params;
        const { reason } = req.body;
        const userStore = new UserStore();

        // Update user status
        const user = await userStore.updateUserStatus(userId, 'rejected', req.user.userId);

        // Send rejection email
        await emailService.sendRejectionEmail(user.email, user.firstName, reason);

        // Remove rejected user to allow re-registration
        await userStore.deleteRejectedUser(user.email);

        res.json({
            success: true,
            message: `User ${user.firstName} ${user.lastName} rejected and notified by email`
        });
    } catch (error) {
        console.error('Error rejecting user:', error);
        res.status(500).json({ error: 'Failed to reject user' });
    }
});

app.get('/api/admin/all-users', authMiddleware, adminMiddleware, async (req, res) => {
    try {
        const userStore = new UserStore();
        const allUsers = await userStore.getAllUsers();

        // Remove password hashes for security
        const safeUsers = allUsers.map(u => ({
            id: u.id,
            email: u.email,
            firstName: u.firstName,
            lastName: u.lastName,
            role: u.role,
            status: u.status,
            createdAt: u.createdAt,
            approvedAt: u.approvedAt,
            lastLoginAt: u.lastLoginAt
        }));

        res.json({ users: safeUsers });
    } catch (error) {
        console.error('Error fetching all users:', error);
        res.status(500).json({ error: 'Failed to fetch users' });
    }
});

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

// Update data endpoint - rebuilds master files from metadata
// Works on both local development and Railway deployment
app.post('/api/analytics/update-data', authMiddleware, async (req, res) => {
    try {
        const fs = require('fs');
        const path = require('path');

        const results = [];
        const errors = [];
        const metadataDir = path.join(__dirname, 'metadata');
        const masterIntakesPath = path.join(__dirname, 'pdfs', 'master_intakes.json');
        const masterFeedbackPath = path.join(__dirname, 'pdfs', 'master_feedback.json');

        console.log('[UpdateData] Starting data synchronization...');

        // Ensure pdfs directory exists
        const pdfsDir = path.join(__dirname, 'pdfs');
        if (!fs.existsSync(pdfsDir)) {
            fs.mkdirSync(pdfsDir, { recursive: true });
            console.log('[UpdateData] Created pdfs directory');
        }

        // Load existing master files
        let existingFeedback = [];
        let existingIntakes = [];

        try {
            if (fs.existsSync(masterFeedbackPath)) {
                const content = fs.readFileSync(masterFeedbackPath, 'utf8');
                existingFeedback = JSON.parse(content) || [];
            }
        } catch (error) {
            console.warn('[UpdateData] Failed to load existing master_feedback.json:', error.message);
        }

        try {
            if (fs.existsSync(masterIntakesPath)) {
                const content = fs.readFileSync(masterIntakesPath, 'utf8');
                existingIntakes = JSON.parse(content) || [];
            }
        } catch (error) {
            console.warn('[UpdateData] Failed to load existing master_intakes.json:', error.message);
        }

        // Load all metadata files and merge with existing entries
        const feedbackEntries = [...existingFeedback];
        const intakeEntries = [...existingIntakes];
        const existingFilenames = new Set([
            ...existingFeedback.map(e => e.filename),
            ...existingIntakes.map(e => e.filename)
        ]);

        if (fs.existsSync(metadataDir)) {
            const files = fs.readdirSync(metadataDir).filter(f => f.endsWith('.json'));
            console.log(`[UpdateData] Found ${files.length} metadata files`);
            let newEntriesCount = 0;

            for (const file of files) {
                try {
                    const content = fs.readFileSync(path.join(metadataDir, file), 'utf8');
                    const data = JSON.parse(content);

                    // Skip if entry already exists (avoid duplicates)
                    if (existingFilenames.has(data.filename)) {
                        console.log(`[UpdateData] Skipping existing entry: ${data.filename}`);
                        continue;
                    }

                    if (data.formType === 'feedback') {
                        feedbackEntries.push(data);
                    } else {
                        intakeEntries.push(data);
                    }
                    newEntriesCount++;
                } catch (error) {
                    console.warn(`[UpdateData] Failed to parse ${file}:`, error.message);
                    errors.push(`Failed to parse ${file}`);
                }
            }

            if (newEntriesCount > 0) {
                results.push(`✓ Found ${newEntriesCount} new entries to add`);
            } else {
                results.push('✓ All metadata entries already in master files');
            }
        } else {
            console.log('[UpdateData] No metadata directory found');
            results.push('No new submissions to sync');
        }

        // Write merged master files
        try {
            fs.writeFileSync(masterIntakesPath, JSON.stringify(intakeEntries, null, 2), 'utf8');
            results.push(`✓ Saved master_intakes.json (${intakeEntries.length} total entries)`);
            console.log(`[UpdateData] Updated master_intakes.json with ${intakeEntries.length} entries`);
        } catch (error) {
            errors.push(`Failed to update master_intakes.json: ${error.message}`);
            console.error('[UpdateData] Failed to write master_intakes.json:', error);
        }

        try {
            fs.writeFileSync(masterFeedbackPath, JSON.stringify(feedbackEntries, null, 2), 'utf8');
            results.push(`✓ Saved master_feedback.json (${feedbackEntries.length} total entries)`);
            console.log(`[UpdateData] Updated master_feedback.json with ${feedbackEntries.length} entries`);
        } catch (error) {
            errors.push(`Failed to update master_feedback.json: ${error.message}`);
            console.error('[UpdateData] Failed to write master_feedback.json:', error);
        }

        // Clear analytics cache to force reload
        analyticsService.clearCache();

        const message = [
            ...results,
            ...(errors.length > 0 ? ['', 'Issues encountered:', ...errors] : [])
        ].join('\n');

        res.json({
            success: errors.length === 0,
            message: message,
            timestamp: new Date().toISOString()
        });

    } catch (error) {
        console.error('Update data error:', error);
        res.status(500).json({
            success: false,
            message: `Failed to update data: ${error.message}`
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

// Initialize admin account on startup
async function initializeAdmin() {
    try {
        const userStore = new UserStore();
        await userStore.ensureAdminExists();
    } catch (error) {
        console.error('❌ Failed to initialize admin account:', error.message);
    }
}

// Log environment configuration for debugging
console.log('[Init] Environment Configuration:');
console.log(`  NODE_ENV: ${process.env.NODE_ENV || 'development'}`);
console.log(`  PORT: ${PORT}`);
console.log(`  ADMIN_EMAIL configured: ${!!process.env.ADMIN_EMAIL}`);
console.log(`  ADMIN_PASSWORD configured: ${!!process.env.ADMIN_PASSWORD}`);
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
const server = app.listen(PORT, '0.0.0.0', () => {
    console.log(`[Server] Starting on port ${PORT}...`);

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

    // Initialize admin account in background (non-blocking)
    // This prevents blocking the event loop on startup
    initializeAdmin().catch(error => {
        console.error('⚠️  Background admin initialization failed:', error.message);
    });
});

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
