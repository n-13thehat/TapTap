"use client";

import { useState } from 'react';
import { useAuth, usePermissions } from '@/hooks/useAuth';
import { 
  Palette, 
  Mic, 
  Upload, 
  BarChart3, 
  Users, 
  Zap,
  Crown,
  User,
  Loader2
} from 'lucide-react';

interface CreatorModeToggleProps {
  className?: string;
  showDetails?: boolean;
}

export default function CreatorModeToggle({ 
  className = '', 
  showDetails = false 
}: CreatorModeToggleProps) {
  const { isCreator, toggleCreatorMode, loading } = useAuth();
  const permissions = usePermissions();
  const [isToggling, setIsToggling] = useState(false);

  const handleToggle = async () => {
    try {
      setIsToggling(true);
      toggleCreatorMode();
      
      // Emit analytics event
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('taptap:creator-mode-toggled', {
          detail: { enabled: !isCreator }
        }));
      }
    } catch (error) {
      console.error('Failed to toggle creator mode:', error);
    } finally {
      setIsToggling(false);
    }
  };

  const creatorFeatures = [
    {
      icon: <Upload size={16} />,
      label: 'Upload Tracks',
      enabled: permissions.canUploadTracks
    },
    {
      icon: <Mic size={16} />,
      label: 'Go Live',
      enabled: permissions.canGoLive
    },
    {
      icon: <BarChart3 size={16} />,
      label: 'Analytics',
      enabled: permissions.canAccessAnalytics
    },
    {
      icon: <Users size={16} />,
      label: 'Creator Tools',
      enabled: permissions.canAccessCreatorTools
    }
  ];

  return (
    <div className={`${className}`}>
      {/* Toggle Button */}
      <button
        onClick={handleToggle}
        disabled={loading || isToggling}
        className={`
          flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200
          ${isCreator 
            ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg shadow-purple-500/25' 
            : 'bg-white/10 border border-white/20 text-white/80 hover:bg-white/20'
          }
          disabled:opacity-50 disabled:cursor-not-allowed
        `}
      >
        {isToggling ? (
          <Loader2 className="animate-spin" size={20} />
        ) : isCreator ? (
          <Crown size={20} className="text-yellow-300" />
        ) : (
          <User size={20} />
        )}
        
        <div className="flex flex-col items-start">
          <span className="font-medium">
            {isCreator ? 'Creator Mode' : 'Listener Mode'}
          </span>
          {showDetails && (
            <span className="text-xs opacity-75">
              {isCreator ? 'Full creator features' : 'Basic listening features'}
            </span>
          )}
        </div>
        
        {/* Toggle Switch */}
        <div className={`
          relative w-12 h-6 rounded-full transition-colors duration-200
          ${isCreator ? 'bg-white/20' : 'bg-white/10'}
        `}>
          <div className={`
            absolute top-1 w-4 h-4 bg-white rounded-full transition-transform duration-200
            ${isCreator ? 'translate-x-7' : 'translate-x-1'}
          `} />
        </div>
      </button>

      {/* Feature List */}
      {showDetails && (
        <div className="mt-4 space-y-2">
          <h4 className="text-sm font-medium text-white/80 mb-3">
            {isCreator ? 'Active Features:' : 'Creator Features:'}
          </h4>
          
          <div className="grid grid-cols-2 gap-2">
            {creatorFeatures.map((feature, index) => (
              <div
                key={index}
                className={`
                  flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors
                  ${feature.enabled && isCreator
                    ? 'bg-green-500/20 text-green-300 border border-green-500/30'
                    : 'bg-white/5 text-white/60 border border-white/10'
                  }
                `}
              >
                {feature.icon}
                <span>{feature.label}</span>
                {feature.enabled && isCreator && (
                  <Zap size={12} className="ml-auto text-green-400" />
                )}
              </div>
            ))}
          </div>
          
          {!isCreator && (
            <div className="mt-3 p-3 bg-purple-500/10 border border-purple-500/20 rounded-lg">
              <p className="text-xs text-purple-300">
                💡 Enable Creator Mode to unlock upload, live streaming, analytics, and more!
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/**
 * Compact version for navigation bars
 */
export function CreatorModeToggleCompact({ className = '' }: { className?: string }) {
  const { isCreator, toggleCreatorMode, loading } = useAuth();
  const [isToggling, setIsToggling] = useState(false);

  const handleToggle = async () => {
    try {
      setIsToggling(true);
      toggleCreatorMode();
    } catch (error) {
      console.error('Failed to toggle creator mode:', error);
    } finally {
      setIsToggling(false);
    }
  };

  return (
    <button
      onClick={handleToggle}
      disabled={loading || isToggling}
      className={`
        flex items-center gap-2 px-3 py-2 rounded-lg transition-all duration-200
        ${isCreator 
          ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white' 
          : 'bg-white/10 text-white/80 hover:bg-white/20'
        }
        disabled:opacity-50 disabled:cursor-not-allowed
        ${className}
      `}
      title={isCreator ? 'Switch to Listener Mode' : 'Switch to Creator Mode'}
    >
      {isToggling ? (
        <Loader2 className="animate-spin" size={16} />
      ) : isCreator ? (
        <Crown size={16} className="text-yellow-300" />
      ) : (
        <User size={16} />
      )}
      
      <span className="text-sm font-medium">
        {isCreator ? 'Creator' : 'Listener'}
      </span>
    </button>
  );
}
