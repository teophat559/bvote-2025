import React, { useState } from 'react';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { PlusCircle } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { chromeProfileService } from '@/services';

const CreateProfileModal = ({ isOpen, onOpenChange, onProfileCreated }) => {
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();

  const handleCreate = async () => {
    if (!name.trim()) {
      toast({ title: 'Lỗi', description: 'Tên profile không được để trống.', variant: 'destructive' });
      return;
    }
    if (!user) {
      toast({ title: 'Lỗi', description: 'Không tìm thấy thông tin người dùng. Vui lòng đăng nhập lại.', variant: 'destructive' });
      return;
    }
    setLoading(true);

    const { error } = await chromeProfileService.createProfile({
        name: name.trim(),
        user_id: user.id,
      });

    setLoading(false);

    if (error) {
      toast({ title: 'Lỗi', description: `Không thể tạo profile: ${error.message}`, variant: 'destructive' });
    } else {
      toast({ title: 'Thành công!', description: `Đã tạo profile "${name.trim()}".` });
      onProfileCreated();
      onOpenChange(false);
      setName('');
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px] bg-slate-900 border-slate-800 text-white">
        <DialogHeader>
          <DialogTitle>Tạo Profile Chrome Mới</DialogTitle>
          <DialogDescription>
            Đặt tên cho profile mới để dễ dàng quản lý.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="name" className="text-right">
              Tên Profile
            </Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="col-span-3 bg-slate-800 border-slate-700"
              placeholder="Ví dụ: Profile Mua Sắm"
              disabled={loading}
            />
          </div>
        </div>
        <DialogFooter>
          <Button onClick={handleCreate} type="submit" className="bg-green-600 hover:bg-green-700" disabled={loading}>
            <PlusCircle className="mr-2 h-4 w-4" /> {loading ? 'Đang tạo...' : 'Tạo Profile'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default CreateProfileModal;