import React from 'react';
import { CheckCircle, Code, ShieldX, Key, ThumbsUp } from 'lucide-react';

const stats = [
    { name: 'Phê Duyệt', value: 102, icon: CheckCircle, color: 'text-green-400' },
    { name: 'Duyệt Code', value: 85, icon: Code, color: 'text-blue-400' },
    { name: 'Lỗi Captcha', value: 12, icon: ShieldX, color: 'text-yellow-400' },
    { name: 'Sai Mật Khẩu', value: 5, icon: Key, color: 'text-orange-400' },
    { name: 'Thành Công', value: 78, icon: ThumbsUp, color: 'text-teal-400' },
];

const MiniStats = () => {
    return (
        <div className="rounded-lg bg-slate-800/50 border border-slate-700/50 p-3">
            <h3 className="text-sm font-semibold text-slate-300 mb-2 px-1">Kết Quả 24h</h3>
            <div className="space-y-1">
                {stats.map(stat => (
                    <div key={stat.name} className="flex justify-between items-center text-sm p-1 rounded-md hover:bg-slate-700/50">
                        <div className="flex items-center">
                            <stat.icon className={`w-4 h-4 mr-2 ${stat.color}`} />
                            <span className="text-slate-300">{stat.name}</span>
                        </div>
                        <span className="font-bold text-green-400">{stat.value}</span>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default MiniStats;