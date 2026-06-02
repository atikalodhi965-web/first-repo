"use client"

import { useState, useEffect } from "react"
import { Header } from "@/components/header"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import {
  Copy,
  Check,
  Users,
  DollarSign,
  TrendingUp,
  Gift,
  Trophy,
  Medal,
  Clock,
  ChevronRight
} from "lucide-react"
import { cn } from "@/lib/utils"
import Image from "next/image"
import { useAuthStore } from "@/store/authStore"
import { referralService, ReferralStats } from "@/services/referral/referralService"
import { SignUpModal } from "@/components/sign-up-modal"
import { toast } from "sonner"
import { Loader2 } from "lucide-react"

type MainTab = "referrals" | "leaderboard" | "profit-chart"

const leaderboardData = {
  referrals: [
    { rank: 1, address: "0x1a2b...3c4d", stats: "142 referrals", earnings: "$28,400", volume: "$1.2M" },
    { rank: 2, address: "0x5e6f...7g8h", stats: "98 referrals", earnings: "$19,600", volume: "$890K" },
    { rank: 3, address: "0x9i0j...1k2l", stats: "76 referrals", earnings: "$15,200", volume: "$720K" },
    { rank: 4, address: "0x3m4n...5o6p", stats: "54 referrals", earnings: "$10,800", volume: "$540K" },
    { rank: 5, address: "0x7q8r...9s0t", stats: "43 referrals", earnings: "$8,600", volume: "$430K" },
    { rank: 6, address: "0xu1v2...w3x4", stats: "32 referrals", earnings: "$6,400", volume: "$320K" },
    { rank: 7, address: "0xy5z6...a7b8", stats: "28 referrals", earnings: "$5,600", volume: "$280K" },
    { rank: 8, address: "0xc9d0...e1f2", stats: "21 referrals", earnings: "$4,200", volume: "$210K" },
    { rank: 9, address: "0xg3h4...i5j6", stats: "18 referrals", earnings: "$3,600", volume: "$180K" },
    { rank: 10, address: "0xk7l8...m9n0", stats: "15 referrals", earnings: "$3,000", volume: "$150K" },
  ],
}

const currentUser = { rank: 47, address: "0xYOUR...WALLET", stats: "+$2,100", earnings: "$210" }

