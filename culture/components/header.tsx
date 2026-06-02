"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Rocket, Menu, X, Search, Wallet, User, LogOut, Globe, Loader2 } from "lucide-react"
import Image from "next/image"
import { Input } from "@/components/ui/input"
import { SignUpModal } from "@/components/sign-up-modal"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useAuthStore } from "@/store/authStore"
import { useSolanaWallet } from "@/hooks/useSolanaWallet"
import { useWalletModal } from "@solana/wallet-adapter-react-ui"
import { userService } from "@/services/user/userService"
import { toast } from "sonner"

export function Header() {
  const router = useRouter()
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [showSignUpModal, setShowSignUpModal] = useState(false)
  const [language, setLanguage] = useState("en")
  const [mounted, setMounted] = useState(false)

  const { isAuthenticated, user, logout } = useAuthStore()
  console.log(user, "useerrrrr")
  const { publicKey, connected, balance, loadingBalance, disconnect } = useSolanaWallet()
  const { setVisible } = useWalletModal()

  // Prevent hydration mismatch
  useEffect(() => {
    setMounted(true)
    
    // Validate session on mount
    const validateSession = async () => {
      if (isAuthenticated) {
        try {
          const res = await userService.getMyProfile();
          if (!res.success || !res.data) {
            console.log("Session invalid or user not found, logging out...");
            logout();
            disconnect();
          }
        } catch (error: any) {
          console.error("Session validation error:", error);
          if (error.message === 'User not found') {
            logout();
            disconnect();
          }
        }
      }
    }
    
    validateSession();
  }, [isAuthenticated, logout, disconnect])

  // Handle wallet connection API call
  useEffect(() => {
    const handleWalletConnection = async () => {
      if (connected && publicKey && isAuthenticated && user?.id) {
        try {
          const res = await userService.createWallet({
            userId: user.id,
            address: publicKey.toBase58(),
            chain: 'solana',
            isPrimary: true
          });

          if (res.success) {
            console.log(res.message || 'Wallet connected and synced with backend');
          } else {
            console.error('Failed to sync wallet with backend:', res.error);
            if (res.error === 'User not found') {
              logout();
              disconnect();
            }
          }
        } catch (error: any) {
          console.error('Error syncing wallet:', error);
          if (error.message === 'User not found') {
            logout();
            disconnect();
          }
        }
      }
    };

    if (mounted) {
      handleWalletConnection();
    }
  }, [connected, publicKey, isAuthenticated, user?.id, mounted]);

  const imageUrl =
    user?.profile_image_url?.startsWith('http')
      ? user.profile_image_url
      : `https://${user?.profile_image_url}`;
  console.log(imageUrl, "imageUrl")

  const formatAddress = (addr: string) => {
    return `${addr.slice(0, 4)}...${addr.slice(-4)}`
  }

  return (
    <header className="sticky top-0 z-50 border-b border-border/50 bg-background/80 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4">
        <div className="flex items-center gap-8">
          <Link href="/" className="flex items-center gap-2 group">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary transition-transform group-hover:scale-105">
              <Rocket className="h-5 w-5 text-primary-foreground" />
            </div>
            <span className="text-xl font-bold tracking-tight">
              Moon<span className="text-primary">Pad</span>
            </span>
          </Link>

          <nav className="hidden items-center gap-1 md:flex">
            <Link
              href="/"
              className="rounded-lg px-4 py-2 text-sm font-medium text-foreground/80 transition-colors hover:bg-secondary hover:text-foreground"
            >
              Home
            </Link>
            <Link
              href="/create"
              className="rounded-lg px-4 py-2 text-sm font-medium text-foreground/80 transition-colors hover:bg-secondary hover:text-foreground"
            >
              Launch
            </Link>
            <Link
              href="/rewards"
              className="rounded-lg px-4 py-2 text-sm font-medium text-foreground/80 transition-colors hover:bg-secondary hover:text-foreground"
            >
              Earn
            </Link>
            {mounted && isAuthenticated && (
              <Link
                href="/profile"
                className="rounded-lg px-4 py-2 text-sm font-medium text-foreground/80 transition-colors hover:bg-secondary hover:text-foreground"
              >
                Profile
              </Link>
            )}
          </nav>
        </div>

        <div className="hidden items-center gap-4 md:flex">
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search tokens..."
              className="w-80 h-10 bg-secondary/50 pl-10 focus-visible:ring-primary"
            />
          </div>

          {/* Language Selector */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="flex items-center gap-1.5 h-9 px-2 rounded-lg text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors focus:outline-none">
                <Globe className="h-4 w-4" />
                <span className="text-sm font-medium">{language === "en" ? "English" : language === "zh" ? "中文" : "日本語"}</span>
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-40 bg-[#0a0a0a] border-[#2a2a2a] p-2">
              <DropdownMenuItem
                onClick={() => setLanguage("en")}
                className="py-2.5 px-3 cursor-pointer focus:bg-[#1a1a1a] rounded-lg"
              >
                <span className="text-white">English</span>
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => setLanguage("zh")}
                className="py-2.5 px-3 cursor-pointer focus:bg-[#1a1a1a] rounded-lg"
              >
                <span className="text-white">中文(简体)</span>
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => setLanguage("ja")}
                className="py-2.5 px-3 cursor-pointer focus:bg-[#1a1a1a] rounded-lg"
              >
                <span className="text-white">日本語</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {mounted && isAuthenticated ? (
            <>
              {connected && publicKey ? (
                <div className="flex items-center bg-secondary/50 rounded-lg p-1 border border-border/50">
                  <div className="px-3 py-1 text-xs font-medium text-muted-foreground border-r border-border/50">
                    {loadingBalance ? <Loader2 className="h-3 w-3 animate-spin" /> : `${balance?.toFixed(3)} SOL`}
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        className="h-8 gap-2 px-3 text-xs font-bold hover:bg-transparent text-primary"
                      >
                        <Wallet className="h-3.5 w-3.5" />
                        <span>{formatAddress(publicKey.toBase58())}</span>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-48 bg-[#1a1a1a] border-[#2a2a2a]">
                      <DropdownMenuItem
                        onClick={() => disconnect()}
                        className="gap-3 py-2.5 px-3 cursor-pointer focus:bg-[#2a2a2a] text-red-500 hover:text-red-400"
                      >
                        <LogOut className="h-4 w-4" />
                        <span>Disconnect Wallet</span>
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              ) : (
                <Button
                  variant="outline"
                  onClick={() => setVisible(true)}
                  className="gap-2 font-medium border-primary/20 hover:bg-primary/10 text-primary transition-all hover:scale-105"
                >
                  <Wallet className="h-4 w-4" />
                  <span>Connect Wallet</span>
                </Button>
              )}

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="relative h-9 w-9 overflow-hidden rounded-full border-2 border-primary/50 hover:border-primary transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-background">
                    <Image
                      src={user?.profile_image_url || "https://picsum.photos/seed/user123/100/100"}
                      alt="Profile"
                      fill
                      className="object-cover"
                    />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48 bg-[#1a1a1a] border-[#2a2a2a]">
                  <DropdownMenuItem asChild className="gap-3 py-2.5 px-3 cursor-pointer focus:bg-[#2a2a2a]">
                    <Link href="/profile">
                      <User className="h-4 w-4" />
                      <span>{user?.username || 'Profile'}</span>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => {
                      logout();
                      router.push("/");
                    }}
                    className="gap-3 py-2.5 px-3 cursor-pointer focus:bg-[#2a2a2a]"
                  >
                    <LogOut className="h-4 w-4" />
                    <span>Sign out</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          ) : mounted ? (
            <Button
              onClick={() => setShowSignUpModal(true)}
              className="font-semibold bg-primary text-primary-foreground hover:bg-primary/90"
            >
              Sign Up / Login
            </Button>
          ) : null}
        </div>

        <Button
          variant="ghost"
          size="icon"
          className="md:hidden"
          onClick={() => setIsMenuOpen(!isMenuOpen)}
        >
          {isMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </Button>
      </div>

      {/* Mobile Menu */}
      {isMenuOpen && (
        <div className="border-t border-border/50 bg-background/95 p-4 backdrop-blur-xl md:hidden">
          <nav className="flex flex-col gap-2">
            <Link
              href="/"
              className="rounded-lg px-4 py-3 text-sm font-medium hover:bg-secondary"
              onClick={() => setIsMenuOpen(false)}
            >
              Home
            </Link>
            <Link
              href="/create"
              className="rounded-lg px-4 py-3 text-sm font-medium hover:bg-secondary"
              onClick={() => setIsMenuOpen(false)}
            >
              Launch
            </Link>
            <Link
              href="/rewards"
              className="rounded-lg px-4 py-3 text-sm font-medium hover:bg-secondary"
              onClick={() => setIsMenuOpen(false)}
            >
              Earn
            </Link>
          </nav>
          <div className="mt-4 flex flex-col gap-3">
            <Input placeholder="Search tokens..." className="bg-secondary/50" />

            {/* Mobile Language Selector */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="w-full gap-2 justify-start border-border/50">
                  <Globe className="h-4 w-4" />
                  <span>{language === "en" ? "English" : language === "zh" ? "中文(简体)" : "日本語"}</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-40 bg-[#0a0a0a] border-[#2a2a2a] p-2">
                <DropdownMenuItem
                  onClick={() => setLanguage("en")}
                  className="py-2.5 px-3 cursor-pointer focus:bg-[#1a1a1a] rounded-lg"
                >
                  <span className="text-white">English</span>
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => setLanguage("zh")}
                  className="py-2.5 px-3 cursor-pointer focus:bg-[#1a1a1a] rounded-lg"
                >
                  <span className="text-white">中文(简体)</span>
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => setLanguage("ja")}
                  className="py-2.5 px-3 cursor-pointer focus:bg-[#1a1a1a] rounded-lg"
                >
                  <span className="text-white">日本語</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {mounted && isAuthenticated ? (
              <div className="flex flex-col gap-3">
                {connected && publicKey ? (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="outline"
                        className="w-full gap-2 font-medium border-border/50 hover:bg-secondary justify-between"
                      >
                        <div className="flex items-center gap-2">
                          <Wallet className="h-4 w-4" />
                          <span>{formatAddress(publicKey.toBase58())} ({balance?.toFixed(2)} SOL)</span>
                        </div>
                        <Menu className="h-3 w-3 opacity-50" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-[calc(100vw-2rem)] bg-[#1a1a1a] border-[#2a2a2a]">
                      <DropdownMenuItem
                        onClick={() => disconnect()}
                        className="gap-3 py-3 px-4 cursor-pointer focus:bg-[#2a2a2a] text-red-500"
                      >
                        <LogOut className="h-4 w-4" />
                        <span>Disconnect Wallet</span>
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                ) : (
                  <Button
                    variant="outline"
                    onClick={() => setVisible(true)}
                    className="w-full gap-2 font-medium border-border/50 hover:bg-secondary text-primary"
                  >
                    <Wallet className="h-4 w-4" />
                    <span>Connect Wallet</span>
                  </Button>
                )}

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button className="flex items-center gap-3 w-full p-2 rounded-lg hover:bg-secondary transition-colors">
                      <div className="relative h-10 w-10 overflow-hidden rounded-full border-2 border-primary/50">
                        <Image
                          src={imageUrl}
                          alt="Profile"
                          fill
                          className="object-cover"
                        />
                      </div>
                      <span className="font-medium text-foreground">{user?.username || 'Profile'}</span>
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-48 bg-[#1a1a1a] border-[#2a2a2a]">
                    <DropdownMenuItem asChild className="gap-3 py-2.5 px-3 cursor-pointer focus:bg-[#2a2a2a]">
                      <Link href="/profile" onClick={() => setIsMenuOpen(false)}>
                        <User className="h-4 w-4" />
                        <span>Profile</span>
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => {
                        logout()
                        setIsMenuOpen(false)
                      }}
                      className="gap-3 py-2.5 px-3 cursor-pointer focus:bg-[#2a2a2a]"
                    >
                      <LogOut className="h-4 w-4" />
                      <span>Sign out</span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            ) : mounted ? (
              <>
                <Button
                  onClick={() => {
                    setShowSignUpModal(true)
                    setIsMenuOpen(false)
                  }}
                  className="w-full font-semibold bg-primary text-primary-foreground"
                >
                  Sign Up / Login
                </Button>
              </>
            ) : null}
          </div>
        </div>
      )}

      {/* Sign Up Modal */}
      <SignUpModal
        open={showSignUpModal}
        onOpenChange={setShowSignUpModal}
      />
    </header>
  )
}
