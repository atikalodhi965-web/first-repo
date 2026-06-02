import { fetchApi } from '@/lib/apiClient';
import { API_ROUTES } from '@/constants/apiRoutes';
import { AuthResponse, OTPAuthRequest, OTPRequest } from '@/types/auth';

export const authService = {
  sendOTP: async (data: OTPRequest) => {
    return fetchApi<{ success: boolean; message: string; error?: string }>(
      API_ROUTES.AUTH.SEND_OTP,
      {
        method: 'POST',
        body: JSON.stringify(data),
      }
    );
  },

  otpAuth: async (data: OTPAuthRequest): Promise<AuthResponse> => {
    return fetchApi<AuthResponse>(API_ROUTES.AUTH.OTP_AUTH, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },
};
