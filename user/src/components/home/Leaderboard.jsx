import React from 'react';
import { motion } from 'framer-motion';
import { BarChart2, Trophy, ArrowUpRight } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';

const MotionCard = motion(Card);

const Leaderboard = ({ leaderboard }) => {
  const navigate = useNavigate();
  
  const getTrophyIcon = (rank) => {
    if (rank === 1) return <Trophy className="w-6 h-6 text-yellow-400 drop-shadow-[0_2px_2px_rgba(255,215,0,0.5)]" />;
    if (rank === 2) return <Trophy className="w-6 h-6 text-slate-300 drop-shadow-[0_2px_2px_rgba(192,192,192,0.5)]" />;
    if (rank === 3) return <Trophy className="w-6 h-6 text-amber-600 drop-shadow-[0_2px_2px_rgba(205,127,50,0.5)]" />;
    return <span className="text-base font-bold text-muted-foreground">{rank}</span>;
  };

  const listVariants = {
    visible: { transition: { staggerChildren: 0.07 } },
    hidden: {},
  };

  const itemVariants = {
    visible: { opacity: 1, x: 0, transition: { type: 'spring', stiffness: 100, damping: 15 } },
    hidden: { opacity: 0, x: -30 },
  };

  return (
    <section id="leaderboard">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.5 }}
        transition={{ duration: 0.5 }}
        className="flex items-center justify-between gap-3 mb-8"
      >
        <div className="flex items-center gap-3">
            <BarChart2 className="w-8 h-8 text-teal-400" />
            <h2 className="text-3xl font-bold text-glow">Bảng Xếp Hạng Tổng</h2>
        </div>
        <Button variant="outline" onClick={() => navigate('/leaderboard')}>
            Xem tất cả <ArrowUpRight className="w-4 h-4 ml-2" />
        </Button>
      </motion.div>
      <MotionCard
        initial={{ opacity: 0, y: 50 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.2 }}
        transition={{ duration: 0.5, delay: 0.2, type: 'spring' }}
        className="bg-card/80 backdrop-blur-sm border-border/50 shadow-2xl shadow-primary/10"
      >
        <CardContent className="p-0">
          <div className="max-h-[600px] overflow-y-auto custom-scrollbar">
            <motion.ul 
              className="divide-y divide-border/50"
              variants={listVariants}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, amount: 0.1 }}
            >
              {leaderboard.slice(0, 10).map((item) => (
                <motion.li
                  key={item.rank}
                  variants={itemVariants}
                  whileHover={{ backgroundColor: 'hsla(var(--primary), 0.15)', x: 10, scale: 1.02 }}
                  transition={{ type: 'spring', stiffness: 300, damping: 10 }}
                  className={cn(
                    'flex items-center p-4'
                  )}
                >
                  <div className="w-12 text-center text-xl font-bold flex justify-center items-center">
                    {getTrophyIcon(item.rank)}
                  </div>
                  <Avatar className="w-10 h-10 mx-4">
                    <AvatarImage src={item.avatar} alt={`Ảnh đại diện của ${item.name}`} />
                    <AvatarFallback>{item.name.charAt(0)}</AvatarFallback>
                  </Avatar>
                  <div className="flex-grow">
                    <p className="font-semibold text-foreground">{item.name}</p>
                    <p className="text-xs text-muted-foreground">{item.contest}</p>
                  </div>
                  <div className="text-right min-w-[100px]">
                    <p className="font-bold text-lg text-highlight">{item.votes.toLocaleString('vi-VN')}</p>
                    <p className="text-xs text-muted-foreground">Bình chọn</p>
                  </div>
                </motion.li>
              ))}
            </motion.ul>
          </div>
        </CardContent>
      </MotionCard>
    </section>
  );
};

export default Leaderboard;