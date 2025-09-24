import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Wifi, Bot, Clock } from 'lucide-react';

const StatusIndicator = ({ colorClass, icon: Icon, text }) => (
    <div className="flex items-center gap-2">
        <div className={`relative flex h-3 w-3`}>
            <div className={`absolute inline-flex h-full w-full rounded-full ${colorClass} opacity-75 animate-ping`}></div>
            <div className={`relative inline-flex rounded-full h-3 w-3 ${colorClass}`}></div>
        </div>
        <span className="text-xs font-medium">{text}</span>
    </div>
);


const SystemFooter = () => {
    const [lastUpdated, setLastUpdated] = useState(new Date());

    useEffect(() => {
        const timer = setInterval(() => {
            setLastUpdated(new Date());
        }, 60000); // Update every minute
        return () => clearInterval(timer);
    }, []);

    return (
        <motion.footer
            initial={{ y: 50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.5, type: 'spring', stiffness: 100 }}
            className="h-[45px] flex-shrink-0 bg-card border-t border-border px-6 flex items-center justify-between text-muted-foreground"
        >
            <div className="flex items-center gap-6">
                <StatusIndicator colorClass="bg-green-500" icon={Wifi} text="System Online" />
                <StatusIndicator colorClass="bg-blue-500" icon={Bot} text="Auto Login Active" />
            </div>
            <div className="flex items-center gap-2 text-xs">
                <Clock className="h-3.5 w-3.5" />
                <span>Last updated: {lastUpdated.toLocaleTimeString('vi-VN')}</span>
            </div>
        </motion.footer>
    );
};

export default SystemFooter;