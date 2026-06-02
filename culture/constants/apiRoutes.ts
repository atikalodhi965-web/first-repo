export const API_ROUTES = {
  AUTH: {
    SEND_OTP: '/otpRoutes/send',
    VERIFY_OTP: '/otpRoutes/verify',
    OTP_AUTH: '/auth/custom/otp-auth',
  },
  USER: {
    UPDATE_PROFILE: '/user/profile/update',
    GET_PROFILE: (userId: string) => `/user/profile/${userId}`,
    UPLOAD_IMAGE: '/profile/upload',
  },
  WALLET: {
    CREATE_WALLET: '/wallets/create-wallet',
    GET_WALLETS: (userId: string) => `/wallets/${userId}`,
  }
};
