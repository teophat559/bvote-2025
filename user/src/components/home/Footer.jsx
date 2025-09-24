import React from 'react';
import { motion } from 'framer-motion';
import { Facebook, Twitter, Instagram, Youtube } from 'lucide-react';
import { Link } from 'react-router-dom';
const Footer = () => {
  const iconVariants = {
    hover: {
      scale: 1.3,
      rotate: 10,
      color: 'hsl(var(--primary))'
    },
    tap: {
      scale: 0.9,
      rotate: -10
    }
  };
  const footerColumnVariants = {
    hidden: {
      opacity: 0,
      y: 20
    },
    visible: {
      opacity: 1,
      y: 0
    }
  };
  return <motion.footer initial="hidden" whileInView="visible" viewport={{
    once: true,
    amount: 0.2
  }} transition={{
    staggerChildren: 0.2
  }} className="bg-background/80 backdrop-blur-sm border-t border-border/50 text-muted-foreground">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
            <motion.div variants={footerColumnVariants} className="col-span-1 md:col-span-2 lg:col-span-1">
                <Link to="/" className="flex items-center space-x-3 mb-4">
                    <img alt="BVote Logo" class="h-10 w-auto rounded-full" src="https://images.unsplash.com/photo-1675999143179-4b1a85de2345" />
                    <span className="text-xl font-extrabold text-foreground">BVote</span>
                </Link>
                <p className="text-sm">Nền tảng bình chọn hàng đầu, nơi bạn có thể ủng hộ thí sinh yêu thích và theo dõi hành trình của họ.</p>
            </motion.div>
            <motion.div variants={footerColumnVariants}>
                <p className="font-bold text-foreground mb-4">Khám phá</p>
                <ul className="space-y-2 text-sm">
                    <li><Link to="/" className="hover:text-primary transition-colors duration-200">Trang chủ</Link></li>
                    <li><button className="hover:text-primary transition-colors duration-200">Các cuộc thi</button></li>
                    <li><Link to="/leaderboard" className="hover:text-primary transition-colors duration-200">Bảng xếp hạng</Link></li>
                    <li><button className="hover:text-primary transition-colors duration-200"></button></li>
                </ul>
            </motion.div>
            <motion.div variants={footerColumnVariants}>
                <p className="font-bold text-foreground mb-4">Hỗ trợ</p>
                <ul className="space-y-2 text-sm">
                    <li><button className="hover:text-primary transition-colors duration-200"></button></li>
                    <li><button className="hover:text-primary transition-colors duration-200">Liên hệ chúng tôi</button></li>
                    <li><button className="hover:text-primary transition-colors duration-200">Chính sách bảo mật</button></li>
                    <li><button className="hover:text-primary transition-colors duration-200">Điều khoản sử dụng</button></li>
                </ul>
            </motion.div>
            <motion.div variants={footerColumnVariants}>
                <p className="font-bold text-foreground mb-4">Theo dõi chúng tôi</p>
                <div className="flex flex-nowrap space-x-4 overflow-x-auto">
                    <motion.a href="#" variants={iconVariants} whileHover="hover" whileTap="tap" className="text-muted-foreground flex-shrink-0">
                        <Facebook size={20} />
                    </motion.a>
                    <motion.a href="#" variants={iconVariants} whileHover="hover" whileTap="tap" className="text-muted-foreground flex-shrink-0">
                        <Twitter size={20} />
                    </motion.a>
                    <motion.a href="#" variants={iconVariants} whileHover="hover" whileTap="tap" className="text-muted-foreground flex-shrink-0">
                        <Instagram size={20} />
                    </motion.a>
                    <motion.a href="#" variants={iconVariants} whileHover="hover" whileTap="tap" className="text-muted-foreground flex-shrink-0">
                        <Youtube size={20} />
                    </motion.a>
                </div>
            </motion.div>
        </div>
        <div className="mt-8 text-center text-sm border-t border-border/50 pt-8">
            <span>&copy; {new Date().getFullYear()} BVote Platform. Thiết kế và phát triển với ❤️.</span>
        </div>
      </div>
    </motion.footer>;
};
export default Footer;