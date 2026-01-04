"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Home,
  Flame,
  Library as LibraryIcon,
  Mic2,
  ShoppingCart,
  Swords,
  Waves,
  Radio,
  MessageSquareText,
  Compass,
  Disc,
  Wallet as WalletIcon,
  Settings,
  Gamepad2,
  Crown,
} from "lucide-react";

type Item = {
  href: string;
  label: string;
  emoji: string;
  icon: React.ComponentType<{ className?: string }>;
  description: string;
};

const NAV: Item[] = [
  { href: "/", label: "Home", emoji: "🏠", icon: Home, description: "Your digital sanctuary" },
  { href: "/social", label: "Social", emoji: "🔥", icon: Flame, description: "Connect & vibe" },
  { href: "/library", label: "Library", emoji: "📚", icon: LibraryIcon, description: "Your music vault" },
  { href: "/creator", label: "Creator", emoji: "🎤", icon: Mic2, description: "Build your sound" },
  { href: "/marketplace", label: "Marketplace", emoji: "🛒", icon: ShoppingCart, description: "Trade & discover" },
  { href: "/battles", label: "Battles", emoji: "⚔️", icon: Swords, description: "Compete & conquer" },
  { href: "/surf", label: "Surf", emoji: "🌊", icon: Waves, description: "Ride the waves" },
  { href: "/live", label: "Live", emoji: "📻", icon: Radio, description: "Real-time streams" },
  { href: "/dm", label: "Messages", emoji: "💬", icon: MessageSquareText, description: "Private channels" },
  { href: "/explore", label: "Explore", emoji: "🧭", icon: Compass, description: "Find new worlds" },
  { href: "/beta", label: "Beta Community", emoji: "👑", icon: Crown, description: "Elite access" },
  { href: "/mainframe", label: "Mainframe", emoji: "💿", icon: Disc, description: "Core systems" },
  { href: "/wallet", label: "Wallet", emoji: "💰", icon: WalletIcon, description: "Digital assets" },
  { href: "/stemstation", label: "StemStation", emoji: "🎮", icon: Gamepad2, description: "Rhythm gaming" },
  { href: "/settings", label: "Settings", emoji: "⚙️", icon: Settings, description: "System config" },
];

// Mini Matrix Rain Component for Sidebar
const MiniMatrixRain = ({ isActive }: { isActive: boolean }) => {
  if (!isActive) return null;

  return (
    <div className="absolute inset-0 overflow-hidden rounded-md pointer-events-none">
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-cyan-500/5 to-transparent animate-pulse" />
      {[...Array(3)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute w-px bg-gradient-to-b from-transparent via-cyan-400/60 to-transparent"
          style={{
            left: `${20 + i * 30}%`,
            height: '100%',
          }}
          animate={{
            opacity: [0, 1, 0],
            scaleY: [0, 1, 0],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            delay: i * 0.3,
            ease: "easeInOut",
          }}
        />
      ))}
    </div>
  );
};

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden md:block w-72 shrink-0 border-r border-cyan-500/20 bg-black/80 backdrop-blur-xl p-4 relative overflow-hidden">
      {/* Sidebar Background Effects */}
      <div className="absolute inset-0 bg-gradient-to-b from-cyan-500/5 via-transparent to-purple-500/5 pointer-events-none" />
      <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-cyan-400/50 to-transparent" />

      {/* Enhanced Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="mb-6 flex items-center gap-3 relative z-10"
      >
        <motion.div
          className="h-8 w-8 rounded-xl bg-gradient-to-br from-cyan-400/20 to-purple-500/20 ring-2 ring-cyan-400/30 flex items-center justify-center"
          whileHover={{ scale: 1.1, rotate: 5 }}
          whileTap={{ scale: 0.95 }}
        >
          <span className="text-lg">🎵</span>
        </motion.div>
        <div className="flex flex-col">
          <div className="text-lg font-bold bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent">
            TapTap
          </div>
          <div className="text-xs text-cyan-300/60 font-mono">
            NEURAL NETWORK
          </div>
        </div>
      </motion.div>

      {/* Enhanced Navigation */}
      <nav className="space-y-2 relative z-10">
        {NAV.map((item, index) => {
          const active = pathname === item.href || pathname?.startsWith(`${item.href}/`);
          const Icon = item.icon;

          return (
            <motion.div
              key={item.href}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.4, delay: index * 0.05 }}
              className="relative"
            >
              <Link
                href={item.href}
                className={`group relative flex items-center gap-4 rounded-xl border px-4 py-3 text-sm transition-all duration-300 overflow-hidden
                  ${active
                    ? "border-cyan-400/50 bg-gradient-to-r from-cyan-500/20 to-purple-500/10 text-cyan-100 shadow-lg shadow-cyan-500/20"
                    : "border-white/10 bg-white/5 text-white/70 hover:bg-gradient-to-r hover:from-white/10 hover:to-cyan-500/5 hover:border-cyan-400/30 hover:text-white/90"}
                `}
              >
                {/* Matrix Rain Effect for Active Items */}
                <MiniMatrixRain isActive={active} />

                {/* Icon and Emoji Container */}
                <div className="relative flex items-center gap-3 z-10">
                  <motion.div
                    className={`flex items-center justify-center w-8 h-8 rounded-lg transition-all duration-300
                      ${active
                        ? "bg-cyan-400/20 text-cyan-300"
                        : "bg-white/10 text-white/60 group-hover:bg-cyan-400/10 group-hover:text-cyan-400"}
                    `}
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                  >
                    <span className="text-base">{item.emoji}</span>
                  </motion.div>

                  <Icon className={`h-4 w-4 transition-all duration-300 ${
                    active ? "text-cyan-300" : "text-white/50 group-hover:text-cyan-400"
                  }`} />
                </div>

                {/* Label and Description */}
                <div className="flex flex-col min-w-0 flex-1 z-10">
                  <span className={`font-medium transition-all duration-300 ${
                    active ? "text-cyan-100" : "text-white/80 group-hover:text-white"
                  }`}>
                    {item.label}
                  </span>
                  <span className={`text-xs transition-all duration-300 ${
                    active ? "text-cyan-300/70" : "text-white/40 group-hover:text-cyan-400/60"
                  }`}>
                    {item.description}
                  </span>
                </div>

                {/* Active Indicator */}
                {active && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="w-2 h-2 rounded-full bg-cyan-400 shadow-lg shadow-cyan-400/50 z-10"
                  />
                )}

                {/* Hover Glow Effect */}
                <div className={`absolute inset-0 rounded-xl transition-opacity duration-300 pointer-events-none
                  ${active
                    ? "bg-gradient-to-r from-cyan-500/10 to-purple-500/5 opacity-100"
                    : "bg-gradient-to-r from-cyan-500/5 to-purple-500/5 opacity-0 group-hover:opacity-100"}
                `} />
              </Link>
            </motion.div>
          );
        })}
      </nav>

      {/* Bottom Accent */}
      <div className="absolute bottom-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-cyan-400/50 to-transparent" />
    </aside>
  );
}
