import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';
import { Badge } from '../components/ui/badge';
import { Bot, Play, Pause, Settings, Eye, Trash2, Plus, CheckCircle, XCircle, Clock } from 'lucide-react';
import { useToast } from '../components/ui/use-toast';

const AutoLoginManagement = ({ searchTerm }) => {
    const [autoLoginTasks, setAutoLoginTasks] = useState([
        {
            id: 1,
            taskName: 'Facebook Auto Login #1',
            platform: 'Facebook',
            account: 'user1@example.com',
            status: 'Running',
            lastRun: '2025-09-06 07:20:15',
            success: 142,
            failed: 8,
            profile: 'Profile FB 01'
        },
        {
            id: 2,
            taskName: 'Instagram Auto Login #1',
            platform: 'Instagram',
            account: 'user2@gmail.com',
            status: 'Paused',
            lastRun: '2025-09-06 06:45:30',
            success: 89,
            failed: 3,
            profile: 'Profile IG 01'
        },
        {
            id: 3,
            taskName: 'Twitter Auto Login #1',
            platform: 'Twitter',
            account: 'user3@yahoo.com',
            status: 'Stopped',
            lastRun: '2025-09-06 05:30:45',
            success: 67,
            failed: 12,
            profile: 'Profile TW 01'
        }
    ]);

    const { toast } = useToast();

    const handleTaskAction = (action, taskId, taskName) => {
        toast({
            title: `${action} Task`,
            description: `Đã thực hiện ${action} cho "${taskName}"`,
        });
    };

    const filteredTasks = autoLoginTasks.filter(task =>
        task.taskName.toLowerCase().includes(searchTerm?.toLowerCase() || '') ||
        task.platform.toLowerCase().includes(searchTerm?.toLowerCase() || '') ||
        task.account.toLowerCase().includes(searchTerm?.toLowerCase() || '')
    );

    const getStatusBadge = (status) => {
        switch (status) {
            case 'Running':
                return <Badge className="bg-green-100 text-green-800 animate-pulse">Running</Badge>;
            case 'Paused':
                return <Badge className="bg-yellow-100 text-yellow-800">Paused</Badge>;
            case 'Stopped':
                return <Badge className="bg-red-100 text-red-800">Stopped</Badge>;
            default:
                return <Badge variant="secondary">{status}</Badge>;
        }
    };

    return (
        <div className="space-y-6">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center justify-between"
            >
                <h1 className="text-3xl font-bold">Quản Lý Auto Login</h1>
                <Button className="bg-gradient-to-r from-blue-500 to-blue-600 text-white">
                    <Plus className="mr-2 h-4 w-4" />
                    Tạo Task Mới
                </Button>
            </motion.div>

            {/* Statistics Cards */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="grid grid-cols-1 md:grid-cols-4 gap-4"
            >
                <Card className="bg-gradient-to-r from-green-900/90 to-emerald-900/90 border-green-700">
                    <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-green-200 text-sm">Đang chạy</p>
                                <p className="text-2xl font-bold text-white">1</p>
                            </div>
                            <Play className="h-8 w-8 text-green-400" />
                        </div>
                    </CardContent>
                </Card>
                <Card className="bg-gradient-to-r from-yellow-900/90 to-amber-900/90 border-yellow-700">
                    <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-yellow-200 text-sm">Tạm dừng</p>
                                <p className="text-2xl font-bold text-white">1</p>
                            </div>
                            <Pause className="h-8 w-8 text-yellow-400" />
                        </div>
                    </CardContent>
                </Card>
                <Card className="bg-gradient-to-r from-red-900/90 to-rose-900/90 border-red-700">
                    <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-red-200 text-sm">Dừng</p>
                                <p className="text-2xl font-bold text-white">1</p>
                            </div>
                            <XCircle className="h-8 w-8 text-red-400" />
                        </div>
                    </CardContent>
                </Card>
                <Card className="bg-gradient-to-r from-blue-900/90 to-indigo-900/90 border-blue-700">
                    <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-blue-200 text-sm">Tổng task</p>
                                <p className="text-2xl font-bold text-white">3</p>
                            </div>
                            <Bot className="h-8 w-8 text-blue-400" />
                        </div>
                    </CardContent>
                </Card>
            </motion.div>

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
            >
                <Card className="bg-gradient-to-br from-slate-900/90 to-slate-800/90 border-slate-700 shadow-2xl">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-xl font-bold text-white">
                            <Bot className="h-6 w-6 text-blue-400" />
                            Danh Sách Auto Login Tasks
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="overflow-x-auto">
                            <Table>
                                <TableHeader>
                                    <TableRow className="border-slate-700 hover:bg-slate-800/50">
                                        <TableHead className="text-slate-300 font-semibold">Tên Task</TableHead>
                                        <TableHead className="text-slate-300 font-semibold">Platform</TableHead>
                                        <TableHead className="text-slate-300 font-semibold">Tài Khoản</TableHead>
                                        <TableHead className="text-slate-300 font-semibold">Trạng Thái</TableHead>
                                        <TableHead className="text-slate-300 font-semibold">Lần Chạy Cuối</TableHead>
                                        <TableHead className="text-slate-300 font-semibold">Thành Công</TableHead>
                                        <TableHead className="text-slate-300 font-semibold">Thất Bại</TableHead>
                                        <TableHead className="text-slate-300 font-semibold">Profile</TableHead>
                                        <TableHead className="text-slate-300 font-semibold">Hành Động</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {filteredTasks.map((task) => (
                                        <TableRow key={task.id} className="border-slate-700 hover:bg-slate-800/30 transition-colors">
                                            <TableCell className="text-slate-300 font-medium">
                                                {task.taskName}
                                            </TableCell>
                                            <TableCell className="text-slate-300">
                                                <Badge variant="outline" className="border-blue-500 text-blue-400">
                                                    {task.platform}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="text-slate-300 font-mono text-sm">
                                                {task.account}
                                            </TableCell>
                                            <TableCell className="text-slate-300">
                                                {getStatusBadge(task.status)}
                                            </TableCell>
                                            <TableCell className="text-slate-300 font-mono text-sm">
                                                {task.lastRun}
                                            </TableCell>
                                            <TableCell className="text-slate-300">
                                                <div className="flex items-center gap-1">
                                                    <CheckCircle className="h-4 w-4 text-green-400" />
                                                    <span className="font-bold text-green-400">{task.success}</span>
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-slate-300">
                                                <div className="flex items-center gap-1">
                                                    <XCircle className="h-4 w-4 text-red-400" />
                                                    <span className="font-bold text-red-400">{task.failed}</span>
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-slate-300">
                                                <Badge variant="outline" className="border-purple-500 text-purple-400">
                                                    {task.profile}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="text-slate-300">
                                                <div className="flex gap-1">
                                                    {task.status !== 'Running' && (
                                                        <Button 
                                                            size="sm" 
                                                            variant="ghost" 
                                                            className="h-8 px-2 text-green-400 hover:bg-green-500/10"
                                                            onClick={() => handleTaskAction('Start', task.id, task.taskName)}
                                                        >
                                                            <Play className="h-3 w-3" />
                                                        </Button>
                                                    )}
                                                    {task.status === 'Running' && (
                                                        <Button 
                                                            size="sm" 
                                                            variant="ghost" 
                                                            className="h-8 px-2 text-yellow-400 hover:bg-yellow-500/10"
                                                            onClick={() => handleTaskAction('Pause', task.id, task.taskName)}
                                                        >
                                                            <Pause className="h-3 w-3" />
                                                        </Button>
                                                    )}
                                                    <Button 
                                                        size="sm" 
                                                        variant="ghost" 
                                                        className="h-8 px-2 text-blue-400 hover:bg-blue-500/10"
                                                        onClick={() => handleTaskAction('View', task.id, task.taskName)}
                                                    >
                                                        <Eye className="h-3 w-3" />
                                                    </Button>
                                                    <Button 
                                                        size="sm" 
                                                        variant="ghost" 
                                                        className="h-8 px-2 text-gray-400 hover:bg-gray-500/10"
                                                        onClick={() => handleTaskAction('Settings', task.id, task.taskName)}
                                                    >
                                                        <Settings className="h-3 w-3" />
                                                    </Button>
                                                    <Button 
                                                        size="sm" 
                                                        variant="ghost" 
                                                        className="h-8 px-2 text-red-400 hover:bg-red-500/10"
                                                        onClick={() => handleTaskAction('Delete', task.id, task.taskName)}
                                                    >
                                                        <Trash2 className="h-3 w-3" />
                                                    </Button>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                    </CardContent>
                </Card>
            </motion.div>
        </div>
    );
};

export default AutoLoginManagement;
