/**
 * Test Setup Configuration for User Project
 */

import { expect, afterEach } from "vitest";
import { cleanup } from "@testing-library/react";
import * as matchers from "@testing-library/jest-dom/matchers";

// Extend Vitest's expect with jest-dom matchers
expect.extend(matchers);

// Cleanup after each test case
afterEach(() => {
  cleanup();
});

// Mock environment variables
Object.defineProperty(import.meta, "env", {
  value: {
    VITE_API_URL: "http://localhost:3000",
    VITE_SOCKET_URL: "http://localhost:3000",
    VITE_APP_NAME: "BVOTE User Test",
    VITE_ENVIRONMENT: "test",
  },
  writable: true,
});

// Mock localStorage
Object.defineProperty(window, "localStorage", {
  value: {
    getItem: vi.fn(),
    setItem: vi.fn(),
    removeItem: vi.fn(),
    clear: vi.fn(),
  },
  writable: true,
});

// Mock window.location
Object.defineProperty(window, "location", {
  value: {
    href: "http://localhost:3000",
    reload: vi.fn(),
  },
  writable: true,
});

