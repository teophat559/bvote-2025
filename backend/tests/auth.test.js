/**
 * Authentication Tests
 * Comprehensive test suite for authentication endpoints
 */

import { jest } from "@jest/globals";
import request from "supertest";
import { app } from "../server.js";

describe("Authentication API", () => {
  describe("POST /api/auth/login", () => {
    test("should login with valid user credentials", async () => {
      const response = await request(app)
        .post("/api/auth/login")
        .send({
          email: "user@bvote.com",
          password: "password123",
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.token).toBeDefined();
      expect(response.body.user.email).toBe("user@bvote.com");
      expect(response.body.user.role).toBe("user");
    });

    test("should login with valid admin credentials", async () => {
      const response = await request(app)
        .post("/api/auth/login")
        .send({
          email: "admin@bvote.com",
          password: "admin123",
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.token).toBeDefined();
      expect(response.body.user.email).toBe("admin@bvote.com");
      expect(response.body.user.role).toBe("admin");
    });

    test("should login with valid admin key", async () => {
      const response = await request(app)
        .post("/api/auth/login")
        .send({
          email: "admin@bvote.com",
          password: "dummy",
          adminKey: "WEBBVOTE2025$ABC",
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.token).toBeDefined();
      expect(response.body.user.role).toBe("superadmin");
    });

    test("should reject invalid credentials", async () => {
      const response = await request(app)
        .post("/api/auth/login")
        .send({
          email: "user@bvote.com",
          password: "wrongpassword",
        });

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain("Invalid credentials");
    });

    test("should reject invalid admin key", async () => {
      const response = await request(app)
        .post("/api/auth/login")
        .send({
          email: "admin@bvote.com",
          password: "dummy",
          adminKey: "INVALID_KEY",
        });

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain("Invalid admin key");
    });

    test("should validate email format", async () => {
      const response = await request(app)
        .post("/api/auth/login")
        .send({
          email: "invalid-email",
          password: "password123",
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain("Validation failed");
    });

    test("should require password", async () => {
      const response = await request(app)
        .post("/api/auth/login")
        .send({
          email: "user@bvote.com",
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });
  });

  describe("POST /api/auth/register", () => {
    test("should register new user with valid data", async () => {
      const response = await request(app)
        .post("/api/auth/register")
        .send({
          email: "newuser@test.com",
          password: "SecurePass123!",
          name: "New User",
        });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.user.email).toBe("newuser@test.com");
      expect(response.body.user.role).toBe("user");
    });

    test("should reject weak password", async () => {
      const response = await request(app)
        .post("/api/auth/register")
        .send({
          email: "newuser@test.com",
          password: "123456",
          name: "New User",
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain("Validation failed");
    });

    test("should reject disposable email", async () => {
      const response = await request(app)
        .post("/api/auth/register")
        .send({
          email: "test@10minutemail.com",
          password: "SecurePass123!",
          name: "New User",
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    test("should reject duplicate email", async () => {
      // First registration
      await request(app)
        .post("/api/auth/register")
        .send({
          email: "duplicate@test.com",
          password: "SecurePass123!",
          name: "First User",
        });

      // Second registration with same email
      const response = await request(app)
        .post("/api/auth/register")
        .send({
          email: "duplicate@test.com",
          password: "SecurePass123!",
          name: "Second User",
        });

      expect(response.status).toBe(409);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain("User already exists");
    });
  });

  describe("POST /api/auth/refresh", () => {
    let refreshToken;

    beforeEach(async () => {
      const loginResponse = await request(app)
        .post("/api/auth/login")
        .send({
          email: "user@bvote.com",
          password: "password123",
        });

      refreshToken = loginResponse.body.refreshToken;
    });

    test("should refresh token with valid refresh token", async () => {
      const response = await request(app)
        .post("/api/auth/refresh")
        .send({
          refreshToken,
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.token).toBeDefined();
    });

    test("should reject invalid refresh token", async () => {
      const response = await request(app)
        .post("/api/auth/refresh")
        .send({
          refreshToken: "invalid_token",
        });

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });

    test("should require refresh token", async () => {
      const response = await request(app)
        .post("/api/auth/refresh")
        .send({});

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain("Refresh token required");
    });
  });

  describe("GET /api/auth/me", () => {
    let authToken;

    beforeEach(async () => {
      const loginResponse = await request(app)
        .post("/api/auth/login")
        .send({
          email: "user@bvote.com",
          password: "password123",
        });

      authToken = loginResponse.body.token;
    });

    test("should return user info with valid token", async () => {
      const response = await request(app)
        .get("/api/auth/me")
        .set("Authorization", `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.user.email).toBe("user@bvote.com");
    });

    test("should reject request without token", async () => {
      const response = await request(app).get("/api/auth/me");

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });

    test("should reject invalid token", async () => {
      const response = await request(app)
        .get("/api/auth/me")
        .set("Authorization", "Bearer invalid_token");

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });
  });

  describe("POST /api/auth/logout", () => {
    let authToken;

    beforeEach(async () => {
      const loginResponse = await request(app)
        .post("/api/auth/login")
        .send({
          email: "user@bvote.com",
          password: "password123",
        });

      authToken = loginResponse.body.token;
    });

    test("should logout successfully", async () => {
      const response = await request(app)
        .post("/api/auth/logout")
        .set("Authorization", `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toContain("Logged out successfully");
    });

    test("should handle logout without token", async () => {
      const response = await request(app).post("/api/auth/logout");

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });
  });

  describe("Rate Limiting", () => {
    test("should apply rate limiting to login attempts", async () => {
      // Make multiple failed login attempts
      const promises = Array(10)
        .fill()
        .map(() =>
          request(app)
            .post("/api/auth/login")
            .send({
              email: "user@bvote.com",
              password: "wrongpassword",
            })
        );

      const responses = await Promise.all(promises);

      // Some requests should be rate limited
      const rateLimitedResponses = responses.filter((r) => r.status === 429);
      expect(rateLimitedResponses.length).toBeGreaterThan(0);
    });
  });

  describe("Security Headers", () => {
    test("should include security headers in response", async () => {
      const response = await request(app).get("/api/auth/me");

      expect(response.headers["x-content-type-options"]).toBe("nosniff");
      expect(response.headers["x-frame-options"]).toBe("DENY");
      expect(response.headers["x-xss-protection"]).toBe("1; mode=block");
    });
  });
});
