import React, { useState } from 'react';
import { Settings as SettingsIcon } from 'lucide-react';
import { cn } from '../utils';
import { Header } from './Header';

interface ToggleRowProps {
  label: string;
  value: boolean;
  onChange: (value: boolean) => void;
}

function ToggleRow({ label, value, onChange }: ToggleRowProps) {
  return (
    <div className="flex items-center justify-between border-b border-white/10 py-2 last:border-b-0">
      <div className="text-sm text-white/80">{label}</div>
      <button
        onClick={() => onChange(!value)}
        className={cn(
          "relative h-6 w-11 rounded-full border transition",
          value ? "border-teal-400/40 bg-teal-400/20" : "border-white/10 bg-white/5"
        )}
        aria-pressed={value}
      >
        <span
          className={cn(
            "absolute top-1/2 h-4 w-4 -translate-y-1/2 transform rounded-full bg-white transition",
            value ? "left-[calc(100%-1.25rem)]" : "left-1"
          )}
        />
      </button>
    </div>
  );
}

export function SettingsSection() {
  const [lowLatency, setLowLatency] = useState(true);
  const [gapless, setGapless] = useState(true);
  const [volumeNorm, setVolumeNorm] = useState(false);

  return (
    <section className="space-y-3">
      <Header icon={<SettingsIcon className="h-4 w-4 text-teal-300" />} title="Settings" subtitle="Playback & visuals" />
      <div className="grid gap-3 md:grid-cols-2">
        <div className="rounded-xl border border-white/10 bg-white/5 p-4">
          <div className="mb-2 text-sm font-medium text-white">Playback</div>
          <ToggleRow label="Low latency mode" value={lowLatency} onChange={setLowLatency} />
          <ToggleRow label="Gapless playback" value={gapless} onChange={setGapless} />
          <ToggleRow label="Volume normalization" value={volumeNorm} onChange={setVolumeNorm} />
        </div>
        <div className="rounded-xl border border-white/10 bg-white/5 p-4">
          <div className="mb-2 text-sm font-medium text-white">Visuals</div>
          <div className="text-xs text-white/70">Switch themes, density, and animation preferences (coming soon).</div>
        </div>
      </div>
    </section>
  );
}
