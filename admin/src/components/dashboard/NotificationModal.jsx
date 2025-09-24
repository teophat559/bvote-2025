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
import { Send } from 'lucide-react';

const NotificationModal = ({ isOpen, onOpenChange, user }) => {
  const [message, setMessage] = useState('');
  const { toast } = useToast();

  const handleSend = () => {
    if (!message.trim()) {
      toast({
        title: 'Lỗi',
        description: 'Vui lòng nhập nội dung thông báo.',
        variant: 'destructive',
      });
      return;
    }

    console.log(`Sending message to ${user?.user}: ${message}`);
    toast({
      title: 'Đã gửi thông báo!',
      description: `Đã gửi thông báo đến ${user?.user}.`,
    });
    
    // Simulate feature not fully implemented
    toast({
      title: '🚧 This feature isn\'t implemented yet—but don\'t worry! You can request it in your next prompt! 🚀',
      description: 'Đừng lo! Bạn có thể yêu cầu tính năng này trong lần tương tác tiếp theo! 🚀',
    });

    setMessage('');
    onOpenChange(false);
  };

  if (!user) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px] bg-slate-900 border-slate-800 text-white">
        <DialogHeader>
          <DialogTitle>Gửi Thông Báo</DialogTitle>
          <DialogDescription>
            Gửi một thông báo trực tiếp đến người dùng: {user.user}
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="message" className="text-right">
              Nội dung
            </Label>
            <Input
              id="message"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="col-span-3 bg-slate-800 border-slate-700"
              placeholder="Nhập nội dung thông báo..."
            />
          </div>
        </div>
        <DialogFooter>
          <Button onClick={handleSend} type="submit" className="bg-blue-600 hover:bg-blue-700">
            <Send className="mr-2 h-4 w-4" /> Gửi
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default NotificationModal;