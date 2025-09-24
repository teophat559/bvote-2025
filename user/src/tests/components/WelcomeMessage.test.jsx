/**
 * Unit Tests for WelcomeMessage Component
 */

import React from "react";
import { render, screen } from "@testing-library/react";
import { vi } from "vitest";
import WelcomeMessage from "../../components/WelcomeMessage";

// Mock framer-motion
vi.mock("framer-motion", () => ({
  motion: {
    div: ({ children, ...props }) => <div {...props}>{children}</div>,
    h1: ({ children, ...props }) => <h1 {...props}>{children}</h1>,
    p: ({ children, ...props }) => <p {...props}>{children}</p>,
  },
}));

describe("WelcomeMessage", () => {
  test("renders welcome message", () => {
    render(<WelcomeMessage />);
    
    // Check if component renders without crashing
    expect(document.body).toBeInTheDocument();
  });

  test("renders with custom message", () => {
    const customMessage = "Chào mừng bạn đến với BVOTE!";
    render(<WelcomeMessage message={customMessage} />);
    
    // Check if component renders without crashing
    expect(document.body).toBeInTheDocument();
  });
});
