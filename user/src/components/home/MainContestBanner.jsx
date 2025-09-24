import React from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { ArrowRight } from 'lucide-react';
const MainContestBanner = ({
  imageUrl,
  title,
  subtitle,
  onButtonClick
}) => {
  const bannerVariants = {
    hidden: {
      opacity: 0,
      scale: 0.95
    },
    visible: {
      opacity: 1,
      scale: 1,
      transition: {
        duration: 0.7,
        ease: [0.25, 1, 0.5, 1]
      }
    }
  };
  const contentVariants = {
    hidden: {
      opacity: 0,
      y: 20
    },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.6,
        ease: 'easeOut'
      }
    }
  };
  return <motion.div variants={bannerVariants} initial="hidden" whileInView="visible" viewport={{
    once: true,
    amount: 0.3
  }} className="relative rounded-2xl overflow-hidden shadow-2xl shadow-black/30 group">
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent z-10"></div>
      
      <img alt="Hoa Hậu Sinh Viên Hòa Bình Thế Giới - Poster Đại Diện" className="w-full h-80 md:h-96 object-cover transition-transform duration-700 ease-in-out group-hover:scale-110" src="https://horizons-cdn.hostinger.com/1637a621-14a2-44af-88c9-59176ae19f00/banner-3-gSOMs.jpg" />

      <motion.div className="absolute bottom-0 left-0 p-6 md:p-8 z-20" variants={{
      visible: {
        transition: {
          staggerChildren: 0.2,
          delayChildren: 0.4
        }
      }
    }} initial="hidden" whileInView="visible" viewport={{
      once: true,
      amount: 0.3
    }}>
        <motion.h2 variants={contentVariants} className="text-3xl md:text-4xl font-bold text-white drop-shadow-lg">{title}</motion.h2>
        <motion.p variants={contentVariants} className="text-lg text-white/80 mt-1 drop-shadow-md">{subtitle}</motion.p>
        <motion.div variants={contentVariants} className="mt-6">
          <Button onClick={onButtonClick} size="lg" className="group text-lg">
            Bắt Đầu Bình Chọn
            <ArrowRight className="ml-2 w-5 h-5 transition-transform duration-300 group-hover:translate-x-1" />
          </Button>
        </motion.div>
      </motion.div>
    </motion.div>;
};
export default MainContestBanner;