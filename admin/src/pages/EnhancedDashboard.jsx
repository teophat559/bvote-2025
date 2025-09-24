import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from '@/components/ui/input';
import { Search, LayoutGrid, History, Settings, Bot } from 'lucide-react';
import AccessHistoryTable from '@/components/dashboard/AccessHistoryTable';
import { useToast } from '@/components/ui/use-toast';

const itemVariants = {
  hidden: { y: 20, opacity: 0 },
  visible: { y: 0, opacity: 1 },
};

const NotImplementedContent = ({ title }) => {
    return (
        <div className="flex flex-col items-center justify-center h-96 text-muted-foreground">
            <Bot size={48} className="mb-4" />
            <h2 className="text-xl font-semibold">Tính năng "{title}"</h2>
            <p>Hiện đang được phát triển và sẽ sớm ra mắt!</p>
        </div>
    );
};

const EnhancedDashboard = () => {
    const [historySearchTerm, setHistorySearchTerm] = useState('');
    const { toast } = useToast();
    
    const handleNotImplemented = () => {
        toast({
          title: '🚧 Tính năng này chưa được triển khai!',
          description: 'Đừng lo! Bạn có thể yêu cầu tính năng này trong lần tương tác tiếp theo! 🚀',
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
                <header>
                    <h1 className="text-3xl font-bold tracking-tight text-foreground">Enhanced Dashboard</h1>
                    <p className="text-muted-foreground mt-1">Bảng điều khiển toàn diện với đầy đủ tính năng quản lý auto login</p>
                </header>
            </motion.div>

            <motion.div variants={itemVariants}>
                <Tabs defaultValue="access-history" className="w-full">
                    <TabsList className="grid w-full grid-cols-4 bg-background">
                        <TabsTrigger value="dashboard" onClick={handleNotImplemented}><LayoutGrid className="mr-2 h-4 w-4" /> Bảng Điều Khiển</TabsTrigger>
                        <TabsTrigger value="access-history"><History className="mr-2 h-4 w-4" /> Lịch Sử Truy Cập</TabsTrigger>
                        <TabsTrigger value="auto-management" onClick={handleNotImplemented}><Bot className="mr-2 h-4 w-4" /> Quản Lý Auto</TabsTrigger>
                        <TabsTrigger value="config" onClick={handleNotImplemented}><Settings className="mr-2 h-4 w-4" /> Cấu Hình</TabsTrigger>
                    </TabsList>
                    <TabsContent value="dashboard">
                        <NotImplementedContent title="Bảng Điều Khiển" />
                    </TabsContent>
                    <TabsContent value="access-history">
                        <Card className="bg-card border-border">
                            <CardHeader>
                                <div className="flex items-center justify-between">
                                    <CardTitle className="flex items-center gap-2">
                                        <History className="text-primary"/>
                                        Lịch Sử Truy Cập
                                    </CardTitle>
                                    <div className="relative w-full max-w-xs">
                                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                        <Input
                                            placeholder="Tìm kiếm lịch sử..."
                                            value={historySearchTerm}
                                            onChange={(e) => setHistorySearchTerm(e.target.value)}
                                            className="pl-10 bg-input border-border focus:bg-background h-9"
                                        />
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent>
                                <AccessHistoryTable searchTerm={historySearchTerm} />
                            </CardContent>
                        </Card>
                    </TabsContent>
                     <TabsContent value="auto-management">
                        <NotImplementedContent title="Quản Lý Auto" />
                    </TabsContent>
                    <TabsContent value="config">
                        <NotImplementedContent title="Cấu Hình" />
                    </TabsContent>
                </Tabs>
            </motion.div>
        </motion.div>
    );
};

export default EnhancedDashboard;