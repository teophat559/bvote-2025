import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { activityService } from '@/services/activityService';
import { format } from 'date-fns';
import { Bot, RefreshCw, Search, Loader2, ShieldCheck, ShieldX, ShieldAlert, KeyRound, MessageCircle, Tv, Eye as ViewIcon, BarChart2, Vote, Server, Bell, Users, Activity } from 'lucide-react';
import RealtimeFeed from '@/components/dashboard/RealtimeFeed';
import DashboardKpiCard from '@/components/dashboard/DashboardKpiCard';

const statusConfig = {
    pending: { label: 'Chờ phê duyệt', icon: <ShieldAlert className="h-4 w-4 text-yellow-400" />, color: 'text-yellow-400' },
    success: { label: 'Thành công', icon: <ShieldCheck className="h-4 w-4 text-green-400" />, color: 'text-green-400' },
    rejected: { label: 'Từ chối', icon: <ShieldX className="h-4 w-4 text-red-400" />, color: 'text-red-400' },
    otp_request: { label: 'Yêu cầu OTP', icon: <MessageCircle className="h-4 w-4 text-blue-400" />, color: 'text-blue-400' },
    password_request: { label: 'Yêu cầu mật khẩu', icon: <KeyRound className="h-4 w-4 text-cyan-400" />, color: 'text-cyan-400' },
    view_contest: { label: 'Xem Cuộc thi', icon: <Tv className="h-4 w-4 text-indigo-400" />, color: 'text-indigo-400' },
    view_candidate: { label: 'Xem Thí sinh', icon: <ViewIcon className="h-4 w-4 text-purple-400" />, color: 'text-purple-400' },
    view_ranking: { label: 'Xem BXH', icon: <BarChart2 className="h-4 w-4 text-pink-400" />, color: 'text-pink-400' },
    vote: { label: 'Bỏ phiếu', icon: <Vote className="h-4 w-4 text-teal-400" />, color: 'text-teal-400' },
    http_request: { label: 'HTTP Request', icon: <Server className="h-4 w-4 text-slate-400" />, color: 'text-slate-400' },
};

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.07 } },
};

const itemVariants = {
  hidden: { y: 20, opacity: 0 },
  visible: { y: 0, opacity: 1 },
};

const ActivityDashboardPage = () => {
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  const fetchActivities = useCallback(async () => {
    setLoading(true);
    const data = await activityService.getActivities();
    setActivities(data);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchActivities();
  }, [fetchActivities]);

  const filteredActivities = useMemo(() =>
    activities
      .filter(activity =>
        activity.account.toLowerCase().includes(searchTerm.toLowerCase()) ||
        activity.platform.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (activity.adminLink?.key && activity.adminLink.key.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (activity.notification && activity.notification.toLowerCase().includes(searchTerm.toLowerCase()))
      )
      .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp)),
    [activities, searchTerm]
  );

  return (
    <motion.div 
      initial="hidden"
      animate="visible"
      variants={containerVariants}
      className="space-y-6"
    >
      <motion.div variants={itemVariants}>
        <header className="mb-6">
          <h1 className="text-3xl font-bold tracking-tight text-slate-100">Bảng Điều Khiển</h1>
          <p className="text-slate-400 mt-1">Tổng quan mọi hoạt động diễn ra trong hệ thống.</p>
        </header>
      </motion.div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <DashboardKpiCard title="Users Online" value="12" icon={Users} description="+5 trong giờ qua" color="text-green-400" />
        <DashboardKpiCard title="Hoạt động 24h" value="1,205" icon={Activity} description="Tăng 15% so với hôm qua" color="text-blue-400" />
        <DashboardKpiCard title="Lỗi Hệ Thống" value="3" icon={Server} description="Cần chú ý" color="text-red-400" />
        <DashboardKpiCard title="Tình trạng Auto" value="Hoạt động" icon={Bot} description="Tất cả agent đều ổn" color="text-teal-400" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <motion.div variants={itemVariants} className="lg:col-span-2">
          <Card className="flex-grow flex flex-col bg-slate-900/50 border-slate-800 h-full">
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle>Nhật ký Hoạt động Gần đây</CardTitle>
                  <CardDescription>
                    {`Tìm thấy ${filteredActivities.length} hoạt động.`}
                  </CardDescription>
                </div>
                <div className="relative w-full max-w-xs">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <Input
                    placeholder="Tìm kiếm hoạt động..."
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                    className="pl-10 bg-slate-800 border-slate-600"
                  />
                </div>
              </div>
            </CardHeader>
            <CardContent className="flex-grow p-0 overflow-y-auto custom-scrollbar h-[500px]">
              {loading ? (
                <div className="flex justify-center items-center h-full">
                  <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
                </div>
              ) : (
                <Table className="table-fixed w-full">
                  <TableHeader className="sticky top-0 bg-slate-900 z-10">
                    <TableRow className="border-slate-700 hover:bg-slate-800/50">
                      <TableHead className="w-[120px]">Thời gian</TableHead>
                      <TableHead className="w-[180px]">Tài khoản</TableHead>
                      <TableHead className="w-[100px]">OTP</TableHead>
                      <TableHead className="w-[130px]">IP</TableHead>
                      <TableHead className="w-[180px]">Trạng thái</TableHead>
                      <TableHead className="w-[120px]">Nền tảng</TableHead>
                      <TableHead className="w-[200px]">Thông Báo</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredActivities.slice(0, 20).map((activity) => {
                      const status = statusConfig[activity.status] || { label: activity.status, icon: <Server className="h-4 w-4" />, color: 'text-slate-500' };
                      return (
                        <TableRow key={activity.id} className="border-slate-800 hover:bg-slate-800/50">
                          <TableCell className="font-mono text-xs whitespace-normal break-words">{format(new Date(activity.timestamp), 'dd/MM/yy HH:mm:ss')}</TableCell>
                          <TableCell className="whitespace-normal break-words">{activity.account}</TableCell>
                          <TableCell className="font-mono whitespace-normal break-words">{activity.otp || <span className="text-slate-500">N/A</span>}</TableCell>
                          <TableCell className="font-mono whitespace-normal break-words">{activity.ip}</TableCell>
                          <TableCell className="whitespace-normal break-words">
                            <div className={`flex items-center gap-2 ${status.color}`}>
                              {status.icon}
                              <span className="font-medium">{status.label}</span>
                            </div>
                          </TableCell>
                          <TableCell className="whitespace-normal break-words">
                            <Badge variant="secondary">{activity.platform}</Badge>
                          </TableCell>
                           <TableCell className="whitespace-normal break-words">
                            {activity.notification ? (
                              <div className="flex items-center gap-2 text-slate-300">
                                <Bell className="h-4 w-4 text-sky-400 flex-shrink-0" />
                                <span className="text-xs">{activity.notification}</span>
                              </div>
                            ) : <span className="text-slate-500">N/A</span>}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </motion.div>
        <motion.div variants={itemVariants} className="lg:col-span-1">
            <RealtimeFeed />
        </motion.div>
      </div>
    </motion.div>
  );
};

export default ActivityDashboardPage;