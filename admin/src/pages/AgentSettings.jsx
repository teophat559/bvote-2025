import React from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Save, RefreshCw } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';

const itemVariants = {
  hidden: { y: 20, opacity: 0 },
  visible: { y: 0, opacity: 1 },
};

const AgentSettings = () => {
  const { toast } = useToast();
  const [userAgent, setUserAgent] = React.useState("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36");

  const handleSave = () => {
    toast({
      title: 'Lưu thành công!',
      description: 'Cài đặt Agent đã được cập nhật.',
    });
  };
  
  const handleRandomize = () => {
    // This is a mock function to generate a random user agent
    const platforms = ['Windows NT 10.0; Win64; x64', 'Macintosh; Intel Mac OS X 10_15_7', 'X11; Linux x86_64'];
    const chromeVersion = `Chrome/${Math.floor(Math.random() * 10) + 115}.0.0.0`;
    const newAgent = `Mozilla/5.0 (${platforms[Math.floor(Math.random() * platforms.length)]}) AppleWebKit/537.36 (KHTML, like Gecko) ${chromeVersion} Safari/537.36`;
    setUserAgent(newAgent);
    toast({
        title: 'Đã tạo User Agent mới!',
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
            <h1 className="text-3xl font-bold tracking-tight text-slate-100">Cấu hình Chrome</h1>
            <p className="text-slate-400 mt-1">Quản lý các cài đặt liên quan đến Chrome Agent và môi trường.</p>
            </header>
        </motion.div>

        <motion.div variants={itemVariants}>
            <Card className="bg-slate-900/50 border-slate-700">
            <CardHeader>
                <CardTitle>Cấu hình User Agent</CardTitle>
                <CardDescription>Thiết lập User Agent mặc định cho các phiên Chrome để giả lập môi trường duyệt web.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <div>
                <Label htmlFor="user-agent">User Agent String</Label>
                <Input
                    id="user-agent"
                    placeholder="Mozilla/5.0 (Windows NT 10.0; Win64; x64)..."
                    className="mt-2 bg-slate-800 border-slate-600 font-mono text-xs"
                    value={userAgent}
                    onChange={(e) => setUserAgent(e.target.value)}
                />
                </div>
                <div className="flex flex-wrap gap-2">
                    <Button onClick={handleRandomize} variant="outline">
                        <RefreshCw className="mr-2 h-4 w-4"/> Tạo ngẫu nhiên
                    </Button>
                    <Button onClick={handleSave} className="bg-blue-600 hover:bg-blue-700">
                    <Save className="mr-2 h-4 w-4" /> Lưu
                    </Button>
                </div>
            </CardContent>
            </Card>
        </motion.div>
    </motion.div>
  );
};

export default AgentSettings;