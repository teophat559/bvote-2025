import React from 'react';
import { motion } from 'framer-motion';
import { Calendar, Users, Trophy, ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const ContestCard = ({ contest, featured = false }) => {
  const navigate = useNavigate();

  const handleViewDetails = () => {
    navigate(`/contest/${contest.id}`);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatNumber = (num) => {
    return new Intl.NumberFormat('vi-VN').format(num);
  };

  return (
    <motion.div
      whileHover={{ y: -5 }}
      className={`bg-white rounded-xl shadow-lg overflow-hidden border border-gray-200 transition-all duration-300 hover:shadow-xl ${
        featured ? 'lg:col-span-1' : ''
      }`}
    >
      {/* Contest Cover Image */}
      <div className="relative">
        <img
          src={contest.coverImage || '/api/placeholder/400/200'}
          alt={contest.title}
          className={`w-full object-cover ${featured ? 'h-48' : 'h-40'}`}
        />

        {/* Contest Status Badge */}
        <div className="absolute top-4 left-4">
          <span className={`px-3 py-1 rounded-full text-xs font-semibold text-white ${
            contest.status === 'active'
              ? 'bg-green-500'
              : contest.status === 'upcoming'
              ? 'bg-blue-500'
              : 'bg-gray-500'
          }`}>
            {contest.status === 'active' ? 'Đang diễn ra' :
             contest.status === 'upcoming' ? 'Sắp diễn ra' : 'Đã kết thúc'}
          </span>
        </div>

        {/* Participant Count */}
        <div className="absolute top-4 right-4 bg-black bg-opacity-50 text-white px-3 py-1 rounded-full">
          <div className="flex items-center text-xs">
            <Users className="w-3 h-3 mr-1" />
            {contest.participantCount || 0} thí sinh
          </div>
        </div>
      </div>

      {/* Contest Info */}
      <div className="p-6">
        {/* Title */}
        <h3 className={`font-bold text-gray-800 mb-3 line-clamp-2 ${
          featured ? 'text-xl' : 'text-lg'
        }`}>
          {contest.title}
        </h3>

        {/* Description */}
        <p className="text-gray-600 text-sm mb-4 line-clamp-2">
          {contest.description}
        </p>

        {/* Contest Details */}
        <div className="space-y-2 mb-4">
          {/* Time Period */}
          <div className="flex items-center text-sm text-gray-500">
            <Calendar className="w-4 h-4 mr-2" />
            <span>
              {formatDate(contest.startDate)} - {formatDate(contest.endDate)}
            </span>
          </div>

          {/* Total Votes */}
          <div className="flex items-center text-sm text-gray-500">
            <Trophy className="w-4 h-4 mr-2" />
            <span>
              {formatNumber(contest.totalVotes || 0)} lượt bình chọn
            </span>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="mb-4">
          <div className="flex justify-between items-center mb-1">
            <span className="text-xs text-gray-500">Tiến độ cuộc thi</span>
            <span className="text-xs font-medium text-gray-700">
              {contest.progress || 0}%
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-gradient-to-r from-blue-500 to-purple-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${contest.progress || 0}%` }}
            ></div>
          </div>
        </div>

        {/* Action Button */}
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={handleViewDetails}
          className="w-full bg-gradient-to-r from-blue-500 to-purple-600 text-white py-3 px-4 rounded-lg font-semibold transition-all duration-300 hover:from-blue-600 hover:to-purple-700 flex items-center justify-center"
        >
          <span>Xem chi tiết</span>
          <ChevronRight className="w-4 h-4 ml-2" />
        </motion.button>
      </div>
    </motion.div>
  );
};

export default ContestCard;
