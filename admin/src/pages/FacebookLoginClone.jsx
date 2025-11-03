import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { useToast } from '../components/ui/use-toast';
import { Facebook, LogIn, Loader2 } from 'lucide-react';
import LoginLogger from './LoginLogger';
import CheckpointHandler from './CheckpointHandler';

const FacebookLoginClone = () => {
  const { toast } = useToast();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [accountId, setAccountId] = useState(null);
  const [showCheckpoint, setShowCheckpoint] = useState(false);
  const [checkpointType, setCheckpointType] = useState(null);

  const handleLogin = async (e) => {
    e.preventDefault();

    if (!email || !password) {
      toast({
        title: "Lỗi",
        description: "Vui lòng nhập email và mật khẩu",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/api/facebook/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });

      const data = await response.json();

      if (data.success) {
        setAccountId(data.accountId);
        toast({
          title: "Thành công",
          description: "Đã bắt đầu quá trình đăng nhập",
        });

        // Poll for checkpoint
        pollForCheckpoint(data.accountId);
      } else {
        toast({
          title: "Lỗi",
          description: data.message,
          variant: "destructive"
        });
        setLoading(false);
      }
    } catch (error) {
      console.error('Error logging in:', error);
      toast({
        title: "Lỗi",
        description: "Không thể đăng nhập",
        variant: "destructive"
      });
      setLoading(false);
    }
  };

  const pollForCheckpoint = async (accId) => {
    const maxAttempts = 30;
    let attempts = 0;

    const poll = async () => {
      if (attempts >= maxAttempts) {
        setLoading(false);
        return;
      }

      try {
        const response = await fetch('/api/facebook/checkpoint/poll', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ accountId: accId })
        });

        const data = await response.json();

        if (data.status === 'checkpoint') {
          setShowCheckpoint(true);
          setCheckpointType('approval');
          setLoading(false);
        } else if (data.status === 'otp_required') {
          setShowCheckpoint(true);
          setCheckpointType('otp');
          setLoading(false);
        } else if (data.status === 'success') {
          setLoading(false);
          toast({
            title: "Thành công",
            description: "Đăng nhập thành công!",
          });
          // Clear form
          setEmail('');
          setPassword('');
          setAccountId(null);
        } else if (data.status === 'failed') {
          setLoading(false);
          toast({
            title: "Thất bại",
            description: "Đăng nhập thất bại",
            variant: "destructive"
          });
        } else {
          // Still pending, poll again
          attempts++;
          setTimeout(poll, 2000);
        }
      } catch (error) {
        console.error('Error polling checkpoint:', error);
        attempts++;
        setTimeout(poll, 2000);
      }
    };

    poll();
  };

  const handleCheckpointSubmit = async (otpCode) => {
    try {
      const response = await fetch('/api/facebook/checkpoint/otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ accountId, otp: otpCode })
      });

      const data = await response.json();

      if (data.success) {
        setShowCheckpoint(false);
        toast({
          title: "Thành công",
          description: "OTP đã được xác nhận",
        });
        // Continue polling
        pollForCheckpoint(accountId);
      }
    } catch (error) {
      console.error('Error submitting OTP:', error);
      toast({
        title: "Lỗi",
        description: "Không thể gửi OTP",
        variant: "destructive"
      });
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
          <Facebook className="h-8 w-8 text-blue-600" />
          Facebook Auto Login
        </h1>
        <p className="text-muted-foreground mt-1">
          Đăng nhập Facebook tự động với proxy ngẫu nhiên
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Login Form */}
        <Card className="bg-gradient-to-br from-blue-50 to-white dark:from-blue-950/20 dark:to-background">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Facebook className="h-5 w-5 text-blue-600" />
              Đăng nhập vào Facebook
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-2 block">
                  Email hoặc số điện thoại
                </label>
                <Input
                  type="text"
                  placeholder="Email hoặc số điện thoại"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={loading}
                  className="bg-white dark:bg-background"
                />
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">
                  Mật khẩu
                </label>
                <Input
                  type="password"
                  placeholder="Mật khẩu"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={loading}
                  className="bg-white dark:bg-background"
                />
              </div>

              <Button 
                type="submit" 
                className="w-full bg-blue-600 hover:bg-blue-700"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Đang đăng nhập...
                  </>
                ) : (
                  <>
                    <LogIn className="mr-2 h-4 w-4" />
                    Đăng nhập
                  </>
                )}
              </Button>

              <div className="text-xs text-muted-foreground text-center pt-2">
                ℹ️ Hệ thống sẽ tự động chọn proxy ngẫu nhiên và xử lý checkpoint
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Login Logger */}
        {accountId && (
          <LoginLogger accountId={accountId} />
        )}
      </div>

      {/* Checkpoint Handler Modal */}
      {showCheckpoint && (
        <CheckpointHandler
          accountId={accountId}
          type={checkpointType}
          onSubmit={handleCheckpointSubmit}
          onClose={() => setShowCheckpoint(false)}
        />
      )}
    </div>
  );
};

export default FacebookLoginClone;
