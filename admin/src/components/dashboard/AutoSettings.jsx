import React from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Save, Bot } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';

const itemVariants = {
  hidden: { y: 20, opacity: 0 },
  visible: { y: 0, opacity: 1 },
};

const AutoSettings = () => {
  const { toast } = useToast();
  const [concurrency, setConcurrency] = React.useState(5);
  const [delay, setDelay] = React.useState(10);
  const [isAutoEnabled, setIsAutoEnabled] = React.useState(true);

  const handleSave = () => {
    toast({
      title: 'Lưu thành công!',
      description: 'Cài đặt Auto Login đã được cập nhật.',
    });
  };

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={{ visible: { transition: { staggerChildren: 0.1 } } }}
      className="space-y-6"
    >
      <motion.div variants={itemVariants}>
        <Card className="bg-slate-900/50 border-slate-700 backdrop-blur-sm">
          <CardHeader>
            <CardTitle>Trạng thái hệ thống</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between p-4 rounded-lg bg-slate-800/50">
                <div className="flex items-center">
                  <Bot className={`mr-3 h-5 w-5 ${isAutoEnabled ? 'text-green-400' : 'text-red-400'}`} />
                  <div>
                    <Label htmlFor="auto-login-toggle" className="cursor-pointer">Hệ thống Auto Login</Label>
                    <p className="text-xs text-slate-400">Bật hoặc tắt toàn bộ chức năng đăng nhập tự động.</p>
                  </div>
                </div>
                <Switch id="auto-login-toggle" checked={isAutoEnabled} onCheckedChange={setIsAutoEnabled} />
              </div>
          </CardContent>
        </Card>
      </motion.div>

      <motion.div variants={itemVariants}>
        <Card className="bg-slate-900/50 border-slate-700 backdrop-blur-sm">
          <CardHeader>
            <CardTitle>Cấu hình hành vi Bot</CardTitle>
            <CardDescription>Điều chỉnh các thông số để tối ưu hiệu suất của bot.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-8 pt-6">
            <div>
              <Label htmlFor="concurrency" className="text-base font-semibold">Số luồng chạy song song</Label>
              <div className="flex items-center gap-4 mt-2">
                <Slider
                  id="concurrency"
                  min={1}
                  max={20}
                  step={1}
                  value={[concurrency]}
                  onValueChange={(value) => setConcurrency(value[0])}
                  className="w-full"
                />
                <span className="font-bold text-lg w-12 text-center text-cyan-300">{concurrency}</span>
              </div>
            </div>
            <div>
              <Label htmlFor="delay" className="text-base font-semibold">Độ trễ giữa các hành động (giây)</Label>
              <div className="flex items-center gap-4 mt-2">
                <Slider
                  id="delay"
                  min={1}
                  max={60}
                  step={1}
                  value={[delay]}
                  onValueChange={(value) => setDelay(value[0])}
                  className="w-full"
                />
                <span className="font-bold text-lg w-12 text-center text-cyan-300">{delay}</span>
              </div>
            </div>
            <Button onClick={handleSave} className="bg-blue-600 hover:bg-blue-700">
              <Save className="mr-2 h-4 w-4" /> Lưu cấu hình
            </Button>
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  );
};

export default AutoSettings;