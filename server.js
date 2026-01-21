const express = require('express');
const path = require('path');
const cors = require('cors');
require('dotenv').config();

const pdfGenerator = require('./utils/pdfGenerator');
const driveUploader = require('./utils/driveUploader');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(express.static('public'));

// Move logo to public folder for serving
app.use(express.static('.'));

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
        
        // Generate PDF
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
app.get('/api/health', (req, res) => {
    res.json({ 
        status: 'ok', 
        timestamp: new Date().toISOString(),
        googleDriveConfigured: driveUploader.isConfigured()
    });
});

// Start server
app.listen(PORT, () => {
    console.log(`\n${'='.repeat(50)}`);
    console.log(`🌟 Flexion & Flow Intake Form Server`);
    console.log(`${'='.repeat(50)}`);
    console.log(`\n📍 Server running at:`);
    console.log(`   Local:   http://localhost:${PORT}`);
    console.log(`   Network: http://YOUR_LOCAL_IP:${PORT}`);
    console.log(`\n💡 To access from mobile devices:`);
    console.log(`   1. Make sure your phone is on the same WiFi`);
    console.log(`   2. Find your computer's IP address`);
    console.log(`   3. Open http://YOUR_IP:${PORT} on your phone`);
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
