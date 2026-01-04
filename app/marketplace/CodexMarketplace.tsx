import Link from "next/link";

export default async function CodexMarketplace() {
  const providers = "stripe,solana";
  const products = "TapPass,Tracks,Bundles";
  return (
    <main className="min-h-screen bg-gradient-to-b from-black to-[#031a1a] text-white">
      <header className="sticky top-0 z-20 border-b border-white/10 bg-black/70 backdrop-blur">
        <div className="mx-auto max-w-7xl px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-6 w-6 rounded-md bg-teal-500/20 ring-1 ring-teal-400/30" />
            <div className="text-lg font-semibold text-teal-300">Marketplace</div>
          </div>
          <Link href="/wallet" className="text-sm text-white/80 underline">Wallet</Link>
        </div>
      </header>
      <section className="mx-auto max-w-7xl p-4 space-y-6">
        <div className="rounded-xl border border-white/10 bg-white/5 p-4 text-sm text-white/80">
          Providers: {providers} â€¢ Products: {products}
        </div>
        <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="rounded-xl border border-white/10 bg-white/5 p-3">
              <div className="h-40 rounded-md bg-black/40 mb-3" />
              <div className="font-medium">Product {i+1}</div>
              <div className="text-sm text-white/60">TapCoin or Stripe checkout</div>
              <div className="mt-3 flex items-center gap-2">
                <button className="rounded-lg border border-white/10 bg-white/10 px-3 py-1 text-sm hover:bg-white/20">Preview</button>
                <button className="rounded-lg border border-emerald-500/30 bg-emerald-400/10 px-3 py-1 text-sm text-emerald-300 hover:bg-emerald-400/20">Buy</button>
              </div>
            </div>
          ))}
        </div>
        <div className="rounded-xl border border-white/10 bg-white/5 p-4">
          <div className="font-semibold mb-2">Order History</div>
          <div className="text-sm text-white/60">No orders yet.</div>
        </div>
      </section>
    </main>
  );
}