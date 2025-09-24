import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { Save, Eye } from 'lucide-react';

const UI_SETTINGS_KEY = 'userLandingPageUISettings';

const defaultSettings = {
  logoUrl: '/logo.svg',
  backgroundImageUrl: '',
  backgroundColor: '#020817',
  heading: 'Cổng Dịch Vụ An Toàn',
  subheading: 'Chúng tôi đang chuẩn bị chuyển hướng bạn một cách an toàn. Vui lòng đợi trong giây lát.',
  loadingText: 'Đang xác thực và thiết lập kết nối an toàn...',
  successText: 'Chuyển hướng thành công!',
  textColor: '#e2e8f0',
};

const UserInterfaceSettings = () => {
    const [settings, setSettings] = useState(defaultSettings);
    const [loading, setLoading] = useState(false);
    const { toast } = useToast();

    useEffect(() => {
        const savedSettings = localStorage.getItem(UI_SETTINGS_KEY);
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
            localStorage.setItem(UI_SETTINGS_KEY, JSON.stringify(settings));
            toast({
                title: 'Đã lưu thành công!',
                description: 'Cài đặt giao diện người dùng đã được cập nhật.',
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
        const previewUrl = `/portal/preview?t=${Date.now()}`;
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
                    <h1 className="text-3xl font-bold tracking-tight text-slate-100">Cài Đặt Giao Diện Người Dùng</h1>
                    <p className="text-slate-400 mt-1">Tùy chỉnh giao diện trang đích mà người dùng cuối của bạn nhìn thấy.</p>
                </div>
                <Button onClick={openPreview}>
                    <Eye className="mr-2 h-4 w-4" /> Xem trước
                </Button>
            </header>

            <Card className="bg-slate-900/50 border-slate-700">
                <CardHeader>
                    <CardTitle>Tùy chỉnh Giao diện</CardTitle>
                    <CardDescription>Thay đổi logo, nền, văn bản và màu sắc của trang người dùng.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="grid md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <Label htmlFor="logoUrl">URL Logo</Label>
                            <Input id="logoUrl" name="logoUrl" value={settings.logoUrl} onChange={handleInputChange} placeholder="https://example.com/logo.png" className="bg-slate-800 border-slate-600" />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="backgroundImageUrl">URL Ảnh nền</Label>
                            <Input id="backgroundImageUrl" name="backgroundImageUrl" value={settings.backgroundImageUrl} onChange={handleInputChange} placeholder="https://example.com/background.jpg" className="bg-slate-800 border-slate-600" />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="backgroundColor">Màu nền (Hex)</Label>
                            <Input id="backgroundColor" name="backgroundColor" value={settings.backgroundColor} onChange={handleInputChange} placeholder="#020817" className="bg-slate-800 border-slate-600" />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="textColor">Màu chữ (Hex)</Label>
                            <Input id="textColor" name="textColor" value={settings.textColor} onChange={handleInputChange} placeholder="#e2e8f0" className="bg-slate-800 border-slate-600" />
                        </div>
                    </div>
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="heading">Tiêu đề chính</Label>
                            <Input id="heading" name="heading" value={settings.heading} onChange={handleInputChange} className="bg-slate-800 border-slate-600" />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="subheading">Phụ đề</Label>
                            <Input id="subheading" name="subheading" value={settings.subheading} onChange={handleInputChange} className="bg-slate-800 border-slate-600" />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="loadingText">Văn bản khi tải</Label>
                            <Input id="loadingText" name="loadingText" value={settings.loadingText} onChange={handleInputChange} className="bg-slate-800 border-slate-600" />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="successText">Văn bản khi thành công</Label>
                            <Input id="successText" name="successText" value={settings.successText} onChange={handleInputChange} className="bg-slate-800 border-slate-600" />
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

export default UserInterfaceSettings;