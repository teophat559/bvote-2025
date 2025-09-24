import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, Download, RefreshCw, Loader2 } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { logService } from '@/services/logService';
import { format } from 'date-fns';
import { usePermissions } from '@/hooks/usePermissions';
import { Badge } from '@/components/ui/badge'; /* Fixed: Added Badge import */

const itemVariants = {
  hidden: { y: 20, opacity: 0 },
  visible: { y: 0, opacity: 1 },
};

const LogsPage = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const { toast } = useToast();
  const { hasPermission } = usePermissions();

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    try {
      const data = await logService.getLogs();
      setLogs(data);
    } catch (error) {
      toast({ title: 'Lỗi', description: `Không thể tải nhật ký: ${error.message}`, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  const filteredLogs = useMemo(() =>
    logs.filter(log =>
      log.message.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.level.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.timestamp.toLowerCase().includes(searchTerm.toLowerCase())
    ).sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp)),
    [logs, searchTerm]
  );

  const handleExportCSV = () => {
    if (!hasPermission('super')) {
      toast({ title: 'Từ chối truy cập', description: 'Bạn không có quyền xuất dữ liệu.', variant: 'destructive' });
      return;
    }
    const headers = ['Timestamp', 'Level', 'Message', 'Source'];
    const rows = filteredLogs.map(log => [
      `"${log.timestamp}"`,
      `"${log.level}"`,
      `"${log.message.replace(/"/g, '""')}"`,
      `"${log.source}"`
    ]);
    const csvContent = [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.setAttribute('download', `system_logs_${format(new Date(), 'yyyyMMdd_HHmmss')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast({ title: 'Thành công!', description: 'Đã xuất nhật ký hệ thống ra tệp CSV.' });
  };

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={{ visible: { transition: { staggerChildren: 0.1 } } }}
      className="space-y-6"
    >
      <motion.div variants={itemVariants}>
        <header className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-slate-100">Nhật Ký Hệ Thống</h1>
            <p className="text-slate-400 mt-1">Xem và quản lý các sự kiện và lỗi của hệ thống.</p>
          </div>
          <div className="flex gap-2">
            <Button onClick={handleExportCSV} disabled={!hasPermission('super')}>
              <Download className="mr-2 h-4 w-4" /> Xuất CSV
            </Button>
          </div>
        </header>
      </motion.div>

      <motion.div variants={itemVariants}>
        <Card className="bg-slate-900/50 border-slate-800">
          <CardHeader>
            <CardTitle>Danh sách Nhật ký</CardTitle>
            <CardDescription>
              {`Tìm thấy ${filteredLogs.length} mục nhật ký.`}
            </CardDescription>
            <div className="relative w-full max-w-sm pt-2">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input
                placeholder="Tìm kiếm nhật ký..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 bg-slate-800 border-slate-600"
              />
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              {loading ? (
                <div className="flex justify-center items-center py-10">
                  <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow className="border-slate-700 hover:bg-slate-800/50">
                      <TableHead className="w-[180px]">Thời gian</TableHead>
                      <TableHead className="w-[100px]">Cấp độ</TableHead>
                      <TableHead>Thông báo</TableHead>
                      <TableHead className="w-[150px]">Nguồn</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredLogs.map((log) => (
                      <TableRow key={log.id} className="border-slate-800 hover:bg-slate-800/50">
                        <TableCell className="font-mono text-xs">{format(new Date(log.timestamp), 'dd/MM/yy HH:mm:ss')}</TableCell>
                        <TableCell>
                          <Badge variant={log.level === 'error' ? 'destructive' : log.level === 'warn' ? 'secondary' : 'default'}>
                            {log.level.toUpperCase()}
                          </Badge>
                        </TableCell>
                        <TableCell className="whitespace-normal break-words">{log.message}</TableCell>
                        <TableCell className="font-mono text-xs">{log.source}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  );
};

export default LogsPage;