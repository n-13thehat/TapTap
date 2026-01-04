"use client";

import { useEffect, useRef, useState } from "react";
import { Play, Pause, SkipBack, SkipForward, List, Shuffle, Repeat, Volume2, VolumeX, BookText, PlusSquare, MoreHorizontal, MessageSquare, Sparkles, Activity, Heart } from "lucide-react";
import { usePlayerStore } from "@/stores/player";
import { recordEvent } from "@/lib/events";

declare global {
  interface Window { __taptap_global_player_mounted?: boolean }
}

type ChatMessage = {
  id: string;
  text: string;
  at: number;
};

export default function EnhancedPlayer() {
  const audioRef = useRef<HTMLAudioElement>(null);
  const {
    current, isPlaying, play, pause, skipNext, skipPrev, queue, playTrack,
    shuffle, loop, volume, lyricsOpen,
    toggleShuffle, cycleLoop, setVolume, toggleLyrics,
    saveTrack, addToPlaylist, createQuickPlaylist,
  } = usePlayerStore() as any;
  
  const [progress, setProgress] = useState(0);
  const [showQueue, setShowQueue] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [overlay, setOverlay] = useState<"chat" | "bets" | null>(null);
  const [battleVotes, setBattleVotes] = useState({ champ: 0, challenger: 0 });
  const [isSaved, setIsSaved] = useState(false);
  const [isAddingToPlaylist, setIsAddingToPlaylist] = useState(false);

  const hasVotes = battleVotes.champ > 0 || battleVotes.challenger > 0;

  const handleMenuSelect = (mode: "posterize" | "chat" | "bets") => {
    setMenuOpen(false);
    if (mode === "posterize") {
      if (typeof window !== "undefined") {
        window.open("/posterize?embed=1", "_blank");
      }
      return;
    }
    setOverlay(mode);
  };

  const recordBattleVote = (target: "champ" | "challenger") => {
    setBattleVotes((prev) => ({ ...prev, [target]: prev[target] + 1 }));
  };

  // Enhanced save track function
  const handleSaveTrack = async () => {
    if (!current?.id || isSaved) return;
    
    setIsSaved(true);
    try {
      await saveTrack(current.id);
      // Emit proper event
      if (typeof window !== "undefined") {
        window.dispatchEvent(
          new CustomEvent("taptap:track-saved", { detail: { trackId: current.id } })
        );
      }
      recordEvent('TRACK_SAVED', { id: current.id });
    } catch (error) {
      console.error('Failed to save track:', error);
      setIsSaved(false);
    }
  };

  // Enhanced add to playlist function
  const handleAddToPlaylist = async () => {
    if (!current?.id || isAddingToPlaylist) return;
    
    setIsAddingToPlaylist(true);
    try {
      await createQuickPlaylist(current.id);
      // Emit proper event
      if (typeof window !== "undefined") {
        window.dispatchEvent(
          new CustomEvent("taptap:playlist-created", { 
            detail: { trackId: current.id, quickAdd: true } 
          })
        );
      }
      recordEvent('PLAYLIST_CREATED', { quickAdd: true, trackId: current.id });
    } catch (error) {
      console.error('Failed to add to playlist:', error);
    } finally {
      setIsAddingToPlaylist(false);
    }
  };

  // Enhanced track play event emission
  const enhancedPlayTrack = (track: any) => {
    playTrack(track);
    // Emit TRACK_PLAYED event
    if (typeof window !== "undefined") {
      window.dispatchEvent(
        new CustomEvent("taptap:track-played", { 
          detail: { 
            trackId: track.id, 
            title: track.title, 
            artist: track.artist,
            timestamp: Date.now()
          } 
        })
      );
    }
    recordEvent('TRACK_PLAYED', { id: track.id });
  };

  useEffect(() => {
    if (typeof window !== "undefined") {
      (window as any).__taptapPlayerStore__ = usePlayerStore;
    }
    return () => {
      if (typeof window !== "undefined") {
        delete (window as any).__taptapPlayerStore__;
      }
    };
  }, []);

  // Single-instance guard
  const [enabled, setEnabled] = useState(true);
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (window.__taptap_global_player_mounted) { setEnabled(false); return; }
    window.__taptap_global_player_mounted = true;
    return () => {
      if (window.__taptap_global_player_mounted) {
        window.__taptap_global_player_mounted = false;
      }
    };
  }, []);

  // Progress timer + scrub
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    const update = () => setProgress(audio.duration ? audio.currentTime / audio.duration : 0);
    audio.addEventListener("timeupdate", update);
    return () => audio.removeEventListener("timeupdate", update);
  }, []);

  function scrub(e: React.MouseEvent<HTMLDivElement>) {
    const audio = audioRef.current; 
    if (!audio || !audio.duration) return;
    const rect = (e.currentTarget as HTMLDivElement).getBoundingClientRect();
    const pct = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    audio.currentTime = pct * audio.duration;
    setProgress(pct);
  }

  // React to store state
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    if (current?.audio_url && audio.src !== current.audio_url) {
      audio.src = current.audio_url;
      setIsSaved(false); // Reset save state for new track
    }
    audio.volume = volume ?? 0.8;
    if (isPlaying) audio.play().catch(() => {});
    else audio.pause();
  }, [current, isPlaying, volume]);

  // Enhanced global event handler
  useEffect(() => {
    function onPlay(e: any) {
      const track = e?.detail?.track;
      if (!track) return;
      const audio = audioRef.current; 
      if (!audio) return;
      if (track.audio_url && audio.src !== track.audio_url) audio.src = track.audio_url;
      audio.play().then(() => {
        // Enhanced event recording
        try { 
          recordEvent("TRACK_PLAYED", { 
            id: track.id, 
            title: track.title, 
            artist: track.artist,
            timestamp: Date.now()
          }); 
        } catch {}
      }).catch(() => {});
    }
    window.addEventListener("taptap:play", onPlay as any);
    return () => window.removeEventListener("taptap:play", onPlay as any);
  }, []);

  if (!enabled) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-black/70 backdrop-blur-md border-t border-white/10 p-4 flex flex-col gap-4 sm:flex-row sm:items-center">
      <div className="flex-1 min-w-0">
        <div className="truncate text-sm font-semibold text-white">
          {current?.title || "No track selected"}
        </div>
        <div className="truncate text-xs text-white/60">{current?.artist || ""}</div>
      </div>

      <button onClick={() => setShowQueue((v) => !v)} className="text-white/80 hover:text-teal-400" aria-label="Queue">
        <List size={18} />
      </button>

      <div className="relative">
        <button
          onClick={() => setMenuOpen((prev) => !prev)}
          className="text-white/80 hover:text-teal-400"
          aria-label="Options"
          style={{ touchAction: "manipulation" }}
        >
          <MoreHorizontal size={18} />
        </button>
        {menuOpen && (
          <div className="absolute left-0 right-0 top-full z-50 mt-2 mx-auto w-full max-w-xs rounded-xl border border-white/10 bg-black/90 p-2 text-xs text-white shadow-xl sm:left-auto sm:right-0 sm:w-44">
            <button onClick={() => handleMenuSelect("posterize")} className="flex w-full items-center gap-2 rounded-md px-2 py-2 text-left hover:bg-white/5">
              <Sparkles className="h-4 w-4 text-teal-300" /> <span>Posterize</span>
            </button>
            <button onClick={() => handleMenuSelect("chat")} className="mt-1 flex w-full items-center gap-2 rounded-md px-2 py-2 text-left hover:bg-white/5">
              <MessageSquare className="h-4 w-4 text-teal-300" /> <span>Chat overlay</span>
            </button>
            <button onClick={() => handleMenuSelect("bets")} className="mt-1 flex w-full items-center gap-2 rounded-md px-2 py-2 text-left hover:bg-white/5">
              <Activity className="h-4 w-4 text-teal-300" /> <span>Battle bets</span>
            </button>
          </div>
        )}
      </div>

      <div className="flex items-center gap-4">
        <button onClick={toggleShuffle} className={`transition ${shuffle ? 'text-teal-300' : 'text-white/60 hover:text-white/90'}`} aria-label="Shuffle">
          <Shuffle size={16} />
        </button>
        <button onClick={skipPrev} className="text-white/80 hover:text-teal-400 transition" aria-label="Previous">
          <SkipBack size={18} />
        </button>
        <button onClick={isPlaying ? pause : play} className="text-white hover:text-teal-400 transition" aria-label={isPlaying?"Pause":"Play"}>
          {isPlaying ? <Pause size={22} /> : <Play size={22} />}
        </button>
        <button onClick={skipNext} className="text-white/80 hover:text-teal-400 transition" aria-label="Next">
          <SkipForward size={18} />
        </button>
        <button onClick={cycleLoop} className={`transition ${loop !== 'off' ? 'text-teal-300' : 'text-white/60 hover:text-white/90'}`} aria-label="Loop">
          <Repeat size={16} />
        </button>
      </div>

      <div className="w-1/3 h-1 bg-white/20 rounded overflow-hidden cursor-pointer" onClick={scrub}>
        <div className="h-full bg-teal-400" style={{ width: `${Math.round((progress || 0) * 100)}%` }} />
      </div>

      <div className="flex items-center gap-2 min-w-[140px]">
        <button onClick={()=>setVolume(Math.max(0, volume - 0.1))} className="text-white/60 hover:text-white/90" aria-label="Volume down">
          <VolumeX size={16} />
        </button>
        <input type="range" min={0} max={1} step={0.05} value={volume} onChange={(e)=>setVolume(Number(e.target.value))} className="w-24" />
        <button onClick={()=>setVolume(Math.min(1, volume + 0.1))} className="text-white/60 hover:text-white/90" aria-label="Volume up">
          <Volume2 size={16} />
        </button>
      </div>

      <div className="flex items-center gap-2">
        <button onClick={toggleLyrics} className={`text-white/70 hover:text-white ${lyricsOpen ? 'text-teal-300' : ''}`} aria-label="Lyrics">
          <BookText size={16} />
        </button>
        <button
          onClick={handleSaveTrack}
          disabled={!current?.id || isSaved}
          className={`text-white/70 hover:text-white transition-colors ${isSaved ? 'text-red-400' : 'hover:text-red-400'}`}
          aria-label="Save track"
        >
          <Heart size={16} fill={isSaved ? 'currentColor' : 'none'} />
        </button>
        <button
          onClick={handleAddToPlaylist}
          disabled={!current?.id || isAddingToPlaylist}
          className={`text-white/70 hover:text-white hover:text-teal-400 transition-colors ${isAddingToPlaylist ? 'opacity-50' : ''}`}
          aria-label="Add to Playlist"
        >
          <PlusSquare size={16} />
        </button>
      </div>

      <audio ref={audioRef} preload="metadata" />

      {overlay === "chat" && (
        <PlayerChatOverlay onClose={() => setOverlay(null)} onReact={(side) => recordBattleVote(side)} />
      )}
      {overlay === "bets" && (
        <BattleBetOverlay
          onClose={() => setOverlay(null)}
          votes={battleVotes}
          onVote={recordBattleVote}
          hasVotes={hasVotes}
        />
      )}
      {showQueue && (
        <div className="absolute bottom-14 right-4 z-50 w-80 max-h-72 overflow-y-auto rounded-xl border border-white/10 bg-black/90 backdrop-blur p-2 space-y-1">
          {Array.isArray(queue) && queue.length > 0 ? queue.map((t: any) => (
            <button key={t.id} onClick={()=>enhancedPlayTrack(t)} className={`w-full flex items-center gap-2 rounded-md px-2 py-1.5 text-left ${current?.id===t.id? 'bg-teal-500/20 text-teal-200' : 'bg-white/5 text-white/80 hover:bg-white/10'}`}>
              <div className="h-6 w-6 rounded bg-white/10" />
              <div className="truncate">
                <div className="truncate text-xs font-medium">{t.title}</div>
                <div className="truncate text-[10px] text-white/60">{t.artist || ''}</div>
              </div>
            </button>
          )) : (
            <div className="px-2 py-2 text-xs text-white/60">Queue is empty</div>
          )}
        </div>
      )}
      {lyricsOpen && current?.id && (
        <LyricsDrawer trackId={current.id} onClose={toggleLyrics} />
      )}
    </div>
  );
}

