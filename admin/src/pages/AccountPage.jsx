import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/components/ui/use-toast';
import { KeyRound, ShieldCheck, Copy, RefreshCw, LogOut, Eye, EyeOff } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';
import PageHeader from '@/components/PageHeader';

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.1 } },
};

const itemVariants = {
  hidden: { y: 20, opacity: 0 },
  visible: { y: 0, opacity: 1 },
};

const AccountPage = () => {
  const { user, logout, updateUser } = useAuth();
  const { toast } = useToast();
  
  const [showApiKey, setShowApiKey] = useState(false);
  const [is2faEnabled, setIs2faEnabled] = useState(user?.is_2fa_enabled || false);
  
  const [passwordFields, setPasswordFields] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  if (!user || !user.username) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-200px)]">
        <div className="w-16 h-16 border-4 border-dashed rounded-full animate-spin border-primary"></div>
      </div>
    );
  }

  const handlePasswordInputChange = (e) => {
    const { id, value } = e.target;
    setPasswordFields(prev => ({ ...prev, [id]: value }));
  };

  const handleCopy = (text, fieldName) => {
    navigator.clipboard.writeText(text);
    toast({
      title: 'Đã sao chép!',
      description: `${fieldName} đã được sao chép vào clipboard.`,
    });
  };
  
  const handleChangePassword = () => {
    const { newPassword, confirmPassword } = passwordFields;
    if (!newPassword || !confirmPassword) {
      toast({
        variant: "destructive",
        title: 'Lỗi!',
        description: 'Vui lòng điền đầy đủ mật khẩu mới và xác nhận.',
      });
      return;
    }
    if (newPassword !== confirmPassword) {
      toast({
        variant: "destructive",
        title: 'Lỗi!',
        description: 'Mật khẩu mới và mật khẩu xác nhận không khớp.',
      });
      return;
    }
    // Logic đổi mật khẩu ở đây
    toast({
      title: 'Thành công!',
      description: 'Mật khẩu của bạn đã được thay đổi.',
    });
    setPasswordFields({ currentPassword: '', newPassword: '', confirmPassword: '' });
  };

  const handleToggle2FA = (enabled) => {
    setIs2faEnabled(enabled);
    toast({
      title: 'Cài đặt đã lưu!',
      description: `Xác thực hai yếu tố (2FA) đã được ${enabled ? 'bật' : 'tắt'}.`,
    });
  };

  const handleGenerateNewApiKey = () => {
    const newApiKey = uuidv4();
    updateUser({ ...user, api_key: newApiKey });
    toast({
      title: 'Thành công!',
      description: 'Khóa API mới đã được tạo.',
    });
  };


  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-8"
    >
      <PageHeader 
        title="Tài khoản của bạn"
        description="Quản lý thông tin cá nhân và cài đặt bảo mật."
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <motion.div variants={itemVariants} className="lg:col-span-1">
          <Card className="bg-slate-900/50 border-slate-800">
            <CardHeader className="items-center text-center">
              <Avatar className="w-24 h-24 mb-4 border-4 border-slate-700">
                <AvatarImage src={`https://api.dicebear.com/7.x/bottts/svg?seed=${user.username}`} alt={user.username} />
                <AvatarFallback>{user.username.charAt(0).toUpperCase()}</AvatarFallback>
              </Avatar>
              <CardTitle className="text-2xl">{user.username}</CardTitle>
              <CardDescription>{user.email}</CardDescription>
              <Badge variant={user.role_color || 'secondary'} className="mt-2">{user.role}</Badge>
            </CardHeader>
            <CardFooter>
              <Button onClick={logout} variant="destructive" className="w-full">
                <LogOut className="mr-2 h-4 w-4" /> Đăng xuất
              </Button>
            </CardFooter>
          </Card>
        </motion.div>

        <motion.div variants={itemVariants} className="lg:col-span-2 space-y-8">
          <Card className="bg-slate-900/50 border-slate-800">
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><KeyRound /> Đổi mật khẩu</CardTitle>
              <CardDescription>Để bảo mật, hãy sử dụng mật khẩu mạnh.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="currentPassword">Mật khẩu hiện tại</Label>
                <Input id="currentPassword" type="password" value={passwordFields.currentPassword} onChange={handlePasswordInputChange} className="mt-1 bg-slate-800 border-slate-700" />
              </div>
              <div>
                <Label htmlFor="newPassword">Mật khẩu mới</Label>
                <Input id="newPassword" type="password" value={passwordFields.newPassword} onChange={handlePasswordInputChange} className="mt-1 bg-slate-800 border-slate-700" />
              </div>
              <div>
                <Label htmlFor="confirmPassword">Xác nhận mật khẩu mới</Label>
                <Input id="confirmPassword" type="password" value={passwordFields.confirmPassword} onChange={handlePasswordInputChange} className="mt-1 bg-slate-800 border-slate-700" />
              </div>
            </CardContent>
            <CardFooter>
              <Button onClick={handleChangePassword}>Lưu thay đổi</Button>
            </CardFooter>
          </Card>

          <Card className="bg-slate-900/50 border-slate-800">
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><ShieldCheck /> Bảo mật</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between p-4 bg-slate-800/50 rounded-lg">
                <div>
                  <h3 className="font-semibold">Xác thực hai yếu tố (2FA)</h3>
                  <p className="text-sm text-slate-400">Tăng cường bảo mật cho tài khoản của bạn.</p>
                </div>
                <Switch
                  checked={is2faEnabled}
                  onCheckedChange={handleToggle2FA}
                />
              </div>
              <div className="space-y-2">
                <Label>Khóa API của bạn</Label>
                <div className="flex items-center gap-2">
                  <Input
                    readOnly
                    type={showApiKey ? 'text' : 'password'}
                    value={user.api_key || 'Không có khóa API'}
                    className="font-mono bg-slate-800 border-slate-700"
                  />
                  <Button variant="ghost" size="icon" onClick={() => setShowApiKey(!showApiKey)}>
                    {showApiKey ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => handleCopy(user.api_key, 'Khóa API')}>
                    <Copy className="h-5 w-5" />
                  </Button>
                  <Button variant="ghost" size="icon" onClick={handleGenerateNewApiKey}>
                    <RefreshCw className="h-5 w-5" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </motion.div>
  );
};

export default AccountPage;