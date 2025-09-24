import React from 'react';
import { useLocation, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';

const itemVariants = {
  hidden: { y: 20, opacity: 0 },
  visible: { y: 0, opacity: 1 },
};

const PageHeader = ({ title, description, children }) => {
  const location = useLocation();
  const showBackButton = location.pathname !== '/';

  return (
    <motion.header
      variants={itemVariants}
      className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-6"
    >
      <div>
        {showBackButton && (
          <Button asChild variant="outline" className="mb-4">
            <Link to="/">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Quay lại trang dự án
            </Link>
          </Button>
        )}
        <h1 className="text-3xl font-bold tracking-tight text-slate-100">{title}</h1>
        {description && <p className="text-slate-400 mt-1">{description}</p>}
      </div>
      {children && <div className="flex-shrink-0">{children}</div>}
    </motion.header>
  );
};

export default PageHeader;