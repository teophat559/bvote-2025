import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Textarea } from '../components/ui/textarea';
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
  CheckCircle, 
  XCircle, 
  Trash2, 
  RefreshCw, 
  Plus, 
  Copy 
} from 'lucide-react';

const ProxyManager = () => {
  const { toast } = useToast();
  const [proxies, setProxies] = useState([]);
  const [proxyInput, setProxyInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(false);

  // Load proxies on mount
  useEffect(() => {
    loadProxies();
  }, []);

  const loadProxies = async () => {
    try {
      const response = await fetch('/api/proxy/list');
      const data = await response.json();
      
      if (data.success) {
        setProxies(data.proxies);
      }
    } catch (error) {
      console.error('Error loading proxies:', error);
      toast({
        title: "Lỗi",
        description: "Không thể tải danh sách proxy",
        variant: "destructive"
      });
    }
  };

  const handleAddProxies = async () => {
    if (!proxyInput.trim()) {
      toast({
        title: "Lỗi",
        description: "Vui lòng nhập danh sách proxy",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    try {
      const proxyList = proxyInput
        .split('\n')
        .map(line => line.trim())
        .filter(line => line.length > 0);

      const response = await fetch('/api/proxy/add', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ proxies: proxyList })
      });

      const data = await response.json();

      if (data.success) {
        toast({
          title: "Thành công",
          description: `Đã thêm ${data.added.length} proxy`,
        });
        setProxyInput('');
        loadProxies();
      } else {
        toast({
          title: "Lỗi",
          description: data.message,
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Error adding proxies:', error);
      toast({
        title: "Lỗi",
        description: "Không thể thêm proxy",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCheckProxies = async () => {
    if (proxies.length === 0) {
      toast({
        title: "Lỗi",
        description: "Không có proxy để kiểm tra",
        variant: "destructive"
      });
      return;
    }

    setChecking(true);
    try {
      const proxyIds = proxies.map(p => p.id);
      
      const response = await fetch('/api/proxy/check', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ proxyIds })
      });

      const data = await response.json();

      if (data.success) {
        const workingCount = data.results.filter(r => r.isWorking).length;
        toast({
          title: "Hoàn tất kiểm tra",
          description: `${workingCount}/${proxies.length} proxy hoạt động`,
        });
        loadProxies();
      }
    } catch (error) {
      console.error('Error checking proxies:', error);
      toast({
        title: "Lỗi",
        description: "Không thể kiểm tra proxy",
        variant: "destructive"
      });
    } finally {
      setChecking(false);
    }
  };

  const handleDeleteProxy = async (id) => {
    try {
      const response = await fetch(`/api/proxy/${id}`, {
        method: 'DELETE'
      });

      const data = await response.json();

      if (data.success) {
        toast({
          title: "Thành công",
          description: "Đã xóa proxy",
        });
        loadProxies();
      }
    } catch (error) {
      console.error('Error deleting proxy:', error);
      toast({
        title: "Lỗi",
        description: "Không thể xóa proxy",
        variant: "destructive"
      });
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Đã sao chép",
      description: "Proxy đã được sao chép vào clipboard",
    });
  };

  const workingProxies = proxies.filter(p => p.isWorking).length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Quản Lý Proxy</h1>
        <p className="text-muted-foreground mt-1">
          Thêm và quản lý proxy cho hệ thống auto login
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">{proxies.length}</div>
            <p className="text-xs text-muted-foreground">Tổng số proxy</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-green-500">{workingProxies}</div>
            <p className="text-xs text-muted-foreground">Proxy hoạt động</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-red-500">
              {proxies.length - workingProxies}
            </div>
            <p className="text-xs text-muted-foreground">Proxy lỗi</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Plus className="h-5 w-5" />
            Thêm Proxy
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="text-sm font-medium mb-2 block">
              Danh sách Proxy (Định dạng: host:port:user:pass)
            </label>
            <Textarea
              placeholder="Ví dụ:&#10;45.76.214.123:8080:user1:pass1&#10;192.168.1.100:3128:user2:pass2"
              value={proxyInput}
              onChange={(e) => setProxyInput(e.target.value)}
              rows={8}
              className="font-mono text-sm"
            />
          </div>
          <div className="flex gap-2">
            <Button 
              onClick={handleAddProxies}
              disabled={loading || !proxyInput.trim()}
              className="flex-1"
            >
              {loading ? (
                <>
                  <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                  Đang thêm...
                </>
              ) : (
                <>
                  <Plus className="mr-2 h-4 w-4" />
                  Thêm Proxy
                </>
              )}
            </Button>
            <Button 
              onClick={handleCheckProxies}
              disabled={checking || proxies.length === 0}
              variant="outline"
            >
              {checking ? (
                <>
                  <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                  Đang kiểm tra...
                </>
              ) : (
                <>
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Kiểm tra tất cả
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Danh Sách Proxy</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Host</TableHead>
                  <TableHead>Port</TableHead>
                  <TableHead>Username</TableHead>
                  <TableHead>Trạng thái</TableHead>
                  <TableHead>Kiểm tra lần cuối</TableHead>
                  <TableHead className="text-right">Hành động</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {proxies.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center text-muted-foreground">
                      Chưa có proxy nào. Thêm proxy để bắt đầu.
                    </TableCell>
                  </TableRow>
                ) : (
                  proxies.map((proxy) => (
                    <TableRow key={proxy.id}>
                      <TableCell className="font-mono">{proxy.host}</TableCell>
                      <TableCell className="font-mono">{proxy.port}</TableCell>
                      <TableCell className="font-mono text-muted-foreground">
                        {proxy.username || '-'}
                      </TableCell>
                      <TableCell>
                        {proxy.isWorking ? (
                          <Badge variant="success" className="flex items-center gap-1 w-fit">
                            <CheckCircle className="h-3 w-3" />
                            Hoạt động
                          </Badge>
                        ) : (
                          <Badge variant="destructive" className="flex items-center gap-1 w-fit">
                            <XCircle className="h-3 w-3" />
                            Lỗi
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {proxy.lastChecked 
                          ? new Date(proxy.lastChecked).toLocaleString('vi-VN')
                          : 'Chưa kiểm tra'
                        }
                      </TableCell>
                      <TableCell>
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => copyToClipboard(`${proxy.host}:${proxy.port}`)}
                          >
                            <Copy className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteProxy(proxy.id)}
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
        </CardContent>
      </Card>
    </div>
  );
};

export default ProxyManager;
