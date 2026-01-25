const express = require('express');
const path = require('path');
const fs = require('fs');
const os = require('os');
const cors = require('cors');
require('dotenv').config();

const pdfGenerator = require('./utils/pdfGenerator');
const driveUploader = require('./utils/driveUploader');

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
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(express.static(publicDir));

// Serve built SPA assets when available
if (spaDir) {
    app.use(express.static(spaDir));
}

// Routes - Serve HTML pages
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'views', 'index.html'));
});

app.get('/intake', (req, res) => {
    res.sendFile(path.join(__dirname, 'views', 'intake.html'));
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

// API endpoint - Submit form
app.post('/api/submit-form', async (req, res) => {
    try {
        const formData = req.body;
        
        // Validate required fields
        if (!formData.name && !formData.fullName) {
            return res.status(400).json({ 
                success: false, 
                message: 'Name is required' 
            });
        }
        
        if (!formData.signature) {
            return res.status(400).json({ 
                success: false, 
                message: 'Signature is required' 
            });
        }
        
        // Generate PDF with PDFKit
        console.log('Generating PDF...');
        const pdfBuffer = await pdfGenerator.generatePDF(formData);
        
        // Create filename per universal format: ChairMassageIntake_{fullName}_{YYYY-MM-DD}_{HHmm}.pdf
        const clientName = (formData.fullName || formData.name || 'Client').replace(/[^a-z0-9]/gi, '_');
        const now = new Date();
        const yyyy = now.getFullYear();
        const mm = String(now.getMonth() + 1).padStart(2, '0');
        const dd = String(now.getDate()).padStart(2, '0');
        const HH = String(now.getHours()).padStart(2, '0');
        const MM = String(now.getMinutes()).padStart(2, '0');
        const filename = `ChairMassageIntake_${clientName}_${yyyy}-${mm}-${dd}_${HH}${MM}.pdf`;
        
        // Upload to Google Drive (or save locally if not configured)
        console.log('Uploading to Google Drive...');
        const uploadResult = await driveUploader.uploadPDF(pdfBuffer, filename);
        
        console.log('Form submitted successfully:', uploadResult);
        
        res.json({ 
            success: true, 
            message: 'Form submitted successfully',
            fileId: uploadResult.fileId
        });
        
    } catch (error) {
        console.error('Error processing form:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Error processing form: ' + error.message 
        });
    }
});

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
    console.log(`🌟 Flexion & Flow Intake Form Server`);
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
