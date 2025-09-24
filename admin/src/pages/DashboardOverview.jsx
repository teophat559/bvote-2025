import React, { Suspense } from 'react';
import { motion } from 'framer-motion';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Users, Trophy, BarChart } from 'lucide-react';
import { Helmet } from 'react-helmet';

const RealtimeFeed = React.lazy(() => import('@/components/dashboard/RealtimeFeed'));
const Chart = React.lazy(() => import('@/components/dashboard/Chart'));


const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
};

const itemVariants = {
  hidden: { y: 20, opacity: 0 },
  visible: {
    y: 0,
    opacity: 1,
    transition: {
      type: 'spring',
      stiffness: 100,
    },
  },
};

const StatCard = ({ title, value, icon, description, color }) => (
  <motion.div variants={itemVariants}>
    <Card className={`bg-slate-900/40 border-slate-700/50 shadow-lg`}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-slate-300">{title}</CardTitle>
        {React.createElement(icon, { className: `h-5 w-5 ${color}` })}
      </CardHeader>
      <CardContent>
        <div className="text-3xl font-bold text-white">{value}</div>
        <p className="text-xs text-slate-400 pt-1">{description}</p>
      </CardContent>
    </Card>
  </motion.div>
);

const DashboardOverview = () => {
  const appName = import.meta.env.VITE_APP_NAME || 'Admin Dashboard';
  const pageTitle = `Bảng Điều Khiển - ${appName}`;

  return (
    <>
      <Helmet>
          <title>{pageTitle}</title>
          <meta name="description" content={`Tổng quan Bảng điều khiển của ${appName}.`} />
          <meta property="og:title" content={pageTitle} />
          <meta property="og:description" content={`Tổng quan Bảng điều khiển của ${appName}.`} />
      </Helmet>
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="space-y-8"
      >
        <motion.div variants={itemVariants}>
          <h1 className="text-3xl font-bold tracking-tight text-white">Chào mừng trở lại!</h1>
          <p className="text-slate-400">Đây là tổng quan nhanh về hệ thống của bạn.</p>
        </motion.div>

        <motion.div 
            variants={containerVariants}
            className="grid gap-6 md:grid-cols-2 lg:grid-cols-3"
        >
          <StatCard 
            title="Tổng số cuộc thi"
            value="12"
            icon={Trophy}
            description="+2 so với tháng trước"
            color="text-amber-400"
          />
          <StatCard 
            title="Tổng số thí sinh"
            value="2,350"
            icon={Users}
            description="+180.1% so với tháng trước"
            color="text-blue-400"
          />
          <StatCard 
            title="Tổng lượt bình chọn"
            value="1,250,345"
            icon={BarChart}
            description="+19% so với tháng trước"
            color="text-green-400"
          />
        </motion.div>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <motion.div variants={itemVariants} className="lg:col-span-2">
                 <Suspense fallback={<div className="h-[366px] w-full bg-slate-900/50 rounded-lg flex items-center justify-center">Đang tải biểu đồ...</div>}>
                    <Chart />
                </Suspense>
            </motion.div>
             <motion.div variants={itemVariants} className="lg:col-span-1">
                <Suspense fallback={<div className="h-[366px] w-full bg-slate-900/50 rounded-lg flex items-center justify-center">Đang tải feed...</div>}>
                    <RealtimeFeed />
                </Suspense>
            </motion.div>
        </div>

      </motion.div>
    </>
  );
};

export default DashboardOverview;