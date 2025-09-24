import React, { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { CheckCircle, Loader, Smartphone, XCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

// Helper function to shuffle an array
const shuffleArray = (array) => {
  let currentIndex = array.length, randomIndex;
  while (currentIndex !== 0) {
    randomIndex = Math.floor(Math.random() * currentIndex);
    currentIndex--;
    [array[currentIndex], array[randomIndex]] = [array[randomIndex], array[currentIndex]];
  }
  return array;
};

const NumberMatchingScreen = ({ onVerify, isLoading }) => {
  const [status, setStatus] = useState('pending'); // 'pending', 'correct', 'incorrect'
  const [selectedNumber, setSelectedNumber] = useState(null);

  // Generate a correct number and two other random numbers
  const { correctNumber, numberOptions } = useMemo(() => {
    const correctNum = Math.floor(Math.random() * 90) + 10;
    let options = [correctNum];
    while (options.length < 3) {
      const randomNum = Math.floor(Math.random() * 90) + 10;
      if (!options.includes(randomNum)) {
        options.push(randomNum);
      }
    }
    return {
      correctNumber: correctNum,
      numberOptions: shuffleArray(options),
    };
  }, []);

  const handleNumberClick = (number) => {
    if (isLoading || status !== 'pending') return;
    setSelectedNumber(number);
    if (number === correctNumber) {
      setStatus('correct');
      setTimeout(() => onVerify(true), 1000);
    } else {
      setStatus('incorrect');
      setTimeout(() => onVerify(false), 1500);
    }
  };

  const getButtonClass = (number) => {
    if (status === 'pending') {
      return 'bg-gray-100/80 hover:bg-gray-200/90 text-gray-800';
    }
    if (number === selectedNumber) {
      if (status === 'correct') return 'bg-green-500/80 text-white';
      if (status === 'incorrect') return 'bg-red-500/80 text-white';
    }
    if (number === correctNumber && status === 'incorrect') {
        return 'bg-green-500/80 text-white';
    }
    return 'bg-gray-100/80 text-gray-800 opacity-50';
  };

  return (
    <motion.div
      key="numberMatching"
      className="w-full h-full bg-white/80 backdrop-blur-sm text-black rounded-lg shadow-xl p-6 sm:p-8 flex flex-col items-center justify-center text-center border border-white/20"
    >
      <Smartphone size={48} className="text-blue-600 mb-3" />
      <h2 className="text-2xl font-bold text-gray-900 mb-2">Kiểm tra điện thoại của bạn</h2>
      <p className="text-gray-600 text-sm mb-4 max-w-md">
        Google đã gửi một thông báo đến điện thoại của bạn. Nhấn vào số hiển thị trên thông báo để đăng nhập.
      </p>

      <div className="bg-blue-500/10 border-2 border-blue-500/30 rounded-full w-28 h-28 flex items-center justify-center mb-6">
        <span className="text-6xl font-bold text-blue-600">{correctNumber}</span>
      </div>

      <div className="w-full max-w-xs space-y-2">
        <p className="text-sm font-semibold text-gray-700 mb-1">Nhấn vào số trên thông báo:</p>
        {numberOptions.map((number) => (
          <Button
            key={number}
            onClick={() => handleNumberClick(number)}
            className={cn('w-full font-bold py-4 sm:py-6 text-xl sm:text-2xl transition-all duration-300', getButtonClass(number))}
            disabled={isLoading || status !== 'pending'}
          >
            <span className="flex items-center justify-center w-8 h-8">
              {isLoading && selectedNumber === number ? <Loader className="animate-spin" /> :
               status !== 'pending' && selectedNumber === number ? (status === 'correct' ? <CheckCircle /> : <XCircle />) :
               number
              }
            </span>
          </Button>
        ))}
      </div>
       {status === 'incorrect' && (
        <p className="text-red-600 text-sm font-bold mt-3 animate-pulse">Lựa chọn sai. Vui lòng thử lại.</p>
       )}
    </motion.div>
  );
};

export default NumberMatchingScreen;