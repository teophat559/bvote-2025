import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '../components/ui/dialog';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Smartphone, Key } from 'lucide-react';

const CheckpointHandler = ({ accountId, type, onSubmit, onClose }) => {
  const [otp, setOtp] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmitOtp = async () => {
    if (otp.length !== 6) {
      return;
    }

    setSubmitting(true);
    await onSubmit(otp);
    setSubmitting(false);
    setOtp('');
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {type === 'approval' ? (
              <>
                <Smartphone className="h-5 w-5 text-orange-500" />
                Yêu cầu phê duyệt từ thiết bị
              </>
            ) : (
              <>
                <Key className="h-5 w-5 text-blue-500" />
                Nhập mã OTP
              </>
            )}
          </DialogTitle>
        </DialogHeader>

        {type === 'approval' ? (
          <div className="space-y-4">
            <DialogDescription>
              Facebook yêu cầu phê duyệt từ thiết bị di động của bạn.
            </DialogDescription>

            <div className="bg-orange-50 dark:bg-orange-950/20 border border-orange-200 dark:border-orange-800 rounded-lg p-4">
              <h4 className="font-semibold mb-2 flex items-center gap-2">
                <Smartphone className="h-4 w-4" />
                Hướng dẫn phê duyệt:
              </h4>
              <ol className="list-decimal list-inside space-y-2 text-sm">
                <li>Mở ứng dụng Facebook trên điện thoại của bạn</li>
                <li>Kiểm tra thông báo phê duyệt đăng nhập</li>
                <li>Nhấn "Phê duyệt" hoặc "Approve"</li>
                <li>Hệ thống sẽ tự động phát hiện khi bạn phê duyệt</li>
              </ol>
            </div>

            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <div className="flex-shrink-0 w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
              Đang chờ phê duyệt từ thiết bị...
            </div>

            <Button variant="outline" onClick={onClose} className="w-full">
              Hủy
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            <DialogDescription>
              Nhập mã OTP 6 chữ số từ SMS hoặc email của bạn.
            </DialogDescription>

            <div className="space-y-2">
              <label className="text-sm font-medium">
                Mã OTP (6 chữ số)
              </label>
              <Input
                type="text"
                placeholder="000000"
                value={otp}
                onChange={(e) => {
                  const value = e.target.value.replace(/\D/g, '').slice(0, 6);
                  setOtp(value);
                }}
                maxLength={6}
                className="text-center text-2xl font-mono tracking-widest"
                autoFocus
              />
            </div>

            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={onClose}
                className="flex-1"
              >
                Hủy
              </Button>
              <Button
                onClick={handleSubmitOtp}
                disabled={otp.length !== 6 || submitting}
                className="flex-1"
              >
                {submitting ? 'Đang gửi...' : 'Xác nhận'}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default CheckpointHandler;
