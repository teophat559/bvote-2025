import React from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Save } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';

const itemVariants = {
  hidden: { y: 20, opacity: 0 },
  visible: { y: 0, opacity: 1 },
};

const GeneralSettings = () => {
  const { toast } = useToast();

  const handleSave = () => {
    toast({
      title: 'Lưu thành công!',
      description: 'Cài đặt chung đã được cập nhật.',
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
          <h1 className="text-3xl font-bold tracking-tight text-slate-100">Cài đặt chung</h1>
          <p className="text-slate-400 mt-1">Quản lý các cài đặt cơ bản của hệ thống.</p>
        </header>

        <Card className="bg-slate-900/50 border-slate-700">
          <CardHeader>
            <CardTitle>Thông tin hệ thống</CardTitle>
            <CardDescription>Cập nhật tên và mô tả của ứng dụng.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="app-name">Tên ứng dụng</Label>
              <Input id="app-name" defaultValue={import.meta.env.VITE_APP_NAME} className="mt-2 bg-slate-800 border-slate-600" />
            </div>
            <div>
              <Label htmlFor="app-description">Mô tả ứng dụng</Label>
              <Input id="app-description" defaultValue="Hệ thống quản lý vote và người dùng." className="mt-2 bg-slate-800 border-slate-600" />
            </div>
            <Button onClick={handleSave} className="bg-blue-600 hover:bg-blue-700">
              <Save className="mr-2 h-4 w-4" /> Lưu
            </Button>
          </CardContent>
        </Card>
    </motion.div>
  );
};

export default GeneralSettings;