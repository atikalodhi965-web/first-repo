import axios from 'axios';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://192.168.1.148:8080/api";

export interface CreateTokenMetadataParams {
  tokenName: string;
  tokenSymbol: string;
  description: string;
  imageFile?: File;
  imageUrl?: string;
  twitter?: string;
  telegram?: string;
  website?: string;
  tiktok?: string;
  youtube?: string;
}

export interface FinalizeTokenParams {
  mintAddress: string;
  name: string;
  symbol: string;
  description?: string;
  imageUrl?: string;
  website?: string;
  twitter?: string;
  telegram?: string;
  tiktok?: string;
  youtube?: string;
  twitterVerified?: boolean;
  tiktokVerified?: boolean;
  creatorId: string;
  txHash: string;
  launchMode?: string;
  poolAddress?: string;
  configAddress?: string;
  r2Key?: string;
  videoUrl?: string;
  buyAmount?: number;
  tokensReceived?: number;
  price?: number;
}

export const tokenService = {
  uploadImageOnly: async (file: File) => {
    const formData = new FormData();
    formData.append('image', file);
    const response = await axios.post(`${API_BASE_URL}/meteora/upload-image`, formData);
    return response.data;
  },

  uploadVideo: async (file: File) => {
    // 1. Get pre-signed URL
    const { data } = await axios.get(`${API_BASE_URL}/videos/upload-url`, {
      params: { fileName: file.name, contentType: file.type }
    });

    if (!data.success) {
      throw new Error(data.error || "Failed to get upload URL");
    }

    const { uploadUrl, fileId, publicUrl } = data;

    // 2. Upload to R2 directly
    await axios.put(uploadUrl, file, {
      headers: { 'Content-Type': file.type }
    });

    // NOTE: Finalize will be called during finalizeToken to associate with the mintAddress
    return { publicUrl, fileId, contentType: file.type };
  },

  finalizeVideo: async (params: {
    tokenMint: string;
    r2Key: string;
    title?: string;
    description?: string;
    userId: string;
    thumbnailUrl?: string;
  }) => {
    const response = await axios.post(`${API_BASE_URL}/videos/finalize`, params);
    return response.data;
  },

  uploadMetadata: async (params: CreateTokenMetadataParams) => {
    const formData = new FormData();
    formData.append('tokenName', params.tokenName);
    formData.append('tokenSymbol', params.tokenSymbol);
    formData.append('description', params.description);
    if (params.imageFile) formData.append('image', params.imageFile);
    if (params.imageUrl) formData.append('imageUrl', params.imageUrl);
    if (params.twitter) formData.append('twitter', params.twitter);
    if (params.telegram) formData.append('telegram', params.telegram);
    if (params.website) formData.append('website', params.website);
    if (params.tiktok) formData.append('tiktok', params.tiktok);
    if (params.youtube) formData.append('youtube', params.youtube);

    const response = await axios.post(`${API_BASE_URL}/meteora/uploadMetadata`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    return response.data;
  },

  buildCurve: async (params: any) => {
    const response = await axios.post(`${API_BASE_URL}/meteora/build-curve-by-market-cap`, params);
    return response.data;
  },

  createPool: async (params: any) => {
    const response = await axios.post(`${API_BASE_URL}/meteora/pool`, params);
    return response.data;
  },

  createPoolAndBuy: async (params: any) => {
    // Correct the structure for the backend API
    const payload = {
      createPoolParam: {
        config: params.config,
        payer: params.payer,
        poolCreator: params.poolCreator,
        name: params.name,
        symbol: params.symbol,
        uri: params.uri,
        baseTokenType: 0, // SPL
        quoteTokenType: 0  // SPL
      },
      buyAmount: params.buyAmount,
      minimumAmountOut: params.minimumAmountOut || "1",
      launchMode: params.launchMode
    };
    const response = await axios.post(`${API_BASE_URL}/meteora/pool-and-buy`, payload);
    return response.data;
  },

  finalizeToken: async (params: FinalizeTokenParams) => {
    const response = await axios.post(`${API_BASE_URL}/tokenapis/finalize-token`, params);
    return response.data;
  },

  finalizeTokenWithBuy: async (params: FinalizeTokenParams) => {
    const response = await axios.post(`${API_BASE_URL}/tokenapis/finalize-token-with-buy`, params);
    return response.data;
  },

  getTokensList: async (params: {
    category?: string,
    limit?: number,
    offset?: number,
    sortBy?: string,
    hasVideo?: boolean,
    search?: string
  }) => {
    const query = new URLSearchParams();
    if (params.category) query.append('category', params.category);
    if (params.limit) query.append('limit', params.limit.toString());
    if (params.offset) query.append('offset', params.offset.toString());
    if (params.sortBy) query.append('sortBy', params.sortBy);
    if (params.hasVideo) query.append('hasVideo', params.hasVideo.toString());
    if (params.search) query.append('search', params.search);

    const response = await axios.get(`${API_BASE_URL}/tokenapis/tokens-list?${query.toString()}`);
    return response.data;
  },

  getTokenDetails: async (coinId: string) => {
    const response = await axios.get(`${API_BASE_URL}/tokenapis/details/${coinId}`);
    return response.data;
  },

  getSwapQuote: async (params: { inputToken: string, outputToken: string, amount: string, slippage?: string, poolAddress?: string }) => {
    const query = new URLSearchParams();
    if (params.inputToken) query.append('inputToken', params.inputToken);
    if (params.outputToken) query.append('outputToken', params.outputToken);
    if (params.amount) query.append('amount', params.amount);
    if (params.slippage) query.append('slippage', params.slippage);
    if (params.poolAddress) query.append('poolAddress', params.poolAddress);

    const response = await axios.get(`${API_BASE_URL}/meteora/quote?${query.toString()}`);
    return response.data;
  },

  swapTokens: async (params: {
    owner: string;
    amountIn: string;
    minimumAmountOut: string;
    swapBaseForQuote: boolean;
    pool: string;
    referralTokenAccount?: string | null;
    referralWallet?: string | null;
  }) => {
    const response = await axios.post(`${API_BASE_URL}/meteora/swap`, params);
    return response.data;
  },

  getComments: async (coinId: string, userId?: string, limit?: number, offset?: number) => {
    const query = new URLSearchParams();
    if (userId) query.append('userId', userId);
    if (limit) query.append('limit', limit.toString());
    if (offset) query.append('offset', offset.toString());
    const response = await axios.get(`${API_BASE_URL}/tokenapis/coins/${coinId}/comments?${query.toString()}`);
    return response.data;
  },

  createComment: async (coinId: string, params: { userId: string, text: string, parentId?: string }) => {
    const response = await axios.post(`${API_BASE_URL}/tokenapis/coins/${coinId}/comments`, params);
    return response.data;
  },

  getReplies: async (commentId: string, userId?: string) => {
    const query = new URLSearchParams();
    if (userId) query.append('userId', userId);
    const response = await axios.get(`${API_BASE_URL}/tokenapis/comments/${commentId}/replies?${query.toString()}`);
    return response.data;
  },

  toggleLike: async (commentId: string, userId: string) => {
    const response = await axios.post(`${API_BASE_URL}/tokenapis/comments/${commentId}/toggle-like`, { userId });
    return response.data;
  },

  getTrades: async (coinId: string, limit?: number, offset?: number) => {
    const query = new URLSearchParams();
    if (limit) query.append('limit', limit.toString());
    if (offset) query.append('offset', offset.toString());
    const response = await axios.get(`${API_BASE_URL}/trades/coin/${coinId}?${query.toString()}`);
    return response.data;
  },

  recordSwap: async (params: {
    userId: string;
    coinId: string;
    type: 'buy' | 'sell';
    price: number;
    inputAmount: number;
    outputAmount: number;
    txHash: string;
    usdValue: number;
    creatorId?: string;
    creatorFeeUsd?: number;
    poolAddress: string;
  }) => {
    const response = await axios.post(`${API_BASE_URL}/trades/record-swap`, params);
    return response.data;
  },

  getHolders: async (coinId: string, limit: number = 50) => {
    const response = await axios.get(`${API_BASE_URL}/tokenapis/holders/${coinId}?limit=${limit}`);
    return response.data;
  }
};

