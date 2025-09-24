import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { PlusCircle, Trash2 } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';

const itemVariants = {
  hidden: { y: 20, opacity: 0 },
  visible: { y: 0, opacity: 1 },
};

const IPWhitelist = () => {
  const { toast } = useToast();
  const [ipAddress, setIpAddress] = useState('');
  const [whitelistedIPs, setWhitelistedIPs] = useState([
    { id: 1, ip: '192.168.1.1', description: 'Văn phòng chính' },
    { id: 2, ip: '10.0.0.5', description: 'Máy chủ VPN' },
  ]);

  const handleAddIP = () => {
    if (!ipAddress) {
      toast({ title: 'Lỗi', description: 'Vui lòng nhập địa chỉ IP.', variant: 'destructive' });
      return;
    }
    setWhitelistedIPs(prev => [...prev, { id: Date.now(), ip: ipAddress, description: 'Mới thêm' }]);
    setIpAddress('');
    toast({ title: 'Thành công!', description: `Đã thêm IP ${ipAddress} vào danh sách trắng.` });
  };

  const handleDeleteIP = (id) => {
    setWhitelistedIPs(prev => prev.filter(ip => ip.id !== id));
    toast({ title: 'Đã xóa!', description: 'Địa chỉ IP đã được xóa khỏi danh sách trắng.' });
  };

  return (
    <motion.div
      variants={itemVariants}
      initial="hidden"
      animate="visible"
      className="space-y-6"
    >
        <header>
          <h1 className="text-3xl font-bold tracking-tight text-slate-100">Danh sách IP cho phép</h1>
          <p className="text-slate-400 mt-1">Chỉ cho phép các địa chỉ IP được liệt kê truy cập vào bảng điều khiển Admin.</p>
        </header>

        <Card className="bg-slate-900/50 border-slate-700">
          <CardHeader>
            <CardTitle>Thêm địa chỉ IP mới</CardTitle>
            <CardDescription>Thêm địa chỉ IP hoặc dải IP để cấp quyền truy cập.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="ip-address">Địa chỉ IP</Label>
              <Input
                id="ip-address"
                placeholder="e.g., 192.168.1.1 hoặc 192.168.1.0/24"
                value={ipAddress}
                onChange={(e) => setIpAddress(e.target.value)}
                className="mt-2 bg-slate-800 border-slate-600"
              />
            </div>
            <Button onClick={handleAddIP} className="w-full">
              <PlusCircle className="mr-2 h-4 w-4" /> Thêm IP
            </Button>
          </CardContent>
        </Card>

        <Card className="bg-slate-900/50 border-slate-700">
          <CardHeader>
            <CardTitle>Danh sách IP đã cho phép</CardTitle>
            <CardDescription>Các địa chỉ IP hiện đang được phép truy cập.</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Địa chỉ IP</TableHead>
                  <TableHead>Mô tả</TableHead>
                  <TableHead className="text-right">Hành động</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {whitelistedIPs.map((ip) => (
                  <TableRow key={ip.id}>
                    <TableCell className="font-mono">{ip.ip}</TableCell>
                    <TableCell>{ip.description}</TableCell>
                    <TableCell className="text-right">
                      <Button variant="destructive" size="sm" onClick={() => handleDeleteIP(ip.id)}>
                        <Trash2 className="mr-2 h-4 w-4" />
                        Xóa
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
    </motion.div>
  );
};

export default IPWhitelist;