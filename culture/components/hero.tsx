import Link from "next/link"

export function Hero() {
  return (
    <section className="relative overflow-hidden py-8 md:py-12">
      {/* Background effects */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute left-1/4 top-1/4 h-64 w-64 rounded-full bg-primary/10 blur-[100px]" />
        <div className="absolute right-1/4 bottom-1/4 h-64 w-64 rounded-full bg-accent/10 blur-[100px]" />
      </div>

      <div className="mx-auto max-w-4xl px-4 text-center">
        <h1 className="text-3xl font-extrabold tracking-tight text-balance md:text-4xl lg:text-5xl">
          Made For{" "}
          <span className="bg-gradient-to-r from-primary via-primary to-accent bg-clip-text text-transparent">
            The Culture
          </span>
          , By The Culture
        </h1>
        
        {/* Launch Token Button */}
        <div className="mt-8">
          <Link href="/create">
            <div className="inline-block rounded-lg p-[2px]" style={{ background: "linear-gradient(90deg, #f97316, #facc15, #4ade80)" }}>
              <div className="rounded-lg bg-[#0a0a0a] px-8 py-3 hover:bg-[#1a1a1a] transition-colors">
                <span className="text-sm font-bold tracking-wider text-white">LAUNCH TOKEN</span>
              </div>
            </div>
          </Link>
        </div>
      </div>
    </section>
  )
}
