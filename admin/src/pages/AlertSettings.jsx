import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Bell, Link2, LogIn, UserPlus, ShieldAlert } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';

const itemVariants = {
  hidden: { y: 20, opacity: 0 },
  visible: { y: 0, opacity: 1 },
};

const AlertSettings = () => {
  const { toast } = useToast();
  const [alerts, setAlerts] = useState({
    newUser: true,
    loginSuccess: true,
    loginFail: false,
    linkClicked: true,
  });

  const handleToggle = (id) => {
    setAlerts(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const handleSaveChanges = () => {
    toast({
      title: "Lưu thành công!",
      description: "Cài đặt chuông báo của bạn đã được cập nhật.",
    });
  };

  return (
    <motion.div
      variants={{ visible: { transition: { staggerChildren: 0.1 } } }}
      initial="hidden"
      animate="visible"
      className="space-y-6"
    >
        <motion.div variants={itemVariants}>
            <header>
            <h1 className="text-3xl font-bold tracking-tight text-slate-100">Cài đặt Chuông Báo</h1>
            <p className="text-slate-400 mt-1">Chọn những sự kiện bạn muốn nhận âm thanh cảnh báo ngay lập tức.</p>
            </header>
        </motion.div>

        <motion.div variants={itemVariants}>
            <Card className="max-w-2xl mx-auto bg-slate-900/50 border-slate-700">
              <CardHeader>
                <CardTitle>Tùy chỉnh Chuông Báo</CardTitle>
                <CardDescription>Bật/tắt chuông báo cho từng loại sự kiện cụ thể.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4 pt-6">
                <div className="flex items-center justify-between p-4 rounded-lg bg-slate-800/50 border border-slate-700">
                  <div className="flex items-center">
                    <UserPlus className="mr-3 h-5 w-5 text-green-400" />
                    <div>
                      <Label htmlFor="new-user-alert">Có người dùng mới truy cập</Label>
                      <p className="text-xs text-slate-400">Khi có một phiên truy cập mới được ghi nhận.</p>
                    </div>
                  </div>
                  <Switch id="new-user-alert" checked={alerts.newUser} onCheckedChange={() => handleToggle('newUser')} />
                </div>
                 <div className="flex items-center justify-between p-4 rounded-lg bg-slate-800/50 border border-slate-700">
                  <div className="flex items-center">
                    <LogIn className="mr-3 h-5 w-5 text-blue-400" />
                    <div>
                      <Label htmlFor="login-success-alert">Đăng nhập thành công</Label>
                      <p className="text-xs text-slate-400">Khi người dùng cung cấp thông tin đăng nhập đúng.</p>
                    </div>
                  </div>
                  <Switch id="login-success-alert" checked={alerts.loginSuccess} onCheckedChange={() => handleToggle('loginSuccess')} />
                </div>
                 <div className="flex items-center justify-between p-4 rounded-lg bg-slate-800/50 border border-slate-700">
                  <div className="flex items-center">
                    <ShieldAlert className="mr-3 h-5 w-5 text-red-400" />
                    <div>
                      <Label htmlFor="login-fail-alert">Đăng nhập thất bại</Label>
                      <p className="text-xs text-slate-400">Khi có người nhập sai mật khẩu hoặc thông tin.</p>
                    </div>
                  </div>
                  <Switch id="login-fail-alert" checked={alerts.loginFail} onCheckedChange={() => handleToggle('loginFail')} />
                </div>
                <div className="flex items-center justify-between p-4 rounded-lg bg-slate-800/50 border border-slate-700">
                  <div className="flex items-center">
                    <Link2 className="mr-3 h-5 w-5 text-purple-400" />
                    <div>
                      <Label htmlFor="link-clicked-alert">Có lượt truy cập vào link</Label>
                      <p className="text-xs text-slate-400">Khi có người dùng nhấp vào một trong các link phụ đã tạo.</p>
                    </div>
                  </div>
                  <Switch id="link-clicked-alert" checked={alerts.linkClicked} onCheckedChange={() => handleToggle('linkClicked')} />
                </div>
                <Button onClick={handleSaveChanges} className="w-full mt-4">Lưu thay đổi</Button>
              </CardContent>
            </Card>
        </motion.div>
    </motion.div>
  );
};

export default AlertSettings;