import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Trophy, Medal, Award, TrendingUp, Users, Eye } from 'lucide-react';
import ContestantCard from './ContestantCard';

const Leaderboard = ({ contestId = null, limit = 25, showVoteButton = false, realTime = true }) => {
  const [contestants, setContestants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // all, daily, weekly, monthly

  useEffect(() => {
    loadLeaderboard();

    if (realTime) {
      const interval = setInterval(loadLeaderboard, 5000); // Update every 5 seconds
      return () => clearInterval(interval);
    }
  }, [contestId, filter]);

  const loadLeaderboard = async () => {
    try {
      // Mock data for demonstration
      const mockContestants = [
        {
          id: 1,
          name: 'Nguyễn Thị Hoa',
          avatar: '/api/placeholder/150/150',
          contestName: 'Miss Beauty 2024',
          votes: 125430,
          views: 45230,
          rating: 4.8,
          rank: 1,
          trend: 'up',
          isOnline: true
        },
        {
          id: 2,
          name: 'Trần Văn Nam',
          avatar: '/api/placeholder/150/150',
          contestName: 'Mr Handsome 2024',
          votes: 98750,
          views: 38920,
          rating: 4.7,
          rank: 2,
          trend: 'up',
          isOnline: false
        },
        {
          id: 3,
          name: 'Lê Thị Mai',
          avatar: '/api/placeholder/150/150',
          contestName: 'Miss Talent 2024',
          votes: 87650,
          views: 32100,
          rating: 4.6,
          rank: 3,
          trend: 'stable',
          isOnline: true
        },
        // Generate more mock data
        ...Array.from({ length: 22 }, (_, index) => ({
          id: index + 4,
          name: `Thí sinh ${index + 4}`,
          avatar: '/api/placeholder/150/150',
          contestName: ['Miss Beauty 2024', 'Mr Handsome 2024', 'Miss Talent 2024'][index % 3],
          votes: Math.floor(Math.random() * 50000) + 10000,
          views: Math.floor(Math.random() * 20000) + 5000,
          rating: (Math.random() * 2 + 3).toFixed(1),
          rank: index + 4,
          trend: ['up', 'down', 'stable'][Math.floor(Math.random() * 3)],
          isOnline: Math.random() > 0.5
        }))
      ];

      // Sort by votes
      mockContestants.sort((a, b) => b.votes - a.votes);

      // Update ranks
      mockContestants.forEach((contestant, index) => {
        contestant.rank = index + 1;
      });

      setContestants(mockContestants.slice(0, limit));
      setLoading(false);
    } catch (error) {
      console.error('Failed to load leaderboard:', error);
      setLoading(false);
    }
  };

  const handleVote = async (contestantId) => {
    // Simulate vote
    setContestants(prev => prev.map(contestant =>
      contestant.id === contestantId
        ? { ...contestant, votes: contestant.votes + 1, hasVoted: true }
        : contestant
    ));
  };

  const getTrendIcon = (trend) => {
    switch (trend) {
      case 'up': return <TrendingUp className="w-4 h-4 text-green-500" />;
      case 'down': return <TrendingUp className="w-4 h-4 text-red-500 rotate-180" />;
      default: return <div className="w-4 h-4"></div>;
    }
  };

  const getRankIcon = (rank) => {
    switch (rank) {
      case 1: return <Trophy className="w-6 h-6 text-yellow-500" />;
      case 2: return <Medal className="w-6 h-6 text-gray-400" />;
      case 3: return <Award className="w-6 h-6 text-orange-500" />;
      default: return <span className="w-6 h-6 flex items-center justify-center text-gray-600 font-bold">{rank}</span>;
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-lg p-6">
        <div className="animate-pulse space-y-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="flex items-center space-x-4">
              <div className="w-16 h-16 bg-gray-300 rounded-full"></div>
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-gray-300 rounded w-3/4"></div>
                <div className="h-3 bg-gray-300 rounded w-1/2"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-lg overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-500 to-purple-600 text-white p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <Trophy className="w-8 h-8 mr-3" />
            <div>
              <h2 className="text-2xl font-bold">Bảng Xếp Hạng</h2>
              <p className="text-blue-100">Top {limit} thí sinh hàng đầu</p>
            </div>
          </div>

          <div className="flex items-center space-x-4 text-sm">
            <div className="flex items-center">
              <Users className="w-4 h-4 mr-1" />
              {contestants.length} thí sinh
            </div>
            {realTime && (
              <div className="flex items-center">
                <div className="w-2 h-2 bg-green-400 rounded-full mr-2 animate-pulse"></div>
                Live
              </div>
            )}
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="flex space-x-2 mt-4">
          {[
            { key: 'all', label: 'Tất cả' },
            { key: 'daily', label: 'Hôm nay' },
            { key: 'weekly', label: 'Tuần này' },
            { key: 'monthly', label: 'Tháng này' }
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setFilter(tab.key)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-300 ${
                filter === tab.key
                  ? 'bg-white text-blue-600'
                  : 'bg-blue-600 bg-opacity-50 text-white hover:bg-opacity-70'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Leaderboard List */}
      <div className="max-h-96 overflow-y-auto">
        <AnimatePresence>
          {contestants.map((contestant, index) => (
            <motion.div
              key={contestant.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ delay: index * 0.05 }}
              className="flex items-center p-4 border-b border-gray-100 hover:bg-gray-50 transition-colors"
            >
              {/* Rank */}
              <div className="flex items-center justify-center w-12 mr-4">
                {getRankIcon(contestant.rank)}
              </div>

              {/* Avatar */}
              <div className="relative mr-4">
                <img
                  src={contestant.avatar}
                  alt={contestant.name}
                  className="w-12 h-12 rounded-full object-cover border-2 border-gray-200"
                />
                {contestant.isOnline && (
                  <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 border-2 border-white rounded-full"></div>
                )}
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center">
                  <h3 className="font-semibold text-gray-800 truncate">{contestant.name}</h3>
                  <div className="ml-2">
                    {getTrendIcon(contestant.trend)}
                  </div>
                </div>
                <p className="text-sm text-gray-600 truncate">{contestant.contestName}</p>
              </div>

              {/* Stats */}
              <div className="flex items-center space-x-4 text-sm">
                <div className="text-center">
                  <div className="font-bold text-red-500">{contestant.votes.toLocaleString()}</div>
                  <div className="text-gray-500">votes</div>
                </div>
                <div className="text-center">
                  <div className="font-bold text-blue-500">{contestant.views.toLocaleString()}</div>
                  <div className="text-gray-500">views</div>
                </div>
              </div>

              {/* Vote Button */}
              {showVoteButton && (
                <div className="ml-4">
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => handleVote(contestant.id)}
                    disabled={contestant.hasVoted}
                    className={`p-2 rounded-full transition-all duration-300 ${
                      contestant.hasVoted
                        ? 'bg-green-100 text-green-600 cursor-not-allowed'
                        : 'bg-gradient-to-r from-pink-500 to-red-500 text-white hover:from-pink-600 hover:to-red-600'
                    }`}
                  >
                    <Trophy className="w-4 h-4" />
                  </motion.button>
                </div>
              )}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Footer */}
      <div className="bg-gray-50 px-6 py-3 text-center">
        <p className="text-sm text-gray-600">
          Cập nhật {realTime ? 'real-time' : 'thường xuyên'} •
          Tổng cộng {contestants.reduce((sum, c) => sum + c.votes, 0).toLocaleString()} lượt bình chọn
        </p>
      </div>
    </div>
  );
};

export default Leaderboard;
