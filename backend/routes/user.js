import express from "express";
const router = express.Router();

// Mock storage for user data
let userStats = {
  totalLogins: 23,
  successfulLogins: 19,
  failedLogins: 4,
  lastLoginTime: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
  adminConnected: false,
};

let userActivity = [
  {
    id: 1,
    type: "login_attempt",
    platform: "facebook",
    status: "completed",
    timestamp: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
    details: { method: "auto_login", duration: 15000 },
  },
  {
    id: 2,
    type: "feedback_sent",
    feedbackType: "positive",
    status: "sent",
    timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    details: { message: "Login rất nhanh!" },
  },
  {
    id: 3,
    type: "admin_notification",
    status: "received",
    timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
    details: { message: "System maintenance completed" },
  },
];

let userPreferences = {
  autoApproveLogins: false,
  enableNotifications: true,
  allowAdminControl: true,
  preferredPlatform: "facebook",
};

// Helper function to emit real-time updates
const emitUserUpdate = (req, eventName, data) => {
  const io = req.app.get("io");
  if (io) {
    io.emit(eventName, data);
  }
};

// GET /api/user/stats - Get user statistics
router.get("/stats", (req, res) => {
  try {
    res.json({
      success: true,
      data: userStats,
    });
  } catch (error) {
    console.error("Error getting user stats:", error);
    res.status(500).json({
      success: false,
      message: "Failed to get user stats",
      error: error.message,
    });
  }
});

// GET /api/user/activity - Get user activity history
router.get("/activity", (req, res) => {
  try {
    const { limit = 20, type } = req.query;

    let filteredActivity = [...userActivity];

    if (type && type !== "all") {
      filteredActivity = filteredActivity.filter(
        (activity) => activity.type === type
      );
    }

    // Sort by timestamp (newest first)
    filteredActivity.sort(
      (a, b) => new Date(b.timestamp) - new Date(a.timestamp)
    );

    // Apply limit
    if (limit) {
      filteredActivity = filteredActivity.slice(0, parseInt(limit));
    }

    res.json({
      success: true,
      data: filteredActivity,
    });
  } catch (error) {
    console.error("Error getting user activity:", error);
    res.status(500).json({
      success: false,
      message: "Failed to get user activity",
      error: error.message,
    });
  }
});

// GET /api/user/preferences - Get user preferences
router.get("/preferences", (req, res) => {
  try {
    res.json({
      success: true,
      data: userPreferences,
    });
  } catch (error) {
    console.error("Error getting user preferences:", error);
    res.status(500).json({
      success: false,
      message: "Failed to get user preferences",
      error: error.message,
    });
  }
});

// PUT /api/user/preferences - Update user preferences
router.put("/preferences", (req, res) => {
  try {
    const updatedPrefs = req.body;

    // Validate preferences
    const validKeys = [
      "autoApproveLogins",
      "enableNotifications",
      "allowAdminControl",
      "preferredPlatform",
    ];
    const validPrefs = {};

    for (const key of validKeys) {
      if (updatedPrefs.hasOwnProperty(key)) {
        validPrefs[key] = updatedPrefs[key];
      }
    }

    // Update preferences
    userPreferences = { ...userPreferences, ...validPrefs };

    // Add to activity log
    const activityEntry = {
      id: Date.now(),
      type: "preferences_updated",
      status: "completed",
      timestamp: new Date().toISOString(),
      details: { updatedKeys: Object.keys(validPrefs) },
    };
    userActivity.unshift(activityEntry);

    // Keep only last 50 activity entries
    userActivity = userActivity.slice(0, 50);

    // Emit real-time update
    emitUserUpdate(req, "user:preferences_updated", {
      preferences: userPreferences,
      activity: activityEntry,
    });

    res.json({
      success: true,
      data: userPreferences,
      message: "Preferences updated successfully",
    });
  } catch (error) {
    console.error("Error updating user preferences:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update user preferences",
      error: error.message,
    });
  }
});

