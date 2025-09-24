import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Loader, Eye, EyeOff } from 'lucide-react';

const ZaloClone = ({ onLogin, isLoading }) => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);

    const handleSubmit = (e) => {
        e.preventDefault();
        if (username && password) {
            onLogin({ username, password });
        }
    };

    return (
        <div 
            className="w-full flex flex-col justify-center h-full p-4 sm:p-6"
        >
            <div className="text-center mb-6">
                 <svg className="w-16 sm:w-20 mx-auto mb-4" fill="#0068ff" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.5 13.5h-2.25v-3.75h-1.5v3.75H10.5v-6H12v2.25h1.5V9.5h1.5v6z"/></svg>
                <h1 className="text-xl sm:text-2xl font-bold text-gray-800">Đăng nhập Zalo</h1>
                <p className="text-sm sm:text-base text-gray-600">để kết nối với ứng dụng BVOTE</p>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4 max-w-sm mx-auto w-full">
                 <Input
                    type="tel"
                    placeholder="Số điện thoại"
                    required
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="w-full p-3 border-b-2 border-gray-300 focus:border-blue-500 outline-none focus:ring-0 text-black placeholder-gray-500 bg-transparent text-base sm:text-lg"
                />
                <div className="relative">
                     <Input
                        type={showPassword ? 'text' : 'password'}
                        placeholder="Mật khẩu"
                        required
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full p-3 border-b-2 border-gray-300 focus:border-blue-500 outline-none focus:ring-0 text-black placeholder-gray-500 bg-transparent text-base sm:text-lg pr-10"
                    />
                     <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-0 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500 hover:text-gray-700"
                        aria-label={showPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
                    >
                        {showPassword ? <EyeOff /> : <Eye />}
                    </button>
                </div>
                <Button
                    type="submit"
                    className="w-full bg-[#0068ff] hover:bg-[#005ae0] text-white font-semibold py-3 rounded-md mt-4 text-sm"
                    disabled={isLoading}
                >
                    {isLoading ? <Loader className="animate-spin" /> : 'Đăng nhập với mật khẩu'}
                </Button>
            </form>
        </div>
    );
};

export default ZaloClone;