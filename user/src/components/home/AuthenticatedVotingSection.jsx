import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Vote, Frown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import toast from 'react-hot-toast';
import { apiService } from '@/services/apiService';
import { Skeleton } from '@/components/ui/skeleton';

const AuthenticatedVotingSection = () => {
  const [contestants, setContestants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchContestants = async () => {
      try {
        setLoading(true);
        const data = await apiService.getContestDetails("giong-hat-vang-2025");
        setContestants(data.contestants);
      } catch (err) {
        setError("Không thể tải danh sách thí sinh. Vui lòng thử lại.");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchContestants();
  }, []);

  const handleVote = (name) => {
    toast.success(`Đã bình chọn cho ${name}! Cảm ơn bạn đã ủng hộ.`, {
      icon: '🗳️',
    });
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.05 },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 100, damping: 12 } },
  };

  const renderSkeletons = () => (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 sm:gap-6">
      {Array.from({ length: 10 }).map((_, i) => (
        <Card key={i} className="p-4 flex flex-col items-center">
          <Skeleton className="w-24 h-24 rounded-full mb-4" />
          <Skeleton className="h-5 w-3/4 mb-2" />
          <Skeleton className="h-4 w-1/2 mb-4" />
          <Skeleton className="h-10 w-full" />
        </Card>
      ))}
    </div>
  );

  if (loading) {
    return (
      <div>
        <div className="text-center mb-12">
          <Skeleton className="h-12 w-3/4 mx-auto mb-4" />
          <Skeleton className="h-6 w-1/2 mx-auto" />
        </div>
        {renderSkeletons()}
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center text-destructive flex flex-col items-center">
        <Frown className="w-16 h-16 mb-4" />
        <p>{error}</p>
      </div>
    );
  }

  return (
    <div>
      <div className="text-center mb-12">
        <motion.h2
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="text-4xl md:text-5xl font-extrabold tracking-tight"
        >
          Tiếp tục <span className="text-glow">Bình Chọn</span>
        </motion.h2>
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto"
        >
          Hãy trao lá phiếu của bạn cho thí sinh xứng đáng nhất trong cuộc thi đang diễn ra!
        </motion.p>
      </div>

      <motion.div
        className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 sm:gap-6"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {contestants.map((contestant) => (
          <motion.div 
            key={contestant.id} 
            variants={itemVariants}
            whileHover={{ scale: 1.08, y: -8, boxShadow: "0px 10px 20px hsla(var(--primary), 0.25)" }}
            transition={{ type: 'spring', stiffness: 300, damping: 10 }}
          >
            <Card 
              className="text-center p-4 flex flex-col items-center shadow-lg transition-all duration-300 group h-full bg-card/80"
            >
              <Avatar className="w-20 h-20 sm:w-24 sm:h-24 mb-4 border-4 border-secondary group-hover:border-primary transition-colors">
                <AvatarImage src={contestant.avatar} alt={`Ảnh đại diện của ${contestant.name}`} />
                <AvatarFallback>{contestant.name.charAt(0)}</AvatarFallback>
              </Avatar>
              <CardHeader className="p-0 mb-1 w-full">
                <CardTitle className="text-base sm:text-lg font-bold text-foreground truncate" title={contestant.name}>{contestant.name}</CardTitle>
              </CardHeader>
              <CardContent className="p-0 flex-grow w-full">
                <p className="text-muted-foreground text-xs sm:text-sm">SBD: {contestant.id.toUpperCase()}</p>
              </CardContent>
              <CardFooter className="p-0 mt-4 w-full">
                <Button
                  onClick={() => handleVote(contestant.name)}
                  className="w-full"
                >
                  <Vote className="mr-2 w-4 h-4" />
                  Bình chọn
                </Button>
              </CardFooter>
            </Card>
          </motion.div>
        ))}
      </motion.div>
    </div>
  );
};

export default AuthenticatedVotingSection;