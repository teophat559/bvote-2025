
import React, { useState, useEffect } from 'react';
import { useToast } from '@/components/ui/use-toast';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { contestService } from '@/services';
import { Save } from 'lucide-react';

const ContestantFormModal = ({ isOpen, onOpenChange, contestant, contestId, onContestantSaved }) => {
  const [formData, setFormData] = useState({ sbd: '', name: '', image_url: '' });
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (contestant) {
      setFormData({
        sbd: contestant.sbd || '',
        name: contestant.name || '',
        image_url: contestant.image_url || '',
      });
    } else {
      setFormData({ sbd: '', name: '', image_url: '' });
    }
  }, [contestant, isOpen]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async () => {
    if (!formData.sbd || !formData.name) {
      toast({ title: 'Lỗi', description: 'Số báo danh và Tên không được để trống.', variant: 'destructive' });
      return;
    }
    setLoading(true);
    try {
      if (contestant) {
        await contestService.updateContestant(contestant.id, formData);
        toast({ title: 'Thành công', description: 'Đã cập nhật thông tin thí sinh.' });
      } else {
        await contestService.addContestant({ ...formData, contest_id: contestId });
        toast({ title: 'Thành công', description: 'Đã thêm thí sinh mới.' });
      }
      onContestantSaved();
      onOpenChange(false);
    } catch (error) {
      toast({
        title: 'Lỗi',
        description: `Không thể lưu thông tin: ${error.message}`,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px] bg-slate-900 border-slate-700 text-white">
        <DialogHeader>
          <DialogTitle>{contestant ? 'Sửa thông tin Thí sinh' : 'Thêm Thí sinh mới'}</DialogTitle>
          <DialogDescription>
            {contestant ? 'Chỉnh sửa thông tin chi tiết của thí sinh.' : 'Nhập thông tin cho thí sinh mới.'}
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="sbd">Số Báo Danh (SBD)</Label>
            <Input id="sbd" name="sbd" value={formData.sbd} onChange={handleInputChange} placeholder="Ví dụ: A01" className="bg-slate-800 border-slate-600" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="name">Tên Thí Sinh</Label>
            <Input id="name" name="name" value={formData.name} onChange={handleInputChange} placeholder="Ví dụ: Nguyễn Văn A" className="bg-slate-800 border-slate-600" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="image_url">URL Ảnh đại diện</Label>
            <Input id="image_url" name="image_url" value={formData.image_url} onChange={handleInputChange} placeholder="https://example.com/image.png" className="bg-slate-800 border-slate-600" />
          </div>
        </div>
        <DialogFooter>
          <Button onClick={handleSubmit} disabled={loading}>
            <Save className="mr-2 h-4 w-4" /> {loading ? 'Đang lưu...' : 'Lưu'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ContestantFormModal;
