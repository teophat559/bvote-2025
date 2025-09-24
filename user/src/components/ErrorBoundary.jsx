import React from "react";
import {
  AlertCircle,
  RefreshCw,
  Home,
  MessageCircle,
  Copy,
} from "lucide-react";

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
      errorId: "USER-ERR-" + Date.now().toString(36).toUpperCase(),
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
          userType: "regular_user",
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
    window.location.href = "/";
  };

  copyErrorId = () => {
    navigator.clipboard
      .writeText(this.state.errorId)
      .then(() => {
        alert(
          "Mã lỗi đã được sao chép! Hãy cung cấp mã này khi liên hệ hỗ trợ."
        );
      })
      .catch(() => {
        // Fallback for older browsers
        const textArea = document.createElement("textarea");
        textArea.value = this.state.errorId;
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand("copy");
        document.body.removeChild(textArea);
        alert("Mã lỗi đã được sao chép!");
      });
  };

  reportIssue = () => {
    const subject = encodeURIComponent(`Lỗi ứng dụng - ${this.state.errorId}`);
    const body = encodeURIComponent(`
Xin chào,

Tôi gặp lỗi khi sử dụng ứng dụng:

Mã lỗi: ${this.state.errorId}
Thời gian: ${new Date().toLocaleString("vi-VN")}
Trang: ${window.location.href}
Trình duyệt: ${navigator.userAgent}

Mô tả về những gì tôi đang làm khi gặp lỗi:
[Vui lòng mô tả chi tiết]

Cảm ơn!
    `);

    window.open(
      `mailto:support@votingonline2025.site?subject=${subject}&body=${body}`
    );
  };

  render() {
    if (this.state.hasError) {
      if (this.state.isRetrying) {
        return (
          <div className="min-h-screen bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center p-4">
            <div className="bg-white/95 backdrop-blur-lg rounded-2xl p-8 max-w-md w-full text-center shadow-2xl">
              <RefreshCw className="w-16 h-16 mx-auto mb-4 animate-spin text-blue-500" />
              <h2 className="text-2xl font-bold mb-2 text-gray-800">
                Đang khôi phục...
              </h2>
              <p className="text-gray-600">Vui lòng chờ trong giây lát</p>
            </div>
          </div>
        );
      }

      return (
        <div className="min-h-screen bg-gradient-to-br from-red-500 to-pink-600 flex items-center justify-center p-4">
          <div className="bg-white/95 backdrop-blur-lg rounded-2xl p-8 max-w-lg w-full shadow-2xl">
            {/* Header */}
            <div className="text-center mb-8">
              <AlertCircle className="w-20 h-20 mx-auto mb-4 text-red-500 animate-bounce" />
              <h1 className="text-3xl font-bold mb-2 text-gray-800">
                Ứng dụng gặp sự cố
              </h1>
              <p className="text-lg text-gray-600">
                Đã xảy ra lỗi không mong muốn
              </p>
            </div>

            {/* User-friendly message */}
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
              <h3 className="text-lg font-semibold text-red-800 mb-2">
                Chúng tôi rất xin lỗi!
              </h3>
              <p className="text-red-700 text-sm mb-3">
                Ứng dụng đã gặp sự cố kỹ thuật. Đội ngũ phát triển đã được thông
                báo và sẽ khắc phục sớm nhất có thể.
              </p>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-red-600">
                  Mã lỗi:
                </span>
                <div className="flex items-center gap-2">
                  <code className="bg-red-100 px-2 py-1 rounded text-red-800 text-sm">
                    {this.state.errorId}
                  </code>
                  <button
                    onClick={this.copyErrorId}
                    className="text-red-600 hover:text-red-800 transition-colors"
                    title="Sao chép mã lỗi"
                  >
                    <Copy className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>

            {/* What users can do */}
            <div className="space-y-4 mb-6">
              <h3 className="font-semibold text-gray-800">Bạn có thể:</h3>

              <button
                onClick={this.handleRetry}
                className="w-full flex items-center justify-center gap-2 bg-green-500 hover:bg-green-600 text-white px-4 py-3 rounded-lg font-semibold transition-colors"
              >
                <RefreshCw className="w-5 h-5" />
                Thử lại ngay
              </button>

              <button
                onClick={this.handleReload}
                className="w-full flex items-center justify-center gap-2 bg-blue-500 hover:bg-blue-600 text-white px-4 py-3 rounded-lg font-semibold transition-colors"
              >
                <RefreshCw className="w-5 h-5" />
                Tải lại trang
              </button>

              <button
                onClick={this.handleGoHome}
                className="w-full flex items-center justify-center gap-2 bg-purple-500 hover:bg-purple-600 text-white px-4 py-3 rounded-lg font-semibold transition-colors"
              >
                <Home className="w-5 h-5" />
                Về trang chủ
              </button>
            </div>

            {/* Contact support */}
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-4">
              <h3 className="font-semibold text-gray-800 mb-2">Cần hỗ trợ?</h3>
              <p className="text-sm text-gray-600 mb-3">
                Nếu lỗi tiếp tục xảy ra, hãy liên hệ với chúng tôi và cung cấp
                mã lỗi bên trên.
              </p>
              <button
                onClick={this.reportIssue}
                className="w-full flex items-center justify-center gap-2 bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-lg text-sm transition-colors"
              >
                <MessageCircle className="w-4 h-4" />
                Báo cáo sự cố
              </button>
            </div>

            {/* Toggle Technical Details */}
            <div className="text-center">
              <button
                onClick={() =>
                  this.setState({ showDetails: !this.state.showDetails })
                }
                className="text-gray-500 hover:text-gray-700 underline text-sm"
              >
                {this.state.showDetails
                  ? "Ẩn chi tiết kỹ thuật"
                  : "Chi tiết kỹ thuật (cho dev)"}
              </button>
            </div>

            {/* Technical Details */}
            {this.state.showDetails && (
              <div className="mt-4 bg-gray-100 rounded-lg p-4 text-xs">
                <h4 className="font-semibold mb-2 text-gray-800">
                  Chi tiết kỹ thuật:
                </h4>

                <div className="space-y-2">
                  <div>
                    <strong>Thời gian:</strong> {new Date().toISOString()}
                  </div>
                  <div>
                    <strong>URL:</strong> {window.location.href}
                  </div>
                  <div>
                    <strong>User Agent:</strong> {navigator.userAgent}
                  </div>
                </div>

                {this.state.error && (
                  <div className="mt-4">
                    <strong className="text-red-600">Error Message:</strong>
                    <pre className="bg-red-50 border border-red-200 p-2 rounded mt-1 overflow-x-auto text-red-700 text-xs">
                      {this.state.error.message}
                    </pre>
                  </div>
                )}

                {this.state.error?.stack && (
                  <div className="mt-4">
                    <strong className="text-red-600">Stack Trace:</strong>
                    <pre className="bg-red-50 border border-red-200 p-2 rounded mt-1 overflow-x-auto text-red-700 text-xs max-h-32 overflow-y-auto">
                      {this.state.error.stack}
                    </pre>
                  </div>
                )}
              </div>
            )}

            <div className="text-center text-xs text-gray-500 mt-6">
              <p>
                Email hỗ trợ:{" "}
                <a
                  href="mailto:support@votingonline2025.site"
                  className="text-blue-500 hover:text-blue-700 underline"
                >
                  support@votingonline2025.site
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
