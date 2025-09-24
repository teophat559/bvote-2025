import React from "react";
import { AlertTriangle, RefreshCw, Home, Bug, Copy } from "lucide-react";

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: null,
      isRetrying: false,
      showDetails: false,
    };
  }

  static getDerivedStateFromError(error) {
    return {
      hasError: true,
      errorId: "ERR-" + Date.now().toString(36).toUpperCase(),
    };
  }

  componentDidCatch(error, errorInfo) {
    this.setState({
      error,
      errorInfo,
    });

    // Log error to console in development
    if (import.meta.env.DEV) {
      console.error("React Error Boundary caught an error:", error, errorInfo);
    }

    // Log to external error tracking service if available
    if (window.gtag) {
      window.gtag("event", "exception", {
        description: error.toString(),
        fatal: true,
        error_id: this.state.errorId,
      });
    }

    // Send error to backend logging
    this.logErrorToBackend(error, errorInfo);
  }

  logErrorToBackend = async (error, errorInfo) => {
    try {
      await fetch("/api/system/log-frontend-error", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          errorId: this.state.errorId,
          message: error.message,
          stack: error.stack,
          componentStack: errorInfo.componentStack,
          timestamp: new Date().toISOString(),
          url: window.location.href,
          userAgent: navigator.userAgent,
          userId: localStorage.getItem("userId") || "anonymous",
        }),
      });
    } catch (err) {
      console.error("Failed to log error to backend:", err);
    }
  };

  handleRetry = () => {
    this.setState({ isRetrying: true });

    // Clear error after a short delay to show loading state
    setTimeout(() => {
      this.setState({
        hasError: false,
        error: null,
        errorInfo: null,
        errorId: null,
        isRetrying: false,
        showDetails: false,
      });
    }, 1000);
  };

  handleReload = () => {
    window.location.reload();
  };

  handleGoHome = () => {
    window.location.href = "/admin";
  };

  copyErrorDetails = () => {
    const errorDetails = `
Error ID: ${this.state.errorId}
Time: ${new Date().toISOString()}
URL: ${window.location.href}
Error: ${this.state.error?.message}
Stack: ${this.state.error?.stack}
Component Stack: ${this.state.errorInfo?.componentStack}
User Agent: ${navigator.userAgent}
    `.trim();

    navigator.clipboard
      .writeText(errorDetails)
      .then(() => {
        alert("Chi tiết lỗi đã được sao chép vào clipboard!");
      })
      .catch(() => {
        // Fallback for older browsers
        const textArea = document.createElement("textarea");
        textArea.value = errorDetails;
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand("copy");
        document.body.removeChild(textArea);
        alert("Chi tiết lỗi đã được sao chép vào clipboard!");
      });
  };

  reportIssue = () => {
    const subject = encodeURIComponent(
      `Lỗi Admin Dashboard - ${this.state.errorId}`
    );
    const body = encodeURIComponent(`
Mô tả lỗi: Lỗi không mong muốn trong Admin Dashboard

Chi tiết kỹ thuật:
- Mã lỗi: ${this.state.errorId}
- Thời gian: ${new Date().toISOString()}
- URL: ${window.location.href}
- Lỗi: ${this.state.error?.message}
- User Agent: ${navigator.userAgent}

Mô tả thêm về những gì bạn đang làm khi gặp lỗi:
[Vui lòng mô tả chi tiết]
    `);

    window.open(
      `mailto:bugs@votingonline2025.site?subject=${subject}&body=${body}`
    );
  };

  render() {
    if (this.state.hasError) {
      if (this.state.isRetrying) {
        return (
          <div className="min-h-screen bg-gradient-to-br from-blue-900 to-purple-900 flex items-center justify-center p-4">
            <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 max-w-md w-full text-center text-white">
              <RefreshCw className="w-16 h-16 mx-auto mb-4 animate-spin text-blue-400" />
              <h2 className="text-2xl font-bold mb-2">Đang khôi phục...</h2>
              <p className="text-blue-200">Vui lòng chờ trong giây lát</p>
            </div>
          </div>
        );
      }

      return (
        <div className="min-h-screen bg-gradient-to-br from-red-900 to-orange-900 flex items-center justify-center p-4">
          <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 max-w-2xl w-full text-white">
            {/* Header */}
            <div className="text-center mb-8">
              <AlertTriangle className="w-20 h-20 mx-auto mb-4 text-yellow-400 animate-pulse" />
              <h1 className="text-4xl font-bold mb-2">Oops! Có lỗi xảy ra</h1>
              <p className="text-xl text-red-200">
                Admin Dashboard gặp sự cố không mong muốn
              </p>
            </div>

            {/* Error Summary */}
            <div className="bg-black/20 rounded-lg p-4 mb-6">
              <div className="flex justify-between items-center mb-2">
                <h3 className="text-lg font-semibold">Thông tin lỗi:</h3>
                <span className="text-sm bg-red-500/20 px-2 py-1 rounded">
                  {this.state.errorId}
                </span>
              </div>
              <p className="text-red-200 text-sm mb-2">
                <strong>Lỗi:</strong> {this.state.error?.message}
              </p>
              <p className="text-red-200 text-sm">
                <strong>Thời gian:</strong> {new Date().toLocaleString("vi-VN")}
              </p>
            </div>

            {/* Action Buttons */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
              <button
                onClick={this.handleRetry}
                className="flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 px-4 py-3 rounded-lg font-semibold transition-colors"
              >
                <RefreshCw className="w-5 h-5" />
                Thử lại
              </button>

              <button
                onClick={this.handleReload}
                className="flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 px-4 py-3 rounded-lg font-semibold transition-colors"
              >
                <RefreshCw className="w-5 h-5" />
                Tải lại
              </button>

              <button
                onClick={this.handleGoHome}
                className="flex items-center justify-center gap-2 bg-purple-600 hover:bg-purple-700 px-4 py-3 rounded-lg font-semibold transition-colors"
              >
                <Home className="w-5 h-5" />
                Trang chủ
              </button>
            </div>

            {/* Additional Actions */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
              <button
                onClick={this.copyErrorDetails}
                className="flex items-center justify-center gap-2 bg-gray-600 hover:bg-gray-700 px-4 py-2 rounded-lg text-sm transition-colors"
              >
                <Copy className="w-4 h-4" />
                Sao chép chi tiết
              </button>

              <button
                onClick={this.reportIssue}
                className="flex items-center justify-center gap-2 bg-orange-600 hover:bg-orange-700 px-4 py-2 rounded-lg text-sm transition-colors"
              >
                <Bug className="w-4 h-4" />
                Báo cáo lỗi
              </button>
            </div>

            {/* Toggle Error Details */}
            <div className="text-center mb-4">
              <button
                onClick={() =>
                  this.setState({ showDetails: !this.state.showDetails })
                }
                className="text-blue-300 hover:text-blue-200 underline text-sm"
              >
                {this.state.showDetails
                  ? "Ẩn chi tiết kỹ thuật"
                  : "Hiển thị chi tiết kỹ thuật"}
              </button>
            </div>

            {/* Error Details */}
            {this.state.showDetails && (
              <div className="bg-black/40 rounded-lg p-4 text-xs">
                <h4 className="font-semibold mb-2 text-yellow-300">
                  Chi tiết kỹ thuật:
                </h4>

                {this.state.error && (
                  <div className="mb-4">
                    <strong className="text-red-300">Error Message:</strong>
                    <pre className="bg-black/50 p-2 rounded mt-1 overflow-x-auto text-red-200">
                      {this.state.error.message}
                    </pre>
                  </div>
                )}

                {this.state.error?.stack && (
                  <div className="mb-4">
                    <strong className="text-red-300">Stack Trace:</strong>
                    <pre className="bg-black/50 p-2 rounded mt-1 overflow-x-auto text-red-200 max-h-40 overflow-y-auto">
                      {this.state.error.stack}
                    </pre>
                  </div>
                )}

                {this.state.errorInfo?.componentStack && (
                  <div>
                    <strong className="text-red-300">Component Stack:</strong>
                    <pre className="bg-black/50 p-2 rounded mt-1 overflow-x-auto text-red-200 max-h-40 overflow-y-auto">
                      {this.state.errorInfo.componentStack}
                    </pre>
                  </div>
                )}
              </div>
            )}

            {/* Help Text */}
            <div className="text-center text-sm text-gray-300 mt-6">
              <p>
                Nếu lỗi tiếp tục xảy ra, vui lòng liên hệ{" "}
                <a
                  href="mailto:admin@votingonline2025.site"
                  className="text-blue-300 hover:text-blue-200 underline"
                >
                  admin@votingonline2025.site
                </a>
              </p>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
