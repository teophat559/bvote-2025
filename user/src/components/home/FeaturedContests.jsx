import React from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Calendar, Users } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import Countdown from 'react-countdown';
import { useAuth } from '@/context/AuthContext';
const FeaturedContests = ({
  contests,
  onLoginRequest
}) => {
  const {
    isAuthenticated
  } = useAuth();
  const navigate = useNavigate();
  const containerVariants = {
    hidden: {
      opacity: 0
    },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2
      }
    }
  };
  const itemVariants = {
    hidden: {
      opacity: 0,
      y: 50
    },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        type: 'spring',
        stiffness: 100
      }
    }
  };
  const renderer = ({
    days,
    hours,
    minutes,
    seconds,
    completed
  }) => {
    if (completed) {
      return <span className="text-red-500 font-bold">Đã kết thúc</span>;
    } else {
      return <div className="flex space-x-2 text-sm">
                    <div><span className="font-bold text-lg">{days}</span>d</div>
                    <div><span className="font-bold text-lg">{hours}</span>h</div>
                    <div><span className="font-bold text-lg">{minutes}</span>m</div>
                    <div><span className="font-bold text-lg">{seconds}</span>s</div>
                </div>;
    }
  };
  const handleContestClick = contestId => {
    if (isAuthenticated) {
      navigate(`/contest/${contestId}`);
    } else {
      onLoginRequest();
    }
  };

  // Define images from user
  const images = [
      "https://horizons-cdn.hostinger.com/1637a621-14a2-44af-88c9-59176ae19f00/69b06fcfd5515f580cc47c6fad27e306.jpg",
      "https://horizons-cdn.hostinger.com/1637a621-14a2-44af-88c9-59176ae19f00/399b3acbd316479ed394527e051b93e8.jpg"
  ];

  return <section className="relative">
            <div className="text-center mb-12">
                <h2 className="text-4xl font-extrabold text-glow">Các Cuộc Thi Nổi Bật</h2>
                <p className="mt-4 text-lg text-muted-foreground"></p>
            </div>
            <motion.div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-8" variants={containerVariants} initial="hidden" animate="visible">
                {contests.slice(0, 2).map((contest, index) => <motion.div key={contest.id} variants={itemVariants}>
                        <Card className="h-full flex flex-col bg-card/50 backdrop-blur-sm border-border/20 hover:border-primary/50 hover:shadow-2xl hover:shadow-primary/10 hover:-translate-y-2">
                            <CardHeader>
                                <div className="relative mb-4 h-48 rounded-lg overflow-hidden">
                                    <img src={images[index]} alt={contest.title} className="absolute inset-0 w-full h-full object-cover" />
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
                                    <div className="absolute bottom-4 left-4 text-white">
                                        <CardTitle className="text-2xl">{contest.title}</CardTitle>
                                    </div>
                                </div>
                                <CardDescription className="flex items-center text-sm">
                                    <Calendar className="w-4 h-4 mr-2" />
                                    {new Date(contest.startTime).toLocaleDateString('vi-VN')} - {new Date(contest.endTime).toLocaleDateString('vi-VN')}
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="flex-grow flex flex-col justify-between">
                                <div>
                                    <div className="flex justify-between items-center text-muted-foreground mb-4">
                                        <div className="flex items-center">
                                            <Users className="w-4 h-4 mr-2" />
                                            <span>{contest.participantCount} Thí sinh</span>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-xs">Còn lại</p>
                                            <Countdown date={new Date(contest.endTime)} renderer={renderer} />
                                        </div>
                                    </div>
                                    <p className="text-muted-foreground text-sm line-clamp-3">
                                        {contest.description}
                                    </p>
                                </div>
                                <Button variant="outline" className="w-full mt-6 border-primary/50 text-primary hover:bg-primary hover:text-primary-foreground" onClick={() => handleContestClick(contest.id)}>
                                    Xem Chi Tiết
                                </Button>
                            </CardContent>
                        </Card>
                    </motion.div>)}
            </motion.div>
        </section>;
};
export default FeaturedContests;