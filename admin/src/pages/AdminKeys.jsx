import React, { useState, useEffect, useCallback } from 'react';
    import { motion, AnimatePresence } from 'framer-motion';
    import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
    import { Button } from '@/components/ui/button';
    import { Input } from '@/components/ui/input';
    import { Label } from '@/components/ui/label';
    import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
    import { Badge } from '@/components/ui/badge';
    import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
    import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
    import { TooltipProvider, Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';
    import { Skeleton } from '@/components/ui/skeleton';
    import { PlusCircle, Trash2, Key, RefreshCw, Loader2, Copy, Check, ShieldAlert, Eye, Database, Lock, Clock, Users, Info, X } from 'lucide-react';
    import { useToast } from '@/components/ui/use-toast';
    import { adminKeyService } from '@/services/adminKeyService';
    import { formatDistanceToNow } from 'date-fns';
    import { vi } from 'date-fns/locale';
    import NewKeyModal from '@/components/dashboard/NewKeyModal';
    import ViewKeyModal from '@/components/dashboard/ViewKeyModal';
    
    const containerVariants = {
      hidden: { opacity: 0 },
      visible: { opacity: 1, transition: { staggerChildren: 0.1 } },
    };
    
    const itemVariants = {
      hidden: { y: 20, opacity: 0 },
      visible: { y: 0, opacity: 1, transition: { type: "spring", stiffness: 100 } },
    };
    
    const KeyFormModal = ({ isOpen, onOpenChange, onKeyCreated }) => {
        const [keyName, setKeyName] = useState('');
        const [loading, setLoading] = useState(false);
        const { toast } = useToast();
    
        const handleCreate = async () => {
            if (!keyName.trim()) {
                toast({ title: "Tên không hợp lệ", description: "Vui lòng nhập tên cho khóa.", variant: "destructive" });
                return;
            }
            setLoading(true);
            try {
                const newKey = await adminKeyService.createAdminKey({ name: keyName });
                toast({ title: "Thành công!", description: `Đã tạo khóa admin mới "${keyName}".`, variant: "success" });
                onKeyCreated(newKey);
                onOpenChange(false);
            } catch (error) {
                toast({ title: "Lỗi", description: `Không thể tạo khóa: ${error.message}`, variant: "destructive" });
            } finally {
                setLoading(false);
                setKeyName('');
            }
        };
    
        return (
            <Dialog open={isOpen} onOpenChange={onOpenChange}>
                <DialogContent className="sm:max-w-md bg-slate-900 border-slate-700 text-white">
                    <DialogHeader>
                        <DialogTitle>Tạo Khóa Truy Cập Mới</DialogTitle>
                        <DialogDescription>Đặt một tên gợi nhớ cho khóa để dễ dàng quản lý.</DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <Label htmlFor="key-name">Tên Khóa</Label>
                        <Input id="key-name" value={keyName} onChange={(e) => setKeyName(e.target.value)} placeholder="Ví dụ: Máy chủ Production" className="bg-slate-800 border-slate-600 focus:ring-blue-500"/>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => onOpenChange(false)}>Hủy</Button>
                        <Button onClick={handleCreate} disabled={loading || !keyName.trim()} className="bg-blue-600 hover:bg-blue-700">
                            {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <PlusCircle className="mr-2 h-4 w-4" />}
                            Tạo Khóa
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        );
    };
    
    const TableSkeleton = () => (
        Array.from({ length: 3 }).map((_, index) => (
            <TableRow key={index} className="border-b-0">
                <TableCell><Skeleton className="h-6 w-3/4 bg-slate-700" /></TableCell>
                <TableCell><Skeleton className="h-6 w-1/2 bg-slate-700" /></TableCell>
                <TableCell><Skeleton className="h-6 w-full bg-slate-700" /></TableCell>
                <TableCell><Skeleton className="h-6 w-3/4 bg-slate-700" /></TableCell>
                <TableCell><Skeleton className="h-8 w-24 bg-slate-700" /></TableCell>
                <TableCell className="text-right space-x-2">
                    <Skeleton className="h-9 w-9 inline-block bg-slate-700 rounded-md" />
                    <Skeleton className="h-9 w-24 inline-block bg-slate-700 rounded-md" />
                    <Skeleton className="h-9 w-24 inline-block bg-slate-700 rounded-md" />
                </TableCell>
            </TableRow>
        ))
    );
    
    const PermissionIcon = ({ permission }) => {
        switch (permission) {
            case 'full_access':
                return <Lock className="h-4 w-4 text-red-400" />;
            case 'read:logs':
                return <Database className="h-4 w-4 text-blue-400" />;
            case 'read:users':
                return <Users className="h-4 w-4 text-green-400" />;
            default:
                return <Key className="h-4 w-4 text-slate-500" />;
        }
    };
    
    const AdminKeysPage = () => {
        const [keys, setKeys] = useState([]);
        const [loading, setLoading] = useState(true);
        const [isFormModalOpen, setIsFormModalOpen] = useState(false);
        const [isAlertOpen, setIsAlertOpen] = useState(false);
        const [isNewKeyModalOpen, setIsNewKeyModalOpen] = useState(false);
        const [isViewKeyModalOpen, setIsViewKeyModalOpen] = useState(false);
        const [keyToRevoke, setKeyToRevoke] = useState(null);
        const [keyToView, setKeyToView] = useState(null);
        const [newlyCreatedKey, setNewlyCreatedKey] = useState(null);
        const [showGuide, setShowGuide] = useState(true);
        const { toast } = useToast();
    
        const fetchKeys = useCallback(async () => {
            setLoading(true);
            try {
                const data = await adminKeyService.getAdminKeys();
                setKeys(data);
            } catch (error) {
                toast({ title: "Lỗi", description: `Không thể tải khóa admin: ${error.message}`, variant: "destructive" });
            } finally {
                setLoading(false);
            }
        }, [toast]);
    
        useEffect(() => {
            fetchKeys();
        }, [fetchKeys]);
    
        const handleKeyCreated = (newKey) => {
            fetchKeys();
            setNewlyCreatedKey(newKey);
            setIsNewKeyModalOpen(true);
        };
        
        const handleViewKey = (key) => {
            setKeyToView(key);
            setIsViewKeyModalOpen(true);
        }
    
        const handleConfirmRevoke = (key) => {
            setKeyToRevoke(key);
            setIsAlertOpen(true);
        };
    
        const handleRevoke = async () => {
            if (!keyToRevoke) return;
            try {
                await adminKeyService.revokeAdminKey(keyToRevoke.id);
                toast({ title: "Thành công", description: `Đã thu hồi khóa "${keyToRevoke.name}".`, variant: "success"});
                fetchKeys();
            } catch (error) {
                toast({ title: "Lỗi", description: `Không thể thu hồi khóa: ${error.message}`, variant: "destructive" });
            }
            setIsAlertOpen(false);
        };
    
        const copyToClipboard = (text, keyName) => {
            navigator.clipboard.writeText(text);
            toast({
                title: "Đã sao chép!",
                description: `Khóa "${keyName}" đã được sao chép.`,
                variant: "success",
                icon: <Check className="h-5 w-5 text-white" />,
            });
        };
    
        return (
            <TooltipProvider>
                <motion.div
                    initial="hidden"
                    animate="visible"
                    variants={containerVariants}
                    className="space-y-8"
                >
                    <motion.div variants={itemVariants}>
                        <header className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                            <div>
                                <h1 className="text-3xl font-bold tracking-tight text-slate-100">Quản lý Khóa Truy Cập Admin</h1>
                                <p className="text-slate-400 mt-1">Tạo và quản lý các khóa API để xác thực yêu cầu quản trị.</p>
                            </div>
                            <Button onClick={() => setIsFormModalOpen(true)} className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg hover:shadow-indigo-500/50 transition-all duration-300 hover:scale-105">
                                <PlusCircle className="mr-2 h-4 w-4" /> Tạo Khóa Mới
                            </Button>
                        </header>
                    </motion.div>

                    <AnimatePresence>
                        {showGuide && (
                            <motion.div
                                variants={itemVariants}
                                exit={{ opacity: 0, height: 0, marginTop: 0, marginBottom: 0, transition: { duration: 0.3 } }}
                            >
                                <div className="bg-blue-900/50 border border-blue-700 text-blue-200 px-4 py-3 rounded-lg relative flex items-start gap-3">
                                    <Info className="h-5 w-5 mt-0.5 flex-shrink-0 text-blue-400" />
                                    <div className="flex-grow">
                                        <h3 className="font-semibold">Làm thế nào để xem lại mã key?</h3>
                                        <p className="text-sm">
                                            Để xem lại mã key đầy đủ, chỉ cần nhấn vào biểu tượng hình con mắt <Eye className="inline h-4 w-4 mx-1" /> ở cuối mỗi hàng trong bảng.
                                        </p>
                                    </div>
                                    <Button variant="ghost" size="icon" className="h-7 w-7 flex-shrink-0 text-blue-300 hover:bg-blue-800/50" onClick={() => setShowGuide(false)}>
                                        <X className="h-4 w-4" />
                                    </Button>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
    
                    <motion.div variants={itemVariants}>
                        <Card className="bg-slate-900/60 border-slate-700 shadow-xl backdrop-blur-sm">
                            <CardHeader className="flex flex-row items-center justify-between">
                               <div>
                                 <CardTitle>Danh sách Khóa</CardTitle>
                                 <CardDescription>Các khóa đang hoạt động và đã bị thu hồi trong hệ thống.</CardDescription>
                               </div>
                               <Tooltip>
                                 <TooltipTrigger asChild>
                                   <Button variant="ghost" size="icon" onClick={fetchKeys} disabled={loading}>
                                       <RefreshCw className={`h-5 w-5 ${loading ? 'animate-spin' : ''}`} />
                                   </Button>
                                 </TooltipTrigger>
                                 <TooltipContent className="bg-slate-800 text-white border-slate-700">
                                   <p>Làm mới danh sách</p>
                                 </TooltipContent>
                               </Tooltip>
                            </CardHeader>
                            <CardContent>
                                <div className="overflow-x-auto">
                                    <Table>
                                        <TableHeader>
                                            <TableRow className="border-slate-800 hover:bg-transparent">
                                                <TableHead>Tên Khóa</TableHead>
                                                <TableHead>Lần cuối sử dụng</TableHead>
                                                <TableHead>Quyền hạn</TableHead>
                                                <TableHead>Thời gian tạo</TableHead>
                                                <TableHead>Trạng thái</TableHead>
                                                <TableHead className="text-right">Hành động</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {loading ? <TableSkeleton /> : (
                                                <AnimatePresence>
                                                    {keys.map((key) => (
                                                        <motion.tr
                                                            key={key.id}
                                                            layout
                                                            initial={{ opacity: 0, y: -20 }}
                                                            animate={{ opacity: 1, y: 0 }}
                                                            exit={{ opacity: 0, y: 20 }}
                                                            transition={{ duration: 0.3, ease: "easeInOut" }}
                                                            className="border-slate-800 hover:bg-slate-800/50 transition-colors duration-200"
                                                        >
                                                            <TableCell className="font-medium text-slate-200">{key.name}</TableCell>
                                                            <TableCell className="text-slate-400">
                                                                <div className="flex items-center gap-2">
                                                                    <Clock className="h-4 w-4 text-slate-500" />
                                                                    <span>{key.last_used_at ? formatDistanceToNow(new Date(key.last_used_at), { addSuffix: true, locale: vi }) : 'Chưa dùng'}</span>
                                                                </div>
                                                            </TableCell>
                                                            <TableCell>
                                                                <div className="flex items-center gap-2">
                                                                    {key.permissions.map(p => (
                                                                        <Tooltip key={p}>
                                                                            <TooltipTrigger>
                                                                                <Badge variant="secondary" className="gap-1.5 pl-1.5">
                                                                                   <PermissionIcon permission={p} />
                                                                                   {p.split(':')[0]}
                                                                                </Badge>
                                                                            </TooltipTrigger>
                                                                            <TooltipContent className="bg-slate-800 text-white border-slate-700">
                                                                                <p>{p}</p>
                                                                            </TooltipContent>
                                                                        </Tooltip>
                                                                    ))}
                                                                </div>
                                                            </TableCell>
                                                            <TableCell className="text-slate-400">{formatDistanceToNow(new Date(key.created_at), { addSuffix: true, locale: vi })}</TableCell>
                                                            <TableCell>
                                                                <Badge variant={key.status === 'active' ? 'success' : 'destructive'} className="capitalize">
                                                                    {key.status === 'active' ? 'Hoạt động' : 'Đã thu hồi'}
                                                                </Badge>
                                                            </TableCell>
                                                            <TableCell className="text-right space-x-1">
                                                                <Tooltip>
                                                                    <TooltipTrigger asChild>
                                                                        <Button variant="ghost" size="icon" onClick={() => handleViewKey(key)}>
                                                                            <Eye className="h-4 w-4" />
                                                                        </Button>
                                                                    </TooltipTrigger>
                                                                    <TooltipContent className="bg-slate-800 text-white border-slate-700">
                                                                        <p>Xem toàn bộ khóa</p>
                                                                    </TooltipContent>
                                                                </Tooltip>
                                                                <Tooltip>
                                                                    <TooltipTrigger asChild>
                                                                        <Button variant="ghost" size="icon" onClick={() => copyToClipboard(key.key, key.name)}>
                                                                            <Copy className="h-4 w-4" />
                                                                        </Button>
                                                                    </TooltipTrigger>
                                                                    <TooltipContent className="bg-slate-800 text-white border-slate-700">
                                                                        <p>Sao chép khóa</p>
                                                                    </TooltipContent>
                                                                </Tooltip>
                                                                {key.status === 'active' && (
                                                                    <Tooltip>
                                                                        <TooltipTrigger asChild>
                                                                            <Button variant="ghost" size="icon" className="text-red-500 hover:text-red-400" onClick={() => handleConfirmRevoke(key)}>
                                                                                <Trash2 className="h-4 w-4" />
                                                                            </Button>
                                                                        </TooltipTrigger>
                                                                        <TooltipContent className="bg-red-900 text-white border-red-700">
                                                                            <p>Thu hồi khóa này</p>
                                                                        </TooltipContent>
                                                                    </Tooltip>
                                                                )}
                                                            </TableCell>
                                                        </motion.tr>
                                                    ))}
                                                </AnimatePresence>
                                            )}
                                        </TableBody>
                                    </Table>
                                </div>
                            </CardContent>
                        </Card>
                    </motion.div>
                </motion.div>
                
                <KeyFormModal isOpen={isFormModalOpen} onOpenChange={setIsFormModalOpen} onKeyCreated={handleKeyCreated} />
                <NewKeyModal isOpen={isNewKeyModalOpen} onOpenChange={setIsNewKeyModalOpen} newKey={newlyCreatedKey} />
                <ViewKeyModal isOpen={isViewKeyModalOpen} onOpenChange={setIsViewKeyModalOpen} apiKey={keyToView} />
    
                <AlertDialog open={isAlertOpen} onOpenChange={setIsAlertOpen}>
                    <AlertDialogContent className="bg-slate-900 border-slate-700 text-white">
                        <AlertDialogHeader>
                            <AlertDialogTitle className="flex items-center gap-2">
                               <ShieldAlert className="h-6 w-6 text-yellow-400" />
                               Xác nhận Thu hồi Khóa
                            </AlertDialogTitle>
                            <AlertDialogDescription>
                                Bạn có chắc chắn muốn thu hồi khóa <strong>"{keyToRevoke?.name}"</strong> không? Hành động này không thể hoàn tác và khóa sẽ bị vô hiệu hóa ngay lập tức.
                            </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                            <AlertDialogCancel>Hủy</AlertDialogCancel>
                            <AlertDialogAction onClick={handleRevoke} className="bg-red-600 hover:bg-red-700">
                                Tôi chắc chắn, Thu hồi
                            </AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>
            </TooltipProvider>
        );
    };
    
    export default AdminKeysPage;