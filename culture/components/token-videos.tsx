'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import { videoService } from '@/services/video/videoService'
import { Badge } from '@/components/ui/badge'
import { Pin, Play } from 'lucide-react'
import { Skeleton } from '@/components/ui/skeleton'

interface Video {
  id: string;
  coin_id: string;
  video_url: string;
  thumbnail_url: string;
  caption: string;
  views_count: number;
  likes_count: number;
  shares_count: number;
  is_pinned: boolean;
}

interface TokenVideosProps {
  coinId: string;
}

function formatViews(num: number): string {
  if (num >= 1_000_000) return `${(num / 1_000_000).toFixed(1)}M`
  if (num >= 1_000) return `${(num / 1_000).toFixed(1)}K`
  return num.toString()
}

export function TokenVideos({ coinId }: TokenVideosProps) {
  const [videos, setVideos] = useState<Video[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchVideos = async () => {
      setLoading(true)
      try {
        const res = await videoService.getVideosByCoin(coinId)
        if (res.success && res.videos) {
          setVideos(res.videos)
        }
      } catch (error) {
        console.error('Error fetching videos:', error)
      } finally {
        setLoading(false)
      }
    }

    if (coinId) {
      fetchVideos()
    }
  }, [coinId])

  if (loading) {
    return (
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
        {[1, 2, 3, 4].map((n) => (
          <Skeleton key={n} className="aspect-[3/4] rounded-xl" />
        ))}
      </div>
    )
  }

  if (videos.length === 0) {
    return (
      <div className="py-12 text-center rounded-xl border border-dashed border-border/30 bg-secondary/5 font-mono">
        <p className="text-sm font-semibold text-muted-foreground">No videos yet</p>
        <p className="text-xs text-muted-foreground/70 mt-1">Upload the first video for this coin!</p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
      {videos.map((video) => (
        <div
          key={video.id}
          className="group relative aspect-[3/4] cursor-pointer overflow-hidden rounded-xl bg-secondary"
        >
          <Image
            src={video.thumbnail_url || "https://picsum.photos/seed/tiktok/400/700"}
            alt={video.caption || `Video ${video.id}`}
            fill
            className="object-cover transition-transform duration-300 group-hover:scale-105"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />

          {video.is_pinned && (
            <Badge className="absolute left-2 top-2 gap-1 bg-pink-500 text-white hover:bg-pink-500">
              <Pin className="h-3 w-3" />
              Pinned
            </Badge>
          )}

          {video.caption && (
            <div className="absolute bottom-10 left-2 right-2">
              <p className="text-xs font-medium text-white line-clamp-2">{video.caption}</p>
            </div>
          )}

          <div className="absolute bottom-2 left-2 flex items-center gap-1.5 text-white">
            <Play className="h-4 w-4 fill-white" />
            <span className="text-xs font-bold">{formatViews(Number(video.views_count || 0))}</span>
          </div>

          <div className="absolute inset-0 flex items-center justify-center bg-black/20 opacity-0 transition-opacity group-hover:opacity-100">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white/20 backdrop-blur-sm">
              <Play className="h-6 w-6 fill-white text-white" />
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}