export default function RewardsPage() {
  const { user, isAuthenticated } = useAuthStore()
  const [activeTab, setActiveTab] = useState<MainTab>("referrals")
  const [copied, setCopied] = useState(false)
  const [showSignUpModal, setShowSignUpModal] = useState(false)
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState<ReferralStats>({
    totalEarned: 0,
    activeReferrals: 0,
    commissionPaid: 0,
    referralCode: ""
  })
  const [leaderboard, setLeaderboard] = useState<any[]>([])
  const [myReferrals, setMyReferrals] = useState<any[]>([])
  const [earningConfig, setEarningConfig] = useState<{ commissionRate: number, tiers: any[] }>({
    commissionRate: 0.005,
    tiers: []
  })

  const code = stats.referralCode || user?.referral_code;
  const referralLink = code 
    ? `${typeof window !== 'undefined' ? window.location.origin : ''}/signup?ref=${code}` 
    : ""

  const fetchData = async () => {
    try {
      setLoading(true)
      const [leaderboardRes, configRes, referralsRes] = await Promise.all([
        referralService.getLeaderboard(),
        referralService.getEarningConfig(),
        isAuthenticated && user?.id ? referralService.getReferralsList(user.id) : Promise.resolve({ success: true, data: [] })
      ])
      if (leaderboardRes.success) {
        setLeaderboard(leaderboardRes.data)
      }
      if (configRes.success) {
        setEarningConfig(configRes.data)
      }
      if (referralsRes.success) {
        setMyReferrals(referralsRes.data)
      }

      if (isAuthenticated && user?.id) {
        const statsRes = await referralService.getStats(user.id)
        if (statsRes.success) {
          setStats(statsRes.data)
        }
      }
    } catch (error) {
      console.error("Error fetching rewards data:", error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [isAuthenticated, user?.id])

  const copyToClipboard = () => {
    if (!code) return
    navigator.clipboard.writeText(code)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="mx-auto max-w-5xl px-4 py-8">
        {/* Page Title */}
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold">Earn Rewards</h1>
          <p className="mt-2 text-muted-foreground">Refer friends and climb the leaderboard</p>
        </div>

        {/* Main Tab Navigation */}
        <div className="mb-8 flex items-center justify-center gap-2">
          <Button
            variant={activeTab === "referrals" ? "default" : "outline"}
            onClick={() => setActiveTab("referrals")}
            className="rounded-full px-6"
          >
            <Users className="mr-2 h-4 w-4" />
            Referrals
          </Button>
          <Button
            variant={activeTab === "leaderboard" ? "default" : "outline"}
            onClick={() => setActiveTab("leaderboard")}
            className="rounded-full px-6"
          >
            <Trophy className="mr-2 h-4 w-4" />
            Leaderboard
          </Button>
          <Button
            variant={activeTab === "profit-chart" ? "default" : "outline"}
            onClick={() => setActiveTab("profit-chart")}
            className="rounded-full px-6"
          >
            <TrendingUp className="mr-2 h-4 w-4" />
            Profit Chart
          </Button>
        </div>

        {/* Referrals Section */}
        {activeTab === "referrals" && (
          <div className="space-y-6">
            {/* Commission Rate Banner */}
            <Card className="border-[#4ade80]/30 bg-[#4ade80]/10 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-2xl font-bold text-[#4ade80]">Earn 0.5% Of Every Trade Your Referrals Make</p>
                </div>
                <div className="flex h-20 w-20 items-center justify-center rounded-full bg-[#4ade80]/20">
                  <Gift className="h-10 w-10 text-[#4ade80]" />
                </div>
              </div>
            </Card>

            {/* Referral Link */}
            <Card className="border-border/50 bg-card p-6">
              <h3 className="mb-4 text-lg font-semibold">Your Referral Link</h3>
              {!isAuthenticated ? (
                <div className="flex flex-col items-center justify-center py-4 space-y-4">
                  <p className="text-muted-foreground text-sm">Sign in to generate your unique referral link and start earning.</p>
                  <Button 
                    onClick={() => setShowSignUpModal(true)}
                    className="rounded-full bg-[#4ade80] text-black hover:bg-[#3fcf70] font-bold px-8"
                  >
                    Sign In to Create Link
                  </Button>
                </div>
              ) : (
                <div className="flex gap-2">
                  <Input
                    value={code || "Loading..."}
                    readOnly
                    className="flex-1 bg-[#1a1a1a] border-[#2a2a2a]"
                  />
                  <Button
                    onClick={copyToClipboard}
                    disabled={!code}
                    className={cn(
                      "min-w-[100px]",
                      copied && "bg-[#4ade80] hover:bg-[#4ade80]"
                    )}
                  >
                    {copied ? (
                      <>
                        <Check className="mr-2 h-4 w-4" />
                        Copied
                      </>
                    ) : (
                      <>
                        <Copy className="mr-2 h-4 w-4" />
                        Copy
                      </>
                    )}
                  </Button>
                </div>
              )}
            </Card>

            {/* Stats Row */}
            <div className="grid gap-4 sm:grid-cols-3">
              <Card className="border-border/50 bg-card p-5">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#4ade80]/20">
                    <DollarSign className="h-5 w-5 text-[#4ade80]" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Total Earned</p>
                    <p className="text-xl font-bold">${isAuthenticated ? Number(stats.totalEarned).toFixed(2) : "0.00"}</p>
                  </div>
                </div>
              </Card>
              <Card className="border-border/50 bg-card p-5">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/20">
                    <Users className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Active Referrals</p>
                    <p className="text-xl font-bold">{isAuthenticated ? stats.activeReferrals : "0"}</p>
                  </div>
                </div>
              </Card>
              <Card className="border-border/50 bg-card p-5">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-cyan-500/20">
                    <TrendingUp className="h-5 w-5 text-cyan-500" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Commission Paid</p>
                    <p className="text-xl font-bold">${isAuthenticated ? Number(stats.commissionPaid).toFixed(2) : "0.00"}</p>
                  </div>
                </div>
              </Card>
            </div>

            {/* How It Works */}
            <Card className="border-border/50 bg-card p-6">
              <h3 className="mb-4 text-lg font-semibold">How It Works</h3>
              <div className="space-y-3 text-sm text-muted-foreground">
                <div className="flex items-start gap-3">
                  <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#4ade80] text-xs font-bold text-black">1</div>
                  <p>Share your unique referral link with friends and followers</p>
                </div>
                <div className="flex items-start gap-3">
                  <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#4ade80] text-xs font-bold text-black">2</div>
                  <p>Earn 0.5% of every trade your referrals make</p>
                </div>
                <div className="flex items-start gap-3">
                  <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#4ade80] text-xs font-bold text-black">3</div>
                  <p>Get paid out in real time - no waiting, no minimums</p>
                </div>
              </div>
            </Card>

            {/* CTA to Leaderboard */}
            <button
              onClick={() => {
                setActiveTab("leaderboard")
                setLeaderboardTab("referrals")
              }}
              className="flex w-full items-center justify-between rounded-lg border border-border/50 bg-card p-4 transition-colors hover:bg-secondary"
            >
              <div className="flex items-center gap-3">
                <Trophy className="h-5 w-5 text-primary" />
                <span className="font-medium">View Referrals Leaderboard</span>
              </div>
              <ChevronRight className="h-5 w-5 text-muted-foreground" />
            </button>
          </div>
        )}

        {/* Leaderboard Section */}
        {activeTab === "leaderboard" && (
          <div className="space-y-6">
            {/* Prize Pool Banner */}
            <Card className="border-primary/30 bg-primary/10 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Weekly Prize Pool</p>
                  <p className="text-3xl font-bold text-primary">$25,000</p>
                </div>
                <div className="flex items-center gap-2 rounded-full bg-[#1a1a1a] px-4 py-2">
                  <Clock className="h-4 w-4 text-primary" />
                  <span className="text-sm font-medium">Resets in 4d 12h</span>
                </div>
              </div>
            </Card>

            {/* Leaderboard Header */}
            <h2 className="text-xl font-bold text-white">Referral Leaderboard</h2>

            {/* Leaderboard Table */}
            <Card className="border-border/50 bg-card overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-border/50 text-left text-sm text-muted-foreground">
                      <th className="px-4 py-3 font-medium">Rank</th>
                      <th className="px-4 py-3 font-medium">Wallet</th>
                      <th className="px-4 py-3 font-medium text-right">Referrals</th>
                      <th className="px-4 py-3 font-medium text-right">Earnings</th>
                    </tr>
                  </thead>
                  <tbody>
                    {loading ? (
                      <tr>
                        <td colSpan={4} className="py-8 text-center">
                          <Loader2 className="h-6 w-6 animate-spin mx-auto text-primary" />
                        </td>
                      </tr>
                    ) : leaderboard.length > 0 ? (
                      leaderboard.map((entry) => (
                      <tr 
                        key={entry.rank} 
                        className="border-b border-border/30 transition-colors hover:bg-secondary/50"
                      >
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            {entry.rank === 1 && (
                              <div className="flex h-6 w-6 items-center justify-center rounded-full bg-yellow-500/20">
                                <Medal className="h-4 w-4 text-yellow-500" />
                              </div>
                            )}
                            {entry.rank === 2 && (
                              <div className="flex h-6 w-6 items-center justify-center rounded-full bg-gray-400/20">
                                <Medal className="h-4 w-4 text-gray-400" />
                              </div>
                            )}
                            {entry.rank === 3 && (
                              <div className="flex h-6 w-6 items-center justify-center rounded-full bg-orange-600/20">
                                <Medal className="h-4 w-4 text-orange-600" />
                              </div>
                            )}
                            {entry.rank > 3 && (
                              <span className="w-6 text-center text-muted-foreground">{entry.rank}</span>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <div className="h-8 w-8 overflow-hidden rounded-full bg-[#2a2a2a]">
                              <Image
                                src={entry.profile_image_url || `https://picsum.photos/seed/user${entry.rank}/100/100`}
                                alt="User"
                                width={32}
                                height={32}
                                className="object-cover"
                              />
                            </div>
                            <div className="flex flex-col">
                              <span className="font-semibold text-sm">{entry.username}</span>
                              <span className="font-mono text-[10px] text-muted-foreground">
                                {entry.wallet_address ? `${entry.wallet_address.slice(0, 6)}...${entry.wallet_address.slice(-4)}` : "No Wallet"}
                              </span>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <span className="font-medium">{entry.total_referrals}</span>
                        </td>
                        <td className="px-4 py-3 text-right font-medium text-primary">${Number(entry.total_earnings).toFixed(2)}</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={4} className="py-8 text-center text-muted-foreground">
                        No leaderboard data available
                      </td>
                    </tr>
                  )}
                  </tbody>
                </table>
              </div>

              {/* Current User Row */}
              {isAuthenticated && (
                <div className="border-t border-border bg-primary/5 px-4 py-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <span className="w-6 text-center text-muted-foreground">#--</span>
                      <div className="flex items-center gap-2">
                        <div className="h-8 w-8 overflow-hidden rounded-full bg-primary/20">
                          <Image
                            src={user?.profile_image_url || "https://picsum.photos/seed/currentuser/100/100"}
                            alt="You"
                            width={32}
                            height={32}
                            className="object-cover"
                          />
                        </div>
                        <span className="font-semibold text-sm">{user?.username}</span>
                        <span className="rounded-full bg-primary/20 px-2 py-0.5 text-xs font-medium text-primary">You</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-8">
                      <span className="font-medium text-[#4ade80]">{stats.activeReferrals} Referrals</span>
                      <span className="font-medium text-primary">${Number(stats.totalEarned).toFixed(2)}</span>
                    </div>
                  </div>
                </div>
              )}
            </Card>
          </div>
        )}

        {/* Profit Chart Section */}
        {activeTab === "profit-chart" && (
          <div className="space-y-6">
            <Card className="border-border/50 bg-card p-6">
              <h2 className="text-xl font-bold mb-6">Earnings Chart</h2>
              <p className="text-muted-foreground mb-6">See how much you could earn based on your referrals&apos; trading volume</p>

              {/* Profit Table */}
              <div className="overflow-hidden rounded-lg border border-border/50">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-border/50 bg-[#1a1a1a]">
                      <th className="px-6 py-4 text-left text-sm font-semibold text-white">Referral</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-white">Their Volume</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-white">Your Earnings</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/30">
                    {myReferrals.length > 0 ? (
                      myReferrals.map((ref, idx) => (
                        <tr key={idx} className="hover:bg-[#1a1a1a]/50 transition-colors">
                          <td className="px-6 py-4 text-white font-medium">
                            <div className="flex items-center gap-2">
                              <div className="h-6 w-6 overflow-hidden rounded-full bg-secondary">
                                <Image
                                  src={ref.profile_image_url || `https://picsum.photos/seed/${ref.username}/100/100`}
                                  alt={ref.username}
                                  width={24}
                                  height={24}
                                  className="object-cover"
                                />
                              </div>
                              <span>{ref.username}</span>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-white">${Number(ref.total_volume).toLocaleString()}</td>
                          <td className="px-6 py-4 text-white">${Number(ref.total_earned).toLocaleString()}</td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={3} className="px-6 py-8 text-center text-muted-foreground">
                          No referrals yet. Share your link to start earning!
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              <p className="text-sm text-muted-foreground mt-4">
                Based on {(earningConfig.commissionRate * 100).toFixed(1)}% commission rate. Monthly earnings calculated as daily earnings x 30 days.
              </p>
            </Card>
          </div>
        )}
      </main>

      <SignUpModal 
        open={showSignUpModal} 
        onOpenChange={setShowSignUpModal}
        onSuccess={() => {
          setShowSignUpModal(false)
          fetchData()
        }}
      />
    </div>
  )
}
