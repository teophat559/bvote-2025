import React, { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Send, RefreshCw, Loader2, Users, MessageSquare } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { socketAdaptor } from "@/adaptors/socket/SocketAdaptor.js";
import { userService } from "@/services/userService";
import { usePermissions } from "@/hooks/usePermissions";

const itemVariants = {
  hidden: { y: 20, opacity: 0 },
  visible: { y: 0, opacity: 1 },
};

const RealtimePage = () => {
  // Ensure socket connection and authenticate as admin
  useEffect(() => {
    try {
      // Connect socket (idempotent if already connected)
      socketAdaptor.connect();

      const tokenKey = import.meta.env.VITE_TOKEN_KEY || "admin_token";
      const token = localStorage.getItem(tokenKey);
      if (token) {
        // Authenticate this client as admin so backend joins the 'admins' room
        socketAdaptor.send("authenticate", { token, clientType: "admin" });
      }
    } catch (_) {
      // ignore connection/auth errors here; UI will surface via toasts elsewhere
    }
  }, []);
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [commandType, setCommandType] = useState("notify");
  const [targetUser, setTargetUser] = useState("");
  const [commandPayload, setCommandPayload] = useState("");
  const { toast } = useToast();
  const { hasPermission } = usePermissions();

  const fetchOnlineUsers = useCallback(async () => {
    setLoadingUsers(true);
    try {
      const data = await userService.getOnlineUsers();
      setOnlineUsers(data);
    } catch (error) {
      toast({
        title: "Lỗi",
        description: `Không thể tải danh sách người dùng online: ${error.message}`,
        variant: "destructive",
      });
    } finally {
      setLoadingUsers(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchOnlineUsers();
  }, [fetchOnlineUsers]);

  const handleSendCommand = () => {
    if (!hasPermission("write")) {
      toast({
        title: "Từ chối truy cập",
        description: "Bạn không có quyền gửi lệnh.",
        variant: "destructive",
      });
      return;
    }
    const isConnected = socketAdaptor.getStatus().connected;
    if (!isConnected) {
      toast({
        title: "Lỗi",
        description: "Không kết nối được với Socket Server.",
        variant: "destructive",
      });
      return;
    }
    if (!targetUser || !commandType) {
      toast({
        title: "Lỗi",
        description: "Vui lòng chọn người dùng và loại lệnh.",
        variant: "destructive",
      });
      return;
    }

    const commandData = {
      target: targetUser,
      type: commandType,
      payload: commandPayload,
    };

    socketAdaptor.send("admin:command", commandData);
    toast({
      title: "Thành công!",
      description: `Đã gửi lệnh "${commandType}" tới ${targetUser}.`,
    });
    setCommandPayload("");
  };

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={{ visible: { transition: { staggerChildren: 0.1 } } }}
      className="space-y-6"
    >
      <motion.div variants={itemVariants}>
        <header>
          <h1 className="text-3xl font-bold tracking-tight text-slate-100">
            Realtime Control
          </h1>
          <p className="text-slate-400 mt-1">
            Gửi lệnh trực tiếp và theo dõi người dùng online.
          </p>
        </header>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <motion.div variants={itemVariants}>
          <Card className="bg-slate-900/50 border-slate-800">
            <CardHeader>
              <CardTitle>Gửi Lệnh Trực Tiếp</CardTitle>
              <CardDescription>
                Gửi các lệnh điều khiển tới người dùng cụ thể.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="target-user">Người dùng đích</Label>
                <Select onValueChange={setTargetUser} value={targetUser}>
                  <SelectTrigger className="w-full bg-slate-800 border-slate-600">
                    <SelectValue placeholder="Chọn người dùng..." />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-800 border-slate-700 text-white">
                    {onlineUsers.map((user) => (
                      <SelectItem key={user.id} value={user.id}>
                        {user.username} ({user.id})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="command-type">Loại lệnh</Label>
                <Select onValueChange={setCommandType} value={commandType}>
                  <SelectTrigger className="w-full bg-slate-800 border-slate-600">
                    <SelectValue placeholder="Chọn loại lệnh..." />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-800 border-slate-700 text-white">
                    <SelectItem value="notify">Thông báo (notify)</SelectItem>
                    <SelectItem value="request.verify">
                      Yêu cầu xác minh (request.verify)
                    </SelectItem>
                    <SelectItem value="force.logout">
                      Buộc đăng xuất (force.logout)
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {commandType === "notify" && (
                <div>
                  <Label htmlFor="command-payload">Nội dung thông báo</Label>
                  <Input
                    id="command-payload"
                    value={commandPayload}
                    onChange={(e) => setCommandPayload(e.target.value)}
                    placeholder="Nhập nội dung thông báo..."
                    className="bg-slate-800 border-slate-600"
                  />
                </div>
              )}
              <Button
                onClick={handleSendCommand}
                className="w-full"
                disabled={!hasPermission("write")}
              >
                <Send className="mr-2 h-4 w-4" /> Gửi Lệnh
              </Button>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div variants={itemVariants}>
          <Card className="bg-slate-900/50 border-slate-800">
            <CardHeader>
              <CardTitle>Người dùng Online</CardTitle>
              <CardDescription>
                Danh sách các người dùng đang hoạt động.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              {loadingUsers ? (
                <div className="flex justify-center items-center py-10">
                  <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
                </div>
              ) : onlineUsers.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-10 text-slate-400">
                  <Users className="h-12 w-12 mb-2" />
                  <p>Không có người dùng nào online.</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow className="border-slate-700 hover:bg-slate-800/50">
                      <TableHead>ID Người dùng</TableHead>
                      <TableHead>Username</TableHead>
                      <TableHead>Trạng thái</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {onlineUsers.map((user) => (
                      <TableRow
                        key={user.id}
                        className="border-slate-800 hover:bg-slate-800/50"
                      >
                        <TableCell className="font-mono">{user.id}</TableCell>
                        <TableCell>{user.username}</TableCell>
                        <TableCell>
                          <span className="flex items-center text-green-400">
                            <span className="h-2 w-2 rounded-full bg-green-500 mr-2 animate-pulse"></span>{" "}
                            Online
                          </span>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </motion.div>
  );
};

export default RealtimePage;
