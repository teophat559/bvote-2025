import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Settings } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';

const PlatformCard = ({ icon, name, description, initialEnabled }) => {
  const [isEnabled, setIsEnabled] = useState(initialEnabled);
  const { toast } = useToast();

  const handleConfigure = () => {
    toast({
      title: '🚧 Tính năng chưa được triển khai!',
      description: `Cấu hình chi tiết cho ${name} đang được phát triển. Bạn có thể yêu cầu trong lần tương tác tiếp theo! 🚀`,
    });
  };

  return (
    <Card className="bg-slate-900/50 border-slate-700 h-full flex flex-col hover:border-primary/50 transition-colors duration-300">
      <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-4">
        <div className="flex items-center gap-4">
          {icon}
          <CardTitle className="text-xl font-bold text-slate-100">{name}</CardTitle>
        </div>
        <Switch
          checked={isEnabled}
          onCheckedChange={setIsEnabled}
          aria-label={`Enable ${name}`}
        />
      </CardHeader>
      <CardContent className="flex-grow flex flex-col justify-between">
        <CardDescription className="text-slate-400 mb-4">{description}</CardDescription>
        <Button
          variant="outline"
          className="w-full bg-slate-800 hover:bg-slate-700 border-slate-600"
          onClick={handleConfigure}
        >
          <Settings className="mr-2 h-4 w-4" />
          Cấu hình
        </Button>
      </CardContent>
    </Card>
  );
};

export default PlatformCard;