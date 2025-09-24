import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/components/ui/use-toast';
import { Send, Loader2 } from 'lucide-react';

const mockTemplates = [
  { id: 1, name: 'Chào mừng', subject: 'Chào mừng bạn đến với hệ thống!', body: 'Xin chào [USERNAME], cảm ơn bạn đã tham gia!' },
  { id: 2, name: 'Cảnh báo đăng nhập', subject: 'Cảnh báo bảo mật', body: 'Chúng tôi phát hiện một lần đăng nhập từ IP: [IP_ADDRESS]. Nếu không phải bạn, vui lòng bảo mật tài khoản.' },
  { id: 3, name: 'Thông báo hệ thống', subject: 'Thông báo bảo trì', body: 'Hệ thống sẽ được bảo trì vào lúc 3 giờ sáng. Vui lòng lưu lại công việc.' },
];

const NotificationModal = ({ isOpen, onOpenChange, user }) => {
  const [selectedTemplate, setSelectedTemplate] = useState('');
  const [messageBody, setMessageBody] = useState('');
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (selectedTemplate) {
      const template = mockTemplates.find(t => t.id.toString() === selectedTemplate);
      if (template && user) {
        let body = template.body;
        body = body.replace(/\[USERNAME\]/g, user.username);
        body = body.replace(/\[IP_ADDRESS\]/g, user.last_ip || 'N/A');
        setMessageBody(body);
      }
    } else {
      setMessageBody('');
    }
  }, [selectedTemplate, user]);

  const handleSend = async () => {
    if (!messageBody) {
      toast({ title: 'Lỗi', description: 'Nội dung thông báo không được để trống.', variant: 'destructive' });
      return;
    }
    setLoading(true);
    // Mock sending notification
    await new Promise(resolve => setTimeout(resolve, 1000));
    setLoading(false);
    toast({
      title: 'Thành công!',
      description: `Đã gửi thông báo đến ${user.username}.`,
    });
    onOpenChange(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[525px] bg-slate-900 border-slate-800 text-white">
        <DialogHeader>
          <DialogTitle>Gửi thông báo đến {user?.username}</DialogTitle>
          <DialogDescription>
            Soạn hoặc chọn mẫu để gửi thông báo nhanh cho người dùng.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div>
            <Label htmlFor="template">Chọn mẫu thông báo</Label>
            <Select onValueChange={setSelectedTemplate}>
              <SelectTrigger className="w-full mt-1 bg-slate-800 border-slate-700">
                <SelectValue placeholder="Chọn một mẫu..." />
              </SelectTrigger>
              <SelectContent className="bg-slate-800 border-slate-700 text-white">
                {mockTemplates.map(template => (
                  <SelectItem key={template.id} value={template.id.toString()}>{template.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="message-body">Nội dung thông báo</Label>
            <Textarea
              id="message-body"
              value={messageBody}
              onChange={(e) => setMessageBody(e.target.value)}
              className="mt-1 bg-slate-800 border-slate-700 min-h-[120px] font-mono"
              placeholder="Soạn nội dung ở đây..."
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>Hủy</Button>
          <Button onClick={handleSend} className="bg-purple-600 hover:bg-purple-700" disabled={loading}>
            {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
            Gửi thông báo
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default NotificationModal;