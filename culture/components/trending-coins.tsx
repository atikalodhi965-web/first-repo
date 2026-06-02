"use client"

import { useState, useEffect } from "react"
import Image from "next/image"
import Link from "next/link"
import { Flame, ChevronLeft, ChevronRight, Loader2 } from "lucide-react"
import { videoService, TrendingVideo } from "@/services/video/videoService"

// Helper function to format large numbers
function formatNumber(num: number): string {
  if (num >= 1000000) return (num / 1000000).toFixed(1) + "M"
  if (num >= 1000) return (num / 1000).toFixed(1) + "K"
  return num.toString()
}

export function TrendingCoins() {
  const [trendingCoins, setTrendingCoins] = useState<any[]>([])
  const [activeIndex, setActiveIndex] = useState(0)
  const [isAutoPlaying, setIsAutoPlaying] = useState(true)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchTrending = async () => {
      try {
        const response = await videoService.getTrendingVideos(10)
        if (response.success && response.videos.length > 0) {
          const mappedData = response.videos.map((video: TrendingVideo) => ({
            id: video.id,
            coin_id: video.coin_id, // For navigation to token page
            name: video.token_name,
            ticker: video.token_symbol,
            priceChange: Math.round(video.price_change_24h * 100) / 100, // round to 2 decimal places
            marketCap: formatNumber(video.market_cap),
            volume: formatNumber(video.volume_24h),
            image: video.thumbnail_url || video.token_image,
            progress: video.bonding_progress || 0,
          }))
          setTrendingCoins(mappedData)
        }
      } catch (error) {
        console.error("Failed to fetch trending videos:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchTrending()
  }, [])

  useEffect(() => {
    if (!isAutoPlaying || trendingCoins.length === 0) return
    const interval = setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % trendingCoins.length)
    }, 4000)
    return () => clearInterval(interval)
  }, [isAutoPlaying, trendingCoins.length])

  const goToSlide = (index: number) => {
    setActiveIndex(index)
    setIsAutoPlaying(false)
    setTimeout(() => setIsAutoPlaying(true), 10000)
  }

  const goToPrev = () => {
    if (trendingCoins.length === 0) return
    const newIndex = activeIndex === 0 ? trendingCoins.length - 1 : activeIndex - 1
    goToSlide(newIndex)
  }

  const goToNext = () => {
    if (trendingCoins.length === 0) return
    const newIndex = (activeIndex + 1) % trendingCoins.length
    goToSlide(newIndex)
  }

  const getSlideStyle = (index: number) => {
    const diff = index - activeIndex
    const totalItems = trendingCoins.length
    if (totalItems === 0) return { opacity: 0, transform: "translateX(0)", zIndex: 0, pointerEvents: "none" as const }
    
    // Handle wrap-around
    let adjustedDiff = diff
    if (diff > totalItems / 2) adjustedDiff = diff - totalItems
    if (diff < -totalItems / 2) adjustedDiff = diff + totalItems

    // Show 4 cards at a time (center-left, center-right, far-left, far-right)
    if (adjustedDiff === 0) {
      return {
        transform: "translateX(-140px)",
        opacity: 1,
        zIndex: 10,
        pointerEvents: "auto" as const,
      }
    } else if (adjustedDiff === 1 || adjustedDiff === -totalItems + 1) {
      return {
        transform: "translateX(140px)",
        opacity: 1,
        zIndex: 10,
        pointerEvents: "auto" as const,
      }
    } else if (adjustedDiff === 2 || adjustedDiff === -totalItems + 2) {
      return {
        transform: "translateX(420px)",
        opacity: 0.5,
        zIndex: 5,
        pointerEvents: "auto" as const,
      }
    } else if (adjustedDiff === -1 || adjustedDiff === totalItems - 1) {
      return {
        transform: "translateX(-420px)",
        opacity: 0.5,
        zIndex: 5,
        pointerEvents: "auto" as const,
      }
    }
    // Hide all other cards
    return {
      transform: "translateX(0)",
      opacity: 0,
      zIndex: 0,
      pointerEvents: "none" as const,
    }
  }

  if (loading) {
    return (
      <div className="flex h-[450px] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-orange-500" />
      </div>
    )
  }

  if (trendingCoins.length === 0) return null

  return (
    <div className="mb-8 pt-4 pb-6">
      {/* Header */}
      <div className="mb-4 flex items-center justify-center gap-3">
        <Flame className="h-6 w-6 text-orange-500" />
        <h2 className="text-xl font-bold tracking-wide text-white">NOW TRENDING</h2>
      </div>

      {/* Carousel Container */}
      <div className="relative mx-auto max-w-5xl">
        {/* Navigation Arrows */}
        <button
          onClick={goToPrev}
          className="absolute left-0 top-1/2 z-20 -translate-y-1/2 rounded-full bg-black/50 p-2 text-white/70 hover:bg-black/70 hover:text-white transition-all"
        >
          <ChevronLeft className="h-6 w-6" />
        </button>
        <button
          onClick={goToNext}
          className="absolute right-0 top-1/2 z-20 -translate-y-1/2 rounded-full bg-black/50 p-2 text-white/70 hover:bg-black/70 hover:text-white transition-all"
        >
          <ChevronRight className="h-6 w-6" />
        </button>

        {/* Slides Container */}
        <div className="relative h-[340px] overflow-hidden">
          <div className="absolute inset-0 flex items-center justify-center">
            {trendingCoins.map((coin, index) => {
              const style = getSlideStyle(index)
              return (
                <Link
                  key={coin.id}
                  href={`/token/${coin.coin_id}`}
                  className="absolute transition-all duration-500 ease-out"
                  style={{
                    transform: style.transform,
                    opacity: style.opacity,
                    zIndex: style.zIndex,
                    pointerEvents: style.pointerEvents as any,
                  }}
                  onClick={(e) => {
                    if (index !== activeIndex) {
                      e.preventDefault()
                      goToSlide(index)
                    }
                  }}
                >
                  <div className="w-[260px] rounded-2xl bg-[#1a1a1a] p-3 shadow-2xl">
                    {/* Card Header */}
                    <div className="relative">
                      {/* Token Image */}
                      <div className="relative aspect-square w-full overflow-hidden rounded-xl">
                        <Image
                          src={coin.image || "/placeholder.png"}
                          alt={coin.name}
                          fill
                          className="object-cover"
                        />
                        {/* Top Left Icon */}
                        <div className="absolute left-2 top-2 flex h-6 w-6 items-center justify-center rounded-md bg-black/60">
                          <Flame className="h-3 w-3 text-white" />
                        </div>
                        {/* Price Change Badge */}
                        <div className="absolute right-2 top-2 rounded-md bg-[#4ade80] px-2 py-1 text-xs font-bold text-black">
                          +{coin.priceChange.toLocaleString()}%
                        </div>
                      </div>
                    </div>

                    {/* Card Content */}
                    <div className="mt-3">
                      {/* Name, Ticker, MC Row */}
                      <div className="flex items-center gap-2 text-sm">
                        <h3 className="font-bold text-white truncate max-w-[80px]">{coin.name}</h3>
                        <span className="text-[#6a6a6a] truncate max-w-[60px]">{coin.ticker}</span>
                        <span className="text-white font-medium ml-auto">MC ${coin.marketCap}</span>
                      </div>

                      {/* Progress Bar */}
                      <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-[#2a2a2a]">
                        <div
                          className="h-full rounded-full"
                          style={{
                            width: `${coin.progress}%`,
                            background: "linear-gradient(90deg, #f97316, #facc15, #4ade80)",
                          }}
                        />
                      </div>
                    </div>
                  </div>
                </Link>
              )
            })}
          </div>
        </div>

        {/* Dots Indicator */}
        <div className="mt-4 flex items-center justify-center gap-2">
          {trendingCoins.map((_, index) => (
            <button
              key={index}
              onClick={() => goToSlide(index)}
              className={`h-2 rounded-full transition-all ${
                index === activeIndex
                  ? "w-6 bg-white"
                  : "w-2 bg-white/30 hover:bg-white/50"
              }`}
            />
          ))}
        </div>
      </div>
    </div>
  )
}
