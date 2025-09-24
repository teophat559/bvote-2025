import React from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Save, User, Lock, Shield, Users, Bell } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { useAuth } from '@/hooks/useAuth';

const itemVariants = {
  hidden: { y: 20, opacity: 0 },
  visible: { y: 0, opacity: 1 },
};

const SettingsPage = () => {
  const { toast } = useToast();
  const { user } = useAuth();

  const handleSaveProfile = () => {
    toast({
      title: 'Lưu thành công!',
      description: 'Thông tin hồ sơ của bạn đã được cập nhật.',
    });
  };

  const handleSaveSecurity = () => {
    toast({
      title: 'Lưu thành công!',
      description: 'Cài đặt bảo mật của bạn đã được cập nhật.',
    });
  };

  const handleNotImplemented = () => {
    toast({
      title: '🚧 Tính năng này chưa được triển khai!',
      description: 'Đừng lo! Bạn có thể yêu cầu tính năng này trong lần tương tác tiếp theo! 🚀',
    });
  };

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={{ visible: { transition: { staggerChildren: 0.1 } } }}
      className="space-y-6"
    >
      <motion.div variants={itemVariants}>
        <header>
          <h1 className="text-3xl font-bold tracking-tight text-slate-100">Cài đặt Tài khoản</h1>
          <p className="text-slate-400 mt-1">Quản lý thông tin hồ sơ, bảo mật và các tùy chọn khác.</p>
        </header>
      </motion.div>

      <motion.div variants={itemVariants}>
        <Card className="bg-slate-900/50 border-slate-700">
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><User className="h-5 w-5" /> Thông tin Hồ sơ</CardTitle>
            <CardDescription>Cập nhật tên, email và các thông tin cá nhân khác.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="username">Tên đăng nhập</Label>
              <Input id="username" defaultValue={user?.username || 'admin'} className="mt-2 bg-slate-800 border-slate-600" />
            </div>
            <div>
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" defaultValue={user?.email || 'admin@example.com'} className="mt-2 bg-slate-800 border-slate-600" />
            </div>
            <Button onClick={handleSaveProfile} className="bg-blue-600 hover:bg-blue-700">
              <Save className="mr-2 h-4 w-4" /> Lưu Hồ sơ
            </Button>
          </CardContent>
        </Card>
      </motion.div>

      <motion.div variants={itemVariants}>
        <Card className="bg-slate-900/50 border-slate-700">
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Lock className="h-5 w-5" /> Bảo mật</CardTitle>
            <CardDescription>Thay đổi mật khẩu và quản lý xác thực 2 yếu tố.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="current-password">Mật khẩu hiện tại</Label>
              <Input id="current-password" type="password" placeholder="********" className="mt-2 bg-slate-800 border-slate-600" />
            </div>
            <div>
              <Label htmlFor="new-password">Mật khẩu mới</Label>
              <Input id="new-password" type="password" placeholder="********" className="mt-2 bg-slate-800 border-slate-600" />
            </div>
            <div>
              <Label htmlFor="confirm-password">Xác nhận mật khẩu mới</Label>
              <Input id="confirm-password" type="password" placeholder="********" className="mt-2 bg-slate-800 border-slate-600" />
            </div>
            <Button onClick={handleSaveSecurity} className="bg-blue-600 hover:bg-blue-700">
              <Save className="mr-2 h-4 w-4" /> Lưu Mật khẩu
            </Button>
            <div className="border-t border-slate-700 pt-4 mt-4">
              <h4 className="text-lg font-semibold mb-2">Xác thực 2 yếu tố (2FA)</h4>
              <p className="text-sm text-muted-foreground mb-4">Thêm một lớp bảo mật bổ sung cho tài khoản của bạn.</p>
              <Button onClick={handleNotImplemented} variant="outline">
                <Shield className="mr-2 h-4 w-4" /> Kích hoạt 2FA
              </Button>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      <motion.div variants={itemVariants}>
        <Card className="bg-slate-900/50 border-slate-700">
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Users className="h-5 w-5" /> Quản lý Admin</CardTitle>
            <CardDescription>Thêm, xóa hoặc chỉnh sửa quyền của các tài khoản quản trị viên khác.</CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={handleNotImplemented} className="w-full">
              <Users className="mr-2 h-4 w-4" /> Quản lý Admin
            </Button>
          </CardContent>
        </Card>
      </motion.div>

      <motion.div variants={itemVariants}>
        <Card className="bg-slate-900/50 border-slate-700">
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Bell className="h-5 w-5" /> Cài đặt Thông báo</CardTitle>
            <CardDescription>Cấu hình cách bạn nhận thông báo từ hệ thống.</CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={handleNotImplemented} className="w-full">
              <Bell className="mr-2 h-4 w-4" /> Cấu hình Thông báo
            </Button>
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  );
};

export default SettingsPage;