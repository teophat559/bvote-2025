/**
 * User Feedback API Routes
 * Handles feedback from users to admin
 */

import express from "express";
import { body, validationResult } from "express-validator";
import { v4 as uuidv4 } from "uuid";

const router = express.Router();

// In-memory storage for feedback (in production, use database)
let feedbackStorage = new Map();

// Get all feedback for admin
router.get("/", (req, res) => {
  const { status, type, limit = 50, offset = 0 } = req.query;

  let feedbacks = Array.from(feedbackStorage.values());

  // Filter by status
  if (status && status !== "all") {
    feedbacks = feedbacks.filter((f) => f.status === status);
  }

  // Filter by type
  if (type && type !== "all") {
    feedbacks = feedbacks.filter((f) => f.feedbackType === type);
  }

  // Sort by timestamp (newest first)
  feedbacks.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

  // Pagination
  const total = feedbacks.length;
  const paginatedFeedbacks = feedbacks.slice(
    parseInt(offset),
    parseInt(offset) + parseInt(limit)
  );

  res.json({
    success: true,
    data: paginatedFeedbacks,
    total,
    limit: parseInt(limit),
    offset: parseInt(offset),
    timestamp: new Date().toISOString(),
  });
});

// Get specific feedback
router.get("/:id", (req, res) => {
  const { id } = req.params;
  const feedback = feedbackStorage.get(id);

  if (!feedback) {
    return res.status(404).json({
      success: false,
      message: "Feedback not found",
    });
  }

  res.json({
    success: true,
    data: feedback,
    timestamp: new Date().toISOString(),
  });
});

// Submit feedback from user
router.post(
  "/",
  [
    body("historyId").notEmpty().withMessage("History ID is required"),
    body("feedbackType")
      .isIn(["positive", "negative", "report", "question"])
      .withMessage("Invalid feedback type"),
    body("message")
      .optional()
      .isString()
      .isLength({ max: 1000 })
      .withMessage("Message too long"),
    body("userAgent").optional().isString(),
    body("url").optional().isURL(),
  ],
  (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array(),
      });
    }

    const {
      historyId,
      feedbackType,
      message = "",
      userAgent,
      url,
      timestamp,
    } = req.body;

    const feedbackId = uuidv4();
    const feedback = {
      id: feedbackId,
      historyId,
      feedbackType,
      message,
      userAgent,
      url,
      timestamp: timestamp || new Date().toISOString(),
      status: "new", // new, read, resolved
      adminNotes: "",
      resolvedAt: null,
      resolvedBy: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    feedbackStorage.set(feedbackId, feedback);

    // Emit to admin via WebSocket if available
    if (req.app.get("io")) {
      req.app.get("io").emit("user_feedback:new", feedback);
    }

    res.status(201).json({
      success: true,
      data: {
        feedbackId,
        message: "Feedback submitted successfully",
      },
      timestamp: new Date().toISOString(),
    });
  }
);

// Update feedback status (admin only)
router.put(
  "/:id/status",
  [
    body("status")
      .isIn(["new", "read", "resolved"])
      .withMessage("Invalid status"),
    body("adminNotes").optional().isString().isLength({ max: 2000 }),
    body("resolvedBy").optional().isString(),
  ],
  (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array(),
      });
    }

    const { id } = req.params;
    const { status, adminNotes, resolvedBy } = req.body;

    const feedback = feedbackStorage.get(id);
    if (!feedback) {
      return res.status(404).json({
        success: false,
        message: "Feedback not found",
      });
    }

    // Update feedback
    feedback.status = status;
    feedback.updatedAt = new Date().toISOString();

    if (adminNotes !== undefined) {
      feedback.adminNotes = adminNotes;
    }

    if (status === "resolved") {
      feedback.resolvedAt = new Date().toISOString();
      feedback.resolvedBy = resolvedBy || "admin";
    }

    feedbackStorage.set(id, feedback);

    // Emit update to admin
    if (req.app.get("io")) {
      req.app.get("io").emit("user_feedback:updated", feedback);
    }

    res.json({
      success: true,
      data: feedback,
      message: "Feedback status updated successfully",
    });
  }
);

// Delete feedback (admin only)
router.delete("/:id", (req, res) => {
  const { id } = req.params;

  if (!feedbackStorage.has(id)) {
    return res.status(404).json({
      success: false,
      message: "Feedback not found",
    });
  }

  feedbackStorage.delete(id);

  // Emit deletion to admin
  if (req.app.get("io")) {
    req.app.get("io").emit("user_feedback:deleted", { id });
  }

  res.json({
    success: true,
    message: "Feedback deleted successfully",
  });
});

// Get feedback statistics
router.get("/stats/summary", (req, res) => {
  const feedbacks = Array.from(feedbackStorage.values());

  const stats = {
    total: feedbacks.length,
    byType: {
      positive: feedbacks.filter((f) => f.feedbackType === "positive").length,
      negative: feedbacks.filter((f) => f.feedbackType === "negative").length,
      report: feedbacks.filter((f) => f.feedbackType === "report").length,
      question: feedbacks.filter((f) => f.feedbackType === "question").length,
    },
    byStatus: {
      new: feedbacks.filter((f) => f.status === "new").length,
      read: feedbacks.filter((f) => f.status === "read").length,
      resolved: feedbacks.filter((f) => f.status === "resolved").length,
    },
    recent: feedbacks
      .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
      .slice(0, 10),
  };

  res.json({
    success: true,
    data: stats,
    timestamp: new Date().toISOString(),
  });
});

export default router;
