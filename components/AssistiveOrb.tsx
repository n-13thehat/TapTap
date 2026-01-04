"use client";

import { useState, useEffect } from 'react';
import { 
  Search, 
  Music, 
  Users, 
  Zap, 
  ShoppingBag, 
  Wallet, 
  Settings,
  Plus,
  Radio,
  Gamepad2,
  Mic,
  X
} from 'lucide-react';
import { useRouter } from 'next/navigation';

interface AssistiveOrbProps {
  className?: string;
}

export default function AssistiveOrb({ className = '' }: AssistiveOrbProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const router = useRouter();

  // Quick switch destinations from manifest
  const quickSwitchItems = [
    { id: 'surf', name: 'Surf', icon: <Radio size={16} />, route: '/surf' },
    { id: 'library', name: 'Library', icon: <Music size={16} />, route: '/library' },
    { id: 'social', name: 'Social', icon: <Users size={16} />, route: '/social' },
    { id: 'battles', name: 'Battles', icon: <Zap size={16} />, route: '/battles' },
    { id: 'marketplace', name: 'Marketplace', icon: <ShoppingBag size={16} />, route: '/marketplace' },
    { id: 'wallet', name: 'Wallet', icon: <Wallet size={16} />, route: '/wallet' },
    { id: 'creator', name: 'Creator', icon: <Mic size={16} />, route: '/creator' },
    { id: 'live', name: 'Live', icon: <Radio size={16} />, route: '/live' },
    { id: 'settings', name: 'Settings', icon: <Settings size={16} />, route: '/settings' },
  ];

  // Quick actions from manifest
  const quickActions = [
    { id: 'new-playlist', name: 'New Playlist', icon: <Plus size={16} />, action: () => console.log('New Playlist') },
    { id: 'compose-post', name: 'Compose Post', icon: <Plus size={16} />, action: () => router.push('/social?compose=true') },
    { id: 'start-battle', name: 'Start Battle', icon: <Zap size={16} />, action: () => router.push('/battles/create') },
    { id: 'open-wallet', name: 'Open Wallet', icon: <Wallet size={16} />, action: () => router.push('/wallet') },
    { id: 'go-live', name: 'Go Live', icon: <Radio size={16} />, action: () => router.push('/live/start') },
    { id: 'create-tapgame', name: 'Create TapGame', icon: <Gamepad2 size={16} />, action: () => router.push('/creator/tapgame') },
  ];

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Mod+K to open search (Cmd on Mac, Ctrl on Windows)
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsOpen(true);
      }
      
      // Escape to close
      if (e.key === 'Escape') {
        setIsOpen(false);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleQuickSwitch = (route: string) => {
    router.push(route);
    setIsOpen(false);
  };

  const handleQuickAction = (action: () => void) => {
    action();
    setIsOpen(false);
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/search?q=${encodeURIComponent(searchQuery)}`);
      setIsOpen(false);
      setSearchQuery('');
    }
  };

  return (
    <>
      {/* Orb Trigger Button */}
      <button
        onClick={() => setIsOpen(true)}
        className={`fixed bottom-6 right-6 w-14 h-14 bg-gradient-to-r from-purple-600 to-blue-600 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 flex items-center justify-center z-40 ${className}`}
        aria-label="Open Assistive Orb"
      >
        <Search size={20} className="text-white" />
      </button>

      {/* Orb Modal */}
      {isOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-gray-900 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[80vh] overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-white/10">
              <h2 className="text-xl font-semibold text-white">Assistive Orb</h2>
              <button
                onClick={() => setIsOpen(false)}
                className="text-white/60 hover:text-white transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            {/* Search */}
            <div className="p-6 border-b border-white/10">
              <form onSubmit={handleSearch}>
                <div className="relative">
                  <Search size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-white/40" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search tracks, artists, albums, users..."
                    className="w-full bg-white/10 border border-white/20 rounded-lg pl-10 pr-4 py-3 text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-purple-500"
                    autoFocus
                  />
                </div>
              </form>
              <div className="text-xs text-white/60 mt-2">
                Press <kbd className="bg-white/10 px-1 rounded">⌘K</kbd> to open • <kbd className="bg-white/10 px-1 rounded">Esc</kbd> to close
              </div>
            </div>

            <div className="flex">
              {/* Quick Switch */}
              <div className="flex-1 p-6">
                <h3 className="text-sm font-medium text-white/80 mb-4">Quick Switch</h3>
                <div className="space-y-2">
                  {quickSwitchItems.map((item) => (
                    <button
                      key={item.id}
                      onClick={() => handleQuickSwitch(item.route)}
                      className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-white/80 hover:bg-white/10 hover:text-white transition-colors text-left"
                    >
                      {item.icon}
                      <span>{item.name}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Quick Actions */}
              <div className="flex-1 p-6 border-l border-white/10">
                <h3 className="text-sm font-medium text-white/80 mb-4">Quick Actions</h3>
                <div className="space-y-2">
                  {quickActions.map((action) => (
                    <button
                      key={action.id}
                      onClick={() => handleQuickAction(action.action)}
                      className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-white/80 hover:bg-white/10 hover:text-white transition-colors text-left"
                    >
                      {action.icon}
                      <span>{action.name}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="px-6 py-4 bg-white/5 text-center">
              <p className="text-xs text-white/60">
                Navigate faster with the Assistive Orb • Powered by TapTap Matrix
              </p>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
