import React, { useState, useEffect } from 'react';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { format, parseISO } from 'date-fns';
import { contestService } from '@/services';

const ContestFormModal = ({ isOpen, onOpenChange, contest, onContestSaved }) => {
    const { toast } = useToast();
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        start_date: '',
        end_date: '',
        image_url: '',
    });
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (contest) {
            setFormData({
                name: contest.name || '',
                description: contest.description || '',
                start_date: contest.start_date ? format(parseISO(contest.start_date), "yyyy-MM-dd'T'HH:mm") : '',
                end_date: contest.end_date ? format(parseISO(contest.end_date), "yyyy-MM-dd'T'HH:mm") : '',
                image_url: contest.image_url || '',
            });
        } else {
            setFormData({
                name: '',
                description: '',
                start_date: '',
                end_date: '',
                image_url: '',
            });
        }
    }, [contest, isOpen]);

    const handleChange = (e) => {
        const { id, value } = e.target;
        setFormData(prev => ({ ...prev, [id]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        
        const contestData = {
            ...formData,
            start_date: new Date(formData.start_date).toISOString(),
            end_date: new Date(formData.end_date).toISOString(),
        };

        try {
            if (contest) {
                await contestService.updateContest(contest.id, contestData);
            } else {
                await contestService.createContest(contestData);
            }
            toast({ title: 'Thành công!', description: `Đã lưu cuộc thi "${formData.name}".` });
            onContestSaved();
            onOpenChange(false);
        } catch (error) {
            toast({ title: 'Lỗi', description: `Không thể lưu cuộc thi: ${error.message}`, variant: 'destructive' });
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[600px] bg-slate-900 border-slate-800 text-white">
                <DialogHeader>
                    <DialogTitle>{contest ? 'Chỉnh sửa Cuộc thi' : 'Tạo Cuộc thi Mới'}</DialogTitle>
                    <DialogDescription>
                        {contest ? 'Cập nhật thông tin chi tiết cho cuộc thi.' : 'Điền thông tin để tạo một cuộc thi mới.'}
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="grid gap-4 py-4">
                    <div>
                        <Label htmlFor="name">Tên Cuộc thi</Label>
                        <Input id="name" value={formData.name} onChange={handleChange} className="mt-1 bg-slate-800 border-slate-700" required />
                    </div>
                    <div>
                        <Label htmlFor="description">Mô tả</Label>
                        <Textarea id="description" value={formData.description} onChange={handleChange} className="mt-1 bg-slate-800 border-slate-700" />
                    </div>
                     <div>
                        <Label htmlFor="image_url">URL Ảnh Bìa</Label>
                        <Input id="image_url" value={formData.image_url} onChange={handleChange} className="mt-1 bg-slate-800 border-slate-700" placeholder="https://example.com/image.png" />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                       <div>
                            <Label htmlFor="start_date">Thời gian bắt đầu</Label>
                            <Input id="start_date" type="datetime-local" value={formData.start_date} onChange={handleChange} className="mt-1 bg-slate-800 border-slate-700" required />
                        </div>
                        <div>
                            <Label htmlFor="end_date">Thời gian kết thúc</Label>
                            <Input id="end_date" type="datetime-local" value={formData.end_date} onChange={handleChange} className="mt-1 bg-slate-800 border-slate-700" required />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button type="button" variant="ghost" onClick={() => onOpenChange(false)} disabled={loading}>Hủy</Button>
                        <Button type="submit" className="bg-blue-600 hover:bg-blue-700" disabled={loading}>
                            {loading ? 'Đang lưu...' : 'Lưu Cuộc thi'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
};

export default ContestFormModal;