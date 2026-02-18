/**
 * Form Submission Endpoint Integration Tests
 * Exercises the real /api/submit-form route via an actual server process.
 */

const path = require("path");
const http = require("http");
const { spawn } = require("child_process");
const request = require("supertest");

jest.setTimeout(30000);

const TEST_PORT = 3200 + Math.floor(Math.random() * 200);
const BASE_URL = `http://127.0.0.1:${TEST_PORT}`;

let serverProcess;

function waitForServer(url, timeoutMs = 15000) {
  const started = Date.now();

  return new Promise((resolve, reject) => {
    const ping = () => {
      const req = http.get(`${url}/health`, (res) => {
        res.resume();
        if (res.statusCode === 200) {
          resolve();
          return;
        }
        retry();
      });

      req.on("error", retry);
      req.setTimeout(1000, () => {
        req.destroy();
        retry();
      });
    };

    const retry = () => {
      if (Date.now() - started > timeoutMs) {
        reject(new Error("Timed out waiting for test server to start"));
        return;
      }
      setTimeout(ping, 200);
    };

    ping();
  });
}

describe("Form Submission Endpoints", () => {
  beforeAll(async () => {
    const serverPath = path.join(__dirname, "..", "server.js");

    serverProcess = spawn(process.execPath, [serverPath], {
      env: {
        ...process.env,
        PORT: String(TEST_PORT),
        E2E_MODE: "true",
      },
      stdio: "ignore",
    });

    await waitForServer(BASE_URL);
  });

  afterAll(async () => {
    if (!serverProcess) return;

    await new Promise((resolve) => {
      let forceKillTimer;
      serverProcess.once("exit", () => resolve());
      serverProcess.kill();
      forceKillTimer = setTimeout(() => {
        if (!serverProcess.killed) {
          serverProcess.kill();
        }
        resolve();
      }, 4000);

      serverProcess.once("exit", () => {
        if (forceKillTimer) {
          clearTimeout(forceKillTimer);
        }
      });
    });

    // Ensure process handles are released for Jest
    if (serverProcess.stdout) serverProcess.stdout.destroy();
    if (serverProcess.stderr) serverProcess.stderr.destroy();
  });

  describe("POST /api/submit-form", () => {
    const validIntakePayload = {
      formType: "seated",
      firstName: "Test",
      lastName: "User",
      mobile: "0412345678",
      email: "test.user@example.com",
      consentAll: true,
    };

    it("rejects intake submissions when email is missing", async () => {
      const response = await request(BASE_URL)
        .post("/api/submit-form")
        .send({ ...validIntakePayload, email: "" });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toMatch(/email/i);
    });

    it("rejects submissions when consent is missing", async () => {
      const response = await request(BASE_URL)
        .post("/api/submit-form")
        .send({ ...validIntakePayload, consentAll: false });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toMatch(/consent/i);
    });

    it("accepts minimal valid intake payload in E2E mode", async () => {
      const response = await request(BASE_URL)
        .post("/api/submit-form")
        .send(validIntakePayload);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.fileId).toBe("e2e-test-mock-id");
    });
  });

  describe("Feedback Form", () => {
    it("accepts feedback payload without email or mobile", async () => {
      const response = await request(BASE_URL).post("/api/submit-form").send({
        formType: "feedback",
        fullName: "Feedback User",
      });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });
  });
});
