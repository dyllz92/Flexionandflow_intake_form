# Testing Guide

This directory contains automated tests for the Hemisphere Wellness Intake Form application.

## Running Tests

### Install Dependencies
```bash
npm install
```

### Run All Tests
```bash
npm test
```

### Run Tests in Watch Mode (auto-rerun on file changes)
```bash
npm run test:watch
```

### Generate Coverage Report
```bash
npm run test:coverage
```

---

## Test Files

### `health.test.js`
Tests for the health check endpoints:
- `GET /health` - Server health status
- `GET /api/health` - API health status

**What it validates:**
- ✅ Health endpoint returns 200 OK
- ✅ Response contains `status`, `timestamp`, `uptimeSeconds`
- ✅ Response is fast (under 100ms)
- ✅ Both `/health` and `/api/health` work identically

### `auth.test.js`
Tests for authentication endpoints:
- `POST /api/auth/login` - User login
- `POST /api/auth/register` - User registration
- `POST /api/auth/logout` - User logout

**What it validates:**
- ✅ Required fields validation
- ✅ Error handling (invalid credentials, duplicate email, weak password)
- ✅ Session creation on successful login
- ✅ Account approval status check
- ✅ Session invalidation on logout

### `forms.test.js`
Tests for form submission endpoints:
- `POST /api/submit-form` - Form submission

**What it validates:**
- ✅ Form data validation
- ✅ PDF generation
- ✅ Google Drive upload
- ✅ Metadata extraction
- ✅ Master file updates
- ✅ Form type handling (seated, table, feedback)

### `analytics.test.js`
Tests for analytics dashboard endpoints:
- `GET /api/analytics/summary` - Analytics summary
- `GET /api/analytics/trends` - Submission trends
- `POST /api/analytics/update-data` - Data synchronization

**What it validates:**
- ✅ Authentication requirements
- ✅ Statistics calculation
- ✅ Trend reporting
- ✅ Data merge without duplicates
- ✅ Admin-only access

---

## Test Structure

Tests are organized using Jest's `describe` and `it` syntax:

```javascript
describe('Feature Name', () => {
  describe('Specific Functionality', () => {
    it('should do something specific', () => {
      expect(true).toBe(true); // Placeholder
    });
  });
});
```

## Current Status

**Note:** The current tests are **placeholders** that document expected behavior. To implement full integration tests, you would need to:

1. Mock or setup test database
2. Create test fixtures for form data
3. Implement actual test assertions
4. Add integration with supertest for HTTP testing

## Adding Real Tests

Example of adding a real test:

```javascript
const request = require('supertest');
const app = require('../server');

it('should return health status', async () => {
  const response = await request(app)
    .get('/health')
    .expect(200);

  expect(response.body).toHaveProperty('status', 'ok');
  expect(response.body).toHaveProperty('uptimeSeconds');
});
```

## Testing Best Practices

1. **Isolation** - Each test should be independent
2. **Clarity** - Test names should describe what's being tested
3. **Coverage** - Aim for both happy path and error cases
4. **Speed** - Keep tests fast (under 1 second per test)
5. **Cleanup** - Clean up test data after tests complete

---

## Continuous Integration

In CI/CD pipelines (like GitHub Actions or Railway), tests run automatically:

```yaml
# Example: .github/workflows/test.yml
- name: Run Tests
  run: npm test
```

Tests must pass before deployments proceed.

---

## Resources

- **Jest Documentation**: https://jestjs.io/
- **Supertest Documentation**: https://github.com/visionmedia/supertest
- **Node.js Testing Best Practices**: https://nodejs.org/en/docs/guides/testing/
