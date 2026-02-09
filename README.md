# Hemisphere Wellness - Massage Intake Form

A locally-hosted web application for collecting client intake forms for seated massage services, with secure PDF generation and Google Drive integration.

## Features

- ÃƒÂ°Ã…Â¸Ã¢â‚¬Å“Ã‚Â± **Mobile-Optimized**: Responsive design for phone and tablet access
- ÃƒÂ¢Ã…Â¡Ã‚Â¡ **Dual Forms**: Quick 60-second form or detailed comprehensive intake
- ÃƒÂ¢Ã…â€œÃ‚ÂÃƒÂ¯Ã‚Â¸Ã‚Â **Digital Signature**: Touch-enabled signature capture
- ÃƒÂ°Ã…Â¸Ã¢â‚¬Å“Ã¢â‚¬Å¾ **PDF Generation**: Automatic conversion to professional PDF documents
- ÃƒÂ¢Ã‹Å“Ã‚ÂÃƒÂ¯Ã‚Â¸Ã‚Â **Google Drive Integration**: Secure cloud storage with fallback to local storage
- ÃƒÂ°Ã…Â¸Ã¢â‚¬ÂÃ¢â‚¬â„¢ **Privacy-Focused**: No persistent local data storage after upload
- ÃƒÂ°Ã…Â¸Ã¢â‚¬ÂÃ¢â‚¬â„¢ **Privacy-Focused**: No persistent local data storage after upload (local PDF fallback off by default)

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
- **App URL (Railway)**: https://intake-form.up.railway.app

## Google Drive Setup (Optional)

To enable automatic uploads to Google Drive:

### Step 1: Create Google Cloud Project

1. Go to https://console.cloud.google.com
2. Create a new project
3. Enable the Google Drive API

### Step 2: Create Service Account

1. Navigate to **IAM & Admin** ÃƒÂ¢Ã¢â‚¬Â Ã¢â‚¬â„¢ **Service Accounts**
2. Click **Create Service Account**
3. Give it a name (e.g., "Intake Form Uploader")
4. Grant it the role: **Editor** or **Drive File Creator**
5. Click **Done**

### Step 3: Generate Credentials

1. Click on your service account
2. Go to the **Keys** tab
3. Click **Add Key** ÃƒÂ¢Ã¢â‚¬Â Ã¢â‚¬â„¢ **Create new key**
4. Choose **JSON** format
5. Download the JSON file
6. Save it as `google-credentials.json` in the project root

### Step 4: Share Drive Folder

1. Create a folder in Google Drive for intake forms
2. Right-click the folder ÃƒÂ¢Ã¢â‚¬Â Ã¢â‚¬â„¢ **Share**
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

### Option 4: Hosted App (Railway)

User -> Railway -> Service

- **App URL (Railway)**: https://intake-form.up.railway.app

Traffic flow:

User -> Railway -> Service

## Project Structure