// POST /api/user/activity - Add new activity entry
router.post("/activity", (req, res) => {
  try {
    const { type, status, details = {} } = req.body;

    if (!type || !status) {
      return res.status(400).json({
        success: false,
        message: "Missing required fields: type, status",
      });
    }

    const activityEntry = {
      id: Date.now(),
      type,
      status,
      timestamp: new Date().toISOString(),
      details,
    };

    userActivity.unshift(activityEntry);
    userActivity = userActivity.slice(0, 50); // Keep only last 50 entries

    // Update stats if it's a login attempt
    if (type === "login_attempt") {
      userStats.totalLogins++;
      if (status === "completed" || status === "success") {
        userStats.successfulLogins++;
        userStats.lastLoginTime = activityEntry.timestamp;
      } else if (status === "failed") {
        userStats.failedLogins++;
      }
    }

    // Emit real-time update
    emitUserUpdate(req, "user:activity_added", {
      activity: activityEntry,
      stats: userStats,
    });

    res.json({
      success: true,
      data: activityEntry,
      message: "Activity added successfully",
    });
  } catch (error) {
    console.error("Error adding user activity:", error);
    res.status(500).json({
      success: false,
      message: "Failed to add user activity",
      error: error.message,
    });
  }
});

// POST /api/user/notification - Send notification to user
router.post("/notification", (req, res) => {
  try {
    const { title, message, type = "info", duration = 4000 } = req.body;

    if (!message) {
      return res.status(400).json({
        success: false,
        message: "Missing required field: message",
      });
    }

    const notification = {
      id: Date.now(),
      title: title || "Notification",
      message,
      type,
      duration,
      timestamp: new Date().toISOString(),
    };

    // Add to activity log
    const activityEntry = {
      id: Date.now() + 1,
      type: "admin_notification",
      status: "received",
      timestamp: new Date().toISOString(),
      details: { message, type },
    };
    userActivity.unshift(activityEntry);
    userActivity = userActivity.slice(0, 50);

    // Emit real-time notification
    emitUserUpdate(req, "admin:notification", notification);
    emitUserUpdate(req, "user:activity_added", {
      activity: activityEntry,
    });

    res.json({
      success: true,
      data: notification,
      message: "Notification sent successfully",
    });
  } catch (error) {
    console.error("Error sending user notification:", error);
    res.status(500).json({
      success: false,
      message: "Failed to send user notification",
      error: error.message,
    });
  }
});

// GET /api/user/dashboard - Get dashboard data (combined stats, activity, preferences)
router.get("/dashboard", (req, res) => {
  try {
    const dashboardData = {
      stats: userStats,
      recentActivity: userActivity.slice(0, 10),
      preferences: userPreferences,
      timestamp: new Date().toISOString(),
    };

    res.json({
      success: true,
      data: dashboardData,
    });
  } catch (error) {
    console.error("Error getting dashboard data:", error);
    res.status(500).json({
      success: false,
      message: "Failed to get dashboard data",
      error: error.message,
    });
  }
});

// DELETE /api/user/activity - Clear user activity history
router.delete("/activity", (req, res) => {
  try {
    const { olderThan = 24 } = req.query; // hours

    const cutoffTime = new Date(Date.now() - olderThan * 60 * 60 * 1000);
    const initialCount = userActivity.length;

    // Keep only recent activity
    userActivity = userActivity.filter((activity) => {
      const activityTime = new Date(activity.timestamp);
      return activityTime > cutoffTime;
    });

    const removedCount = initialCount - userActivity.length;

    res.json({
      success: true,
      message: `Removed ${removedCount} old activity entries`,
      data: {
        removed: removedCount,
        remaining: userActivity.length,
      },
    });
  } catch (error) {
    console.error("Error clearing user activity:", error);
    res.status(500).json({
      success: false,
      message: "Failed to clear user activity",
      error: error.message,
    });
  }
});

export default router;
