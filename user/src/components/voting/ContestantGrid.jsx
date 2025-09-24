import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, Grid3X3, LayoutGrid, Users, Heart, Eye } from 'lucide-react';

const ContestantGrid = ({ contestId, isLoggedIn }) => {
  const [contestants, setContestants] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [gridCols, setGridCols] = useState(4); // 3-5 columns
  const [votingStatus, setVotingStatus] = useState({});

  const itemsPerPage = 15;
  const totalPages = Math.ceil(contestants.length / itemsPerPage);
  const currentContestants = contestants.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  useEffect(() => {
    loadContestants();
  }, [contestId]);

  const loadContestants = async () => {
    try {
      // Generate 50 mock contestants for demonstration
      const mockContestants = Array.from({ length: 50 }, (_, index) => ({
        id: index + 1,
        name: `Thí sinh ${index + 1}`,
        contestNumber: `SBD${(index + 1).toString().padStart(3, '0')}`,
        avatar: `/api/placeholder/300/300`,
        votes: Math.floor(Math.random() * 10000) + 100,
        views: Math.floor(Math.random() * 5000) + 50,
        rating: (Math.random() * 2 + 3).toFixed(1),
        isOnline: Math.random() > 0.5,
        recentVoters: Array.from({ length: Math.floor(Math.random() * 5) + 1 }, (_, i) => ({
          id: i,
          avatar: `/api/placeholder/40/40`
        }))
      }));

      setContestants(mockContestants);
      setLoading(false);
    } catch (error) {
      console.error('Failed to load contestants:', error);
      setLoading(false);
    }
  };

  const handleVote = async (contestantId) => {
    if (!isLoggedIn) {
      alert('Vui lòng đăng nhập để bình chọn!');
      return;
    }

    if (votingStatus[contestantId]) {
      return; // Already voted
    }

    setVotingStatus(prev => ({ ...prev, [contestantId]: 'voting' }));

    try {
      // Simulate vote API call
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Update contestant votes
      setContestants(prev => prev.map(contestant =>
        contestant.id === contestantId
          ? {
              ...contestant,
              votes: contestant.votes + 1,
              recentVoters: [
                { id: 'current_user', avatar: '/api/placeholder/40/40' },
                ...contestant.recentVoters.slice(0, 4)
              ]
            }
          : contestant
      ));

      setVotingStatus(prev => ({ ...prev, [contestantId]: 'voted' }));
    } catch (error) {
      console.error('Vote failed:', error);
      setVotingStatus(prev => ({ ...prev, [contestantId]: null }));
    }
  };

  const formatNumber = (num) => {
    if (num >= 1000000) {
      return `${(num / 1000000).toFixed(1)}M`;
    } else if (num >= 1000) {
      return `${(num / 1000).toFixed(1)}K`;
    }
    return num.toString();
  };

  if (loading) {
    return (
      <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
        {[...Array(15)].map((_, i) => (
          <div key={i} className="bg-white rounded-xl shadow-lg p-4 animate-pulse">
            <div className="w-full aspect-square bg-gray-300 rounded-lg mb-4"></div>
            <div className="h-4 bg-gray-300 rounded mb-2"></div>
            <div className="h-3 bg-gray-300 rounded mb-4"></div>
            <div className="h-8 bg-gray-300 rounded"></div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-lg overflow-hidden">
      {/* Header Controls */}
      <div className="bg-gradient-to-r from-blue-500 to-purple-600 text-white p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center">
            <Users className="w-6 h-6 mr-3" />
            <div>
              <h2 className="text-xl font-bold">Danh sách thí sinh</h2>
              <p className="text-blue-100 text-sm">
                Trang {currentPage}/{totalPages} • {contestants.length} thí sinh
              </p>
            </div>
          </div>

          {/* Grid Layout Controls */}
          <div className="flex items-center space-x-2">
            <span className="text-sm text-blue-100">Cột:</span>
            {[3, 4, 5].map(cols => (
              <button
                key={cols}
                onClick={() => setGridCols(cols)}
                className={`w-8 h-8 rounded-md flex items-center justify-center text-sm font-medium transition-colors ${
                  gridCols === cols
                    ? 'bg-white text-blue-600'
                    : 'bg-blue-600 bg-opacity-50 text-white hover:bg-opacity-70'
                }`}
              >
                {cols}
              </button>
            ))}
          </div>
        </div>

        {/* Pagination */}
        <div className="flex items-center justify-between">
          <button
            onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
            disabled={currentPage === 1}
            className="flex items-center px-4 py-2 bg-white bg-opacity-20 rounded-lg hover:bg-opacity-30 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ChevronLeft className="w-4 h-4 mr-1" />
            Trước
          </button>

          <div className="flex items-center space-x-2">
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              const pageNum = Math.max(1, Math.min(totalPages - 4, currentPage - 2)) + i;
              if (pageNum > totalPages) return null;

              return (
                <button
                  key={pageNum}
                  onClick={() => setCurrentPage(pageNum)}
                  className={`w-8 h-8 rounded-md flex items-center justify-center text-sm font-medium transition-colors ${
                    currentPage === pageNum
                      ? 'bg-white text-blue-600'
                      : 'bg-blue-600 bg-opacity-50 text-white hover:bg-opacity-70'
                  }`}
                >
                  {pageNum}
                </button>
              );
            })}
          </div>

          <button
            onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
            disabled={currentPage === totalPages}
            className="flex items-center px-4 py-2 bg-white bg-opacity-20 rounded-lg hover:bg-opacity-30 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Sau
            <ChevronRight className="w-4 h-4 ml-1" />
          </button>
        </div>
      </div>

      {/* Contestants Grid */}
      <div className="p-6">
        <motion.div
          layout
          className={`grid gap-6 ${
            gridCols === 3 ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3' :
            gridCols === 4 ? 'grid-cols-2 md:grid-cols-3 lg:grid-cols-4' :
            'grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5'
          }`}
        >
          <AnimatePresence mode="wait">
            {currentContestants.map((contestant, index) => (
              <motion.div
                key={`${currentPage}-${contestant.id}`}
                layout
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                transition={{ delay: index * 0.05 }}
                className="bg-white rounded-xl shadow-lg overflow-hidden border border-gray-200 hover:shadow-xl transition-all duration-300"
              >
                {/* Avatar */}
                <div className="relative">
                  <img
                    src={contestant.avatar}
                    alt={contestant.name}
                    className="w-full aspect-square object-cover"
                  />

                  {/* Online Status */}
                  {contestant.isOnline && (
                    <div className="absolute top-3 right-3 w-4 h-4 bg-green-500 border-2 border-white rounded-full"></div>
                  )}

                  {/* Contest Number */}
                  <div className="absolute top-3 left-3 bg-black bg-opacity-70 text-white px-2 py-1 rounded-md text-xs font-bold">
                    {contestant.contestNumber}
                  </div>

                  {/* Recent Voters Avatars */}
                  {contestant.recentVoters.length > 0 && (
                    <div className="absolute bottom-3 left-3 flex -space-x-2">
                      {contestant.recentVoters.slice(0, 3).map((voter, i) => (
                        <img
                          key={i}
                          src={voter.avatar}
                          alt="Voter"
                          className="w-6 h-6 rounded-full border-2 border-white shadow-sm"
                        />
                      ))}
                      {contestant.recentVoters.length > 3 && (
                        <div className="w-6 h-6 rounded-full bg-gray-600 border-2 border-white flex items-center justify-center text-xs text-white font-bold">
                          +{contestant.recentVoters.length - 3}
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Info */}
                <div className="p-4">
                  <h3 className="font-bold text-gray-800 mb-2 text-center">
                    {contestant.name}
                  </h3>

                  {/* Stats */}
                  <div className="flex items-center justify-center space-x-4 mb-4 text-sm">
                    <div className="flex items-center text-red-500">
                      <Heart className="w-4 h-4 mr-1" />
                      <span className="font-semibold">{formatNumber(contestant.votes)}</span>
                    </div>
                    <div className="flex items-center text-blue-500">
                      <Eye className="w-4 h-4 mr-1" />
                      <span className="font-semibold">{formatNumber(contestant.views)}</span>
                    </div>
                  </div>

                  {/* Vote Button */}
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => handleVote(contestant.id)}
                    disabled={!isLoggedIn || votingStatus[contestant.id]}
                    className={`w-full py-3 px-4 rounded-lg font-semibold transition-all duration-300 flex items-center justify-center ${
                      votingStatus[contestant.id] === 'voted'
                        ? 'bg-green-100 text-green-700 cursor-not-allowed'
                        : votingStatus[contestant.id] === 'voting'
                        ? 'bg-blue-100 text-blue-700 cursor-wait'
                        : isLoggedIn
                        ? 'bg-gradient-to-r from-pink-500 to-red-500 text-white hover:from-pink-600 hover:to-red-600'
                        : 'bg-gray-200 text-gray-500 cursor-not-allowed'
                    }`}
                  >
                    {votingStatus[contestant.id] === 'voting' ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2"></div>
                        Đang bình chọn...
                      </>
                    ) : votingStatus[contestant.id] === 'voted' ? (
                      <>
                        <Heart className="w-4 h-4 mr-2 fill-current" />
                        Đã bình chọn
                      </>
                    ) : isLoggedIn ? (
                      <>
                        <Heart className="w-4 h-4 mr-2" />
                        Bình chọn
                      </>
                    ) : (
                      'Đăng nhập để bình chọn'
                    )}
                  </motion.button>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </motion.div>

        {/* Pagination Footer */}
        <div className="flex items-center justify-between mt-8 pt-6 border-t border-gray-200">
          <div className="text-sm text-gray-600">
            Hiển thị {(currentPage - 1) * itemsPerPage + 1}-{Math.min(currentPage * itemsPerPage, contestants.length)}
            trong tổng số {contestants.length} thí sinh
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={() => setCurrentPage(1)}
              disabled={currentPage === 1}
              className="px-3 py-2 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm"
            >
              Đầu
            </button>
            <button
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
              className="px-3 py-2 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            <span className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-medium">
              {currentPage}
            </span>

            <button
              onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
              disabled={currentPage === totalPages}
              className="px-3 py-2 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
            <button
              onClick={() => setCurrentPage(totalPages)}
              disabled={currentPage === totalPages}
              className="px-3 py-2 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm"
            >
              Cuối
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ContestantGrid;
