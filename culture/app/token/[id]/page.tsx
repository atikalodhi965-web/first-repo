"use client"

/**
 * Token Detail Page
 * Last updated: 2026-03-19
 */

import { useState, use, useEffect, useMemo, useRef, useCallback } from "react"
import Image from "next/image"
import Link from "next/link"
import { tokenService } from "@/services/token/tokenService"
import { videoService } from "@/services/video/videoService"
import { Header } from "@/components/header"
import { TokenComments } from "@/components/token-comments"
import { TokenTrades } from "@/components/token-trades"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { useSolanaWallet } from "@/hooks/useSolanaWallet"
import { useAuthStore } from "@/store/authStore"
import { fetchApi } from "@/lib/apiClient"
import { toast } from "sonner"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import {
  TrendingUp,
  TrendingDown,
  Clock,
  ExternalLink,
  Globe,
  MessageCircle,
  ArrowUpDown,
  Flame,
  Send,
  ThumbsUp,
  Play,
  Video,
  Pin,
  Share2,
  Twitter,
  Copy,
  Check,
  Wallet
} from "lucide-react"
import { PublicKey } from "@solana/web3.js"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { cn } from "@/lib/utils"

// Mock tokens database
const tokensData: Record<string, {
  id: string
  name: string
  ticker: string
  image: string
  marketCap: number
  priceChange24h: number
  bondingProgress: number
  holders: number
  createdAt: string
  description: string
  isHot?: boolean
  volume24h: number
  price: number
  totalSupply: number
  creator: string
  contractAddress: string
  twitter: string
  website: string
  telegram: string
  tiktok: string
}> = {
  "1": {
    id: "1",
    name: "MOONSHOT",
    ticker: "MOON",
    image: "https://picsum.photos/seed/moon1/400/400",
    marketCap: 12500000,
    priceChange24h: 89.24,
    bondingProgress: 6.41,
    holders: 4521,
    createdAt: new Date(Date.now() - 8 * 3600000).toISOString(),
    description: "To the moon! The ultimate moonshot token with community-driven rewards and auto-staking. Join us on our journey!",
    isHot: true,
    volume24h: 8900000,
    price: 0.00891,
    totalSupply: 1000000000,
    creator: "0x7f3...9a2c",
    contractAddress: "Moon5k3...89xKp",
    twitter: "https://twitter.com/moonshot",
    website: "https://moonshot.io",
    telegram: "https://t.me/moonshot",
    tiktok: "https://tiktok.com/@moonshot"
  },
  "2": {
    id: "2",
    name: "SOLCAT",
    ticker: "SCAT",
    image: "https://picsum.photos/seed/cat2/400/400",
    marketCap: 6780000,
    priceChange24h: 45.38,
    bondingProgress: 54.89,
    holders: 2341,
    createdAt: new Date(Date.now() - 10 * 3600000).toISOString(),
    description: "Solana Cat Token - The cutest cat on Solana! Community-driven meme token with NFT rewards.",
    volume24h: 3520000,
    price: 0.00667,
    totalSupply: 1000000000,
    creator: "0x4a1...bc3d",
    contractAddress: "SCat3k2...12xAb",
    twitter: "https://twitter.com/solcat",
    website: "https://solcat.io",
    telegram: "https://t.me/solcat",
    tiktok: "https://tiktok.com/@solcat"
  },
  "3": {
    id: "3",
    name: "GSD",
    ticker: "GSD",
    image: "https://picsum.photos/seed/gsd1/400/400",
    marketCap: 4430000,
    priceChange24h: 20.52,
    bondingProgress: 2.78,
    holders: 8934,
    createdAt: new Date(Date.now() - 19 * 3600000).toISOString(),
    description: "Get Shit Done - The productivity token for builders and doers. Earn rewards for completing tasks!",
    isHot: true,
    volume24h: 5740000,
    price: 0.00443,
    totalSupply: 1000000000,
    creator: "0x9e2...f1ab",
    contractAddress: "GSD8k4...45xCd",
    twitter: "https://twitter.com/gsdtoken",
    website: "https://gsd.io",
    telegram: "https://t.me/gsdtoken",
    tiktok: "https://tiktok.com/@gsdtoken"
  },
  "4": {
    id: "4",
    name: "COMPUTER",
    ticker: "COMPU",
    image: "https://picsum.photos/seed/comp1/400/400",
    marketCap: 47340,
    priceChange24h: 67.11,
    bondingProgress: 63.44,
    holders: 1256,
    createdAt: new Date(Date.now() - 6 * 3600000).toISOString(),
    description: "Donald boat computer - A meme token inspired by the viral tweet. Join the computer revolution!",
    volume24h: 151950,
    price: 0.0000472,
    totalSupply: 1000000000,
    creator: "0x2c4...d8ef",
    contractAddress: "Comp2k1...67xEf",
    twitter: "https://twitter.com/compuToken",
    website: "https://compu.io",
    telegram: "https://t.me/compu",
    tiktok: "https://tiktok.com/@compu"
  },
  "5": {
    id: "5",
    name: "ELIZA TOWN",
    ticker: "ELIZA",
    image: "https://picsum.photos/seed/eliza1/400/400",
    marketCap: 3130000,
    priceChange24h: 21.63,
    bondingProgress: 49.70,
    holders: 3421,
    createdAt: new Date(Date.now() - 6 * 3600000).toISOString(),
    description: "Eliza Town - Build your virtual town with AI companions. The future of social tokens!",
    volume24h: 3880000,
    price: 0.00314,
    totalSupply: 1000000000,
    creator: "0x6b8...a2c1",
    contractAddress: "Eliz4k3...89xGh",
    twitter: "https://twitter.com/elizatown",
    website: "https://elizatown.io",
    telegram: "https://t.me/elizatown",
    tiktok: "https://tiktok.com/@elizatown"
  },
  "6": {
    id: "6",
    name: "BETANET",
    ticker: "BETA",
    image: "https://picsum.photos/seed/beta1/400/400",
    marketCap: 9630,
    priceChange24h: 31.22,
    bondingProgress: 11.12,
    holders: 5678,
    createdAt: new Date(Date.now() - 15 * 3600000).toISOString(),
    description: "Betanet - Early access to the next generation of DeFi. Be first, be beta!",
    volume24h: 125000,
    price: 0.0000096,
    totalSupply: 1000000000,
    creator: "0x1d9...e3f2",
    contractAddress: "Beta6k5...23xIj",
    twitter: "https://twitter.com/betanet",
    website: "https://betanet.io",
    telegram: "https://t.me/betanet",
    tiktok: "https://tiktok.com/@betanet"
  }
}

