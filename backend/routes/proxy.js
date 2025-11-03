import express from "express";
import { v4 as uuidv4 } from "uuid";
import db from "../database.js";

const router = express.Router();

/**
 * POST /api/proxy/add
 * Add proxies to the list
 */
router.post("/add", async (req, res) => {
  try {
    const { proxies } = req.body;

    if (!proxies || !Array.isArray(proxies)) {
      return res.status(400).json({
        success: false,
        message: "Invalid proxies format. Expected array of proxy strings.",
      });
    }

    const added = [];
    const errors = [];

    for (const proxyString of proxies) {
      try {
        // Parse proxy string: host:port:user:pass
        const parts = proxyString.split(":");
        if (parts.length < 2) {
          errors.push({ proxy: proxyString, error: "Invalid format" });
          continue;
        }

        const [host, port, username, password] = parts;
        const id = uuidv4();

        const query = `
          INSERT INTO proxies (id, host, port, username, password)
          VALUES (?, ?, ?, ?, ?)
        `;

        await db.execute(query, [
          id,
          host,
          parseInt(port),
          username || null,
          password || null,
        ]);

        added.push({ id, host, port });
      } catch (error) {
        errors.push({ proxy: proxyString, error: error.message });
      }
    }

    res.json({
      success: true,
      message: `Added ${added.length} proxies`,
      added,
      errors,
    });
  } catch (error) {
    console.error("Error adding proxies:", error);
    res.status(500).json({
      success: false,
      message: "Failed to add proxies",
      error: error.message,
    });
  }
});

/**
 * POST /api/proxy/check
 * Batch check proxy validity
 */
router.post("/check", async (req, res) => {
  try {
    const { proxyIds } = req.body;

    if (!proxyIds || !Array.isArray(proxyIds)) {
      return res.status(400).json({
        success: false,
        message: "Invalid proxyIds format. Expected array of IDs.",
      });
    }

    const results = [];

    for (const proxyId of proxyIds) {
      try {
        // Get proxy details
        const [rows] = await db.execute(
          "SELECT * FROM proxies WHERE id = ?",
          [proxyId]
        );

        if (rows.length === 0) {
          results.push({ proxyId, isWorking: false, error: "Proxy not found" });
          continue;
        }

        const proxy = rows[0];

        // Simple check - in production, you'd test actual connectivity
        const isWorking = await testProxy(proxy);

        // Update proxy status
        await db.execute(
          "UPDATE proxies SET is_working = ?, last_checked = NOW() WHERE id = ?",
          [isWorking, proxyId]
        );

        results.push({
          proxyId,
          host: proxy.host,
          port: proxy.port,
          isWorking,
        });
      } catch (error) {
        results.push({
          proxyId,
          isWorking: false,
          error: error.message,
        });
      }
    }

    res.json({
      success: true,
      results,
    });
  } catch (error) {
    console.error("Error checking proxies:", error);
    res.status(500).json({
      success: false,
      message: "Failed to check proxies",
      error: error.message,
    });
  }
});

/**
 * GET /api/proxy/random
 * Get a random working proxy
 */
router.get("/random", async (req, res) => {
  try {
    const [rows] = await db.execute(
      "SELECT * FROM proxies WHERE is_working = true ORDER BY RAND() LIMIT 1"
    );

    if (rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "No working proxies available",
      });
    }

    const proxy = rows[0];

    res.json({
      success: true,
      proxy: {
        id: proxy.id,
        host: proxy.host,
        port: proxy.port,
        username: proxy.username,
        password: proxy.password,
      },
    });
  } catch (error) {
    console.error("Error getting random proxy:", error);
    res.status(500).json({
      success: false,
      message: "Failed to get random proxy",
      error: error.message,
    });
  }
});

/**
 * GET /api/proxy/list
 * Get all proxies
 */
router.get("/list", async (req, res) => {
  try {
    const [rows] = await db.execute("SELECT * FROM proxies ORDER BY created_at DESC");

    res.json({
      success: true,
      proxies: rows.map(p => ({
        id: p.id,
        host: p.host,
        port: p.port,
        username: p.username,
        isWorking: p.is_working,
        lastChecked: p.last_checked,
        createdAt: p.created_at,
      })),
    });
  } catch (error) {
    console.error("Error listing proxies:", error);
    res.status(500).json({
      success: false,
      message: "Failed to list proxies",
      error: error.message,
    });
  }
});

/**
 * DELETE /api/proxy/:id
 * Delete a proxy
 */
router.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params;

    await db.execute("DELETE FROM proxies WHERE id = ?", [id]);

    res.json({
      success: true,
      message: "Proxy deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting proxy:", error);
    res.status(500).json({
      success: false,
      message: "Failed to delete proxy",
      error: error.message,
    });
  }
});

/**
 * Helper function to test proxy connectivity
 */
async function testProxy(proxy) {
  try {
    // In production, you'd use a library like axios with proxy support
    // For now, we'll simulate a check
    // You can integrate with libraries like node-fetch with proxy support
    
    // Mock implementation - always return true for development
    // In production, implement actual proxy testing
    return true;
  } catch (error) {
    console.error("Proxy test failed:", error);
    return false;
  }
}

export default router;
