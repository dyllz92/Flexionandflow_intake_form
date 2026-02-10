@echo off
echo Starting Flexion and Flow Intake Form on port 3010...
echo.
echo Installing dependencies if needed...
call npm install
echo.
REM Set Google service account environment variables
set GOOGLE_TYPE=service_account
set GOOGLE_PROJECT_ID=amplified-alpha-485305-u5
set GOOGLE_PRIVATE_KEY_ID=df59623391ae92b9838e636bb92c75c1a9a0a350
set GOOGLE_PRIVATE_KEY=-----BEGIN PRIVATE KEY-----^\nMIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQDOXa35nMxpmJ60^\nXeRG4mK5RgkwCwAE8VnOdxr/0FliEMkUBW5hREhogAwotq957SiPiPdyRHfhnHDQ^\n7/a1/Nl2lWBTYHPWP7vX1haBRlvJpXM1gL2wd5DDgwnjPst9sRRx23zU6+l8Liyl^\n+2NImfkRtuSOIKmmO42SBfCjvEPhcFvKjMq6/A5qFOy4UWif/qfppbA6uJUme8xS^\n59gsbax33q57fLyYCIwQKeud17xyBjQNdJtl4K6DAF7cq/PMVug65cUkgXqrm9Lv^\nxCI5xpAPv7YIT/FzLVZmP+8Bunj1eXsAABFFYOp29HE6bH7rQ2jrxUcpBEEsoS71^\nmqLAERzLAgMBAAECggEAGc+jw/W1p3t8VijsNWV5XZ0B5y1pCjU5u1YwXVCs7VQW^\nIlfvj2DgAZoKa0k2N3TPPuytrnAb4m8TuT5aSDbg6DEUxDjrJCACmaNgWzj2oAj+^\nmPGKSDkcNSf9o5umDgmI+hiuy17abDrGQNhpeZowieOrQI+bSHxoX5w4lfIlN1wB^\nscBAv29jUt9nc01r+6qY2HIXtWSvqj1X7NBGvty/gyMqZfEFhjYYUJETET3i7lx/^\nRrOKzQokS7tcz05ewy1GLmaf9u4OVN9nG2/D/aYOVneTsIqBgJvEBHyWhSBf5VNZ^\nFxagq4WEc6FBat53ZwduREMJZdd9EDpf8EeR01IDYQKBgQD1CkVqsOXY/CO7Qd7E^\njd9lFGYyzEPQ4e6YrfF+sbXjo/tbcu4hApcqzU4ndcKFCIF8Fy6VSumvxkJ3xgqY^\nqbdZc/FIZjmVp31RpXPnR9K2W+2EHmDtNULVxhGYjn8HhAnipaQLeAzSOuWHmPRo^\n9CfVpIf/el3G7RCpCFCJdRBaOwKBgQDXmJX/w6Ahzuw3p9PylSYlqXbTjRzRixId^\njyglOcX7nN5/gMB4ESEZmMM66v8hevaREsMGjj1xC+REwqUKAuw37x/DDtsj6tyT^\nwLa/gez64nOXcSBUMIJz4Cd/dxuuOlZA/ITxV1UITV6MzvnngmclGunHc6iarMP0^\njsTNR8KOsQKBgAIhlrz40Ob0OnNUfVWETl8YsFLcx/I3JNYbHTCW5xgVwwfmlf+f^\ngCUVKArb0VdK3aVwpi0SO7oVpVpZVJpDT57tjTmt+e49SK+/GqT2UPTZE9XEVd96^\nSRyG3nxPMPelxFg+TJD0+FeTv49QWz/Wb8pB5hTowYwLX8u4kMrBQ+UlAoGAGs7B^\nUAUuIyYMnzsCErbTAHna6aExRSjqvrwvPLm7UXcG/4mt5QAUQo+JLwlLYgldIVrY^\n3zbOkwDsiFQ/m0gTwTy9kU6Glye7969NyfBI3EVOJDWP1IgXoHrtzl6sFXTxhrEf^\ngrbePuMH77BIyK2hT67SBNfvzhPPZdhexju3CHECgYEAhrgjAk/EJxJhvlYCXeN7^\n71Ror+FYvGDx5QAo4UPCuAXHG8VJ42LjRu4+RQV0wKjdo/93MDRFYp6HnKIxx5TW^\nEiI26BuV8aQiRGwM2j9fz0WkjpdiRNJm6yct697B6wkD+NBfWZC4lc3bPQLqBwFz^\nWbswVTPN0fivGo41AIVkqOA=^\n-----END PRIVATE KEY-----^\n
set GOOGLE_CLIENT_EMAIL=drive-uploader@amplified-alpha-485305-u5.iam.gserviceaccount.com
set GOOGLE_CLIENT_ID=115096737915148660611
set GOOGLE_AUTH_URI=https://accounts.google.com/o/oauth2/auth
set GOOGLE_TOKEN_URI=https://oauth2.googleapis.com/token
set GOOGLE_AUTH_PROVIDER_X509_CERT_URL=https://www.googleapis.com/oauth2/v1/certs
set GOOGLE_CLIENT_X509_CERT_URL=https://www.googleapis.com/robot/v1/metadata/x509/drive-uploader%40amplified-alpha-485305-u5.iam.gserviceaccount.com
set GOOGLE_UNIVERSE_DOMAIN=googleapis.com
set PORT=3010
echo.
echo Starting server in development mode (auto-restarts on changes)...
echo Access the app at: http://localhost:3010
echo Press Ctrl+C to stop the server
echo.
npm run dev
pause
