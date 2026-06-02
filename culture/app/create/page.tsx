"use client"

import { useState, useRef } from "react"
import Image from "next/image"
import { Header } from "@/components/header"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"

import { ChevronDown, ImageIcon, FileText, MonitorPlay } from "lucide-react"
import { cn } from "@/lib/utils"
import { toast } from "sonner"
import { useSolanaWallet } from "@/hooks/useSolanaWallet"
import { useAuthStore } from "@/store/authStore"
import { useWalletModal } from "@solana/wallet-adapter-react-ui"
import { tokenService } from "@/services/token/tokenService"
import { SignUpModal } from "@/components/sign-up-modal"
import { useEffect, useCallback } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import axios from "axios"
import { Transaction, Connection } from "@solana/web3.js"
import { Loader2, X } from "lucide-react"

export default function CreateTokenPage() {
  const [name, setName] = useState("")
  const [ticker, setTicker] = useState("")
  const [description, setDescription] = useState("")
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [videoPreview, setVideoPreview] = useState<string | null>(null)
  const [showSocialLinks, setShowSocialLinks] = useState(false)

  const [twitter, setTwitter] = useState("")
  const [telegram, setTelegram] = useState("")
  const [tiktok, setTiktok] = useState("")
  const [youtube, setYoutube] = useState("")
  const [website, setWebsite] = useState("")
  const [ownershipAmount, setOwnershipAmount] = useState("")
  const [launchType, setLaunchType] = useState("founder")
  const [showVerification, setShowVerification] = useState(false)
  const [twitterVerified, setTwitterVerified] = useState(false)
  const [tiktokVerified, setTiktokVerified] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const videoInputRef = useRef<HTMLInputElement>(null)

  const [loading, setLoading] = useState(false)
  const { publicKey, connected, signTransaction, signAllTransactions } = useSolanaWallet()
  const { user, isAuthenticated } = useAuthStore()
  const { setVisible } = useWalletModal()
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [selectedVideo, setSelectedVideo] = useState<File | null>(null)
  const [showSignUpModal, setShowSignUpModal] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [mounted, setMounted] = useState(false)
  const [verifyingPlatform, setVerifyingPlatform] = useState<string | null>(null)

  const [isUploadingImage, setIsUploadingImage] = useState(false)
  const [isUploadingVideo, setIsUploadingVideo] = useState(false)
  const [imageIpfsUrl, setImageIpfsUrl] = useState("")
  const [videoUrl, setVideoUrl] = useState("")
  const [uploadedR2Key, setUploadedR2Key] = useState("")

  const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://192.168.1.148:8080/api"

  // Check for existing verifications on load
  useEffect(() => {
    if (isAuthenticated && user?.id) {
      axios.get(`${API_BASE_URL}/auth/social/verifications/${user.id}`)
        .then(res => {
          if (res.data.success) {
            res.data.data.forEach((v: any) => {
              if (v.platform === 'twitter') {
                setTwitterVerified(true)
                if (!twitter) setTwitter(`https://x.com/${v.handle}`)
              }
              if (v.platform === 'tiktok') {
                setTiktokVerified(true)
                if (!tiktok) setTiktok(`https://tiktok.com/@${v.handle}`)
              }
            });
          }
        })
        .catch(console.error);
    }
  }, [isAuthenticated, user?.id, API_BASE_URL]);

  // Listen for verification messages from popup
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      const { type, platform, handle, error } = event.data;

      if (type === 'social_verify_success') {
        toast.success(`Successfully verified ${platform} account: @${handle}`);
        if (platform === 'twitter') {
          setTwitterVerified(true);
          setTwitter(`https://x.com/${handle}`);
        } else if (platform === 'tiktok') {
          setTiktokVerified(true);
          setTiktok(`https://tiktok.com/@${handle}`);
        }
        setVerifyingPlatform(null);
      } else if (type === 'social_verify_error') {
        toast.error(`Failed to verify ${platform}: ${error}`);
        setVerifyingPlatform(null);
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  const handleTwitterVerify = () => {
    if (!isAuthenticated || !user) {
      setShowSignUpModal(true);
      return;
    }

    if (!twitter.trim()) {
      toast.error("Please enter the Twitter URL first")
      setErrors(prev => ({ ...prev, twitter: "Twitter URL is required for verification" }))
      return
    }

    const width = 600;
    const height = 600;
    const left = window.screenX + (window.outerWidth - width) / 2;
    const top = window.screenY + (window.outerHeight - height) / 2;

    setVerifyingPlatform('twitter');
    window.open(
      `${API_BASE_URL}/auth/social/twitter?userId=${user.id}`,
      'Verify Twitter',
      `width=${width},height=${height},left=${left},top=${top}`
    );
  };

  const handleTiktokVerify = () => {
    if (!isAuthenticated || !user) {
      setShowSignUpModal(true);
      return;
    }

    if (!tiktok.trim()) {
      toast.error("Please enter the TikTok URL first")
      setErrors(prev => ({ ...prev, tiktok: "TikTok URL is required for verification" }))
      return
    }

    const width = 600;
    const height = 600;
    const left = window.screenX + (window.outerWidth - width) / 2;
    const top = window.screenY + (window.outerHeight - height) / 2;

    setVerifyingPlatform('tiktok');
    window.open(
      `${API_BASE_URL}/auth/social/tiktok?userId=${user.id}`,
      'Verify TikTok',
      `width=${width},height=${height},left=${left},top=${top}`
    );
  };

  useEffect(() => {
    setMounted(true)
  }, [])

  const ownershipPresets = [
    { percent: "1%", amount: 27 },
    { percent: "10%", amount: 286 },
    { percent: "30%", amount: 1038 },
    { percent: "50%", amount: 2191 },
    { percent: "80%", amount: 6537 },
  ]

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      // 1. Size check (15MB)
      if (file.size > 15 * 1024 * 1024) {
        toast.error("Image size exceeds 15MB limit")
        return
      }

      // 2. Type check
      const allowedTypes = ["image/jpeg", "image/png", "image/gif"]
      if (!allowedTypes.includes(file.type)) {
        toast.error("Only JPG, PNG, and GIF images are allowed")
        return
      }

      // 3. Dimension check (min 1000x1000)
      const img = new window.Image()
      img.src = URL.createObjectURL(file)
      img.onload = async () => {
        if (img.width < 1000 || img.height < 1000) {
          toast.warning("Image resolution is below 1000x1000px recommendation")
        }
        if (img.width !== img.height) {
          toast.warning("1:1 aspect ratio is recommended")
        }

        setSelectedFile(file)
        setImagePreview(img.src)

        // Immediate upload to Pinata
        setIsUploadingImage(true)
        try {
          const res = await tokenService.uploadImageOnly(file)
          if (res.success) {
            console.log("Image upload response:", res)
            console.log("IPFS image URL:", res.metadataUri)
            setImageIpfsUrl(res.metadataUri) // metadataUri contains the image CID/URL in this backend response
            toast.success("Image uploaded to IPFS")
          } else {
            throw new Error(res.error)
          }
        } catch (err: any) {
          console.error("Image upload failed:", err)
          toast.error("Failed to upload image to IPFS")
        } finally {
          setIsUploadingImage(false)
        }
      }
    }
  }

  const handleVideoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const isVideo = file.type.startsWith("video/")

      if (!isVideo) {
        toast.error("Please select a video, not an image")
        if (videoInputRef.current) videoInputRef.current.value = ""
        return
      }

      if (file.size > 30 * 1024 * 1024) {
        toast.error("Video size exceeds 30MB limit")
        if (videoInputRef.current) videoInputRef.current.value = ""
        return
      }

      setSelectedVideo(file)
      const url = URL.createObjectURL(file)
      setVideoPreview(url)

      // Immediate upload to R2
      setIsUploadingVideo(true)
      try {
        const res = await tokenService.uploadVideo(file)
        console.log("Video upload res: ", res)
        setVideoUrl(res.publicUrl)
        setUploadedR2Key(res.fileId)
        toast.success("Video uploaded successfully")
      } catch (err: any) {
        console.error("Video upload failed:", err)
        toast.error("Failed to upload video")
      } finally {
        setIsUploadingVideo(false)
      }

      // Clear video error if exists
      if (errors.video) {
        setErrors(prev => {
          const next = { ...prev }
          delete next.video
          return next
        })
      }
    }
  }

  const handleDeleteVideo = (e: React.MouseEvent) => {
    e.stopPropagation()
    setSelectedVideo(null)
    setVideoPreview(null)
    if (videoInputRef.current) videoInputRef.current.value = ""
  }

  const handleCreateToken = async () => {
    if (!isAuthenticated || !user) {
      console.log("Creation blocked: Auth state:", { isAuthenticated, user })
      setShowSignUpModal(true)
      return
    }

    if (!connected || !publicKey) {
      setVisible(true)
      return
    }

    const newErrors: Record<string, string> = {}
    if (!name.trim()) newErrors.name = "Name is required"
    if (!ticker.trim()) newErrors.ticker = "Ticker is required"
    if (!description.trim()) newErrors.description = "Description is required"
    if (!selectedFile) {
      newErrors.image = "Image is required"
    } else {
      // Re-validate primary image
      if (selectedFile.size > 15 * 1024 * 1024) newErrors.image = "Image exceeds 15MB limit"
      const allowedImageTypes = ["image/jpeg", "image/png", "image/gif"]
      if (!allowedImageTypes.includes(selectedFile.type)) newErrors.image = "Invalid image type"
    }

    if (selectedVideo) {
      const isVideo = selectedVideo.type.startsWith("video/")
      if (isVideo) {
        if (selectedVideo.size > 30 * 1024 * 1024) newErrors.video = "Video exceeds 30MB limit"
        if (selectedVideo.type !== "video/mp4") {
          // We can be strict or loose, guideline says .mp4 recommended
        }
      } else {
        if (selectedVideo.size > 15 * 1024 * 1024) newErrors.video = "File exceeds 15MB limit"
        const allowedTypes = ["image/jpeg", "image/png", "image/gif"]
        if (!allowedTypes.includes(selectedVideo.type)) newErrors.video = "Invalid file type"
      }
    }

    // Optional URL validations
    const urlPattern = /^(https?:\/\/)?([\da-z.-]+)\.([a-z.]{2,6})([/\w .-]*)*\/?$/
    if (twitter && !urlPattern.test(twitter)) newErrors.twitter = "Invalid Twitter URL"
    if (telegram && !urlPattern.test(telegram)) newErrors.telegram = "Invalid Telegram URL"
    if (tiktok && !urlPattern.test(tiktok)) newErrors.tiktok = "Invalid TikTok URL"
    if (youtube && !urlPattern.test(youtube)) newErrors.youtube = "Invalid YouTube URL"
    if (website && !urlPattern.test(website)) newErrors.website = "Invalid Website URL"

    if (ownershipAmount && (isNaN(parseFloat(ownershipAmount)) || parseFloat(ownershipAmount) < 0)) {
      newErrors.ownershipAmount = "Invalid amount"
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      toast.error("Please fix the errors in the form")
      return
    }

    setErrors({})

    setLoading(true)
    const toastId = toast.loading("Preparing token launch...")

    try {
      // 1. Finalize Metadata (JSON) upload to IPFS
      toast.loading("Uploading final metadata...", { id: toastId })
      const metadataRes = await tokenService.uploadMetadata({
        tokenName: name,
        tokenSymbol: ticker,
        description,
        imageUrl: imageIpfsUrl,
        twitter,
        telegram,
        website,
        tiktok,
        youtube
      })

      if (!metadataRes.success) throw new Error(metadataRes.error)
      const metadataUri = metadataRes.metadataUri
      console.log("Final metadata URI:", metadataUri)
      console.log("Current imageIpfsUrl in state:", imageIpfsUrl)

      // 2. Get Transactions from Backend
      toast.loading("Generating transaction...", { id: toastId })

      const FIXED_CONFIG_ADDRESS = "CWhsM4Cma3UZpooVZXotEsJEbt9cyeNuvMAufFdwikit"

      // Create Pool (or Pool and Buy)
      const poolParams = {
        config: FIXED_CONFIG_ADDRESS,
        payer: publicKey.toBase58(),
        poolCreator: publicKey.toBase58(),
        name: name,
        symbol: ticker,
        uri: metadataUri,
        buyAmount: parseFloat(ownershipAmount) || 0,
        launchMode: launchType
      }

      const poolRes = parseFloat(ownershipAmount) > 0
        ? await tokenService.createPoolAndBuy(poolParams)
        : await tokenService.createPool(poolParams)

      if (!poolRes.success) throw new Error(poolRes.error)

      // 3. Sign Transaction
      toast.loading("Please sign the transaction in your wallet...", { id: toastId })

      const connection = new Connection("https://api.devnet.solana.com", "confirmed")
      const tx = Transaction.from(Buffer.from(poolRes.transaction, 'base64'))

      if (!signTransaction) throw new Error("Wallet does not support transaction signing")

      const signedTx = await signTransaction(tx)
      console.log("sighned tx: ", signedTx)

      // 4. Send and Confirm
      toast.loading("Sending transaction to network...", { id: toastId })

      const txId = await connection.sendRawTransaction(signedTx.serialize())
      console.log("tx id: ", txId)
      await connection.confirmTransaction(txId)

      // 5. Finalize in Database
      toast.loading("Finalizing launch...", { id: toastId })
      const finalizeRes = await tokenService.finalizeToken({
        mintAddress: poolRes.baseMintAddress,
        name,
        symbol: ticker,
        description,
        imageUrl: imageIpfsUrl || undefined,
        website,
        twitter,
        telegram,
        tiktok: tiktok,
        youtube: youtube,
        twitterVerified,
        tiktokVerified,
        creatorId: user.id,
        txHash: txId,
        poolAddress: poolRes.poolAddress,
        configAddress: FIXED_CONFIG_ADDRESS,
        r2Key: uploadedR2Key,
        videoUrl: videoUrl,
        buyAmount: parseFloat(ownershipAmount) || 0,
        tokensReceived: poolRes.tokensReceived || 0,
        price: poolRes.price || 0
      })

      if (finalizeRes.success) {
        // 6. Record Initial Swap if ownership was set
        // This ensures the trade history, charts, and PnL are correctly initialized
        if (parseFloat(ownershipAmount) > 0) {
          toast.loading("Recording initial purchase...", { id: toastId })
          try {
            await tokenService.recordSwap({
              userId: user.id,
              coinId: poolRes.baseMintAddress, // mintAddress is the coinId
              type: 'buy',
              price: poolRes.price || 0,
              inputAmount: parseFloat(ownershipAmount),
              outputAmount: poolRes.tokensReceived || 0,
              txHash: txId,
              usdValue: parseFloat(ownershipAmount), // Assuming 1:1 for simplicity or backend handles conversion
              poolAddress: poolRes.poolAddress,
              creatorId: user.id
            });
          } catch (swapErr) {
            console.error("Initial swap recording failed:", swapErr);
            // We don't throw here to avoid failing the whole process since token is already created and finalized
          }
        }

        // 7. Finalize the video entry if video exists
        if (uploadedR2Key) {
          try {
            await tokenService.finalizeVideo({
              tokenMint: poolRes.baseMintAddress,
              r2Key: uploadedR2Key,
              title: name,
              description: description,
              userId: user.id,
              thumbnailUrl: imageIpfsUrl
            });
          } catch (vidErr) {
            console.error("Secondary video finalize failed:", vidErr);
          }
        }

        toast.success("Token launched successfully!", { id: toastId })
        window.location.href = `/token/${poolRes.baseMintAddress}`
      } else {
        throw new Error(finalizeRes.error)
      }

    } catch (error: any) {
      console.error("Token creation error:", error)
      toast.error(error.message || "Failed to create token", { id: toastId })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#0f0f0f]">
      <Header />

      <main className="container relative mx-auto max-w-2xl px-4 py-8">
        {!isAuthenticated && mounted && (
          <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/20 backdrop-blur-[4px] pt-[40vh]">
            <div className="text-center">
              <Button
                onClick={() => setShowSignUpModal(true)}
                className="h-14 rounded-full bg-[#4ade80] px-12 text-lg font-bold text-black shadow-[0_0_50px_-12px_rgba(74,222,128,0.5)] hover:bg-[#3fcc70] transition-all hover:scale-105 active:scale-95"
              >
                Sign In to Create Token
              </Button>
              <p className="mt-4 text-sm font-medium text-white/60">Please sign in to access the launchpad</p>
            </div>
          </div>
        )}

        <div className={cn(
          "transition-all duration-300",
          !isAuthenticated && mounted && "blur-md pointer-events-none select-none"
        )}>
          <h1 className="mb-6 text-2xl font-bold text-white">Launch Your Token</h1>

          {/* Project Info Section */}
          <div className="rounded-2xl bg-[#1a1a1a] p-6">
            <h2 className="mb-6 text-sm font-semibold tracking-wider text-white">
              PROJECT INFO
            </h2>

            <div className="flex gap-4">
              {/* Image Upload */}
              <div className="flex flex-col gap-2">
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className={cn(
                    "flex h-[132px] w-[132px] shrink-0 cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-[#3a3a3a] bg-transparent transition-colors hover:border-[#9a8a70]",
                    errors.image && "border-red-500/50"
                  )}
                >
                  {imagePreview ? (
                    <div className="relative h-full w-full overflow-hidden rounded-lg">
                      <Image
                        src={imagePreview}
                        alt="Token preview"
                        fill
                        className="object-cover"
                      />
                    </div>
                  ) : (
                    <>
                      <ImageIcon className="mb-2 h-10 w-10 text-[#4a4a4a]" strokeWidth={1} />
                      <span className="text-xs font-medium tracking-wide text-[#5a5a5a]">UPLOAD IMAGE</span>
                    </>
                  )}
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                  />
                </div>
                {errors.image && <p className="text-[10px] font-medium text-red-500/80">{errors.image}</p>}
              </div>

              {/* Name and Ticker */}
              <div className="flex flex-1 flex-col gap-3">
                <div className="space-y-1">
                  <Input
                    placeholder="Name"
                    value={name}
                    onChange={(e) => {
                      setName(e.target.value)
                      if (errors.name) setErrors(prev => {
                        const next = { ...prev };
                        delete next.name;
                        return next;
                      })
                    }}
                    className={cn(
                      "h-14 rounded-2xl border-0 bg-[#2a2a2a] text-white placeholder:text-[#6a6a6a] focus-visible:ring-1 focus-visible:ring-[#9a8a70]",
                      errors.name && "ring-1 ring-red-500/50"
                    )}
                  />
                  {errors.name && <p className="ml-1 text-[10px] font-medium text-red-500/80">{errors.name}</p>}
                </div>
                <div className="space-y-1">
                  <Input
                    placeholder="Ticker"
                    value={ticker}
                    onChange={(e) => {
                      setTicker(e.target.value.toUpperCase())
                      if (errors.ticker) setErrors(prev => {
                        const next = { ...prev };
                        delete next.ticker;
                        return next;
                      })
                    }}
                    className={cn(
                      "h-14 rounded-2xl border-0 bg-[#2a2a2a] text-white placeholder:text-[#6a6a6a] focus-visible:ring-1 focus-visible:ring-[#9a8a70]",
                      errors.ticker && "ring-1 ring-red-500/50"
                    )}
                  />
                  {errors.ticker && <p className="ml-1 text-[10px] font-medium text-red-500/80">{errors.ticker}</p>}
                </div>
              </div>
            </div>

            <div className="mt-4 space-y-1">
              <Textarea
                placeholder="Description"
                value={description}
                onChange={(e) => {
                  setDescription(e.target.value)
                  if (errors.description) setErrors(prev => {
                    const next = { ...prev };
                    delete next.description;
                    return next;
                  })
                }}
                className={cn(
                  "min-h-[120px] resize-y rounded-2xl border-0 bg-[#2a2a2a] text-white placeholder:text-[#6a6a6a] focus-visible:ring-1 focus-visible:ring-[#9a8a70]",
                  errors.description && "ring-1 ring-red-500/50"
                )}
              />
              {errors.description && <p className="ml-1 text-[10px] font-medium text-red-500/80">{errors.description}</p>}
            </div>

            {/* Social Links Accordion */}
            <button
              onClick={() => setShowSocialLinks(!showSocialLinks)}
              className="mt-5 flex w-full items-center gap-2 text-sm font-semibold tracking-wider text-white"
            >
              SOCIAL LINKS (OPTIONAL)
              <ChevronDown className={cn(
                "h-4 w-4 transition-transform",
                showSocialLinks && "rotate-180"
              )} />
            </button>

            {showSocialLinks && (
              <div className="mt-4 space-y-3">
                <div className="space-y-1">
                  <Input
                    placeholder="Twitter URL"
                    value={twitter}
                    readOnly={twitterVerified}
                    onChange={(e) => {
                      if (twitterVerified) return;
                      setTwitter(e.target.value)
                      if (errors.twitter) setErrors(prev => {
                        const next = { ...prev };
                        delete next.twitter;
                        return next;
                      })
                    }}
                    className={cn(
                      "h-12 rounded-2xl border-0 bg-[#2a2a2a] text-white placeholder:text-[#6a6a6a] focus-visible:ring-1 focus-visible:ring-[#9a8a70]",
                      errors.twitter && "ring-1 ring-red-500/50"
                    )}
                  />
                  {errors.twitter && <p className="ml-1 text-[10px] font-medium text-red-500/80">{errors.twitter}</p>}
                </div>
                <div className="space-y-1">
                  <Input
                    placeholder="Telegram URL"
                    value={telegram}
                    onChange={(e) => setTelegram(e.target.value)}
                    className={cn(
                      "h-12 rounded-2xl border-0 bg-[#2a2a2a] text-white placeholder:text-[#6a6a6a] focus-visible:ring-1 focus-visible:ring-[#9a8a70]",
                      errors.telegram && "ring-1 ring-red-500/50"
                    )}
                  />
                  {errors.telegram && <p className="ml-1 text-[10px] font-medium text-red-500/80">{errors.telegram}</p>}
                </div>
                <div className="space-y-1">
                  <Input
                    placeholder="TikTok URL"
                    value={tiktok}
                    readOnly={tiktokVerified}
                    onChange={(e) => {
                      if (tiktokVerified) return;
                      setTiktok(e.target.value)
                      if (errors.tiktok) setErrors(prev => {
                        const next = { ...prev };
                        delete next.tiktok;
                        return next;
                      })
                    }}
                    className={cn(
                      "h-12 rounded-2xl border-0 bg-[#2a2a2a] text-white placeholder:text-[#6a6a6a] focus-visible:ring-1 focus-visible:ring-[#9a8a70]",
                      errors.tiktok && "ring-1 ring-red-500/50"
                    )}
                  />
                  {errors.tiktok && <p className="ml-1 text-[10px] font-medium text-red-500/80">{errors.tiktok}</p>}
                </div>
                <div className="space-y-1">
                  <Input
                    placeholder="YouTube URL"
                    value={youtube}
                    onChange={(e) => setYoutube(e.target.value)}
                    className={cn(
                      "h-12 rounded-2xl border-0 bg-[#2a2a2a] text-white placeholder:text-[#6a6a6a] focus-visible:ring-1 focus-visible:ring-[#9a8a70]",
                      errors.youtube && "ring-1 ring-red-500/50"
                    )}
                  />
                  {errors.youtube && <p className="ml-1 text-[10px] font-medium text-red-500/80">{errors.youtube}</p>}
                </div>
                <div className="space-y-1">
                  <Input
                    placeholder="Website URL"
                    value={website}
                    onChange={(e) => setWebsite(e.target.value)}
                    className={cn(
                      "h-12 rounded-2xl border-0 bg-[#2a2a2a] text-white placeholder:text-[#6a6a6a] focus-visible:ring-1 focus-visible:ring-[#9a8a70]",
                      errors.website && "ring-1 ring-red-500/50"
                    )}
                  />
                  {errors.website && <p className="ml-1 text-[10px] font-medium text-red-500/80">{errors.website}</p>}
                </div>
              </div>
            )}

            {/* Verification Section */}
            <button
              onClick={() => setShowVerification(!showVerification)}
              className="mt-5 flex w-full items-center gap-2 text-sm font-semibold tracking-wider text-white"
            >
              VERIFY (OPTIONAL)
              <ChevronDown className={cn(
                "h-4 w-4 transition-transform",
                showVerification && "rotate-180"
              )} />
            </button>

            {showVerification && (
              <div className="mt-4 space-y-3">
                {/* Twitter Verification */}
                <div className="flex items-center justify-between rounded-2xl bg-[#2a2a2a] px-4 py-3">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#1a1a1a]">
                      <svg className="h-5 w-5 text-white" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                      </svg>
                    </div>
                    <div>
                      <p className="font-medium text-white">Twitter / X</p>
                      <p className="text-xs text-[#6a6a6a]">Verify your Twitter account</p>
                    </div>
                  </div>
                  <button
                    onClick={handleTwitterVerify}
                    disabled={verifyingPlatform === 'twitter'}
                    className={cn(
                      "rounded-full px-4 py-1.5 text-sm font-medium transition-colors min-w-[100px]",
                      twitterVerified
                        ? "bg-[#4ade80] text-black"
                        : (verifyingPlatform === 'twitter' ? "bg-[#3a3a3a]/50 text-white/50 cursor-wait" : (!twitter.trim() ? "bg-[#3a3a3a]/50 text-white/50 cursor-not-allowed" : "bg-[#3a3a3a] text-white hover:bg-[#4a4a4a]"))
                    )}
                  >
                    {twitterVerified ? "Verified" : (verifyingPlatform === 'twitter' ? "Verifying..." : "Verify")}
                  </button>
                </div>

                {/* TikTok Verification */}
                <div className="flex items-center justify-between rounded-2xl bg-[#2a2a2a] px-4 py-3">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#1a1a1a]">
                      <svg className="h-5 w-5 text-white" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z" />
                      </svg>
                    </div>
                    <div>
                      <p className="font-medium text-white">TikTok</p>
                      <p className="text-xs text-[#6a6a6a]">Verify your TikTok account</p>
                    </div>
                  </div>
                  <button
                    onClick={handleTiktokVerify}
                    disabled={verifyingPlatform === 'tiktok'}
                    className={cn(
                      "rounded-full px-4 py-1.5 text-sm font-medium transition-colors min-w-[100px]",
                      tiktokVerified
                        ? "bg-[#4ade80] text-black"
                        : (verifyingPlatform === 'tiktok' ? "bg-[#3a3a3a]/50 text-white/50 cursor-wait" : (!tiktok.trim() ? "bg-[#3a3a3a]/50 text-white/50 cursor-not-allowed" : "bg-[#3a3a3a] text-white hover:bg-[#4a4a4a]"))
                    )}
                  >
                    {tiktokVerified ? "Verified" : (verifyingPlatform === 'tiktok' ? "Verifying..." : "Verify")}
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Video Upload Section */}
          <div className="mt-4 rounded-2xl bg-[#1a1a1a] p-6">
            {/* Upload Area */}
            <div
              onClick={() => videoInputRef.current?.click()}
              className="group relative flex min-h-[280px] cursor-pointer flex-col items-center justify-center overflow-hidden rounded-xl border-2 border-dashed border-[#3a3a3a] bg-transparent transition-colors hover:border-[#9a8a70]"
            >
              {videoPreview ? (
                <div className="absolute inset-0 h-full w-full">
                  <video
                    src={videoPreview}
                    className={cn(
                      "h-full w-full object-cover",
                      isUploadingVideo && "blur-sm brightness-50"
                    )}
                    autoPlay
                    loop
                    muted
                  />
                  {isUploadingVideo && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-black/40 text-white">
                      <Loader2 className="h-8 w-8 animate-spin" />
                      <span className="text-sm font-semibold tracking-wider uppercase">Uploading Video...</span>
                    </div>
                  )}
                  <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/20 opacity-0 transition-opacity group-hover:opacity-100">
                    <p className="text-sm font-medium text-white">Click to change</p>
                  </div>
                  <button
                    onClick={handleDeleteVideo}
                    className="absolute right-3 top-3 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-black/60 text-white transition-colors hover:bg-red-500/80"
                  >
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              ) : (
                <>
                  <div className="mb-4 rounded-lg border border-[#4a4a4a] p-3">
                    <MonitorPlay className="h-10 w-10 text-[#6a6a6a]" strokeWidth={1.5} />
                  </div>
                  <p className="text-lg font-medium text-white">Select video to upload</p>
                  <p className="mt-1 text-sm text-[#6a6a6a]">or drag and drop it here</p>
                </>
              )}
              <input
                ref={videoInputRef}
                type="file"
                accept="video/*"
                onChange={handleVideoUpload}
                className="hidden"
              />
            </div>
            {errors.video && <p className="mt-2 text-[10px] font-medium text-red-500/80">{errors.video}</p>}

            {/* File Info */}
            <div className="mt-6 grid grid-cols-2 gap-6">
              <div>
                <div className="mb-3 flex items-center gap-2">
                  <FileText className="h-5 w-5 text-[#6a6a6a]" strokeWidth={1.5} />
                </div>
                <h4 className="mb-2 font-semibold text-[#4ade80]">File size and type</h4>
                <ul className="space-y-1 text-sm text-[#8a8a8a]">
                  <li className="flex items-start gap-2">
                    <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-[#8a8a8a]" />
                    {"Image - max 15mb. '.jpg', '.gif' or '.png' recommended"}
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-[#8a8a8a]" />
                    {"Video - max 30mb. '.mp4' recommended"}
                  </li>
                </ul>
              </div>
              <div>
                <div className="mb-3 flex items-center gap-2">
                  <MonitorPlay className="h-5 w-5 text-[#6a6a6a]" strokeWidth={1.5} />
                </div>
                <h4 className="mb-2 font-semibold text-[#4ade80]">Resolution and aspect ratio</h4>
                <ul className="space-y-1 text-sm text-[#8a8a8a]">
                  <li className="flex items-start gap-2">
                    <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-[#8a8a8a]" />
                    {"Image - min. 1000x1000px, 1:1 square recommended"}
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-[#8a8a8a]" />
                    Video - 16:9 or 9:16, 1080p+ recommended
                  </li>
                </ul>
              </div>
            </div>
          </div>

          {/* Launch Mode Section */}
          <div className="mt-4 rounded-2xl bg-[#1a1a1a] p-6">
            <h2 className="text-sm font-semibold tracking-wider text-white">
              LAUNCH MODE
            </h2>

            <div className="mt-4 space-y-0 rounded-2xl border border-[#3a3a3a] overflow-hidden">
              {/* Founder Mode Option */}
              <button
                onClick={() => setLaunchType("founder")}
                className={cn(
                  "w-full flex items-center justify-between px-4 py-3 text-left transition-colors",
                  launchType === "founder" ? "bg-[#2a2a2a]" : "bg-[#1f1f1f] hover:bg-[#252525]"
                )}
              >
                <div>
                  <p className="font-semibold text-white">Founder Mode</p>
                  <p className="text-sm text-[#6a6a6a]">Earn 1% of total trading volume</p>
                </div>
                {launchType === "founder" && (
                  <div className="h-3 w-3 rounded-full bg-[#4ade80]" />
                )}
              </button>

              <div className="border-t border-[#3a3a3a]" />

              {/* Paper Hand Tax Mode Option */}
              <button
                onClick={() => setLaunchType("paperhand")}
                className={cn(
                  "w-full flex items-center justify-between px-4 py-3 text-left transition-colors",
                  launchType === "paperhand" ? "bg-[#2a2a2a]" : "bg-[#1f1f1f] hover:bg-[#252525]"
                )}
              >
                <div>
                  <p className="font-semibold text-white">Paper Hand Tax Mode</p>
                  <p className="text-sm text-[#6a6a6a]">10% tax with 50% added to LP</p>
                </div>
                {launchType === "paperhand" && (
                  <div className="h-3 w-3 rounded-full bg-[#4ade80]" />
                )}
              </button>
            </div>
          </div>

          {/* Ownership Section */}
          <div className="mt-4 rounded-2xl bg-[#1a1a1a] p-6">
            <h2 className="text-sm font-semibold tracking-wider text-white">
              OWNERSHIP
            </h2>
            <p className="mt-1 text-sm text-[#6a6a6a]">
              Buy shares before anyone else.
            </p>

            {/* Amount Input */}
            <div className="mt-4 space-y-1">
              <Input
                type="text"
                placeholder="$ 0.00"
                value={ownershipAmount ? `$ ${ownershipAmount}` : ""}
                onChange={(e) => {
                  const value = e.target.value.replace(/[^0-9.]/g, "")
                  setOwnershipAmount(value)
                  if (errors.ownershipAmount) setErrors(prev => {
                    const next = { ...prev };
                    delete next.ownershipAmount;
                    return next;
                  })
                }}
                className={cn(
                  "h-14 rounded-2xl border-0 bg-[#2a2a2a] text-xl font-medium text-white placeholder:text-[#6a6a6a] focus-visible:ring-1 focus-visible:ring-[#9a8a70]",
                  errors.ownershipAmount && "ring-1 ring-red-500/50"
                )}
              />
              {errors.ownershipAmount && <p className="ml-1 text-[10px] font-medium text-red-500/80">{errors.ownershipAmount}</p>}
              {ownershipAmount && parseFloat(ownershipAmount) > 0 && (
                <p className="mt-2 text-sm text-[#6a6a6a]">
                  {(() => {
                    const amount = parseFloat(ownershipAmount)
                    const preset = ownershipPresets.find(p => p.amount === amount)
                    if (preset) return `${preset.percent} ownership`
                    // Calculate percentage based on linear interpolation from presets
                    // Using the 1% = $27 ratio as base
                    const percentage = (amount / 27) * 1
                    if (percentage < 1) return `${percentage.toFixed(1)}% ownership`
                    if (percentage > 100) return `100% ownership`
                    return `${Math.round(percentage)}% ownership`
                  })()}
                </p>
              )}
            </div>

            {/* Preset Buttons */}
            <div className="mt-4 grid grid-cols-5 gap-2">
              {ownershipPresets.map((preset) => (
                <button
                  key={preset.percent}
                  onClick={() => setOwnershipAmount(preset.amount.toString())}
                  className="flex flex-col items-center rounded-xl bg-[#2a2a2a] py-3 transition-colors hover:bg-[#3a3a3a]"
                >
                  <span className="text-sm font-semibold text-[#8a8a8a]">{preset.percent}</span>
                  <span className="text-xs text-[#6a6a6a]">${preset.amount.toLocaleString()}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Create Button */}
          <Button
            className="mt-6 h-14 w-full rounded-2xl bg-[#4ade80] text-base font-semibold text-black hover:bg-[#3bce70]"
            disabled={!name || !ticker || loading}
            onClick={handleCreateToken}
          >
            {loading ? "Creating..." : "Create token"}
          </Button>

          <p className="mt-3 text-center text-sm text-[#6a6a6a]">
            Deployment cost: 0.02 SOL
          </p>
        </div>
      </main>

      {/* Sign Up Modal */}
      <SignUpModal
        open={showSignUpModal}
        onOpenChange={setShowSignUpModal}
      />
    </div>
  )
}
