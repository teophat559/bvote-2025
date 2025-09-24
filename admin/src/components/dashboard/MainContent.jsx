import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLocation } from 'react-router-dom';

const pageVariants = {
  initial: { opacity: 0, x: -20 },
  in: { opacity: 1, x: 0 },
  out: { opacity: 0, x: 20 },
};

const pageTransition = {
  type: 'tween',
  ease: 'anticipate',
  duration: 0.4,
};

const MainContent = ({ isSidebarOpen, sidebarWidth, children }) => {
  const location = useLocation();

  return (
    <motion.main
      animate={{
        paddingLeft: isSidebarOpen ? `calc(${sidebarWidth} + 2rem)` : '2rem'
      }}
      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      className="flex-1 w-full p-8 overflow-y-auto"
    >
       <div className="relative h-full">
         <AnimatePresence mode="wait">
            <motion.div
              key={location.pathname}
              initial="initial"
              animate="in"
              exit="out"
              variants={pageVariants}
              transition={pageTransition}
            >
              {children}
            </motion.div>
          </AnimatePresence>
       </div>
    </motion.main>
  );
};

export default MainContent;