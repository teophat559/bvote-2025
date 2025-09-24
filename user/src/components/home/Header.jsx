import React, { useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Menu, X, User, LogIn, LogOut, CheckCircle, Shield, Key } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { useAuth } from '@/context/AuthContext';
import { toast } from 'react-hot-toast';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import ConnectionStatusBadge from '@/components/ConnectionStatusBadge';
import AdminKeyModal from '@/components/admin/AdminKeyModal';
import { cn } from '@/lib/utils';
const Header = ({
  onLoginClick
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [adminKeyModalOpen, setAdminKeyModalOpen] = useState(false);
  const {
    isAuthenticated,
    user,
    signOut
  } = useAuth();
  const navigate = useNavigate();
  const handleSignOut = () => {
    signOut();
    toast.success('Đăng xuất thành công!');
    navigate('/');
  };
  const handleUnimplementedFeature = () => {
    toast("🚧 Tính năng này chưa được triển khai—nhưng đừng lo! Bạn có thể yêu cầu nó trong lần tương tác tới! 🚀");
  };
  const menuVariants = {
    closed: {
      opacity: 0,
      x: "-100%"
    },
    open: {
      opacity: 1,
      x: "0%"
    }
  };
  const navLinkClass = ({
    isActive
  }) => cn("relative font-bold text-sm transition-colors duration-300 px-4 py-2 rounded-md", isActive ? "bg-primary/10 text-primary border border-primary/50 shadow-inner shadow-primary/10" : "text-muted-foreground hover:text-foreground hover:bg-accent/50");
  return <motion.header initial={{
    y: -100,
    opacity: 0
  }} animate={{
    y: 0,
    opacity: 1
  }} transition={{
    type: 'spring',
    stiffness: 100,
    damping: 20,
    delay: 0.2
  }} className="sticky top-0 z-40 bg-background/80 backdrop-blur-lg border-b border-border/50">
      <nav className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          <div className="flex-shrink-0">
            <Link to="/" className="text-2xl font-bold text-glow">
              BVOTE
            </Link>
          </div>

          <div className="hidden md:flex items-center space-x-2">
            <NavLink to="/" className={navLinkClass}>Trang chủ</NavLink>
            <NavLink to="/leaderboard" className={navLinkClass}>Bảng xếp hạng</NavLink>
            <button onClick={handleUnimplementedFeature} className="font-bold text-sm text-muted-foreground hover:text-foreground hover:bg-accent/50 px-4 py-2 rounded-md transition-colors duration-300"></button>
          </div>

          <div className="flex items-center space-x-4">
            {isAuthenticated && <ConnectionStatusBadge />}
            {isAuthenticated ? <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <motion.div whileHover={{
                scale: 1.1
              }} whileTap={{
                scale: 0.9
              }}>
                    <Button variant="ghost" className="relative h-10 w-10 rounded-full">
                      <Avatar>
                        <AvatarImage src={user.avatar || `https://api.dicebear.com/7.x/adventurer/svg?seed=${user.name}`} alt={user.name} />
                        <AvatarFallback>{user.name ? user.name.charAt(0).toUpperCase() : 'U'}</AvatarFallback>
                      </Avatar>
                    </Button>
                  </motion.div>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56" align="end">
                  <DropdownMenuLabel className="font-normal">
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-medium leading-none">{user.name}</p>
                      <p className="text-xs leading-none text-muted-foreground">
                        {user.role === 'admin' ? 'Quản trị viên' : 'Thành viên'}
                      </p>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onSelect={() => navigate('/profile')}>
                    <User className="mr-2 h-4 w-4" />
                    <span>Hồ sơ</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem onSelect={() => navigate('/kyc')}>
                    <CheckCircle className="mr-2 h-4 w-4" />
                    <span>Xác thực KYC</span>
                  </DropdownMenuItem>
                  {user.role === 'admin' && <DropdownMenuItem onSelect={() => navigate('/admin')}>
                      <Shield className="mr-2 h-4 w-4" />
                      <span>Trang quản trị</span>
                    </DropdownMenuItem>}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onSelect={handleSignOut}>
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Đăng xuất</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu> : (
                <div className="hidden md:flex items-center space-x-2">
                  <Button variant="glow" className="group" onClick={onLoginClick}>
                    Đăng nhập
                    <LogIn className="ml-2 w-4 h-4 transition-transform duration-300 group-hover:translate-x-1" />
                  </Button>
                  <Button 
                    variant="outline" 
                    size="icon"
                    onClick={() => setAdminKeyModalOpen(true)}
                    className="hover:bg-purple-500/10 hover:border-purple-400 border-slate-600"
                    title="Admin Access"
                  >
                    <Key className="w-4 h-4" />
                  </Button>
                </div>
              )}
            <div className="md:hidden">
              <button onClick={() => setIsOpen(!isOpen)} className="p-2 rounded-md text-muted-foreground hover:text-foreground hover:bg-accent">
                {isOpen ? <X /> : <Menu />}
              </button>
            </div>
          </div>
        </div>

        <AnimatePresence>
          {isOpen && <motion.div variants={menuVariants} initial="closed" animate="open" exit="closed" transition={{
          type: 'spring',
          stiffness: 300,
          damping: 30
        }} className="md:hidden pb-4 flex flex-col space-y-2">
              <NavLink to="/" className={({
            isActive
          }) => cn("block px-3 py-2 rounded-md text-base font-medium", isActive ? "text-primary bg-accent" : "text-muted-foreground hover:text-foreground hover:bg-accent")} onClick={() => setIsOpen(false)}>Trang chủ</NavLink>
              <NavLink to="/leaderboard" className={({
            isActive
          }) => cn("block px-3 py-2 rounded-md text-base font-medium", isActive ? "text-primary bg-accent" : "text-muted-foreground hover:text-foreground hover:bg-accent")} onClick={() => setIsOpen(false)}>Bảng xếp hạng</NavLink>
              <button onClick={() => {
            handleUnimplementedFeature();
            setIsOpen(false);
          }} className="text-left block w-full px-3 py-2 rounded-md text-base font-medium text-muted-foreground hover:text-foreground hover:bg-accent">
                Cuộc thi
              </button>
              {!isAuthenticated && (
                <div className="space-y-2 mt-2">
                  <Button variant="glow" className="w-full justify-center group" onClick={() => {
                    onLoginClick();
                    setIsOpen(false);
                  }}>
                    Đăng nhập
                    <LogIn className="ml-2 w-4 h-4 transition-transform duration-300 group-hover:translate-x-1" />
                  </Button>
                  <Button 
                    variant="outline" 
                    className="w-full justify-center hover:bg-purple-500/10 hover:border-purple-400"
                    onClick={() => {
                      setAdminKeyModalOpen(true);
                      setIsOpen(false);
                    }}
                  >
                    <Key className="mr-2 w-4 h-4" />
                    Admin Access
                  </Button>
                </div>
              )}
            </motion.div>}
        </AnimatePresence>
      </nav>
      
      <AdminKeyModal 
        isOpen={adminKeyModalOpen} 
        onOpenChange={setAdminKeyModalOpen} 
      />
    </motion.header>;
};
export default Header;