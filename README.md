# Flexion & Flow - Seated Massage Intake Form

A locally-hosted web application for collecting client intake forms for seated massage services, with secure PDF generation and Google Drive integration.

## Features

- 📱 **Mobile-Optimized**: Responsive design for phone and tablet access
- ⚡ **Dual Forms**: Quick 60-second form or detailed comprehensive intake
- ✍️ **Digital Signature**: Touch-enabled signature capture
- 📄 **PDF Generation**: Automatic conversion to professional PDF documents
- ☁️ **Google Drive Integration**: Secure cloud storage with fallback to local storage
- 🔒 **Privacy-Focused**: No persistent local data storage after upload

## Quick Start

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Environment

Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```

Edit `.env` with your settings:
```env
PORT=3000
GOOGLE_DRIVE_FOLDER_ID=your-folder-id
```

### 3. Start the Server

```bash
npm start
```

For development with auto-restart:
```bash
npm run dev
```

### 4. Access the App

- **Local**: http://localhost:3000
- **Network**: http://YOUR_LOCAL_IP:3000 (find your IP with `ipconfig` on Windows or `ifconfig` on Mac/Linux)

## Google Drive Setup (Optional)

To enable automatic uploads to Google Drive:

### Step 1: Create Google Cloud Project

1. Go to https://console.cloud.google.com
2. Create a new project
3. Enable the Google Drive API

### Step 2: Create Service Account

1. Navigate to **IAM & Admin** → **Service Accounts**
2. Click **Create Service Account**
3. Give it a name (e.g., "Intake Form Uploader")
4. Grant it the role: **Editor** or **Drive File Creator**
5. Click **Done**

### Step 3: Generate Credentials

1. Click on your service account
2. Go to the **Keys** tab
3. Click **Add Key** → **Create new key**
4. Choose **JSON** format
5. Download the JSON file
6. Save it as `google-credentials.json` in the project root

### Step 4: Share Drive Folder

1. Create a folder in Google Drive for intake forms
2. Right-click the folder → **Share**
3. Add the service account email (found in the JSON file: `client_email`)
4. Give it **Editor** permissions
5. Copy the folder ID from the URL (e.g., `https://drive.google.com/drive/folders/FOLDER_ID_HERE`)
6. Add the folder ID to your `.env` file

**Note**: If Google Drive is not configured, PDFs will automatically save to the `pdfs/` folder locally.

## Making the App Internet-Accessible

For clients to access from anywhere (not just local WiFi):

### Option 1: ngrok (Easiest)

1. Install ngrok: https://ngrok.com/download
2. Run: `ngrok http 3000`
3. Use the provided URL (e.g., `https://abc123.ngrok.io`)
4. Share this URL or generate a QR code

### Option 2: Cloudflare Tunnel (More Stable)

1. Install Cloudflare Tunnel: https://developers.cloudflare.com/cloudflare-one/connections/connect-apps/install-and-setup/
2. Run: `cloudflared tunnel --url localhost:3000`
3. Use the provided URL

### Option 3: Deploy to Cloud

Deploy to:
- **Heroku**: https://heroku.com
- **Railway**: https://railway.app
- **Render**: https://render.com
- **DigitalOcean**: https://digitalocean.com

## Project Structure

```
Seated-Massage-Intake-Form/
├── server.js                 # Express server
├── package.json             # Dependencies
├── .env                     # Configuration (create from .env.example)
├── views/                   # HTML pages
│   ├── index.html          # Home page
│   ├── quick-form.html     # Quick intake form
│   ├── detailed-form.html  # Detailed intake form
│   └── success.html        # Success page
├── public/                  # Static files
│   ├── css/
│   │   ├── styles.css      # General styles
│   │   └── forms.css       # Form-specific styles
│   └── js/
│       ├── signature.js    # Signature capture
│       ├── quick-form.js   # Quick form logic
│       └── detailed-form.js # Detailed form logic
├── utils/                   # Backend utilities
│   ├── pdfGenerator.js     # PDF generation
│   └── driveUploader.js    # Google Drive integration
└── pdfs/                    # Local PDF storage (if Drive not configured)
```

## Form Types

### Quick Form (60 seconds)
- Basic contact information
- Treatment areas (up to 2)
- Pressure preference
- Essential health screening
- Consent and signature

### Detailed Form (Comprehensive)
- Complete client details
- Work information
- Emergency contact
- Detailed treatment goals (up to 3 areas)
- Symptom assessment
- Comprehensive health history
- Current status (stress, sleep, hydration)
- Consent and signature

## Security & Privacy

- ✅ Data encrypted in transit (use HTTPS in production)
- ✅ No local database - data not stored on server
- ✅ PDFs uploaded to private Google Drive folder
- ✅ Service account authentication (no user OAuth)
- ✅ Signature data embedded in PDF only
- ✅ HIPAA considerations addressed

## Troubleshooting

### Can't access from phone
- Ensure phone and computer are on the same WiFi network
- Check firewall settings allow incoming connections on port 3000
- Use your computer's actual IP address, not `localhost`

### Google Drive upload fails
- Verify credentials file exists: `google-credentials.json`
- Check service account has access to the folder
- Ensure Drive API is enabled in Google Cloud Console
- PDFs will save locally as fallback

### Signature not appearing in PDF
- Ensure signature canvas is signed before submission
- Check browser console for errors
- Try clearing browser cache

## Development

### Install development dependencies
```bash
npm install --save-dev nodemon
```

### Run in development mode
```bash
npm run dev
```

## Support

For issues or questions:
- Check the ROADMAP.md for project status
- Review the troubleshooting section above
- Check console logs for error messages

## License

ISC License - For Flexion & Flow use
