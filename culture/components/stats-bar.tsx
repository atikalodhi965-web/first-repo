"use client"

import { useEffect, useState } from "react"
import { TrendingUp, Users, Coins, DollarSign } from "lucide-react"

interface Stats {
  totalTokens: number
  totalVolume: number
  activeUsers: number
  graduatedTokens: number
}

export function StatsBar() {
  const [stats, setStats] = useState<Stats>({
    totalTokens: 12847,
    totalVolume: 45_200_000,
    activeUsers: 8942,
    graduatedTokens: 342
  })

  useEffect(() => {
    const interval = setInterval(() => {
      setStats(prev => ({
        totalTokens: prev.totalTokens + Math.floor(Math.random() * 3),
        totalVolume: prev.totalVolume + Math.floor(Math.random() * 50000),
        activeUsers: prev.activeUsers + Math.floor(Math.random() * 5) - 2,
        graduatedTokens: prev.graduatedTokens + (Math.random() > 0.95 ? 1 : 0)
      }))
    }, 5000)

    return () => clearInterval(interval)
  }, [])

  return (
    <div className="border-b border-border/50 bg-secondary/30">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-center gap-6 px-4 py-3 md:justify-between">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
            <Coins className="h-4 w-4 text-primary" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Total Tokens</p>
            <p className="font-semibold tabular-nums">{stats.totalTokens.toLocaleString()}</p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-success/10">
            <DollarSign className="h-4 w-4 text-success" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground">24h Volume</p>
            <p className="font-semibold tabular-nums">${(stats.totalVolume / 1_000_000).toFixed(2)}M</p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent/10">
            <Users className="h-4 w-4 text-accent" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Active Users</p>
            <p className="font-semibold tabular-nums">{stats.activeUsers.toLocaleString()}</p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-chart-5/10">
            <TrendingUp className="h-4 w-4 text-chart-5" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Graduated</p>
            <p className="font-semibold tabular-nums">{stats.graduatedTokens}</p>
          </div>
        </div>
      </div>
    </div>
  )
}
