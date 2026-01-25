# Flexion & Flow - Seated Massage Intake Form

A locally-hosted web application for collecting client intake forms for seated massage services, with secure PDF generation and Google Drive integration.

## Features

- 📱 **Mobile-Optimized**: Responsive design for phone and tablet access
- ⚡ **Dual Forms**: Quick 60-second form or detailed comprehensive intake
- ✍️ **Digital Signature**: Touch-enabled signature capture
- 📄 **PDF Generation**: Automatic conversion to professional PDF documents
- ☁️ **Google Drive Integration**: Secure cloud storage with fallback to local storage
- 🔒 **Privacy-Focused**: No persistent local data storage after upload
- 🔒 **Privacy-Focused**: No persistent local data storage after upload (local PDF fallback off by default)

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
# ALLOW_LOCAL_PDF_FALLBACK=true   # optional, only for local testing
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

- **Local**: http://localhost:3000 (or your configured `PORT`)
- **Network**: http://YOUR_LOCAL_IP:3000 (find your IP with `ipconfig` on Windows)
- **Front Door (HTTPS)**: https://flexion-frontdoor-bmhzhfdwfteycuf8.z02.azurefd.net

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
2. Run: `ngrok http 3001`
3. Use the provided URL (e.g., `https://abc123.ngrok.io`)
4. Share this URL or generate a QR code

### Option 2: Cloudflare Tunnel (More Stable)

1. Install Cloudflare Tunnel: https://developers.cloudflare.com/cloudflare-one/connections/connect-apps/install-and-setup/
2. Run: `cloudflared tunnel --url localhost:3001`
3. Use the provided URL

### Option 3: Deploy to Cloud

Deploy to:
- **Heroku**: https://heroku.com
- **Railway**: https://railway.app
- **Render**: https://render.com
- **DigitalOcean**: https://digitalocean.com

### Option 4: Azure Front Door (HTTPS on Free Tier)

Use Front Door to provide HTTPS without a custom domain:

- **Front Door URL**: https://flexion-frontdoor-bmhzhfdwfteycuf8.z02.azurefd.net

Traffic flow:

User → Front Door (HTTPS) → App Service

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

## Muscle Map Images

To use detailed body diagrams on the muscle map:

- Preferred location: place PNGs in `public/img`
	- `public/img/Male Body Map.png`
	- `public/img/Female Body Map.png`
- Alternative location: `public/js` (next to the SVGs)
	- `public/js/Male Body Map.png`
	- `public/js/Female Body Map.png`

Notes:
- The app auto-selects the image based on the selected gender.
- If PNGs are missing or fail to load, the app falls back to a simple outline so users can still place dots.
- Coordinates are stored in the hidden `muscleMapMarks` field for submission and PDF generation.


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

- ✅ Data encrypted in transit (use HTTPS/tunnel in production)
- ✅ No local database - data not stored on server
- ✅ PDFs uploaded to private Google Drive folder
- ✅ Service account authentication (no user OAuth)
- ✅ Signature data embedded in PDF only
- ✅ HIPAA considerations addressed

By default, local PDF fallback is disabled to avoid local persistence. For local development/testing without Drive, set `ALLOW_LOCAL_PDF_FALLBACK=true` in `.env`.

## Troubleshooting

### Can't access from phone
- Ensure phone and computer are on the same WiFi network
- Check firewall settings allow incoming connections on port 3000
- Use your computer's actual IP address, not `localhost`

### Google Drive upload fails
- Verify credentials file exists: `google-credentials.json`
- Check service account has access to the folder
- Ensure Drive API is enabled in Google Cloud Console
- If `ALLOW_LOCAL_PDF_FALLBACK=true`, PDFs will save locally as fallback; otherwise submissions will error until Drive is configured.

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

## Deployment
- GitHub Actions will auto-deploy to Azure on each push to `main`.

## License

ISC License - For Flexion & Flow use
