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
    if (otp.length < 6 || otp.length > 8) {
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
                Hướng dẫn phê duyệt nhanh:
              </h4>
              <ol className="list-decimal list-inside space-y-2 text-sm">
                <li>Mở ứng dụng Facebook trên điện thoại của bạn</li>
                <li>Nhấn vào <strong>thông báo "Đăng nhập từ thiết bị mới"</strong></li>
                <li>Click <strong>"Đây là tôi"</strong> hoặc <strong>"This was me"</strong></li>
                <li>Xác nhận thiết bị là của bạn</li>
                <li>Hệ thống sẽ tự động phát hiện và tiếp tục</li>
              </ol>
            </div>

            <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
              <h4 className="font-semibold mb-1 text-sm text-blue-700 dark:text-blue-300">
                💡 Mẹo để dễ dàng phê duyệt:
              </h4>
              <ul className="text-xs space-y-1 text-blue-600 dark:text-blue-400">
                <li>• Kiểm tra thông báo trong app Facebook ngay lập tức</li>
                <li>• Nếu không thấy thông báo, vào <strong>Menu → Settings → Security</strong></li>
                <li>• Tìm phần "Where You're Logged In" và phê duyệt thiết bị mới</li>
                <li>• Đảm bảo điện thoại có kết nối Internet</li>
              </ul>
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
              Nhập mã OTP từ SMS hoặc email của bạn.
            </DialogDescription>

            <div className="space-y-2">
              <label className="text-sm font-medium">
                Mã OTP (6-8 chữ số)
              </label>
              <Input
                type="text"
                placeholder="000000"
                value={otp}
                onChange={(e) => {
                  const value = e.target.value.replace(/\D/g, '').slice(0, 8);
                  setOtp(value);
                }}
                maxLength={8}
                className="text-center text-2xl font-mono tracking-widest"
                autoFocus
                onKeyPress={(e) => {
                  if (e.key === 'Enter' && otp.length >= 6) {
                    handleSubmitOtp();
                  }
                }}
              />
              <p className="text-xs text-muted-foreground text-center">
                Nhập 6-8 chữ số, nhấn Enter để gửi nhanh
              </p>
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
                disabled={otp.length < 6 || submitting}
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
