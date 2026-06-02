export interface User {
  id: string;
  username: string;
  email?: string | null;
  phone_number?: string | null;
  fullname?: string;
  bio?: string;
  profile_image_url?: string;
  website?: string;
  wallet_address?: string;
  joined_date?: string;
  followers_count?: number;
  following_count?: number;
  referral_code?: string;
}

export interface AuthResponse {
  success: boolean;
  message: string;
  isNewUser?: boolean;
  token?: string;
  user?: User;
  error?: string;
}

export interface OTPRequest {
  identifier: string;
  type: "email" | "phone";
}

export interface OTPAuthRequest {
  identifier: string;
  code: string;
  username?: string;
  fullname?: string;
  bio?: string;
  profile_image_url?: string;
  website?: string;
}

export interface UpdateProfileRequest {
  userId: string;
  username?: string;
  fullname?: string;
  bio?: string;
  profile_image_url?: string;
  website?: string;
}
