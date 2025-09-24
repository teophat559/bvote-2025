import React from "react";
import { Link, useLocation } from "react-router-dom";

const Navigation = () => {
  const location = useLocation();

  const isActive = (path) => location.pathname === path;

  return (
    <nav className="bg-white shadow-sm">
      <div className="max-w-6xl mx-auto px-4">
        <div className="flex justify-between items-center h-16">
          <Link to="/" className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-blue-600 rounded flex items-center justify-center">
              <span className="text-white font-bold">B</span>
            </div>
            <span className="text-xl font-bold text-gray-900">BVOTE</span>
          </Link>

          <div className="flex items-center space-x-6">
            <Link
              to="/"
              className={`text-sm font-medium ${
                isActive("/")
                  ? "text-blue-600"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              Trang chủ
            </Link>
            <Link
              to="/contests"
              className={`text-sm font-medium ${
                isActive("/contests")
                  ? "text-blue-600"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              Cuộc thi
            </Link>
            <Link
              to="/profile"
              className={`text-sm font-medium ${
                isActive("/profile")
                  ? "text-blue-600"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              Hồ sơ
            </Link>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navigation;