// Default token for unknown IDs
const defaultToken = {
  id: "0",
  name: "Unknown Token",
  ticker: "???",
  image: "https://picsum.photos/seed/unknown/400/400",
  marketCap: 0,
  priceChange24h: 0,
  bondingProgress: 0,
  holders: 0,
  createdAt: new Date().toISOString(),
  description: "Token not found",
  volume24h: 0,
  price: 0,
  totalSupply: 0,
  creator: "Unknown",
  creatorId: "",
  contractAddress: "Unknown",
  twitter: "",
  website: "",
  telegram: "",
  tiktok: ""
}



const videos = [
  { id: 1, thumbnail: "https://picsum.photos/seed/vid1/300/400", views: 333300, caption: "", isPinned: true },
  { id: 2, thumbnail: "https://picsum.photos/seed/vid2/300/400", views: 3269, caption: "", isPinned: false },
  { id: 3, thumbnail: "https://picsum.photos/seed/vid3/300/400", views: 3752, caption: "Dev explains the roadmap", isPinned: false },
  { id: 4, thumbnail: "https://picsum.photos/seed/vid4/300/400", views: 78200, caption: "", isPinned: false },
  { id: 5, thumbnail: "https://picsum.photos/seed/vid5/300/400", views: 12400, caption: "Community AMA highlights", isPinned: false },
  { id: 6, thumbnail: "https://picsum.photos/seed/vid6/300/400", views: 45600, caption: "", isPinned: false },
]

function formatViews(num: number): string {
  if (num >= 1_000_000) return `${(num / 1_000_000).toFixed(1)}M`
  if (num >= 1_000) return `${(num / 1_000).toFixed(1)}K`
  return num.toString()
}

const comments = [
  { id: 1, user: "0x7f3...9a2c", message: "This project is going to moon! Dev is based and delivers on time.", time: "5m ago", likes: 12 },
  { id: 2, user: "0x4a1...bc3d", message: "Just aped in with 2 SOL. LFG!", time: "12m ago", likes: 8 },
  { id: 3, user: "0x9e2...f1ab", message: "Chart looking healthy. Diamond hands only.", time: "25m ago", likes: 15 },
  { id: 4, user: "0x2c4...d8ef", message: "Community is super active in TG. Bullish!", time: "45m ago", likes: 6 },
  { id: 5, user: "0x6b8...a2c1", message: "Best meme coin launch I've seen this week. Solid tokenomics.", time: "1h ago", likes: 22 },
]



function formatNumber(num: number): string {
  if (num >= 1_000_000) return `$${(num / 1_000_000).toFixed(2)}M`
  if (num >= 1_000) return `$${(num / 1_000).toFixed(1)}K`
  return `$${num.toFixed(2)}`
}