function LyricsDrawer({ trackId, onClose }: { trackId: string; onClose: () => void }) {
  const [text, setText] = useState<string>("Loading lyrics...");
  useEffect(() => {
    let done = false;
    (async () => {
      try {
        const r = await fetch(`/api/lyrics?trackId=${encodeURIComponent(trackId)}`, { cache: "no-store" });
        const j = await r.json();
        if (!done) setText(String(j?.text || "No lyrics"));
      } catch { if (!done) setText("No lyrics"); }
    })();
    return () => { done = true; };
  }, [trackId]);
  return (
    <div className="absolute bottom-16 right-4 z-50 w-[420px] max-h-80 overflow-y-auto rounded-xl border border-white/10 bg-black/90 backdrop-blur p-3 text-xs text-white/80">
      <div className="mb-2 flex items-center justify-between">
        <div className="font-semibold text-white">Lyrics</div>
        <button onClick={onClose} className="text-white/60 hover:text-white">Close</button>
      </div>
      <pre className="whitespace-pre-wrap leading-relaxed">{text}</pre>
    </div>
  );
}

type PlayerChatOverlayProps = {
  onClose: () => void;
  onReact: (side: "champ" | "challenger") => void;
};

function PlayerChatOverlay({ onClose, onReact }: PlayerChatOverlayProps) {
  const [draft, setDraft] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  function send() {
    if (!draft.trim()) return;
    const next: ChatMessage = { id: `${Date.now()}-${Math.random().toString(36).slice(2)}`, text: draft.trim(), at: Date.now() };
    setMessages((prev) => [next, ...prev].slice(0, 10));
    if (/🔥|💥/u.test(draft)) onReact("champ");
    if (/👏|💯|🙌/u.test(draft)) onReact("challenger");
    setDraft("");
  }
  return (
    <div className="fixed bottom-16 right-4 z-50 w-[320px] rounded-2xl border border-white/10 bg-black/90 p-4 text-sm text-white/80 shadow-xl sm:right-6 sm:w-[320px] max-w-[90vw]">
      <div className="mb-2 flex items-center justify-between text-xs uppercase text-white/50">
        <span>Battle chat feed</span>
        <button onClick={onClose} className="text-white/60 hover:text-white">Close</button>
      </div>
      <div className="mb-3 max-h-40 space-y-2 overflow-y-auto">
        {messages.map((msg) => (
          <div key={msg.id} className="rounded-lg bg-white/5 px-3 py-2 text-xs text-white">
            <span className="text-white/50">{new Date(msg.at).toLocaleTimeString()}</span> · {msg.text}
          </div>
        ))}
        {messages.length === 0 && <div className="text-xs text-white/50">Drop reactions to tip the scale.</div>}
      </div>
      <div className="flex gap-2">
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && send()}
          className="flex-1 rounded border border-white/10 bg-black/60 px-3 py-1 text-xs text-white outline-none"
          placeholder="Type /react 🔥"
        />
        <button onClick={send} className="rounded bg-teal-500 px-3 py-1 text-xs font-semibold text-black">Send</button>
      </div>
    </div>
  );
}

