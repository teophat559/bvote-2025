/**
 * Enhanced Realtime Feed Component
 * Displays real-time events with advanced filtering and bulk operations
 * Preserves original UI design while adding new functionality
 */

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { vi } from 'date-fns/locale';

// Import existing UI components to preserve design
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Checkbox } from '../ui/checkbox';
import { Badge } from '../ui/badge';

const EnhancedRealtimeFeed = ({
  events = [],
  onBulkAction,
  onEventClick,
  className = ""
}) => {
  // State management
  const [selectedEvents, setSelectedEvents] = useState(new Set());
  const [filterType, setFilterType] = useState('all');
  const [filterSeverity, setFilterSeverity] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortOrder, setSortOrder] = useState('newest');
  const [autoScroll, setAutoScroll] = useState(true);

  // Refs
  const feedRef = useRef(null);
  const lastEventCount = useRef(events.length);

  // Auto-scroll to bottom when new events arrive
  useEffect(() => {
    if (autoScroll && feedRef.current && events.length > lastEventCount.current) {
      feedRef.current.scrollTop = feedRef.current.scrollHeight;
    }
    lastEventCount.current = events.length;
  }, [events.length, autoScroll]);

  // Filtered and sorted events
  const filteredEvents = useMemo(() => {
    let filtered = events.filter(event => {
      // Type filter
      if (filterType !== 'all' && !event.type?.includes(filterType)) {
        return false;
      }

      // Severity filter
      if (filterSeverity !== 'all' && event.severity !== filterSeverity) {
        return false;
      }

      // Search query
      if (searchQuery && !event.message?.toLowerCase().includes(searchQuery.toLowerCase()) &&
          !event.type?.toLowerCase().includes(searchQuery.toLowerCase())) {
        return false;
      }

      return true;
    });

    // Sort events
    if (sortOrder === 'newest') {
      filtered = filtered.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    } else {
      filtered = filtered.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
    }

    return filtered;
  }, [events, filterType, filterSeverity, searchQuery, sortOrder]);

  // Event selection handlers
  const handleSelectAll = (checked) => {
    if (checked) {
      setSelectedEvents(new Set(filteredEvents.map(e => e.id)));
    } else {
      setSelectedEvents(new Set());
    }
  };

  const handleSelectEvent = (eventId, checked) => {
    const newSelected = new Set(selectedEvents);
    if (checked) {
      newSelected.add(eventId);
    } else {
      newSelected.delete(eventId);
    }
    setSelectedEvents(newSelected);
  };

  // Bulk action handler
  const handleBulkAction = (action) => {
    if (selectedEvents.size === 0) return;

    const selectedEventData = filteredEvents.filter(e => selectedEvents.has(e.id));
    onBulkAction?.(action, selectedEventData);
    setSelectedEvents(new Set()); // Clear selection after action
  };

  // Get severity badge color (preserving original design)
  const getSeverityBadge = (severity) => {
    const colors = {
      'INFO': 'bg-blue-100 text-blue-800',
      'SUCCESS': 'bg-green-100 text-green-800',
      'WARNING': 'bg-yellow-100 text-yellow-800',
      'ERROR': 'bg-red-100 text-red-800',
      'ACTION': 'bg-purple-100 text-purple-800'
    };

    return (
      <Badge className={`text-xs ${colors[severity] || colors.INFO}`}>
        {severity || 'INFO'}
      </Badge>
    );
  };

  // Get event type icon
  const getEventIcon = (type) => {
    if (type?.includes('auth')) return '🔐';
    if (type?.includes('vote')) return '🗳️';
    if (type?.includes('auto_login')) return '🤖';
    if (type?.includes('admin')) return '⚡';
    if (type?.includes('user')) return '👤';
    if (type?.includes('system')) return '⚙️';
    return '📡';
  };

  return (
    <div className={`flex flex-col h-full ${className}`}>
      {/* Enhanced Controls - preserving original styling */}
      <div className="p-4 border-b bg-gray-50 space-y-4">
        {/* Search and Filters Row */}
        <div className="flex flex-wrap gap-3 items-center">
          <Input
            placeholder="Tìm kiếm sự kiện..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="flex-1 min-w-[200px]"
          />

          <Select value={filterType} onValueChange={setFilterType}>
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="Loại sự kiện" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tất cả</SelectItem>
              <SelectItem value="auth">Xác thực</SelectItem>
              <SelectItem value="vote">Bình chọn</SelectItem>
              <SelectItem value="auto_login">Auto Login</SelectItem>
              <SelectItem value="admin">Quản trị</SelectItem>
              <SelectItem value="user">Người dùng</SelectItem>
            </SelectContent>
          </Select>

          <Select value={filterSeverity} onValueChange={setFilterSeverity}>
            <SelectTrigger className="w-[120px]">
              <SelectValue placeholder="Mức độ" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tất cả</SelectItem>
              <SelectItem value="INFO">Thông tin</SelectItem>
              <SelectItem value="SUCCESS">Thành công</SelectItem>
              <SelectItem value="WARNING">Cảnh báo</SelectItem>
              <SelectItem value="ERROR">Lỗi</SelectItem>
              <SelectItem value="ACTION">Hành động</SelectItem>
            </SelectContent>
          </Select>

          <Select value={sortOrder} onValueChange={setSortOrder}>
            <SelectTrigger className="w-[120px]">
              <SelectValue placeholder="Sắp xếp" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="newest">Mới nhất</SelectItem>
              <SelectItem value="oldest">Cũ nhất</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Bulk Actions Row */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Checkbox
              checked={selectedEvents.size === filteredEvents.length && filteredEvents.length > 0}
              onCheckedChange={handleSelectAll}
            />
            <span className="text-sm text-gray-600">
              {selectedEvents.size > 0 ? `Đã chọn ${selectedEvents.size}` : 'Chọn tất cả'}
            </span>

            {selectedEvents.size > 0 && (
              <div className="flex gap-2 ml-4">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleBulkAction('acknowledge')}
                >
                  Xác nhận
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleBulkAction('archive')}
                >
                  Lưu trữ
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleBulkAction('delete')}
                >
                  Xóa
                </Button>
              </div>
            )}
          </div>

          <div className="flex items-center gap-2">
            <Checkbox
              checked={autoScroll}
              onCheckedChange={setAutoScroll}
            />
            <span className="text-sm text-gray-600">Tự động cuộn</span>

            <span className="text-sm text-gray-500 ml-4">
              {filteredEvents.length} / {events.length} sự kiện
            </span>
          </div>
        </div>
      </div>

      {/* Events Feed - preserving original design */}
      <div
        ref={feedRef}
        className="flex-1 overflow-y-auto p-4 space-y-2"
      >
        {filteredEvents.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <div className="text-2xl mb-2">📭</div>
            <p>Không có sự kiện nào phù hợp</p>
          </div>
        ) : (
          filteredEvents.map((event) => (
            <div
              key={event.id}
              className={`
                p-3 rounded-lg border cursor-pointer transition-all duration-200
                ${selectedEvents.has(event.id)
                  ? 'border-blue-300 bg-blue-50'
                  : 'border-gray-200 bg-white hover:border-gray-300 hover:shadow-sm'
                }
              `}
              onClick={() => onEventClick?.(event)}
            >
              <div className="flex items-start gap-3">
                <Checkbox
                  checked={selectedEvents.has(event.id)}
                  onCheckedChange={(checked) => handleSelectEvent(event.id, checked)}
                  onClick={(e) => e.stopPropagation()}
                />

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-lg">{getEventIcon(event.type)}</span>
                    {getSeverityBadge(event.severity)}
                    <span className="text-xs text-gray-500">
                      {formatDistanceToNow(new Date(event.timestamp), {
                        addSuffix: true,
                        locale: vi
                      })}
                    </span>
                  </div>

                  <p className="text-sm font-medium text-gray-900 mb-1">
                    {event.message}
                  </p>

                  {event.data && (
                    <div className="text-xs text-gray-600 bg-gray-50 rounded p-2 mt-2">
                      <pre className="whitespace-pre-wrap">
                        {JSON.stringify(event.data, null, 2)}
                      </pre>
                    </div>
                  )}

                  <div className="flex items-center gap-2 mt-2 text-xs text-gray-500">
                    <span>ID: {event.id?.slice(0, 8)}...</span>
                    <span>•</span>
                    <span>Nguồn: {event.source || 'system'}</span>
                    {event.userId && (
                      <>
                        <span>•</span>
                        <span>User: {event.userId}</span>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default EnhancedRealtimeFeed;