export default function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)

  const [token, setToken] = useState<any>(defaultToken)
  const [loading, setLoading] = useState(true)

  const [currentVideo, setCurrentVideo] = useState<any>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const videoRef = useRef<HTMLVideoElement>(null)

  const [holdersList, setHoldersList] = useState<any[]>([])
  const [isHoldersLoading, setIsHoldersLoading] = useState(false)

  useEffect(() => {
    const fetchToken = async () => {
      try {
        const res = await tokenService.getTokenDetails(id);
        if (res.success && res.data) {
          const d = res.data;
          setToken({
            // ... (keep existing token mapping)
            id: d.id,
            name: d.name || "Unknown Token",
            ticker: d.symbol || "???",
            image: d.logo_url || d.image_url || "https://picsum.photos/seed/unknown/400/400",
            marketCap: parseFloat(d.market_cap || "0"),
            priceChange24h: parseFloat(d.price_change_24h || "0"),
            bondingProgress: d.bonding_target_amount ? (parseFloat(d.bonding_current_amount || "0") / parseFloat(d.bonding_target_amount)) * 100 : 0,
            holders: 0,
            createdAt: d.created_at || new Date().toISOString(),
            description: d.description || "",
            isHot: false,
            volume24h: parseFloat(d.volume_24h || "0"),
            volume5m: parseFloat(d.volume_5m || "0"),
            volume1h: parseFloat(d.volume_24h || "0") * 0.04,
            volume6h: parseFloat(d.volume_6h || "0"),
            price: parseFloat(d.current_price || "0"),
            totalSupply: parseFloat(d.total_supply || "0"),
            creator: d.creator_name || "Unknown",
            creatorImage: d.creator_image || "https://picsum.photos/seed/creator/100/100",
            creatorId: d.created_by,
            contractAddress: d.mint_address || d.id,
            poolAddress: d.pool_address || "",
            twitter: d.twitter_url || "",
            website: d.website_url || "",
            telegram: d.telegram_url || "",
            tiktok: d.tiktok_url || "",
            athPrice: parseFloat(d.ath_price || "0"),
            athMarketCap: parseFloat(d.ath_marketcap || "0"),
            bondingCurrentAmount: parseFloat(d.bonding_current_amount || "0"),
            bondingTargetAmount: parseFloat(d.bonding_target_amount || "100"), // Assume 100 SOL if not set
          });

          // Fetch videos with current user ID to get 'is_liked' status
          const vidRes = await videoService.getVideosByCoin(d.id, authUser?.id);
          if (vidRes.success && vidRes.videos && vidRes.videos.length > 0) {
            setCurrentVideo(vidRes.videos[0]);
          }

          // Fetch holders
          fetchHolders();
        }
      } catch (err) {
        console.error("Failed to fetch token details:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchToken();
  }, [id]);

  const fetchHolders = async () => {
    setIsHoldersLoading(true);
    try {
      const res = await tokenService.getHolders(id, 20); // Fetch top 20
      if (res.success && res.data) {
        // Backend already sorts by tokens_held desc
        setHoldersList(res.data);
      }
    } catch (err) {
      console.error("Failed to fetch holders:", err);
    } finally {
      setIsHoldersLoading(false);
    }
  };

  const togglePlay = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const handleInteraction = async (action: 'like' | 'share' | 'view') => {
    if (!currentVideo?.id) return;
    try {
      if (action === 'share') {
        const shareUrl = window.location.href;
        navigator.clipboard.writeText(shareUrl);
        toast.success("Link copied to clipboard!");

        // Optimistic Update: Increase share count immediately
        setCurrentVideo((prev: any) => ({
          ...prev,
          shares_count: Number(prev?.shares_count || 0) + 1
        }));

        // Notify backend in background
        videoService.interactWithVideo(currentVideo.id, 'share', authUser?.id);
        return;
      }

      // Optimistically update likes local state for better responsiveness
      if (action === 'like') {
        const wasLiked = currentVideo.is_liked;
        setCurrentVideo((prev: any) => ({
          ...prev,
          likes_count: wasLiked ? Math.max(0, Number(prev.likes_count || 0) - 1) : Number(prev.likes_count || 0) + 1,
          is_liked: !wasLiked
        }));
      }

      const res = await videoService.interactWithVideo(currentVideo.id, action, authUser?.id);

      // If server returned a definitive state, sync it (especially for likes)
      if (res.success && action === 'like') {
        setCurrentVideo((prev: any) => ({
          ...prev,
          is_liked: res.liked,
          likes_count: res.liked ? Number(prev.likes_count) : Number(prev.likes_count) // The count was already adjusted optimistically
        }));
        toast.success(res.liked ? "Upvoted!" : "Upvote removed");
      }
    } catch (err) {
      console.error(`Error during video ${action}:`, err);
      // Fallback: If it failed, we could technically revert state here
    }
  };

  const { user: authUser } = useAuthStore()
  const [isFollowing, setIsFollowing] = useState(false)
  const [isFollowingLoading, setIsFollowingLoading] = useState(false)

  const [tradeType, setTradeType] = useState<"buy" | "sell">("buy")
  const [amount, setAmount] = useState("")
  const [quote, setQuote] = useState<any>(null)
  const [isQuoting, setIsQuoting] = useState(false)
  const [isSwapping, setIsSwapping] = useState(false)
  const [showAdvancedSettings, setShowAdvancedSettings] = useState(false)
  const [slippage, setSlippage] = useState("0.5")
  const [speed, setSpeed] = useState<"fast" | "turbo" | "ultra">("turbo")
  const [frontRunProtection, setFrontRunProtection] = useState(false)
  const [tipAmount, setTipAmount] = useState("0.003")

  const { connected, balance, publicKey, processSerializedTransaction, connection } = useSolanaWallet()
  const [tokenBalance, setTokenBalance] = useState<number>(0);

  // Fetch token balance when connected
  const fetchTokenBalance = useCallback(async () => {
    if (!publicKey || !token.contractAddress || !connection) return;
    try {
      const response = await connection.getTokenAccountsByOwner(publicKey, {
        mint: new PublicKey(token.contractAddress)
      });

      if (response.value.length > 0) {
        const accountInfo = await connection.getTokenAccountBalance(response.value[0].pubkey);
        setTokenBalance(accountInfo.value.uiAmount || 0);
      } else {
        setTokenBalance(0);
      }
    } catch (err) {
      console.error("Error fetching token balance:", err);
      setTokenBalance(0);
    }
  }, [publicKey, token.contractAddress, connection]);

  useEffect(() => {
    if (connected && token.contractAddress) {
      fetchTokenBalance();
    }
  }, [connected, token.contractAddress, fetchTokenBalance]);

  // Instant frontend calculation for swap quote
  const estimatedOutputRaw = useMemo(() => {
    if (!amount || isNaN(parseFloat(amount)) || parseFloat(amount) <= 0 || !token.price) return 0;
    const numAmount = parseFloat(amount);
    if (tradeType === "buy") {
      // You pay SOL, receive Token
      return numAmount / token.price;
    } else {
      // You pay Token, receive SOL
      return numAmount * token.price;
    }
  }, [amount, tradeType, token.price]);

  // Dynamic swap quote fetching from Meteora swap quote API
  useEffect(() => {
    const fetchQuote = async () => {
      if (!amount || isNaN(parseFloat(amount)) || parseFloat(amount) <= 0 || !token.poolAddress) {
        setQuote(null);
        return;
      }
      setIsQuoting(true);
      try {
        const solMint = 'So11111111111111111111111111111111111111112';
        const inputToken = tradeType === 'buy' ? solMint : token.contractAddress;
        console.log("input token: ", inputToken);
        const outputToken = tradeType === 'buy' ? token.contractAddress : solMint;
        console.log("output token: ", outputToken);
        console.log("amount: ", amount);
        console.log("slippage: ", slippage);
        console.log("poolAddress: ", token.poolAddress);
        const res = await tokenService.getSwapQuote({
          inputToken,
          outputToken,
          amount: amount, // Passed exactly in raw/human-readable amount field
          slippage: slippage,
          poolAddress: token.poolAddress
        });
        console.log("swap quote response: ", res);
        if (res && res.success) {
          setQuote(res);
        } else {
          setQuote(null);
        }
      } catch (err) {
        console.error("Error fetching swap quote:", err);
        setQuote(null);
      } finally {
        setIsQuoting(false);
      }
    };

    const timer = setTimeout(() => {
      fetchQuote();
    }, 500);

    return () => clearTimeout(timer);
  }, [amount, tradeType, slippage, token.contractAddress, token.poolAddress]);

  // Sync and fetch follow state for this token's creator
  useEffect(() => {
    const checkFollowStatus = async () => {
      if (!authUser?.id || !token.creatorId) return;
      try {
        const myFollowingRes = await fetchApi<{ success: boolean; data: any[] }>(`/user/following/${authUser.id}`);
        if (myFollowingRes.success && myFollowingRes.data) {
          const ids = new Set(myFollowingRes.data.map((u: any) => u.id));
          setIsFollowing(ids.has(token.creatorId));
        }
      } catch (err) {
        console.error("Error checking follow status:", err);
      }
    };
    checkFollowStatus();
  }, [authUser?.id, token.creatorId]);

  const handleFollowToggle = async () => {
    if (!authUser?.id) {
      toast.error("Please log in to follow creators");
      return;
    }
    if (!token.creatorId) {
      toast.error("Creator information is loading...");
      return;
    }
    if (authUser.id === token.creatorId) {
      toast.error("You cannot follow yourself!");
      return;
    }

    setIsFollowingLoading(true);
    const endpoint = isFollowing ? '/user/unfollow' : '/user/follow';

    try {
      const response = await fetchApi<{ success: boolean; message: string }>(endpoint, {
        method: 'POST',
        body: JSON.stringify({
          followingId: token.creatorId
        })
      });

      if (response.success) {
        setIsFollowing(!isFollowing);
        toast.success(isFollowing ? "Unfollowed creator" : "Followed creator");
      } else {
        toast.error(response.message || "Failed to toggle follow status");
      }
    } catch (error) {
      console.error("Error toggling follow:", error);
      toast.error("Action failed");
    } finally {
      setIsFollowingLoading(false);
    }
  };

  const handleSwap = async () => {
    if (!connected || !publicKey) {
      toast.error("Please connect your wallet first")
      return
    }
    if (!amount || parseFloat(amount) <= 0) {
      toast.error("Please enter a valid amount")
      return
    }
    if (!token.poolAddress) {
      toast.error("This token does not have an active liquidity pool yet.")
      return
    }

    setIsSwapping(true)
    try {
      // Meteora backend expects amounts in atomic units (lamports/decimals). Defaulting to 9 decimals.
      const amountInAtomic = Math.floor(parseFloat(amount) * 10 ** 9).toString();
      const minOutAtomic = quote?.minimumAmountOut
        ? quote.minimumAmountOut
        : Math.floor(estimatedOutputRaw * (1 - (parseFloat(slippage) / 100)) * 10 ** 9).toString();

      const res = await tokenService.swapTokens({
        owner: publicKey.toString(),
        amountIn: amountInAtomic,
        minimumAmountOut: minOutAtomic,
        swapBaseForQuote: tradeType === "sell", // Selling base token -> true
        pool: token.poolAddress,
        referralTokenAccount: null
      });

      if (res.success && res.transaction) {
        const signature = await processSerializedTransaction(res.transaction);
        if (signature) {
          console.log("Meteora Swap Transaction Successful! Signature:", signature);

          const recordToastId = toast.loading("Confirming on blockchain and indexing trade...");

          // RECORD THE SWAP ON BACKEND
          // Adding a small delay to ensure the transaction is searchable on-chain for the backend stats update
          setTimeout(async () => {
            try {
              if (!authUser?.id) {
                console.error("No authenticated user found for swap recording");
                toast.error("Trade executed but record failed: No user state", { id: recordToastId });
                return;
              }

              const outAmountHuman = tradeType === 'buy'
                ? (quote?.outAmount ? parseFloat(quote.outAmount) / 10 ** 6 : estimatedOutputRaw)
                : (quote?.outAmount ? parseFloat(quote.outAmount) / 10 ** 9 : estimatedOutputRaw);

              console.log("Recording swap with params:", {
                userId: authUser.id,
                coinId: id,
                type: tradeType,
                txHash: signature
              });

              const recRes = await tokenService.recordSwap({
                userId: authUser.id,
                coinId: id,
                type: tradeType,
                price: token.price,
                inputAmount: parseFloat(amount),
                outputAmount: outAmountHuman,
                txHash: signature,
                usdValue: tradeType === 'buy' ? parseFloat(amount) : outAmountHuman,
                creatorId: token.creatorId,
                poolAddress: token.poolAddress
              });

              if (recRes && recRes.success) {
                toast.success("Trade recorded and charts updated!", { id: recordToastId });
                // Refresh balances after recording
                fetchTokenBalance();
              } else {
                console.error("Backend failed to record swap:", recRes?.error);
                toast.error(`Indexing failed: ${recRes?.error || "Unknown server error"}`, { id: recordToastId });
              }
            } catch (recErr) {
              console.error("Error calling record-swap API:", recErr);
              toast.error("Server communication error during indexing", { id: recordToastId });
            }
          }, 1500);

          toast.success("Swap executed successfully!");
          setAmount("")
          setQuote(null)
        }
      } else {
        toast.error(res.error || "Swap failed")
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to execute swap")
    } finally {
      setIsSwapping(false)
    }
  }



  const isPositive = token.priceChange24h >= 0

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="mx-auto max-w-6xl px-4 py-8">
        <div className="grid gap-6 lg:grid-cols-[1fr_380px]">
          <div className="space-y-4">
            {/* TikTok-style Video */}
            <div className="flex items-center justify-center bg-black rounded-xl overflow-hidden">
              {/* Video Container with Actions Inside */}
              <div
                className="relative w-[340px] h-[440px] overflow-hidden mx-auto group cursor-pointer"
                onClick={togglePlay}
              >
                {currentVideo?.video_url ? (
                  <video
                    ref={videoRef}
                    src={currentVideo.video_url}
                    poster={currentVideo.thumbnail_url || "https://picsum.photos/seed/tiktok/400/700"}
                    className="h-full w-full object-cover"
                    loop
                    playsInline
                    onPlay={() => setIsPlaying(true)}
                    onPause={() => setIsPlaying(false)}
                  />
                ) : (
                  <Image
                    src={token.image || "https://picsum.photos/seed/tiktok/400/700"}
                    alt="Token video placeholder"
                    fill
                    className="object-cover"
                  />
                )}

                {/* Play Button Overlay - only show when paused */}
                {!isPlaying && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/30 transition-colors">
                    <div className="flex h-14 w-14 items-center justify-center rounded-full bg-white/20 backdrop-blur-sm group-hover:scale-110 transition-transform">
                      <Play className="h-7 w-7 fill-white text-white" />
                    </div>
                  </div>
                )}

                {/* Right Side Actions - Inside Video */}
                <div className="absolute right-3 top-4 flex flex-col items-center gap-4" onClick={(e) => e.stopPropagation()}>
                  {/* Profile */}
                  <div className="relative mb-2">
                    <div className="h-12 w-12 rounded-full border-2 border-white shadow-lg overflow-hidden">
                      <Image
                        src={token.creatorImage || token.image}
                        alt="Creator"
                        fill
                        className="object-cover rounded-full"
                      />
                    </div>
                    <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 flex h-5 w-5 items-center justify-center rounded-full bg-red-500">
                      <span className="text-white text-xs font-bold">+</span>
                    </div>
                  </div>

                  {/* Vote / Upvote (Like) */}
                  <div className="flex flex-col items-center">
                    <button
                      onClick={() => handleInteraction('like')}
                      className={cn(
                        "flex h-10 w-10 items-center justify-center rounded-full transition-all duration-200",
                        currentVideo?.is_liked ? "bg-[#4ade80]/20 text-[#4ade80] shadow-[0_0_15px_rgba(74,222,128,0.3)]" : "bg-black/40 text-white hover:bg-black/60"
                      )}
                    >
                      <svg className={cn("h-5 w-5", currentVideo?.is_liked ? "fill-[#4ade80]" : "fill-white")} viewBox="0 0 24 24">
                        <path d="M12 2L4 10h3v8h10v-8h3L12 2z" />
                      </svg>
                    </button>
                    <span className={cn("text-xs font-semibold mt-1", currentVideo?.is_liked ? "text-[#4ade80]" : "text-white")}>
                      {formatViews(Number(currentVideo?.likes_count || 0))}
                    </span>
                  </div>

                  {/* Share - TikTok style */}
                  <div className="flex flex-col items-center">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <button
                          className="flex h-10 w-10 items-center justify-center rounded-full bg-black/40 hover:bg-black/60 transition-colors"
                        >
                          <svg className="h-6 w-6" viewBox="0 0 24 24">
                            <path d="M3 15c0-4 3-7.5 7-8.5V4L21 12l-11 8v-3c-3.5 0-6 1-7 3v-5z" fill="#25F4EE" transform="translate(-1, -1)" />
                            <path d="M3 15c0-4 3-7.5 7-8.5V4L21 12l-11 8v-3c-3.5 0-6 1-7 3v-5z" fill="#FE2C55" transform="translate(1, 1)" />
                            <path d="M3 15c0-4 3-7.5 7-8.5V4L21 12l-11 8v-3c-3.5 0-6 1-7 3v-5z" fill="white" />
                          </svg>
                        </button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="bg-[#1a1a1a] border-[#2a2a2a] text-white">
                        <DropdownMenuItem className="focus:bg-[#2a2a2a] cursor-pointer" onClick={() => handleInteraction('share')}>
                          <Copy className="mr-2 h-4 w-4" />
                          <span>Copy Link</span>
                        </DropdownMenuItem>
                        <DropdownMenuItem className="focus:bg-[#2a2a2a] cursor-pointer" onClick={() => {
                          const url = encodeURIComponent(window.location.href);
                          const text = encodeURIComponent(`Check out ${token.name} ($${token.ticker}) on MoonPad!`);
                          window.open(`https://twitter.com/intent/tweet?url=${url}&text=${text}`, '_blank');
                          handleInteraction('share');
                        }}>
                          <Twitter className="mr-2 h-4 w-4" />
                          <span>Twitter</span>
                        </DropdownMenuItem>
                        <DropdownMenuItem className="focus:bg-[#2a2a2a] cursor-pointer" onClick={() => {
                          const url = encodeURIComponent(window.location.href);
                          const text = encodeURIComponent(`Check out ${token.name} ($${token.ticker}) on MoonPad!`);
                          window.open(`https://t.me/share/url?url=${url}&text=${text}`, '_blank');
                          handleInteraction('share');
                        }}>
                          <Send className="mr-2 h-4 w-4" />
                          <span>Telegram</span>
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                    <span className="text-white text-xs font-semibold mt-1">
                      {formatViews(Number(currentVideo?.shares_count || 0))}
                    </span>
                  </div>
                </div>
              </div>

              {/* Navigation Arrows - Far Right */}
              <div className="flex flex-col items-center gap-3 px-4 self-center">
                <button className="flex h-10 w-10 items-center justify-center rounded-full bg-[#3a3a3a] hover:bg-[#4a4a4a] transition-colors">
                  <svg className="h-5 w-5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M18 15l-6-6-6 6" />
                  </svg>
                </button>
                <button className="flex h-10 w-10 items-center justify-center rounded-full bg-[#3a3a3a] hover:bg-[#4a4a4a] transition-colors">
                  <svg className="h-5 w-5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M6 9l6 6 6-6" />
                  </svg>
                </button>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-xl">
                <Image
                  src={token.image}
                  alt={token.name}
                  fill
                  className="object-cover"
                  priority
                />
                {token.isHot && (
                  <Badge className="absolute -right-1 -top-1 gap-0.5 bg-destructive text-destructive-foreground text-[10px] px-1 py-0.5">
                    <Flame className="h-2.5 w-2.5" /> Hot
                  </Badge>
                )}
              </div>

              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <h1 className="text-lg font-bold">{token.name}</h1>
                  <span className="text-sm text-primary">${token.ticker}</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3 text-xs text-muted-foreground">
                    <Link href={`/profile/${token.creator}`} className="flex items-center gap-1.5 hover:text-foreground transition-colors">
                      <div className="relative h-4 w-4 overflow-hidden rounded-full">
                        <Image
                          src={token.creatorImage || "https://picsum.photos/seed/creator/100/100"}
                          alt="Creator"
                          fill
                          className="object-cover"
                        />
                      </div>
                      <span>{token.creator}</span>
                    </Link>
                    <div className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      <span>{new Date(token.createdAt).toLocaleDateString()}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-0.5">
                    {token.twitter && (
                      <a href={token.twitter} target="_blank" rel="noopener noreferrer" className="rounded-lg p-1 text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors">
                        <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                        </svg>
                      </a>
                    )}
                    {token.tiktok && (
                      <a href={token.tiktok} target="_blank" rel="noopener noreferrer" className="rounded-lg p-1 text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors">
                        <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z" />
                        </svg>
                      </a>
                    )}
                    {token.website && (
                      <a href={token.website} target="_blank" rel="noopener noreferrer" className="rounded-lg p-1 text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors">
                        <Globe className="h-3.5 w-3.5" />
                      </a>
                    )}
                    {token.telegram && (
                      <a href={token.telegram} target="_blank" rel="noopener noreferrer" className="rounded-lg p-1 text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors">
                        <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z" />
                        </svg>
                      </a>
                    )}
                    <button className="rounded-lg p-1 text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors">
                      <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M21 12l-7-7v4C7 9 4 14 3 19c2.5-3.5 6-5 11-5v4l7-7z" />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* ATH Section */}
            <Card className="border-border/50 bg-card/50 py-0">
              <CardContent className="px-3 py-2">
                <div className="flex items-center gap-3">
                  <div className="shrink-0">
                    <p className="text-[10px] text-muted-foreground">Market Cap</p>
                    <p className="text-lg font-bold">{formatNumber(token.marketCap)}</p>
                    <span className={cn("text-xs font-medium", isPositive ? "text-success" : "text-destructive")}>
                      {isPositive ? "+" : ""}{token.priceChange24h.toFixed(2)}% 24h
                    </span>
                  </div>
                  <div className="flex items-center gap-2 flex-1">
                    <div className="flex-1 h-1.5 rounded-full bg-secondary overflow-hidden">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-green-500 to-green-400"
                        style={{ width: `${token.athMarketCap > 0 ? Math.min(100, (token.marketCap / token.athMarketCap) * 100) : 0}%` }}
                      />
                    </div>
                    <div className="text-right whitespace-nowrap shrink-0">
                      <span className="text-[10px] text-muted-foreground">ATH </span>
                      <span className="text-sm font-semibold text-primary">{formatNumber(token.athMarketCap > 0 ? token.athMarketCap : 28000000)}</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-border/50 bg-card/50">
              <CardContent className="flex h-80 items-center justify-center p-4">
                <div className="text-center">
                  <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-secondary">
                    <TrendingUp className="h-8 w-8 text-muted-foreground" />
                  </div>
                  <p className="text-muted-foreground">Price Chart</p>
                  <p className="text-sm text-muted-foreground">Coming soon</p>
                </div>
              </CardContent>
            </Card>

            <div className="grid grid-cols-5 gap-3">
              <Card className="border-border/50 bg-card/50">
                <CardContent className="p-3">
                  <p className="text-xs text-muted-foreground">Price</p>
                  <p className="text-base font-bold">${token.price.toFixed(6)}</p>
                  <div className={cn(
                    "flex items-center gap-1 text-xs font-medium",
                    isPositive ? "text-success" : "text-destructive"
                  )}>
                    {isPositive ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                    {Math.abs(token.priceChange24h).toFixed(1)}%
                  </div>
                </CardContent>
              </Card>

              <Card className="border-border/50 bg-card/50">
                <CardContent className="p-3">
                  <p className="text-xs text-muted-foreground">24h Volume</p>
                  <p className="text-base font-bold">{formatNumber(token.volume24h)}</p>
                </CardContent>
              </Card>

              <Card className="border-border/50 bg-card/50">
                <CardContent className="p-3">
                  <p className="text-xs text-muted-foreground">5m Volume</p>
                  <p className="text-base font-bold">{formatNumber(token.volume5m)}</p>
                </CardContent>
              </Card>

              <Card className="border-border/50 bg-card/50">
                <CardContent className="p-3">
                  <p className="text-xs text-muted-foreground">1h Volume</p>
                  <p className="text-base font-bold">{formatNumber(token.volume1h)}</p>
                </CardContent>
              </Card>

              <Card className="border-border/50 bg-card/50">
                <CardContent className="p-3">
                  <p className="text-xs text-muted-foreground">6h Volume</p>
                  <p className="text-base font-bold">{formatNumber(token.volume6h)}</p>
                </CardContent>
              </Card>
            </div>

            <Tabs defaultValue="trades">
              <TabsList className="w-full justify-start bg-secondary/50">
                <TabsTrigger value="trades" className="gap-2">
                  <ArrowUpDown className="h-4 w-4" />
                  Recent Trades
                </TabsTrigger>
                <TabsTrigger value="comments" className="gap-2">
                  <MessageCircle className="h-4 w-4" />
                  Comments
                </TabsTrigger>
                <TabsTrigger value="videos" className="gap-2">
                  <Video className="h-4 w-4" />
                  Videos
                </TabsTrigger>
              </TabsList>

              <TabsContent value="videos" className="mt-4">
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
                  {videos.map((video) => (
                    <div
                      key={video.id}
                      className="group relative aspect-[3/4] cursor-pointer overflow-hidden rounded-xl bg-secondary"
                    >
                      <Image
                        src={video.thumbnail}
                        alt={video.caption || `Video ${video.id}`}
                        fill
                        className="object-cover transition-transform duration-300 group-hover:scale-105"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />

                      {video.isPinned && (
                        <Badge className="absolute left-2 top-2 gap-1 bg-pink-500 text-white hover:bg-pink-500">
                          <Pin className="h-3 w-3" />
                          Pinned
                        </Badge>
                      )}

                      {video.caption && (
                        <div className="absolute bottom-10 left-2 right-2">
                          <p className="text-sm font-medium text-white line-clamp-2">{video.caption}</p>
                        </div>
                      )}

                      <div className="absolute bottom-2 left-2 flex items-center gap-1.5 text-white">
                        <Play className="h-4 w-4 fill-white" />
                        <span className="text-sm font-medium">{formatViews(video.views)}</span>
                      </div>

                      <div className="absolute inset-0 flex items-center justify-center bg-black/20 opacity-0 transition-opacity group-hover:opacity-100">
                        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-white/20 backdrop-blur-sm">
                          <Play className="h-7 w-7 fill-white text-white" />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </TabsContent>

              <TabsContent value="comments" className="mt-4">
                <TokenComments coinId={id} />
              </TabsContent>

              <TabsContent value="trades" className="mt-4">
                <TokenTrades coinId={id} />
              </TabsContent>
            </Tabs>
          </div>

          <aside className="flex flex-col gap-3">
            <Card className="border-border/50 bg-card/50 py-0">
              <CardContent className="p-3 space-y-3">
                <div className="flex rounded-lg bg-secondary/50 p-1">
                  <Button
                    variant="ghost"
                    className={cn(
                      "flex-1 text-sm font-semibold",
                      tradeType === "buy" && "bg-success text-success-foreground hover:bg-success hover:text-success-foreground"
                    )}
                    onClick={() => setTradeType("buy")}
                  >
                    Buy
                  </Button>
                  <Button
                    variant="ghost"
                    className={cn(
                      "flex-1 text-sm font-semibold",
                      tradeType === "sell" && "bg-destructive text-destructive-foreground hover:bg-destructive hover:text-destructive-foreground"
                    )}
                    onClick={() => setTradeType("sell")}
                  >
                    Sell
                  </Button>
                </div>

                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">
                      {tradeType === "buy" ? "You pay" : "You sell"}
                    </span>
                    <span className="text-muted-foreground">
                      Balance: {tradeType === "buy"
                        ? `${connected ? (balance !== null ? balance.toFixed(4) : "0.00") : "0.00"} SOL`
                        : `${connected ? tokenBalance.toLocaleString(undefined, { maximumFractionDigits: 2 }) : "0"} ${token.ticker}`
                      }
                    </span>
                  </div>
                  <div className="relative">
                    <Input
                      type="number"
                      placeholder="0.0"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      className="bg-secondary/50 pr-16 h-9"
                      disabled={isSwapping}
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-medium">
                      {tradeType === "buy" ? "SOL" : token.ticker}
                    </span>
                  </div>
                </div>

                {tradeType === "buy" ? (
                  <div className="flex gap-1.5">
                    {[0.1, 0.5, 1, 5].map((val) => (
                      <Button
                        key={val}
                        variant="outline"
                        size="sm"
                        className="flex-1 text-xs h-7 px-1"
                        onClick={() => setAmount(val.toString())}
                        disabled={isSwapping}
                      >
                        {val}
                      </Button>
                    ))}
                  </div>
                ) : (
                  <div className="flex gap-1.5">
                    {[25, 50, 75, 100].map((val) => (
                      <Button
                        key={val}
                        variant="outline"
                        size="sm"
                        className="flex-1 text-xs h-7 px-1"
                        onClick={() => {
                          const calculated = (val / 100) * tokenBalance;
                          setAmount(calculated.toString());
                        }}
                        disabled={isSwapping}
                      >
                        {val}%
                      </Button>
                    ))}
                  </div>
                )}

                <div className="rounded-lg bg-secondary/30 p-3 space-y-2 text-sm">
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">You receive</span>
                    <span className="font-medium flex items-center gap-2">
                      {isQuoting ? (
                        <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                      ) : quote?.minimumAmountOut ? (
                        <>
                          {parseFloat(quote.minimumAmountOut).toLocaleString(undefined, { maximumFractionDigits: 4 })}
                          <span className="text-xs text-muted-foreground ml-1">{tradeType === "buy" ? token.ticker : "SOL"}</span>
                        </>
                      ) : estimatedOutputRaw > 0 ? (
                        <>
                          {estimatedOutputRaw.toLocaleString(undefined, { maximumFractionDigits: 4 })}
                          <span className="text-xs text-muted-foreground ml-1">{tradeType === "buy" ? token.ticker : "SOL"}</span>
                        </>
                      ) : "0.00"}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Price impact</span>
                    <span className={cn(
                      parseFloat(quote?.priceImpact || "0") > 1 ? "text-destructive font-medium" : "text-success"
                    )}>
                      {quote?.priceImpact ? `${parseFloat(quote.priceImpact).toFixed(2)}%` : "<0.1%"}
                    </span>
                  </div>
                </div>

                {/* Advanced Settings */}
                <button
                  onClick={() => setShowAdvancedSettings(true)}
                  className="flex items-center justify-between w-full px-3 py-2 rounded-lg bg-[#1a1a1a] hover:bg-[#252525] transition-colors"
                >
                  <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Advance Settings</span>
                  <svg className="h-4 w-4 text-muted-foreground" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <path d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" strokeLinejoin="round" strokeLinecap="round" />
                    <circle cx="12" cy="12" r="3" />
                  </svg>
                </button>

                <Button
                  className={cn(
                    "w-full text-lg font-bold",
                    tradeType === "buy"
                      ? "bg-success text-success-foreground hover:bg-success/90"
                      : "bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  )}
                  size="lg"
                  onClick={handleSwap}
                  disabled={isSwapping || (!quote && estimatedOutputRaw <= 0)}
                >
                  {isSwapping ? (
                    <div className="flex items-center gap-2">
                      <div className="h-5 w-5 animate-spin rounded-full border-2 border-current border-t-transparent" />
                      Processing...
                    </div>
                  ) : (
                    <>{tradeType === "buy" ? "Buy" : "Sell"} ${token.ticker}</>
                  )}
                </Button>

                <p className="text-center text-xs text-muted-foreground">
                  By trading, you agree to our Terms of Service
                </p>
              </CardContent>
            </Card>

            <Card className="border-border/50 bg-card/50 py-0">
              <CardContent className="p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <p className="font-semibold">Bonding curve progress</p>
                  <p className="font-semibold text-primary">{token.bondingProgress}%</p>
                </div>
                <div className="h-2 w-full overflow-hidden rounded-full bg-secondary">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{
                      background: "linear-gradient(90deg, #f97316, #facc15, #4ade80)",
                      width: `${token.bondingProgress}%`
                    }}
                  />
                </div>
                <div className="flex items-center justify-between text-sm text-muted-foreground">
                  <span>{token.bondingCurrentAmount?.toFixed(2) || "0.00"} SOL in bonding curve</span>
                  <span>{(Math.max(0, (token.bondingTargetAmount || 100) - (token.bondingCurrentAmount || 0))).toFixed(2)} SOL to graduate</span>
                </div>
              </CardContent>
            </Card>

            <Card className="border-border/50 bg-card/50 overflow-hidden py-0">
              <CardContent className="p-4 space-y-4">
                <p className="font-semibold">Creator rewards</p>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Link href={`/profile?id=${token.creatorId || ""}`} className="relative h-10 w-10 overflow-hidden rounded-full bg-gradient-to-br from-green-400 to-green-600 ring-2 ring-green-500/20 hover:ring-green-500/40 transition-all cursor-pointer">
                      <Image
                        src={token.creatorImage || "https://picsum.photos/seed/creator/100/100"}
                        alt="Creator"
                        fill
                        className="object-cover"
                        loading="eager"
                      />
                    </Link>
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <Link href={`/profile?id=${token.creatorId || ""}`} className="hover:underline">
                          <span className="font-medium font-mono">{token.creator}</span>
                        </Link>
                        <Badge className="bg-green-500/10 text-green-500 hover:bg-green-500/20 border-green-500/20">
                          Creator
                        </Badge>
                      </div>
                      <div className="flex items-center gap-1.5 text-sm text-green-500">
                        <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
                        </svg>
                        <span className="font-medium">100% rewards</span>
                      </div>
                    </div>
                  </div>
                  {authUser?.id !== token.creatorId && (
                    <Button
                      variant={isFollowing ? "outline" : "default"}
                      size="sm"
                      className={cn(
                        "rounded-full px-4 h-8 transition-all",
                        isFollowing
                          ? "border-border hover:bg-secondary hover:text-foreground"
                          : "bg-primary hover:bg-primary/90 text-primary-foreground font-semibold"
                      )}
                      onClick={handleFollowToggle}
                      disabled={isFollowingLoading}
                    >
                      {isFollowingLoading ? (
                        <div className="h-3 w-3 animate-spin rounded-full border border-current border-t-transparent" />
                      ) : isFollowing ? (
                        "Following"
                      ) : (
                        "Follow"
                      )}
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card className="border-border/50 bg-card/50 py-0">
              <CardContent className="p-4 pb-0">
                <p className="font-semibold mb-3">Top Holders</p>
                <div className="divide-y divide-border/50">
                  {isHoldersLoading ? (
                    <div className="flex justify-center py-8">
                      <div className="animate-spin h-6 w-6 border-2 border-primary border-t-transparent rounded-full"></div>
                    </div>
                  ) : holdersList.length > 0 ? (
                    holdersList.map((holder, index) => (
                      <div key={holder.user_id} className="flex items-center justify-between py-3">
                        <div className="flex items-center gap-3">
                          <div className={cn(
                            "flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold",
                            (index + 1) === 1 && "bg-primary/10 text-primary",
                            (index + 1) === 2 && "bg-muted text-foreground",
                            (index + 1) === 3 && "bg-chart-5/10 text-chart-5",
                            (index + 1) > 3 && "bg-secondary text-muted-foreground"
                          )}>
                            {index + 1}
                          </div>
                          <div>
                            <p className="font-medium max-w-[120px] truncate">
                              {holder.username || (holder.wallet_address ? `${holder.wallet_address.slice(0, 4)}...${holder.wallet_address.slice(-4)}` : "Unknown")}
                            </p>
                            <p className="text-sm text-muted-foreground">{holder.percentage.toFixed(2)}% of supply</p>
                          </div>
                        </div>
                        <p className="font-medium">{formatNumber(holder.value_usd)}</p>
                      </div>
                    ))
                  ) : (
                    <p className="text-center py-8 text-sm text-muted-foreground">No holders found</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </aside>
        </div>
      </main>

      {/* Advanced Settings Modal */}
      {showAdvancedSettings && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
          <div className="w-full max-w-md mx-4 rounded-2xl bg-[#111111] border border-[#2a2a2a] p-6 shadow-2xl">
            {/* Slippage */}
            <div className="mb-5">
              <label className="block text-sm font-medium text-white mb-2">
                Set max. slippage (%)
              </label>
              <Input
                type="number"
                value={slippage}
                onChange={(e) => setSlippage(e.target.value)}
                className="bg-[#1e1e24] border-[#2a2a2a] text-white h-12 text-lg"
                placeholder="2"
              />
              <p className="text-xs text-muted-foreground mt-2">
                This is the maximum amount of slippage you are willing to accept when placing trades.
              </p>
            </div>

            {/* Speed */}
            <div className="mb-5">
              <label className="block text-sm font-medium text-white mb-2">Speed:</label>
              <div className="flex items-center gap-2">
                {(["fast", "turbo", "ultra"] as const).map((s) => (
                  <button
                    key={s}
                    onClick={() => setSpeed(s)}
                    className={cn(
                      "px-4 py-1.5 rounded-md text-sm font-medium transition-colors capitalize",
                      speed === s
                        ? "bg-[#4ade80] text-black"
                        : "text-muted-foreground hover:text-white"
                    )}
                  >
                    {s}
                  </button>
                ))}
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                Higher speeds will increase your priority fees, making your transactions confirm faster.
              </p>
            </div>

            {/* Front-running Protection */}
            <div className="mb-5">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-white">Enable front-running protection:</label>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setFrontRunProtection(true)}
                    className={cn(
                      "px-3 py-1 rounded-md text-sm font-medium transition-colors",
                      frontRunProtection
                        ? "bg-[#4ade80] text-black"
                        : "text-muted-foreground hover:text-white"
                    )}
                  >
                    On
                  </button>
                  <button
                    onClick={() => setFrontRunProtection(false)}
                    className={cn(
                      "px-3 py-1 rounded-md text-sm font-medium transition-colors",
                      !frontRunProtection
                        ? "bg-[#4ade80] text-black"
                        : "text-muted-foreground hover:text-white"
                    )}
                  >
                    Off
                  </button>
                </div>
              </div>
            </div>

            {/* Tip Amount */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-white mb-2">Tip amount</label>
              <div className="relative">
                <Input
                  type="number"
                  value={tipAmount}
                  onChange={(e) => setTipAmount(e.target.value)}
                  className="bg-[#1e1e24] border-[#2a2a2a] text-white h-12 text-lg pr-20"
                  placeholder="0.003"
                />
                <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-2">
                  <span className="text-white font-medium">SOL</span>
                  <div className="h-6 w-6 rounded-full bg-gradient-to-br from-[#9945FF] to-[#14F195] flex items-center justify-center">
                    <svg className="h-3.5 w-3.5 text-white" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M4 8h16l-2-2H6L4 8zm0 4h16l-2 2H6l-2-2zm0 4h16l-2-2H6l-2 2z" />
                    </svg>
                  </div>
                </div>
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                A higher tip amount will make your transactions confirm faster. This is the transaction fee that you pay to the Solana network on each trade.
              </p>
            </div>

            {/* Close Button */}
            <button
              onClick={() => setShowAdvancedSettings(false)}
              className="w-full text-center text-white font-medium py-2 hover:text-[#4ade80] transition-colors"
            >
              [Close]
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
