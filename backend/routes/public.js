/**
 * Public API Routes
 * Endpoints for user-facing application
 */

import express from "express";

const router = express.Router();

// Mock data for development
const mockContests = [
  {
    id: 1,
    title: "Cuộc thi Lập trình 2025",
    description: "Cuộc thi lập trình toàn quốc",
    startDate: "2025-01-01",
    endDate: "2025-12-31",
    participants: 1250,
    status: "active",
  },
  {
    id: 2,
    title: "Hackathon AI 2025",
    description: "Phát triển ứng dụng AI sáng tạo",
    startDate: "2025-06-01",
    endDate: "2025-06-30",
    participants: 850,
    status: "upcoming",
  },
];

const mockRankings = [
  { id: 1, name: "Nguyễn Văn A", score: 2500, rank: 1, contestId: 1 },
  { id: 2, name: "Trần Thị B", score: 2350, rank: 2, contestId: 1 },
  { id: 3, name: "Lê Văn C", score: 2200, rank: 3, contestId: 1 },
  { id: 4, name: "Phạm Thị D", score: 2100, rank: 4, contestId: 1 },
  { id: 5, name: "Hoàng Văn E", score: 2000, rank: 5, contestId: 1 },
];

// Get all contests
router.get("/contests", (req, res) => {
  try {
    res.json({
      success: true,
      data: mockContests,
      message: "Contests retrieved successfully",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to retrieve contests",
      error: error.message,
    });
  }
});

// Get contest by ID
router.get("/contests/:id", (req, res) => {
  try {
    const contest = mockContests.find((c) => c.id == req.params.id);
    if (!contest) {
      return res.status(404).json({
        success: false,
        message: "Contest not found",
      });
    }

    res.json({
      success: true,
      data: contest,
      message: "Contest retrieved successfully",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to retrieve contest",
      error: error.message,
    });
  }
});

// Get rankings
router.get("/ranking", (req, res) => {
  try {
    const { contestId, limit = 10 } = req.query;
    let rankings = mockRankings;

    if (contestId) {
      rankings = rankings.filter((r) => r.contestId == contestId);
    }

    rankings = rankings.slice(0, parseInt(limit));

    res.json({
      success: true,
      data: rankings,
      message: "Rankings retrieved successfully",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to retrieve rankings",
      error: error.message,
    });
  }
});

// Get leaderboard (alias for ranking)
router.get("/leaderboard", (req, res) => {
  // Reuse ranking logic
  req.url = "/ranking";
  router.handle(req, res);
});

// Health check for public API
router.get("/health", (req, res) => {
  res.json({
    success: true,
    message: "Public API is healthy",
    timestamp: new Date().toISOString(),
  });
});

export default router;
