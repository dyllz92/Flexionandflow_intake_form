const http = require('http');
const data = JSON.stringify({
  fullName: 'Test User',
  mobile: '0400000000',
  email: 'test@example.com',
  gender: 'non-binary',
  pressurePreference: 'medium',
  healthChecks: ['None'],
  reviewNote: 'Automated test submission',
  avoidNotes: '',
  emailOptIn: false,
  consentAll: true,
  signature: 'text:Test User',
  signedAt: new Date().toISOString(),
  submissionDate: new Date().toISOString(),
  formType: 'test'
});

const options = {
  hostname: 'localhost',
  port: 3000,
  path: '/api/submit-form',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(data)
  }
};

const req = http.request(options, (res) => {
  let body = '';
  res.on('data', (chunk) => body += chunk);
  res.on('end', () => {
    console.log('STATUS', res.statusCode);
    console.log('BODY', body);
  });
});

req.on('error', (e) => {
  console.error('REQUEST_ERROR', e.message);
});

req.write(data);
req.end();

