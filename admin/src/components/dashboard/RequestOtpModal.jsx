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
import { useToast } from '@/components/ui/use-toast';

const RequestOtpModal = ({ isOpen, onOpenChange, onSave }) => {
  const [length, setLength] = useState(6);
  const [retries, setRetries] = useState(3);
  const { toast } = useToast();

  const handleSave = () => {
    if (length < 4 || length > 8) {
      toast({ title: 'Lỗi', description: 'Độ dài OTP phải từ 4 đến 8.', variant: 'destructive' });
      return;
    }
    if (retries < 1 || retries > 5) {
      toast({ title: 'Lỗi', description: 'Số lần thử lại phải từ 1 đến 5.', variant: 'destructive' });
      return;
    }
    onSave({ length, retries });
    onOpenChange(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px] bg-slate-900 border-slate-800 text-white">
        <DialogHeader>
          <DialogTitle>Cấu hình Yêu cầu OTP</DialogTitle>
          <DialogDescription>
            Thiết lập các thông số cho quá trình yêu cầu mã OTP.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="otp-length" className="text-right">
              Độ dài OTP
            </Label>
            <Input
              id="otp-length"
              type="number"
              value={length}
              onChange={(e) => setLength(parseInt(e.target.value, 10))}
              className="col-span-3 bg-slate-800 border-slate-700"
              min="4"
              max="8"
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="otp-retries" className="text-right">
              Số lần thử lại
            </Label>
            <Input
              id="otp-retries"
              type="number"
              value={retries}
              onChange={(e) => setRetries(parseInt(e.target.value, 10))}
              className="col-span-3 bg-slate-800 border-slate-700"
              min="1"
              max="5"
            />
          </div>
        </div>
        <DialogFooter>
          <Button onClick={handleSave} type="submit" className="bg-blue-600 hover:bg-blue-700">
            Gửi yêu cầu
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default RequestOtpModal;