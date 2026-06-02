import { useState } from 'react';
import { useAuthStore } from '@/store/authStore';
import { authService } from '@/services/auth/authService';
import { userService } from '@/services/user/userService';
import { OTPAuthRequest, UpdateProfileRequest } from '@/types/auth';
import { toast } from 'sonner';

export const useAuth = () => {
  const { user, token, isAuthenticated, setAuth, updateUser, logout } = useAuthStore();
  const [isLoading, setIsLoading] = useState(false);

  const requestOTP = async (identifier: string, type: 'email' | 'phone') => {
    setIsLoading(true);
    try {
      const res = await authService.sendOTP({ identifier, type });
      if (res.success) {
        toast.success(res.message || 'OTP sent successfully');
        return true;
      } else {
        toast.error(res.error || 'Failed to send OTP');
        return false;
      }
    } catch (error: any) {
      toast.error(error.message || 'Failed to send OTP');
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const verifyOTPAndAuth = async (identifier: string, code: string, profileData?: Omit<OTPAuthRequest, 'identifier' | 'code'>) => {
    setIsLoading(true);
    try {
      const res = await authService.otpAuth({ identifier, code, ...profileData });
      if (res.success && res.user && res.token) {
        setAuth(res.user, res.token);
        console.log("user after ot-auth: ", res.user, "and token: ", res.token);
        return { success: true, isNewUser: res.isNewUser };
      } else {
        toast.error(res.error || 'Authentication failed');
        return { success: false };
      }
    } catch (error: any) {
      toast.error(error.message || 'Authentication failed');
      return { success: false };
    } finally {
      setIsLoading(false);
    }
  };

  const updateProfile = async (data: Omit<UpdateProfileRequest, 'userId'>) => {
    if (!user?.id) return false;
    setIsLoading(true);
    try {
      const res = await userService.updateProfile({ userId: user.id, ...data });
      if (res.success && res.data) {
        updateUser(res.data);
        toast.success('Profile updated successfully');
        return true;
      } else {
        toast.error(res.error || 'Failed to update profile');
        return false;
      }
    } catch (error: any) {
      toast.error(error.message || 'Failed to update profile');
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    user,
    token,
    isAuthenticated,
    isLoading,
    requestOTP,
    verifyOTPAndAuth,
    updateProfile,
    logout,
  };
};
