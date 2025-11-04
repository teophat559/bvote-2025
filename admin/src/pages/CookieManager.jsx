import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { useToast } from '../components/ui/use-toast';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '../components/ui/table';
import {
  Cookie,
  Copy,
  TestTube,
  Send,
  Trash2,
  RefreshCw
} from 'lucide-react';

const CookieManager = () => {
  const { toast } = useToast();
  const [cookies, setCookies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [testingId, setTestingId] = useState(null);

  useEffect(() => {
    loadCookies();
  }, []);

  const loadCookies = async () => {
    try {
      const response = await fetch('/api/cookies/list');
      const data = await response.json();

      if (data.success) {
        setCookies(data.cookies);
      }
    } catch (error) {
      console.error('Error loading cookies:', error);
      toast({
        title: "Lỗi",
        description: "Không thể tải danh sách cookie",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = async (id) => {
    try {
      const response = await fetch(`/api/cookies/${id}`);
      const data = await response.json();

      if (data.success) {
        const cookieString = JSON.stringify(data.cookieData, null, 2);
        await navigator.clipboard.writeText(cookieString);
        toast({
          title: "Thành công",
          description: "Cookie đã được sao chép vào clipboard",
        });
      }
    } catch (error) {
      console.error('Error copying cookie:', error);
      toast({
        title: "Lỗi",
        description: "Không thể sao chép cookie",
        variant: "destructive"
      });
    }
  };

  const handleTest = async (id) => {
    setTestingId(id);
    try {
      const response = await fetch('/api/cookies/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ accountId: id })
      });

      const data = await response.json();

      if (data.success) {
        toast({
          title: data.isValid ? "Cookie hợp lệ" : "Cookie không hợp lệ",
          description: data.message,
          variant: data.isValid ? "default" : "destructive"
        });
      }
    } catch (error) {
      console.error('Error testing cookie:', error);
      toast({
        title: "Lỗi",
        description: "Không thể kiểm tra cookie",
        variant: "destructive"
      });
    } finally {
      setTestingId(null);
    }
  };

  const handleSendTelegram = async (id) => {
    try {
      const response = await fetch('/api/telegram/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ accountId: id })
      });

      const data = await response.json();

      if (data.success) {
        toast({
          title: "Thành công",
          description: "Cookie đã được gửi lên Telegram",
        });
      } else {
        toast({
          title: "Lỗi",
          description: data.message,
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Error sending to Telegram:', error);
      toast({
        title: "Lỗi",
        description: "Không thể gửi cookie lên Telegram",
        variant: "destructive"
      });
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Bạn có chắc muốn xóa cookie này?')) {
      return;
    }

    try {
      const response = await fetch(`/api/cookies/${id}`, {
        method: 'DELETE'
      });

      const data = await response.json();

      if (data.success) {
        toast({
          title: "Thành công",
          description: "Cookie đã được xóa",
        });
        loadCookies();
      }
    } catch (error) {
      console.error('Error deleting cookie:', error);
      toast({
        title: "Lỗi",
        description: "Không thể xóa cookie",
        variant: "destructive"
      });
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleString('vi-VN');
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <Cookie className="h-8 w-8" />
            Quản Lý Cookie
          </h1>
          <p className="text-muted-foreground mt-1">
            Quản lý và sử dụng cookie từ các tài khoản đã đăng nhập
          </p>
        </div>
        <Button onClick={loadCookies} variant="outline">
          <RefreshCw className="mr-2 h-4 w-4" />
          Làm mới
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Danh Sách Cookie</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8 text-muted-foreground">
              Đang tải...
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Email</TableHead>
                    <TableHead>Đăng nhập lần cuối</TableHead>
                    <TableHead>Proxy</TableHead>
                    <TableHead>Trạng thái</TableHead>
                    <TableHead className="text-right">Hành động</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {cookies.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center text-muted-foreground">
                        Chưa có cookie nào. Đăng nhập tài khoản để tạo cookie.
                      </TableCell>
                    </TableRow>
                  ) : (
                    cookies.map((cookie) => (
                      <TableRow key={cookie.id}>
                        <TableCell className="font-mono">{cookie.email}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {formatDate(cookie.lastLogin)}
                        </TableCell>
                        <TableCell className="font-mono text-sm">
                          {cookie.proxy || '-'}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={cookie.status === 'success' ? 'success' : 'default'}
                          >
                            {cookie.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleCopy(cookie.id)}
                              title="Sao chép cookie"
                            >
                              <Copy className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleTest(cookie.id)}
                              disabled={testingId === cookie.id}
                              title="Kiểm tra cookie"
                            >
                              {testingId === cookie.id ? (
                                <RefreshCw className="h-4 w-4 animate-spin" />
                              ) : (
                                <TestTube className="h-4 w-4" />
                              )}
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleSendTelegram(cookie.id)}
                              title="Gửi lên Telegram"
                            >
                              <Send className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDelete(cookie.id)}
                              title="Xóa cookie"
                            >
                              <Trash2 className="h-4 w-4 text-red-500" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default CookieManager;
