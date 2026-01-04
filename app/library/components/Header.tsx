import React from 'react';

interface HeaderProps {
  icon: React.ReactNode;
  title: string;
  subtitle?: string;
}

export function Header({ icon, title, subtitle }: HeaderProps) {
  return (
    <div className="flex items-center gap-3">
      {icon}
      <div>
        <div className="text-lg font-semibold text-white">{title}</div>
        {subtitle && <div className="text-xs text-white/60">{subtitle}</div>}
      </div>
    </div>
  );
}
