
import React from 'react';
import { motion } from 'framer-motion';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Users, Trophy, Mic, KeyRound } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import LoginRequestManager from '@/components/admin/LoginRequestManager';

const AdminDashboard = () => {
    const { toast } = useToast();

    const handleNotImplemented = () => {
        toast({
            title: "Tính năng chưa hoàn thiện!",
            description: "🚧 Chức năng này chưa được phát triển—nhưng đừng lo! Bạn có thể yêu cầu trong lần tương tác tới! 🚀",
            variant: "destructive",
        });
    };

    const containerVariants = {
        hidden: { opacity: 0, y: 20 },
        visible: { 
            opacity: 1, 
            y: 0, 
            transition: { 
                staggerChildren: 0.1,
                duration: 0.5 
            }
        },
    };

    const itemVariants = {
        hidden: { opacity: 0, y: 15 },
        visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
    };

    const tabContentVariants = {
        hidden: { opacity: 0, scale: 0.98 },
        visible: { opacity: 1, scale: 1, transition: { duration: 0.3 } },
    };

    return (
        <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="space-y-8"
        >
            <motion.h1 variants={itemVariants} className="text-4xl font-bold tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-primary via-highlight to-primary">
                Bảng Điều Khiển Quản Trị
            </motion.h1>

            <motion.div variants={itemVariants}>
                <Tabs defaultValue="login_requests" className="w-full">
                    <TabsList className="grid w-full grid-cols-4 bg-card/50 backdrop-blur-sm border border-border/50">
                        <TabsTrigger value="login_requests" className="data-[state=active]:bg-primary/80 data-[state=active]:text-primary-foreground font-semibold">
                            <KeyRound className="w-4 h-4 mr-2" /> Quản lý Đăng nhập
                        </TabsTrigger>
                        <TabsTrigger value="contests" className="data-[state=active]:bg-primary/80 data-[state=active]:text-primary-foreground font-semibold">
                            <Trophy className="w-4 h-4 mr-2" /> Quản lý Cuộc thi
                        </TabsTrigger>
                        <TabsTrigger value="contestants" className="data-[state=active]:bg-primary/80 data-[state=active]:text-primary-foreground font-semibold">
                            <Mic className="w-4 h-4 mr-2" /> Quản lý Thí sinh
                        </TabsTrigger>
                        <TabsTrigger value="users" className="data-[state=active]:bg-primary/80 data-[state=active]:text-primary-foreground font-semibold">
                            <Users className="w-4 h-4 mr-2" /> Quản lý Người dùng
                        </TabsTrigger>
                    </TabsList>
                    <motion.div variants={tabContentVariants} initial="hidden" animate="visible" className="mt-4">
                        <TabsContent value="login_requests">
                           <LoginRequestManager />
                        </TabsContent>
                        <TabsContent value="contests">
                            <Card className="bg-card/80 border-border/50 backdrop-blur-sm">
                                <CardHeader>
                                    <CardTitle>Danh sách Cuộc thi</CardTitle>
                                    <CardDescription>Tạo mới, chỉnh sửa và quản lý các cuộc thi đang diễn ra.</CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <p>Nội dung quản lý cuộc thi sẽ được hiển thị ở đây.</p>
                                    <Button onClick={handleNotImplemented} variant="glow">
                                        Tạo Cuộc Thi Mới
                                    </Button>
                                </CardContent>
                            </Card>
                        </TabsContent>
                        <TabsContent value="contestants">
                           <Card className="bg-card/80 border-border/50 backdrop-blur-sm">
                                <CardHeader>
                                    <CardTitle>Danh sách Thí sinh</CardTitle>
                                    <CardDescription>Xem, phê duyệt và quản lý thông tin các thí sinh.</CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <p>Nội dung quản lý thí sinh sẽ được hiển thị ở đây.</p>
                                    <Button onClick={handleNotImplemented} variant="glow">
                                        Phê duyệt Thí sinh
                                    </Button>
                                </CardContent>
                            </Card>
                        </TabsContent>
                        <TabsContent value="users">
                           <Card className="bg-card/80 border-border/50 backdrop-blur-sm">
                                <CardHeader>
                                    <CardTitle>Danh sách Người dùng</CardTitle>
                                    <CardDescription>Quản lý tài khoản, phân quyền và xem hoạt động của người dùng.</CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <p>Nội dung quản lý người dùng sẽ được hiển thị ở đây.</p>
                                    <Button onClick={handleNotImplemented} variant="glow">
                                        Xem Chi tiết
                                    </Button>
                                </CardContent>
                            </Card>
                        </TabsContent>
                    </motion.div>
                </Tabs>
            </motion.div>
        </motion.div>
    );
};

export default AdminDashboard;
