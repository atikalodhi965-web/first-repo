import axios from 'axios';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

export interface TrendingVideo {
  id: string;
  coin_id: string;
  token_name: string;
  token_symbol: string;
  token_image: string;
  market_cap: number;
  bonding_progress: number;
  price_change_24h: number;
  volume_24h: number;
  thumbnail_url: string;
  username: string;
  profile_image_url: string;
}

export interface TrendingVideosResponse {
  success: boolean;
  videos: TrendingVideo[];
  hasMore: boolean;
}

export const videoService = {
  getTrendingVideos: async (limit: number = 10, offset: number = 0): Promise<TrendingVideosResponse> => {
    const response = await axios.get(`${API_BASE_URL}/videos/trending`, {
      params: { limit, offset }
    });
    return response.data;
  },

  getVideoFeed: async (limit: number = 20, offset: number = 0): Promise<TrendingVideosResponse> => {
    const response = await axios.get(`${API_BASE_URL}/videos/feed`, {
      params: { limit, offset }
    });
    return response.data;
  },

  getVideoDetails: async (videoId: string) => {
    const response = await axios.get(`${API_BASE_URL}/videos/${videoId}`);
    return response.data;
  },

  interactWithVideo: async (videoId: string, action: 'like' | 'share' | 'view', userId?: string) => {
    const response = await axios.post(`${API_BASE_URL}/videos/${videoId}/interact`, {
      action,
      userId
    });
    return response.data;
  },

  getVideosByCoin: async (coinId: string) => {
    const response = await axios.get(`${API_BASE_URL}/videos/coin/${coinId}`);
    return response.data;
  }
};
