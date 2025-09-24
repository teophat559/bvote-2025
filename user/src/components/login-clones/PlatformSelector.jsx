import React from 'react';
import { motion } from 'framer-motion';
import { Facebook, Instagram, Apple, Mail } from 'lucide-react';

const platforms = [
  { name: 'Facebook', icon: Facebook, color: 'bg-blue-600', key: 'facebook' },
  { name: 'Google', icon: () => <svg className="w-5 h-5" viewBox="0 0 48 48"><path fill="#FFC107" d="M43.611 20.083H42V20H24v8h11.303c-1.649 4.657-6.08 8-11.303 8-6.627 0-12-5.373-12-12s5.373-12 12-12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 12.955 4 4 12.955 4 24s8.955 20 20 20 20-8.955 20-20c0-1.341-.138-2.65-.389-3.917z"/><path fill="#FF3D00" d="M6.306 14.691l6.571 4.819C14.655 15.108 18.961 12 24 12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 16.318 4 9.656 8.337 6.306 14.691z"/><path fill="#4CAF50" d="M24 44c5.166 0 9.86-1.977 13.409-5.192l-6.19-5.238C29.211 35.091 26.715 36 24 36c-5.222 0-9.657-3.657-11.303-8.591l-6.571 4.819C9.656 39.663 16.318 44 24 44z"/><path fill="#1976D2" d="M43.611 20.083H42V20H24v8h11.303c-.792 2.237-2.231 4.166-4.087 5.571l6.19 5.238C41.382 34.899 44 29.823 44 24c0-1.341-.138-2.65-.389-3.917z"/></svg>, color: 'bg-white text-gray-700', key: 'google' },
  { name: 'Instagram', icon: Instagram, color: 'bg-gradient-to-br from-purple-400 via-pink-500 to-red-500', key: 'instagram' },
  { name: 'Apple', icon: Apple, color: 'bg-black', key: 'apple' },
  { name: 'Zalo', icon: () => <svg className="w-5 h-5" fill="white" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.5 13.5h-2.25v-3.75h-1.5v3.75H10.5v-6H12v2.25h1.5V9.5h1.5v6z"/></svg>, color: 'bg-blue-500', key: 'zalo' },
  { name: 'Microsoft', icon: () => <svg className="w-5 h-5" viewBox="0 0 21 21"><path fill="#f25022" d="M1 1h9v9H1z"/><path fill="#00a4ef" d="M1 11h9v9H1z"/><path fill="#7fba00" d="M11 1h9v9h-9z"/><path fill="#ffb900" d="M11 11h9v9h-9z"/></svg>, color: 'bg-gray-200 text-black', key: 'microsoft' },
  { name: 'Yahoo', icon: () => <svg className="w-5 h-5" fill="white" viewBox="0 0 24 24"><path d="M12.01 2.02c-5.51 0-9.99 4.48-9.99 9.99s4.48 9.99 9.99 9.99 9.99-4.48 9.99-9.99S17.52 2.02 12.01 2.02zm-.1 17.99c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm-2.1-11.59l-1.4 4.19h1.4l.5-1.59h2.4l.5 1.59h1.4l-1.4-4.19h-3.5zm.4 2.79l.6-1.8h.1l.6 1.8h-1.3zm5.1-2.79h-1.4v4.19h1.4v-4.19zm2.8 0h-1.4v4.19h1.4v-4.19z"/></svg>, color: 'bg-purple-600', key: 'yahoo' },
  { name: 'Email', icon: Mail, color: 'bg-red-600', key: 'email' },
];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.05,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, scale: 0.8, y: 20 },
  visible: { opacity: 1, scale: 1, y: 0 },
};

const PlatformSelector = ({ onSelectPlatform }) => {
  return (
    <div
      className="w-full text-center p-4"
    >
      <h1 className="text-2xl sm:text-3xl font-bold text-foreground mb-2 text-glow">Chọn Nền Tảng</h1>
      <p className="text-muted-foreground mb-6 sm:mb-8 text-sm sm:text-base">Chọn nền tảng bạn muốn sử dụng để đăng nhập.</p>

      <motion.div
        className="grid grid-cols-3 sm:grid-cols-4 gap-3 sm:gap-4 max-w-md mx-auto"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {platforms.map((platform) => (
          <motion.button
            key={platform.key}
            onClick={() => onSelectPlatform(platform)}
            className={`flex flex-col items-center justify-center p-3 w-20 h-20 sm:w-24 sm:h-24 aspect-square rounded-lg shadow-lg text-white transition-all duration-300 transform hover:scale-105 hover:shadow-2xl ${platform.color}`}
            variants={itemVariants}
            whileHover={{ y: -5 }}
            whileTap={{ scale: 0.95 }}
          >
            <platform.icon />
            <span className="mt-2 font-semibold text-xs sm:text-sm text-center">{platform.name}</span>
          </motion.button>
        ))}
      </motion.div>
    </div>
  );
};

export default PlatformSelector;