type BattleBetOverlayProps = {
  onClose: () => void;
  votes: { champ: number; challenger: number };
  onVote: (side: "champ" | "challenger") => void;
  hasVotes: boolean;
};

function BattleBetOverlay({ onClose, votes, onVote, hasVotes }: BattleBetOverlayProps) {
  const winner = votes.champ === votes.challenger ? "Still leveling" : votes.champ > votes.challenger ? "Champion leads" : "Challenger leads";
  return (
    <div className="fixed bottom-16 left-4 z-50 w-[360px] rounded-2xl border border-white/10 bg-black/90 p-4 text-sm text-white shadow-xl sm:left-6 max-w-[90vw]">
      <div className="mb-2 flex items-center justify-between text-xs uppercase text-white/50">
        <span>Reaction bets</span>
        <button onClick={onClose} className="text-white/60 hover:text-white">Close</button>
      </div>
      <div className="mb-3 text-[11px] text-white/60">
        Positive reactions decide the wager. The side with the most cheers at the stream's end wins.
      </div>
      <div className="mb-3 grid gap-2 sm:grid-cols-2">
        <div className="rounded-xl border border-white/10 bg-white/5 p-3 text-center">
          <div className="text-xs text-white/50">Champion</div>
          <div className="text-lg font-semibold text-white">{votes.champ}</div>
          <button onClick={() => onVote("champ")} className="mt-2 inline-flex items-center justify-center gap-1 rounded-md border border-teal-500/40 px-2 py-1 text-[11px] text-teal-300 hover:bg-teal-500/10">
            +Reacts
          </button>
        </div>
        <div className="rounded-xl border border-white/10 bg-white/5 p-3 text-center">
          <div className="text-xs text-white/50">Challenger</div>
          <div className="text-lg font-semibold text-white">{votes.challenger}</div>
          <button onClick={() => onVote("challenger")} className="mt-2 inline-flex items-center justify-center gap-1 rounded-md border border-teal-500/40 px-2 py-1 text-[11px] text-teal-300 hover:bg-teal-500/10">
            +Reacts
          </button>
        </div>
      </div>
      <div className="flex items-center justify-between text-xs text-white/60">
        <span>{winner}</span>
        {hasVotes && <span className="text-teal-300">Wager locked</span>}
      </div>
    </div>
  );
}
