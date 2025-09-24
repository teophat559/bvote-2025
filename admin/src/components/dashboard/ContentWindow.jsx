import React from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Bot, ChevronDown } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useToast } from '@/components/ui/use-toast';

const ContentWindow = ({ title, secondaryTitle, children }) => {
  const { toast } = useToast();

  const handleUnsupportedFeature = (featureName) => {
     toast({
        title: 'Tính năng chưa được hỗ trợ',
        description: `Chức năng "${featureName}" đang được phát triển.`,
        variant: 'destructive',
      });
  }

  const handleBulkAction = (status) => {
      handleUnsupportedFeature(`Hành động hàng loạt: ${status}`);
  };

  return (
    <Card className="w-full bg-slate-900/50 border border-slate-800 shadow-2xl shadow-black/20">
      <header className="h-11 flex items-center justify-between px-4 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <span className="h-3 w-3 rounded-full bg-red-500"></span>
          <span className="h-3 w-3 rounded-full bg-yellow-500"></span>
          <span className="h-3 w-3 rounded-full bg-green-500"></span>
        </div>
        <div className="flex-1 text-center">
            <h2 className="text-sm font-semibold text-slate-300">{title}</h2>
        </div>
        <div className="w-16"></div>
      </header>
      <CardContent className="p-4 sm:p-6">
        <header className="flex flex-col md:flex-row items-start md:items-center justify-between mb-6 gap-4">
            <div>
                <h1 className="text-2xl font-bold tracking-tight text-slate-100">{secondaryTitle}</h1>
            </div>
            <div className="flex flex-wrap gap-2">
                <Button onClick={() => handleUnsupportedFeature('Chrome Chỉ Định')} className="bg-blue-600 hover:bg-blue-700 text-white shine-effect">
                    Chrome Chỉ Định
                </Button>
                <Button onClick={() => handleUnsupportedFeature('Auto Login')} className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white shine-effect">
                    <Bot className="mr-2 h-4 w-4" /> Auto Login
                </Button>
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="outline" className="border-amber-500 text-amber-500 hover:bg-amber-500/10 hover:text-amber-400">
                            Hành động hàng loạt <ChevronDown className="ml-2 h-4 w-4" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="bg-slate-800 border-slate-700 text-white">
                        <DropdownMenuItem onClick={() => handleBulkAction('Thành công')}>Đánh dấu Thành công</DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleBulkAction('Từ chối')}>Đánh dấu Từ chối</DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleBulkAction('Yêu cầu Phê duyệt')}>Yêu cầu Phê duyệt</DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>
        </header>

        {children}
      </CardContent>
    </Card>
  );
};

export default ContentWindow;