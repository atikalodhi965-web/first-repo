"use client"

import { useEffect, useState, useRef } from "react"
import Image from "next/image"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Activity, TrendingUp, Zap } from "lucide-react"
import { cn } from "@/lib/utils"

interface FeedItem {
  id: string
  type: "buy" | "sell" | "create"
  tokenName: string
  tokenTicker: string
  tokenImage: string
  amount: number
  user: string
  timestamp: Date
}

const initialFeedItems: FeedItem[] = [
  {
    id: "1",
    type: "buy",
    tokenName: "DogeMaster",
    tokenTicker: "DMASTER",
    tokenImage: "https://picsum.photos/seed/doge1/100/100",
    amount: 2500,
    user: "0x7f3...9a2c",
    timestamp: new Date(Date.now() - 5000)
  },
  {
    id: "2",
    type: "create",
    tokenName: "MoonCat",
    tokenTicker: "MCAT",
    tokenImage: "https://picsum.photos/seed/cat1/100/100",
    amount: 0,
    user: "0x4a1...bc3d",
    timestamp: new Date(Date.now() - 15000)
  },
  {
    id: "3",
    type: "sell",
    tokenName: "PepeGold",
    tokenTicker: "PGOLD",
    tokenImage: "https://picsum.photos/seed/pepe1/100/100",
    amount: 1200,
    user: "0x9e2...f1ab",
    timestamp: new Date(Date.now() - 25000)
  },
  {
    id: "4",
    type: "buy",
    tokenName: "ShibaKing",
    tokenTicker: "SKING",
    tokenImage: "https://picsum.photos/seed/shib1/100/100",
    amount: 5800,
    user: "0x2c4...d8ef",
    timestamp: new Date(Date.now() - 35000)
  },
  {
    id: "5",
    type: "buy",
    tokenName: "WojakInu",
    tokenTicker: "WOJAK",
    tokenImage: "https://picsum.photos/seed/wojak1/100/100",
    amount: 890,
    user: "0x6b8...a2c1",
    timestamp: new Date(Date.now() - 45000)
  }
]

const tokenNames = ["FrogBoss", "CatQueen", "DogLord", "ElonMeme", "PepeStar", "ShibaMoon", "MemeMaster", "CryptoChad"]
const tickers = ["FROG", "CQUEEN", "DLORD", "EMEME", "PSTAR", "SMOON", "MMSTR", "CHAD"]

function generateRandomFeedItem(): FeedItem {
  const types: ("buy" | "sell" | "create")[] = ["buy", "buy", "buy", "sell", "create"]
  const type = types[Math.floor(Math.random() * types.length)]
  const nameIndex = Math.floor(Math.random() * tokenNames.length)
  
  return {
    id: `feed-${Date.now()}-${Math.random()}`,
    type,
    tokenName: tokenNames[nameIndex],
    tokenTicker: tickers[nameIndex],
    tokenImage: `https://picsum.photos/seed/${Math.random().toString(36).slice(2)}/100/100`,
    amount: type === "create" ? 0 : Math.floor(Math.random() * 10000) + 100,
    user: `0x${Math.random().toString(16).slice(2, 5)}...${Math.random().toString(16).slice(2, 6)}`,
    timestamp: new Date()
  }
}

export function LiveFeed() {
  const [feedItems, setFeedItems] = useState<FeedItem[]>(initialFeedItems)
  const [newItemId, setNewItemId] = useState<string | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const interval = setInterval(() => {
      const newItem = generateRandomFeedItem()
      setNewItemId(newItem.id)
      setFeedItems(prev => [newItem, ...prev.slice(0, 9)])
      
      setTimeout(() => setNewItemId(null), 500)
    }, 3000 + Math.random() * 2000)

    return () => clearInterval(interval)
  }, [])

  return (
    <Card className="border-border/50 bg-card/30 backdrop-blur-sm">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <Activity className="h-4 w-4 text-primary" />
          Live Activity
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-success opacity-75"></span>
            <span className="relative inline-flex h-2 w-2 rounded-full bg-success"></span>
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2" ref={containerRef}>
        {feedItems.map((item) => (
          <div 
            key={item.id}
            className={cn(
              "flex items-center gap-3 rounded-lg border border-transparent p-2 transition-all duration-300",
              newItemId === item.id && "border-primary/50 bg-primary/5"
            )}
          >
            <div className="relative h-8 w-8 overflow-hidden rounded-lg">
              <Image
                src={item.tokenImage}
                alt={item.tokenName}
                fill
                className="object-cover"
              />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <Badge 
                  variant="secondary" 
                  className={cn(
                    "text-[10px] px-1.5 py-0",
                    item.type === "buy" && "bg-success/10 text-success",
                    item.type === "sell" && "bg-destructive/10 text-destructive",
                    item.type === "create" && "bg-primary/10 text-primary"
                  )}
                >
                  {item.type === "buy" && <TrendingUp className="mr-1 h-2.5 w-2.5" />}
                  {item.type === "create" && <Zap className="mr-1 h-2.5 w-2.5" />}
                  {item.type.toUpperCase()}
                </Badge>
                <span className="truncate text-sm font-medium">${item.tokenTicker}</span>
              </div>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <span className="truncate">{item.user}</span>
                {item.amount > 0 && (
                  <>
                    <span>•</span>
                    <span className="font-medium text-foreground">${item.amount.toLocaleString()}</span>
                  </>
                )}
              </div>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  )
}
