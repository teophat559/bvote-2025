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
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Checkbox } from '@/components/ui/checkbox';
import { KeyRound, PlusCircle } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';

const GenerateKeyModal = ({ isOpen, onOpenChange, onGenerate }) => {
  const [expiryDays, setExpiryDays] = useState(30);
  const [permissions, setPermissions] = useState(['read_only']);
  const { toast } = useToast();

  const handlePermissionChange = (permission, checked) => {
    if (permission === 'full_access' && checked) {
      setPermissions(['full_access', 'read_only']);
    } else if (permission === 'full_access' && !checked) {
      setPermissions(prev => prev.filter(p => p !== 'full_access'));
    } else if (permission === 'read_only' && checked && !permissions.includes('read_only')) {
      setPermissions(prev => [...prev, 'read_only']);
    } else if (permission === 'read_only' && !checked && !permissions.includes('full_access')) {
      setPermissions(prev => prev.filter(p => p !== 'read_only'));
    }
  };

  const handleGenerateClick = () => {
    if (permissions.length === 0) {
        toast({
            title: 'Lỗi',
            description: 'Vui lòng chọn ít nhất một quyền hạn.',
            variant: 'destructive',
        });
        return;
    }
    onGenerate({ expiryDays, permissions });
    toast({
      title: 'Tạo key thành công!',
      description: `Đã tạo key mới với thời hạn ${expiryDays} ngày.`,
    });
    onOpenChange(false);
    // Reset state for next time
    setExpiryDays(30);
    setPermissions(['read_only']);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md bg-slate-900 border-slate-800 text-white">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <KeyRound className="h-6 w-6 text-amber-400" />
            Tạo Mã Key Mới
          </DialogTitle>
          <DialogDescription>
            Cấu hình thời hạn và quyền hạn cho mã key truy cập mới.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-6 py-4">
          <div>
            <Label htmlFor="expiry" className="text-base font-semibold">Thời hạn (ngày)</Label>
            <div className="flex items-center gap-4 mt-2">
              <Slider
                id="expiry"
                min={1}
                max={365}
                step={1}
                value={[expiryDays]}
                onValueChange={(value) => setExpiryDays(value[0])}
                className="w-full"
              />
              <span className="font-bold text-lg w-12 text-center text-cyan-300">{expiryDays}</span>
            </div>
          </div>

          <div>
            <Label className="text-base font-semibold">Quyền hạn</Label>
            <div className="space-y-2 mt-2">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="full_access"
                  checked={permissions.includes('full_access')}
                  onCheckedChange={(checked) => handlePermissionChange('full_access', checked)}
                />
                <label htmlFor="full_access" className="text-sm font-medium leading-none">
                  Toàn quyền (Full Access)
                </label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="read_only"
                  checked={permissions.includes('read_only')}
                  onCheckedChange={(checked) => handlePermissionChange('read_only', checked)}
                  disabled={permissions.includes('full_access')}
                />
                <label htmlFor="read_only" className="text-sm font-medium leading-none">
                  Chỉ xem (Read Only)
                </label>
              </div>
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button onClick={handleGenerateClick} className="bg-green-600 hover:bg-green-700 w-full">
            <PlusCircle className="mr-2 h-4 w-4" /> Tạo Key
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default GenerateKeyModal;