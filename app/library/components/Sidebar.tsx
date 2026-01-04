import React from 'react';
import { motion } from 'framer-motion';
import {
  Album as AlbumIcon,
  ListMusic,
  User as UserIcon,
  Radio,
  Waves,
  History,
  Settings as SettingsIcon,
  ChevronRight,
  ChevronLeft,
  BadgeCheck,
  Gauge,
  HardDrive,
  Image as ImageIcon,
  Gamepad2,
  Star,
  Home,
  TrendingUp,
  Clock,
  Heart,
  Download,
  Disc3,
} from 'lucide-react';
import { cn } from '../utils';
import { SectionKey } from '../types';

const MAIN_SECTIONS: { key: SectionKey; label: string; icon: React.ComponentType<any> }[] = [
  { key: "featured", label: "Home", icon: Home },
  { key: "songs", label: "My Music", icon: ListMusic },
  { key: "playlists", label: "Playlists", icon: Radio },
  { key: "albums", label: "Albums", icon: AlbumIcon },
  { key: "artists", label: "Artists", icon: UserIcon },
];

const DISCOVER_SECTIONS: { key: SectionKey; label: string; icon: React.ComponentType<any> }[] = [
  { key: "game", label: "STEMSTATION", icon: Gamepad2 },
  { key: "surf", label: "Surf", icon: Waves },
  { key: "mainframe", label: "Mainframe", icon: HardDrive },
];

const COLLECTION_SECTIONS: { key: SectionKey; label: string; icon: React.ComponentType<any> }[] = [
  { key: "posters", label: "Posters", icon: ImageIcon },
  { key: "trades", label: "Trades", icon: History },
  { key: "settings", label: "Settings", icon: SettingsIcon },
];

const EMOJI: Record<SectionKey, string> = {
  featured: "🏠",
  songs: "🎵",
  playlists: "🎧",
  albums: "💿",
  artists: "🧑‍🎤",
  posters: "🖼️",
  trades: "💱",
  mainframe: "🧠",
  surf: "🌊",
  game: "🎮",
  settings: "⚙️",
};

interface SidebarProps {
  collapsed: boolean;
  onToggle: () => void;
  selected: SectionKey;
  onSelect: (s: SectionKey) => void;
}

const SectionGroup = ({ title, sections, selected, onSelect, collapsed }: {
  title: string;
  sections: { key: SectionKey; label: string; icon: React.ComponentType<any> }[];
  selected: SectionKey;
  onSelect: (s: SectionKey) => void;
  collapsed: boolean;
}) => (
  <div className="space-y-2">
    {!collapsed && (
      <div className="px-4 py-2">
        <h3 className="text-xs font-medium text-white/40 uppercase tracking-wider">{title}</h3>
      </div>
    )}
    <div className="space-y-1">
      {sections.map(({ key, label, icon: Icon }) => {
        const active = key === selected;
        return (
          <motion.button
            key={key}
            onClick={() => onSelect(key)}
            whileHover={{ x: collapsed ? 0 : 4 }}
            whileTap={{ scale: 0.98 }}
            className={cn(
              "group flex w-full items-center gap-3 px-4 py-3 text-sm font-medium transition-all duration-200",
              active
                ? "text-white bg-gradient-to-r from-teal-500/20 to-transparent border-r-2 border-teal-400"
                : "text-white/70 hover:text-white hover:bg-white/5"
            )}
          >
            {collapsed ? (
              <span className="text-lg" aria-hidden>
                {EMOJI[key]}
              </span>
            ) : (
              <Icon className={cn("w-5 h-5", active ? "text-teal-400" : "text-white/60")} />
            )}
            {!collapsed && <span className="flex-1 text-left">{label}</span>}
            {!collapsed && active && <div className="w-2 h-2 rounded-full bg-teal-400 animate-pulse" />}
          </motion.button>
        );
      })}
    </div>
  </div>
);

export function Sidebar({ collapsed, onToggle, selected, onSelect }: SidebarProps) {
  return (
    <aside
      className={cn(
        "relative z-20 flex flex-col border-r border-white/5 bg-slate-950/50 backdrop-blur-xl",
        collapsed ? "w-20" : "w-72"
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-white/5">
        {!collapsed && (
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-teal-400 to-cyan-500 flex items-center justify-center">
              <Disc3 className="w-4 h-4 text-white" />
            </div>
            <div>
              <div className="text-sm font-medium text-white">My Library</div>
              <div className="text-xs text-white/60">Premium</div>
            </div>
          </div>
        )}
        <motion.button
          onClick={onToggle}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          className="p-2 text-white/60 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
        >
          {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </motion.button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-6 space-y-8 overflow-y-auto">
        <SectionGroup
          title="Library"
          sections={MAIN_SECTIONS}
          selected={selected}
          onSelect={onSelect}
          collapsed={collapsed}
        />

        <SectionGroup
          title="Discover"
          sections={DISCOVER_SECTIONS}
          selected={selected}
          onSelect={onSelect}
          collapsed={collapsed}
        />

        <SectionGroup
          title="Collection"
          sections={COLLECTION_SECTIONS}
          selected={selected}
          onSelect={onSelect}
          collapsed={collapsed}
        />
      </nav>

      {/* Footer */}
      {!collapsed && (
        <div className="p-4 border-t border-white/5">
          <div className="rounded-xl bg-gradient-to-br from-teal-500/10 via-cyan-500/5 to-transparent p-4 border border-white/5">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-teal-400 to-cyan-500 flex items-center justify-center">
                <Heart className="w-4 h-4 text-white" />
              </div>
              <div>
                <div className="text-sm font-medium text-white">Premium</div>
                <div className="text-xs text-white/60">HiFi Quality</div>
              </div>
            </div>
            <div className="space-y-2 text-xs text-white/70">
              <div className="flex justify-between">
                <span>Storage</span>
                <span className="text-teal-300">2.4GB / 10GB</span>
              </div>
              <div className="w-full bg-white/10 rounded-full h-1">
                <div className="bg-gradient-to-r from-teal-400 to-cyan-500 h-1 rounded-full w-1/4"></div>
              </div>
            </div>
          </div>
        </div>
      )}
    </aside>
  );
}
