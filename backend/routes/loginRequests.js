/**
 * Login Requests API Routes
 * Thay thế Supabase login_requests table
 */

import express from "express";

const router = express.Router();

// Mock data storage (thay thế bằng database thực tế)
let loginRequests = [
  {
    id: "1",
    platform: "Facebook",
    account: "user1@example.com",
    password: "password123",
    status: "pending",
    log: "Yêu cầu vừa được tạo",
    created_at: new Date(Date.now() - 1000 * 60 * 30).toISOString(), // 30 minutes ago
    last_updated: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
    otp: null,
  },
  {
    id: "2",
    platform: "Google",
    account: "user2@gmail.com",
    password: "password456",
    status: "need_otp",
    log: "Cần nhập mã OTP để xác thực",
    created_at: new Date(Date.now() - 1000 * 60 * 45).toISOString(), // 45 minutes ago
    last_updated: new Date(Date.now() - 1000 * 60 * 15).toISOString(), // 15 minutes ago
    otp: null,
  },
  {
    id: "3",
    platform: "Instagram",
    account: "socialuser123",
    password: "mypass789",
    status: "success",
    log: "Đăng nhập thành công! Cookies đã được lưu.",
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(), // 2 hours ago
    last_updated: new Date(Date.now() - 1000 * 60 * 45).toISOString(), // 45 minutes ago
    otp: null,
  },
];

let nextId = 4;

// Get all login requests
router.get("/", (req, res) => {
  try {
    // Apply filters if provided
    let filteredRequests = [...loginRequests];

    const { platform, status, limit = 50 } = req.query;

    if (platform) {
      filteredRequests = filteredRequests.filter(r =>
        r.platform.toLowerCase() === platform.toLowerCase()
      );
    }

    if (status) {
      filteredRequests = filteredRequests.filter(r => r.status === status);
    }

    // Sort by last_updated desc
    filteredRequests.sort((a, b) => new Date(b.last_updated) - new Date(a.last_updated));

    // Apply limit
    filteredRequests = filteredRequests.slice(0, parseInt(limit));

    res.json({
      success: true,
      data: filteredRequests,
      message: "Login requests retrieved successfully",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to retrieve login requests",
      error: error.message,
    });
  }
});

// Get single login request by ID
router.get("/:id", (req, res) => {
  try {
    const { id } = req.params;
    const request = loginRequests.find(r => r.id === id);

    if (!request) {
      return res.status(404).json({
        success: false,
        message: "Login request not found",
      });
    }

    res.json({
      success: true,
      data: request,
      message: "Login request retrieved successfully",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to retrieve login request",
      error: error.message,
    });
  }
});

// Create new login request
router.post("/", (req, res) => {
  try {
    const { platform, account, password, status = "pending" } = req.body;

    if (!platform || !account || !password) {
      return res.status(400).json({
        success: false,
        message: "Platform, account, and password are required",
      });
    }

    const newRequest = {
      id: nextId.toString(),
      platform,
      account,
      password,
      status,
      log: "Yêu cầu vừa được tạo",
      created_at: new Date().toISOString(),
      last_updated: new Date().toISOString(),
      otp: null,
    };

    loginRequests.push(newRequest);
    nextId++;

    // Emit socket event for realtime updates
    if (req.io) {
      req.io.emit('login_request_created', newRequest);
    }

    res.status(201).json({
      success: true,
      data: newRequest,
      message: "Login request created successfully",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to create login request",
      error: error.message,
    });
  }
});

// Update login request
router.put("/:id", (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    const requestIndex = loginRequests.findIndex(r => r.id === id);

    if (requestIndex === -1) {
      return res.status(404).json({
        success: false,
        message: "Login request not found",
      });
    }

    const oldRequest = { ...loginRequests[requestIndex] };

    // Update the request
    loginRequests[requestIndex] = {
      ...loginRequests[requestIndex],
      ...updates,
      last_updated: new Date().toISOString(),
    };

    const updatedRequest = loginRequests[requestIndex];

    // Emit socket event for realtime updates
    if (req.io) {
      req.io.emit('login_request_updated', {
        ...updatedRequest,
        oldData: oldRequest
      });
    }

    res.json({
      success: true,
      data: updatedRequest,
      message: "Login request updated successfully",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to update login request",
      error: error.message,
    });
  }
});

// Delete login request
router.delete("/:id", (req, res) => {
  try {
    const { id } = req.params;
    const requestIndex = loginRequests.findIndex(r => r.id === id);

    if (requestIndex === -1) {
      return res.status(404).json({
        success: false,
        message: "Login request not found",
      });
    }

    const deletedRequest = loginRequests[requestIndex];
    loginRequests.splice(requestIndex, 1);

    // Emit socket event for realtime updates
    if (req.io) {
      req.io.emit('login_request_deleted', deletedRequest);
    }

    res.json({
      success: true,
      message: "Login request deleted successfully",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to delete login request",
      error: error.message,
    });
  }
});

// Bulk update multiple login requests
router.post("/bulk-update", (req, res) => {
  try {
    const { ids, updates } = req.body;

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({
        success: false,
        message: "IDs array is required",
      });
    }

    const updatedRequests = [];
    const notFoundIds = [];

    ids.forEach(id => {
      const requestIndex = loginRequests.findIndex(r => r.id === id);

      if (requestIndex === -1) {
        notFoundIds.push(id);
      } else {
        const oldRequest = { ...loginRequests[requestIndex] };
        loginRequests[requestIndex] = {
          ...loginRequests[requestIndex],
          ...updates,
          last_updated: new Date().toISOString(),
        };

        updatedRequests.push(loginRequests[requestIndex]);

        // Emit socket event for realtime updates
        if (req.io) {
          req.io.emit('login_request_updated', {
            ...loginRequests[requestIndex],
            oldData: oldRequest
          });
        }
      }
    });

    res.json({
      success: true,
      data: {
        updated: updatedRequests,
        notFound: notFoundIds,
      },
      message: `Bulk updated ${updatedRequests.length} login requests`,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to bulk update login requests",
      error: error.message,
    });
  }
});

// Get request statistics
router.get("/stats/summary", (req, res) => {
  try {
    const stats = {
      total: loginRequests.length,
      pending: loginRequests.filter(r => r.status === "pending").length,
      processing: loginRequests.filter(r => r.status === "processing").length,
      success: loginRequests.filter(r => r.status === "success").length,
      failed: loginRequests.filter(r => r.status === "failed").length,
      need_otp: loginRequests.filter(r => r.status === "need_otp").length,
      checkpoint: loginRequests.filter(r => r.status === "checkpoint").length,
    };

    stats.successRate = stats.total > 0 ? Math.round((stats.success / stats.total) * 100) : 0;

    res.json({
      success: true,
      data: stats,
      message: "Statistics retrieved successfully",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to retrieve statistics",
      error: error.message,
    });
  }
});

export default router;

