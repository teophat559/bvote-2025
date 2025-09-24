/**
 * JWT Auth Context - Thay thế Supabase Auth
 * Sử dụng backend Express.js với JWT tokens
 */

import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  useMemo,
} from "react";
import { authAPI } from "@/lib/apiClient";
import { useToast } from "@/components/ui/use-toast";

const AuthContext = createContext(undefined);
// Export context for hooks/components that need direct access
export { AuthContext };

export const AuthProvider = ({ children }) => {
  const { toast } = useToast();

  const [user, setUser] = useState(null);
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);

  // Initialize auth state
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        const { session, user } = await authAPI.getSession();
        setSession(session);
        setUser(user);
      } catch (error) {
        console.error("Failed to initialize auth:", error);
        setSession(null);
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    initializeAuth();
  }, []);

  const signUp = useCallback(
    async (email, password, options = {}) => {
      try {
        setLoading(true);
        const { data, error } = await authAPI.signUp(email, password, options);

        if (error) {
          toast({
            variant: "destructive",
            title: "Đăng ký thất bại",
            description: error.message || "Có lỗi xảy ra",
          });
          return { error };
        }

        toast({
          title: "Đăng ký thành công",
          description: "Tài khoản đã được tạo thành công",
        });

        return { data, error: null };
      } catch (error) {
        const errorMsg = "Đăng ký thất bại";
        toast({
          variant: "destructive",
          title: errorMsg,
          description: error.message || "Có lỗi xảy ra",
        });
        return { error: new Error(errorMsg) };
      } finally {
        setLoading(false);
      }
    },
    [toast]
  );

  const signIn = useCallback(
    async (identifier, password) => {
      try {
        setLoading(true);
        const { data, error } = await authAPI.signIn(identifier, password);

        if (error) {
          toast({
            variant: "destructive",
            title: "Đăng nhập thất bại",
            description: error.message || "Sai tên đăng nhập hoặc mật khẩu",
          });
          return { error };
        }

        // Update state với user data
        setUser(data.user);
        setSession({ access_token: data.accessToken });

        toast({
          title: "Đăng nhập thành công",
          description: `Xin chào ${data.user?.username || data.user?.email}`,
        });

        return { data, error: null };
      } catch (error) {
        const errorMsg = "Đăng nhập thất bại";
        toast({
          variant: "destructive",
          title: errorMsg,
          description: error.message || "Có lỗi xảy ra",
        });
        return { error: new Error(errorMsg) };
      } finally {
        setLoading(false);
      }
    },
    [toast]
  );

  const signOut = useCallback(async () => {
    try {
      setLoading(true);
      const { error } = await authAPI.signOut();

      if (error) {
        toast({
          variant: "destructive",
          title: "Đăng xuất thất bại",
          description: error.message || "Có lỗi xảy ra",
        });
        return { error };
      }

      // Clear state
      setUser(null);
      setSession(null);

      toast({
        title: "Đăng xuất thành công",
        description: "Hẹn gặp lại bạn!",
      });

      return { error: null };
    } catch (error) {
      const errorMsg = "Đăng xuất thất bại";
      toast({
        variant: "destructive",
        title: errorMsg,
        description: error.message || "Có lỗi xảy ra",
      });
      return { error: new Error(errorMsg) };
    } finally {
      setLoading(false);
    }
  }, [toast]);

  const refreshUserData = useCallback(async () => {
    try {
      const { data, error } = await authAPI.getUser();
      if (data && !error) {
        setUser(data);
      }
    } catch (error) {
      console.error("Failed to refresh user data:", error);
    }
  }, []);

  const value = useMemo(
    () => ({
      user,
      session,
      loading,
      signUp,
      signIn,
      signOut,
      refreshUserData,
    }),
    [user, session, loading, signUp, signIn, signOut, refreshUserData]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
