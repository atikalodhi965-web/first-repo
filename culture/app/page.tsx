import { Header } from "@/components/header"
import { TrendingCoins } from "@/components/trending-coins"
import { TokenGrid } from "@/components/token-grid"
import { Footer } from "@/components/footer"

export default function Home() {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="mx-auto max-w-6xl px-4 py-8">
        <div>
          <TrendingCoins />
          
          <h2 className="mb-6 text-2xl font-bold">Discover Tokens</h2>
          <TokenGrid />
        </div>
      </main>
      
      <Footer />
    </div>
  )
}
