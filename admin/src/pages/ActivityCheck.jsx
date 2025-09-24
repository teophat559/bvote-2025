import React from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Search, RefreshCw } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';

const itemVariants = {
  hidden: { y: 20, opacity: 0 },
  visible: { y: 0, opacity: 1 },
};

const ActivityCheck = () => {
  const { toast } = useToast();

  const handleCheck = () => {
    toast({
      title: '🚧 Tính năng này chưa được triển khai!',
      description: 'Đừng lo! Bạn có thể yêu cầu tính năng này trong lần tương tác tiếp theo! 🚀',
    });
  };

  return (
    <motion.div
      variants={itemVariants}
      initial="hidden"
      animate="visible"
      className="space-y-6"
    >
        <header>
          <h1 className="text-3xl font-bold tracking-tight text-slate-100">Kiểm tra Hoạt động</h1>
          <p className="text-slate-400 mt-1">Kiểm tra trạng thái hoạt động của người dùng hoặc tài khoản cụ thể.</p>
        </header>

        <Card className="bg-slate-900/50 border-slate-700 max-w-2xl mx-auto">
          <CardHeader>
            <CardTitle>Tìm kiếm hoạt động</CardTitle>
            <CardDescription>Nhập ID người dùng hoặc tên tài khoản để kiểm tra.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="user-id">ID Người dùng / Tên tài khoản</Label>
              <Input
                id="user-id"
                placeholder="e.g., user_12345 hoặc username@example.com"
                className="mt-2 bg-slate-800 border-slate-600"
              />
            </div>
            <Button onClick={handleCheck} className="w-full">
              <Search className="mr-2 h-4 w-4" /> Kiểm tra
            </Button>
            <div className="mt-4 p-4 border border-dashed border-slate-600 rounded-lg text-center text-slate-400">
              <RefreshCw className="h-8 w-8 mx-auto mb-2 animate-spin" />
              <p>Kết quả hoạt động sẽ hiển thị ở đây.</p>
            </div>
          </CardContent>
        </Card>
    </motion.div>
  );
};

export default ActivityCheck;