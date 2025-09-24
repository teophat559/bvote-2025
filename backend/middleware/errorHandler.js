import winston from "winston";
import path from "path";
import fs from "fs";

// Create logs directory if it doesn't exist
const logsDir = path.join(process.cwd(), "logs");
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

// Configure logger
export const logger = winston.createLogger({
  level: "info",
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  defaultMeta: { service: "bvote-backend" },
  transports: [
    new winston.transports.File({
      filename: path.join(logsDir, "error.log"),
      level: "error",
    }),
    new winston.transports.File({
      filename: path.join(logsDir, "combined.log"),
    }),
    ...(process.env.NODE_ENV !== "production"
      ? [
          new winston.transports.Console({
            format: winston.format.simple(),
          }),
        ]
      : []),
  ],
});

// Custom error class for API errors
export class APIError extends Error {
  constructor(message, statusCode = 500, errorCode = null, details = null) {
    super(message);
    this.name = "APIError";
    this.statusCode = statusCode;
    this.errorCode = errorCode;
    this.details = details;
    this.isOperational = true;
  }
}

// Error response formatter
const formatErrorResponse = (error, req) => {
  const isProduction = process.env.NODE_ENV === "production";

  const baseResponse = {
    success: false,
    error: {
      message: error.message,
      statusCode: error.statusCode || 500,
      timestamp: new Date().toISOString(),
      path: req.originalUrl,
      method: req.method,
    },
  };

  // Add additional info for non-production
  if (!isProduction) {
    baseResponse.error.stack = error.stack;
    baseResponse.error.details = error.details;
  }

  // Add error code if available
  if (error.errorCode) {
    baseResponse.error.code = error.errorCode;
  }

  return baseResponse;
};

// Main error handling middleware
export const errorHandler = (error, req, res, next) => {
  // Log the error
  logger.error("Error occurred:", {
    error: error.message,
    stack: error.stack,
    url: req.originalUrl,
    method: req.method,
    ip: req.ip,
    userAgent: req.get("User-Agent"),
    userId: req.user?.id || "anonymous",
    timestamp: new Date().toISOString(),
  });

  // Handle different error types
  let statusCode = 500;
  let message = "Internal Server Error";

  if (error instanceof APIError) {
    statusCode = error.statusCode;
    message = error.message;
  } else if (error.name === "ValidationError") {
    statusCode = 400;
    message = "Validation Error";
  } else if (
    error.name === "UnauthorizedError" ||
    error.name === "JsonWebTokenError"
  ) {
    statusCode = 401;
    message = "Unauthorized";
  } else if (error.name === "ForbiddenError") {
    statusCode = 403;
    message = "Forbidden";
  } else if (error.name === "NotFoundError") {
    statusCode = 404;
    message = "Not Found";
  } else if (error.code === "LIMIT_FILE_SIZE") {
    statusCode = 413;
    message = "File too large";
  } else if (error.type === "entity.parse.failed") {
    statusCode = 400;
    message = "Invalid JSON";
  }

  // Create error object with status code
  const errorObj = new APIError(
    message,
    statusCode,
    error.errorCode,
    error.details
  );

  // Format response
  const response = formatErrorResponse(errorObj, req);

  // Send response
  res.status(statusCode).json(response);
};

// 404 Not Found handler
export const notFoundHandler = (req, res, next) => {
  const error = new APIError(
    `Route ${req.originalUrl} not found`,
    404,
    "ROUTE_NOT_FOUND",
    {
      availableRoutes: [
        "/api/auth/login",
        "/api/auth/refresh",
        "/api/health",
        "/api/dashboard/stats",
        "/api/login-requests",
      ],
    }
  );

  next(error);
};

// Async error wrapper
export const asyncHandler = (fn) => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

// Health check with detailed status
export const healthCheck = asyncHandler(async (req, res) => {
  const healthStatus = {
    status: "OK",
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    version: process.version,
    services: {
      database: "checking...",
      redis: "checking...",
    },
  };

  try {
    // Check database connection (assuming you have productionDB)
    if (global.productionDB && global.productionDB.isInitialized) {
      await global.productionDB.query("SELECT 1");
      healthStatus.services.database = "healthy";
    } else {
      healthStatus.services.database = "unhealthy";
      healthStatus.status = "DEGRADED";
    }
  } catch (error) {
    healthStatus.services.database = "unhealthy";
    healthStatus.status = "DEGRADED";
    logger.error("Database health check failed:", error);
  }

  // Set appropriate status code
  const statusCode = healthStatus.status === "OK" ? 200 : 503;

  res.status(statusCode).json(healthStatus);
});

// Rate limit error handler
export const rateLimitHandler = (req, res, next) => {
  const error = new APIError(
    "Too many requests, please try again later",
    429,
    "RATE_LIMIT_EXCEEDED",
    {
      retryAfter: "60 seconds",
    }
  );

  next(error);
};

// Database connection error handler
export const dbErrorHandler = (error, operation = "database operation") => {
  logger.error(`Database error during ${operation}:`, error);

  if (error.code === "ECONNREFUSED") {
    return new APIError(
      "Database connection refused",
      503,
      "DB_CONNECTION_REFUSED"
    );
  } else if (error.code === "ENOTFOUND") {
    return new APIError("Database host not found", 503, "DB_HOST_NOT_FOUND");
  } else if (error.code === "28P01") {
    return new APIError(
      "Database authentication failed",
      503,
      "DB_AUTH_FAILED"
    );
  } else if (error.code === "3D000") {
    return new APIError("Database does not exist", 503, "DB_NOT_EXISTS");
  }

  return new APIError("Database operation failed", 503, "DB_OPERATION_FAILED");
};

export default {
  errorHandler,
  notFoundHandler,
  asyncHandler,
  healthCheck,
  rateLimitHandler,
  dbErrorHandler,
  APIError,
  logger,
};
