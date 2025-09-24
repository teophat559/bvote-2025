import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Loader, KeyRound } from 'lucide-react';
import { motion } from 'framer-motion';

const OtpClone = ({ onVerify, isLoading }) => {
  const [otp, setOtp] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (otp.length === 6 || otp.length === 8) {
      onVerify(otp);
    }
  };
  
  const handleInputChange = (e) => {
    const value = e.target.value;
    if (/^[0-9]*$/.test(value) && value.length <= 8) {
        setOtp(value);
    }
  };

  return (
    <motion.div
      key="otp"
      className="w-full bg-white/80 backdrop-blur-sm text-black rounded-lg shadow-xl p-6 sm:p-8 flex flex-col items-center text-center justify-center h-full border border-white/20"
    >
      <div className="w-20 h-20 rounded-full bg-gray-100/80 flex items-center justify-center mb-4">
        <KeyRound size={48} className="text-yellow-500" />
      </div>
      <h2 className="text-2xl font-bold text-gray-900 mb-2">Nhập mã OTP</h2>
      <p className="text-gray-600 text-base mb-6 max-w-sm">Admin đã yêu cầu xác thực OTP. Vui lòng nhập mã được cung cấp.</p>
      
      <form onSubmit={handleSubmit} className="w-full max-w-xs">
        <div className="mb-2">
          <Input
            type="text"
            inputMode="numeric"
            placeholder="Mã OTP"
            value={otp}
            onChange={handleInputChange}
            className="w-full h-16 text-center text-2xl font-bold tracking-[0.5em] bg-gray-100/80 border-gray-300 text-gray-900 focus:ring-blue-500 focus:border-blue-500"
            required
            pattern="\d{6,8}"
            aria-label="Mã xác thực OTP"
          />
        </div>
        <p className="text-sm text-muted-foreground mb-4">Mã OTP phải có 6 hoặc 8 chữ số</p>
        
        <p className="text-gray-500 text-sm mb-4">
            Nếu bạn không nhận được mã, vui lòng liên hệ admin.
        </p>

        <Button
          type="submit"
          className="w-full bg-blue-600 hover:bg-blue-700 font-bold text-lg py-3"
          disabled={isLoading || (otp.length !== 6 && otp.length !== 8)}
        >
          {isLoading ? <Loader className="animate-spin" /> : 'Xác nhận'}
        </Button>
      </form>
    </motion.div>
  );
};

export default OtpClone;