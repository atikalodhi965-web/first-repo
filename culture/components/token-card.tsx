"use client"

import Image from "next/image"
import Link from "next/link"
import { cn } from "@/lib/utils"

export interface TokenData {
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
  creator?: string
  borderColor?: string
  earnings?: number
  price?: number
  rank?: number
  lastTrade?: string
  hasVideo?: boolean
}

interface TokenCardProps {
  token: TokenData
  variant?: "default" | "list"
}

function formatNumber(num: number): string {
  if (num >= 1_000_000) {
    return `${(num / 1_000_000).toFixed(2)}M`
  }
  if (num >= 1_000) {
    return `${(num / 1_000).toFixed(2)}K`
  }
  return num.toFixed(2)
}

function formatPrice(num: number): string {
  if (num < 0.0001) {
    return `$${num.toFixed(7)}`
  }
  if (num < 1) {
    return `$${num.toFixed(5)}`
  }
  return `$${num.toFixed(2)}`
}

function getAge(createdAt: string): string {
  const diff = Date.now() - new Date(createdAt).getTime()
  const hours = Math.floor(diff / 3600000)
  if (hours < 1) return "< 1 hour"
  return `${hours} hours`
}

export function TokenCard({ token, variant = "default" }: TokenCardProps) {
  const borderColors = [
    "border-purple-500",
    "border-pink-500",
    "border-teal-500",
    "border-blue-500",
    "border-green-500",
    "border-orange-500",
  ]
  const borderColor = borderColors[parseInt(token.id) % borderColors.length]

  if (variant === "list") {
    return (
      <Link href={`/token/${token.id}`}>
        <div className="grid grid-cols-[40px_2fr_1fr_1fr_1fr_1fr] gap-4 px-4 py-3 items-center border-b border-[#1a1a1a] hover:bg-[#1a1a1a] transition-colors">
          {/* Rank */}
          <div className="text-[#6a6a6a] text-sm">
            {token.rank || parseInt(token.id)}
          </div>

          {/* Name */}
          <div className="flex items-center gap-3">
            <div className={cn("relative h-9 w-9 shrink-0 overflow-hidden rounded-lg border-2", borderColor)}>
              <Image
                src={token.image}
                alt={token.name}
                fill
                className="object-cover"
              />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-white text-sm truncate">{token.name}</span>
                <span className="text-xs text-[#6a6a6a]">{token.ticker}</span>
              </div>
              <p className="text-xs text-[#6a6a6a] truncate">{token.description}</p>
            </div>
          </div>

          {/* Progress */}
          <div className="flex items-center gap-2">
            <div className="w-16 h-1.5 rounded-full bg-[#2a2a2a] overflow-hidden">
              <div
                className="h-full rounded-full"
                style={{
                  width: `${Math.min(token.bondingProgress, 100)}%`,
                  background: "linear-gradient(90deg, #f97316, #facc15, #4ade80)"
                }}
              />
            </div>
            <span className="text-xs text-[#4ade80]">{token.bondingProgress.toFixed(0)}%</span>
          </div>

          {/* 24H Change */}
          <div className={cn(
            "text-sm font-medium",
            token.priceChange24h >= 0 ? "text-[#4ade80]" : "text-red-500"
          )}>
            {token.priceChange24h >= 0 ? "+" : ""}{token.priceChange24h.toFixed(2)}%
          </div>

          {/* Market Cap */}
          <div className="text-sm font-medium text-white">
            ${formatNumber(token.marketCap)}
          </div>

          {/* Price */}
          <div className="text-sm text-white">
            {formatPrice(token.price || 0)}
          </div>
        </div>
      </Link>
    )
  }

  return (
    <Link href={`/token/${token.id}`}>
      <div className="group flex h-[180px] rounded-xl border border-[#2a2a2a] bg-[#0f0f0f] p-3 gap-3 transition-all hover:border-[#4ade80]/50">
        {/* Token Image - Left Side */}
        <div className="relative w-[150px] h-full flex-shrink-0 rounded-lg overflow-hidden bg-[#1a1a1a]">
          <Image
            src={token.image}
            alt={token.name}
            fill
            className="object-cover"
          />
        </div>

        {/* Token Info - Right Side */}
        <div className="flex-1 flex flex-col justify-between min-w-0">
          {/* Top Section */}
          <div>
            {/* Name Row */}
            <div className="flex items-start justify-between gap-2">
              <div className="flex flex-col min-w-0">
                <h3 className="font-bold text-white truncate">{token.name}</h3>
                <span className="text-sm text-[#6a6a6a]">{token.ticker}</span>
              </div>
              <span className={cn(
                "shrink-0 text-sm font-medium",
                token.priceChange24h >= 0 ? "text-[#4ade80]" : "text-red-500"
              )}>
                {token.priceChange24h >= 0 ? "+" : ""}{token.priceChange24h.toFixed(1)}%
              </span>
            </div>
          </div>

          {/* Info Rows */}
          <div className="space-y-1">
            <div className="flex items-center justify-between text-xs">
              <span className="text-[#6a6a6a] shrink-0">created by:</span>
              <span className="font-medium text-[#8a8a8a] truncate ml-2">
                {token.creator || `0x${token.id}a...${token.id}9fc`}
              </span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-[#6a6a6a] shrink-0">Market Cap:</span>
              <span className="font-semibold text-white">{formatNumber(token.marketCap)}</span>
            </div>
          </div>

          {/* Bonding Progress */}
          <div className="mt-auto pt-2">
            <div className="flex items-center gap-2">
              <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-[#2a2a2a]">
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{
                    width: `${token.bondingProgress}%`,
                    background: "linear-gradient(90deg, #f97316, #facc15, #4ade80)"
                  }}
                />
              </div>
              <span className="text-xs font-medium text-[#4ade80] shrink-0">{token.bondingProgress.toFixed(2)}%</span>
            </div>
          </div>
        </div>
      </div>
    </Link>
  )
}
