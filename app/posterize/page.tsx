"use client";
import React, { useCallback, useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { useToast } from "@/hooks/use-toast";
import { motion, AnimatePresence } from "framer-motion";
import {
  Zap,
  Image,
  Clock,
  Hash,
  DollarSign,
  Plus,
  Trash2,
  Edit,
  Eye,
  Settings,
  RefreshCw,
  AlertCircle
} from "lucide-react";
import {
  PageContainer,
  PageHeader,
  LoadingState,
  ErrorState,
  EmptyState
} from "@/components/ui/StandardizedComponents";
import { useMatrixIframes } from "@/hooks/useMatrixIframes";
import { RouteFeatureGate } from "@/components/RouteFeatureGate";

type MineItem = { id: string; title: string; priceCents: number; inventory: number; createdAt: string };

function PosterizeContent() {
  const searchParams = useSearchParams();
  const embed = String(searchParams?.get("embed") ?? "") === "1";
  const [title, setTitle] = useState("");
  const [durationSec, setDurationSec] = useState<number>(15);
  const [mintCount, setMintCount] = useState<number>(10);
  const [priceCents, setPriceCents] = useState<number>(0);
  const [creating, setCreating] = useState(false);
  const [loading, setLoading] = useState(true);
  const [mine, setMine] = useState<MineItem[]>([]);
  const [err, setErr] = useState<string | null>(null);
  const { toast } = useToast();

  // Auto-enhance any iframes on this page
  useMatrixIframes();

  const refresh = useCallback(async () => {
    try {
      setLoading(true);
      setErr(null);
      const r = await fetch('/api/posterize/mine', { cache: 'no-store' });
      const j = await r.json();
      if (!r.ok) throw new Error(j?.error || 'Failed');
      setMine(j.items || []);
    } catch (e: any) {
      setErr(e?.message || 'Failed to load');
      toast({ title: 'Load failed', description: e?.message || 'Error', variant: 'destructive' } as any);
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => { refresh(); }, [refresh]);

  async function createPosterize(e: React.FormEvent) {
    e.preventDefault();
    setCreating(true);
    try {
      const r = await fetch('/api/posterize/create', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ title, durationSec, mintCount, priceCents }) });
      const j = await r.json();
      if (!r.ok) throw new Error(j?.error || 'Failed to create');
      setTitle(""); setDurationSec(15); setMintCount(10); setPriceCents(0);
      toast({ title: 'Posterize created', description: `Product ${j.productId}` });
      await refresh();
    } catch (e: any) {
      toast({ title: 'Create failed', description: e?.message || 'Error', variant: 'destructive' } as any);
    } finally {
      setCreating(false);
    }
  }

  return (
    <PageContainer showMatrix={true}>
      <PageHeader
        title="Posterize"
        subtitle="Mint battle highlights and moments as NFTs"
        icon={Zap}
        showBackButton={true}
        actions={
          <div className="flex items-center gap-2">
            <button
              onClick={refresh}
              disabled={loading}
              className="rounded-md border border-white/10 bg-white/5 p-2 text-white/70 hover:bg-white/10 transition-colors disabled:opacity-50"
            >
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
            <button className="rounded-md border border-white/10 bg-white/5 p-2 text-white/70 hover:bg-white/10 transition-colors">
              <Settings className="h-4 w-4" />
            </button>
          </div>
        }
      />

      <div className="max-w-6xl mx-auto px-4 py-8 space-y-8">
        {/* Create New Posterize */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white/5 rounded-xl border border-white/10 p-6"
        >
          <div className="flex items-center gap-3 mb-6">
            <div className="h-10 w-10 rounded-lg bg-teal-500/20 ring-1 ring-teal-400/30 flex items-center justify-center">
              <Plus className="h-5 w-5 text-teal-300" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-white">Create New Posterize</h2>
              <p className="text-sm text-white/60">Mint battle highlights and moments as collectible NFTs</p>
            </div>
          </div>

          <form onSubmit={createPosterize} className="space-y-6">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
              <div>
                <label className="block text-sm font-medium text-white/80 mb-2">
                  <Image className="inline h-4 w-4 mr-1" />
                  Title
                </label>
                <input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Epic battle moment"
                  className="w-full p-3 rounded-lg bg-black/50 border border-white/10 text-white placeholder-white/40 focus:border-teal-400/50 focus:outline-none focus:ring-1 focus:ring-teal-400/50"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-white/80 mb-2">
                  <Clock className="inline h-4 w-4 mr-1" />
                  Duration (seconds)
                </label>
                <input
                  type="number"
                  min={1}
                  max={120}
                  value={durationSec}
                  onChange={(e) => setDurationSec(Number(e.target.value || 0))}
                  className="w-full p-3 rounded-lg bg-black/50 border border-white/10 text-white focus:border-teal-400/50 focus:outline-none focus:ring-1 focus:ring-teal-400/50"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-white/80 mb-2">
                  <Hash className="inline h-4 w-4 mr-1" />
                  Mint Count
                </label>
                <input
                  type="number"
                  min={1}
                  max={9999}
                  value={mintCount}
                  onChange={(e) => setMintCount(Number(e.target.value || 0))}
                  className="w-full p-3 rounded-lg bg-black/50 border border-white/10 text-white focus:border-teal-400/50 focus:outline-none focus:ring-1 focus:ring-teal-400/50"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-white/80 mb-2">
                  <DollarSign className="inline h-4 w-4 mr-1" />
                  Price (cents)
                </label>
                <input
                  type="number"
                  min={0}
                  step={1}
                  value={priceCents}
                  onChange={(e) => setPriceCents(Number(e.target.value || 0))}
                  className="w-full p-3 rounded-lg bg-black/50 border border-white/10 text-white focus:border-teal-400/50 focus:outline-none focus:ring-1 focus:ring-teal-400/50"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => {
                  setTitle("");
                  setDurationSec(15);
                  setMintCount(10);
                  setPriceCents(0);
                }}
                className="px-4 py-2 rounded-lg border border-white/10 bg-white/5 text-white/70 hover:bg-white/10 transition-colors"
              >
                Reset
              </button>
              <button
                type="submit"
                disabled={creating || !title.trim()}
                className="inline-flex items-center gap-2 px-6 py-3 bg-teal-500/90 text-black font-semibold rounded-lg hover:bg-teal-400 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {creating ? (
                  <>
                    <div className="animate-spin h-4 w-4 border-2 border-black/30 border-t-black rounded-full" />
                    Creating...
                  </>
                ) : (
                  <>
                    <Zap className="h-4 w-4" />
                    Create Posterize
                  </>
                )}
              </button>
            </div>
          </form>
        </motion.section>
        {/* Your Posterize Items */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white/5 rounded-xl border border-white/10 p-6"
        >
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-purple-500/20 ring-1 ring-purple-400/30 flex items-center justify-center">
                <Image className="h-5 w-5 text-purple-300" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-white">Your Posterize Items</h2>
                <p className="text-sm text-white/60">{mine.length} NFT{mine.length !== 1 ? 's' : ''} created</p>
              </div>
            </div>
          </div>

          {err && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-6 p-4 rounded-lg border border-rose-500/30 bg-rose-500/10 text-rose-200"
            >
              <div className="flex items-center gap-2">
                <AlertCircle className="h-4 w-4" />
                {err}
              </div>
            </motion.div>
          )}

          {loading ? (
            <LoadingState message="Loading your posterize items..." showMatrix={false} />
          ) : mine.length === 0 ? (
            <EmptyState
              title="No posterize items yet"
              description="Create your first posterize NFT to get started. Battle highlights and epic moments make great collectibles!"
              icon={Image}
            />
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
              <AnimatePresence>
                {mine.map((item, index) => (
                  <motion.div
                    key={item.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ delay: index * 0.05 }}
                    className="group rounded-xl border border-white/10 bg-black/40 p-4 hover:bg-black/60 transition-colors"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1 min-w-0">
                        <h3 className="font-medium text-teal-300 truncate" title={item.title}>
                          {item.title}
                        </h3>
                        <p className="text-xs text-white/60 mt-1">
                          {new Date(item.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button className="p-1 rounded-md border border-white/10 bg-white/5 text-white/70 hover:bg-white/10 transition-colors">
                          <Eye className="h-3 w-3" />
                        </button>
                        <button className="p-1 rounded-md border border-white/10 bg-white/5 text-white/70 hover:bg-white/10 transition-colors">
                          <Edit className="h-3 w-3" />
                        </button>
                        <button className="p-1 rounded-md border border-rose-500/30 bg-rose-500/10 text-rose-300 hover:bg-rose-500/20 transition-colors">
                          <Trash2 className="h-3 w-3" />
                        </button>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-white/70">Price:</span>
                        <span className="text-teal-300 font-medium">
                          ${(item.priceCents / 100).toFixed(2)}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-white/70">Mints:</span>
                        <span className="text-white/80">{item.inventory}</span>
                      </div>
                    </div>

                    <div className="mt-3 pt-3 border-t border-white/10">
                      <div className="flex items-center gap-2">
                        <div className="flex-1 bg-white/10 rounded-full h-2">
                          <div
                            className="bg-teal-400 h-2 rounded-full transition-all duration-300"
                            style={{ width: `${Math.min(100, (item.inventory / 100) * 100)}%` }}
                          />
                        </div>
                        <span className="text-xs text-white/60">
                          {Math.min(100, Math.round((item.inventory / 100) * 100))}%
                        </span>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}
        </motion.section>
      </div>
    </PageContainer>
  );
}

export default function PosterizePage() {
  return (
    <RouteFeatureGate
      flag="posterize"
      title="Posterize is currently gated"
      description="Enable the posterize flag in the feature service to continue."
    >
      <Suspense fallback={
        <PageContainer showMatrix={false}>
          <PageHeader
            title="Posterize"
            description="Create NFT collectibles from your best moments"
            icon={Zap}
          />
          <LoadingState message="Loading posterize..." showMatrix={false} />
        </PageContainer>
      }>
        <PosterizeContent />
      </Suspense>
    </RouteFeatureGate>
  );
}
