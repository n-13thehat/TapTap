"use client";

import { useState } from 'react';
import { useNotifications } from '@/hooks/useNotifications';
import NotificationCenter from './NotificationCenter';
import { Bell, BellRing } from 'lucide-react';

interface NotificationBellProps {
  className?: string;
}

export default function NotificationBell({ className = '' }: NotificationBellProps) {
  const { unreadCount } = useNotifications();
  const [isOpen, setIsOpen] = useState(false);

  const hasUnread = unreadCount > 0;

  return (
    <>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`
          relative p-2 rounded-lg transition-all duration-200
          ${hasUnread 
            ? 'text-teal-300 hover:text-teal-200 hover:bg-teal-600/20' 
            : 'text-white/60 hover:text-white hover:bg-white/10'
          }
          ${className}
        `}
        aria-label={`Notifications ${hasUnread ? `(${unreadCount} unread)` : ''}`}
      >
        {hasUnread ? (
          <BellRing size={20} className="animate-pulse" />
        ) : (
          <Bell size={20} />
        )}
        
        {/* Unread Badge */}
        {hasUnread && (
          <div className="absolute -top-1 -right-1 min-w-[18px] h-[18px] bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center animate-pulse">
            {unreadCount > 99 ? '99+' : unreadCount}
          </div>
        )}
        
        {/* Pulse Animation for New Messages */}
        {hasUnread && (
          <div className="absolute inset-0 rounded-lg bg-teal-400/20 animate-ping"></div>
        )}
      </button>

      {/* Notification Center */}
      <NotificationCenter 
        isOpen={isOpen} 
        onClose={() => setIsOpen(false)} 
      />
    </>
  );
}
