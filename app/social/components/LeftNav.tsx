'use client';
import Link from 'next/link';
import { Home, Hash, MessageSquare, Bell, Settings } from 'lucide-react';

export function LeftNav(){
  const nav = [
    { href: '/home', icon: Home, label: 'Home' },
    { href: '/social', icon: Hash, label: 'Social' },
    { href: '#messages', icon: MessageSquare, label: 'Messages' },
    { href: '#notifications', icon: Bell, label: 'Notifications' },
    { href: '#settings', icon: Settings, label: 'Settings' },
  ];
  return (
    <nav className="sticky top-4 space-y-1">
      {nav.map(({href,icon:Icon,label})=>(
        <Link key={href} href={href} className="flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-white/5 text-white/80">
          <Icon className="h-5 w-5 text-teal-300" /><span>{label}</span>
        </Link>
      ))}
    </nav>
  );
}
