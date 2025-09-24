import React, { useState } from "react";
import { motion } from "framer-motion";
import { Helmet } from "react-helmet";
import { useNavigate } from "react-router-dom";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";
import { useAuth } from "@/hooks/useAuth";
import {
  Loader2,
  KeyRound,
  ShieldCheck,
  Server,
  Database,
  Code,
  ShieldEllipsis,
} from "lucide-react";

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
};

const itemVariants = {
  hidden: { y: 20, opacity: 0 },
  visible: {
    y: 0,
    opacity: 1,
    transition: {
      type: "spring",
      stiffness: 100,
    },
  },
};

const FloatingIcon = ({ icon: Icon, className, delay = 0, duration = 15 }) => (
  <motion.div
    className={`absolute text-muted-foreground/30 ${className}`}
    initial={{ y: -20, opacity: 0 }}
    animate={{ y: [0, -20, 0], opacity: [0.3, 0.7, 0.3] }}
    transition={{
      duration: duration,
      repeat: Infinity,
      repeatType: "loop",
      ease: "easeInOut",
      delay: delay,
    }}
  >
    <Icon className="w-12 h-12" />
  </motion.div>
);

const KeyLoginPage = () => {
  const [key, setKey] = useState("");
  const [loading, setLoading] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const { login } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!key) {
      toast({
        title: "Lỗi",
        description: "Vui lòng nhập khóa truy cập.",
        variant: "destructive",
      });
      return;
    }
    setLoading(true);
    try {
      await login(key);
      navigate("/");
    } catch (error) {
      toast({
        title: "Đăng nhập thất bại",
        description: error.message || "Vui lòng kiểm tra lại khóa truy cập.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Helmet>
        <title>Đăng nhập Admin - BVOTE Admin</title>
        <meta
          name="description"
          content="Trang đăng nhập dành cho quản trị viên hệ thống BVOTE Admin."
        />
      </Helmet>
      <div className="min-h-screen w-full flex items-center justify-center bg-background p-4 relative overflow-hidden">
        <FloatingIcon
          icon={Server}
          className="top-10 left-10"
          delay={0}
          duration={20}
        />
        <FloatingIcon
          icon={Database}
          className="top-1/3 right-16"
          delay={2}
          duration={18}
        />
        <FloatingIcon
          icon={Code}
          className="bottom-12 left-24"
          delay={4}
          duration={22}
        />
        <FloatingIcon
          icon={ShieldCheck}
          className="bottom-1/2 right-1/4"
          delay={6}
          duration={16}
        />

        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="w-full max-w-md z-10"
        >
          <motion.div
            className="bg-card border border-border p-8 rounded-xl shadow-2xl shadow-black/20"
            variants={itemVariants}
          >
            <div className="text-center mb-8">
              <motion.div
                animate={{ rotate: [0, -15, 15, -15, 0] }}
                transition={{ duration: 0.8, ease: "easeInOut" }}
                className="inline-block"
              >
                <ShieldEllipsis className="w-16 h-16 text-primary mx-auto" />
              </motion.div>
              <h1 className="text-3xl font-bold text-foreground mt-4">
                Cổng Truy Cập Admin
              </h1>
              <p className="text-muted-foreground mt-2">
                Vui lòng nhập mã key để tiếp tục.
              </p>
              <p className="text-xs text-primary/70 mt-1">
                Key mới: WEBBVOTE2025$ABC
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <motion.div
                variants={itemVariants}
                className="space-y-2 relative"
              >
                <Label
                  htmlFor="key"
                  className="text-sm font-medium text-muted-foreground"
                >
                  Mã Key Truy Cập
                </Label>
                <div className="relative">
                  <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                  <Input
                    id="key"
                    type="password"
                    value={key}
                    onChange={(e) => setKey(e.target.value)}
                    onFocus={() => setIsFocused(true)}
                    onBlur={() => setIsFocused(false)}
                    placeholder="Nhập: WEBBVOTE2025$ABC"
                    className="pl-10 h-12 text-lg bg-input border-border focus:bg-background/80"
                    required
                  />
                </div>
              </motion.div>

              <motion.div variants={itemVariants}>
                <Button
                  type="submit"
                  className="w-full h-12 text-md font-semibold"
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                      Đang Xác Thực...
                    </>
                  ) : (
                    "Truy Cập"
                  )}
                </Button>
              </motion.div>
            </form>
          </motion.div>
          <motion.p
            variants={itemVariants}
            className="text-center text-xs text-muted-foreground mt-6"
          >
            &copy; {new Date().getFullYear()} BVOTE System. All rights reserved.
          </motion.p>
        </motion.div>
      </div>
    </>
  );
};

export default KeyLoginPage;
