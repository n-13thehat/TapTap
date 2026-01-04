import React from 'react';
import { HardDrive, Cpu, Database, Zap } from 'lucide-react';
import { Header } from './Header';

export function MainframeSection() {
  const stats = [
    { label: 'CPU Usage', value: '23%', icon: Cpu, color: 'text-blue-400' },
    { label: 'Storage', value: '72%', icon: Database, color: 'text-green-400' },
    { label: 'Network', value: '45%', icon: Zap, color: 'text-yellow-400' },
  ];

  return (
    <section className="space-y-3">
      <Header 
        icon={<HardDrive className="h-4 w-4 text-teal-300" />} 
        title="TapTap Mainframe" 
        subtitle="System status & analytics" 
      />
      
      <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
        {stats.map((stat) => (
          <div key={stat.label} className="rounded-xl border border-white/10 bg-white/5 p-4">
            <div className="flex items-center gap-3">
              <div className={`rounded-full bg-black/30 p-2 ${stat.color}`}>
                <stat.icon className="h-5 w-5" />
              </div>
              <div>
                <div className="text-lg font-bold text-white">{stat.value}</div>
                <div className="text-xs text-white/60">{stat.label}</div>
              </div>
            </div>
          </div>
        ))}
      </div>
      
      <div className="rounded-xl border border-white/10 bg-white/5 p-6">
        <div className="space-y-4">
          <div>
            <h3 className="text-lg font-semibold text-white">Matrix Status</h3>
            <p className="text-sm text-white/60">All systems operational</p>
          </div>
          
          <div className="grid gap-3 md:grid-cols-2">
            <div className="rounded-lg border border-green-500/30 bg-green-500/10 p-3">
              <div className="flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-green-400" />
                <span className="text-sm font-medium text-green-200">Audio Engine</span>
              </div>
              <div className="mt-1 text-xs text-green-300">Online</div>
            </div>
            
            <div className="rounded-lg border border-green-500/30 bg-green-500/10 p-3">
              <div className="flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-green-400" />
                <span className="text-sm font-medium text-green-200">Blockchain Sync</span>
              </div>
              <div className="mt-1 text-xs text-green-300">Synchronized</div>
            </div>
            
            <div className="rounded-lg border border-yellow-500/30 bg-yellow-500/10 p-3">
              <div className="flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-yellow-400" />
                <span className="text-sm font-medium text-yellow-200">AI Recommendations</span>
              </div>
              <div className="mt-1 text-xs text-yellow-300">Learning</div>
            </div>
            
            <div className="rounded-lg border border-blue-500/30 bg-blue-500/10 p-3">
              <div className="flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-blue-400" />
                <span className="text-sm font-medium text-blue-200">Social Graph</span>
              </div>
              <div className="mt-1 text-xs text-blue-300">Active</div>
            </div>
          </div>
          
          <div className="rounded-lg border border-white/10 bg-black/30 p-3">
            <div className="text-xs text-white/70">
              The TapTap Mainframe coordinates your music experience across the decentralized network.
              All personal data remains encrypted and under your control.
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
