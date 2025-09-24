
import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { motion } from 'framer-motion';
import { Calendar, Users, Mic, ChevronRight, XCircle } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { apiService } from '@/services/apiService';
import { toast } from 'react-hot-toast';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import Header from '@/components/home/Header';
import Footer from '@/components/home/Footer';

const ContestDetailsPage = () => {
    const { contestId } = useParams();
    const [contest, setContest] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchContestDetails = async () => {
            try {
                const data = await apiService.getContestDetails(contestId);
                setContest(data);
            } catch (err) {
                setError(err.message);
                toast.error(`Lỗi tải chi tiết cuộc thi: ${err.message}`);
            } finally {
                setLoading(false);
            }
        };

        fetchContestDetails();
    }, [contestId]);

    const handleNotImplemented = () => {
      toast("🚧 Chức năng này chưa được phát triển—nhưng đừng lo! Bạn có thể yêu cầu trong lần tương tác tới! 🚀", { icon: '🚧' });
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-background text-foreground">
                <Header />
                <div className="container mx-auto px-4 py-8">
                    <Skeleton className="h-[300px] w-full rounded-lg mb-8 bg-muted" />
                    <Skeleton className="h-10 w-3/4 mb-4 bg-muted" />
                    <Skeleton className="h-6 w-1/2 mb-8 bg-muted" />
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                        {[...Array(6)].map((_, i) => (
                            <Skeleton key={i} className="h-[250px] w-full rounded-lg bg-muted" />
                        ))}
                    </div>
                </div>
                <Footer />
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen bg-background text-white flex flex-col">
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

    if (!contest) {
        return (
            <div className="min-h-screen bg-background text-white flex flex-col">
                <Header />
                <div className="flex-grow container mx-auto px-4 py-8 flex flex-col items-center justify-center">
                    <XCircle className="w-24 h-24 text-muted-foreground mb-4" />
                    <h1 className="text-3xl font-bold mb-4">Không tìm thấy cuộc thi!</h1>
                    <p className="text-lg text-muted-foreground text-center">Cuộc thi bạn đang tìm kiếm không tồn tại hoặc đã kết thúc.</p>
                     <Link to="/">
                        <Button variant="glow" className="mt-6">
                            Quay về trang chủ
                        </Button>
                    </Link>
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
            className="min-h-screen flex flex-col bg-contest-bg text-foreground"
            style={{
                '--background': 'hsl(var(--contest-bg))',
                '--card': 'hsl(var(--contest-card))',
                '--border': 'hsl(var(--contest-border))',
                '--primary': 'hsl(var(--contest-primary))',
                '--highlight': 'hsl(var(--contest-highlight))',
            }}
        >
            <Helmet>
                <title>{contest.title} | BVote Platform</title>
                <meta name="description" content={contest.description} />
                <meta property="og:title" content={contest.title} />
                <meta property="og:description" content={contest.description} />
            </Helmet>
            <Header />

            <main className="flex-grow">
                <motion.div
                    initial={{ opacity: 0, y: -50 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                    className="relative w-full h-[400px] md:h-[720px] overflow-hidden"
                >
                    <img alt={`Banner cuộc thi ${contest.title}`} className="w-full h-full object-cover object-center" src={contest.banner} />
                    <div className="absolute inset-0 bg-black/60 flex items-center justify-center p-4">
                        <h1 className="text-4xl md:text-6xl font-extrabold text-white text-center leading-tight drop-shadow-lg">
                            {contest.title}
                        </h1>
                    </div>
                </motion.div>

                <div className="container mx-auto px-4 py-8">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, delay: 0.2 }}
                        className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12"
                    >
                        <Card className="bg-card/80 border-border/50 p-6 flex flex-col items-center text-center">
                            <Calendar className="w-12 h-12 text-primary mb-3" />
                            <CardTitle className="text-xl text-card-foreground">Thời gian</CardTitle>
                            <CardContent className="text-muted-foreground text-sm mt-2 p-0">
                                {new Date(contest.startDate).toLocaleDateString('vi-VN')} - {new Date(contest.endDate).toLocaleDateString('vi-VN')}
                            </CardContent>
                        </Card>
                        <Card className="bg-card/80 border-border/50 p-6 flex flex-col items-center text-center">
                            <Users className="w-12 h-12 text-primary mb-3" />
                            <CardTitle className="text-xl text-card-foreground">Thí sinh</CardTitle>
                            <CardContent className="text-muted-foreground text-sm mt-2 p-0">
                                {contest.contestants.length} thí sinh tham gia
                            </CardContent>
                        </Card>
                        <Card className="bg-card/80 border-border/50 p-6 flex flex-col items-center text-center">
                            <Mic className="w-12 h-12 text-primary mb-3" />
                            <CardTitle className="text-xl text-card-foreground">Trạng thái</CardTitle>
                            <CardContent className="text-muted-foreground text-sm mt-2 p-0">
                                {contest.status === 'active' ? 'Đang diễn ra' : 'Đã kết thúc'}
                            </CardContent>
                        </Card>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, delay: 0.3 }}
                        className="mb-12"
                    >
                        <h2 className="text-3xl font-bold mb-4 text-transparent bg-clip-text bg-gradient-to-r from-primary to-highlight">Mô tả cuộc thi</h2>
                        <p className="text-lg text-muted-foreground leading-relaxed">
                            {contest.description}
                        </p>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, delay: 0.4 }}
                    >
                        <h2 className="text-3xl font-bold mb-6 text-transparent bg-clip-text bg-gradient-to-r from-primary to-highlight">Thí sinh tham gia</h2>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                            {contest.contestants.map((contestant, index) => (
                                <motion.div
                                    key={contestant.id}
                                    initial={{ opacity: 0, scale: 0.9 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    transition={{ duration: 0.3, delay: index * 0.05 }}
                                >
                                    <Card className="bg-card/80 border-border/50 overflow-hidden h-full flex flex-col group">
                                        <Avatar className="w-full h-48 rounded-t-lg rounded-b-none">
                                            <AvatarImage src={contestant.avatar} alt={`Ảnh của ${contestant.name}`} className="w-full h-full object-cover"/>
                                            <AvatarFallback className="text-4xl rounded-none">{contestant.name.charAt(0)}</AvatarFallback>
                                        </Avatar>
                                        <CardContent className="p-4 flex flex-col flex-grow">
                                            <h3 className="text-xl font-semibold mb-2 text-card-foreground">{contestant.name}</h3>
                                            <p className="text-sm text-muted-foreground mb-3 line-clamp-2 flex-grow">{contestant.bio}</p>
                                            <div className="flex justify-between items-center mt-auto">
                                                <span className="text-lg font-bold text-highlight">{contestant.votes.toLocaleString('vi-VN')} phiếu</span>
                                                <Button onClick={handleNotImplemented} variant="glow">
                                                    Bình chọn <ChevronRight className="ml-1 w-4 h-4" />
                                                </Button>
                                            </div>
                                        </CardContent>
                                    </Card>
                                </motion.div>
                            ))}
                        </div>
                        {contest.contestants.length === 0 && (
                            <p className="text-muted-foreground text-center py-8">Chưa có thí sinh nào tham gia cuộc thi này.</p>
                        )}
                    </motion.div>
                </div>
            </main>
            <Footer />
        </motion.div>
    );
};

export default ContestDetailsPage;
