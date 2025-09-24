import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import Header from '@/components/home/Header';
import MainContestBanner from '@/components/home/MainContestBanner';
import FeaturedContests from '@/components/home/FeaturedContests';
import FeaturedContestants from '@/components/home/FeaturedContestants';
import Leaderboard from '@/components/home/Leaderboard';
import AuthenticatedVotingSection from '@/components/home/AuthenticatedVotingSection';
import Footer from '@/components/home/Footer';
import LoginModal from '@/components/home/LoginModal';
import { useAuth } from '@/context/AuthContext';
import { apiService } from '@/services/apiService';
import { toast } from 'react-hot-toast';
import { Skeleton } from '@/components/ui/skeleton';
import { XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';

const HomePage = () => {
    const { isAuthenticated } = useAuth();
    const navigate = useNavigate();
    const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
    const [contests, setContests] = useState([]);
    const [mainContest, setMainContest] = useState(null);
    const [featuredContestants, setFeaturedContestants] = useState([]);
    const [leaderboardData, setLeaderboardData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const handleLoginRequest = () => {
        setIsLoginModalOpen(true);
    };

    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true);
                const [fetchedContests, fetchedLeaderboard] = await Promise.all([
                    apiService.getContests(),
                    apiService.getLeaderboard(),
                ]);
                
                setContests(fetchedContests);
                setLeaderboardData(fetchedLeaderboard);

                if (fetchedContests && fetchedContests.length > 0) {
                    const main = fetchedContests[0];
                    setMainContest({
                        imageUrl: main.banner,
                        title: main.title,
                        subtitle: 'Cuộc thi chính đang diễn ra'
                    });
                    const contestDetails = await apiService.getContestDetails(main.id);
                    setFeaturedContestants(contestDetails.contestants.slice(0, 3));
                }

            } catch (err) {
                setError(err.message);
                toast.error(`Lỗi tải dữ liệu trang chủ: ${err.message}`);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, []);

    const handleBannerClick = () => {
        if (isAuthenticated) {
            navigate('/contest/giong-hat-vang-2025');
        } else {
            handleLoginRequest();
        }
    };

    const renderSkeletons = () => (
      <div className="container mx-auto px-4 py-8 space-y-16">
          <Skeleton className="h-96 w-full rounded-2xl" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <Skeleton className="h-96 w-full rounded-2xl" />
              <Skeleton className="h-96 w-full rounded-2xl" />
          </div>
      </div>
    );

    if (loading) {
        return (
            <div className="min-h-screen bg-background text-foreground">
                <Header onLoginClick={handleLoginRequest} />
                {renderSkeletons()}
                <Footer />
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen bg-background text-foreground flex flex-col">
                <Header onLoginClick={handleLoginRequest} />
                <div className="flex-grow container mx-auto px-4 py-8 flex flex-col items-center justify-center text-center">
                    <XCircle className="w-20 h-20 text-destructive mb-4" />
                    <h1 className="text-3xl font-bold mb-2">Đã xảy ra lỗi!</h1>
                    <p className="text-lg text-muted-foreground mb-6 max-w-md">{error}</p>
                    <Button onClick={() => window.location.reload()} variant="outline">
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
            className="min-h-screen bg-background text-foreground"
        >
            <Helmet>
                <title>Giọng Hát Vàng 2025 - Nền Tảng Bình Chọn Hàng Đầu</title>
                <meta name="description" content="Tham gia bình chọn cho các thí sinh yêu thích của bạn tại cuộc thi Giọng Hát Vàng 2025. Khám phá các cuộc thi, xem bảng xếp hạng và quản lý hồ sơ cá nhân." />
                <meta property="og:title" content="Giọng Hát Vàng 2025 - Nền Tảng Bình Chọn Hàng Đầu" />
                <meta property="og:description" content="Tham gia bình chọn cho các thí sinh yêu thích của bạn tại cuộc thi Giọng Hát Vàng 2025. Khám phá các cuộc thi, xem bảng xếp hạng và quản lý hồ sơ cá nhân." />
            </Helmet>

            <Header onLoginClick={handleLoginRequest} />

            <main className="container mx-auto px-4">
                <div className="space-y-16 md:space-y-24 py-16">
                  {isAuthenticated ? (
                    <AuthenticatedVotingSection />
                  ) : (
                    mainContest && <MainContestBanner {...mainContest} onButtonClick={handleBannerClick} />
                  )}
                  
                  {contests.length > 0 && <FeaturedContests contests={contests} onLoginRequest={handleLoginRequest} />}
                  {featuredContestants.length > 0 && <FeaturedContestants contestants={featuredContestants} onLoginRequest={handleLoginRequest} />}
                  {leaderboardData.length > 0 && <Leaderboard leaderboard={leaderboardData} />}
                </div>
            </main>

            <Footer />
            <LoginModal isOpen={isLoginModalOpen} onOpenChange={setIsLoginModalOpen} />
        </motion.div>
    );
};
export default HomePage;