"use client"

import { useState, useRef, useEffect } from "react"
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Star, Lock, Loader2, Camera, Globe, Image as ImageIcon, Trash2, ChevronLeft, Wallet } from "lucide-react"
import { cn } from "@/lib/utils"
import { useAuth } from "@/hooks/useAuth"
import { useSolanaWallet } from "@/hooks/useSolanaWallet"
import { useWalletModal } from "@solana/wallet-adapter-react-ui"
import Image from "next/image"
import { API_ROUTES } from "@/constants/apiRoutes"
import { toast } from "sonner"
import { userService } from "@/services/user/userService"

interface SignUpModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess?: () => void
}

export function SignUpModal({ open, onOpenChange, onSuccess }: SignUpModalProps) {
  const { user, requestOTP, verifyOTPAndAuth, updateProfile, isLoading } = useAuth()
  const { connected, publicKey } = useSolanaWallet()
  const { setVisible } = useWalletModal()
  const [authMethod, setAuthMethod] = useState<"email" | "phone">("email")
  const [inputValue, setInputValue] = useState("")
  const [step, setStep] = useState<"method" | "otp" | "profile" | "referral" | "wallet">("method")
  const [otp, setOtp] = useState<string[]>(["", "", "", "", "", ""])
  const [referralCode, setReferralCode] = useState("")
  const [isReferralSubmitting, setIsReferralSubmitting] = useState(false)
  const otpRefs = useRef<(HTMLInputElement | null)[]>([])

  // const fileInputRef = useRef<HTMLInputElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [isUploading, setIsUploading] = useState({ profile: false })
  const [isCreatingWallet, setIsCreatingWallet] = useState(false)

  const [profileData, setProfileData] = useState({
    username: "",
    fullname: "",
    bio: "",
    website: "",
    profile_image_url: ""
  })

  // Reset state when modal closes
  useEffect(() => {
    if (!open) {
      setStep("method")
      setOtp(["", "", "", "", "", ""])
      setInputValue("")
      setReferralCode("")
      setProfileData({
        username: "",
        fullname: "",
        bio: "",
        website: "",
        profile_image_url: ""
      })
    }
  }, [open])

  // Auto-close and sync wallet when connected on the final step
  useEffect(() => {
    const handleWalletSync = async () => {
      if (step === "wallet" && connected && publicKey && user?.id) {
        setIsCreatingWallet(true)
        try {
          const res = await userService.createWallet({
            userId: user.id,
            address: publicKey.toBase58(),
            chain: 'solana',
            isPrimary: true
          });

          if (res.success) {
            toast.success("Onboarding complete!");
            onSuccess?.();
            onOpenChange(false);
          } else {
            console.error('Wallet sync failed:', res.error);
          }
        } catch (error) {
          console.error('Error syncing wallet:', error);
        } finally {
          setIsCreatingWallet(false);
        }
      }
    };
    handleWalletSync();
  }, [step, connected, publicKey, user?.id, onOpenChange, onSuccess])

  const handleSendCode = async () => {
    if (inputValue) {
      const success = await requestOTP(inputValue, authMethod);
      if (success) {
        setStep("otp");
      }
    }
  }

  const handleOtpChange = async (index: number, value: string) => {
    if (value.length > 1) {
      value = value.slice(-1)
    }

    if (!/^\d*$/.test(value)) return

    const newOtp = [...otp]
    newOtp[index] = value
    setOtp(newOtp)

    // Auto-focus next input
    if (value && index < 5) {
      otpRefs.current[index + 1]?.focus()
    }

    // If 6 digits are filled, verify OTP and check if user is new
    if (newOtp.every(digit => digit !== "")) {
      const code = newOtp.join("");
      const res = await verifyOTPAndAuth(inputValue, code);

      if (res.success) {
        if (res.isNewUser) {
          setStep("profile");
        } else {
          toast.success("Login successful!");
          setStep("wallet");
        }
      } else {
        // Clear OTP on failure
        setOtp(["", "", "", "", "", ""]);
        otpRefs.current[0]?.focus();
      }
    }
  }

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      otpRefs.current[index - 1]?.focus()
    }
  }

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>, type: 'profile') => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file size (e.g., 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error("File size too large (max 5MB)");
      return;
    }

    const previewUrl = URL.createObjectURL(file);
    setProfileData(prev => ({
      ...prev,
      profile_image_url: previewUrl
    }));

    setIsUploading(prev => ({ ...prev, profile: true }));

    const formData = new FormData();
    formData.append('profilePic', file);

    try {
      const baseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080/api";
      const response = await fetch(`${baseUrl}${API_ROUTES.USER.UPLOAD_IMAGE}`, {
        method: 'POST',
        body: formData,
      });

      // Check if response is JSON
      const contentType = response.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) {
        const text = await response.text();
        console.error("Non-JSON response:", text);
        throw new Error("Server returned non-JSON response. Check API URL.");
      }

      const data = await response.json();
      console.log("[Upload Response Raw]:", data);

      if (data.success && data.url) {
        console.log(`[Upload Success] ${type} URL:`, data.url);
        setProfileData(prev => ({
          ...prev,
          profile_image_url: data.url
        }));
        toast.success(`Profile image uploaded`);
      } else {
        console.error(`[Upload Error] Server returned success: ${data.success}, but url is:`, data.url);
        toast.error(data.error || "Upload failed: Invalid response from server");
      }
    } catch (error) {
      console.error("Upload error:", error);
      toast.error("Upload failed");
    } finally {
      setIsUploading(prev => ({ ...prev, profile: false }));
    }
  }

  const handleProfileSubmit = async () => {
    // 1. Username Validation
    if (!profileData.username || profileData.username.trim().length < 3) {
      toast.error("Username must be at least 3 characters");
      return;
    }
    if (!/^[a-zA-Z0-9_]+$/.test(profileData.username)) {
      toast.error("Username can only contain letters, numbers, and underscores");
      return;
    }

    // 2. Full Name Validation
    if (profileData.fullname && profileData.fullname.length > 50) {
      toast.error("Full name is too long (max 50 chars)");
      return;
    }

    // 3. Bio Validation
    if (profileData.bio && profileData.bio.length > 160) {
      toast.error("Bio is too long (max 160 chars)");
      return;
    }

    // 4. Website Validation
    if (profileData.website) {
      try {
        new URL(profileData.website);
      } catch (e) {
        toast.error("Please enter a valid website URL (e.g., https://example.com)");
        return;
      }
    }

    // 5. Photo Validation
    if (!profileData.profile_image_url) {
      toast.error("Please upload a profile photo to continue");
      return;
    }

    const { username, ...otherData } = profileData;

    const success = await updateProfile({
      username,
      ...otherData
    });

    if (success) {
      setStep("referral");
    }
  }

  const handleReferralSubmit = async () => {
    if (!user?.id || !referralCode) return;
    setIsReferralSubmitting(true);
    try {
      const { referralService } = await import('@/services/referral/referralService');
      const res = await referralService.acceptReferral(user.id, referralCode);
      if (res.success) {
        toast.success("Referral applied!");
        setStep("wallet");
      } else {
        toast.error(res.message || "Invalid referral code");
      }
    } catch (error) {
      console.error("Error applying referral:", error);
      toast.error("Failed to apply referral code");
    } finally {
      setIsReferralSubmitting(false);
    }
  }

  const handleReferralSkip = async () => {
    if (!user?.id) return;
    setIsReferralSubmitting(true);
    try {
      const { referralService } = await import('@/services/referral/referralService');
      await referralService.skipReferral(user.id);
      setStep("wallet");
    } catch (error) {
      console.error("Error skipping referral:", error);
      setStep("wallet"); // Fallback
    } finally {
      setIsReferralSubmitting(false);
    }
  }

  const handlePasteFromClipboard = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text) {
        setReferralCode(text);
      }
    } catch (err) {
      toast.error("Failed to read from clipboard");
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange} modal={step !== "wallet"}>
      <DialogContent
        onPointerDownOutside={(e) => {
          const target = e.target as HTMLElement;
          if (target.closest('.wallet-adapter-modal') || target.closest('.wallet-adapter-modal-wrapper')) {
            return;
          }
          e.preventDefault();
        }}
        onEscapeKeyDown={(e) => {
          if (step === "wallet") return;
          e.preventDefault();
        }}
        className="sm:max-w-lg border-[#2a2a2a] bg-[#0f0f0f] p-0 gap-0 overflow-hidden"
      >
        <div className="relative">
          {/* Back Button */}
          {step !== "method" && (
            <button
              onClick={() => {
                if (step === "profile") setStep("otp");
                else if (step === "referral") setStep("profile");
                else if (step === "wallet") setStep(profileData.username ? "referral" : "otp");
                else setStep("method");
              }}
              className="absolute left-4 top-4 z-10 p-2 rounded-full bg-black/50 text-white/70 hover:text-white hover:bg-black/70 transition-all"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
          )}

          <div className="p-6">
            {/* Header */}
            <div className="text-center mb-6">
              <DialogTitle className="text-2xl font-bold text-white">
                {step === "profile" ? "Complete Your Profile" :
                  step === "referral" ? "Enter referral code" :
                    step === "wallet" ? "Connect Wallet" : "Join MoonPad"}
              </DialogTitle>
              <DialogDescription className="text-[#a0a0a0] mt-1">
                {step === "profile" ? "Customize how you appear to others" :
                  step === "referral" ? (
                    <>Get a <span className="text-[#4ade80] font-semibold">0.5%</span> of every trade your referrals make.</>
                  ) :
                    step === "otp" ? "Verify your identity" :
                      step === "wallet" ? "Connect your wallet to start trading" : "Get early access to hot launches"}
              </DialogDescription>
            </div>

            {step === "profile" ? (
              <div className="flex flex-col gap-6">
                {/* Profile Images Section */}
                <div className="relative mb-12">
                  {/* Avatar Background Placeholder */}
                  <div className="relative h-32 w-full rounded-xl bg-gradient-to-r from-[#1a1a1a] to-[#2a2a2a] border border-[#2a2a2a] overflow-hidden" />


                  {/* Profile Picture (Overlapping) */}
                  <div className="absolute -bottom-10 left-6">
                    <div className="relative h-24 w-24 rounded-full border-4 border-[#0f0f0f] bg-[#2a2a2a] overflow-hidden group shadow-xl">
                      {profileData.profile_image_url ? (
                        <>
                          <img
                            src={profileData.profile_image_url}
                            alt="Profile"
                            className="w-full h-full object-cover"
                            crossOrigin="anonymous"
                          />
                          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                            <button
                              onClick={() => fileInputRef.current?.click()}
                              className="p-1.5 rounded-full bg-white/20 hover:bg-white/30 backdrop-blur-md"
                            >
                              <Camera className="h-4 w-4 text-white" />
                            </button>
                          </div>
                        </>
                      ) : (
                        <button
                          onClick={() => fileInputRef.current?.click()}
                          disabled={isUploading.profile}
                          className="w-full h-full flex flex-col items-center justify-center text-[#6a6a6a] hover:text-[#4ade80] transition-colors"
                        >
                          {isUploading.profile ? <Loader2 className="h-5 w-5 animate-spin" /> : (
                            <>
                              <Camera className="h-6 w-6 mb-0.5" />
                              <span className="text-[10px]">Add Photo</span>
                            </>
                          )}
                        </button>
                      )}
                      <input
                        type="file"
                        ref={fileInputRef}
                        className="hidden"
                        accept="image/*"
                        onChange={(e) => handleImageUpload(e, 'profile')}
                      />
                    </div>
                  </div>
                </div>

                {/* Form Fields */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-[#a0a0a0] uppercase tracking-wider">Username *</label>
                    <Input
                      placeholder="cool_trader"
                      value={profileData.username}
                      onChange={(e) => setProfileData({ ...profileData, username: e.target.value })}
                      className="bg-[#1a1a1a] border-[#2a2a2a] text-white focus-visible:ring-[#4ade80] h-11"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-[#a0a0a0] uppercase tracking-wider">Full Name</label>
                    <Input
                      placeholder="John Doe"
                      value={profileData.fullname}
                      onChange={(e) => setProfileData({ ...profileData, fullname: e.target.value })}
                      className="bg-[#1a1a1a] border-[#2a2a2a] text-white focus-visible:ring-[#4ade80] h-11"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-[#a0a0a0] uppercase tracking-wider">Bio</label>
                  <Textarea
                    placeholder="Tell us about yourself..."
                    value={profileData.bio}
                    onChange={(e) => setProfileData({ ...profileData, bio: e.target.value })}
                    className="bg-[#1a1a1a] border-[#2a2a2a] text-white focus-visible:ring-[#4ade80] min-h-[80px] resize-none"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-[#a0a0a0] uppercase tracking-wider">Website</label>
                  <div className="relative">
                    <Globe className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#6a6a6a]" />
                    <Input
                      placeholder="https://yourwebsite.com"
                      value={profileData.website}
                      onChange={(e) => setProfileData({ ...profileData, website: e.target.value })}
                      className="bg-[#1a1a1a] border-[#2a2a2a] text-white focus-visible:ring-[#4ade80] h-11 pl-10"
                    />
                  </div>
                </div>

                <Button
                  onClick={handleProfileSubmit}
                  disabled={!profileData.username || isLoading}
                  className="w-full mt-2 bg-[#4ade80] text-black hover:bg-[#4ade80]/90 h-12 font-bold text-lg shadow-[0_0_20px_rgba(74,222,128,0.2)]"
                >
                  {isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : "Complete Profile"}
                </Button>
              </div>
            ) : step === "referral" ? (
              <div className="flex flex-col gap-6 py-4">
                <div className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-[#a0a0a0] uppercase tracking-wider">Referral Code</label>
                    <Input
                      placeholder="Enter code"
                      value={referralCode}
                      onChange={(e) => setReferralCode(e.target.value)}
                      className="bg-[#1a1a1a] border-[#2a2a2a] text-white focus-visible:ring-[#4ade80] h-11"
                    />
                  </div>

                  <div className="text-center">
                    <button
                      onClick={handleReferralSkip}
                      className="text-sm text-[#a0a0a0] hover:text-white transition-colors"
                    >
                      I don&apos;t have a code
                    </button>
                  </div>
                </div>

                <div className="mt-8">
                  {referralCode ? (
                    <Button
                      onClick={handleReferralSubmit}
                      disabled={isReferralSubmitting}
                      className="w-full h-12 bg-[#4ade80] text-black hover:bg-[#4ade80]/90 font-bold text-lg rounded-xl shadow-[0_0_20px_rgba(74,222,128,0.2)]"
                    >
                      {isReferralSubmitting ? <Loader2 className="h-5 w-5 animate-spin" /> : "Continue"}
                    </Button>
                  ) : (
                    <Button
                      onClick={handlePasteFromClipboard}
                      className="w-full h-12 bg-[#1a1a1a] border border-[#2a2a2a] text-[#a0a0a0] hover:bg-[#2a2a2a] font-bold text-lg rounded-xl"
                    >
                      Paste from clipboard
                    </Button>
                  )}
                </div>
              </div>
            ) : step === "wallet" ? (
              <div className="flex flex-col items-center gap-6 py-8">
                <div className="w-20 h-20 bg-[#4ade80]/10 rounded-full flex items-center justify-center border border-[#4ade80]/20 shadow-[0_0_30px_rgba(74,222,128,0.1)]">
                  <Wallet className="w-10 h-10 text-[#4ade80]" />
                </div>
                <p className="text-[#a0a0a0] text-center max-w-[280px]">
                  Connect your Solana wallet to complete your account setup and start interacting with MoonPad.
                </p>
                <Button
                  onClick={() => setVisible(true)}
                  disabled={isCreatingWallet}
                  className="w-full h-14 bg-[#4ade80] text-black hover:bg-[#4ade80]/90 font-bold text-lg rounded-xl shadow-lg"
                >
                  {isCreatingWallet ? (
                    <div className="flex items-center gap-2">
                      <Loader2 className="h-5 w-5 animate-spin" />
                      <span>Syncing...</span>
                    </div>
                  ) : "Connect Wallet"}
                </Button>
              </div>
            ) : (
              <>
                {/* Auth Method Toggle */}
                <div className="flex rounded-full bg-[#1a1a1a] p-1 mb-6 border border-[#2a2a2a]">
                  <button
                    onClick={() => setAuthMethod("email")}
                    className={cn(
                      "flex-1 rounded-full py-2.5 text-sm font-semibold transition-all",
                      authMethod === "email"
                        ? "bg-[#4ade80] text-black shadow-lg"
                        : "text-[#a0a0a0] hover:text-white"
                    )}
                  >
                    Email
                  </button>
                  <button
                    onClick={() => setAuthMethod("phone")}
                    className={cn(
                      "flex-1 rounded-full py-2.5 text-sm font-semibold transition-all",
                      authMethod === "phone"
                        ? "bg-[#4ade80] text-black shadow-lg"
                        : "text-[#a0a0a0] hover:text-white"
                    )}
                  >
                    Phone
                  </button>
                </div>

                {/* Input Field */}
                <div className="mb-4">
                  <Input
                    type={authMethod === "email" ? "email" : "tel"}
                    placeholder={authMethod === "email" ? "you@email.com" : "+1 (555) 000-0000"}
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    className="h-14 bg-[#1a1a1a] border-[#2a2a2a] text-white text-lg placeholder:text-[#6a6a6a] focus-visible:ring-[#4ade80] focus-visible:border-[#4ade80] rounded-xl"
                  />
                </div>

                {/* Alert Message */}
                <div className="flex items-center gap-2 text-[#a0a0a0] text-sm mb-6 bg-[#1a1a1a]/50 p-3 rounded-lg border border-[#2a2a2a]">
                  <Star className="h-4 w-4 fill-current text-[#4ade80]" />
                  <span>Get early access to hot launches and watch alerts</span>
                </div>

                {/* Send Code Button */}
                {step === "method" && (
                  <Button
                    onClick={handleSendCode}
                    disabled={!inputValue || isLoading}
                    className="w-full h-12 text-base font-bold rounded-xl bg-white text-black hover:bg-white/90 disabled:bg-white/50 transition-all"
                  >
                    {isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : "Send Code"}
                  </Button>
                )}

                {/* OTP Section */}
                {step === "otp" && (
                  <div className="mt-6 pt-6 border-t border-[#2a2a2a] animate-in fade-in slide-in-from-bottom-4 duration-300">
                    <p className="text-sm text-[#a0a0a0] mb-4 text-center">
                      We sent a code to <span className="text-white font-medium">{inputValue}</span>
                    </p>

                    <div className="flex gap-2 justify-center mb-6">
                      {otp.map((digit, index) => (
                        <input
                          key={index}
                          ref={(el) => { otpRefs.current[index] = el }}
                          type="text"
                          inputMode="numeric"
                          maxLength={1}
                          value={digit}
                          disabled={isLoading}
                          onChange={(e) => handleOtpChange(index, e.target.value)}
                          onKeyDown={(e) => handleOtpKeyDown(index, e)}
                          className={cn(
                            "w-12 h-14 text-center text-2xl font-bold rounded-xl bg-[#1a1a1a] border-2 text-white outline-none transition-all",
                            digit ? "border-[#4ade80] bg-[#1a1a1a]" : "border-[#2a2a2a] focus:border-[#4ade80]",
                            isLoading && "opacity-50 cursor-not-allowed"
                          )}
                        />
                      ))}
                    </div>

                    <div className="flex flex-col items-center gap-4">
                      {isLoading && <Loader2 className="h-6 w-6 animate-spin text-[#4ade80]" />}

                      <button
                        onClick={handleSendCode}
                        className="text-sm text-[#4ade80] hover:underline font-medium"
                      >
                        Resend Code
                      </button>

                      {/* Privacy Footer */}
                      <div className="flex items-center justify-center gap-2 text-[#6a6a6a] text-xs">
                        <Lock className="h-3 w-3" />
                        <span>Encrypted and secure authentication</span>
                      </div>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>

  )
}
