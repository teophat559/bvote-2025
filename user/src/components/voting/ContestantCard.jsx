import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Heart, Trophy, Star, Eye } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const ContestantCard = ({ contestant, compact = false, showVoteButton = false, onVote }) => {
  const [isVoting, setIsVoting] = useState(false);
  const [hasVoted, setHasVoted] = useState(contestant.hasVoted || false);
  const navigate = useNavigate();

  const handleVote = async () => {
    if (hasVoted || isVoting) return;

    setIsVoting(true);

    try {
      if (onVote) {
        await onVote(contestant.id);
        setHasVoted(true);
      }
    } catch (error) {
      console.error('Vote failed:', error);
    } finally {
      setIsVoting(false);
    }
  };

  const handleViewProfile = () => {
    navigate(`/contestant/${contestant.id}`);
  };

  const formatVotes = (votes) => {
    if (votes >= 1000000) {
      return `${(votes / 1000000).toFixed(1)}M`;
    } else if (votes >= 1000) {
      return `${(votes / 1000).toFixed(1)}K`;
    }
    return votes.toString();
  };

  const getRankBadge = (rank) => {
    if (rank === 1) return { icon: '👑', color: 'text-yellow-500', bg: 'bg-yellow-50' };
    if (rank === 2) return { icon: '🥈', color: 'text-gray-500', bg: 'bg-gray-50' };
    if (rank === 3) return { icon: '🥉', color: 'text-orange-500', bg: 'bg-orange-50' };
    return { icon: rank, color: 'text-gray-600', bg: 'bg-gray-100' };
  };

  const rankInfo = getRankBadge(contestant.rank);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`bg-white rounded-xl shadow-lg overflow-hidden border border-gray-200 transition-all duration-300 hover:shadow-xl ${
        compact ? 'p-4' : 'p-6'
      }`}
    >
      {/* Rank Badge */}
      {contestant.rank && (
        <div className={`inline-flex items-center justify-center w-8 h-8 rounded-full ${rankInfo.bg} ${rankInfo.color} font-bold text-sm mb-4`}>
          {rankInfo.icon}
        </div>
      )}

      <div className={`${compact ? 'flex items-center space-x-4' : 'text-center'}`}>
        {/* Avatar */}
        <div className={`relative ${compact ? 'flex-shrink-0' : 'mb-4'}`}>
          <motion.div
            whileHover={{ scale: 1.05 }}
            className="relative"
          >
            <img
              src={contestant.avatar || '/api/placeholder/150/150'}
              alt={contestant.name}
              className={`rounded-full object-cover border-4 border-white shadow-lg ${
                compact ? 'w-16 h-16' : 'w-24 h-24 mx-auto'
              }`}
            />

            {/* Online Status */}
            {contestant.isOnline && (
              <div className="absolute bottom-1 right-1 w-4 h-4 bg-green-500 border-2 border-white rounded-full"></div>
            )}
          </motion.div>
        </div>

        {/* Info */}
        <div className={`${compact ? 'flex-1' : ''}`}>
          {/* Name */}
          <h3 className={`font-bold text-gray-800 ${compact ? 'text-base' : 'text-lg mb-2'}`}>
            {contestant.name}
          </h3>

          {/* Contest */}
          <p className={`text-gray-600 ${compact ? 'text-sm' : 'text-sm mb-3'}`}>
            {contestant.contestName}
          </p>

          {/* Stats */}
          <div className={`flex items-center justify-center space-x-4 ${compact ? 'text-sm' : 'mb-4'}`}>
            {/* Votes */}
            <div className="flex items-center text-red-500">
              <Heart className={`${compact ? 'w-4 h-4' : 'w-5 h-5'} mr-1`} />
              <span className="font-semibold">{formatVotes(contestant.votes || 0)}</span>
            </div>

            {/* Views */}
            <div className="flex items-center text-blue-500">
              <Eye className={`${compact ? 'w-4 h-4' : 'w-5 h-5'} mr-1`} />
              <span className="font-semibold">{formatVotes(contestant.views || 0)}</span>
            </div>

            {/* Rating */}
            {contestant.rating && (
              <div className="flex items-center text-yellow-500">
                <Star className={`${compact ? 'w-4 h-4' : 'w-5 h-5'} mr-1`} />
                <span className="font-semibold">{contestant.rating}</span>
              </div>
            )}
          </div>

          {/* Actions */}
          {!compact && (
            <div className="space-y-2">
              {showVoteButton && (
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleVote}
                  disabled={hasVoted || isVoting}
                  className={`w-full py-2 px-4 rounded-lg font-semibold transition-all duration-300 flex items-center justify-center ${
                    hasVoted
                      ? 'bg-green-100 text-green-700 cursor-not-allowed'
                      : 'bg-gradient-to-r from-pink-500 to-red-500 text-white hover:from-pink-600 hover:to-red-600'
                  }`}
                >
                  <AnimatePresence mode="wait">
                    {isVoting ? (
                      <motion.div
                        key="loading"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="flex items-center"
                      >
                        <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2"></div>
                        Đang bình chọn...
                      </motion.div>
                    ) : hasVoted ? (
                      <motion.div
                        key="voted"
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.8 }}
                        className="flex items-center"
                      >
                        <Heart className="w-4 h-4 mr-2 fill-current" />
                        Đã bình chọn
                      </motion.div>
                    ) : (
                      <motion.div
                        key="vote"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="flex items-center"
                      >
                        <Heart className="w-4 h-4 mr-2" />
                        Bình chọn
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.button>
              )}

              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleViewProfile}
                className="w-full py-2 px-4 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-all duration-300"
              >
                Xem hồ sơ
              </motion.button>
            </div>
          )}
        </div>

        {/* Compact Actions */}
        {compact && showVoteButton && (
          <div className="flex-shrink-0">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleVote}
              disabled={hasVoted || isVoting}
              className={`p-2 rounded-full transition-all duration-300 ${
                hasVoted
                  ? 'bg-green-100 text-green-600 cursor-not-allowed'
                  : 'bg-gradient-to-r from-pink-500 to-red-500 text-white hover:from-pink-600 hover:to-red-600'
              }`}
            >
              {isVoting ? (
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
              ) : (
                <Heart className={`w-4 h-4 ${hasVoted ? 'fill-current' : ''}`} />
              )}
            </motion.button>
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default ContestantCard;
