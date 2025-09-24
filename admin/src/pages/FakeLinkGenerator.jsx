import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Link2, Copy, Trash2, PlusCircle } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { formatDistanceToNow } from 'date-fns';
import { vi } from 'date-fns/locale';

const itemVariants = {
  hidden: { y: 20, opacity: 0 },
  visible: { y: 0, opacity: 1 },
};

const FakeLinkGenerator = () => {
  const [adminName, setAdminName] = useState('');
  const [generatedLink, setGeneratedLink] = useState('');
  const [links, setLinks] = useState([]);
  const { toast } = useToast();

  const handleGenerate = () => {
    if (!adminName) {
      toast({
        title: 'Tên admin không hợp lệ',
        description: 'Vui lòng nhập tên admin để tạo link.',
        variant: 'destructive',
      });
      return;
    }
    const safeName = encodeURIComponent(adminName.replace(/\s+/g, '-').toLowerCase());
    const fakeLink = `${window.location.origin}/ref/${safeName}`;
    setGeneratedLink(fakeLink);
  };
  
  const handleAddLink = () => {
     if (!generatedLink) {
         handleGenerate();
         if(!adminName) return;
     }

    const newLink = {
        id: Date.now(),
        adminName: adminName,
        link: generatedLink,
        clicks: 0,
        createdAt: new Date(),
    };
    
    setLinks(prev => [newLink, ...prev]);
    setAdminName('');
    setGeneratedLink('');
    toast({
        title: 'Đã thêm link mới!',
        description: `Link cho admin "${adminName}" đã được tạo và thêm vào danh sách.`
    });
  };

  const handleCopy = (link) => {
    navigator.clipboard.writeText(link);
    toast({
      title: 'Đã sao chép!',
      description: 'Link đã được sao chép vào clipboard.',
    });
  };

  const handleDelete = (id) => {
    setLinks(prev => prev.filter(link => link.id !== id));
    toast({ title: 'Đã xóa!', description: 'Link đã được xóa khỏi danh sách.' });
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
          <h1 className="text-3xl font-bold tracking-tight text-slate-100">Tạo Link Phụ</h1>
          <p className="text-slate-400 mt-1">Tạo và quản lý các link giới thiệu riêng biệt cho từng admin.</p>
        </header>
      </motion.div>

      <motion.div variants={itemVariants}>
        <Card className="bg-slate-900/50 border-slate-700">
          <CardHeader>
            <CardTitle>Công cụ tạo Link</CardTitle>
            <CardDescription>Nhập tên admin để tạo một link theo dõi duy nhất.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="adminName">Tên Admin</Label>
              <Input
                id="adminName"
                type="text"
                placeholder="Ví dụ: Admin Huy"
                value={adminName}
                onChange={(e) => setAdminName(e.target.value)}
                className="bg-slate-800 border-slate-600"
              />
            </div>
            <div className="flex flex-wrap gap-2">
                <Button onClick={handleGenerate} className="bg-indigo-600 hover:bg-indigo-700">
                <Link2 className="mr-2 h-4 w-4" />
                Tạo Link
                </Button>
                <Button onClick={handleAddLink} variant="secondary">
                <PlusCircle className="mr-2 h-4 w-4" />
                Thêm vào danh sách
                </Button>
            </div>
            {generatedLink && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="pt-4 space-y-2"
              >
                <Label>Xem trước Link đã tạo</Label>
                <div className="flex items-center space-x-2">
                  <Input
                    value={generatedLink}
                    readOnly
                    className="bg-slate-800 border-slate-600 font-mono"
                  />
                  <Button variant="ghost" size="icon" onClick={() => handleCopy(generatedLink)}>
                    <Copy className="h-5 w-5" />
                  </Button>
                </div>
              </motion.div>
            )}
          </CardContent>
        </Card>
      </motion.div>

        <motion.div variants={itemVariants}>
            <Card className="bg-slate-900/50 border-slate-700">
                <CardHeader>
                    <CardTitle>Danh sách Links đã tạo</CardTitle>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow className="border-slate-700">
                                <TableHead>Admin</TableHead>
                                <TableHead>Link</TableHead>
                                <TableHead>Lượt click</TableHead>
                                <TableHead>Ngày tạo</TableHead>
                                <TableHead className="text-right">Hành động</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {links.map(link => (
                                <TableRow key={link.id} className="border-slate-800">
                                    <TableCell className="font-semibold">{link.adminName}</TableCell>
                                    <TableCell className="font-mono text-sm">{link.link}</TableCell>
                                    <TableCell>
                                        <Badge variant="info">{link.clicks}</Badge>
                                    </TableCell>
                                    <TableCell>{formatDistanceToNow(link.createdAt, { addSuffix: true, locale: vi })}</TableCell>
                                    <TableCell className="text-right space-x-2">
                                        <Button variant="ghost" size="icon" onClick={() => handleCopy(link.link)}><Copy className="h-4 w-4" /></Button>
                                        <Button variant="ghost" size="icon" onClick={() => handleDelete(link.id)}><Trash2 className="h-4 w-4 text-red-500" /></Button>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </motion.div>
    </motion.div>
  );
};

export default FakeLinkGenerator;