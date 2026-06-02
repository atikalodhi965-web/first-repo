import Link from "next/link"

export function Footer() {
  return (
    <footer className="border-t border-[#2a2a2a] bg-[#0f0f0f]">
      <div className="container mx-auto flex flex-col items-center justify-between gap-6 px-4 py-6 lg:flex-row">
        {/* Copyright - Far Left */}
        <span className="text-sm text-[#6a6a6a] order-3 lg:order-1">
          ©2026 MoonPad Holdings, Inc.
        </span>

        {/* Center Section - Navigation & Social */}
        <div className="flex flex-col items-center gap-4 order-1 lg:order-2">
          {/* Navigation Links */}
          <nav className="flex flex-wrap items-center justify-center gap-6 text-sm text-[#8a8a8a]">
            <Link href="/privacy" className="hover:text-white transition-colors">
              Privacy Policy
            </Link>
            <Link href="/terms" className="hover:text-white transition-colors">
              Terms Of Service
            </Link>
            <Link href="/fees" className="hover:text-white transition-colors">
              Fees
            </Link>
            <Link href="/support" className="hover:text-white transition-colors">
              Support
            </Link>
            <Link href="/how-it-works" className="hover:text-white transition-colors">
              How It Works
            </Link>
          </nav>

          {/* Social Icons */}
          <div className="flex items-center gap-4">
            {/* X/Twitter */}
            <a href="#" className="text-[#8a8a8a] hover:text-white transition-colors">
              <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
              </svg>
            </a>
            {/* TikTok */}
            <a href="#" className="text-[#8a8a8a] hover:text-white transition-colors">
              <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
                <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z"/>
              </svg>
            </a>
            {/* Telegram */}
            <a href="#" className="text-[#8a8a8a] hover:text-white transition-colors">
              <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
                <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/>
              </svg>
            </a>
            {/* Instagram */}
            <a href="#" className="text-[#8a8a8a] hover:text-white transition-colors">
              <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
              </svg>
            </a>
            {/* YouTube */}
            <a href="#" className="text-[#8a8a8a] hover:text-white transition-colors">
              <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
                <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
              </svg>
            </a>
          </div>
        </div>

        {/* App Store Buttons - Far Right */}
        <div className="flex items-center gap-3 order-2 lg:order-3">
          {/* Apple App Store */}
          <div className="relative group">
            <a href="#" className="flex items-center gap-2 rounded-lg bg-black border border-[#3a3a3a] px-3 py-2 hover:bg-[#1a1a1a] transition-colors">
              <svg className="h-6 w-6 text-white" viewBox="0 0 24 24" fill="currentColor">
                <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/>
              </svg>
              <div className="flex flex-col">
                <span className="text-[10px] text-[#8a8a8a] leading-none">Download on the</span>
                <span className="text-sm font-semibold text-white leading-tight">App Store</span>
              </div>
            </a>
            {/* Coming Soon Tooltip */}
            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-1.5 bg-[#1a1a1a] border border-[#3a3a3a] rounded-lg text-white text-sm font-medium opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap">
              Coming Soon
              <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-[#3a3a3a]"></div>
            </div>
          </div>
          
          {/* Google Play Store */}
          <div className="relative group">
            <a href="#" className="flex items-center gap-2 rounded-lg bg-white border border-[#e0e0e0] px-3 py-2 hover:bg-[#f5f5f5] transition-colors">
              <svg className="h-6 w-6" viewBox="0 0 24 24">
                <path fill="#EA4335" d="M3.609 1.814L13.792 12 3.61 22.186a2.372 2.372 0 0 1-.497-.661 2.604 2.604 0 0 1-.201-1.022V3.497c0-.373.07-.718.201-1.022.131-.303.303-.563.496-.661z"/>
                <path fill="#FBBC04" d="M16.296 9.497l-2.504 2.504 2.504 2.504 3.108-1.798a1.262 1.262 0 0 0 0-2.181l-3.108-3.029z"/>
                <path fill="#4285F4" d="M3.609 1.814c.324-.364.763-.578 1.234-.602l11.453 6.621-2.504 2.504-10.183-8.523z"/>
                <path fill="#34A853" d="M16.296 14.505l-2.504-2.504-10.183 10.185a1.49 1.49 0 0 0 1.234-.602l11.453-7.079z"/>
              </svg>
              <div className="flex flex-col">
                <span className="text-[10px] text-[#6a6a6a] leading-none">GET IT ON</span>
                <span className="text-sm font-semibold text-black leading-tight">Google Play</span>
              </div>
            </a>
            {/* Coming Soon Tooltip */}
            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-1.5 bg-[#1a1a1a] border border-[#3a3a3a] rounded-lg text-white text-sm font-medium opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap">
              Coming Soon
              <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-[#3a3a3a]"></div>
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}
