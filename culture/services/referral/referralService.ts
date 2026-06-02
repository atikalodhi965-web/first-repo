import { fetchApi } from "@/lib/apiClient";

export interface ReferralStats {
  totalEarned: number;
  activeReferrals: number;
  commissionPaid: number;
  referralCode: string;
}

export const referralService = {
  async getStats(userId: string) {
    return fetchApi<{ success: boolean; data: ReferralStats }>(`/referrals/stats/${userId}`);
  },

  async getLeaderboard() {
    return fetchApi<{ success: boolean; data: any[] }>(`/referrals/leaderboard`);
  },

  async getEarningConfig() {
    return fetchApi<{ success: boolean; data: { commissionRate: number, tiers: any[] } }>('/referrals/config');
  },

  async getReferralsList(userId: string) {
    return fetchApi<{ success: boolean; data: any[] }>(`/referrals/list/${userId}`);
  },

  async acceptReferral(userId: string, referralCode: string) {
    return fetchApi<{ success: boolean; message: string }>('/referrals/accept', {
      method: 'POST',
      body: JSON.stringify({ userId, referralCode })
    });
  },

  async skipReferral(userId: string) {
    return fetchApi<{ success: boolean; message: string }>('/referrals/skip', {
      method: 'POST',
      body: JSON.stringify({ userId })
    });
  }
};
