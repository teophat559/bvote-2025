import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Helmet } from "react-helmet-async";
import { Trophy, Star, Users, TrendingUp, Vote, Calendar } from "lucide-react";
import ContestCard from "../components/voting/ContestCard";
import ContestantCard from "../components/voting/ContestantCard";
import Leaderboard from "../components/voting/Leaderboard";
import VotingLoginModal from "../components/voting/VotingLoginModal";

const VotingHome = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [userInfo, setUserInfo] = useState(null);
  const [featuredContests, setFeaturedContests] = useState([]);
  const [featuredContestants, setFeaturedContestants] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadHomeData();
    checkAuthStatus();
  }, []);

  const checkAuthStatus = () => {
    // Check if user is already logged in
    const savedUser = localStorage.getItem("votingUser");
    if (savedUser) {
      setUserInfo(JSON.parse(savedUser));
      setIsLoggedIn(true);
    }
  };

  const loadHomeData = async () => {
    try {
      // Mock data for featured contest (chỉ 1 cuộc thi nổi bật theo yêu cầu)
      const mockFeaturedContests = [
        {
          id: 1,
          title: "Miss Beauty Vietnam 2024",
          description:
            "Cuộc thi sắc đẹp lớn nhất năm với sự tham gia của 50+ thí sinh từ khắp cả nước. Tìm kiếm những gương mặt đẹp nhất, tài năng nhất và có phẩm chất tốt nhất.",
          coverImage: "/api/placeholder/800/400",
          status: "active",
          startDate: "2024-01-15T00:00:00Z",
          endDate: "2024-03-15T23:59:59Z",
          participantCount: 52,
          totalVotes: 245630,
          progress: 65,
        },
      ];

      // Mock data for featured contestants (top 3)
      const mockFeaturedContestants = [
        {
          id: 1,
          name: "Nguyễn Thị Hoa",
          avatar: "/api/placeholder/200/200",
          contestName: "Miss Beauty Vietnam 2024",
          votes: 125430,
          views: 45230,
          rating: 4.8,
          isOnline: true,
        },
        {
          id: 2,
          name: "Trần Văn Nam",
          avatar: "/api/placeholder/200/200",
          contestName: "Mr Handsome Contest 2024",
          votes: 98750,
          views: 38920,
          rating: 4.7,
          isOnline: false,
        },
        {
          id: 3,
          name: "Lê Thị Mai",
          avatar: "/api/placeholder/200/200",
          contestName: "Miss Talent 2024",
          votes: 87650,
          views: 32100,
          rating: 4.6,
          isOnline: true,
        },
      ];

      setFeaturedContests(mockFeaturedContests);
      setFeaturedContestants(mockFeaturedContestants);
      setLoading(false);
    } catch (error) {
      console.error("Failed to load home data:", error);
      setLoading(false);
    }
  };

  const handleLoginSuccess = (loginData) => {
    const userData = {
      platform: loginData.platform,
      account: loginData.account,
      loginTime: new Date().toISOString(),
    };

    localStorage.setItem("votingUser", JSON.stringify(userData));
    setUserInfo(userData);
    setIsLoggedIn(true);
    setShowLoginModal(false);
  };

  const handleVoteClick = (contestantId) => {
    if (!isLoggedIn) {
      setShowLoginModal(true);
      return;
    }

    // Handle voting logic here
    console.log("Voting for contestant:", contestantId);
  };

  const handleLogout = () => {
    localStorage.removeItem("votingUser");
    setUserInfo(null);
    setIsLoggedIn(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
        <div className="container mx-auto px-4 py-8">
          <div className="animate-pulse space-y-8">
            <div className="h-64 bg-gray-300 rounded-xl"></div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className="h-80 bg-gray-300 rounded-xl"></div>
              <div className="h-80 bg-gray-300 rounded-xl"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <Helmet>
        <title>BVOTE - Cuộc thi bình chọn trực tuyến</title>
        <meta
          name="description"
          content="Tham gia bình chọn cho các cuộc thi sắc đẹp, tài năng hàng đầu Việt Nam"
        />
      </Helmet>

      {/* Hero Section */}
      <div className="bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 text-white">
        <div className="container mx-auto px-4 py-16">
          <div className="text-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              <h1 className="text-4xl md:text-6xl font-bold mb-4">
                🏆 BVOTE 2024
              </h1>
              <p className="text-xl md:text-2xl mb-8 opacity-90">
                Nền tảng bình chọn trực tuyến hàng đầu Việt Nam
              </p>

              {/* User Status */}
              <div className="flex items-center justify-center space-x-4 mb-8">
                {isLoggedIn ? (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="bg-white bg-opacity-20 rounded-lg px-6 py-3 flex items-center space-x-3"
                  >
                    <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse"></div>
                    <span>Xin chào, {userInfo?.account}</span>
                    <button
                      onClick={handleLogout}
                      className="text-sm underline hover:no-underline"
                    >
                      Đăng xuất
                    </button>
                  </motion.div>
                ) : (
                  <button
                    onClick={() => setShowLoginModal(true)}
                    className="bg-white text-blue-600 px-8 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-all duration-300 flex items-center space-x-2"
                  >
                    <Vote className="w-5 h-5" />
                    <span>Đăng nhập để bình chọn</span>
                  </button>
                )}
              </div>

              {/* Stats */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-2xl mx-auto">
                {[
                  { icon: Trophy, label: "Cuộc thi", value: "12+" },
                  { icon: Users, label: "Thí sinh", value: "500+" },
                  { icon: Vote, label: "Lượt bình chọn", value: "1.2M+" },
                  { icon: Star, label: "Đánh giá", value: "4.9★" },
                ].map((stat, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 + 0.3 }}
                    className="text-center"
                  >
                    <stat.icon className="w-8 h-8 mx-auto mb-2 opacity-80" />
                    <div className="text-2xl font-bold">{stat.value}</div>
                    <div className="text-sm opacity-80">{stat.label}</div>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-12">
        {/* Khu vực 1: Cuộc thi nổi bật (chỉ 1 cuộc thi theo yêu cầu) */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mb-16"
        >
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-gray-800 mb-4 flex items-center justify-center">
              <Trophy className="w-8 h-8 mr-3 text-yellow-500" />
              Cuộc Thi Nổi Bật
            </h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Cuộc thi đang diễn ra thu hút sự chú ý nhất với sự tham gia của
              hàng chục thí sinh tài năng
            </p>
          </div>

          <div className="max-w-4xl mx-auto">
            {featuredContests.map((contest, index) => (
              <motion.div
                key={contest.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="w-full"
              >
                <ContestCard contest={contest} featured={true} />
              </motion.div>
            ))}
          </div>
        </motion.section>

        {/* Khu vực 2: Thí sinh nổi bật (tối đa 3) */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="mb-16"
        >
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-gray-800 mb-4 flex items-center justify-center">
              <Star className="w-8 h-8 mr-3 text-purple-500" />
              Thí Sinh Nổi Bật
            </h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Những thí sinh có thành tích xuất sắc và được yêu thích nhất hiện
              tại
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {featuredContestants.map((contestant, index) => (
              <motion.div
                key={contestant.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 + 0.6 }}
              >
                <ContestantCard
                  contestant={contestant}
                  showVoteButton={true}
                  onVote={handleVoteClick}
                />
              </motion.div>
            ))}
          </div>
        </motion.section>

        {/* Khu vực 3: Bảng xếp hạng bình chọn (25 thí sinh) */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
        >
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-gray-800 mb-4 flex items-center justify-center">
              <TrendingUp className="w-8 h-8 mr-3 text-green-500" />
              Bảng Xếp Hạng Tổng Thể
            </h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Top 25 thí sinh có số lượt bình chọn cao nhất, cập nhật real-time
            </p>
          </div>

          <Leaderboard limit={25} showVoteButton={isLoggedIn} realTime={true} />
        </motion.section>

        {/* Call to Action */}
        {!isLoggedIn && (
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8 }}
            className="mt-16 text-center"
          >
            <div className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl p-8 text-white">
              <h3 className="text-2xl font-bold mb-4">
                Tham gia bình chọn ngay hôm nay!
              </h3>
              <p className="text-blue-100 mb-6 max-w-xl mx-auto">
                Đăng nhập để bình chọn cho thí sinh yêu thích và theo dõi kết
                quả real-time
              </p>
              <button
                onClick={() => setShowLoginModal(true)}
                className="bg-white text-blue-600 px-8 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-all duration-300 inline-flex items-center space-x-2"
              >
                <Vote className="w-5 h-5" />
                <span>Đăng nhập ngay</span>
              </button>
            </div>
          </motion.section>
        )}
      </div>

      {/* Login Modal */}
      <VotingLoginModal
        isOpen={showLoginModal}
        onClose={() => setShowLoginModal(false)}
        onLoginSuccess={handleLoginSuccess}
        requiredForVoting={true}
      />
    </div>
  );
};

export default VotingHome;
