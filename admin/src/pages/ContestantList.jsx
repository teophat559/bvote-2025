import React from 'react';
import { motion } from 'framer-motion';

const ContestantList = () => {
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="p-6 bg-slate-900/50 rounded-lg"
        >
            <h1 className="text-3xl font-bold text-white mb-4">Danh Sách Thí Sinh</h1>
            <p className="text-slate-400">Trang này đang được xây dựng. Đây là nơi bạn sẽ quản lý danh sách thí sinh cho từng cuộc thi.</p>
        </motion.div>
    );
};

export default ContestantList;