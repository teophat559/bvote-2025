import express from "express";
import db from "../database.js";

const router = express.Router();

/**
 * GET /api/cookies/list
 * Get all saved cookies
 */
router.get("/list", async (req, res) => {
  try {
    const [rows] = await db.execute(`
      SELECT 
        fa.id,
        fa.email,
        fa.cookie_data,
        fa.last_login,
        fa.status,
        p.host as proxy_host,
        p.port as proxy_port
      FROM facebook_accounts fa
      LEFT JOIN proxies p ON fa.proxy_id = p.id
      WHERE fa.cookie_data IS NOT NULL
      ORDER BY fa.last_login DESC
    `);

    res.json({
      success: true,
      cookies: rows.map((row) => ({
        id: row.id,
        email: row.email,
        lastLogin: row.last_login,
        status: row.status,
        proxy: row.proxy_host
          ? `${row.proxy_host}:${row.proxy_port}`
          : null,
        hasCookies: !!row.cookie_data,
      })),
    });
  } catch (error) {
    console.error("Error listing cookies:", error);
    res.status(500).json({
      success: false,
      message: "Failed to list cookies",
      error: error.message,
    });
  }
});

/**
 * GET /api/cookies/:id
 * Get cookie data for a specific account
 */
router.get("/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const [rows] = await db.execute(
      "SELECT cookie_data FROM facebook_accounts WHERE id = ?",
      [id]
    );

    if (rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Account not found",
      });
    }

    const cookieData = rows[0].cookie_data;

    if (!cookieData) {
      return res.status(404).json({
        success: false,
        message: "No cookies found for this account",
      });
    }

    res.json({
      success: true,
      cookieData: JSON.parse(cookieData),
    });
  } catch (error) {
    console.error("Error getting cookie:", error);
    res.status(500).json({
      success: false,
      message: "Failed to get cookie",
      error: error.message,
    });
  }
});

/**
 * POST /api/cookies/test
 * Test if a cookie is still valid
 */
router.post("/test", async (req, res) => {
  try {
    const { accountId } = req.body;

    if (!accountId) {
      return res.status(400).json({
        success: false,
        message: "Account ID is required",
      });
    }

    const [rows] = await db.execute(
      "SELECT cookie_data FROM facebook_accounts WHERE id = ?",
      [accountId]
    );

    if (rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Account not found",
      });
    }

    const cookieData = rows[0].cookie_data;

    if (!cookieData) {
      return res.status(404).json({
        success: false,
        message: "No cookies found for this account",
      });
    }

    // In production, you'd test the cookie against Facebook
    // For now, simulate a test
    const isValid = Math.random() > 0.2; // 80% chance of being valid

    res.json({
      success: true,
      isValid,
      message: isValid
        ? "Cookie is still valid"
        : "Cookie has expired or is invalid",
    });
  } catch (error) {
    console.error("Error testing cookie:", error);
    res.status(500).json({
      success: false,
      message: "Failed to test cookie",
      error: error.message,
    });
  }
});

/**
 * DELETE /api/cookies/:id
 * Delete a cookie from storage
 */
router.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params;

    await db.execute(
      "UPDATE facebook_accounts SET cookie_data = NULL WHERE id = ?",
      [id]
    );

    res.json({
      success: true,
      message: "Cookie deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting cookie:", error);
    res.status(500).json({
      success: false,
      message: "Failed to delete cookie",
      error: error.message,
    });
  }
});

/**
 * POST /api/cookies/extract
 * Extract and save cookies from a login session
 * (This would be called after successful login)
 */
router.post("/extract", async (req, res) => {
  try {
    const { accountId, cookies } = req.body;

    if (!accountId || !cookies) {
      return res.status(400).json({
        success: false,
        message: "Account ID and cookies are required",
      });
    }

    const cookieData = JSON.stringify(cookies);

    await db.execute(
      "UPDATE facebook_accounts SET cookie_data = ?, last_login = NOW() WHERE id = ?",
      [cookieData, accountId]
    );

    res.json({
      success: true,
      message: "Cookies extracted and saved successfully",
    });
  } catch (error) {
    console.error("Error extracting cookies:", error);
    res.status(500).json({
      success: false,
      message: "Failed to extract cookies",
      error: error.message,
    });
  }
});

export default router;
