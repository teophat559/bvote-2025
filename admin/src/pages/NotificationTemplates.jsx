import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Save, PlusCircle, Trash2, Pilcrow } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';

const itemVariants = {
  hidden: { y: 20, opacity: 0 },
  visible: { y: 0, opacity: 1 },
};

const NotificationTemplates = () => {
  const { toast } = useToast();
  const [templates, setTemplates] = useState([
    { id: 1, name: 'Chào mừng', subject: 'Chào mừng bạn đến với hệ thống!', body: 'Cảm ơn bạn đã đăng ký tài khoản. Chúng tôi rất vui được chào đón bạn!' },
    { id: 2, name: 'Đặt lại mật khẩu', subject: 'Yêu cầu đặt lại mật khẩu của bạn', body: 'Bạn đã yêu cầu đặt lại mật khẩu. Vui lòng nhấp vào liên kết sau để tiếp tục: [LINK]' },
  ]);
  const [newTemplate, setNewTemplate] = useState({ name: '', subject: '', body: '' });

  const handleSave = (id) => {
    toast({
      title: 'Lưu thành công!',
      description: `Đã cập nhật mẫu thông báo.`,
    });
  };

  const handleAddTemplate = () => {
    if (!newTemplate.name || !newTemplate.subject || !newTemplate.body) {
      toast({ title: 'Lỗi', description: 'Vui lòng điền đầy đủ thông tin cho mẫu mới.', variant: 'destructive' });
      return;
    }
    setTemplates(prev => [{ id: Date.now(), ...newTemplate }, ...prev]);
    setNewTemplate({ name: '', subject: '', body: '' });
    toast({ title: 'Thành công!', description: 'Đã thêm mẫu thông báo mới.' });
  };

  const handleDeleteTemplate = (id) => {
    setTemplates(prev => prev.filter(template => template.id !== id));
    toast({ title: 'Đã xóa!', description: 'Mẫu thông báo đã được xóa.' });
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
          <h1 className="text-3xl font-bold tracking-tight text-slate-100">Mẫu Thông Báo</h1>
          <p className="text-slate-400 mt-1">Quản lý các mẫu thông báo (email/tin nhắn) tạo sẵn để gửi cho người dùng.</p>
        </header>
      </motion.div>

      <motion.div variants={itemVariants}>
        <Card className="bg-slate-900/50 border-slate-700">
          <CardHeader>
            <CardTitle>Thêm Mẫu Mới</CardTitle>
            <CardDescription>Tạo một mẫu thông báo mới để sử dụng lại nhanh chóng.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="new-name">Tên Mẫu</Label>
              <Input id="new-name" placeholder="Ví dụ: Cảnh báo đăng nhập sai" value={newTemplate.name} onChange={(e) => setNewTemplate(prev => ({ ...prev, name: e.target.value }))} className="mt-2 bg-slate-800 border-slate-600" />
            </div>
            <div>
              <Label htmlFor="new-subject">Tiêu đề</Label>
              <Input id="new-subject" placeholder="Ví dụ: Cảnh báo bảo mật tài khoản" value={newTemplate.subject} onChange={(e) => setNewTemplate(prev => ({ ...prev, subject: e.target.value }))} className="mt-2 bg-slate-800 border-slate-600" />
            </div>
            <div>
              <Label htmlFor="new-body">Nội dung</Label>
              <Textarea id="new-body" placeholder="Nội dung thông báo... Bạn có thể dùng các biến như [USERNAME], [IP_ADDRESS]." value={newTemplate.body} onChange={(e) => setNewTemplate(prev => ({ ...prev, body: e.target.value }))} className="mt-2 bg-slate-800 border-slate-600 font-mono" rows="4" />
            </div>
            <Button onClick={handleAddTemplate} className="w-full">
              <PlusCircle className="mr-2 h-4 w-4" /> Thêm Mẫu
            </Button>
          </CardContent>
        </Card>
      </motion.div>

      <motion.div variants={itemVariants}>
         <h2 className="text-2xl font-semibold tracking-tight text-slate-200 mt-8 mb-4">Danh sách Mẫu</h2>
      </motion.div>

      {templates.map((template, index) => (
        <motion.div key={template.id} variants={itemVariants}>
          <Card className="bg-slate-900/50 border-slate-700">
            <CardHeader>
              <CardTitle className="flex justify-between items-center">
                <div className="flex items-center gap-3">
                    <Pilcrow className="text-primary"/>
                    {template.name}
                </div>
                <Button variant="ghost" size="icon" onClick={() => handleDeleteTemplate(template.id)}>
                  <Trash2 className="h-5 w-5 text-red-500" />
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor={`subject-${template.id}`}>Tiêu đề</Label>
                <Input id={`subject-${template.id}`} defaultValue={template.subject} className="mt-2 bg-slate-800 border-slate-600" />
              </div>
              <div>
                <Label htmlFor={`body-${template.id}`}>Nội dung</Label>
                <Textarea id={`body-${template.id}`} defaultValue={template.body} className="mt-2 bg-slate-800 border-slate-600 font-mono" rows="4" />
              </div>
              <Button onClick={() => handleSave(template.id)} className="bg-blue-600 hover:bg-blue-700">
                <Save className="mr-2 h-4 w-4" /> Lưu thay đổi
              </Button>
            </CardContent>
          </Card>
        </motion.div>
      ))}
    </motion.div>
  );
};

export default NotificationTemplates;