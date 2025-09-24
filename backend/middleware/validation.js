import validator from "validator";
import logger from "../services/logger.js";

/**
 * Input Validation and Sanitization Middleware
 * Protects against XSS, SQL injection, and other input-based attacks
 */

// Common validation patterns
const patterns = {
  username: /^[a-zA-Z0-9_]{3,30}$/,
  email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  password:
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/,
  id: /^[a-zA-Z0-9-_]{1,50}$/,
  name: /^[a-zA-Z\s]{2,100}$/,
  phone: /^\+?[1-9]\d{1,14}$/,
  url: /^https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)$/,
};

// Dangerous patterns to detect
const dangerousPatterns = [
  /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, // Script tags
  /javascript:/gi, // JavaScript protocol
  /on\w+\s*=/gi, // Event handlers
  /data:text\/html/gi, // Data URLs
  /vbscript:/gi, // VBScript
  /expression\s*\(/gi, // CSS expressions
  /(union|select|insert|update|delete|drop|create|alter|exec|execute)\s+/gi, // SQL keywords
  /(\||&|;|`|\$\(|\${)/g, // Command injection
];

// XSS patterns
const xssPatterns = [
  /<[^>]*script/gi,
  /<[^>]*iframe/gi,
  /<[^>]*object/gi,
  /<[^>]*embed/gi,
  /<[^>]*link/gi,
  /<[^>]*meta/gi,
  /javascript:/gi,
  /vbscript:/gi,
  /onload=/gi,
  /onerror=/gi,
  /onclick=/gi,
];

// Sanitization functions
export const sanitizers = {
  // Basic string sanitization
  string: (value, maxLength = 1000) => {
    if (typeof value !== "string") return "";

    // Remove null bytes and control characters
    let sanitized = value.replace(/[\x00-\x1F\x7F]/g, "");

    // Trim whitespace
    sanitized = sanitized.trim();

    // Limit length
    if (sanitized.length > maxLength) {
      sanitized = sanitized.substring(0, maxLength);
    }

    return sanitized;
  },

  // HTML escape
  html: (value) => {
    if (typeof value !== "string") return "";

    return value
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#x27;")
      .replace(/\//g, "&#x2F;");
  },

  // SQL escape (basic)
  sql: (value) => {
    if (typeof value !== "string") return "";

    return value.replace(/[\0\x08\x09\x1a\n\r"'\\\%]/g, (char) => {
      switch (char) {
        case "\0":
          return "\\0";
        case "\x08":
          return "\\b";
        case "\x09":
          return "\\t";
        case "\x1a":
          return "\\z";
        case "\n":
          return "\\n";
        case "\r":
          return "\\r";
        case '"':
        case "'":
        case "\\":
        case "%":
          return "\\" + char;
        default:
          return char;
      }
    });
  },

  // Email sanitization
  email: (value) => {
    if (typeof value !== "string") return "";

    const sanitized = sanitizers.string(value, 255).toLowerCase();
    return validator.isEmail(sanitized) ? sanitized : "";
  },

  // URL sanitization
  url: (value) => {
    if (typeof value !== "string") return "";

    const sanitized = sanitizers.string(value, 2048);
    return validator.isURL(sanitized, {
      protocols: ["http", "https"],
      require_protocol: true,
    })
      ? sanitized
      : "";
  },

  // Phone number sanitization
  phone: (value) => {
    if (typeof value !== "string") return "";

    // Remove all non-digit characters except + at the beginning
    const sanitized = value.replace(/[^\d+]/g, "").replace(/(?!^)\+/g, "");
    return patterns.phone.test(sanitized) ? sanitized : "";
  },

  // Username sanitization
  username: (value) => {
    if (typeof value !== "string") return "";

    const sanitized = sanitizers
      .string(value, 30)
      .replace(/[^a-zA-Z0-9_]/g, "");
    return patterns.username.test(sanitized) ? sanitized : "";
  },
};

// Validation functions
export const validators = {
  // Required field validator
  required: (value, fieldName) => {
    if (value === undefined || value === null || value === "") {
      return `${fieldName} is required`;
    }
    return null;
  },

  // String length validator
  length: (value, min, max, fieldName) => {
    if (typeof value !== "string") {
      return `${fieldName} must be a string`;
    }

    if (value.length < min) {
      return `${fieldName} must be at least ${min} characters long`;
    }

    if (value.length > max) {
      return `${fieldName} must be no more than ${max} characters long`;
    }

    return null;
  },

  // Pattern validator
  pattern: (value, pattern, fieldName, errorMessage) => {
    if (typeof value !== "string") {
      return `${fieldName} must be a string`;
    }

    if (!pattern.test(value)) {
      return errorMessage || `${fieldName} format is invalid`;
    }

    return null;
  },

  // Email validator
  email: (value, fieldName = "Email") => {
    if (!validator.isEmail(value)) {
      return `${fieldName} format is invalid`;
    }
    return null;
  },

  // URL validator
  url: (value, fieldName = "URL") => {
    if (!validator.isURL(value, { protocols: ["http", "https"] })) {
      return `${fieldName} format is invalid`;
    }
    return null;
  },

  // Number validator
  number: (value, min, max, fieldName) => {
    const num = Number(value);

    if (isNaN(num)) {
      return `${fieldName} must be a valid number`;
    }

    if (min !== undefined && num < min) {
      return `${fieldName} must be at least ${min}`;
    }

    if (max !== undefined && num > max) {
      return `${fieldName} must be no more than ${max}`;
    }

    return null;
  },

  // Array validator
  array: (value, minLength, maxLength, fieldName) => {
    if (!Array.isArray(value)) {
      return `${fieldName} must be an array`;
    }

    if (minLength !== undefined && value.length < minLength) {
      return `${fieldName} must have at least ${minLength} items`;
    }

    if (maxLength !== undefined && value.length > maxLength) {
      return `${fieldName} must have no more than ${maxLength} items`;
    }

    return null;
  },
};

// Danger detection
export const detectDangerousContent = (value) => {
  if (typeof value !== "string") return false;

  return dangerousPatterns.some((pattern) => pattern.test(value));
};

export const detectXSS = (value) => {
  if (typeof value !== "string") return false;

  return xssPatterns.some((pattern) => pattern.test(value));
};

// Main validation middleware
export const validateInput = (schema) => {
  return (req, res, next) => {
    const errors = [];
    const sanitizedData = {};

    for (const [field, rules] of Object.entries(schema)) {
      let value = req.body[field];

      // Apply sanitization first
      if (rules.sanitize && sanitizers[rules.sanitize]) {
        value = sanitizers[rules.sanitize](value, rules.maxLength);
        sanitizedData[field] = value;
      }

      // Apply validation rules
      if (rules.required) {
        const error = validators.required(value, field);
        if (error) {
          errors.push({ field, message: error });
          continue;
        }
      }

      if (rules.length) {
        const error = validators.length(
          value,
          rules.length.min,
          rules.length.max,
          field
        );
        if (error) errors.push({ field, message: error });
      }

      if (rules.pattern) {
        const error = validators.pattern(
          value,
          rules.pattern,
          field,
          rules.patternMessage
        );
        if (error) errors.push({ field, message: error });
      }

      if (rules.type === "email") {
        const error = validators.email(value, field);
        if (error) errors.push({ field, message: error });
      }

      if (rules.type === "url") {
        const error = validators.url(value, field);
        if (error) errors.push({ field, message: error });
      }

      if (rules.type === "number") {
        const error = validators.number(value, rules.min, rules.max, field);
        if (error) errors.push({ field, message: error });
      }

      if (rules.type === "array") {
        const error = validators.array(
          value,
          rules.minLength,
          rules.maxLength,
          field
        );
        if (error) errors.push({ field, message: error });
      }

      // Check for dangerous content
      if (rules.checkDangerous !== false && detectDangerousContent(value)) {
        logger.security("Dangerous content detected in input", {
          field,
          value: value?.substring(0, 100) + "...",
          ip: req.ip,
          userAgent: req.get("User-Agent"),
        });

        errors.push({
          field,
          message: `${field} contains potentially dangerous content`,
        });
      }

      // Check for XSS
      if (rules.checkXSS !== false && detectXSS(value)) {
        logger.security("XSS attempt detected in input", {
          field,
          value: value?.substring(0, 100) + "...",
          ip: req.ip,
          userAgent: req.get("User-Agent"),
        });

        errors.push({
          field,
          message: `${field} contains potentially malicious content`,
        });
      }
    }

    if (errors.length > 0) {
      return res.status(400).json({
        error: "Validation failed",
        details: errors,
      });
    }

    // Replace body with sanitized data
    req.body = { ...req.body, ...sanitizedData };
    next();
  };
};

// Common validation schemas
export const commonSchemas = {
  login: {
    username: {
      required: true,
      sanitize: "username",
      length: { min: 3, max: 30 },
      pattern: patterns.username,
    },
    password: {
      required: true,
      sanitize: "string",
      length: { min: 8, max: 128 },
    },
  },

  register: {
    username: {
      required: true,
      sanitize: "username",
      length: { min: 3, max: 30 },
      pattern: patterns.username,
    },
    email: {
      required: true,
      sanitize: "email",
      type: "email",
    },
    password: {
      required: true,
      sanitize: "string",
      length: { min: 8, max: 128 },
      pattern: patterns.password,
      patternMessage:
        "Password must contain at least 8 characters with uppercase, lowercase, number and special character",
    },
  },

  contest: {
    title: {
      required: true,
      sanitize: "html",
      length: { min: 3, max: 200 },
    },
    description: {
      required: true,
      sanitize: "html",
      length: { min: 10, max: 2000 },
    },
  },

  vote: {
    contestId: {
      required: true,
      sanitize: "string",
      pattern: patterns.id,
    },
    contestantId: {
      required: true,
      sanitize: "string",
      pattern: patterns.id,
    },
  },
};

export default {
  validateInput,
  sanitizers,
  validators,
  detectDangerousContent,
  detectXSS,
  commonSchemas,
};
