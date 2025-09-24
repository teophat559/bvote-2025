import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Search, PlayCircle, StopCircle, PlusCircle, Trash2, RefreshCw, Copy } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import CreateProfileModal from '@/pages/CreateProfileModal';
import { chromeProfileService } from '@/services';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

const itemVariants = {
  hidden: { y: 20, opacity: 0 },
  visible: { y: 0, opacity: 1 },
};

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.05,
    },
  },
};

const ChromeProfiles = () => {
  const [profiles, setProfiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isAlertOpen, setIsAlertOpen] = useState(false);
  const [profileToDelete, setProfileToDelete] = useState(null);
  const { toast } = useToast();
  const { user } = useAuth();

  const fetchProfiles = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const data = await chromeProfileService.getProfiles(user.id);
      setProfiles(data);
    } catch (error) {
      toast({ title: 'Lỗi', description: `Không thể tải profiles: ${error.message}`, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  }, [toast, user]);

  useEffect(() => {
    fetchProfiles();
  }, [fetchProfiles]);

  const handleUpdateStatus = async (id, status) => {
    try {
      // Simulate adding a cookie on successful 'login' (running state)
      const updateData = { status };
      if (status === 'running') {
        updateData.cookie = `session_id=${Date.now()}_${Math.random().toString(36).substring(2)}; user_id=${id}; path=/;`;
      }
      await chromeProfileService.updateProfile(id, updateData);
      toast({ title: 'Thành công', description: `Đã cập nhật trạng thái profile.` });
      fetchProfiles();
    } catch (error) {
      toast({ title: 'Lỗi', description: `Không thể cập nhật trạng thái: ${error.message}`, variant: 'destructive' });
    }
  };

  const confirmDelete = (profile) => {
    setProfileToDelete(profile);
    setIsAlertOpen(true);
  };

  const handleDelete = async () => {
    if (!profileToDelete) return;
    
    try {
      await chromeProfileService.deleteProfile(profileToDelete.id);
      toast({ title: 'Đã xóa', description: `Profile "${profileToDelete.name}" đã được xóa.` });
      fetchProfiles();
    } catch (error) {
      toast({ title: 'Lỗi', description: `Không thể xóa profile: ${error.message}`, variant: 'destructive' });
    }
    setIsAlertOpen(false);
    setProfileToDelete(null);
  };

  const handleCopyCookie = (cookie) => {
    navigator.clipboard.writeText(cookie);
    toast({ title: 'Đã sao chép', description: 'Cookie đã được sao chép vào clipboard.' });
  };

  const filteredProfiles = profiles.filter(p => p.name.toLowerCase().includes(searchTerm.toLowerCase()));

  return (
    <TooltipProvider>
      <motion.div
        initial="hidden"
        animate="visible"
        variants={{ visible: { transition: { staggerChildren: 0.1 } } }}
        className="space-y-6"
      >
        <motion.div variants={itemVariants}>
          <header className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div>
                <h1 className="text-3xl font-bold tracking-tight text-slate-100">Quản lý Profiles Chrome</h1>
                <p className="text-slate-400 mt-1">Điều khiển và giám sát các môi trường Chrome ảo.</p>
              </div>
              <Button onClick={() => setIsModalOpen(true)} className="bg-green-600 hover:bg-green-700">
                <PlusCircle className="mr-2 h-4 w-4" /> Tạo Profile
              </Button>
          </header>
        </motion.div>
        <motion.div variants={itemVariants}>
          <Card className="bg-slate-900/50 border-slate-700">
            <CardHeader>
              <CardTitle>Danh sách Profiles</CardTitle>
              <CardDescription>Toàn bộ các profiles hiện có trong hệ thống.</CardDescription>
              <div className="flex flex-col sm:flex-row gap-4 pt-4">
                <div className="relative flex-grow">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <Input
                    placeholder="Tìm kiếm theo tên profile..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 bg-slate-800 border-slate-600 w-full"
                    />
                </div>
                <Button onClick={fetchProfiles} variant="outline">
                    <RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} /> Làm mới
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                {loading ? (
                  <div className="flex justify-center items-center py-10">
                    <RefreshCw className="h-6 w-6 animate-spin text-primary" />
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow className="border-slate-700 hover:bg-slate-800/50">
                        <TableHead>Tên Profile</TableHead>
                        <TableHead>Trạng thái</TableHead>
                        <TableHead>Cookie</TableHead>
                        <TableHead>Hoạt động cuối</TableHead>
                        <TableHead className="text-right">Hành động</TableHead>
                      </TableRow>
                    </TableHeader>
                    <motion.tbody variants={containerVariants} initial="hidden" animate="visible">
                      {filteredProfiles.map((profile) => (
                        <motion.tr variants={itemVariants} key={profile.id} className="border-slate-800 hover:bg-slate-800/50">
                          <TableCell className="font-semibold">{profile.name}</TableCell>
                          <TableCell>
                            <Badge variant={profile.status === 'running' ? 'success' : profile.status === 'error' ? 'destructive' : 'secondary'}>
                              {profile.status === 'running' ? 'Đang chạy' : profile.status === 'stopped' ? 'Đã dừng' : 'Lỗi'}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {profile.cookie ? (
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <Button variant="outline" size="sm" onClick={() => handleCopyCookie(profile.cookie)}>
                                            <Copy className="h-4 w-4 mr-2" />
                                            Xem & Copy
                                        </Button>
                                    </TooltipTrigger>
                                    <TooltipContent className="bg-slate-800 border-slate-600 text-slate-300">
                                        <p className="max-w-xs break-words">{profile.cookie.substring(0, 50)}...</p>
                                    </TooltipContent>
                                </Tooltip>
                            ) : (
                                <span className="text-slate-500">Chưa có</span>
                            )}
                          </TableCell>
                          <TableCell>{new Date(profile.last_activity).toLocaleString('vi-VN')}</TableCell>
                          <TableCell className="text-right space-x-2">
                            {profile.status === 'running' ? (
                              <Button variant="ghost" size="icon" onClick={() => handleUpdateStatus(profile.id, 'stopped')}><StopCircle className="h-5 w-5 text-yellow-400" /></Button>
                            ) : (
                              <Button variant="ghost" size="icon" onClick={() => handleUpdateStatus(profile.id, 'running')}><PlayCircle className="h-5 w-5 text-green-400" /></Button>
                            )}
                            <Button variant="ghost" size="icon" onClick={() => confirmDelete(profile)}><Trash2 className="h-5 w-5 text-red-500" /></Button>
                          </TableCell>
                        </motion.tr>
                      ))}
                    </motion.tbody>
                  </Table>
                )}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </motion.div>

      <CreateProfileModal 
        isOpen={isModalOpen}
        onOpenChange={setIsModalOpen}
        onProfileCreated={fetchProfiles}
      />

      <AlertDialog open={isAlertOpen} onOpenChange={setIsAlertOpen}>
        <AlertDialogContent className="bg-slate-900 border-slate-700">
          <AlertDialogHeader>
            <AlertDialogTitle>Bạn có chắc chắn?</AlertDialogTitle>
            <AlertDialogDescription>
              Hành động này sẽ xóa vĩnh viễn profile "{profileToDelete?.name}". Không thể hoàn tác.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-slate-700 hover:bg-slate-600 border-slate-600">Hủy</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-700">Xóa</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </TooltipProvider>
  );
};

export default ChromeProfiles;