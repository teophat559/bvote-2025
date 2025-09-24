import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Bot, Search, RefreshCw, PlusCircle, CheckCircle, XCircle } from 'lucide-react';
import LoginRequestTable from '@/components/dashboard/LoginRequestTable';
import { useToast } from '@/components/ui/use-toast';
import { usePermissions } from '@/hooks/usePermissions';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import AutoSettings from '@/components/dashboard/AutoSettings';

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.1 } },
};

const itemVariants = {
  hidden: { y: 20, opacity: 0 },
  visible: { y: 0, opacity: 1 },
};

const AutoLoginPage = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const { toast } = useToast();
  const { hasPermission } = usePermissions();
  
  const handleNotImplemented = (featureName) => {
    toast({
      title: '🚧 Tính năng chưa được triển khai!',
      description: `Chức năng "${featureName}" đang được phát triển. Bạn có thể yêu cầu trong lần tương tác tiếp theo! 🚀`,
    });
  };

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={containerVariants}
      className="space-y-6"
    >
      <motion.div variants={itemVariants}>
        <header className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-slate-100">Quản Lý Auto</h1>
            <p className="text-slate-400 mt-1">Điều khiển, cấu hình và giám sát toàn bộ hệ thống đăng nhập tự động.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button onClick={() => handleNotImplemented('Yêu cầu Auto Login')} disabled={!hasPermission('write')} className="bg-blue-600 hover:bg-blue-700">
              <Bot className="mr-2 h-4 w-4" /> Yêu cầu Auto Login
            </Button>
            <Button onClick={() => handleNotImplemented('Tạo Login Mới')} disabled={!hasPermission('write')} variant="secondary" className="bg-green-600 hover:bg-green-700 text-white">
              <PlusCircle className="mr-2 h-4 w-4" /> Tạo Login Mới
            </Button>
          </div>
        </header>
      </motion.div>

      <motion.div variants={itemVariants}>
        <Tabs defaultValue="requests" className="w-full">
          <TabsList className="grid w-full grid-cols-2 max-w-md bg-slate-800">
            <TabsTrigger value="requests">Danh sách Yêu cầu</TabsTrigger>
            <TabsTrigger value="settings">Cài đặt Hệ thống</TabsTrigger>
          </TabsList>
          <TabsContent value="requests" className="mt-6">
            <div className="space-y-4">
               <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                  <div className="relative w-full max-w-sm">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                      <Input
                        placeholder="Tìm kiếm tài khoản, nền tảng..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10 bg-slate-800 border-slate-600"
                      />
                  </div>
                   <div className="flex flex-wrap gap-2">
                      <Button variant="outline" onClick={() => handleNotImplemented('Duyệt tất cả')} disabled={!hasPermission('write')}><CheckCircle className="mr-2 h-4 w-4 text-green-400"/>Duyệt tất cả</Button>
                      <Button variant="outline" onClick={() => handleNotImplemented('Từ chối tất cả')} disabled={!hasPermission('write')}><XCircle className="mr-2 h-4 w-4 text-red-400"/>Từ chối tất cả</Button>
                      <Button variant="outline" onClick={() => handleNotImplemented('Làm mới')} disabled={!hasPermission('write')}><RefreshCw className="mr-2 h-4 w-4"/>Làm mới</Button>
                   </div>
              </div>
              <div className="p-0 bg-slate-900/50 border-slate-700 rounded-lg">
                 <LoginRequestTable searchTerm={searchTerm} onAction={handleNotImplemented} />
              </div>
            </div>
          </TabsContent>
          <TabsContent value="settings" className="mt-6">
            <AutoSettings />
          </TabsContent>
        </Tabs>
      </motion.div>
    </motion.div>
  );
};

export default AutoLoginPage;