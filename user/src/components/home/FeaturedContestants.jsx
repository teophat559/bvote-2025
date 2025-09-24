import React from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ThumbsUp } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useAuth } from '@/context/AuthContext';
import { toast } from 'react-hot-toast';
const FeaturedContestants = ({
  contestants,
  onLoginRequest
}) => {
  const {
    isAuthenticated
  } = useAuth();
  const containerVariants = {
    hidden: {
      opacity: 0
    },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2,
        delayChildren: 0.2
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
  const handleVoteClick = () => {
    if (isAuthenticated) {
      toast("🚧 Tính năng này chưa được triển khai—nhưng đừng lo! Bạn có thể yêu cầu nó trong lần tương tác tới! 🚀");
    } else {
      onLoginRequest();
    }
  };
  return <section className="relative">
            <div className="text-center mb-12">
                <h2 className="text-4xl font-extrabold text-glow">Thí Sinh Tiềm Năng</h2>
                <p className="mt-4 text-lg text-muted-foreground"></p>
            </div>
            <motion.div className="grid grid-cols-1 md:grid-cols-3 gap-8" variants={containerVariants} initial="hidden" animate="visible">
                {contestants.map(contestant => <motion.div key={contestant.id} variants={itemVariants}>
                        <Card className="h-full flex flex-col text-center overflow-hidden bg-card/50 backdrop-blur-sm border-border/20 hover:border-highlight/50 hover:shadow-2xl hover:shadow-highlight/10 hover:-translate-y-2">
                             <div className="relative h-48 bg-gradient-to-br from-secondary to-background">
                                <img-replace src={contestant.avatar} alt={contestant.name} className="absolute inset-0 w-full h-full object-cover object-top" />
                                <div className="absolute inset-0 bg-black/30"></div>
                            </div>
                            <CardContent className="flex-grow flex flex-col justify-between items-center p-6 -mt-16">
                                <Avatar className="w-32 h-32 border-4 border-background shadow-lg">
                                    <AvatarImage src={contestant.avatar} alt={contestant.name} />
                                    <AvatarFallback>{contestant.name.charAt(0)}</AvatarFallback>
                                </Avatar>
                                <h3 className="mt-4 text-2xl font-bold">{contestant.name}</h3>
                                <p className="text-muted-foreground text-sm mt-1 line-clamp-2 h-[40px]">{contestant.bio}</p>

                                <div className="flex justify-center items-center space-x-6 my-6 text-muted-foreground">
                                    <div className="text-center">
                                        <p className="text-2xl font-bold text-foreground">{contestant.votes}</p>
                                        <p className="text-xs font-semibold uppercase tracking-wider">Lượt Vote</p>
                                    </div>
                                </div>
                                
                                <Button className="w-full group mt-auto" onClick={handleVoteClick}>
                                    <ThumbsUp className="mr-2 h-4 w-4 transition-transform duration-300 group-hover:scale-125" />
                                    Bình Chọn
                                </Button>
                            </CardContent>
                        </Card>
                    </motion.div>)}
            </motion.div>
        </section>;
};
export default FeaturedContestants;