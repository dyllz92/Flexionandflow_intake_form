/**
 * Health Check Endpoint Tests
 * Tests the /health and /api/health endpoints
 */

const request = require('supertest');
const express = require('express');

// Create a minimal app for testing
const createTestApp = () => {
  const app = express();
  app.use(express.json());

  // Health endpoint
  const healthPayload = () => ({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptimeSeconds: Math.round(process.uptime())
  });

  app.get('/health', (req, res) => {
    res.status(200).json(healthPayload());
  });

  app.get('/api/health', (req, res) => {
    res.status(200).json(healthPayload());
  });

  return app;
};

describe('Health Check Endpoints', () => {
  let app;

  beforeAll(() => {
    app = createTestApp();
  });

  describe('GET /health', () => {
    it('should return 200 OK', async () => {
      const response = await request(app).get('/health');
      expect(response.status).toBe(200);
    });

    it('should return JSON with status ok', async () => {
      const response = await request(app).get('/health');
      expect(response.body).toHaveProperty('status', 'ok');
    });

    it('should include timestamp', async () => {
      const response = await request(app).get('/health');
      expect(response.body).toHaveProperty('timestamp');
      expect(typeof response.body.timestamp).toBe('string');
    });

    it('should include uptime in seconds', async () => {
      const response = await request(app).get('/health');
      expect(response.body).toHaveProperty('uptimeSeconds');
      expect(typeof response.body.uptimeSeconds).toBe('number');
      expect(response.body.uptimeSeconds).toBeGreaterThanOrEqual(0);
    });
  });

  describe('GET /api/health', () => {
    it('should return 200 OK', async () => {
      const response = await request(app).get('/api/health');
      expect(response.status).toBe(200);
    });

    it('should return same format as /health', async () => {
      const response = await request(app).get('/api/health');
      expect(response.body).toHaveProperty('status', 'ok');
      expect(response.body).toHaveProperty('timestamp');
      expect(response.body).toHaveProperty('uptimeSeconds');
    });
  });

  describe('Server Response Time', () => {
    it('should respond quickly (under 100ms)', async () => {
      const start = Date.now();
      await request(app).get('/health');
      const duration = Date.now() - start;
      expect(duration).toBeLessThan(100);
    });
  });
});
