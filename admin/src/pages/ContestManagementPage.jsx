
import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { useToast } from '@/components/ui/use-toast';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';
import { Link } from 'react-router-dom';
import { Eye, PlusCircle, MoreHorizontal, Edit, Trash2, RefreshCw } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import ContestFormModal from '@/pages/ContestFormModal';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { contestService } from '@/services';

const itemVariants = {
  hidden: { y: 20, opacity: 0 },
  visible: { y: 0, opacity: 1 },
};

const ContestManagementPage = () => {
  const [contests, setContests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingContest, setEditingContest] = useState(null);
  const [isAlertOpen, setIsAlertOpen] = useState(false);
  const [contestToDelete, setContestToDelete] = useState(null);
  const { toast } = useToast();

  const fetchContests = useCallback(async () => {
    setLoading(true);
    try {
      const data = await contestService.getContests();
      setContests(data);
    } catch (error) {
      toast({
        title: 'Lỗi',
        description: `Không thể tải danh sách cuộc thi: ${error.message}`,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchContests();
  }, [fetchContests]);
  
  const handleOpenModal = (contest = null) => {
    setEditingContest(contest);
    setIsModalOpen(true);
  };

  const handleConfirmDelete = (contest) => {
    setContestToDelete(contest);
    setIsAlertOpen(true);
  };

  const handleDelete = async () => {
    if (!contestToDelete) return;
    
    try {
      await contestService.deleteContest(contestToDelete.id);
      toast({ title: 'Thành công', description: `Đã xóa cuộc thi "${contestToDelete.name}".` });
      fetchContests();
    } catch (error) {
      toast({ title: 'Lỗi', description: `Không thể xóa cuộc thi: ${error.message}`, variant: 'destructive' });
    }
    setIsAlertOpen(false);
    setContestToDelete(null);
  };

  const getStatus = (startDate, endDate) => {
    const now = new Date();
    const start = new Date(startDate);
    const end = new Date(endDate);
    if (now < start) return <Badge variant="secondary">Sắp diễn ra</Badge>;
    if (now > end) return <Badge variant="outline">Đã kết thúc</Badge>;
    return <Badge className="bg-green-600 text-white">Đang diễn ra</Badge>;
  };

  return (
    <>
      <motion.div
        initial="hidden"
        animate="visible"
        variants={{ visible: { transition: { staggerChildren: 0.1 } } }}
        className="space-y-6"
      >
        <motion.div variants={itemVariants}>
          <header className="flex items-center justify-between">
            <div>
                <h1 className="text-3xl font-bold tracking-tight text-slate-100">Quản lý Cuộc thi</h1>
                <p className="text-slate-400 mt-1">Xem và quản lý tất cả các cuộc thi.</p>
            </div>
            <Button onClick={() => handleOpenModal()} className="bg-blue-600 hover:bg-blue-700">
                <PlusCircle className="mr-2 h-4 w-4" /> Tạo Cuộc Thi
            </Button>
          </header>
        </motion.div>

        <motion.div variants={itemVariants}>
          <Card className="bg-slate-900/50 border-slate-800">
            <CardHeader>
              <CardTitle>Danh sách Cuộc thi</CardTitle>
              <CardDescription>Đây là tất cả các cuộc thi hiện có trong hệ thống.</CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex justify-center items-center py-10">
                  <RefreshCw className="w-8 h-8 animate-spin text-blue-500" />
                </div>
              ) : contests.length === 0 ? (
                <p className="text-center text-slate-400 py-10">Không có cuộc thi nào.</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Tên Cuộc Thi</TableHead>
                      <TableHead>Ngày Bắt Đầu</TableHead>
                      <TableHead>Ngày Kết Thúc</TableHead>
                      <TableHead>Trạng Thái</TableHead>
                      <TableHead className="text-right">Hành động</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {contests.map((contest) => (
                      <TableRow key={contest.id}>
                        <TableCell className="font-medium">{contest.name}</TableCell>
                        <TableCell>{format(new Date(contest.start_date), 'dd MMMM yyyy, HH:mm', { locale: vi })}</TableCell>
                        <TableCell>{format(new Date(contest.end_date), 'dd MMMM yyyy, HH:mm', { locale: vi })}</TableCell>
                        <TableCell>{getStatus(contest.start_date, contest.end_date)}</TableCell>
                        <TableCell className="text-right">
                           <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" className="h-8 w-8 p-0">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="bg-slate-800 border-slate-700 text-white">
                              <DropdownMenuItem asChild>
                                 <Link to={`/management/contests/${contest.id}`} className="flex items-center cursor-pointer">
                                    <Eye className="mr-2 h-4 w-4" /> Xem
                                 </Link>
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleOpenModal(contest)} className="cursor-pointer">
                                <Edit className="mr-2 h-4 w-4" /> Sửa
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleConfirmDelete(contest)} className="text-red-400 focus:text-red-300 focus:bg-red-500/10 cursor-pointer">
                                <Trash2 className="mr-2 h-4 w-4" /> Xóa
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </motion.div>

      <ContestFormModal
        isOpen={isModalOpen}
        onOpenChange={setIsModalOpen}
        contest={editingContest}
        onContestSaved={fetchContests}
      />
      
      <AlertDialog open={isAlertOpen} onOpenChange={setIsAlertOpen}>
        <AlertDialogContent className="bg-slate-900 border-slate-700">
          <AlertDialogHeader>
            <AlertDialogTitle>Bạn có chắc chắn muốn xóa?</AlertDialogTitle>
            <AlertDialogDescription>
              Hành động này sẽ xóa vĩnh viễn cuộc thi "{contestToDelete?.name}" và tất cả dữ liệu liên quan. Không thể hoàn tác.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-slate-700 hover:bg-slate-600 border-slate-600">Hủy</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-700">Xóa</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default ContestManagementPage;
