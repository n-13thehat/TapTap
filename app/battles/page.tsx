"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import HeroPlayer, { type Battle as HeroBattle } from "../../components/arena/HeroPlayer";
import EngagePanel from "./EngagePanel";
import ClipBar from "./ClipBar";
import { RouteFeatureGate } from "@/components/RouteFeatureGate";
import { useEnhancedPlayerStore } from "@/stores/enhancedPlayer";

type BattleItem = {
  id: string;
  title: string;
  channelTitle: string;
  channelId: string;
  publishedAt: string;
  thumbnail?: string;
  url?: string;
};

function BattlesContent() {
  const [mode, setMode] = useState<"watch" | "engage">("watch");
  const [sort, setSort] = useState<"recent" | "popular">("recent");
  const [q, setQ] = useState<string>("");
  const [items, setItems] = useState<BattleItem[]>([]);
  const [panelRecent, setPanelRecent] = useState<BattleItem[]>([]);
  const [panelPopular, setPanelPopular] = useState<BattleItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [active, setActive] = useState<HeroBattle | null>(null);
  const [unlocked, setUnlocked] = useState<Record<string, boolean>>({});
  const timeRef = useRef<() => number>(() => 0);
  const [manualTitle, setManualTitle] = useState("");
  const [manualUrl, setManualUrl] = useState("");

  // Global player integration
  const { playTrack } = useEnhancedPlayerStore();

  const fetchBattles = useCallback(
    async (sortParam: "recent" | "popular") => {
      const params = new URLSearchParams({ sort: sortParam, maxResults: String(24) });
      if (q.trim()) params.set("q", q.trim());
      const res = await fetch(`/api/battles?${params.toString()}`, { cache: "no-store" });
      const payload = await res.json();
      if (!res.ok) throw new Error(payload?.error || "Failed to load battles");
      return (payload?.items || []) as BattleItem[];
    },
    [q],
  );

  const load = useCallback(async () => {
    setLoading(true);
    setErr(null);
    try {
      const list = await fetchBattles(sort);
      setItems(list);
      if (list.length && (!active || q.trim())) {
        const first = mapItemToBattle(list[0]);
        setActive(first);
        setUnlocked((u) => ({ ...u, [first.id]: true }));
      }
    } catch (e: any) {
      setErr(e.message || "Error");
    } finally {
      setLoading(false);
    }
  }, [sort, q, active, fetchBattles]);

  const loadPanelLists = useCallback(async () => {
    try {
      const [recentList, popularList] = await Promise.all([
        fetchBattles("recent"),
        fetchBattles("popular")
      ]);
      // Limit to top 5 for each panel
      setPanelRecent(recentList.slice(0, 5));
      setPanelPopular(popularList.slice(0, 5));
    } catch (error) {
      console.error("Failed to load panel lists:", error);
    }
  }, [fetchBattles]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    loadPanelLists();
  }, [loadPanelLists]);

  function mapItemToBattle(v: BattleItem): HeroBattle {
    const embedUrl = v.url?.includes("youtube-nocookie.com")
      ? v.url
      : `https://www.youtube-nocookie.com/embed/${extractIdFromUrl(v.url || v.id)}?autoplay=1&controls=1&rel=0&modestbranding=1`;
    return {
      id: v.id,
      title: v.title,
      hostChannel: v.channelTitle,
      hostChannelId: v.channelId,
      thumbnailUrl: v.thumbnail,
      videoUrl: embedUrl,
      tier: "MIDCARD",
      tapCoinCost: 0,
      status: "ENDED",
      viewers: undefined,
    } as HeroBattle;
  }

  function onSelect(v: BattleItem) {
    const b = mapItemToBattle(v);
    setActive(b);
    // mark unlocked so the full video plays in-app
    setUnlocked((u) => ({ ...u, [b.id]: true }));
    // ensure watch mode is visible on select
    setMode("watch");
  }

  function routeToGlobalPlayer(v: BattleItem) {
    // Convert battle to track format for global player
    const track = {
      id: v.id,
      title: v.title,
      artist: v.channelTitle,
      audioUrl: v.url || `https://www.youtube.com/watch?v=${v.id}`,
      coverUrl: v.thumbnail || `https://img.youtube.com/vi/${v.id}/hqdefault.jpg`,
      duration: 0, // Will be determined by player
      type: 'battle' as const
    };

    playTrack(track);
  }

  function addManualBattle() {
    const id = extractIdFromUrl(manualUrl || manualTitle);
    if (!id) return;
    const item: BattleItem = {
      id,
      title: manualTitle || "User submitted battle",
      channelTitle: "User submission",
      channelId: "user",
      publishedAt: new Date().toISOString(),
      thumbnail: `https://img.youtube.com/vi/${id}/hqdefault.jpg`,
      url: manualUrl || `https://www.youtube.com/watch?v=${id}`,
    };
    setItems((prev) => {
      const withoutDupes = prev.filter((p) => p.id !== item.id);
      const next = [item, ...withoutDupes];
      setActive(mapItemToBattle(item));
      setUnlocked((u) => ({ ...u, [item.id]: true }));
      return next;
    });
    setManualTitle("");
    setManualUrl("");
  }

  function onEndedNext() {
    if (!active || !items.length) return;
    const idx = items.findIndex((x) => x.id === active.id || x.id === extractIdFromUrl(active.videoUrl || active.id));
    const next = items[(idx + 1) % items.length];
    if (next) onSelect(next);
  }

  function extractIdFromUrl(input: string): string {
    const idMatch = input.match(/(?:v=|\/)([0-9A-Za-z_-]{11})/);
    if (idMatch && idMatch[1]) return idMatch[1];
    if (/^[0-9A-Za-z_-]{11}$/.test(input)) return input;
    return input.split('?')[0].split('/').pop() || input;
  }

  return (
    <div className="min-h-dvh bg-black text-white">
      <div className="mx-auto max-w-6xl p-4">
        <div className="mb-4 flex items-center justify-between">
          <h1 className="text-2xl font-semibold">TapTap Battles</h1>
          <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 p-1 text-sm">
            <button onClick={() => setMode("watch")} className={`${mode === 'watch' ? 'bg-teal-500 text-black' : 'hover:bg-white/10 text-white/80'} rounded-full px-3 py-1`}>Watch</button>
            <button onClick={() => setMode("engage")} className={`${mode === 'engage' ? 'bg-teal-500 text-black' : 'hover:bg-white/10 text-white/80'} rounded-full px-3 py-1`}>Engage</button>
          </div>
        </div>

        <div className="mb-6 rounded-xl border border-white/10 bg-white/5 p-3">
          {mode === 'watch' && (
            <HeroPlayer
              battle={active}
              unlocked={unlocked}
              onPlayerApi={(api) => { timeRef.current = api.getCurrentTime; }}
              onEnded={onEndedNext}
            />
          )}
          {mode === 'engage' && (
            <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
              <div className="md:col-span-2">
                <HeroPlayer
                  battle={active}
                  unlocked={unlocked}
                  onPlayerApi={(api) => { timeRef.current = api.getCurrentTime; }}
                  onEnded={onEndedNext}
                />
              </div>
              <div className="md:col-span-1">
                <EngagePanel />
              </div>
            </div>
          )}

          <ClipBar
            getCurrentTime={() => { try { return Number(timeRef.current?.() || 0) } catch { return 0 } }}
            getSourceUrl={() => (active?.videoUrl ? String(active.videoUrl) : null)}
            onCreateClip={() => {}}
          />
        </div>

        {(!items.length || err) && (
          <div className="mb-6 rounded-xl border border-white/10 bg-black/40 p-4">
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div>
                <div className="text-sm font-semibold text-white">No battles found</div>
                <div className="text-xs text-white/60">
                  Add a YouTube battle video to get started.
                </div>
                {err && <div className="text-xs text-amber-300 mt-1">API error: {err}</div>}
              </div>
              <div className="flex flex-col gap-2 md:flex-row">
                <input
                  type="text"
                  value={manualTitle}
                  onChange={(e) => setManualTitle(e.target.value)}
                  placeholder="Battle title"
                  className="w-full md:w-48 rounded-md border border-white/10 bg-black/40 px-3 py-2 text-sm text-white outline-none"
                />
                <input
                  type="text"
                  value={manualUrl}
                  onChange={(e) => setManualUrl(e.target.value)}
                  placeholder="YouTube URL or ID"
                  className="w-full md:w-56 rounded-md border border-white/10 bg-black/40 px-3 py-2 text-sm text-white outline-none"
                />
                <button
                  onClick={addManualBattle}
                  className="rounded-md bg-teal-600 px-3 py-2 text-sm font-semibold text-black hover:bg-teal-500"
                >
                  Add Battle
                </button>
              </div>
            </div>
          </div>
        )}
        <section className="mb-6 space-y-4">
          <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-[11px] uppercase tracking-wider text-white/50">Battle Panels</p>
              <h2 className="text-xl font-semibold text-white">Popular vs Recent matchups</h2>
            </div>
            <div className="text-[11px] text-white/60">Tap to queue & view stats</div>
          </div>
          <div className="grid gap-3 lg:grid-cols-2">
            <BattlePanel
              title="Top 5 Most Popular"
              subtitle="Highest viewed battles"
              items={panelPopular}
              onSelect={onSelect}
            />
            <BattlePanel
              title="Top 5 Newest"
              subtitle="Latest from battle leagues"
              items={panelRecent}
              onSelect={onSelect}
            />
          </div>
        </section>

        <section className="mb-10 space-y-3">
          <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-[11px] uppercase tracking-wider text-white/50">Top Leagues Feed</p>
              <h2 className="text-xl font-semibold text-white">Results from YouTube battle leagues</h2>
              <p className="text-xs text-white/60">Powered by the top 10 leagues (URL, KOTD, RBE, QOTR, iBattle, GTX, Gates, Premier Battles, BullPen, Don’t Flop).</p>
              {err && <p className="text-xs text-amber-300 mt-1">API error: {err}. Ensure YOUTUBE_API_KEY is set.</p>}
            </div>
            <button
              onClick={() => load()}
              className="self-start rounded-md border border-white/10 bg-white/10 px-3 py-2 text-sm text-white/80 hover:bg-white/20"
            >
              Refresh results
            </button>
          </div>

          {items.length === 0 && (
            <div className="rounded-lg border border-white/10 bg-white/5 p-4 text-sm text-white/70">
              No battles found. Try a search or add a YouTube battle below.
            </div>
          )}

          {items.length > 0 && (
            <div className="grid gap-3 md:grid-cols-2">
              {items.slice(0, 24).map((item) => (
                <button
                  key={item.id}
                  onClick={() => onSelect(item)}
                  className="group flex w-full items-center gap-3 rounded-lg border border-white/10 bg-white/5 p-3 text-left transition hover:bg-white/10"
                >
                  <div className="relative w-28 h-16 rounded bg-black/40 overflow-hidden">
                    <img
                      src={item.thumbnail || `https://img.youtube.com/vi/${item.id}/hqdefault.jpg`}
                      alt={item.title}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center text-xs text-white transition">
                      Watch
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-white line-clamp-2">{item.title}</div>
                    <div className="text-xs text-white/60 line-clamp-1">{item.channelTitle}</div>
                    <div className="text-[11px] text-white/50">
                      {new Date(item.publishedAt).toLocaleDateString()}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </section>
        <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex w-full items-center gap-2 sm:w-auto">
            <input
              type="text"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') load(); }}
              placeholder="Search battles (title, channel)"
              className="w-full sm:w-[320px] rounded-md border border-white/10 bg-black/40 px-3 py-2 text-sm text-white outline-none"
            />
            <button
              onClick={() => load()}
              className="rounded-md bg-teal-600 px-3 py-2 text-sm font-semibold text-black hover:bg-teal-500"
            >
              Search
            </button>
            {q && (
              <button
                onClick={() => { setQ(""); setTimeout(() => load(), 0); }}
                className="rounded-md border border-white/10 bg-white/10 px-3 py-2 text-sm text-white/80 hover:bg-white/20"
              >
                Clear
              </button>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setSort("recent")}
              className={`rounded-lg px-3 py-2 ${
                sort === "recent"
                  ? "bg-teal-600"
                  : "bg-zinc-800 hover:bg-zinc-700"
              }`}
            >
              Recent
            </button>
            <button
              onClick={() => setSort("popular")}
              className={`rounded-lg px-3 py-2 ${
                sort === "popular"
                  ? "bg-teal-600"
                  : "bg-zinc-800 hover:bg-zinc-700"
              }`}
            >
              Popular
            </button>
          </div>
        </div>

        {loading && <div className="text-zinc-400">Loading battles...</div>}
        {err && <div className="text-red-400">{err}</div>}

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3">
          {items.map((v) => (
            <button
              key={v.id}
              type="button"
              onClick={() => onSelect(v)}
              className="text-left group overflow-hidden rounded-xl border border-zinc-800 bg-zinc-950/60 transition hover:border-teal-700"
            >
              {v.thumbnail ? (
                <img src={v.thumbnail} alt={v.title} className="aspect-video w-full object-cover" />
              ) : (
                <div className="aspect-video w-full bg-zinc-900" />
              )}
              <div className="p-3">
                <div className="text-sm text-zinc-400">{v.channelTitle}</div>
                <div className="line-clamp-2 font-medium group-hover:text-white">{v.title}</div>
                <div className="mt-1 text-xs text-zinc-500">{new Date(v.publishedAt).toLocaleString()}</div>
              </div>
            </button>
          ))}
        </div>
        {/* Real-time Leaderboards */}
        <div className="mt-6">
          <RealTimeLeaderboards />
        </div>
      </div>
    </div>
  );
}

export default function BattlesPage() {
  return (
    <RouteFeatureGate
      flag="battles"
      title="Battles are currently gated"
      description="Enable the battles flag in the feature service to re-open this experience."
    >
      <BattlesContent />
    </RouteFeatureGate>
  );
}

type BattlePanelProps = {
  title: string;
  subtitle?: string;
  items: BattleItem[];
  onSelect: (item: BattleItem) => void;
};

function BattlePanel({ title, subtitle, items, onSelect }: BattlePanelProps) {
  const shown = items.slice(0, 5);
  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.4em] text-white/50">{title}</p>
          {subtitle && <p className="text-sm text-white/70">{subtitle}</p>}
        </div>
        <span className="text-[11px] text-white/50">{items.length} entries</span>
      </div>
      <div className="space-y-3">
        {shown.map((item, index) => (
          <div key={item.id} className="group">
            <button
              onClick={() => onSelect(item)}
              className="w-full rounded-2xl border border-white/10 bg-black/30 px-3 py-4 text-left transition hover:border-teal-500 touch-manipulation"
              style={{ touchAction: "manipulation" }}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <div className="mb-2 text-[12px] text-white/60">{item.channelTitle}</div>
                  <div className="text-sm font-semibold text-white line-clamp-2">{item.title}</div>
                  <div className="mt-2 flex items-center justify-between text-[11px] text-white/50">
                    <span>{new Date(item.publishedAt).toLocaleDateString()}</span>
                    <span className="text-teal-300">#{index + 1}</span>
                  </div>
                </div>
                <div className="ml-3 flex flex-col gap-1">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onSelect(item);
                    }}
                    className="text-xs px-2 py-1 bg-teal-600 text-black rounded hover:bg-teal-500"
                  >
                    Watch
                  </button>
                </div>
              </div>
            </button>
          </div>
        ))}
        {shown.length === 0 && (
          <div className="rounded-xl border border-white/10 bg-black/30 p-3 text-xs text-white/60">
            No battles available right now. Check back soon for fresh content from the top battle leagues.
          </div>
        )}
      </div>
    </div>
  );
}

function RealTimeLeaderboards() {
  const [leagues, setLeagues] = useState<Array<{ name: string; score: number; battles: number }>>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchLeaderboards() {
      try {
        const response = await fetch('/api/battles/leagues');
        const data = await response.json();

        if (data.leagues) {
          const leagueStats = data.leagues
            .slice(0, 5)
            .map((league: any) => ({
              name: league.name.replace(/\s*\([^)]*\)/g, ''), // Remove parentheses
              score: league.metrics?.avgViewsPerBattle || 0,
              battles: league.metrics?.totalBattles || 0
            }))
            .sort((a: any, b: any) => b.score - a.score);

          setLeagues(leagueStats);
        }
      } catch (error) {
        console.error('Failed to fetch leaderboards:', error);
        // Fallback to real league names without mock data
        setLeagues([
          { name: 'Ultimate Rap League', score: 0, battles: 0 },
          { name: 'King of the Dot', score: 0, battles: 0 },
          { name: 'BullPen Battle League', score: 0, battles: 0 },
          { name: 'Don\'t Flop', score: 0, battles: 0 },
          { name: 'Rare Breed Entertainment', score: 0, battles: 0 },
        ]);
      } finally {
        setLoading(false);
      }
    }

    fetchLeaderboards();
  }, []);

  if (loading) {
    return (
      <div className="rounded-xl border border-white/10 bg-white/5 p-4">
        <div className="text-sm font-semibold text-teal-300 mb-3">League Rankings</div>
        <div className="text-xs text-white/60">Loading real-time data...</div>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-white/10 bg-white/5 p-4">
      <div className="mb-3 flex items-center justify-between">
        <div className="text-sm font-semibold text-teal-300">League Rankings</div>
        <div className="text-[11px] text-white/50">Live Data</div>
      </div>
      <ul className="space-y-2 text-sm text-white/80">
        {leagues.map((league, index) => (
          <li key={league.name} className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-[11px] text-white/50">#{index + 1}</span>
              <span className="truncate">{league.name}</span>
            </div>
            <div className="flex items-center gap-2 text-[11px] text-white/60">
              <span>{league.battles} battles</span>
              <span className="font-mono">{league.score > 0 ? `${Math.round(league.score / 1000)}K` : 'N/A'}</span>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

