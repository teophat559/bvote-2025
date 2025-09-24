import React from "react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";

const LoginRequestManager = () => {
  return (
    <Card className="bg-card/80 border-border/50 backdrop-blur-sm">
      <CardHeader>
        <CardTitle>Quản lý Yêu cầu Đăng nhập</CardTitle>
        <CardDescription>
          Xem và phê duyệt các yêu cầu đăng nhập từ người dùng.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <p>Nội dung quản lý yêu cầu đăng nhập sẽ được hiển thị ở đây.</p>
        <Button variant="glow">Xem Yêu cầu Mới</Button>
      </CardContent>
    </Card>
  );
};

export default LoginRequestManager;
