import React, { useEffect, useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { motion } from 'framer-motion';
import { Trophy, ChevronRight, XCircle } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { apiService } from '@/services/apiService';
import { toast } from 'react-hot-toast';
import { Link } from 'react-router-dom';
import Header from '@/components/home/Header';
import Footer from '@/components/home/Footer';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

const LeaderboardPage = () => {
    const [leaderboard, setLeaderboard] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchLeaderboard = async () => {
            try {
                const data = await apiService.getLeaderboard();
                setLeaderboard(data);
            } catch (err) {
                setError(err.message);
                toast.error(`Lỗi tải bảng xếp hạng: ${err.message}`);
            } finally {
                setLoading(false);
            }
        };

        fetchLeaderboard();
    }, []);

    const getTrophyColor = (rank) => {
        if (rank === 1) return 'text-yellow-400';
        if (rank === 2) return 'text-slate-300';
        if (rank === 3) return 'text-amber-600';
        return 'text-primary';
    }

    if (loading) {
        return (
            <div className="min-h-screen bg-background text-foreground">
                <Header />
                <div className="container mx-auto px-4 py-8">
                    <Skeleton className="h-12 w-1/2 mx-auto mb-8 bg-muted" />
                    <div className="max-w-3xl mx-auto space-y-4">
                        {[...Array(5)].map((_, i) => (
                            <div key={i} className="flex items-center space-x-4 p-3 bg-muted rounded-lg">
                                <Skeleton className="h-12 w-12 rounded-full bg-secondary" />
                                <div className="flex-1 space-y-2">
                                    <Skeleton className="h-4 w-3/4 bg-secondary" />
                                    <Skeleton className="h-4 w-1/2 bg-secondary" />
                                </div>
                                <Skeleton className="h-6 w-16 bg-secondary" />
                            </div>
                        ))}
                    </div>
                </div>
                <Footer />
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen bg-background text-foreground flex flex-col">
                 <Header />
                <div className="flex-grow container mx-auto px-4 py-8 flex flex-col items-center justify-center">
                    <XCircle className="w-24 h-24 text-destructive mb-4" />
                    <h1 className="text-3xl font-bold mb-4">Đã xảy ra lỗi!</h1>
                    <p className="text-lg text-muted-foreground text-center">{error}</p>
                    <Button onClick={() => window.location.reload()} variant="glow">
                        Thử lại
                    </Button>
                </div>
                <Footer />
            </div>
        );
    }

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
            className="min-h-screen flex flex-col bg-leaderboard-bg text-foreground"
            style={{
                '--background': 'hsl(var(--leaderboard-bg))',
                '--card': 'hsl(var(--leaderboard-card))',
                '--border': 'hsl(var(--leaderboard-border))',
                '--primary': 'hsl(var(--leaderboard-primary))',
                '--highlight': 'hsl(var(--leaderboard-highlight))',
            }}
        >
            <Helmet>
                <title>Bảng xếp hạng | BVote Platform</title>
                <meta name="description" content="Xem bảng xếp hạng tổng thể các thí sinh được bình chọn nhiều nhất tại BVote Platform." />
                <meta property="og:title" content="Bảng xếp hạng | BVote Platform" />
                <meta property="og:description" content="Xem bảng xếp hạng tổng thể các thí sinh được bình chọn nhiều nhất tại BVote Platform." />
            </Helmet>
            <Header />

            <main className="flex-grow container mx-auto px-4 py-8">
                 <motion.h1
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                    className="text-4xl font-bold mb-8 text-center text-transparent bg-clip-text bg-gradient-to-r from-primary to-highlight"
                >
                    Bảng Xếp Hạng Toàn Cuộc
                </motion.h1>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.1 }}
                    className="max-w-3xl mx-auto"
                >
                    <Card className="bg-card/80 border-border/50">
                        <CardHeader>
                            <CardTitle className="text-2xl text-card-foreground flex items-center">
                                <Trophy className="mr-3 text-yellow-400" /> Top Thí Sinh
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            {leaderboard.length > 0 ? (
                                <ul className="space-y-4">
                                    {leaderboard.map((item, index) => (
                                        <motion.li
                                            key={item.id}
                                            initial={{ opacity: 0, x: -20 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            transition={{ duration: 0.3, delay: index * 0.05 }}
                                            className="flex items-center p-4 bg-secondary/30 rounded-lg shadow-md border border-border/50 hover:bg-secondary/50 transition-colors duration-200"
                                        >
                                            <div className={`font-bold text-2xl mr-4 w-10 text-center ${getTrophyColor(item.rank)}`}>
                                                {item.rank <= 3 ? <Trophy className="w-8 h-8 mx-auto"/> : `#${item.rank}`}
                                            </div>
                                            <Avatar className="w-12 h-12 rounded-full object-cover mr-4 border-2 border-primary">
                                                <AvatarImage src={item.avatar} alt={`Ảnh của ${item.name}`} />
                                                <AvatarFallback>{item.name.charAt(0)}</AvatarFallback>
                                            </Avatar>
                                            <div className="flex-1">
                                                <p className="font-semibold text-lg">{item.name}</p>
                                                <p className="text-sm text-muted-foreground">Tổng phiếu: <span className="font-bold text-highlight">{item.votes.toLocaleString('vi-VN')}</span></p>
                                            </div>
                                            <Link to={`/contest/${item.contestId}`}>
                                                <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-primary">
                                                    <ChevronRight className="w-5 h-5" />
                                                </Button>
                                            </Link>
                                        </motion.li>
                                    ))}
                                </ul>
                            ) : (
                                <p className="text-muted-foreground text-center py-4">Chưa có dữ liệu bảng xếp hạng.</p>
                            )}
                        </CardContent>
                    </Card>
                </motion.div>
            </main>
            <Footer />
        </motion.div>
    );
};

export default LeaderboardPage;
