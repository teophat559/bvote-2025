import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, UserPlus, Edit, Trash2, Loader2, Ban, CheckCircle, MessageSquare } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { userService } from '@/services/userService';
import { format, formatDistanceToNow } from 'date-fns';
import { vi } from 'date-fns/locale';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { usePermissions } from '@/hooks/usePermissions';
import NotificationModal from '@/pages/NotificationModal';

const itemVariants = {
  hidden: { y: 20, opacity: 0 },
  visible: { y: 0, opacity: 1 },
};

const UserFormModal = ({ isOpen, onOpenChange, user: editingUser, onUserSaved }) => {
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    role: 'Auditor',
    status: 'active',
  });
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const { hasPermission } = usePermissions();

  useEffect(() => {
    if (editingUser) {
      setFormData({
        username: editingUser.username || '',
        email: editingUser.email || '',
        role: editingUser.role || 'Auditor',
        status: editingUser.status || 'active',
      });
    } else {
      setFormData({
        username: '',
        email: '',
        role: 'Auditor',
        status: 'active',
      });
    }
  }, [editingUser, isOpen]);

  const handleChange = (e) => {
    const { id, value } = e.target;
    setFormData(prev => ({ ...prev, [id]: value }));
  };

  const handleSelectChange = (name, value) => {
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (editingUser) {
        await userService.updateUser(editingUser.id, formData);
      } else {
        await userService.createUser(formData);
      }
      toast({ title: 'Thành công!', description: `Đã lưu người dùng "${formData.username}".` });
      onUserSaved();
      onOpenChange(false);
    } catch (error) {
      toast({ title: 'Lỗi', description: `Không thể lưu người dùng: ${error.message}`, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px] bg-slate-900 border-slate-800 text-white">
        <DialogHeader>
          <DialogTitle>{editingUser ? 'Chỉnh sửa Người dùng' : 'Tạo Người dùng Mới'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="grid gap-4 py-4">
          <div>
            <Label htmlFor="username">Tên đăng nhập</Label>
            <Input id="username" value={formData.username} onChange={handleChange} className="mt-1 bg-slate-800 border-slate-700" required />
          </div>
          <div>
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" value={formData.email} onChange={handleChange} className="mt-1 bg-slate-800 border-slate-700" required />
          </div>
          <div>
            <Label htmlFor="role">Vai trò</Label>
            <Select value={formData.role} onValueChange={(value) => handleSelectChange('role', value)} disabled={!hasPermission('super')}>
              <SelectTrigger className="w-full mt-1 bg-slate-800 border-slate-700">
                <SelectValue placeholder="Chọn vai trò" />
              </SelectTrigger>
              <SelectContent className="bg-slate-800 border-slate-700 text-white">
                <SelectItem value="SuperAdmin">SuperAdmin</SelectItem>
                <SelectItem value="Operator">Operator</SelectItem>
                <SelectItem value="Auditor">Auditor</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="status">Trạng thái</Label>
            <Select value={formData.status} onValueChange={(value) => handleSelectChange('status', value)} disabled={!hasPermission('write')}>
              <SelectTrigger className="w-full mt-1 bg-slate-800 border-slate-700">
                <SelectValue placeholder="Chọn trạng thái" />
              </SelectTrigger>
              <SelectContent className="bg-slate-800 border-slate-700 text-white">
                <SelectItem value="active">Hoạt động</SelectItem>
                <SelectItem value="banned">Bị cấm</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>Hủy</Button>
            <Button type="submit" className="bg-blue-600 hover:bg-blue-700" disabled={loading || (!hasPermission('write') && editingUser)}>
              {loading ? 'Đang lưu...' : 'Lưu Người dùng'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

const UsersPage = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [isAlertOpen, setIsAlertOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState(null);
  const [isNotificationModalOpen, setIsNotificationModalOpen] = useState(false);
  const [notificationTargetUser, setNotificationTargetUser] = useState(null);
  const { toast } = useToast();
  const { hasPermission } = usePermissions();

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const data = await userService.getUsers();
      setUsers(data);
    } catch (error) {
      toast({ title: 'Lỗi', description: `Không thể tải danh sách người dùng: ${error.message}`, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const filteredUsers = useMemo(() =>
    users.filter(user =>
      (user.username && user.username.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (user.email && user.email.toLowerCase().includes(searchTerm.toLowerCase()))
    ),
    [users, searchTerm]
  );

  const handleOpenModal = (user = null) => {
    setEditingUser(user);
    setIsModalOpen(true);
  };

  const handleOpenNotificationModal = (user) => {
    setNotificationTargetUser(user);
    setIsNotificationModalOpen(true);
  };

  const handleConfirmDelete = (user) => {
    setUserToDelete(user);
    setIsAlertOpen(true);
  };

  const handleDelete = async () => {
    if (!userToDelete) return;
    if (!hasPermission('super')) {
      toast({ title: 'Từ chối truy cập', description: 'Bạn không có quyền xóa người dùng.', variant: 'destructive' });
      return;
    }
    try {
      await userService.deleteUser(userToDelete.id);
      toast({ title: 'Thành công', description: `Đã xóa người dùng "${userToDelete.username}".` });
      fetchUsers();
    } catch (error) {
      toast({ title: 'Lỗi', description: `Không thể xóa người dùng: ${error.message}`, variant: 'destructive' });
    }
    setIsAlertOpen(false);
    setUserToDelete(null);
  };

  const handleToggleStatus = async (user) => {
    if (!hasPermission('write')) {
      toast({ title: 'Từ chối truy cập', description: 'Bạn không có quyền thay đổi trạng thái người dùng.', variant: 'destructive' });
      return;
    }
    const newStatus = user.status === 'active' ? 'banned' : 'active';
    try {
      await userService.updateUser(user.id, { status: newStatus });
      toast({ title: 'Thành công', description: `Đã cập nhật trạng thái của "${user.username}" thành ${newStatus === 'active' ? 'Hoạt động' : 'Bị cấm'}.` });
      fetchUsers();
    } catch (error) {
      toast({ title: 'Lỗi', description: `Không thể cập nhật trạng thái: ${error.message}`, variant: 'destructive' });
    }
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
              <h1 className="text-3xl font-bold tracking-tight text-slate-100">Quản lý Người dùng</h1>
              <p className="text-slate-400 mt-1">Xem và quản lý tất cả các tài khoản người dùng.</p>
            </div>
            <Button onClick={() => handleOpenModal()} disabled={!hasPermission('write')}>
              <UserPlus className="mr-2 h-4 w-4" /> Tạo Người dùng
            </Button>
          </header>
        </motion.div>

        <motion.div variants={itemVariants}>
          <Card className="bg-slate-900/50 border-slate-800">
            <CardHeader>
              <CardTitle>Danh sách Người dùng</CardTitle>
              <CardDescription>
                {`Tìm thấy ${filteredUsers.length} người dùng.`}
              </CardDescription>
              <div className="relative w-full max-w-sm pt-2">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input
                  placeholder="Tìm kiếm người dùng..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 bg-slate-800 border-slate-600"
                />
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                {loading ? (
                  <div className="flex justify-center items-center py-10">
                    <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow className="border-slate-700 hover:bg-slate-800/50">
                        <TableHead>Tên đăng nhập</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Vai trò</TableHead>
                        <TableHead>Trạng thái</TableHead>
                        <TableHead>Hoạt động cuối</TableHead>
                        <TableHead>IP cuối</TableHead>
                        <TableHead>Ngày tạo</TableHead>
                        <TableHead className="text-right">Hành động</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredUsers.map((user) => (
                        <TableRow key={user.id} className="border-slate-800 hover:bg-slate-800/50">
                          <TableCell className="font-medium">{user.username}</TableCell>
                          <TableCell>{user.email}</TableCell>
                          <TableCell>
                            <Badge variant={user.role_color || 'secondary'}>{user.role}</Badge>
                          </TableCell>
                          <TableCell>
                            <Badge variant={user.status === 'active' ? 'success' : 'destructive'}>
                              {user.status === 'active' ? 'Hoạt động' : 'Bị cấm'}
                            </Badge>
                          </TableCell>
                          <TableCell>{user.last_login ? formatDistanceToNow(new Date(user.last_login), { addSuffix: true, locale: vi }) : 'Chưa có'}</TableCell>
                          <TableCell className="font-mono">{user.last_ip || 'N/A'}</TableCell>
                          <TableCell>{user.created_at ? format(new Date(user.created_at), 'dd/MM/yyyy') : 'N/A'}</TableCell>
                          <TableCell className="text-right space-x-1">
                            <Button variant="ghost" size="icon" onClick={() => handleOpenNotificationModal(user)} disabled={!hasPermission('write')}>
                              <MessageSquare className="h-5 w-5 text-purple-400" />
                            </Button>
                            <Button variant="ghost" size="icon" onClick={() => handleOpenModal(user)} disabled={!hasPermission('write')}>
                              <Edit className="h-5 w-5 text-blue-500" />
                            </Button>
                            <Button variant="ghost" size="icon" onClick={() => handleToggleStatus(user)} disabled={!hasPermission('write')}>
                              {user.status === 'active' ? <Ban className="h-5 w-5 text-yellow-500" /> : <CheckCircle className="h-5 w-5 text-green-500" />}
                            </Button>
                            <Button variant="ghost" size="icon" onClick={() => handleConfirmDelete(user)} disabled={!hasPermission('super')}>
                              <Trash2 className="h-5 w-5 text-red-500" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </motion.div>

      <UserFormModal
        isOpen={isModalOpen}
        onOpenChange={setIsModalOpen}
        user={editingUser}
        onUserSaved={fetchUsers}
      />

      <NotificationModal
        isOpen={isNotificationModalOpen}
        onOpenChange={setIsNotificationModalOpen}
        user={notificationTargetUser}
      />

      <AlertDialog open={isAlertOpen} onOpenChange={setIsAlertOpen}>
        <AlertDialogContent className="bg-slate-900 border-slate-700">
          <AlertDialogHeader>
            <AlertDialogTitle>Bạn có chắc chắn muốn xóa?</AlertDialogTitle>
            <AlertDialogDescription>
              Hành động này sẽ xóa vĩnh viễn người dùng "{userToDelete?.username}". Không thể hoàn tác.
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

export default UsersPage;