"use client"

import { useEffect, useState, useMemo } from "react"
import {
  Area,
  AreaChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  CartesianGrid
} from "recharts"
import { tokenService } from "@/services/token/tokenService"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { cn } from "@/lib/utils"

interface ChartDataPoint {
  period_start: string
  open: number
  high: number
  low: number
  close: number
  volume: number
}

interface TokenChartProps {
  coinId: string
  tokenName: string
  ticker: string
}

const timeframes = [
  { label: "1m", value: "1m" },
  { label: "5m", value: "5m" },
  { label: "15m", value: "15m" },
  { label: "1h", value: "1h" },
  { label: "4h", value: "4h" },
  { label: "1d", value: "1d" },
]

export function TokenChart({ coinId, tokenName, ticker }: TokenChartProps) {
  const [data, setData] = useState<ChartDataPoint[]>([])
  const [loading, setLoading] = useState(true)
  const [timeframe, setTimeframe] = useState("1m")
  const [activeMetric, setActiveMetric] = useState<"price" | "volume">("price")

  useEffect(() => {
    const fetchChart = async () => {
      try {
        setLoading(true)
        const res = await tokenService.getChartData(coinId, timeframe)
        if (res.success && res.data) {
          setData(res.data)
        }
      } catch (error) {
        console.error("Error fetching chart data:", error)
      } finally {
        setLoading(false)
      }
    }

    if (coinId) {
      fetchChart()
      const interval = setInterval(fetchChart, 30000) // Refresh every 30s
      return () => clearInterval(interval)
    }
  }, [coinId, timeframe])

  const chartData = useMemo(() => {
    return data.map((d) => ({
      ...d,
      timestamp: new Date(d.period_start).getTime(),
      formattedDate: new Date(d.period_start).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      value: activeMetric === "price" ? parseFloat(d.close.toString()) : parseFloat(d.volume.toString())
    }))
  }, [data, activeMetric])

  const minMax = useMemo(() => {
    if (chartData.length === 0) return { min: 0, max: 0 }
    const values = chartData.map(d => d.value)
    return {
      min: Math.min(...values) * 0.999,
      max: Math.max(...values) * 1.001
    }
  }, [chartData])

  if (loading && data.length === 0) {
    return (
      <div className="flex h-80 w-full flex-col gap-4 p-4 mt-8">
        <Skeleton className="h-full w-full rounded-xl bg-secondary/50" />
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Chart Header / Controls */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex bg-secondary/50 p-1 rounded-lg">
          <Button
            variant="ghost"
            size="sm"
            className={cn(
              "text-xs font-semibold px-4 h-8 rounded-md",
              activeMetric === "price" && "bg-background shadow-sm text-primary"
            )}
            onClick={() => setActiveMetric("price")}
          >
            Price
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className={cn(
              "text-xs font-semibold px-4 h-8 rounded-md",
              activeMetric === "volume" && "bg-background shadow-sm text-primary"
            )}
            onClick={() => setActiveMetric("volume")}
          >
            Volume
          </Button>
        </div>

        <div className="flex gap-1 bg-secondary/50 p-1 rounded-lg">
          {timeframes.map((tf) => (
            <Button
              key={tf.value}
              variant="ghost"
              size="sm"
              className={cn(
                "text-[10px] h-7 px-2 font-medium min-w-[32px] rounded-md transition-all",
                timeframe === tf.value ? "bg-background shadow-sm text-primary" : "text-muted-foreground hover:text-foreground"
              )}
              onClick={() => setTimeframe(tf.value)}
            >
              {tf.label}
            </Button>
          ))}
        </div>
      </div>

      {/* Chart Display */}
      <div className="h-80 w-full relative">
        {chartData.length > 0 ? (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 20, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#4ade80" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#4ade80" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#2a2a2a" />
              <XAxis
                dataKey="formattedDate"
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 10, fill: '#6a6a6a' }}
                minTickGap={30}
              />
              <YAxis
                domain={[minMax.min, minMax.max]}
                orientation="right"
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 10, fill: '#6a6a6a' }}
                tickFormatter={(val) => activeMetric === "price" ? `$${val < 0.0001 ? val.toFixed(10) : val.toFixed(6)}` : `$${(val / 1000).toFixed(1)}k`}
              />
              <Tooltip
                contentStyle={{ backgroundColor: '#1a1a1a', border: '1px solid #2a2a2a', borderRadius: '8px', fontSize: '12px' }}
                labelStyle={{ display: 'none' }}
                formatter={(val: number) => [
                  activeMetric === "price" ? `$${val < 0.0001 ? val.toFixed(10) : val.toFixed(6)}` : `$${val.toLocaleString()}`,
                  activeMetric === "price" ? "Price" : "Volume"
                ]}
              />
              <Area
                type="monotone"
                dataKey="value"
                stroke="#4ade80"
                strokeWidth={2}
                fillOpacity={1}
                fill="url(#chartGradient)"
                isAnimationActive={!loading}
              />
            </AreaChart>
          </ResponsiveContainer>
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-secondary/20 rounded-xl border border-dashed border-border/50">
            <p className="text-sm text-muted-foreground">No chart data available yet</p>
          </div>
        )}
      </div>
    </div>
  )
}
