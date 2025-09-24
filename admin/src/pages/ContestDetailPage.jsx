
import React, { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useToast } from '@/components/ui/use-toast';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { ArrowLeft, RefreshCw, PlusCircle, MoreHorizontal, Edit, Trash2 } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { contestService } from '@/services';
import ContestantFormModal from '@/pages/ContestantFormModal';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';

const itemVariants = {
  hidden: { y: 20, opacity: 0 },
  visible: { y: 0, opacity: 1 },
};

const ContestDetailPage = () => {
  const { id } = useParams();
  const [contest, setContest] = useState(null);
  const [contestants, setContestants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingContestant, setEditingContestant] = useState(null);
  const [isAlertOpen, setIsAlertOpen] = useState(false);
  const [contestantToDelete, setContestantToDelete] = useState(null);
  const { toast } = useToast();

  const fetchContestDetails = useCallback(async () => {
    setLoading(true);
    try {
      const contestData = await contestService.getContestById(id);
      setContest(contestData);
      await fetchContestants();
    } catch (error) {
      toast({
        title: 'Lỗi',
        description: `Không thể tải thông tin chi tiết: ${error.message}`,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [id, toast]);

  const fetchContestants = useCallback(async () => {
    try {
      const contestantsData = await contestService.getContestantsByContestId(id);
      setContestants(contestantsData);
    } catch (error) {
       toast({
        title: 'Lỗi',
        description: `Không thể tải danh sách thí sinh: ${error.message}`,
        variant: 'destructive',
      });
    }
  }, [id, toast]);

  useEffect(() => {
    fetchContestDetails();
  }, [fetchContestDetails]);
  
  const handleOpenModal = (contestant = null) => {
    setEditingContestant(contestant);
    setIsModalOpen(true);
  };

  const handleConfirmDelete = (contestant) => {
    setContestantToDelete(contestant);
    setIsAlertOpen(true);
  };

  const handleDelete = async () => {
    if (!contestantToDelete) return;
    try {
      await contestService.deleteContestant(contestantToDelete.id);
      toast({ title: 'Thành công', description: `Đã xóa thí sinh "${contestantToDelete.name}".` });
      fetchContestants();
    } catch (error) {
      toast({ title: 'Lỗi', description: `Không thể xóa thí sinh: ${error.message}`, variant: 'destructive' });
    }
    setIsAlertOpen(false);
    setContestantToDelete(null);
  };


  if (loading) {
    return (
      <div className="flex justify-center items-center h-full">
        <RefreshCw className="w-16 h-16 animate-spin text-blue-500" />
      </div>
    );
  }

  if (!contest) {
    return <p className="text-center text-slate-400 py-10">Không tìm thấy cuộc thi.</p>;
  }

  return (
    <>
      <motion.div
        initial="hidden"
        animate="visible"
        variants={{ visible: { transition: { staggerChildren: 0.1 } } }}
        className="space-y-6"
      >
        <motion.div variants={itemVariants}>
          <Button asChild variant="outline" className="mb-4">
            <Link to="/management/contests">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Quay lại danh sách
            </Link>
          </Button>
          <header>
            <h1 className="text-3xl font-bold tracking-tight text-slate-100">{contest.name}</h1>
            <p className="text-slate-400 mt-1">{contest.description || 'Chi tiết cuộc thi.'}</p>
          </header>
        </motion.div>
        
        <motion.div variants={itemVariants}>
          <Card className="bg-slate-900/50 border-slate-800">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Danh sách Thí sinh</CardTitle>
                <CardDescription>Các thí sinh tham gia cuộc thi "{contest.name}".</CardDescription>
              </div>
              <Button onClick={() => handleOpenModal()}>
                <PlusCircle className="mr-2 h-4 w-4" /> Thêm Thí sinh
              </Button>
            </CardHeader>
            <CardContent>
              {contestants.length === 0 ? (
                <p className="text-center text-slate-400 py-10">Chưa có thí sinh nào cho cuộc thi này.</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>SBD</TableHead>
                      <TableHead>Ảnh</TableHead>
                      <TableHead>Tên Thí Sinh</TableHead>
                      <TableHead className="text-right">Hành động</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {contestants.map((contestant) => (
                      <TableRow key={contestant.id}>
                        <TableCell className="font-mono">{contestant.sbd}</TableCell>
                        <TableCell>
                          <Avatar>
                            <AvatarImage src={contestant.image_url} alt={contestant.name} />
                            <AvatarFallback>{contestant.name.charAt(0)}</AvatarFallback>
                          </Avatar>
                        </TableCell>
                        <TableCell className="font-medium">{contestant.name}</TableCell>
                        <TableCell className="text-right">
                           <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" className="h-8 w-8 p-0">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="bg-slate-800 border-slate-700 text-white">
                              <DropdownMenuItem onClick={() => handleOpenModal(contestant)} className="cursor-pointer">
                                <Edit className="mr-2 h-4 w-4" /> Sửa
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleConfirmDelete(contestant)} className="text-red-400 focus:text-red-300 focus:bg-red-500/10 cursor-pointer">
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
      <ContestantFormModal
        isOpen={isModalOpen}
        onOpenChange={setIsModalOpen}
        contestant={editingContestant}
        contestId={id}
        onContestantSaved={fetchContestants}
      />
      <AlertDialog open={isAlertOpen} onOpenChange={setIsAlertOpen}>
        <AlertDialogContent className="bg-slate-900 border-slate-700">
          <AlertDialogHeader>
            <AlertDialogTitle>Bạn có chắc chắn muốn xóa?</AlertDialogTitle>
            <AlertDialogDescription>
              Hành động này sẽ xóa vĩnh viễn thí sinh "{contestantToDelete?.name}". Không thể hoàn tác.
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

export default ContestDetailPage;
