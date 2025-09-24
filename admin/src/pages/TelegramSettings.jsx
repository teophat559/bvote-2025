import React from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Save, Send, TestTube2 } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';

const itemVariants = {
  hidden: { y: 20, opacity: 0 },
  visible: { y: 0, opacity: 1 },
};

const TelegramSettings = () => {
  const { toast } = useToast();

  const handleSave = () => {
    toast({
      title: 'Lưu thành công!',
      description: 'Cài đặt Telegram Bot đã được cập nhật.',
    });
  };
  
  const handleTest = () => {
    toast({
      title: 'Đang gửi tin nhắn thử...',
      description: 'Một tin nhắn thử nghiệm đã được gửi đến Chat ID của bạn.',
    });
  };

  return (
    <motion.div
      variants={{ visible: { transition: { staggerChildren: 0.1 } } }}
      initial="hidden"
      animate="visible"
      className="space-y-6"
    >
      <motion.div variants={itemVariants}>
        <header>
          <h1 className="text-3xl font-bold tracking-tight text-slate-100">Tích hợp Telegram Bot</h1>
          <p className="text-slate-400 mt-1">Cấu hình để nhận thông báo tức thì qua Telegram.</p>
        </header>
      </motion.div>

      <motion.div variants={itemVariants}>
        <Card className="bg-slate-900/50 border-slate-700 max-w-2xl mx-auto">
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Send className="text-sky-400"/> Cấu hình Bot</CardTitle>
            <CardDescription>Nhập thông tin xác thực của bot và ID cuộc trò chuyện để bắt đầu.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 pt-6">
            <div className="space-y-2">
              <Label htmlFor="bot-token">Bot Token</Label>
              <Input
                id="bot-token"
                type="password"
                placeholder="123456:ABC-DEF1234ghIkl-zyx57W2v1u123ew11"
                className="bg-slate-800 border-slate-600 font-mono"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="chat-id">Chat ID</Label>
              <Input
                id="chat-id"
                type="text"
                placeholder="-1001234567890"
                className="bg-slate-800 border-slate-600 font-mono"
              />
            </div>
            <div className="flex flex-wrap gap-2 pt-4">
                <Button onClick={handleSave} className="bg-blue-600 hover:bg-blue-700">
                    <Save className="mr-2 h-4 w-4" /> Lưu cấu hình
                </Button>
                <Button onClick={handleTest} variant="outline">
                    <TestTube2 className="mr-2 h-4 w-4" /> Gửi thử
                </Button>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  );
};

export default TelegramSettings;