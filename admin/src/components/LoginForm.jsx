/**
 * Login Form Component
 * Handles user authentication with JWT tokens
 */

import React, { useState, useEffect } from 'react';
import { Eye, EyeOff, Lock, User, AlertCircle, CheckCircle } from 'lucide-react';
import { authService } from '../services/authService';
import { useToast } from '../hooks/useToast';

const LoginForm = ({ onLoginSuccess }) => {
  const [formData, setFormData] = useState({
    identifier: '',
    password: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [loginAttempts, setLoginAttempts] = useState(0);
  const [isLocked, setIsLocked] = useState(false);
  const [lockoutTime, setLockoutTime] = useState(0);

  const { toast } = useToast();

  // Check if account is locked
  useEffect(() => {
    const lockoutEnd = localStorage.getItem('lockoutEnd');
    if (lockoutEnd && Date.now() < parseInt(lockoutEnd)) {
      setIsLocked(true);
      setLockoutTime(parseInt(lockoutEnd));
      
      const timer = setInterval(() => {
        if (Date.now() >= parseInt(lockoutEnd)) {
          setIsLocked(false);
          setLockoutTime(0);
          localStorage.removeItem('lockoutEnd');
          clearInterval(timer);
        }
      }, 1000);

      return () => clearInterval(timer);
    }
  }, []);

  const validateForm = () => {
    const newErrors = {};

    if (!formData.identifier.trim()) {
      newErrors.identifier = 'Username or email is required';
    } else if (formData.identifier.length < 3) {
      newErrors.identifier = 'Username must be at least 3 characters';
    }

    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (isLocked) {
      toast({
        title: "Account Locked",
        description: "Too many failed attempts. Please wait before trying again.",
        variant: "error"
      });
      return;
    }

    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      const result = await authService.login(formData);

      if (result.success) {
        toast({
          title: "Login Successful",
          description: `Welcome back, ${result.user.username}!`,
          variant: "success"
        });

        // Reset attempts on successful login
        setLoginAttempts(0);
        localStorage.removeItem('loginAttempts');
        localStorage.removeItem('lockoutEnd');

        // Call success callback
        if (onLoginSuccess) {
          onLoginSuccess(result.user);
        }

        // Redirect to dashboard
        window.location.href = '/dashboard';
      }

    } catch (error) {
      const newAttempts = loginAttempts + 1;
      setLoginAttempts(newAttempts);
      localStorage.setItem('loginAttempts', newAttempts.toString());

      // Lock account after 5 failed attempts
      if (newAttempts >= 5) {
        const lockoutEnd = Date.now() + (15 * 60 * 1000); // 15 minutes
        localStorage.setItem('lockoutEnd', lockoutEnd.toString());
        setIsLocked(true);
        setLockoutTime(lockoutEnd);

        toast({
          title: "Account Locked",
          description: "Too many failed login attempts. Account locked for 15 minutes.",
          variant: "error"
        });
      } else {
        toast({
          title: "Login Failed",
          description: error.message || 'Invalid credentials',
          variant: "error"
        });
      }

      setErrors({
        general: error.message || 'Login failed. Please check your credentials.'
      });

    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));

    // Clear errors when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const getRemainingLockoutTime = () => {
    if (!isLocked || !lockoutTime) return '';
    
    const remaining = Math.ceil((lockoutTime - Date.now()) / 1000);
    const minutes = Math.floor(remaining / 60);
    const seconds = remaining % 60;
    
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="max-w-md w-full space-y-8 p-8 bg-white rounded-xl shadow-lg">
        {/* Header */}
        <div className="text-center">
          <div className="mx-auto h-12 w-12 bg-indigo-600 rounded-full flex items-center justify-center">
            <Lock className="h-6 w-6 text-white" />
          </div>
          <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
            BVOTE Admin Login
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Sign in to access the admin dashboard
          </p>
        </div>

        {/* Lockout Warning */}
        {isLocked && (
          <div className="bg-red-50 border border-red-200 rounded-md p-4">
            <div className="flex">
              <AlertCircle className="h-5 w-5 text-red-400" />
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">
                  Account Temporarily Locked
                </h3>
                <p className="mt-1 text-sm text-red-700">
                  Time remaining: {getRemainingLockoutTime()}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Login Form */}
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          {/* General Error */}
          {errors.general && (
            <div className="bg-red-50 border border-red-200 rounded-md p-4">
              <div className="flex">
                <AlertCircle className="h-5 w-5 text-red-400" />
                <div className="ml-3">
                  <p className="text-sm text-red-700">{errors.general}</p>
                </div>
              </div>
            </div>
          )}

          <div className="space-y-4">
            {/* Username/Email Field */}
            <div>
              <label htmlFor="identifier" className="sr-only">
                Username or Email
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <User className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="identifier"
                  name="identifier"
                  type="text"
                  autoComplete="username"
                  required
                  className={`appearance-none relative block w-full px-12 py-3 border ${
                    errors.identifier ? 'border-red-300' : 'border-gray-300'
                  } placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm`}
                  placeholder="Username or email address"
                  value={formData.identifier}
                  onChange={handleInputChange}
                  disabled={loading || isLocked}
                />
              </div>
              {errors.identifier && (
                <p className="mt-1 text-sm text-red-600">{errors.identifier}</p>
              )}
            </div>

            {/* Password Field */}
            <div>
              <label htmlFor="password" className="sr-only">
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  required
                  className={`appearance-none relative block w-full px-12 py-3 border ${
                    errors.password ? 'border-red-300' : 'border-gray-300'
                  } placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm pr-12`}
                  placeholder="Password"
                  value={formData.password}
                  onChange={handleInputChange}
                  disabled={loading || isLocked}
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  onClick={() => setShowPassword(!showPassword)}
                  disabled={loading || isLocked}
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                  ) : (
                    <Eye className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                  )}
                </button>
              </div>
              {errors.password && (
                <p className="mt-1 text-sm text-red-600">{errors.password}</p>
              )}
            </div>
          </div>

          {/* Login Attempts Warning */}
          {loginAttempts > 0 && loginAttempts < 5 && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4">
              <div className="flex">
                <AlertCircle className="h-5 w-5 text-yellow-400" />
                <div className="ml-3">
                  <p className="text-sm text-yellow-700">
                    {loginAttempts} failed attempt{loginAttempts > 1 ? 's' : ''}. 
                    Account will be locked after 5 failed attempts.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Submit Button */}
          <div>
            <button
              type="submit"
              disabled={loading || isLocked}
              className={`group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-md text-white ${
                loading || isLocked
                  ? 'bg-gray-400 cursor-not-allowed'
                  : 'bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500'
              } transition-colors duration-200`}
            >
              {loading ? (
                <div className="flex items-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Signing in...
                </div>
              ) : isLocked ? (
                'Account Locked'
              ) : (
                'Sign in'
              )}
            </button>
          </div>

          {/* Additional Options */}
          <div className="flex items-center justify-between">
            <div className="text-sm">
              <a href="#" className="font-medium text-indigo-600 hover:text-indigo-500">
                Forgot your password?
              </a>
            </div>
            <div className="text-sm">
              <span className="text-gray-500">Need help? Contact admin</span>
            </div>
          </div>
        </form>

        {/* Security Notice */}
        <div className="mt-6 text-center">
          <p className="text-xs text-gray-500">
            This is a secure admin area. All activities are logged and monitored.
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoginForm;
