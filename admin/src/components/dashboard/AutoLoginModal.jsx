import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/components/ui/use-toast';
import { Bot, Chrome, Facebook, Wifi, Instagram, Lock, CheckCircle, AlertTriangle, Info } from 'lucide-react';

const AutoLoginModal = ({ isOpen, onOpenChange, addLogEntry }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [platform, setPlatform] = useState('');
  const [chromeProfile, setChromeProfile] = useState('');
  const { toast } = useToast();

  const handleLogin = () => {
    if (!email.trim() || !password.trim() || !platform) {
      toast({
        title: 'Lỗi',
        description: 'Vui lòng nhập đầy đủ tài khoản, mật khẩu và chọn nền tảng.',
        variant: 'destructive',
      });
      return;
    }

    const platformsMap = {
      'facebook': { name: 'Facebook', icon: Facebook, color: 'text-blue-500' },
      'instagram': { name: 'Instagram', icon: Instagram, color: 'text-pink-500' },
      'google': { name: 'Google', icon: Wifi, color: 'text-red-500' },
      'khac': { name: 'Khác', icon: Wifi, color: 'text-gray-400' },
    };

    const selectedPlatformInfo = platformsMap[platform.toLowerCase()];

    toast({
      title: 'Đang khởi động bot...',
      description: 'Hệ thống đang mô phỏng quá trình đăng nhập tự động.',
    });

    setTimeout(() => {
      const isSuccess = Math.random() > 0.3; // 70% success rate
      const statusOptions = [
        { name: 'Thành công', icon: CheckCircle, color: 'text-green-400' },
        { name: 'Chờ phê duyệt', icon: AlertTriangle, color: 'text-yellow-400' },
        { name: 'Yêu cầu OTP', icon: Info, color: 'text-blue-400' },
        { name: 'Sai Mật Khẩu', icon: Lock, color: 'text-red-400' },
      ];
      const randomStatus = statusOptions[Math.floor(Math.random() * statusOptions.length)];

      const newLogEntry = {
        id: Date.now(),
        time: new Date().toISOString(),
        user: email,
        password: password,
        otp: isSuccess && randomStatus.name === 'Yêu cầu OTP' ? '123456' : 'N/A',
        ip: `192.168.1.${Math.floor(Math.random() * 255)}`,
        status: randomStatus,
        platform: selectedPlatformInfo,
        adminLink: { key: 'auto', label: 'Auto Login', adminName: 'Bot' },
        cookie: isSuccess ? `session_${Date.now()}` : 'Chờ...',
        chromeProfile: chromeProfile || 'Mặc định',
      };

      addLogEntry(newLogEntry);

      if (isSuccess) {
        toast({
          title: 'Đăng nhập tự động thành công!',
          description: `Tài khoản ${email} đã ${randomStatus.name.toLowerCase()}.`,
        });
      } else {
        toast({
          title: 'Đăng nhập tự động thất bại.',
          description: `Tài khoản ${email} đã ${randomStatus.name.toLowerCase()}.`,
          variant: 'destructive',
        });
      }

      setEmail('');
      setPassword('');
      setPlatform('');
      setChromeProfile('');
      onOpenChange(false);
    }, 2000); // Simulate bot processing time
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px] bg-slate-900 border-slate-800 text-white">
        <DialogHeader>
          <DialogTitle>Auto Login</DialogTitle>
          <DialogDescription>
            Nhập thông tin tài khoản và cấu hình bot để bắt đầu quá trình đăng nhập tự động.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="email" className="text-right">
              Tài khoản
            </Label>
            <Input
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="col-span-3 bg-slate-800 border-slate-700"
              placeholder="user@example.com"
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="password" className="text-right">
              Mật khẩu
            </Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="col-span-3 bg-slate-800 border-slate-700"
              placeholder="••••••••"
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="platform" className="text-right">
              Nền tảng
            </Label>
            <Select onValueChange={setPlatform} value={platform}>
              <SelectTrigger id="platform" className="col-span-3 bg-slate-800 border-slate-700 text-left">
                <SelectValue placeholder="Chọn nền tảng..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="facebook">Facebook</SelectItem>
                <SelectItem value="google">Google</SelectItem>
                <SelectItem value="instagram">Instagram</SelectItem>
                <SelectItem value="khac">Khác</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="chromeProfile" className="text-right">
              Chrome chỉ định
            </Label>
            <Input
              id="chromeProfile"
              value={chromeProfile}
              onChange={(e) => setChromeProfile(e.target.value)}
              className="col-span-3 bg-slate-800 border-slate-700"
              placeholder="Tên profile (tùy chọn)"
            />
          </div>
        </div>
        <DialogFooter>
          <Button onClick={handleLogin} type="submit" className="bg-blue-600 hover:bg-blue-700">
            <Bot className="mr-2 h-4 w-4" /> Bắt đầu Login
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default AutoLoginModal;