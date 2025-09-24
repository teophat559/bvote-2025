import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { Save, Eye } from 'lucide-react';

const CONTEST_UI_SETTINGS_KEY = 'contestPublicPageUISettings';

const defaultSettings = {
  heading: 'Bình chọn cho Thí sinh yêu thích của bạn',
  backgroundColor: '#020817',
  textColor: '#e2e8f0',
  voteButtonText: 'Bình chọn',
  votedButtonText: 'Đã bình chọn',
  cardBackgroundColor: '#1e293b',
  cardTextColor: '#e2e8f0',
};

const ContestInterfaceSettings = () => {
    const [settings, setSettings] = useState(defaultSettings);
    const [loading, setLoading] = useState(false);
    const { toast } = useToast();

    useEffect(() => {
        const savedSettings = localStorage.getItem(CONTEST_UI_SETTINGS_KEY);
        if (savedSettings) {
            setSettings(JSON.parse(savedSettings));
        }
    }, []);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setSettings(prev => ({ ...prev, [name]: value }));
    };

    const handleSave = () => {
        setLoading(true);
        try {
            localStorage.setItem(CONTEST_UI_SETTINGS_KEY, JSON.stringify(settings));
            toast({
                title: 'Đã lưu thành công!',
                description: 'Cài đặt giao diện trang bình chọn đã được cập nhật.',
            });
        } catch (error) {
            toast({
                title: 'Lỗi',
                description: 'Không thể lưu cài đặt. Vui lòng thử lại.',
                variant: 'destructive',
            });
        } finally {
            setLoading(false);
        }
    };
    
    const openPreview = () => {
        // We'll use the first contest as a preview example.
        const previewUrl = `/contests/contest_1/vote?preview=true&t=${Date.now()}`;
        window.open(previewUrl, '_blank', 'noopener,noreferrer');
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="space-y-6"
        >
            <header className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-slate-100">Cài Đặt Giao Diện Thí Sinh</h1>
                    <p className="text-slate-400 mt-1">Tùy chỉnh giao diện trang bình chọn công khai cho các cuộc thi.</p>
                </div>
                <Button onClick={openPreview}>
                    <Eye className="mr-2 h-4 w-4" /> Xem trước
                </Button>
            </header>

            <Card className="bg-slate-900/50 border-slate-700">
                <CardHeader>
                    <CardTitle>Tùy chỉnh Giao diện Trang Bình chọn</CardTitle>
                    <CardDescription>Thay đổi văn bản và màu sắc của trang bình chọn.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="grid md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <Label htmlFor="backgroundColor">Màu nền trang (Hex)</Label>
                            <Input id="backgroundColor" name="backgroundColor" value={settings.backgroundColor} onChange={handleInputChange} placeholder="#020817" className="bg-slate-800 border-slate-600" />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="textColor">Màu chữ trang (Hex)</Label>
                            <Input id="textColor" name="textColor" value={settings.textColor} onChange={handleInputChange} placeholder="#e2e8f0" className="bg-slate-800 border-slate-600" />
                        </div>
                         <div className="space-y-2">
                            <Label htmlFor="cardBackgroundColor">Màu nền thẻ thí sinh (Hex)</Label>
                            <Input id="cardBackgroundColor" name="cardBackgroundColor" value={settings.cardBackgroundColor} onChange={handleInputChange} placeholder="#1e293b" className="bg-slate-800 border-slate-600" />
                        </div>
                         <div className="space-y-2">
                            <Label htmlFor="cardTextColor">Màu chữ thẻ thí sinh (Hex)</Label>
                            <Input id="cardTextColor" name="cardTextColor" value={settings.cardTextColor} onChange={handleInputChange} placeholder="#e2e8f0" className="bg-slate-800 border-slate-600" />
                        </div>
                    </div>
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="heading">Tiêu đề chính</Label>
                            <Input id="heading" name="heading" value={settings.heading} onChange={handleInputChange} className="bg-slate-800 border-slate-600" />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="voteButtonText">Văn bản nút bình chọn</Label>
                            <Input id="voteButtonText" name="voteButtonText" value={settings.voteButtonText} onChange={handleInputChange} className="bg-slate-800 border-slate-600" />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="votedButtonText">Văn bản nút đã bình chọn</Label>
                            <Input id="votedButtonText" name="votedButtonText" value={settings.votedButtonText} onChange={handleInputChange} className="bg-slate-800 border-slate-600" />
                        </div>
                    </div>
                    <div className="flex justify-end">
                        <Button onClick={handleSave} disabled={loading}>
                            <Save className="mr-2 h-4 w-4" /> {loading ? 'Đang lưu...' : 'Lưu thay đổi'}
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </motion.div>
    );
};

export default ContestInterfaceSettings;