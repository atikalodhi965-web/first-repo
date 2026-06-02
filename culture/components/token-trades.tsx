'use client'

import { useState, useEffect } from 'react'
import { tokenService } from '@/services/token/tokenService'
import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'

interface Trade {
  id: string;
  type: 'buy' | 'sell';
  price: string | number;
  usd_value: string | number;
  input_amount: string | number;
  output_amount: string | number;
  tx_hash: string;
  created_at: string;
  maker_name: string | null;
  maker_avatar: string | null;
  maker_id: string | null;
  maker_wallet: string | null;
  sol_amount: string | number;
  token_amount: string | number;
}

interface TokenTradesProps {
  coinId: string;
}

// Formats timestamp into uppercase uppercase relative time (e.g. '32S AGO', '5M AGO')
function formatTradeTime(dateString: string): string {
  try {
    const now = new Date();
    const past = new Date(dateString);
    const diffMs = now.getTime() - past.getTime();
    if (isNaN(diffMs) || diffMs < 0) return 'JUST NOW';

    const diffSecs = Math.floor(diffMs / 1000);
    const diffMins = Math.floor(diffSecs / 60);
    const diffHrs = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHrs / 24);

    if (diffSecs < 60) return `${diffSecs}S AGO`;
    if (diffMins < 60) return `${diffMins}M AGO`;
    if (diffHrs < 24) return `${diffHrs}H AGO`;
    return `${diffDays}D AGO`;
  } catch (e) {
    return 'RECENTLY';
  }
}

const formatAddress = (addr: string) => {
  if (addr.length > 10) {
    return `${addr.slice(0, 4)}...${addr.slice(-4)}`;
  }
  return addr;
};

const formatTxHash = (hash: string) => {
  if (hash.length > 10) {
    return `${hash.slice(0, 6)}...${hash.slice(-2)}`;
  }
  return hash;
};

const scaleAmount = (amount: number): number => {
  let value = amount;
  if (value >= 1_000_000_000) {
    value = value / 1_000_000_000;
  } else if (value >= 1_000_000) {
    value = value / 1_000_000;
  }
  return value;
};

export function TokenTrades({ coinId }: TokenTradesProps) {
  const [trades, setTrades] = useState<Trade[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchTrades = async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const res = await tokenService.getTrades(coinId);
      if (res.success && res.items) {
        setTrades(res.items);
      }
    } catch (error) {
      console.error('Error fetching trades:', error);
    } finally {
      if (!silent) setLoading(false);
    }
  };

  useEffect(() => {
    fetchTrades();
    // Poll every 5 seconds to load newly recorded trades live
    const interval = setInterval(() => {
      fetchTrades(true);
    }, 5000);
    return () => clearInterval(interval);
  }, [coinId]);

  return (
    <Card className="border-border/50 bg-card/50">
      <CardContent className="p-0">
        {/* Table Header */}
        <div className="grid grid-cols-9 gap-2 px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wide border-b border-border/50">
          <div className="col-span-2">Account</div>
          <div>Type</div>
          <div>Value</div>
          <div>Amount</div>
          <div>Price</div>
          <div>Date</div>
          <div>Chain</div>
          <div>TX</div>
        </div>

        {/* Table Body */}
        {loading && trades.length === 0 ? (
          <div className="divide-y divide-border/30">
            {[1, 2, 3, 4, 5].map((n) => (
              <div key={n} className="grid grid-cols-9 gap-2 px-4 py-3 items-center">
                <div className="col-span-2 flex items-center gap-2">
                  <Skeleton className="h-7 w-7 rounded-full shrink-0" />
                  <Skeleton className="h-4 w-20 animate-pulse" />
                </div>
                <Skeleton className="h-4 w-12" />
                <Skeleton className="h-4 w-12" />
                <Skeleton className="h-4 w-12" />
                <Skeleton className="h-4 w-12" />
                <Skeleton className="h-4 w-16" />
                <Skeleton className="h-5 w-5 rounded-full" />
                <Skeleton className="h-4 w-16" />
              </div>
            ))}
          </div>
        ) : trades.length === 0 ? (
          <div className="py-12 text-center">
            <p className="text-sm font-semibold text-muted-foreground">No trades yet</p>
            <p className="text-xs text-muted-foreground/70 mt-1">Trading will begin as soon as the first swap is made.</p>
          </div>
        ) : (
          <div className="divide-y divide-border/30">
            {trades.map((trade, index) => {
              const accountAddr = trade.maker_wallet || trade.maker_name || trade.maker_id || '';
              const txHashStr = trade.tx_hash || '';

              const valueNum = typeof trade.usd_value === 'string' ? parseFloat(trade.usd_value) : trade.usd_value;
              const amountNumRaw = typeof trade.sol_amount === 'string' ? parseFloat(trade.sol_amount) : trade.sol_amount;
              const amountNum = scaleAmount(amountNumRaw);
              const priceNum = typeof trade.price === 'string' ? parseFloat(trade.price) : trade.price;

              return (
                <div key={trade.id} className="grid grid-cols-9 gap-2 px-4 py-3 items-center text-sm hover:bg-secondary/30 transition-colors">
                  {/* Account */}
                  <div className="col-span-2 flex items-center gap-2">
                    <div 
                      className="h-7 w-7 rounded-full flex-shrink-0"
                      style={{
                        background: `linear-gradient(135deg, hsl(${(index * 60) % 360}, 70%, 50%), hsl(${(index * 60 + 45) % 360}, 70%, 60%))`
                      }}
                    />
                    <span className="text-white font-medium truncate font-mono">
                      {formatAddress(accountAddr)}
                    </span>
                  </div>

                  {/* Type */}
                  <div>
                    <span className={cn(
                      "font-semibold",
                      trade.type === "buy" ? "text-[#4ade80]" : "text-[#ef4444]"
                    )}>
                      {trade.type.toUpperCase()}
                    </span>
                  </div>

                  {/* Value */}
                  <div className="text-white">
                    ${valueNum.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </div>

                  {/* Amount */}
                  <div className="text-white">
                    {amountNum >= 1000 ? `${(amountNum / 1000).toFixed(2)}K` : amountNum.toFixed(2)}
                  </div>

                  {/* Price */}
                  <div className="text-white">
                    ${priceNum.toFixed(4)}
                  </div>

                  {/* Date */}
                  <div className="text-muted-foreground uppercase">
                    {formatTradeTime(trade.created_at)}
                  </div>

                  {/* Chain - Solana */}
                  <div>
                    <div className="h-5 w-5 rounded-full bg-gradient-to-br from-[#9945FF] to-[#14F195] flex items-center justify-center">
                      <svg className="h-3 w-3 text-white" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M4 8h16l-2-2H6L4 8zm0 4h16l-2 2H6l-2-2zm0 4h16l-2-2H6l-2 2z"/>
                      </svg>
                    </div>
                  </div>

                  {/* TX */}
                  <div className="text-muted-foreground truncate">
                    <a 
                      href={`https://solscan.io/tx/${txHashStr}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="hover:underline hover:text-primary transition-colors"
                    >
                      {formatTxHash(txHashStr)}
                    </a>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
