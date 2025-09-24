import React, { useEffect, useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { motion } from 'framer-motion';
import { User, Mail, Phone, CheckCircle, XCircle, History, Loader, Shield } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { apiService } from '@/services/apiService';
import { toast } from 'react-hot-toast';
import { Link } from 'react-router-dom';
import Header from '@/components/home/Header';
import Footer from '@/components/home/Footer';
import { useAuth } from '@/context/AuthContext';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

const ProfilePage = () => {
    const { user, loading: authLoading } = useAuth();
    const [voteHistory, setVoteHistory] = useState(null);
    const [loadingHistory, setLoadingHistory] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (user) {
            const fetchVoteHistory = async () => {
                setLoadingHistory(true);
                try {
                    const history = await apiService.getUserVoteHistory();
                    setVoteHistory(history);
                } catch (err) {
                    setError(err.message);
                    toast.error(`Lỗi tải lịch sử bình chọn: ${err.message}`);
                } finally {
                    setLoadingHistory(false);
                }
            };
            fetchVoteHistory();
        }
    }, [user]);

    if (authLoading || !user) {
        return (
            <div className="min-h-screen bg-background text-foreground flex flex-col items-center justify-center">
                <Loader className="animate-spin h-12 w-12 text-primary" />
                <p className="mt-4">Đang tải hồ sơ...</p>
            </div>
        );
    }
    
    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
            className="min-h-screen flex flex-col bg-profile-bg text-foreground"
            style={{
                '--background': 'hsl(var(--profile-bg))',
                '--card': 'hsl(var(--profile-card))',
                '--border': 'hsl(var(--profile-border))',
                '--primary': 'hsl(var(--profile-primary))',
                '--highlight': 'hsl(var(--profile-highlight))',
            }}
        >
            <Helmet>
                <title>Hồ sơ của tôi | BVote Platform</title>
                <meta name="description" content="Xem thông tin hồ sơ cá nhân, trạng thái KYC và lịch sử bình chọn của bạn tại BVote Platform." />
                <meta property="og:title" content="Hồ sơ của tôi | BVote Platform" />
                <meta property="og:description" content="Xem thông tin hồ sơ cá nhân, trạng thái KYC và lịch sử bình chọn của bạn tại BVote Platform." />
            </Helmet>
            <Header />

            <main className="flex-grow container mx-auto px-4 py-8">
                <motion.div 
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                    className="flex flex-col md:flex-row items-center gap-8 mb-12"
                >
                    <Avatar className="w-32 h-32 border-4 border-primary shadow-lg">
                        <AvatarImage src={user.avatar} alt={user.name} />
                        <AvatarFallback className="text-5xl">{user.name ? user.name.charAt(0) : 'U'}</AvatarFallback>
                    </Avatar>
                    <div className="text-center md:text-left">
                        <h1 className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-primary to-highlight">
                            {user.name || "Người dùng"}
                        </h1>
                        <p className="text-muted-foreground mt-2">{user.email}</p>
                    </div>
                </motion.div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    <motion.div
                        className="md:col-span-1"
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.5, delay: 0.1 }}
                    >
                        <Card className="bg-card/80 border-border/50">
                            <CardHeader>
                                <CardTitle className="text-2xl text-card-foreground flex items-center">
                                    <User className="mr-2" /> Thông tin cá nhân
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div>
                                    <p className="text-sm text-muted-foreground">Tên người dùng</p>
                                    <p className="text-lg font-semibold">{user.name || 'N/A'}</p>
                                </div>
                                <div>
                                    <p className="text-sm text-muted-foreground">Số điện thoại</p>
                                    <p className="text-lg font-semibold flex items-center">
                                        <Phone className="w-4 h-4 mr-2 text-muted-foreground" />
                                        {user.phone || 'Chưa cập nhật'}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-sm text-muted-foreground">Trạng thái KYC</p>
                                    <p className={`text-lg font-semibold flex items-center ${user.kycStatus === 'verified' ? 'text-green-400' : 'text-yellow-400'}`}>
                                        {user.kycStatus === 'verified' ? <CheckCircle className="w-4 h-4 mr-2" /> : <XCircle className="w-4 h-4 mr-2" />}
                                        {user.kycStatus === 'verified' ? 'Đã xác minh' : 'Chưa xác minh'}
                                    </p>
                                    {user.kycStatus !== 'verified' && (
                                        <Link to="/kyc">
                                            <Button variant="glow" className="mt-2">
                                                Xác minh ngay
                                            </Button>
                                        </Link>
                                    )}
                                </div>
                                 {user.role === 'admin' && (
                                     <div>
                                        <p className="text-sm text-muted-foreground">Vai trò</p>
                                        <p className="text-lg font-semibold flex items-center text-primary">
                                            <Shield className="w-4 h-4 mr-2" /> Quản trị viên
                                        </p>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </motion.div>

                    <motion.div
                        className="md:col-span-2"
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.5, delay: 0.2 }}
                    >
                        <Card className="bg-card/80 border-border/50">
                            <CardHeader>
                                <CardTitle className="text-2xl text-card-foreground flex items-center">
                                    <History className="mr-2" /> Lịch sử bình chọn
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                {loadingHistory ? (
                                    <div className="space-y-4">
                                        <Skeleton className="h-20 w-full bg-muted" />
                                        <Skeleton className="h-20 w-full bg-muted" />
                                    </div>
                                ) : error ? (
                                    <p className="text-destructive text-center py-4">Lỗi tải lịch sử.</p>
                                ) : voteHistory && voteHistory.length > 0 ? (
                                    <ul className="space-y-3 max-h-[400px] overflow-y-auto pr-2">
                                        {voteHistory.map((vote, index) => (
                                            <li key={index} className="bg-secondary/30 p-4 rounded-lg border border-border/50">
                                                <p className="font-semibold text-lg">{vote.contestantName}</p>
                                                <p className="text-sm text-muted-foreground">Cuộc thi: {vote.contestName}</p>
                                                <p className="text-sm text-muted-foreground">Số phiếu: <span className="font-bold text-primary">{vote.votes}</span></p>
                                                <p className="text-xs text-muted-foreground/70">Thời gian: {new Date(vote.timestamp).toLocaleString('vi-VN')}</p>
                                            </li>
                                        ))}
                                    </ul>
                                ) : (
                                    <p className="text-muted-foreground text-center py-4">Bạn chưa có lịch sử bình chọn nào.</p>
                                )}
                            </CardContent>
                        </Card>
                    </motion.div>
                </div>
            </main>

            <Footer />
        </motion.div>
    );
};

export default ProfilePage;
