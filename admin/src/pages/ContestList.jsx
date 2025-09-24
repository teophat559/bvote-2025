import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { PlusCircle, Edit, Trash2, Eye, Menu, X, Trophy } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { format } from 'date-fns';

const mockContests = [
  { id: 1, name: 'Cuộc thi ảnh mùa hè', status: 'active', startDate: new Date(), endDate: new Date(Date.now() + 86400000 * 7) },
  { id: 2, name: 'Tìm kiếm tài năng âm nhạc', status: 'upcoming', startDate: new Date(Date.now() + 86400000 * 10), endDate: new Date(Date.now() + 86400000 * 30) },
  { id: 3, name: 'Vua đầu bếp 2024', status: 'finished', startDate: new Date(Date.now() - 86400000 * 30), endDate: new Date(Date.now() - 86400000 * 2) },
];

const itemVariants = {
  hidden: { y: 20, opacity: 0 },
  visible: { y: 0, opacity: 1 },
};

const ContestList = ({ isSidebarOpen, toggleSidebar }) => {
  const [contests, setContests] = useState(mockContests);
  const { toast } = useToast();

  const handleAction = (action, contestName) => {
    toast({
      title: `Chức năng: ${action}`,
      description: `Hành động "${action}" trên cuộc thi "${contestName}" chưa được triển khai.`,
    });
  };

  return (
    <motion.div
      variants={itemVariants}
      initial="hidden"
      animate="visible"
      className="bg-slate-900/70 border border-slate-800 rounded-lg h-full p-1.5 md:p-2 backdrop-blur-md overflow-hidden flex flex-col"
    >
      <header className="flex items-center justify-between mb-4 bg-slate-800/50 rounded-t-md p-2 border-b border-slate-700">
        <div className="flex items-center gap-1.5">
          <Button variant="ghost" size="icon" onClick={toggleSidebar} className="md:hidden z-50 h-7 w-7">
            {isSidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
          <div className="hidden md:flex items-center gap-1.5">
             <Trophy className="h-5 w-5 text-yellow-400" />
          </div>
        </div>
        <h1 className="text-base md:text-lg font-bold text-center flex-1 truncate px-2">DANH SÁCH CUỘC THI</h1>
        <Button onClick={() => handleAction('Tạo mới', '')} className="bg-green-600 hover:bg-green-700">
          <PlusCircle className="mr-2 h-4 w-4" /> Tạo Cuộc Thi
        </Button>
      </header>
      <main className="flex-grow p-1.5 md:p-4 pt-0 overflow-y-auto">
        <Card className="bg-slate-900/50 border-slate-700">
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-slate-700 hover:bg-slate-800/50">
                    <TableHead>Tên Cuộc Thi</TableHead>
                    <TableHead>Trạng thái</TableHead>
                    <TableHead>Ngày bắt đầu</TableHead>
                    <TableHead>Ngày kết thúc</TableHead>
                    <TableHead className="text-right">Hành động</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {contests.map((contest) => (
                    <TableRow key={contest.id} className="border-slate-800 hover:bg-slate-800/50">
                      <TableCell>{contest.name}</TableCell>
                      <TableCell>
                        <Badge variant={contest.status === 'active' ? 'success' : contest.status === 'upcoming' ? 'secondary' : 'destructive'}>
                          {contest.status === 'active' ? 'Đang diễn ra' : contest.status === 'upcoming' ? 'Sắp diễn ra' : 'Đã kết thúc'}
                        </Badge>
                      </TableCell>
                      <TableCell>{format(contest.startDate, 'dd/MM/yyyy')}</TableCell>
                      <TableCell>{format(contest.endDate, 'dd/MM/yyyy')}</TableCell>
                      <TableCell className="text-right space-x-1">
                        <Button variant="ghost" size="icon" onClick={() => handleAction('Xem', contest.name)}><Eye className="h-4 w-4" /></Button>
                        <Button variant="ghost" size="icon" onClick={() => handleAction('Sửa', contest.name)}><Edit className="h-4 w-4" /></Button>
                        <Button variant="ghost" size="icon" onClick={() => handleAction('Xóa', contest.name)}><Trash2 className="h-4 w-4 text-red-500" /></Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </main>
    </motion.div>
  );
};

export default ContestList;