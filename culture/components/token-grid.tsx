"use client"

import { useState, useEffect, useCallback, useMemo } from "react"
import { TokenCard, TokenData } from "./token-card"
import { Button } from "@/components/ui/button"
import { Grid3X3, List, Filter, Sparkles, Rocket, Zap, ArrowLeftRight, Check, ChevronLeft, ChevronRight, Loader2 } from "lucide-react"
import { tokenService } from "@/services/token/tokenService"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import Image from "next/image"
import Link from "next/link"
import { cn } from "@/lib/utils"

const mockTokens: TokenData[] = [
  {
    id: "1",
    name: "MOONSHOT",
    ticker: "MOON",
    image: "https://picsum.photos/seed/moon1/400/400",
    marketCap: 12500000,
    priceChange24h: 89.24,
    bondingProgress: 6.41,
    holders: 4521,
    createdAt: new Date(Date.now() - 8 * 3600000).toISOString(),
    description: "To the moon",
    creator: "CRYPTOWHALE",
    isHot: true,
    volume24h: 8900000,
    earnings: 78234.12,
    price: 0.00891,
    rank: 33
  },
  {
    id: "2",
    name: "SOLCAT",
    ticker: "SCAT",
    image: "https://picsum.photos/seed/cat2/400/400",
    marketCap: 6780000,
    priceChange24h: 45.38,
    bondingProgress: 54.89,
    holders: 2341,
    createdAt: new Date(Date.now() - 10 * 3600000).toISOString(),
    description: "Solana Cat Token",
    creator: "CATDADDY",
    volume24h: 3520000,
    earnings: 67890.45,
    price: 0.00667,
    rank: 19
  },
  {
    id: "3",
    name: "GSD",
    ticker: "GSD",
    image: "https://picsum.photos/seed/gsd1/400/400",
    marketCap: 4430000,
    priceChange24h: 20.52,
    bondingProgress: 2.78,
    holders: 8934,
    createdAt: new Date(Date.now() - 19 * 3600000).toISOString(),
    description: "Get Shit Done",
    creator: "GLITTERCOWBOY",
    isHot: true,
    volume24h: 5740000,
    earnings: 49255.61,
    price: 0.00443,
    rank: 46
  },
  {
    id: "4",
    name: "COMPU...",
    ticker: "COMPU",
    image: "https://picsum.photos/seed/comp1/400/400",
    marketCap: 47340,
    priceChange24h: 67.11,
    bondingProgress: 63.44,
    holders: 1256,
    createdAt: new Date(Date.now() - 6 * 3600000).toISOString(),
    description: "donald boat computer ...",
    creator: "LASERBOAT999",
    volume24h: 151950,
    earnings: 46602.76,
    price: 0.0000472,
    rank: 51
  },
  {
    id: "5",
    name: "ELIZA TOWN",
    ticker: "ELIZA",
    image: "https://picsum.photos/seed/eliza1/400/400",
    marketCap: 3130000,
    priceChange24h: 21.63,
    bondingProgress: 49.70,
    holders: 3421,
    createdAt: new Date(Date.now() - 6 * 3600000).toISOString(),
    description: "Eliza Town",
    creator: "SHAWMAKESMA...",
    volume24h: 3880000,
    earnings: 45356.85,
    price: 0.00314,
    rank: 52
  },
  {
    id: "6",
    name: "BETANET",
    ticker: "BETA",
    image: "https://picsum.photos/seed/beta1/400/400",
    marketCap: 9630,
    priceChange24h: 31.22,
    bondingProgress: 11.12,
    holders: 5678,
    createdAt: new Date(Date.now() - 15 * 3600000).toISOString(),
    description: "Internet2 Fund",
    creator: "RAVENTECHGRO...",
    isHot: true,
    volume24h: 5720000,
    earnings: 42604.28,
    price: 0.0000095,
    rank: 62
  }
]

type FilterOption = "movers" | "new" | "launching" | "migrated"
type SortOption = "featured" | "creation_time" | "trading_volume" | "progress" | "last_trade" | "market_cap" | "video"

const ITEMS_PER_PAGE = 50

