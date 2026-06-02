import { fetchApi } from '@/lib/apiClient';
import { API_ROUTES } from '@/constants/apiRoutes';
import { UpdateProfileRequest, User } from '@/types/auth';

export const userService = {
  updateProfile: async (data: UpdateProfileRequest) => {
    return fetchApi<{ success: boolean; message: string; data: User; error?: string }>(
      API_ROUTES.USER.UPDATE_PROFILE,
      {
        method: 'POST',
        body: JSON.stringify(data),
      }
    );
  },

  getMyProfile: async () => {
    return fetchApi<{ success: boolean; data: User; error?: string }>(
      '/user/profile/me',
      {
        method: 'GET',
      }
    );
  },

  getProfile: async (userId: string) => {
    return fetchApi<{ success: boolean; data: User; error?: string }>(
      API_ROUTES.USER.GET_PROFILE(userId),
      {
        method: 'GET',
      }
    );
  },

  createWallet: async (data: { userId: string; address: string; chain: string; isPrimary?: boolean }) => {
    return fetchApi<{ success: boolean; wallet: any; message?: string; error?: string }>(
      API_ROUTES.WALLET.CREATE_WALLET,
      {
        method: 'POST',
        body: JSON.stringify(data),
      }
    );
  }
};
