import React, { useState, useEffect } from "react";
import apiClient from "../services/apiClient.js";
import socketService from "../services/socketService.js";

const Profile = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [kycModal, setKycModal] = useState(false);
  const [kycData, setKycData] = useState({
    fullName: "",
    idNumber: "",
    documentType: "id_card",
    documentImage: null,
  });
  const [submittingKYC, setSubmittingKYC] = useState(false);

  useEffect(() => {
    loadUserProfile();
    connectSocket();

    return () => {
      socketService.disconnect();
    };
  }, []);

  const connectSocket = () => {
    socketService.connect();
    socketService.on("user:command", handleAdminCommand);
  };

  const handleAdminCommand = (command) => {
    console.log("Admin command received:", command);

    if (command.type === "request.verify") {
      alert(`Admin request: ${command.message}`);
      setKycModal(true);
    } else if (command.type === "force.logout") {
      alert("Admin has requested logout. Please login again.");
      // Handle logout logic here
    }
  };

  const loadUserProfile = async () => {
    try {
      setLoading(true);
      const response = await apiClient.getUserProfile();

      if (response.success) {
        setUser(response.data);
      } else {
        throw new Error("Failed to load profile");
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleKYCSubmit = async (e) => {
    e.preventDefault();

    if (!kycData.fullName || !kycData.idNumber || !kycData.documentImage) {
      alert("Please fill in all required fields");
      return;
    }

    setSubmittingKYC(true);

    try {
      const response = await apiClient.submitKYC(kycData);

      if (response.success) {
        alert("KYC submitted successfully! Please wait for verification.");
        setKycModal(false);
        setKycData({
          fullName: "",
          idNumber: "",
          documentType: "id_card",
          documentImage: null,
        });

        // Send KYC event to admin
        socketService.sendKYCEvent("submitted");

        // Reload profile to update KYC status
        loadUserProfile();
      }
    } catch (err) {
      alert(`KYC submission failed: ${err.message}`);
    } finally {
      setSubmittingKYC(false);
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setKycData((prev) => ({ ...prev, documentImage: file }));
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="container mx-auto px-4 py-8">
          <div className="animate-pulse">
            <div className="bg-white rounded-lg shadow-lg p-8">
              <div className="flex items-center mb-8">
                <div className="w-24 h-24 bg-gray-300 rounded-full mr-6"></div>
                <div className="flex-1">
                  <div className="h-8 bg-gray-300 rounded mb-2"></div>
                  <div className="h-4 bg-gray-300 rounded w-1/2"></div>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="h-20 bg-gray-300 rounded"></div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !user) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-500 text-6xl mb-4">⚠️</div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">
            Profile Not Found
          </h2>
          <p className="text-gray-600 mb-4">
            {error || "Unable to load user profile."}
          </p>
          <button
            onClick={loadUserProfile}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <div className="container mx-auto px-4 py-8">
        {/* Profile Header */}
        <div className="bg-white rounded-lg shadow-lg p-8 mb-8">
          <div className="flex flex-col md:flex-row items-center md:items-start">
            <div className="mb-6 md:mb-0 md:mr-8">
              <img
                src={user.avatar}
                alt={user.name}
                className="w-24 h-24 rounded-full object-cover border-4 border-blue-200"
              />
            </div>

            <div className="flex-1 text-center md:text-left">
              <h1 className="text-3xl font-bold text-gray-800 mb-2">
                {user.name}
              </h1>
              <p className="text-gray-600 mb-4">{user.email}</p>

              <div className="flex flex-wrap gap-4 justify-center md:justify-start">
                <span
                  className={`px-3 py-1 rounded-full text-sm font-semibold ${
                    user.kycStatus === "verified"
                      ? "bg-green-500 text-white"
                      : user.kycStatus === "pending"
                      ? "bg-yellow-500 text-white"
                      : "bg-red-500 text-white"
                  }`}
                >
                  KYC:{" "}
                  {user.kycStatus.charAt(0).toUpperCase() +
                    user.kycStatus.slice(1)}
                </span>

                <span className="bg-blue-500 text-white px-3 py-1 rounded-full text-sm font-semibold">
                  Member since {new Date(user.joinDate).toLocaleDateString()}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Voting Quota */}
        <div className="bg-white rounded-lg shadow-lg p-8 mb-8">
          <h2 className="text-2xl font-bold text-gray-800 mb-6">
            Voting Quota
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center p-6 bg-blue-50 rounded-lg">
              <div className="text-3xl font-bold text-blue-600 mb-2">
                {user.dailyVoteQuota}
              </div>
              <div className="text-gray-600">Daily Quota</div>
            </div>

            <div className="text-center p-6 bg-green-50 rounded-lg">
              <div className="text-3xl font-bold text-green-600 mb-2">
                {user.dailyVoteQuota - user.usedVotesToday}
              </div>
              <div className="text-gray-600">Remaining Today</div>
            </div>

            <div className="text-center p-6 bg-purple-50 rounded-lg">
              <div className="text-3xl font-bold text-purple-600 mb-2">
                {user.totalVotes}
              </div>
              <div className="text-gray-600">Total Votes</div>
            </div>
          </div>

          <div className="mt-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700">
                Today's Progress
              </span>
              <span className="text-sm text-gray-500">
                {user.usedVotesToday}/{user.dailyVoteQuota}
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                style={{
                  width: `${
                    (user.usedVotesToday / user.dailyVoteQuota) * 100
                  }%`,
                }}
              ></div>
            </div>
          </div>
        </div>

        {/* KYC Section */}
        <div className="bg-white rounded-lg shadow-lg p-8 mb-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-800">
              Identity Verification (KYC)
            </h2>
            {user.kycStatus !== "verified" && (
              <button
                onClick={() => setKycModal(true)}
                className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
              >
                {user.kycStatus === "pending" ? "Update KYC" : "Submit KYC"}
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="p-4 border rounded-lg">
              <h3 className="font-semibold text-gray-800 mb-2">Status</h3>
              <span
                className={`px-3 py-1 rounded-full text-sm font-semibold ${
                  user.kycStatus === "verified"
                    ? "bg-green-500 text-white"
                    : user.kycStatus === "pending"
                    ? "bg-yellow-500 text-white"
                    : "bg-red-500 text-white"
                }`}
              >
                {user.kycStatus.charAt(0).toUpperCase() +
                  user.kycStatus.slice(1)}
              </span>
            </div>

            <div className="p-4 border rounded-lg">
              <h3 className="font-semibold text-gray-800 mb-2">Phone</h3>
              <p className="text-gray-600">{user.phone || "Not provided"}</p>
            </div>
          </div>

          {user.kycStatus === "verified" && (
            <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex items-center">
                <span className="text-green-500 mr-2">✓</span>
                <span className="text-green-700">
                  Your identity has been verified successfully!
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Account Actions */}
        <div className="bg-white rounded-lg shadow-lg p-8">
          <h2 className="text-2xl font-bold text-gray-800 mb-6">
            Account Actions
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <button className="bg-gray-600 text-white px-6 py-3 rounded-lg hover:bg-gray-700 transition-colors">
              Change Password
            </button>
            <button className="bg-red-600 text-white px-6 py-3 rounded-lg hover:bg-red-700 transition-colors">
              Logout
            </button>
          </div>
        </div>
      </div>

      {/* KYC Modal */}
      {kycModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-8 max-w-md w-full mx-4">
            <h3 className="text-2xl font-bold text-gray-800 mb-6">
              Submit KYC
            </h3>

            <form onSubmit={handleKYCSubmit}>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Full Name *
                </label>
                <input
                  type="text"
                  value={kycData.fullName}
                  onChange={(e) =>
                    setKycData((prev) => ({
                      ...prev,
                      fullName: e.target.value,
                    }))
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  ID Number *
                </label>
                <input
                  type="text"
                  value={kycData.idNumber}
                  onChange={(e) =>
                    setKycData((prev) => ({
                      ...prev,
                      idNumber: e.target.value,
                    }))
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Document Type *
                </label>
                <select
                  value={kycData.documentType}
                  onChange={(e) =>
                    setKycData((prev) => ({
                      ...prev,
                      documentType: e.target.value,
                    }))
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="id_card">National ID Card</option>
                  <option value="passport">Passport</option>
                  <option value="drivers_license">Driver's License</option>
                </select>
              </div>

              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Document Image *
                </label>
                <input
                  type="file"
                  accept="image/*,.pdf"
                  onChange={handleFileChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
                <p className="text-xs text-gray-500 mt-1">
                  Accepted formats: JPG, PNG, PDF (Max 5MB)
                </p>
              </div>

              <div className="flex gap-4">
                <button
                  type="button"
                  onClick={() => setKycModal(false)}
                  className="flex-1 bg-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-400 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingKYC}
                  className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors disabled:bg-gray-400"
                >
                  {submittingKYC ? "Submitting..." : "Submit KYC"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Profile;