export function TokenGrid() {
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid")
  const [filter, setFilter] = useState<FilterOption>("movers")
  const [sortBy, setSortBy] = useState<SortOption>("creation_time")
  const [currentPage, setCurrentPage] = useState(1)
  const [tokens, setTokens] = useState<TokenData[]>([])
  const [loading, setLoading] = useState(true)
  const [totalCount, setTotalCount] = useState(0)

  const filters: { value: FilterOption; label: string; icon: React.ReactNode }[] = [
    { value: "movers", label: "Movers", icon: <Sparkles className="h-4 w-4" /> },
    { value: "new", label: "New", icon: <Zap className="h-4 w-4" /> },
    { value: "launching", label: "Launching", icon: <Rocket className="h-4 w-4" /> },
    { value: "migrated", label: "Migrated", icon: <ArrowLeftRight className="h-4 w-4" /> },
  ]

  const sortOptions: { value: SortOption; label: string }[] = [
    { value: "creation_time", label: "Creation Time" },
    { value: "last_trade", label: "Last Trade" },
    { value: "trading_volume", label: "Trading Volume" },
    { value: "market_cap", label: "Market Cap" },
    { value: "progress", label: "Progress" },
    { value: "video", label: "Video" },
  ]

  const fetchTokens = useCallback(async () => {
    try {
      setLoading(true)
      
      // Calculate limit and offset: 8 on page 1, 10 on subsequent pages
      const limit = currentPage === 1 ? 8 : 10
      const offset = currentPage === 1 ? 0 : 8 + (currentPage - 2) * 10

      // Map sortBy to backend keys
      let backendSortBy = sortBy as string;
      if (sortBy === 'creation_time') backendSortBy = 'created_at';
      if (sortBy === 'last_trade') backendSortBy = 'lastTrade';
      if (sortBy === 'trading_volume') backendSortBy = 'volume_24h';
      if (sortBy === 'market_cap') backendSortBy = 'market_cap';
      if (sortBy === 'progress') backendSortBy = 'bonding_progress';

      const res = await tokenService.getTokensList({
        category: filter,
        limit,
        offset,
        sortBy: backendSortBy,
        hasVideo: sortBy === 'video'
      })

      if (res.success) {
        const mappedTokens: TokenData[] = res.data.map((t: any) => ({
          id: t.id,
          name: t.name,
          ticker: t.symbol,
          image: t.logo_url || `https://picsum.photos/seed/${t.id}/400/400`,
          marketCap: Number(t.market_cap),
          priceChange24h: Number(t.price_change_24h),
          bondingProgress: Number(t.bonding_progress),
          holders: 0,
          createdAt: t.created_at,
          lastTrade: t.last_trade_at || null,
          description: t.description || "",
          creator: t.creator,
          volume24h: Number(t.volume_24h),
          price: Number(t.current_price),
          hasVideo: !!t.video_url
        }))
        setTokens(mappedTokens)
        setTotalCount(res.total)
      }
    } catch (error) {
      console.error("Error fetching tokens:", error)
    } finally {
      setLoading(false)
    }
  }, [filter, sortBy, currentPage])

  useEffect(() => {
    fetchTokens()
  }, [fetchTokens])

  // Frontend-side sorting and filtering for immediate feedback
  const displayedTokens = useMemo(() => {
    let result = [...tokens];

    // Filter by video if requested
    if (sortBy === 'video') {
      result = result.filter(t => t.hasVideo);
    }

    // Secondary sort on the frontend to ensure immediate responsiveness
    result.sort((a, b) => {
      switch (sortBy) {
        case 'creation_time':
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        case 'last_trade':
          const timeA = new Date(a.lastTrade || 0).getTime();
          const timeB = new Date(b.lastTrade || 0).getTime();
          return timeB - timeA;
        case 'trading_volume':
          return (b.volume24h || 0) - (a.volume24h || 0);
        case 'market_cap':
          return (b.marketCap || 0) - (a.marketCap || 0);
        case 'progress':
          return (b.bondingProgress || 0) - (a.bondingProgress || 0);
        default:
          return 0;
      }
    });

    return result;
  }, [tokens, sortBy]);

  const handlePageChange = (page: number) => {
    setCurrentPage(page)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const totalPages = Math.max(1, Math.ceil((totalCount - 8) / 10) + 1)

  return (
    <div className="space-y-4">
      {/* Filter Bar */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        {/* Filter Tabs */}
        <div className="flex flex-wrap items-center gap-2">
          {filters.map((f) => (
            <button
              key={f.value}
              onClick={() => setFilter(f.value)}
              className={cn(
                "flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition-colors",
                filter === f.value
                  ? "bg-[#4ade80] text-black"
                  : "bg-[#1a1a1a] text-[#8a8a8a] hover:bg-[#2a2a2a] hover:text-white"
              )}
            >
              {f.icon}
              {f.label}
            </button>
          ))}
        </div>

        {/* Right Side Controls */}
        <div className="flex items-center gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                className="gap-2 border-[#2a2a2a] bg-[#1a1a1a] text-white hover:bg-[#2a2a2a]"
              >
                <Filter className="h-4 w-4" />
                Filter
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="end"
              className="w-48 border-[#2a2a2a] bg-[#1a1a1a]"
            >
              {sortOptions.map((option) => (
                <DropdownMenuItem
                  key={option.value}
                  onClick={() => setSortBy(option.value)}
                  className="flex items-center justify-between text-white hover:bg-[#2a2a2a] focus:bg-[#2a2a2a] focus:text-white cursor-pointer"
                >
                  <span>{option.label}</span>
                  {sortBy === option.value && (
                    <Check className="h-4 w-4 text-[#4ade80]" />
                  )}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          <div className="flex rounded-lg border border-[#2a2a2a] bg-[#1a1a1a] p-1">
            <Button
              variant="ghost"
              size="icon"
              className={cn(
                "h-8 w-8",
                viewMode === "grid" ? "bg-[#2a2a2a] text-white" : "text-[#6a6a6a] hover:text-white"
              )}
              onClick={() => setViewMode("grid")}
            >
              <Grid3X3 className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className={cn(
                "h-8 w-8",
                viewMode === "list" ? "bg-[#2a2a2a] text-white" : "text-[#6a6a6a] hover:text-white"
              )}
              onClick={() => setViewMode("list")}
            >
              <List className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 space-y-4">
          <Loader2 className="h-10 w-10 animate-spin text-[#4ade80]" />
          <p className="text-muted-foreground animate-pulse text-sm font-medium">Scanning the galaxy for tokens...</p>
        </div>
      ) : displayedTokens.length > 0 ? (
        viewMode === "grid" ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {displayedTokens.map((token) => (
              <TokenCard key={token.id} token={token} variant="default" />
            ))}
          </div>
        ) : (
          <div className="rounded-xl border border-[#2a2a2a] bg-[#0f0f0f] overflow-hidden">
            {/* Table Header */}
            <div className="grid grid-cols-[40px_2fr_1fr_1fr_1fr_1fr] gap-4 px-4 py-3 text-xs font-medium text-[#6a6a6a] border-b border-[#2a2a2a]">
              <div>#</div>
              <div>NAME</div>
              <div>PROGRESS</div>
              <div>24H CHANGE</div>
              <div>MARKET CAP</div>
              <div>PRICE</div>
            </div>

            {/* Table Rows */ }
            {displayedTokens.map((token, index) => (
              <TokenCard 
                key={token.id} 
                token={{...token, rank: (currentPage === 1 ? 0 : 8 + (currentPage - 2) * 10) + index + 1}} 
                variant="list" 
              />
            ))}
          </div>
        )
      ) : (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="h-16 w-16 rounded-full bg-secondary/20 flex items-center justify-center mb-4">
             <Filter className="h-8 w-8 text-muted-foreground" />
          </div>
          <h3 className="text-xl font-bold text-white mb-2">No Tokens Found</h3>
          <p className="text-muted-foreground max-w-xs">We couldn&apos;t find any tokens matching your current filters. Try adjusting them!</p>
        </div>
      )}

      {/* Pagination */}
      <div className="flex items-center justify-center gap-2 pt-8 pb-4">
        {/* Previous Button */}
        <button
          onClick={() => handlePageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className={cn(
            "flex h-9 w-9 items-center justify-center rounded-lg border border-[#2a2a2a] bg-[#0f0f0f] transition-colors",
            currentPage === 1
              ? "text-[#3a3a3a] cursor-not-allowed"
              : "text-[#8a8a8a] hover:border-[#4ade80] hover:text-[#4ade80]"
          )}
        >
          <ChevronLeft className="h-4 w-4" />
        </button>

        {/* Page Numbers */}
        {Array.from({ length: Math.max(totalPages, 1) }, (_, i) => i + 1).map((page) => {
          // Show first page, last page, current page, and pages around current
          const showPage =
            page === 1 ||
            page === totalPages ||
            Math.abs(page - currentPage) <= 1

          // Show ellipsis
          if (!showPage && totalPages > 1) {
            if (page === 2 || page === totalPages - 1) {
              return (
                <span key={page} className="px-1 text-[#3a3a3a]">
                  ...
                </span>
              )
            }
            return null
          }

          return (
            <button
              key={page}
              onClick={() => handlePageChange(page)}
              className={cn(
                "flex h-9 min-w-9 px-3 items-center justify-center rounded-lg border text-sm font-medium transition-colors",
                currentPage === page
                  ? "bg-[#4ade80] border-[#4ade80] text-black"
                  : "border-[#2a2a2a] bg-[#0f0f0f] text-[#8a8a8a] hover:border-[#4ade80] hover:text-[#4ade80]"
              )}
            >
              {page}
            </button>
          )
        })}

        {/* Next Button */}
        <button
          onClick={() => handlePageChange(currentPage + 1)}
          disabled={currentPage === totalPages || totalPages === 0}
          className={cn(
            "flex h-9 w-9 items-center justify-center rounded-lg border border-[#2a2a2a] bg-[#0f0f0f] transition-colors",
            currentPage === totalPages || totalPages === 0
              ? "text-[#3a3a3a] cursor-not-allowed"
              : "text-[#8a8a8a] hover:border-[#4ade80] hover:text-[#4ade80]"
          )}
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  )
}
