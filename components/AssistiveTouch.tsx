"use client";
import { useEffect, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Home, Upload, Library, Users, Store, Sword, Bot, Compass, Cpu,
  Search, Settings, Wallet, Radio, Plus, Edit3, Zap, Heart,
  Volume2, Shuffle, SkipForward, Play, Pause, Mic, Camera,
  Keyboard, Moon, Sun, Accessibility, HelpCircle, X
} from "lucide-react";
import { useRouter } from "next/navigation";
import { usePlayerStore } from "@/stores/player";
import { useGlobalSearch } from "@/hooks/useGlobalSearch";

const ORB_SIZE = 56; // px (w-14 h-14)
const MARGIN = 8;
const ASSISTIVE_FOCUSABLE_SELECTOR = '[data-assistive-focusable="true"]';
const OVERLAY_ID = "assistive-touch-overlay";

export default function AssistiveTouch() {
  const router = useRouter();
  const { openSearch } = useGlobalSearch();
  const { current, isPlaying, play, pause, skipNext, volume, setVolume } = usePlayerStore();

  const [pos, setPos] = useState({ x: 40, y: 200 });
  const [open, setOpen] = useState(false);
  const [activeMenu, setActiveMenu] = useState<'main' | 'apps' | 'actions' | 'player' | 'settings'>('main');
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [reducedMotion, setReducedMotion] = useState(false);
  const [highContrast, setHighContrast] = useState(false);
  const [focusIndex, setFocusIndex] = useState(0);

  const snapToEdge = useCallback((p: { x: number; y: number }, vw?: number) => {
    const width = vw ?? (typeof window !== 'undefined' ? window.innerWidth : 0);
    const left = MARGIN;
    const right = Math.max(MARGIN, width - ORB_SIZE - MARGIN);
    const snapX = p.x < width / 2 ? left : right;
    return { x: snapX, y: p.y };
  }, []);

  useEffect(() => {
    const saved = localStorage.getItem("assistivePos");
    if (saved) {
      try {
        const p = JSON.parse(saved);
        // Clamp to viewport on load
        const vw = typeof window !== 'undefined' ? window.innerWidth : 0;
        const vh = typeof window !== 'undefined' ? window.innerHeight : 0;
        const x = Math.min(Math.max(p.x ?? 40, MARGIN), Math.max(MARGIN, vw - ORB_SIZE - MARGIN));
        const y = Math.min(Math.max(p.y ?? 200, MARGIN), Math.max(MARGIN, vh - ORB_SIZE - MARGIN));
        setPos({ x, y });
      } catch {}
    }
    const onResize = () => {
      const vw = window.innerWidth;
      const vh = window.innerHeight;
      setPos((prev) => {
        const x = Math.min(Math.max(prev.x, MARGIN), Math.max(MARGIN, vw - ORB_SIZE - MARGIN));
        const y = Math.min(Math.max(prev.y, MARGIN), Math.max(MARGIN, vh - ORB_SIZE - MARGIN));
        const snapped = snapToEdge({ x, y }, vw);
        localStorage.setItem("assistivePos", JSON.stringify(snapped));
        return snapped;
      });
    };
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [snapToEdge]);

  const handleToggle = useCallback(() => {
    setOpen((prev) => {
      const next = !prev;
      if (next) {
        setActiveMenu('main');
        setFocusIndex(0);
      }
      return next;
    });
  }, []);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Alt + A to toggle assistive touch
      if (e.altKey && e.key === 'a') {
        e.preventDefault();
        handleToggle();
      }

      // Escape to close
      if (e.key === 'Escape' && open) {
        setOpen(false);
      }

      // Arrow keys for navigation when open
      if (open && ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
        e.preventDefault();
        const focusable = Array.from(
          document.querySelectorAll<HTMLElement>(ASSISTIVE_FOCUSABLE_SELECTOR)
        );
        if (!focusable.length) return;
        const delta = ['ArrowUp', 'ArrowLeft'].includes(e.key) ? -1 : 1;
        const nextIndex = (focusIndex + delta + focusable.length) % focusable.length;
        setFocusIndex(nextIndex);
        focusable[nextIndex]?.focus();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [open, handleToggle, focusIndex]);

  // Load accessibility preferences
  useEffect(() => {
    const reduceMotionQuery =
      typeof window !== 'undefined'
        ? window.matchMedia('(prefers-reduced-motion: reduce)')
        : null;

    const darkModeStored = localStorage.getItem('darkMode');
    const reducedMotionStored = localStorage.getItem('reducedMotion');
    const highContrastStored = localStorage.getItem('highContrast');

    setIsDarkMode(darkModeStored !== 'false');
    setReducedMotion(
      reducedMotionStored !== null
        ? reducedMotionStored === 'true'
        : Boolean(reduceMotionQuery?.matches)
    );
    setHighContrast(highContrastStored === 'true');

    if (!reduceMotionQuery) return;
    const handleReduceChange = (event: MediaQueryListEvent) => {
      if (localStorage.getItem('reducedMotion') === null) {
        setReducedMotion(event.matches);
      }
    };
    reduceMotionQuery.addEventListener('change', handleReduceChange);
    return () => reduceMotionQuery.removeEventListener('change', handleReduceChange);
  }, []);

  // Reset focus when menu changes and focus first available control
  useEffect(() => {
    if (open) {
      setFocusIndex(0);
    }
  }, [activeMenu, open]);

  useEffect(() => {
    if (!open) return;
    const focusable = Array.from(
      document.querySelectorAll<HTMLElement>(ASSISTIVE_FOCUSABLE_SELECTOR)
    );
    if (!focusable.length) return;
    const clampedIndex = Math.min(focusIndex, focusable.length - 1);
    if (clampedIndex !== focusIndex) {
      setFocusIndex(clampedIndex);
      focusable[clampedIndex]?.focus();
      return;
    }
    focusable[clampedIndex]?.focus();
  }, [open, activeMenu, focusIndex]);

  // Quick actions
  const quickActions = [
    {
      label: "Search",
      icon: <Search size={16} />,
      action: () => { openSearch(); setOpen(false); },
      shortcut: "⌘K"
    },
    {
      label: "New Playlist",
      icon: <Plus size={16} />,
      action: () => { router.push("/library?new=playlist"); setOpen(false); }
    },
    {
      label: "Compose Post",
      icon: <Edit3 size={16} />,
      action: () => { router.push("/social?compose=1"); setOpen(false); }
    },
    {
      label: "Start Battle",
      icon: <Sword size={16} />,
      action: () => { router.push("/battles?new=1"); setOpen(false); }
    },
    {
      label: "Go Live",
      icon: <Radio size={16} />,
      action: () => { router.push("/live?setup=1"); setOpen(false); }
    },
    {
      label: "Open Wallet",
      icon: <Wallet size={16} />,
      action: () => { router.push("/wallet"); setOpen(false); }
    },
  ];

  // App navigation
  const appNavigation = [
    { icon: <Home size={18} />, path: "/", label: "Home" },
    { icon: <Upload size={18} />, path: "/upload", label: "Upload" },
    { icon: <Library size={18} />, path: "/library", label: "Library" },
    { icon: <Compass size={18} />, path: "/surf", label: "Surf" },
    { icon: <Users size={18} />, path: "/social", label: "Social" },
    { icon: <Store size={18} />, path: "/marketplace", label: "Marketplace" },
    { icon: <Sword size={18} />, path: "/battles", label: "Battles" },
    { icon: <Radio size={18} />, path: "/live", label: "Live" },
    { icon: <Cpu size={18} />, path: "/mainframe", label: "Mainframe" },
    { icon: <Bot size={18} />, path: "/ai", label: "AI" },
  ];

  return (
    <>
      <motion.div
        drag
        dragMomentum={false}
        onDragEnd={(_, info) => {
          const vw = window.innerWidth;
          const vh = window.innerHeight;
          let x = info.point.x;
          let y = info.point.y;
          // Clamp within viewport
          x = Math.min(Math.max(x, MARGIN), Math.max(MARGIN, vw - ORB_SIZE - MARGIN));
          y = Math.min(Math.max(y, MARGIN), Math.max(MARGIN, vh - ORB_SIZE - MARGIN));
          // Snap horizontally to nearest edge
          const snapped = snapToEdge({ x, y }, vw);
          setPos(snapped);
          localStorage.setItem("assistivePos", JSON.stringify(snapped));
        }}
        style={{
          left: pos.x,
          top: pos.y,
          position: "fixed",
          zIndex: 9999,
        }}
        onClick={handleToggle}
        whileHover={reducedMotion ? undefined : { scale: 1.1 }}
        role="button"
        aria-label="Assistive navigation"
        aria-expanded={open}
        aria-controls={OVERLAY_ID}
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            handleToggle();
          }
        }}
        className="flex items-center justify-center w-14 h-14 rounded-full cursor-pointer bg-gradient-to-br from-cyan-400/80 to-teal-600/80 shadow-lg border border-teal-300/30 backdrop-blur-md outline-none focus:ring-2 focus:ring-teal-300/60"
      >
        <div className="w-3 h-3 bg-white/90 rounded-full shadow-inner" />
      </motion.div>

      <AnimatePresence>
        {open && (
          <motion.div
            id={OVERLAY_ID}
            className={`fixed bg-black/80 backdrop-blur-xl rounded-xl border border-teal-300/20 z-[9998] ${
              highContrast ? 'border-white bg-black' : ''
            }`}
            initial={reducedMotion ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={reducedMotion ? { opacity: 0 } : { opacity: 0, scale: 0.5 }}
            transition={{ duration: reducedMotion ? 0 : 0.2 }}
            role="dialog"
            aria-modal="true"
            aria-label="Assistive navigation menu"
            style={{
              left: pos.x < (typeof window !== 'undefined' ? window.innerWidth / 2 : 300)
                ? pos.x + ORB_SIZE + 8
                : undefined,
              right: pos.x >= (typeof window !== 'undefined' ? window.innerWidth / 2 : 300)
                ? Math.max(MARGIN, (typeof window !== 'undefined' ? window.innerWidth : 0) - pos.x) + 8
                : undefined,
              top: pos.y,
              minWidth: '280px',
              maxWidth: '320px',
            }}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-3 border-b border-white/10">
              <h3 className="text-sm font-medium text-white">
                {activeMenu === 'main' && 'Assistive Touch'}
                {activeMenu === 'apps' && 'Quick Switch'}
                {activeMenu === 'actions' && 'Quick Actions'}
                {activeMenu === 'player' && 'Player Controls'}
                {activeMenu === 'settings' && 'Accessibility'}
              </h3>
              <button
                onClick={() => setOpen(false)}
                className="text-white/60 hover:text-white p-1 rounded"
                data-assistive-focusable="true"
                aria-label="Close"
              >
                <X size={16} />
              </button>
            </div>

            {/* Main Menu */}
            {activeMenu === 'main' && (
              <div className="p-3 space-y-3">
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => setActiveMenu('apps')}
                    className="flex flex-col items-center gap-2 p-3 rounded-lg bg-white/5 hover:bg-white/10 transition-colors"
                    data-assistive-focusable="true"
                  >
                    <Compass size={20} className="text-teal-300" />
                    <span className="text-xs text-white/80">Apps</span>
                  </button>
                  <button
                    onClick={() => setActiveMenu('actions')}
                    className="flex flex-col items-center gap-2 p-3 rounded-lg bg-white/5 hover:bg-white/10 transition-colors"
                    data-assistive-focusable="true"
                  >
                    <Zap size={20} className="text-yellow-300" />
                    <span className="text-xs text-white/80">Actions</span>
                  </button>
                  <button
                    onClick={() => setActiveMenu('player')}
                    className="flex flex-col items-center gap-2 p-3 rounded-lg bg-white/5 hover:bg-white/10 transition-colors"
                    data-assistive-focusable="true"
                  >
                    <Play size={20} className="text-purple-300" />
                    <span className="text-xs text-white/80">Player</span>
                  </button>
                  <button
                    onClick={() => setActiveMenu('settings')}
                    className="flex flex-col items-center gap-2 p-3 rounded-lg bg-white/5 hover:bg-white/10 transition-colors"
                    data-assistive-focusable="true"
                  >
                    <Settings size={20} className="text-blue-300" />
                    <span className="text-xs text-white/80">Settings</span>
                  </button>
                </div>

                {/* Quick shortcuts */}
                <div className="border-t border-white/10 pt-3">
                  <div className="grid grid-cols-3 gap-2">
                    <button
                      onClick={() => { openSearch(); setOpen(false); }}
                      className="flex flex-col items-center gap-1 p-2 rounded-md bg-white/5 hover:bg-white/10 transition-colors"
                      data-assistive-focusable="true"
                    >
                      <Search size={16} className="text-teal-300" />
                      <span className="text-[10px] text-white/60">Search</span>
                    </button>
                    <button
                      onClick={() => { router.push("/library?new=playlist"); setOpen(false); }}
                      className="flex flex-col items-center gap-1 p-2 rounded-md bg-white/5 hover:bg-white/10 transition-colors"
                      data-assistive-focusable="true"
                    >
                      <Plus size={16} className="text-green-300" />
                      <span className="text-[10px] text-white/60">Playlist</span>
                    </button>
                    <button
                      onClick={() => { router.push("/settings"); setOpen(false); }}
                      className="flex flex-col items-center gap-1 p-2 rounded-md bg-white/5 hover:bg-white/10 transition-colors"
                      data-assistive-focusable="true"
                    >
                      <Settings size={16} className="text-blue-300" />
                      <span className="text-[10px] text-white/60">Settings</span>
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Apps Menu */}
            {activeMenu === 'apps' && (
              <div className="p-3">
                <button
                  onClick={() => setActiveMenu('main')}
                  className="mb-3 text-xs text-teal-300 hover:text-teal-200"
                  data-assistive-focusable="true"
                >
                  ← Back
                </button>
                <div className="grid grid-cols-3 gap-2">
                  {appNavigation.map((app, i) => (
                    <button
                      key={i}
                      onClick={() => { router.push(app.path); setOpen(false); }}
                      aria-label={app.label}
                      className="flex flex-col items-center gap-2 p-3 rounded-lg bg-white/5 hover:bg-teal-600/20 transition-colors border border-teal-300/20"
                      data-assistive-focusable="true"
                    >
                      {app.icon}
                      <span className="text-[10px] text-white/80">{app.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Actions Menu */}
            {activeMenu === 'actions' && (
              <div className="p-3">
                <button
                  onClick={() => setActiveMenu('main')}
                  className="mb-3 text-xs text-teal-300 hover:text-teal-200"
                  data-assistive-focusable="true"
                >
                  ← Back
                </button>
                <div className="space-y-2">
                  {quickActions.map((action, i) => (
                    <button
                      key={i}
                      onClick={action.action}
                      className="flex items-center gap-3 w-full p-3 rounded-lg bg-white/5 hover:bg-white/10 transition-colors text-left"
                      data-assistive-focusable="true"
                    >
                      {action.icon}
                      <div className="flex-1">
                        <div className="text-sm text-white">{action.label}</div>
                        {action.shortcut && (
                          <div className="text-xs text-white/50">{action.shortcut}</div>
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Player Menu */}
            {activeMenu === 'player' && (
              <div className="p-3">
                <button
                  onClick={() => setActiveMenu('main')}
                  className="mb-3 text-xs text-teal-300 hover:text-teal-200"
                  data-assistive-focusable="true"
                >
                  ← Back
                </button>

                {current ? (
                  <div className="space-y-3">
                    <div className="bg-white/5 rounded-lg p-3">
                      <div className="text-sm font-medium text-white truncate">{current.title}</div>
                      <div className="text-xs text-white/60 truncate">{current.artist}</div>
                    </div>

                    <div className="flex items-center justify-center gap-4">
                      <button
                        onClick={skipNext}
                        className="p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
                        data-assistive-focusable="true"
                      >
                        <SkipForward size={16} className="rotate-180" />
                      </button>
                      <button
                        onClick={() => isPlaying ? pause() : play()}
                        className="p-3 rounded-full bg-teal-600 hover:bg-teal-700 transition-colors"
                        data-assistive-focusable="true"
                      >
                        {isPlaying ? <Pause size={20} /> : <Play size={20} />}
                      </button>
                      <button
                        onClick={skipNext}
                        className="p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
                        data-assistive-focusable="true"
                      >
                        <SkipForward size={16} />
                      </button>
                    </div>

                    <div className="flex items-center gap-2">
                      <Volume2 size={16} className="text-white/60" />
                      <input
                        type="range"
                        min={0}
                        max={1}
                        step={0.05}
                        value={volume}
                        onChange={(e) => setVolume(Number(e.target.value))}
                        className="flex-1 h-1 bg-white/20 rounded-lg"
                      />
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-6 text-white/60">
                    <div className="text-sm">No track playing</div>
                    <button
                      onClick={() => { router.push("/library"); setOpen(false); }}
                      className="mt-2 text-xs text-teal-300 hover:text-teal-200"
                      data-assistive-focusable="true"
                    >
                      Browse Music
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Settings Menu */}
            {activeMenu === 'settings' && (
              <div className="p-3">
                <button
                  onClick={() => setActiveMenu('main')}
                  className="mb-3 text-xs text-teal-300 hover:text-teal-200"
                  data-assistive-focusable="true"
                >
                  ← Back
                </button>

                <div className="space-y-3">
                  <div>
                    <h4 className="text-xs font-medium text-white/80 mb-2">Accessibility</h4>
                    <div className="space-y-2">
                      <button
                        onClick={() => {
                          setReducedMotion(!reducedMotion);
                          localStorage.setItem('reducedMotion', (!reducedMotion).toString());
                        }}
                        className="flex items-center justify-between w-full p-2 rounded-lg bg-white/5 hover:bg-white/10 transition-colors"
                        data-assistive-focusable="true"
                        aria-pressed={reducedMotion}
                      >
                        <span className="text-sm text-white">Reduced Motion</span>
                        <div className={`w-8 h-4 rounded-full transition-colors ${reducedMotion ? 'bg-teal-600' : 'bg-white/20'}`}>
                          <div className={`w-3 h-3 bg-white rounded-full mt-0.5 transition-transform ${reducedMotion ? 'translate-x-4' : 'translate-x-0.5'}`} />
                        </div>
                      </button>

                      <button
                        onClick={() => {
                          setHighContrast(!highContrast);
                          localStorage.setItem('highContrast', (!highContrast).toString());
                        }}
                        className="flex items-center justify-between w-full p-2 rounded-lg bg-white/5 hover:bg-white/10 transition-colors"
                        data-assistive-focusable="true"
                        aria-pressed={highContrast}
                      >
                        <span className="text-sm text-white">High Contrast</span>
                        <div className={`w-8 h-4 rounded-full transition-colors ${highContrast ? 'bg-teal-600' : 'bg-white/20'}`}>
                          <div className={`w-3 h-3 bg-white rounded-full mt-0.5 transition-transform ${highContrast ? 'translate-x-4' : 'translate-x-0.5'}`} />
                        </div>
                      </button>
                    </div>
                  </div>

                  <div>
                    <h4 className="text-xs font-medium text-white/80 mb-2">Shortcuts</h4>
                    <div className="space-y-1 text-xs text-white/60">
                      <div>Alt + A: Toggle Assistive Touch</div>
                      <div>Cmd/Ctrl + K: Global Search</div>
                      <div>Escape: Close menus</div>
                    </div>
                  </div>

                  <button
                    onClick={() => { router.push("/settings/accessibility"); setOpen(false); }}
                    className="flex items-center gap-2 w-full p-2 rounded-lg bg-white/5 hover:bg-white/10 transition-colors"
                    data-assistive-focusable="true"
                  >
                    <Accessibility size={16} />
                    <span className="text-sm text-white">More Settings</span>
                  </button>
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
