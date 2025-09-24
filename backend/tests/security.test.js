/**
 * Security Tests
 * Comprehensive security testing for the API
 */

import { jest } from "@jest/globals";
import request from "supertest";
import { app } from "../server.js";
import SecurityService from "../services/SecurityService.js";

describe("Security Tests", () => {
  let securityService;

  beforeAll(() => {
    securityService = new SecurityService("test-encryption-key-32-chars!!");
  });

  describe("Input Validation", () => {
    test("should reject SQL injection attempts", async () => {
      const maliciousInputs = [
        "'; DROP TABLE users; --",
        "1' OR '1'='1",
        "UNION SELECT * FROM users",
        "'; DELETE FROM users; --",
      ];

      for (const input of maliciousInputs) {
        const response = await request(app)
          .post("/api/auth/login")
          .send({
            email: input,
            password: "test",
          });

        expect(response.status).toBe(400);
        expect(response.body.success).toBe(false);
      }
    });

    test("should reject XSS attempts", async () => {
      const xssInputs = [
        '<script>alert("xss")</script>',
        'javascript:alert("xss")',
        '<img src="x" onerror="alert(1)">',
        '"><script>alert("xss")</script>',
      ];

      for (const input of xssInputs) {
        const response = await request(app)
          .post("/api/auth/register")
          .send({
            email: "test@test.com",
            password: "SecurePass123!",
            name: input,
          });

        expect(response.status).toBe(400);
        expect(response.body.success).toBe(false);
      }
    });

    test("should validate email format strictly", async () => {
      const invalidEmails = [
        "notanemail",
        "@domain.com",
        "user@",
        "user..double.dot@domain.com",
        "user@domain",
        "user@domain..com",
      ];

      for (const email of invalidEmails) {
        const response = await request(app)
          .post("/api/auth/login")
          .send({
            email,
            password: "password123",
          });

        expect(response.status).toBe(400);
      }
    });

    test("should enforce password complexity", async () => {
      const weakPasswords = [
        "123456",
        "password",
        "abc123",
        "PASSWORD123",
        "password123",
        "Password",
        "12345678",
      ];

      for (const password of weakPasswords) {
        const response = await request(app)
          .post("/api/auth/register")
          .send({
            email: "test@test.com",
            password,
            name: "Test User",
          });

        expect(response.status).toBe(400);
        expect(response.body.message).toContain("Validation failed");
      }
    });
  });

  describe("Rate Limiting", () => {
    test("should apply general rate limiting", async () => {
      const requests = Array(200)
        .fill()
        .map((_, i) =>
          request(app)
            .get("/health")
            .set("X-Forwarded-For", "192.168.1.100")
        );

      const responses = await Promise.all(requests);
      const rateLimited = responses.filter((r) => r.status === 429);

      expect(rateLimited.length).toBeGreaterThan(0);
    });

    test("should apply strict rate limiting to auth endpoints", async () => {
      const requests = Array(25)
        .fill()
        .map(() =>
          request(app)
            .post("/api/auth/login")
            .set("X-Forwarded-For", "192.168.1.101")
            .send({
              email: "user@bvote.com",
              password: "wrongpassword",
            })
        );

      const responses = await Promise.all(requests);
      const rateLimited = responses.filter((r) => r.status === 429);

      expect(rateLimited.length).toBeGreaterThan(0);
    });
  });

  describe("Authentication Security", () => {
    test("should use secure JWT tokens", async () => {
      const response = await request(app)
        .post("/api/auth/login")
        .send({
          email: "user@bvote.com",
          password: "password123",
        });

      expect(response.status).toBe(200);
      const token = response.body.token;

      // Token should be a valid JWT format
      expect(token).toMatch(/^[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+$/);

      // Should contain proper claims
      const decoded = securityService.verifyToken(token);
      expect(decoded.userId).toBeDefined();
      expect(decoded.role).toBeDefined();
      expect(decoded.exp).toBeDefined();
    });

    test("should handle token expiration", async () => {
      // This would require mocking time or using short-lived tokens
      // For now, we test with an obviously expired token
      const expiredToken =
        "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJ0ZXN0IiwiZXhwIjoxfQ.invalid";

      const response = await request(app)
        .get("/api/auth/me")
        .set("Authorization", `Bearer ${expiredToken}`);

      expect(response.status).toBe(401);
    });

    test("should prevent admin key brute force", async () => {
      const attempts = Array(20)
        .fill()
        .map((_, i) =>
          request(app)
            .post("/api/auth/login")
            .send({
              email: "admin@bvote.com",
              password: "dummy",
              adminKey: `WRONG_KEY_${i}`,
            })
        );

      const responses = await Promise.all(attempts);
      const rateLimited = responses.filter((r) => r.status === 429);

      expect(rateLimited.length).toBeGreaterThan(0);
    });
  });

  describe("Encryption Services", () => {
    test("should encrypt and decrypt data correctly", () => {
      const testData = "sensitive information";
      const encrypted = securityService.encrypt(testData);

      expect(encrypted.encrypted).toBeDefined();
      expect(encrypted.iv).toBeDefined();
      expect(encrypted.tag).toBeDefined();

      const decrypted = securityService.decrypt(encrypted);
      expect(decrypted).toBe(testData);
    });

    test("should hash passwords securely", async () => {
      const password = "SecurePass123!";
      const hash = await securityService.hashPassword(password);

      expect(hash).toBeDefined();
      expect(hash).not.toBe(password);
      expect(hash.length).toBeGreaterThan(50); // bcrypt hashes are long

      const isValid = await securityService.verifyPassword(password, hash);
      expect(isValid).toBe(true);

      const isInvalid = await securityService.verifyPassword(
        "wrongpassword",
        hash
      );
      expect(isInvalid).toBe(false);
    });

    test("should generate secure random strings", () => {
      const random1 = securityService.generateSecureRandom(32);
      const random2 = securityService.generateSecureRandom(32);

      expect(random1).toHaveLength(64); // hex string is 2x length
      expect(random2).toHaveLength(64);
      expect(random1).not.toBe(random2);
    });

    test("should validate admin keys correctly", () => {
      const validKeys = ["WEBBVOTE2025$ABC", "ADMIN_BVOTE_2025_KEY"];

      const invalidKeys = ["WRONG_KEY", "", null, undefined, "short"];

      validKeys.forEach((key) => {
        expect(securityService.validateAdminKey(key)).toBe(true);
      });

      invalidKeys.forEach((key) => {
        expect(securityService.validateAdminKey(key)).toBe(false);
      });
    });
  });

  describe("Security Headers", () => {
    test("should include comprehensive security headers", async () => {
      const response = await request(app).get("/health");

      const expectedHeaders = [
        "strict-transport-security",
        "x-content-type-options",
        "x-frame-options",
        "x-xss-protection",
        "referrer-policy",
      ];

      expectedHeaders.forEach((header) => {
        expect(response.headers[header]).toBeDefined();
      });
    });

    test("should set correct CSP header", async () => {
      const response = await request(app).get("/health");

      expect(response.headers["content-security-policy"]).toContain(
        "default-src 'self'"
      );
    });
  });

  describe("Input Sanitization", () => {
    test("should sanitize malicious input", () => {
      const maliciousInputs = [
        '<script>alert("xss")</script>',
        "javascript:void(0)",
        'onclick="alert(1)"',
        '<img src="x" onerror="alert(1)">',
      ];

      maliciousInputs.forEach((input) => {
        const sanitized = securityService.sanitizeInput(input);
        expect(sanitized).not.toContain("<script>");
        expect(sanitized).not.toContain("javascript:");
        expect(sanitized).not.toContain("onclick=");
        expect(sanitized).not.toContain("onerror=");
      });
    });

    test("should preserve safe input", () => {
      const safeInputs = [
        "Normal text",
        "user@example.com",
        "Phone: +1234567890",
        "Safe HTML entities: &amp; &lt; &gt;",
      ];

      safeInputs.forEach((input) => {
        const sanitized = securityService.sanitizeInput(input);
        expect(typeof sanitized).toBe("string");
        expect(sanitized.length).toBeGreaterThan(0);
      });
    });
  });

  describe("Session Management", () => {
    test("should create and validate sessions", () => {
      const userId = "test-user-123";
      const role = "user";

      const { token, sessionId } = securityService.generateSessionToken(
        userId,
        role
      );

      expect(token).toBeDefined();
      expect(sessionId).toBeDefined();

      const validation = securityService.validateSession(sessionId);
      expect(validation.valid).toBe(true);
      expect(validation.session.userId).toBe(userId);
      expect(validation.session.role).toBe(role);
    });

    test("should handle session timeout", (done) => {
      // Mock short timeout for testing
      const originalTimeout = securityService.config.sessionTimeout;
      securityService.config.sessionTimeout = 100; // 100ms

      const { sessionId } = securityService.generateSessionToken(
        "test-user",
        "user"
      );

      setTimeout(() => {
        const validation = securityService.validateSession(sessionId);
        expect(validation.valid).toBe(false);
        expect(validation.reason).toContain("expired");

        // Restore original timeout
        securityService.config.sessionTimeout = originalTimeout;
        done();
      }, 150);
    });
  });

  describe("Login Attempt Limiting", () => {
    test("should track and limit login attempts", () => {
      const identifier = "test-user@example.com";

      // First few attempts should be allowed
      for (let i = 0; i < 3; i++) {
        const check = securityService.checkLoginAttempts(identifier);
        expect(check.allowed).toBe(true);
        securityService.recordFailedLogin(identifier);
      }

      // After max attempts, should be locked
      const finalCheck = securityService.checkLoginAttempts(identifier);
      expect(finalCheck.allowed).toBe(false);
      expect(finalCheck.locked).toBe(true);
    });

    test("should clear attempts on successful login", () => {
      const identifier = "test-user-2@example.com";

      // Record some failed attempts
      for (let i = 0; i < 3; i++) {
        securityService.recordFailedLogin(identifier);
      }

      // Clear attempts (simulate successful login)
      securityService.clearLoginAttempts(identifier);

      // Should be allowed again
      const check = securityService.checkLoginAttempts(identifier);
      expect(check.allowed).toBe(true);
    });
  });

  describe("Path Traversal Protection", () => {
    test("should reject path traversal attempts", async () => {
      const maliciousPaths = [
        "../../../etc/passwd",
        "..\\..\\windows\\system32",
        "%2e%2e%2f%2e%2e%2f%2e%2e%2fetc%2fpasswd",
        "....//....//....//etc/passwd",
      ];

      for (const path of maliciousPaths) {
        const response = await request(app).get(`/static/${path}`);

        // Should not return sensitive files
        expect(response.status).not.toBe(200);
      }
    });
  });
});
