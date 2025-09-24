import React, { useState, useEffect, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Helmet } from 'react-helmet';
import { useToast } from '@/components/ui/use-toast';
import { contestService } from '@/services';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { RefreshCw, Vote } from 'lucide-react';

const CONTEST_UI_SETTINGS_KEY = 'contestPublicPageUISettings';
const VOTE_STORAGE_PREFIX = 'contest_vote_';

const defaultSettings = {
  heading: 'Bình chọn cho Thí sinh yêu thích của bạn',
  backgroundColor: '#020817',
  textColor: '#e2e8f0',
  voteButtonText: 'Bình chọn',
  votedButtonText: 'Đã bình chọn',
  cardBackgroundColor: '#1e293b',
  cardTextColor: '#e2e8f0',
};

const PublicContestPage = () => {
    const { id } = useParams();
    const [contest, setContest] = useState(null);
    const [contestants, setContestants] = useState([]);
    const [loading, setLoading] = useState(true);
    const [votedContestantId, setVotedContestantId] = useState(null);
    const [uiSettings, setUiSettings] = useState(defaultSettings);
    const { toast } = useToast();

    useEffect(() => {
        const savedSettings = localStorage.getItem(CONTEST_UI_SETTINGS_KEY);
        if (savedSettings) {
            setUiSettings(JSON.parse(savedSettings));
        }
        const savedVote = localStorage.getItem(`${VOTE_STORAGE_PREFIX}${id}`);
        if(savedVote) {
            setVotedContestantId(savedVote);
        }
    }, [id]);

    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            const [contestData, contestantsData] = await Promise.all([
                contestService.getContestById(id),
                contestService.getContestantsByContestId(id)
            ]);
            setContest(contestData);
            setContestants(contestantsData);
        } catch (error) {
            toast({ title: 'Lỗi', description: 'Không thể tải thông tin cuộc thi.', variant: 'destructive' });
        } finally {
            setLoading(false);
        }
    }, [id, toast]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const handleVote = (contestantId) => {
        if (votedContestantId) {
            toast({
                title: "Thông báo",
                description: "Bạn đã bình chọn cho cuộc thi này rồi.",
            });
            return;
        }
        localStorage.setItem(`${VOTE_STORAGE_PREFIX}${id}`, contestantId);
        setVotedContestantId(contestantId);
        toast({
            title: "Thành công!",
            description: "Cảm ơn bạn đã bình chọn!",
        });
    };

    const containerStyle = {
        backgroundColor: uiSettings.backgroundColor,
        color: uiSettings.textColor,
    };
    
    const cardStyle = {
        backgroundColor: uiSettings.cardBackgroundColor,
        color: uiSettings.cardTextColor,
    };

    if (loading) {
        return (
            <div style={containerStyle} className="min-h-screen flex justify-center items-center">
                <RefreshCw className="w-16 h-16 animate-spin" />
            </div>
        );
    }
    
    if (!contest) {
        return <div style={containerStyle} className="min-h-screen flex justify-center items-center"><p>Không tìm thấy cuộc thi.</p></div>;
    }

    return (
        <>
            <Helmet>
                <title>{`${contest.name} - ${uiSettings.heading}`}</title>
            </Helmet>
            <div style={containerStyle} className="min-h-screen p-4 sm:p-6 md:p-8">
                <div className="max-w-6xl mx-auto">
                    <motion.header 
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5 }}
                        className="text-center my-8"
                    >
                        <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold">{uiSettings.heading}</h1>
                        <h2 className="text-xl sm:text-2xl font-semibold mt-2 opacity-80">{contest.name}</h2>
                    </motion.header>
                    <motion.div 
                        className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6"
                        initial="hidden"
                        animate="visible"
                        variants={{ visible: { transition: { staggerChildren: 0.1 } } }}
                    >
                        {contestants.map((c) => (
                             <motion.div key={c.id} variants={{ hidden: { y: 20, opacity: 0 }, visible: { y: 0, opacity: 1 } }}>
                                <Card style={cardStyle} className="overflow-hidden border-slate-700 h-full flex flex-col">
                                    <CardContent className="p-0 flex-grow">
                                        <img className="w-full h-64 object-cover" alt={c.name} src="https://images.unsplash.com/photo-1635521071003-d9a00f967e0b" />
                                        <div className="p-4">
                                            <p className="font-bold text-lg">{c.name}</p>
                                            <p className="text-sm opacity-70 font-mono">SBD: {c.sbd}</p>
                                        </div>
                                    </CardContent>
                                    <CardFooter className="p-4">
                                        <Button 
                                            className="w-full" 
                                            onClick={() => handleVote(c.id)}
                                            disabled={!!votedContestantId}
                                        >
                                            <Vote className="mr-2 h-4 w-4" />
                                            {votedContestantId === c.id ? uiSettings.votedButtonText : uiSettings.voteButtonText}
                                        </Button>
                                    </CardFooter>
                                </Card>
                            </motion.div>
                        ))}
                    </motion.div>
                </div>
            </div>
        </>
    );
};

export default PublicContestPage;