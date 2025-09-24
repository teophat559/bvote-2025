/**
 * Admin History Panel Component
 * Kết hợp REST API (filtering/pagination) và Socket.IO (real-time logs)
 */

import React, { useState, useEffect, useCallback } from "react";
import { io } from "socket.io-client";
import DetailedHistoryTable from "./DetailedHistoryTable.jsx";

// Custom hooks for API và Socket.IO
const useHistoryAPI = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchHistory = useCallback(async (filters = {}) => {
    setLoading(true);
    setError(null);

    try {
      const queryParams = new URLSearchParams();
      Object.entries(filters).forEach(([key, value]) => {
        if (value && value !== "all") {
          queryParams.append(key, value);
        }
      });

      const response = await fetch(`/api/admin/history?${queryParams}`);
      const result = await response.json();

      if (result.success) {
        setData(result);
      } else {
        setError(result.error || "Failed to fetch history");
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  return { data, loading, error, fetchHistory };
};

const useRealTimeLogs = () => {
  const [socket, setSocket] = useState(null);
  const [connected, setConnected] = useState(false);
  const [realTimeLogs, setRealTimeLogs] = useState([]);
  const [realtimeEnabled, setRealtimeEnabled] = useState(false);

  useEffect(() => {
    const newSocket = io();
    setSocket(newSocket);

    newSocket.on("connect", () => {
      console.log("Socket.IO connected for admin real-time logs");
      setConnected(true);
    });

    newSocket.on("disconnect", () => {
      console.log("Socket.IO disconnected");
      setConnected(false);
      setRealtimeEnabled(false);
    });

    // Real-time log events
    newSocket.on("admin:logs:new", (data) => {
      setRealTimeLogs((prev) => [data.log, ...prev.slice(0, 99)]); // Keep last 100
    });

    newSocket.on("admin:logs:buffer", (data) => {
      setRealTimeLogs(data.logs);
    });

    newSocket.on("admin:realtime:enabled", (data) => {
      console.log("Real-time logging enabled:", data);
      setRealtimeEnabled(true);
    });

    newSocket.on("admin:realtime:disabled", (data) => {
      console.log("Real-time logging disabled:", data);
      setRealtimeEnabled(false);
      setRealTimeLogs([]);
    });

    return () => {
      newSocket.close();
    };
  }, []);

  const enableRealtime = useCallback(
    (filters = {}) => {
      if (socket && connected) {
        socket.emit("admin:realtime:enable", { filters });
      }
    },
    [socket, connected]
  );

  const disableRealtime = useCallback(() => {
    if (socket && connected) {
      socket.emit("admin:realtime:disable");
    }
  }, [socket, connected]);

  const updateFilters = useCallback(
    (filters) => {
      if (socket && connected && realtimeEnabled) {
        socket.emit("admin:realtime:filters", filters);
      }
    },
    [socket, connected, realtimeEnabled]
  );

  return {
    connected,
    realTimeLogs,
    realtimeEnabled,
    enableRealtime,
    disableRealtime,
    updateFilters,
  };
};

// Main Admin History Panel Component
const AdminHistoryPanel = () => {
  // State management
  const [activeTab, setActiveTab] = useState("history"); // 'history' or 'realtime'
  const [filters, setFilters] = useState({
    page: 1,
    limit: 50,
    platform: "all",
    status: "all",
    action: "",
    user: "",
    dateFrom: "",
    dateTo: "",
    category: "all",
    search: "",
  });

  // Custom hooks
  const { data: historyData, loading, error, fetchHistory } = useHistoryAPI();
  const {
    connected,
    realTimeLogs,
    realtimeEnabled,
    enableRealtime,
    disableRealtime,
    updateFilters,
  } = useRealTimeLogs();

  // Load history data on component mount and filter changes
  useEffect(() => {
    if (activeTab === "history") {
      fetchHistory(filters);
    }
  }, [activeTab, filters, fetchHistory]);

  // Update real-time filters when filters change
  useEffect(() => {
    if (realtimeEnabled) {
      updateFilters(filters);
    }
  }, [filters, realtimeEnabled, updateFilters]);

  // Handle filter changes
  const handleFilterChange = (key, value) => {
    setFilters((prev) => ({
      ...prev,
      [key]: value,
      ...(key !== "page" ? { page: 1 } : {}), // Reset page when other filters change
    }));
  };

  // Handle pagination
  const handlePageChange = (newPage) => {
    setFilters((prev) => ({ ...prev, page: newPage }));
  };

  // Toggle real-time mode
  const toggleRealtime = () => {
    if (realtimeEnabled) {
      disableRealtime();
    } else {
      enableRealtime(filters);
    }
  };

  // Export history
  const handleExport = async (format) => {
    try {
      const queryParams = new URLSearchParams();
      Object.entries(filters).forEach(([key, value]) => {
        if (value && value !== "all" && key !== "page" && key !== "limit") {
          queryParams.append(key, value);
        }
      });
      queryParams.append("format", format);

      const response = await fetch(`/api/admin/history/export?${queryParams}`);

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `history-export-${new Date().toISOString().split("T")[0]}.${format}`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
      } else {
        alert("Export failed");
      }
    } catch (error) {
      console.error("Export error:", error);
      alert("Export error: " + error.message);
    }
  };

  return (
    <div className="admin-history-panel">
      {/* Header với tab controls */}
      <div className="panel-header">
        <h2>📊 Admin History & Real-time Logs</h2>

        <div className="tab-controls">
          <button
            className={`tab-btn ${activeTab === "history" ? "active" : ""}`}
            onClick={() => setActiveTab("history")}
          >
            📋 History (REST API)
          </button>
          <button
            className={`tab-btn ${activeTab === "realtime" ? "active" : ""}`}
            onClick={() => setActiveTab("realtime")}
          >
            🔴 Real-time (Socket.IO)
          </button>
        </div>

        <div className="connection-status">
          <span
            className={`status-indicator ${connected ? "connected" : "disconnected"}`}
          >
            {connected ? "🟢 Connected" : "🔴 Disconnected"}
          </span>
          {activeTab === "realtime" && (
            <button
              className={`realtime-toggle ${realtimeEnabled ? "enabled" : "disabled"}`}
              onClick={toggleRealtime}
              disabled={!connected}
            >
              {realtimeEnabled ? "⏸️ Disable Real-time" : "▶️ Enable Real-time"}
            </button>
          )}
        </div>
      </div>

      {/* Filters */}
      <div className="filters-section">
        <div className="filter-row">
          <select
            value={filters.platform}
            onChange={(e) => handleFilterChange("platform", e.target.value)}
          >
            <option value="all">All Platforms</option>
            <option value="facebook">Facebook</option>
            <option value="zalo">Zalo</option>
            <option value="gmail">Gmail</option>
            <option value="instagram">Instagram</option>
          </select>

          <select
            value={filters.status}
            onChange={(e) => handleFilterChange("status", e.target.value)}
          >
            <option value="all">All Status</option>
            <option value="success">Success</option>
            <option value="failed">Failed</option>
            <option value="pending">Pending</option>
            <option value="warning">Warning</option>
          </select>

          <select
            value={filters.category}
            onChange={(e) => handleFilterChange("category", e.target.value)}
          >
            <option value="all">All Categories</option>
            <option value="automation">Automation</option>
            <option value="manual">Manual</option>
            <option value="authentication">Authentication</option>
            <option value="system">System</option>
          </select>

          <input
            type="text"
            placeholder="Search..."
            value={filters.search}
            onChange={(e) => handleFilterChange("search", e.target.value)}
          />
        </div>

        <div className="filter-row">
          <input
            type="text"
            placeholder="Action filter..."
            value={filters.action}
            onChange={(e) => handleFilterChange("action", e.target.value)}
          />

          <input
            type="text"
            placeholder="User filter..."
            value={filters.user}
            onChange={(e) => handleFilterChange("user", e.target.value)}
          />

          <input
            type="datetime-local"
            value={filters.dateFrom}
            onChange={(e) => handleFilterChange("dateFrom", e.target.value)}
          />

          <input
            type="datetime-local"
            value={filters.dateTo}
            onChange={(e) => handleFilterChange("dateTo", e.target.value)}
          />
        </div>

        {activeTab === "history" && (
          <div className="action-row">
            <button onClick={() => handleExport("json")}>📥 Export JSON</button>
            <button onClick={() => handleExport("csv")}>📊 Export CSV</button>
            <button onClick={() => fetchHistory(filters)}>🔄 Refresh</button>
          </div>
        )}
      </div>

      {/* Content Area */}
      <div className="content-area">
        {activeTab === "history" && (
          <DetailedHistoryTable
            data={historyData}
            loading={loading}
            error={error}
            filters={filters}
            onPageChange={handlePageChange}
          />
        )}

        {activeTab === "realtime" && (
          <RealtimeLogsTable
            logs={realTimeLogs}
            enabled={realtimeEnabled}
            connected={connected}
            filters={filters}
          />
        )}
      </div>
    </div>
  );
};

// History Table Component (REST API data)
const HistoryTable = ({ data, loading, error, filters, onPageChange }) => {
  if (loading) {
    return <div className="loading">📊 Loading history data...</div>;
  }

  if (error) {
    return <div className="error">❌ Error: {error}</div>;
  }

  if (!data || !data.data) {
    return <div className="no-data">📭 No history data available</div>;
  }

  const { data: logs, pagination, statistics } = data;

  return (
    <div className="history-table-container">
      {/* Statistics Summary */}
      <div className="stats-summary">
        <div className="stat-card">
          <h4>📊 Total Records</h4>
          <span className="stat-value">{statistics.total}</span>
        </div>
        <div className="stat-card">
          <h4>✅ Success Rate</h4>
          <span className="stat-value">
            {((statistics.success / statistics.total) * 100).toFixed(1)}%
          </span>
        </div>
        <div className="stat-card">
          <h4>🔥 Top Platform</h4>
          <span className="stat-value">
            {Object.entries(statistics.byPlatform).sort(
              ([, a], [, b]) => b - a
            )[0]?.[0] || "N/A"}
          </span>
        </div>
      </div>

      {/* History Table */}
      <div className="table-container">
        <table className="history-table">
          <thead>
            <tr>
              <th>⏰ Timestamp</th>
              <th>🌐 Platform</th>
              <th>⚡ Action</th>
              <th>📊 Status</th>
              <th>👤 User</th>
              <th>💬 Message</th>
              <th>⏱️ Duration</th>
            </tr>
          </thead>
          <tbody>
            {logs.map((log) => (
              <tr key={log.id} className={`status-${log.status}`}>
                <td>{new Date(log.timestamp).toLocaleString()}</td>
                <td>
                  <span className={`platform-badge ${log.platform}`}>
                    {log.platform}
                  </span>
                </td>
                <td>{log.action}</td>
                <td>
                  <span className={`status-badge ${log.status}`}>
                    {log.status}
                  </span>
                </td>
                <td>{log.user}</td>
                <td className="message-cell">{log.message}</td>
                <td>{log.metadata?.duration || 0}ms</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="pagination">
        <div className="pagination-info">
          Showing {(pagination.currentPage - 1) * pagination.itemsPerPage + 1}{" "}
          to{" "}
          {Math.min(
            pagination.currentPage * pagination.itemsPerPage,
            pagination.totalItems
          )}{" "}
          of {pagination.totalItems} entries
        </div>

        <div className="pagination-controls">
          <button
            disabled={!pagination.hasPrev}
            onClick={() => onPageChange(pagination.prevPage)}
          >
            ⬅️ Previous
          </button>

          <span className="page-info">
            Page {pagination.currentPage} of {pagination.totalPages}
          </span>

          <button
            disabled={!pagination.hasNext}
            onClick={() => onPageChange(pagination.nextPage)}
          >
            Next ➡️
          </button>
        </div>
      </div>
    </div>
  );
};

// Real-time Logs Table Component (Socket.IO data)
const RealtimeLogsTable = ({ logs, enabled, connected, filters }) => {
  if (!connected) {
    return (
      <div className="realtime-status disconnected">
        🔴 Socket.IO Disconnected - Real-time logs unavailable
      </div>
    );
  }

  if (!enabled) {
    return (
      <div className="realtime-status disabled">
        ⏸️ Real-time logging disabled - Click "Enable Real-time" to start
      </div>
    );
  }

  return (
    <div className="realtime-logs-container">
      {/* Real-time Status */}
      <div className="realtime-status enabled">
        <div className="status-indicator">
          <span className="pulse-dot"></span>
          🔴 Live Logging Active ({logs.length} recent logs)
        </div>
        <div className="filters-applied">
          Active filters:{" "}
          {Object.entries(filters)
            .filter(([key, value]) => value && value !== "all" && value !== "")
            .map(([key, value]) => `${key}:${value}`)
            .join(", ") || "None"}
        </div>
      </div>

      {/* Real-time Logs Stream */}
      <div className="realtime-logs-stream">
        {logs.length === 0 ? (
          <div className="no-logs">
            👂 Listening for new logs... (no recent activity)
          </div>
        ) : (
          <div className="logs-list">
            {logs.map((log, index) => (
              <div
                key={`${log.id}-${index}`}
                className={`log-entry ${log.status} fade-in`}
              >
                <div className="log-header">
                  <span className="timestamp">
                    {new Date(log.timestamp).toLocaleTimeString()}
                  </span>
                  <span className={`platform-badge ${log.platform}`}>
                    {log.platform}
                  </span>
                  <span className={`status-badge ${log.status}`}>
                    {log.status}
                  </span>
                </div>
                <div className="log-content">
                  <strong>{log.action}</strong> - {log.message}
                </div>
                <div className="log-meta">
                  👤 {log.user} | ⏱️ {log.metadata?.duration || 0}ms
                  {log.metadata?.ip && ` | 🌐 ${log.metadata.ip}`}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

// CSS Styles (inline for demo, should be in separate file)
const styles = `
.admin-history-panel {
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
  overflow: hidden;
}

.panel-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem;
  background: #f8f9fa;
  border-bottom: 1px solid #dee2e6;
}

.tab-controls {
  display: flex;
  gap: 0.5rem;
}

.tab-btn {
  padding: 0.5rem 1rem;
  border: 1px solid #dee2e6;
  background: white;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.2s;
}

.tab-btn.active {
  background: #007bff;
  color: white;
  border-color: #007bff;
}

.connection-status {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.status-indicator.connected {
  color: #28a745;
}

.status-indicator.disconnected {
  color: #dc3545;
}

.realtime-toggle.enabled {
  background: #28a745;
  color: white;
}

.realtime-toggle.disabled {
  background: #6c757d;
  color: white;
}

.filters-section {
  padding: 1rem;
  background: #f8f9fa;
  border-bottom: 1px solid #dee2e6;
}

.filter-row {
  display: flex;
  gap: 0.5rem;
  margin-bottom: 0.5rem;
  flex-wrap: wrap;
}

.filter-row select,
.filter-row input {
  padding: 0.25rem 0.5rem;
  border: 1px solid #ced4da;
  border-radius: 4px;
  min-width: 120px;
}

.action-row {
  display: flex;
  gap: 0.5rem;
}

.action-row button {
  padding: 0.5rem 1rem;
  border: 1px solid #007bff;
  background: white;
  color: #007bff;
  border-radius: 4px;
  cursor: pointer;
}

.action-row button:hover {
  background: #007bff;
  color: white;
}

.stats-summary {
  display: flex;
  gap: 1rem;
  padding: 1rem;
  background: #f8f9fa;
}

.stat-card {
  background: white;
  padding: 1rem;
  border-radius: 4px;
  text-align: center;
  box-shadow: 0 1px 3px rgba(0,0,0,0.1);
}

.stat-card h4 {
  margin: 0 0 0.5rem 0;
  font-size: 0.8rem;
  color: #6c757d;
}

.stat-value {
  font-size: 1.5rem;
  font-weight: bold;
  color: #007bff;
}

.history-table {
  width: 100%;
  border-collapse: collapse;
}

.history-table th,
.history-table td {
  padding: 0.5rem;
  border-bottom: 1px solid #dee2e6;
  text-align: left;
}

.history-table th {
  background: #f8f9fa;
  font-weight: 600;
}

.platform-badge {
  padding: 0.2rem 0.5rem;
  border-radius: 12px;
  font-size: 0.8rem;
  font-weight: 500;
}

.platform-badge.facebook { background: #1877f2; color: white; }
.platform-badge.zalo { background: #0068ff; color: white; }
.platform-badge.gmail { background: #ea4335; color: white; }
.platform-badge.instagram { background: #e4405f; color: white; }

.status-badge {
  padding: 0.2rem 0.5rem;
  border-radius: 12px;
  font-size: 0.8rem;
  font-weight: 500;
}

.status-badge.success { background: #d4edda; color: #155724; }
.status-badge.failed { background: #f8d7da; color: #721c24; }
.status-badge.pending { background: #fff3cd; color: #856404; }
.status-badge.warning { background: #f0e68c; color: #8b4513; }

.pagination {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem;
  background: #f8f9fa;
}

.pagination-controls {
  display: flex;
  gap: 1rem;
  align-items: center;
}

.pagination-controls button {
  padding: 0.5rem 1rem;
  border: 1px solid #007bff;
  background: white;
  color: #007bff;
  border-radius: 4px;
  cursor: pointer;
}

.pagination-controls button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.realtime-logs-stream {
  max-height: 600px;
  overflow-y: auto;
  padding: 1rem;
}

.log-entry {
  background: white;
  border: 1px solid #dee2e6;
  border-radius: 4px;
  padding: 0.75rem;
  margin-bottom: 0.5rem;
  transition: all 0.3s ease;
}

.log-entry.fade-in {
  animation: fadeIn 0.5s ease-in;
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(-10px); }
  to { opacity: 1; transform: translateY(0); }
}

.log-entry.success { border-left: 4px solid #28a745; }
.log-entry.failed { border-left: 4px solid #dc3545; }
.log-entry.pending { border-left: 4px solid #ffc107; }
.log-entry.warning { border-left: 4px solid #fd7e14; }

.log-header {
  display: flex;
  gap: 0.5rem;
  margin-bottom: 0.5rem;
  font-size: 0.9rem;
}

.log-content {
  margin-bottom: 0.25rem;
  font-size: 0.95rem;
}

.log-meta {
  font-size: 0.8rem;
  color: #6c757d;
}

.pulse-dot {
  display: inline-block;
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #dc3545;
  animation: pulse 1.5s infinite;
}

@keyframes pulse {
  0% { opacity: 1; }
  50% { opacity: 0.5; }
  100% { opacity: 1; }
}

.realtime-status {
  padding: 1rem;
  text-align: center;
  font-weight: 500;
}

.realtime-status.enabled {
  background: #d4edda;
  color: #155724;
  border: 1px solid #c3e6cb;
}

.realtime-status.disabled {
  background: #fff3cd;
  color: #856404;
  border: 1px solid #ffeaa7;
}

.realtime-status.disconnected {
  background: #f8d7da;
  color: #721c24;
  border: 1px solid #f5c6cb;
}
`;

// Inject styles
const styleSheet = document.createElement("style");
styleSheet.innerText = styles;
document.head.appendChild(styleSheet);

export default AdminHistoryPanel;
