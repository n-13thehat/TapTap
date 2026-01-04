"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { 
  Home,
  Music,
  Users,
  ShoppingBag,
  Swords,
  Waves,
  Palette,
  Library,
  Globe,
  Bot,
  Telescope,
  Settings,
  Wallet,
  Upload,
  Radio,
  MessageCircle,
  Bell,
  Search,
  Menu,
  X,
  ChevronLeft,
  ChevronRight,
  Terminal,
  LogOut,
  User,
  Crown,
  Zap
} from "lucide-react";
import { signOut } from "next-auth/react";

interface NavItem {
  href: string;
  label: string;
  icon: React.ComponentType<any>;
  category: string;
  requiresAuth?: boolean;
  requiresCreator?: boolean;
}

const navigationItems: NavItem[] = [
  // Main
  { href: '/dashboard', label: 'Dashboard', icon: Home, category: 'main' },
  { href: '/social', label: 'Social', icon: Users, category: 'main' },
  { href: '/library', label: 'Library', icon: Library, category: 'main' },
  
  // Create & Gaming
  { href: '/creator', label: 'Creator Hub', icon: Palette, category: 'create', requiresCreator: true },
  { href: '/upload', label: 'Upload', icon: Upload, category: 'create', requiresCreator: true },
  { href: '/stemstation', label: 'STEMSTATION', icon: Music, category: 'gaming' },
  { href: '/battles', label: 'Battles', icon: Swords, category: 'gaming' },
  { href: '/live', label: 'Live Stream', icon: Radio, category: 'gaming' },
  
  // Discover & Trade
  { href: '/explore', label: 'Explore', icon: Globe, category: 'discover' },
  { href: '/discover', label: 'Discover', icon: Search, category: 'discover' },
  { href: '/marketplace', label: 'Marketplace', icon: ShoppingBag, category: 'trade' },
  { href: '/surf', label: 'Surf', icon: Waves, category: 'discover' },
  
  // Advanced
  { href: '/ai', label: 'AI Agents', icon: Bot, category: 'advanced' },
  { href: '/astro', label: 'Astro Tech', icon: Telescope, category: 'advanced' },
  { href: '/mainframe', label: 'Mainframe', icon: Terminal, category: 'advanced' },
  
  // Account
  { href: '/messages', label: 'Messages', icon: MessageCircle, category: 'account' },
  { href: '/wallet', label: 'Wallet', icon: Wallet, category: 'account' },
  { href: '/settings', label: 'Settings', icon: Settings, category: 'account' }
];

