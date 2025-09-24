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
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/components/ui/use-toast';
import { Send } from 'lucide-react';

const requestTypes = [
    { value: 'RETRY_PASSWORD', label: 'Mật khẩu sai, nhập lại mật khẩu' },
    { value: 'INVALID_ACCOUNT', label: 'Tài khoản không hợp lệ, nhập tài khoản khác' },
    { value: 'OTP_EXPIRED', label: 'OTP hết hạn, nhập OTP mới' },
    { value: 'FACEBOOK_APPROVAL', label: 'Yêu cầu phê duyệt ở thông báo app Facebook' },
];

const CreateRequestModal = ({ isOpen, onOpenChange, request }) => {
  const [requestType, setRequestType] = useState('');
  const [details, setDetails] = useState('');
  const { toast } = useToast();

  const handleSubmit = () => {
    if (!requestType) {
      toast({
        title: 'Lỗi',
        description: 'Vui lòng chọn một loại yêu cầu.',
        variant: 'destructive',
      });
      return;
    }

    toast({
      title: 'Đã tạo yêu cầu thành công!',
      description: `Yêu cầu "${requestTypes.find(rt => rt.value === requestType)?.label}" đã được gửi cho tài khoản ${request?.account}.`,
    });
    
    // Simulate feature not fully implemented
     toast({
      title: '🚧 This feature isn\'t implemented yet—but don\'t worry! You can request it in your next prompt! 🚀',
      description: 'Đừng lo! Bạn có thể yêu cầu tính năng này trong lần tương tác tiếp theo! 🚀',
    });

    setRequestType('');
    setDetails('');
    onOpenChange(false);
  };

  if (!request) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] bg-slate-900 border-slate-800 text-white">
        <DialogHeader>
          <DialogTitle>Tạo Yêu Cầu</DialogTitle>
          <DialogDescription>
            Tạo một yêu cầu xử lý mới cho tài khoản: <span className="font-bold text-cyan-400">{request.account}</span>
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="request-type" className="text-right">
              Loại yêu cầu
            </Label>
            <Select onValueChange={setRequestType} value={requestType}>
              <SelectTrigger id="request-type" className="col-span-3 bg-slate-800 border-slate-700 text-left">
                <SelectValue placeholder="Chọn loại yêu cầu..." />
              </SelectTrigger>
              <SelectContent>
                {requestTypes.map(rt => (
                    <SelectItem key={rt.value} value={rt.value}>{rt.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-4 items-start gap-4">
            <Label htmlFor="details" className="text-right pt-2">
                Chi tiết
            </Label>
            <Textarea 
                id="details"
                value={details}
                onChange={(e) => setDetails(e.target.value)}
                className="col-span-3 bg-slate-800 border-slate-700"
                placeholder="Nhập thêm chi tiết nếu cần (VD: mật khẩu mới, OTP...)"
                rows={3}
            />
          </div>
        </div>
        <DialogFooter>
          <Button onClick={handleSubmit} type="submit" className="bg-blue-600 hover:bg-blue-700">
            <Send className="mr-2 h-4 w-4" /> Gửi Yêu Cầu
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default CreateRequestModal;