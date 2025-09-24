import React, { useState } from "react";

const ContestPage = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");

  const contests = [
    {
      id: 1,
      title: "Miss Beauty Vietnam 2024",
      description:
        "Cuộc thi sắc đẹp lớn nhất năm với sự tham gia của 50+ thí sinh từ khắp cả nước.",
      status: "active",
      participantCount: 52,
      totalVotes: 245630,
      startDate: "2024-01-15",
      endDate: "2024-03-15",
    },
    {
      id: 2,
      title: "Mr Handsome Contest 2024",
      description:
        "Cuộc thi dành cho nam giới tìm kiếm những chàng trai tài năng và có phẩm chất tốt nhất.",
      status: "voting",
      participantCount: 35,
      totalVotes: 189420,
      startDate: "2024-02-01",
      endDate: "2024-04-01",
    },
    {
      id: 3,
      title: "Miss Talent 2024",
      description:
        "Cuộc thi tài năng dành cho các thí sinh có năng khiếu đặc biệt trong các lĩnh vực nghệ thuật.",
      status: "upcoming",
      participantCount: 28,
      totalVotes: 156780,
      startDate: "2024-03-01",
      endDate: "2024-05-01",
    },
  ];

  const filteredContests = contests.filter((contest) => {
    const matchesSearch =
      contest.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      contest.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus =
      filterStatus === "all" || contest.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const getStatusColor = (status) => {
    switch (status) {
      case "active":
        return "bg-green-500 text-white";
      case "voting":
        return "bg-blue-500 text-white";
      case "upcoming":
        return "bg-yellow-500 text-white";
      case "closed":
        return "bg-gray-500 text-white";
      default:
        return "bg-purple-500 text-white";
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case "active":
        return "Đang diễn ra";
      case "voting":
        return "Đang bình chọn";
      case "upcoming":
        return "Sắp diễn ra";
      case "closed":
        return "Đã kết thúc";
      default:
        return "Khác";
    }
  };

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            Danh sách cuộc thi
          </h1>
          <p className="text-gray-600">
            Khám phá và tham gia các cuộc thi đang diễn ra
          </p>
        </div>

        {/* Search and Filter */}
        <div className="bg-gray-50 rounded-lg p-6 mb-8">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <input
                type="text"
                placeholder="Tìm kiếm cuộc thi..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">Tất cả trạng thái</option>
                <option value="active">Đang diễn ra</option>
                <option value="voting">Đang bình chọn</option>
                <option value="upcoming">Sắp diễn ra</option>
                <option value="closed">Đã kết thúc</option>
              </select>
            </div>
          </div>
        </div>

        {/* Contests Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {filteredContests.map((contest) => (
            <div
              key={contest.id}
              className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow"
            >
              <div className="h-48 bg-gradient-to-r from-blue-400 to-purple-500"></div>
              <div className="p-6">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-xl font-bold text-gray-900">
                    {contest.title}
                  </h3>
                  <span
                    className={`px-3 py-1 rounded-full text-sm font-semibold ${getStatusColor(
                      contest.status
                    )}`}
                  >
                    {getStatusText(contest.status)}
                  </span>
                </div>
                <p className="text-gray-600 mb-4">{contest.description}</p>

                <div className="space-y-2 mb-4">
                  <div className="flex items-center justify-between text-sm text-gray-500">
                    <span>👥 {contest.participantCount} thí sinh</span>
                    <span>
                      🗳️ {contest.totalVotes.toLocaleString()} lượt bình chọn
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm text-gray-500">
                    <span>
                      📅 Bắt đầu:{" "}
                      {new Date(contest.startDate).toLocaleDateString("vi-VN")}
                    </span>
                    <span>
                      📅 Kết thúc:{" "}
                      {new Date(contest.endDate).toLocaleDateString("vi-VN")}
                    </span>
                  </div>
                </div>

                <button className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors">
                  Xem chi tiết
                </button>
              </div>
            </div>
          ))}
        </div>

        {filteredContests.length === 0 && (
          <div className="text-center py-12">
            <div className="text-gray-400 text-6xl mb-4">🔍</div>
            <h3 className="text-xl font-semibold text-gray-600 mb-2">
              Không tìm thấy cuộc thi
            </h3>
            <p className="text-gray-500">
              Thử điều chỉnh từ khóa tìm kiếm hoặc bộ lọc
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ContestPage;