const categoryLabels = {
  main: 'Main',
  create: 'Create',
  gaming: 'Gaming',
  discover: 'Discover', 
  trade: 'Trade',
  advanced: 'Advanced',
  account: 'Account'
};

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const pathname = usePathname();
  const { user, isCreator, isAdmin } = useAuth();

  const filteredItems = navigationItems.filter(item => {
    if (item.requiresCreator && !isCreator && !isAdmin) return false;
    return true;
  });

  const groupedItems = filteredItems.reduce((acc, item) => {
    if (!acc[item.category]) acc[item.category] = [];
    acc[item.category].push(item);
    return acc;
  }, {} as Record<string, NavItem[]>);

  const getEmoji = (label: string) => {
    const map: Record<string, string> = {
      Dashboard: "🏠",
      Social: "💬",
      Library: "🎵",
      "Creator Hub": "🎨",
      Upload: "⏫",
      STEMSTATION: "🎮",
      Battles: "⚔️",
      "Live Stream": "📡",
      Explore: "🧭",
      Discover: "🔍",
      Marketplace: "🏪",
      Surf: "🌊",
      "AI Agents": "🤖",
      "Astro Tech": "🔭",
      Mainframe: "🧠",
      Messages: "✉️",
      Wallet: "👛",
      Settings: "⚙️",
    };
    return map[label] || "•";
  };

  const handleSignOut = () => {
    signOut({ callbackUrl: '/' });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-slate-950 to-black text-white">
      {/* Mobile menu button */}
      <div className="lg:hidden fixed top-4 left-4 z-50">
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="p-2 rounded-lg bg-black/80 border border-white/10 text-white hover:bg-white/10 transition-colors"
        >
          {sidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {/* Sidebar */}
      <aside className={`
        fixed left-0 top-0 z-40 h-screen ${sidebarCollapsed ? 'w-20' : 'w-64'} border-r border-white/10 bg-black/90 backdrop-blur-xl
        transform transition-transform duration-300 ease-in-out
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
        lg:translate-x-0
      `}>
        <div className="flex h-full flex-col">
          {/* Header */}
          <div className="border-b border-white/10 p-4 flex items-center justify-between gap-3">
            {!sidebarCollapsed && (
              <Link href="/dashboard" className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-teal-400 to-cyan-400 flex items-center justify-center">
                  <Terminal className="h-6 w-6 text-black" />
                </div>
                <div>
                  <div className="font-bold text-white">TapTap Matrix</div>
                  <div className="text-xs text-white/60">ZION Dashboard</div>
                </div>
              </Link>
            )}
            {sidebarCollapsed && (
              <div className="flex items-center gap-2">
                <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-teal-400 to-cyan-400 flex items-center justify-center">
                  <Terminal className="h-6 w-6 text-black" />
                </div>
              </div>
            )}
            <button
              onClick={() => setSidebarCollapsed((c) => !c)}
              className="p-2 rounded-lg bg-white/5 border border-white/10 text-white/70 hover:text-white hover:bg-white/10 transition-colors"
              title={sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
            >
              {sidebarCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
            </button>
          </div>

          {/* User Info */}
          {!sidebarCollapsed && (
            <div className="border-b border-white/10 p-4">
              <div className="flex items-center gap-3">
                <div className="h-8 w-8 rounded-full bg-teal-500/20 border border-teal-400/30 flex items-center justify-center">
                  <User className="h-4 w-4 text-teal-300" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-white truncate">
                    {user?.username || user?.name || 'User'}
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="text-xs text-white/60">{user?.role}</div>
                    {isCreator && <Crown className="h-3 w-3 text-amber-400" />}
                    {isAdmin && <Zap className="h-3 w-3 text-red-400" />}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Navigation */}
          <nav className="flex-1 overflow-y-auto p-3 space-y-4">
            {Object.entries(groupedItems).map(([category, items]) => (
              <div key={category}>
                {!sidebarCollapsed && (
                  <div className="text-xs font-semibold text-white/40 uppercase tracking-wider mb-3 px-1">
                    {categoryLabels[category as keyof typeof categoryLabels]}
                  </div>
                )}
                <div className="space-y-1">
                  {items.map(item => {
                    const isActive = pathname === item.href;
                    const emoji = getEmoji(item.label);
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        onClick={() => setSidebarOpen(false)}
                        className={`
                          flex items-center ${sidebarCollapsed ? 'justify-center' : 'gap-3'} px-3 py-2 rounded-lg text-sm transition-colors
                          ${isActive 
                            ? 'bg-teal-500/20 border border-teal-400/30 text-teal-300' 
                            : 'text-white/70 hover:text-white hover:bg-white/5'
                          }
                        `}
                        title={sidebarCollapsed ? item.label : undefined}
                      >
                        {sidebarCollapsed ? (
                          <span className="text-lg">{emoji}</span>
                        ) : (
                          <item.icon className="h-4 w-4 flex-shrink-0" />
                        )}
                        {!sidebarCollapsed && <span className="truncate">{item.label}</span>}
                      </Link>
                    );
                  })}
                </div>
              </div>
            ))}
          </nav>

          {/* Footer */}
          {!sidebarCollapsed && (
            <div className="border-t border-white/10 p-4">
              <button
                onClick={handleSignOut}
                className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-white/70 hover:text-white hover:bg-white/5 transition-colors w-full"
              >
                <LogOut className="h-4 w-4" />
                <span>Sign Out</span>
              </button>
            </div>
          )}
        </div>
      </aside>

      {/* Main content */}
      <div className="lg:ml-64">
        {children}
      </div>

      {/* Mobile overlay */}
      {sidebarOpen && (
        <div 
          className="lg:hidden fixed inset-0 z-30 bg-black/50 backdrop-blur-sm"
          onClick={() => setSidebarOpen(false)}
        />
      )}
    </div>
  );
}
