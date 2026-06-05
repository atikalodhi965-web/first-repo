"use client"

import { useEffect, useState, useRef, useMemo } from "react"
import Image from "next/image"
import Link from "next/link"
import { Header } from "@/components/header"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  CalendarDays,
  Link as LinkIcon,
  MapPin,
  MoreHorizontal,
  Copy,
  Check,
  ArrowLeft,
  X,
  Camera,
  Loader2
} from "lucide-react"
import { Input } from "@/components/ui/input"
import { Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation"
import { cn } from "@/lib/utils"
import { useAuthStore } from "@/store/authStore"
import { fetchApi } from "@/lib/apiClient"
import { User } from "@/types/auth"
import { useSolanaWallet } from "@/hooks/useSolanaWallet"
import { toast } from "sonner"
import { API_ROUTES } from "@/constants/apiRoutes"
import { tokenService } from "@/services/token/tokenService"

// Followers and Following Mocks (can stay if they are still needed for fallback, but they are mostly replaced by real lists)

// Mock followers
const followers = [
  { id: "1", username: "DegenKing", handle: "@degenking", avatar: "https://picsum.photos/seed/user1/100/100", isFollowing: true },
  { id: "2", username: "MemeQueen", handle: "@memequeen", avatar: "https://picsum.photos/seed/user2/100/100", isFollowing: false },
  { id: "3", username: "SolanaMaxi", handle: "@solmaxi", avatar: "https://picsum.photos/seed/user3/100/100", isFollowing: true },
  { id: "4", username: "NFTCollector", handle: "@nftguy", avatar: "https://picsum.photos/seed/user4/100/100", isFollowing: false },
  { id: "5", username: "AlphaHunter", handle: "@alphahunt", avatar: "https://picsum.photos/seed/user5/100/100", isFollowing: true },
]

// Mock following
const following = [
  { id: "6", username: "TokenGod", handle: "@tokengod", avatar: "https://picsum.photos/seed/user6/100/100", isFollowing: true },
  { id: "7", username: "CryptoNinja", handle: "@cryptoninja", avatar: "https://picsum.photos/seed/user7/100/100", isFollowing: true },
  { id: "8", username: "DeFiChad", handle: "@defichad", avatar: "https://picsum.photos/seed/user8/100/100", isFollowing: true },
]



function formatNumber(num: number): string {
  if (num === null || num === undefined || isNaN(num)) return "$0.00"
  if (num >= 1_000_000) return `$${(num / 1_000_000).toFixed(2)}M`
  if (num >= 1_000) return `$${(num / 1_000).toFixed(2)}K`
  return `$${num.toFixed(2)}`
}

function formatCount(num: number): string {
  if (num === null || num === undefined || isNaN(num)) return "0"
  if (num >= 1_000_000) return `${(num / 1_000_000).toFixed(1)}M`
  if (num >= 1_000) return `${(num / 1_000).toFixed(1)}K`
  return num?.toString() || "0"
}

function ProfileContent() {
  const [activeTab, setActiveTab] = useState("coins")
  const [copied, setCopied] = useState(false)
  const [isFollowing, setIsFollowing] = useState(false)

  const { user: authUser, updateUser: updateAuthUser, logout } = useAuthStore()
  const { publicKey, disconnect } = useSolanaWallet()
  const searchParams = useSearchParams()
  const userIdFromQuery = searchParams.get('id')

  const [profile, setProfile] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [isOwnProfile, setIsOwnProfile] = useState(false)
  const [isEditMode, setIsEditMode] = useState(false)
  const [isUpdating, setIsUpdating] = useState(false)
  const [isUploading, setIsUploading] = useState(false)

  // Real data for followers/following
  const [followersList, setFollowersList] = useState<any[]>([])
  const [followingList, setFollowingList] = useState<any[]>([])
  const [followingIds, setFollowingIds] = useState<Set<string>>(new Set())
  const [realCreatorEarnings, setRealCreatorEarnings] = useState<{ totalEarned: number; coins: any[] }>({
    totalEarned: 0,
    coins: []
  })
  const [realCoinsHeld, setRealCoinsHeld] = useState<any[]>([])
  const [isCoinsLoading, setIsCoinsLoading] = useState(false)

  const fileInputRef = useRef<HTMLInputElement>(null)

  const [editForm, setEditForm] = useState({
    username: "",
    fullname: "",
    bio: "",
    website: "",
    profile_image_url: ""
  })

  const router = useRouter()

  // Calculate real portfolio totals
  const realPortfolioStats = useMemo(() => {
    return {
      totalValue: realCoinsHeld.reduce((sum, coin) => sum + (coin.tokens_held * coin.current_price), 0),
      totalInvested: realCoinsHeld.reduce((sum, coin) => sum + (coin.tokens_held * coin.avg_buy_price), 0),
      totalUnrealizedPnl: realCoinsHeld.reduce((sum, coin) => sum + (coin.unrealized_pnl || 0), 0),
      totalRealized: realCoinsHeld.reduce((sum, coin) => sum + (coin.realized_pnl || 0), 0),
    }
  }, [realCoinsHeld])

  const fetchProfileData = async () => {
    try {
      const targetId = userIdFromQuery || authUser?.id
      if (!targetId) {
        setLoading(false)
        return
      }

      const isOwn = targetId === authUser?.id
      setIsOwnProfile(isOwn)

      // 1. Fetch Profile - Use /profile/me for own profile to get private fields
      const profileEndpoint = isOwn ? '/user/profile/me' : `/user/profile/${targetId}`
      const profileRes = await fetchApi<{ success: boolean; data: any }>(profileEndpoint)

      if (profileRes.success) {
        setProfile(profileRes.data)
        setEditForm({
          username: profileRes.data.username || "",
          fullname: profileRes.data.fullname || "",
          bio: profileRes.data.bio || "",
          website: profileRes.data.website || "",
          profile_image_url: profileRes.data.profile_image_url || ""
        })
      }

      // 2. Fetch Followers, Following & Earnings
      const [followersRes, followingRes, earningsRes] = await Promise.all([
        fetchApi<{ success: boolean; data: any[] }>(`/user/followers/${targetId}`),
        fetchApi<{ success: boolean; data: any[] }>(`/user/following/${targetId}`),
        fetchApi<{ success: boolean; data: any }>(`/user/creator-earnings/${targetId}`)
      ])

      if (followersRes.success) setFollowersList(followersRes.data || [])
      if (followingRes.success) setFollowingList(followingRes.data || [])
      if (earningsRes.success) {
        const earningsArray = Array.isArray(earningsRes.data) ? earningsRes.data : [];
        const total = earningsArray.reduce((sum, item) => sum + Number(item.total_earned || 0), 0);
        setRealCreatorEarnings({
          totalEarned: total,
          coins: earningsArray
        })
      }

      // 4. If logged in, fetch current user's following list to show "Follow/Following" buttons correctly
      if (authUser?.id) {
        const myFollowingRes = await fetchApi<{ success: boolean; data: any[] }>(`/user/following/${authUser.id}`)
        if (myFollowingRes.success) {
          const ids = new Set(myFollowingRes.data.map(u => u.id))
          setFollowingIds(ids)
          setIsFollowing(ids.has(targetId))
        }
      }

      // 5. Fetch Coins Held
      setIsCoinsLoading(true)
      const coinsRes = await tokenService.getCoinsHeld(targetId)
      if (coinsRes.success) {
        setRealCoinsHeld(coinsRes.data || [])
      }
      setIsCoinsLoading(false)

    } catch (error: any) {
      console.error("Error fetching profile data:", error)
      if (error.message === 'User not found' && isOwnProfile) {
        console.log("Session user not found in DB, logging out...")
        logout()
        disconnect()
        router.push('/')
      }
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchProfileData()
  }, [userIdFromQuery, authUser?.id, activeTab]) // Re-fetch when switching tabs

  const handleFollowToggle = async (targetId: string) => {
    if (!authUser?.id) {
      toast.error("Please log in to follow users")
      return
    }

    const isCurrentlyFollowing = followingIds.has(targetId)
    const endpoint = isCurrentlyFollowing ? '/user/unfollow' : '/user/follow'

    try {
      const response = await fetchApi<{ success: boolean; message: string }>(endpoint, {
        method: 'POST',
        body: JSON.stringify({
          followingId: targetId
        })
      })

      if (response.success) {
        const newFollowingIds = new Set(followingIds)
        if (isCurrentlyFollowing) {
          newFollowingIds.delete(targetId)
          toast.success("Unfollowed user")
        } else {
          newFollowingIds.add(targetId)
          toast.success("Followed user")
        }
        setFollowingIds(newFollowingIds)

        // Update main profile isFollowing if it's the current target
        if (targetId === profile?.id) {
          setIsFollowing(!isCurrentlyFollowing)
          // Also update count in UI - Fix: Use Number() to avoid string concatenation "01"
          setProfile(prev => prev ? {
            ...prev,
            followers_count: Number(prev.followers_count || 0) + (isCurrentlyFollowing ? -1 : 1)
          } : null)
        }

        // If it's my own profile, update my following count
        if (isOwnProfile) {
          setProfile(prev => prev ? {
            ...prev,
            following_count: Number(prev.following_count || 0) + (isCurrentlyFollowing ? -1 : 1)
          } : null)
        }

        // Refresh lists to show new data in tabs
        fetchProfileData()
      }
    } catch (error) {
      console.error("Error toggling follow:", error)
      toast.error("Action failed")
    }
  }

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast.error("File size too large (max 5MB)");
      return;
    }

    setIsUploading(true);
    const formData = new FormData();
    formData.append('profilePic', file);

    try {
      const baseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080/api";
      const response = await fetch(`${baseUrl}${API_ROUTES.USER.UPLOAD_IMAGE}`, {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();
      if (data.success && data.url) {
        setEditForm(prev => ({ ...prev, profile_image_url: data.url }));
        toast.success("Profile photo uploaded");
      } else {
        toast.error(data.error || "Upload failed");
      }
    } catch (error) {
      console.error("Upload error:", error);
      toast.error("Upload failed");
    } finally {
      setIsUploading(false);
    }
  }

  const handleEditSave = async () => {
    if (!authUser?.id) return

    setIsUpdating(true)
    try {
      const response = await fetchApi<{ success: boolean; data: any }>('/user/profile/update', {
        method: 'POST',
        body: JSON.stringify({
          ...editForm
        })
      })

      if (response.success) {
        setProfile(response.data)
        updateAuthUser(response.data)
        setIsEditMode(false)
      }
    } catch (error) {
      console.error("Error updating profile:", error)
    } finally {
      setIsUpdating(false)
    }
  }

  const getDisplayAddress = () => {
    // If it's my own profile, prioritize the connected wallet address from the hook
    if (isOwnProfile && publicKey) {
      return publicKey.toBase58()
    }
    // Otherwise use the address from the backend profile
    return profile?.wallet_address || profile?.id
  }

  const copyAddress = () => {
    const address = getDisplayAddress()
    if (!address) return
    navigator.clipboard.writeText(address)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="flex h-[60vh] items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </div>
    )
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="flex h-[60vh] flex-col items-center justify-center gap-4">
          <p className="text-muted-foreground">User not found</p>
          <Button onClick={() => router.push('/')}>Go Home</Button>
        </div>
      </div>
    )
  }

  return (
    <Suspense fallback={<div>Loading...</div>}>
      <div className="min-h-screen bg-background">
        <Header />

        <main className="mx-auto max-w-4xl px-4">
          {/* Profile Section */}
          <div className="px-4 py-6">
            {/* Back Button */}
            <button
              onClick={() => {
                if (window.history.length > 1) {
                  router.back()
                } else {
                  router.push("/")
                }
              }}
              className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-4"
            >
              <ArrowLeft className="h-5 w-5" />
              <span className="text-sm font-medium">Back</span>
            </button>

            {/* Top Row: Avatar + Info + Actions */}
            <div className="flex items-start gap-4">
              {/* Avatar */}
              <div className="relative h-20 w-20 flex-shrink-0 overflow-hidden rounded-full border-2 border-border">
                <Image
                  src={profile.profile_image_url || "https://picsum.photos/seed/whale/200/200"}
                  alt={profile.username}
                  fill
                  className="object-cover"
                />
              </div>

              {/* Name and Handle */}
              <div className="flex-1 min-w-0 pt-1">
                <h2 className="text-xl font-bold truncate">{profile.username}</h2>
                <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                  <span className="text-sm text-muted-foreground">@{profile.username.toLowerCase()}</span>
                  {(() => {
                    const addr = getDisplayAddress();
                    if (!addr) return null;
                    return (
                      <button
                        onClick={copyAddress}
                        className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors bg-secondary px-2 py-0.5 rounded"
                      >
                        {addr.slice(0, 8)}...{addr.slice(-4)}
                        {copied ? <Check className="h-3 w-3 text-green-500" /> : <Copy className="h-3 w-3" />}
                      </button>
                    );
                  })()}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2 flex-shrink-0">
                {!isOwnProfile && (
                  <Button variant="outline" size="icon" className="rounded-full h-9 w-9">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                )}
                {isOwnProfile ? (
                  <Button
                    variant="outline"
                    className="rounded-full px-5 h-9"
                    onClick={() => setIsEditMode(true)}
                  >
                    Edit Profile
                  </Button>
                ) : (
                  <Button
                    variant={isFollowing ? "outline" : "default"}
                    className="rounded-full px-5 h-9"
                    onClick={() => handleFollowToggle(profile?.id || "")}
                  >
                    {isFollowing ? "Following" : "Follow"}
                  </Button>
                )}
              </div>
            </div>

            {/* Bio */}
            <p className="mt-4 text-[15px] text-foreground/90">{profile.bio || "No bio yet."}</p>

            {/* Meta Info */}
            <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
              {profile.fullname && (
                <span className="flex items-center gap-1">
                  <MapPin className="h-4 w-4" />
                  {profile.fullname}
                </span>
              )}
              {profile.website && (
                <a
                  href={profile.website.startsWith('http') ? profile.website : `https://${profile.website}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 text-primary hover:underline"
                >
                  <LinkIcon className="h-4 w-4" />
                  {profile.website.replace(/^https?:\/\//, '')}
                </a>
              )}
              <span className="flex items-center gap-1">
                <CalendarDays className="h-4 w-4" />
                Joined {profile.joined_date ? new Date(profile.joined_date).toLocaleDateString('en-US', { month: 'long', year: 'numeric' }) : "Recently"}
              </span>
            </div>

            {/* Stats */}
            <div className="mt-3 flex gap-4 text-sm">
              <button className="hover:underline">
                <span className="font-bold">{profile.following_count || 0}</span>
                <span className="text-muted-foreground"> Following</span>
              </button>
              <button className="hover:underline">
                <span className="font-bold">{profile.followers_count || 0}</span>
                <span className="text-muted-foreground"> Followers</span>
              </button>
            </div>
          </div>

          {/* Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="w-full justify-start rounded-none border-b border-border/50 bg-transparent h-auto p-0">
              <TabsTrigger
                value="coins"
                className="flex-1 rounded-none border-b-2 border-transparent py-4 data-[state=active]:border-primary data-[state=active]:bg-transparent"
              >
                Coins Held
              </TabsTrigger>
              <TabsTrigger
                value="earnings"
                className="flex-1 rounded-none border-b-2 border-transparent py-4 data-[state=active]:border-primary data-[state=active]:bg-transparent"
              >
                Creator Earnings
              </TabsTrigger>
              <TabsTrigger
                value="followers"
                className="flex-1 rounded-none border-b-2 border-transparent py-4 data-[state=active]:border-primary data-[state=active]:bg-transparent"
              >
                Followers
              </TabsTrigger>
              <TabsTrigger
                value="following"
                className="flex-1 rounded-none border-b-2 border-transparent py-4 data-[state=active]:border-primary data-[state=active]:bg-transparent"
              >
                Following
              </TabsTrigger>
            </TabsList>

            {/* Coins Held Tab */}
            <TabsContent value="coins" className="mt-0">
              {/* Portfolio Stats Summary */}
              <div className="p-4 border-b border-border/50">
                <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                  <div className="rounded-xl bg-secondary/30 p-3">
                    <p className="text-xs text-muted-foreground">Total Value</p>
                    <p className="text-lg font-bold">{formatNumber(realPortfolioStats.totalValue)}</p>
                  </div>
                  <div className="rounded-xl bg-secondary/30 p-3">
                    <p className="text-xs text-muted-foreground">Total Invested</p>
                    <p className="text-lg font-bold">{formatNumber(realPortfolioStats.totalInvested)}</p>
                  </div>
                  <div className="rounded-xl bg-secondary/30 p-3">
                    <p className="text-xs text-muted-foreground">Unrealized P&L</p>
                    <p className={cn(
                      "text-lg font-bold",
                      realPortfolioStats.totalUnrealizedPnl >= 0 ? "text-green-500" : "text-red-500"
                    )}>
                      {realPortfolioStats.totalUnrealizedPnl >= 0 ? "+" : ""}{formatNumber(realPortfolioStats.totalUnrealizedPnl)}
                    </p>
                  </div>
                  <div className="rounded-xl bg-secondary/30 p-3">
                    <p className="text-xs text-muted-foreground">Realized P&L</p>
                    <p className={cn(
                      "text-lg font-bold",
                      realPortfolioStats.totalRealized >= 0 ? "text-green-500" : "text-red-500"
                    )}>
                      {realPortfolioStats.totalRealized >= 0 ? "+" : ""}{formatNumber(realPortfolioStats.totalRealized)}
                    </p>
                  </div>
                </div>
              </div>

              {/* Coins List */}
              <div className="divide-y divide-border/50">
                {isCoinsLoading ? (
                  <div className="flex items-center justify-center p-12">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  </div>
                ) : realCoinsHeld.length > 0 ? (
                  realCoinsHeld.map((coin) => (
                    <Link
                      key={coin.id}
                      href={`/token/${coin.id}`}
                      className="block p-4 hover:bg-secondary/30 transition-colors"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="relative h-12 w-12 overflow-hidden rounded-full">
                            <Image src={coin.logo_url || "https://picsum.photos/seed/token/100/100"} alt={coin.name} fill className="object-cover" />
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-semibold">{coin.name}</span>
                              <span className="text-sm text-primary">${coin.symbol}</span>
                            </div>
                            <p className="text-sm text-muted-foreground">
                              {coin.tokens_held.toLocaleString()} tokens
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold">{formatNumber(coin.tokens_held * coin.current_price)}</p>
                          <p className={cn(
                            "text-sm font-medium",
                            coin.pnl_percentage >= 0 ? "text-green-500" : "text-red-500"
                          )}>
                            {coin.pnl_percentage >= 0 ? "+" : ""}{coin.pnl_percentage.toFixed(1)}%
                          </p>
                        </div>
                      </div>

                      {/* Position Details */}
                      <div className="mt-3 grid grid-cols-4 gap-2 text-xs">
                        <div className="rounded-lg bg-secondary/20 p-2">
                          <p className="text-muted-foreground">Avg Buy</p>
                          <p className="font-medium">${coin.avg_buy_price < 0.0001 ? coin.avg_buy_price.toFixed(8) : coin.avg_buy_price.toFixed(6)}</p>
                        </div>
                        <div className="rounded-lg bg-secondary/20 p-2">
                          <p className="text-muted-foreground">Current</p>
                          <p className="font-medium">${coin.current_price < 0.0001 ? coin.current_price.toFixed(8) : coin.current_price.toFixed(6)}</p>
                        </div>
                        <div className="rounded-lg bg-secondary/20 p-2">
                          <p className="text-muted-foreground">Unrealized</p>
                          <p className={cn(
                            "font-medium",
                            coin.unrealized_pnl >= 0 ? "text-green-500" : "text-red-500"
                          )}>
                            {coin.unrealized_pnl >= 0 ? "+" : ""}{formatNumber(coin.unrealized_pnl)}
                          </p>
                        </div>
                        <div className="rounded-lg bg-secondary/20 p-2">
                          <p className="text-muted-foreground">Realized</p>
                          <p className={cn(
                            "font-medium",
                            coin.realized_pnl >= 0 ? "text-green-500" : "text-red-500"
                          )}>
                            {coin.realized_pnl >= 0 ? "+" : ""}{formatNumber(coin.realized_pnl)}
                          </p>
                        </div>
                      </div>
                    </Link>
                  ))
                ) : (
                  <div className="p-12 text-center text-muted-foreground">
                    No coins held yet.
                  </div>
                )}
              </div>
            </TabsContent>

            {/* Creator Earnings Tab */}
            <TabsContent value="earnings" className="mt-0">
              {/* Total Earnings Card */}
              <div className="p-5 border-b border-border/50">
                <div className="rounded-xl bg-gradient-to-br from-[#1a1a1a] to-[#0f0f0f] p-5 border border-border/30">
                  <p className="text-sm text-muted-foreground">Total across all coins</p>
                  <p className="text-3xl font-bold mt-1">{formatNumber(realCreatorEarnings.totalEarned)}</p>

                  {/* Chart Placeholder */}
                  <div className="mt-4 h-32 rounded-lg bg-[#0a0a0a] border border-border/20 flex items-center justify-center">
                    <p className="text-sm text-muted-foreground">Historical chart data is available for shareable coins</p>
                  </div>
                </div>
              </div>

              {/* Non-shareable Info */}
              <div className="p-5 border-b border-border/50">
                <h3 className="text-sm font-medium mb-3">Your created coins</h3>
                <div className="rounded-lg bg-primary/5 border border-primary/20 p-4 flex gap-3">
                  <div className="h-5 w-5 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-xs text-primary">i</span>
                  </div>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    Shareable coins allow you to claim rewards anytime. Non-shareable coins require claiming all rewards at once.
                  </p>
                </div>
              </div>

              {/* Earnings Table */}
              <div>
                {/* Table Header */}
                <div className="grid grid-cols-3 px-5 py-3 text-sm text-muted-foreground border-b border-border/50 bg-secondary/20">
                  <span>Coins</span>
                  <span className="text-center">Total earned</span>
                  <span className="text-right">Unclaimed</span>
                </div>

                {/* Table Rows */}
                {realCreatorEarnings.coins?.length > 0 ? (
                  realCreatorEarnings.coins.map((coin) => (
                    <Link
                      key={coin.coin_id}
                      href={`/token/${coin.coin_id}`}
                      className="grid grid-cols-3 items-center px-5 py-4 hover:bg-secondary/30 transition-colors border-b border-border/30"
                    >
                      <div className="flex items-center gap-3">
                        <div className="relative h-12 w-12 overflow-hidden rounded-full border border-border/50">
                          <Image
                            src={coin.logo_url || coin.image || "https://picsum.photos/seed/mymeme/100/100"}
                            alt={coin.name || "Token"}
                            fill
                            className="object-cover"
                          />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-semibold">{coin.name || "Unknown Token"}</span>
                            {coin.is_shareable && (
                              <div className="h-2 w-2 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)]" />
                            )}
                          </div>
                          <span className="text-sm text-muted-foreground">${coin.symbol || coin.ticker || "TOKEN"}</span>
                        </div>
                      </div>
                      <span className="text-center font-medium">{formatNumber(Number(coin.total_earned))}</span>
                      <div className="text-right">
                        <span className={cn(
                          "font-medium",
                          Number(coin.unclaimed) > 0 ? "text-green-500" : "text-muted-foreground"
                        )}>
                          {formatNumber(Number(coin.unclaimed))}
                        </span>
                        {Number(coin.unclaimed) > 0 && (
                          <Button
                            size="sm"
                            className="ml-3 h-7 rounded-full bg-green-500 hover:bg-green-600 text-black text-xs"
                            onClick={(e) => e.preventDefault()}
                          >
                            Claim
                          </Button>
                        )}
                      </div>
                    </Link>
                  ))
                ) : (
                  <div className="p-8 text-center text-muted-foreground">
                    No created coins yet.
                  </div>
                )}
              </div>
            </TabsContent>

            {/* Followers Tab */}
            <TabsContent value="followers" className="mt-0">
              <div className="divide-y divide-border/50">
                {followersList?.length > 0 ? (
                  followersList.map((user) => (
                    <div
                      key={user.id}
                      className="flex items-center justify-between p-4 hover:bg-secondary/30 transition-colors"
                    >
                      <Link href={`/profile?id=${user.id}`} className="flex items-center gap-3">
                        <div className="relative h-12 w-12 overflow-hidden rounded-full">
                          <Image
                            src={user.profile_image_url || "https://picsum.photos/seed/user1/100/100"}
                            alt={user.username}
                            fill
                            className="object-cover"
                          />
                        </div>
                        <div>
                          <p className="font-semibold">{user.username}</p>
                          <p className="text-sm text-muted-foreground">@{user.username.toLowerCase()}</p>
                        </div>
                      </Link>
                      {authUser?.id !== user.id && (
                        <Button
                          variant={followingIds.has(user.id) ? "outline" : "default"}
                          size="sm"
                          className="rounded-full"
                          onClick={() => handleFollowToggle(user.id)}
                        >
                          {followingIds.has(user.id) ? "Following" : "Follow"}
                        </Button>
                      )}
                    </div>
                  ))
                ) : (
                  <div className="p-8 text-center text-muted-foreground">
                    No followers yet.
                  </div>
                )}
              </div>
            </TabsContent>

            {/* Following Tab */}
            <TabsContent value="following" className="mt-0">
              <div className="divide-y divide-border/50">
                {followingList?.length > 0 ? (
                  followingList.map((user) => (
                    <div
                      key={user.id}
                      className="flex items-center justify-between p-4 hover:bg-secondary/30 transition-colors"
                    >
                      <Link href={`/profile?id=${user.id}`} className="flex items-center gap-3">
                        <div className="relative h-12 w-12 overflow-hidden rounded-full">
                          <Image
                            src={user.profile_image_url || "https://picsum.photos/seed/user1/100/100"}
                            alt={user.username}
                            fill
                            className="object-cover"
                          />
                        </div>
                        <div>
                          <p className="font-semibold">{user.username}</p>
                          <p className="text-sm text-muted-foreground">@{user.username.toLowerCase()}</p>
                        </div>
                      </Link>
                      {authUser?.id !== user.id && (
                        <Button
                          variant="outline"
                          size="sm"
                          className="rounded-full"
                          onClick={() => handleFollowToggle(user.id)}
                        >
                          Following
                        </Button>
                      )}
                    </div>
                  ))
                ) : (
                  <div className="p-8 text-center text-muted-foreground">
                    Not following anyone yet.
                  </div>
                )}
              </div>
            </TabsContent>
          </Tabs>
        </main>

        {/* Edit Profile Modal */}
        {isEditMode && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80">
            <div className="w-full max-w-md mx-4 rounded-2xl bg-[#1a1a1a] border border-[#2a2a2a] overflow-hidden">
              {/* Modal Header */}
              <div className="flex items-center justify-between p-3 border-b border-[#2a2a2a]">
                <button
                  onClick={() => setIsEditMode(false)}
                  className="text-white hover:text-white/80 transition-colors"
                >
                  <X className="h-5 w-5" />
                </button>
                <h2 className="text-lg font-bold text-white">Edit Profile</h2>
                <Button
                  onClick={handleEditSave}
                  disabled={isUpdating}
                  className="rounded-full px-4 h-8 bg-white text-black hover:bg-white/90 font-semibold"
                >
                  {isUpdating ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save"}
                </Button>
              </div>

              {/* Avatar Section */}
              <div className="p-4 border-b border-[#2a2a2a]">
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <div className="h-16 w-16 rounded-full overflow-hidden border-2 border-[#2a2a2a]">
                      <Image
                        src={editForm.profile_image_url || profile.profile_image_url || "https://picsum.photos/seed/whale/200/200"}
                        alt={profile.username}
                        fill
                        className="object-cover"
                      />
                    </div>
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      disabled={isUploading}
                      className="absolute bottom-0 right-0 h-8 w-8 rounded-full bg-[#4ade80] flex items-center justify-center hover:bg-[#3fcf70] transition-colors disabled:opacity-50"
                    >
                      {isUploading ? <Loader2 className="h-3 w-3 animate-spin text-black" /> : <Camera className="h-4 w-4 text-black" />}
                    </button>
                    <input
                      type="file"
                      ref={fileInputRef}
                      className="hidden"
                      accept="image/*"
                      onChange={handleImageUpload}
                    />
                  </div>
                  <div>
                    <p className="text-sm text-white font-medium">Profile Photo</p>
                    <p className="text-xs text-[#6a6a6a] mt-1">Click the camera icon to upload</p>
                  </div>
                </div>
              </div>

              {/* Form Fields */}
              <div className="p-4 space-y-4">
                {/* Username */}
                <div>
                  <label className="block text-sm font-medium text-white mb-2">Username</label>
                  <Input
                    value={editForm.username}
                    onChange={(e) => setEditForm({ ...editForm, username: e.target.value })}
                    className="bg-[#0f0f0f] border-[#2a2a2a] text-white placeholder:text-[#6a6a6a] focus:border-[#4ade80] h-11"
                    placeholder="Enter username"
                  />
                </div>

                {/* Bio */}
                <div>
                  <label className="block text-sm font-medium text-white mb-2">Bio</label>
                  <textarea
                    value={editForm.bio}
                    onChange={(e) => setEditForm({ ...editForm, bio: e.target.value })}
                    className="w-full bg-[#0f0f0f] border border-[#2a2a2a] text-white placeholder:text-[#6a6a6a] focus:border-[#4ade80] focus:outline-none rounded-lg p-3 min-h-[80px] resize-none"
                    placeholder="Tell us about yourself"
                    maxLength={160}
                  />
                  <p className="text-xs text-[#6a6a6a] mt-1 text-right">{editForm.bio.length}/160</p>
                </div>

                {/* Fullname (Location mock was here) */}
                <div>
                  <label className="block text-sm font-medium text-white mb-2">Full Name</label>
                  <Input
                    value={editForm.fullname}
                    onChange={(e) => setEditForm({ ...editForm, fullname: e.target.value })}
                    className="bg-[#0f0f0f] border-[#2a2a2a] text-white placeholder:text-[#6a6a6a] focus:border-[#4ade80] h-11"
                    placeholder="Enter full name"
                  />
                </div>

                {/* Website */}
                <div>
                  <label className="block text-sm font-medium text-white mb-2">Website</label>
                  <Input
                    value={editForm.website}
                    onChange={(e) => setEditForm({ ...editForm, website: e.target.value })}
                    className="bg-[#0f0f0f] border-[#2a2a2a] text-white placeholder:text-[#6a6a6a] focus:border-[#4ade80] h-11"
                    placeholder="yourwebsite.com"
                  />
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </Suspense>
  )
}

export default function PortfolioPage() {
  return (
    <Suspense fallback={
       <div className="min-h-screen bg-background">
         <Header />
         <div className="flex h-[60vh] items-center justify-center">
           <Loader2 className="h-8 w-8 animate-spin text-primary" />
         </div>
       </div>
    }>
      <ProfileContent />
    </Suspense>
  )
}