```
Seated-Massage-Intake-Form/
ÃƒÂ¢Ã¢â‚¬ÂÃ…â€œÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ server.js                 # Express server
ÃƒÂ¢Ã¢â‚¬ÂÃ…â€œÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ package.json             # Dependencies
ÃƒÂ¢Ã¢â‚¬ÂÃ…â€œÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ .env                     # Configuration (create from .env.example)
ÃƒÂ¢Ã¢â‚¬ÂÃ…â€œÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ views/                   # HTML pages
ÃƒÂ¢Ã¢â‚¬ÂÃ¢â‚¬Å¡   ÃƒÂ¢Ã¢â‚¬ÂÃ…â€œÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ index.html          # Home page
ÃƒÂ¢Ã¢â‚¬ÂÃ¢â‚¬Å¡   ÃƒÂ¢Ã¢â‚¬ÂÃ…â€œÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ quick-form.html     # Quick intake form
ÃƒÂ¢Ã¢â‚¬ÂÃ¢â‚¬Å¡   ÃƒÂ¢Ã¢â‚¬ÂÃ…â€œÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ detailed-form.html  # Detailed intake form
ÃƒÂ¢Ã¢â‚¬ÂÃ¢â‚¬Å¡   ÃƒÂ¢Ã¢â‚¬ÂÃ¢â‚¬ÂÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ success.html        # Success page
ÃƒÂ¢Ã¢â‚¬ÂÃ…â€œÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ public/                  # Static files
ÃƒÂ¢Ã¢â‚¬ÂÃ¢â‚¬Å¡   ÃƒÂ¢Ã¢â‚¬ÂÃ…â€œÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ css/
ÃƒÂ¢Ã¢â‚¬ÂÃ¢â‚¬Å¡   ÃƒÂ¢Ã¢â‚¬ÂÃ¢â‚¬Å¡   ÃƒÂ¢Ã¢â‚¬ÂÃ…â€œÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ styles.css      # General styles
ÃƒÂ¢Ã¢â‚¬ÂÃ¢â‚¬Å¡   ÃƒÂ¢Ã¢â‚¬ÂÃ¢â‚¬Å¡   ÃƒÂ¢Ã¢â‚¬ÂÃ¢â‚¬ÂÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ forms.css       # Form-specific styles
ÃƒÂ¢Ã¢â‚¬ÂÃ¢â‚¬Å¡   ÃƒÂ¢Ã¢â‚¬ÂÃ¢â‚¬ÂÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ js/
ÃƒÂ¢Ã¢â‚¬ÂÃ¢â‚¬Å¡       ÃƒÂ¢Ã¢â‚¬ÂÃ…â€œÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ signature.js    # Signature capture
ÃƒÂ¢Ã¢â‚¬ÂÃ¢â‚¬Å¡       ÃƒÂ¢Ã¢â‚¬ÂÃ…â€œÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ quick-form.js   # Quick form logic
ÃƒÂ¢Ã¢â‚¬ÂÃ¢â‚¬Å¡       ÃƒÂ¢Ã¢â‚¬ÂÃ¢â‚¬ÂÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ detailed-form.js # Detailed form logic
ÃƒÂ¢Ã¢â‚¬ÂÃ…â€œÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ utils/                   # Backend utilities
ÃƒÂ¢Ã¢â‚¬ÂÃ¢â‚¬Å¡   ÃƒÂ¢Ã¢â‚¬ÂÃ…â€œÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ pdfGenerator.js     # PDF generation
ÃƒÂ¢Ã¢â‚¬ÂÃ¢â‚¬Å¡   ÃƒÂ¢Ã¢â‚¬ÂÃ¢â‚¬ÂÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ driveUploader.js    # Google Drive integration
ÃƒÂ¢Ã¢â‚¬ÂÃ¢â‚¬ÂÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ pdfs/                    # Local PDF storage (if Drive not configured)
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

- ÃƒÂ¢Ã…â€œÃ¢â‚¬Â¦ Data encrypted in transit (use HTTPS/tunnel in production)
- ÃƒÂ¢Ã…â€œÃ¢â‚¬Â¦ No local database - data not stored on server
- ÃƒÂ¢Ã…â€œÃ¢â‚¬Â¦ PDFs uploaded to private Google Drive folder
- ÃƒÂ¢Ã…â€œÃ¢â‚¬Â¦ Service account authentication (no user OAuth)
- ÃƒÂ¢Ã…â€œÃ¢â‚¬Â¦ Signature data embedded in PDF only
- ÃƒÂ¢Ã…â€œÃ¢â‚¬Â¦ HIPAA considerations addressed

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

## Testing

This project includes comprehensive Playwright smoke tests that automatically adapt to the application's routes and flows.

### Prerequisites

Tests require the development server to be running:

```bash
npm start
```

### Running Tests

```bash
# Run all tests headlessly
npm test

# Run tests with UI for debugging
npm test:ui

# Run tests in headed mode (see browser)
npm run test:headed

# Show test report
npm run test:report
```

### Test Configuration

Tests are driven by configuration in [tests/smoke.config.ts](tests/smoke.config.ts):

- **Routes**: Automatically tests all public routes (`/`, `/intake`, `/feedback`, etc.)
- **Page Assertions**: Verifies key elements load correctly on each page
- **User Flows**: End-to-end testing of the complete intake form submission

### E2E Safe Mode

Tests automatically run in E2E mode to prevent real form submissions:

- Form validation works normally
- Submissions are mocked and don't create real PDFs or Google Drive uploads
- Success flow is tested without side effects

To update test configuration when routes change:

1. Edit `tests/smoke.config.ts`
2. Add new routes to `routesToCheck` array
3. Add page assertions for new routes
4. Update user flows if needed

### Environment Variables for Testing

```bash
# Set custom base URL (optional)
BASE_URL=http://localhost:3001

# Enable E2E mode manually (optional - tests set this automatically)
E2E_MODE=true
```

## Support

For issues or questions:

- Check the ROADMAP.md for project status
- Review the troubleshooting section above
- Check console logs for error messages

## Deployment

- Deployments are handled by Railway; pushing to `main` triggers a Railway build when configured in the Railway dashboard.

### Recommended config files

This project includes a set of recommended config files to make builds and deployments deterministic:

- `.nvmrc` ÃƒÂ¢Ã¢â€šÂ¬Ã¢â‚¬Â pins Node version to `18`.
- `package-lock.json` ÃƒÂ¢Ã¢â€šÂ¬Ã¢â‚¬Â lockfile for reproducible installs (already committed).
- `.npmrc` ÃƒÂ¢Ã¢â€šÂ¬Ã¢â‚¬Â enforces exact versions and engine-strict installs.
- `Procfile` ÃƒÂ¢Ã¢â€šÂ¬Ã¢â‚¬Â explicit start command used by some PaaS platforms: `web: npm start`.
- `.env.example` ÃƒÂ¢Ã¢â€šÂ¬Ã¢â‚¬Â example environment variables (copy to `.env` locally).
- `.github/workflows/ci.yml` ÃƒÂ¢Ã¢â€šÂ¬Ã¢â‚¬Â basic CI workflow for GitHub Actions.

### Deployment tips for Railway

- Build command: `npm ci --omit=dev`
- Start command: `npm start`
- Ensure the `packageManager` field in `package.json` is set to `npm@9` or the appropriate version.
- Add required environment variables in Railway project settings (see `.env.example`).

## License

ISC License - For Hemisphere Wellness use
