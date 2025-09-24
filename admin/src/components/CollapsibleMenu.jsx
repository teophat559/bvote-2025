import React, { useState, useEffect } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown } from 'lucide-react';

const CollapsibleMenu = ({ item }) => {
    const location = useLocation();
    const { name: title, icon: Icon, subItems } = item;
    
    const isActive = subItems.some(sub => location.pathname.startsWith(sub.path));
    const [isOpen, setIsOpen] = useState(isActive);

    useEffect(() => {
        if (isActive) {
            setIsOpen(true);
        }
    }, [isActive, location.pathname]);

    return (
        <div className="space-y-1">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className={`w-full flex items-center justify-between px-4 py-2.5 text-sm font-medium rounded-lg transition-colors duration-200 ${
                  isActive
                    ? 'bg-slate-800 text-white'
                    : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                }`}
            >
                <div className="flex items-center">
                    <Icon className="w-5 h-5 mr-3" />
                    <span>{title}</span>
                </div>
                <ChevronDown
                    className={`w-4 h-4 transform transition-transform duration-200 ${
                        isOpen ? 'rotate-180' : ''
                    }`}
                />
            </button>
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.3, ease: 'easeInOut' }}
                        className="ml-6 pl-3 border-l-2 border-slate-700 overflow-hidden"
                    >
                        <div className="py-1">
                            {subItems.map((subItem, subIndex) => (
                                <NavLink
                                    key={subIndex}
                                    to={subItem.path}
                                    className={({ isActive: isSubActive }) =>
                                        `flex items-center w-full px-3 py-2 text-sm font-medium rounded-md transition-colors duration-200 ${
                                            isSubActive
                                                ? 'text-white bg-slate-700/50'
                                                : 'text-slate-400 hover:text-white hover:bg-slate-700/50'
                                        }`
                                    }
                                >
                                    <span>{subItem.name}</span>
                                </NavLink>
                            ))}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default CollapsibleMenu;