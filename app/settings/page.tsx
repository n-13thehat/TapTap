"use client";

import React from "react";
import Link from "next/link";
import dynamic from "next/dynamic";
import { motion } from "framer-motion";
import {
  Settings,
  Bell,
  Palette,
  Wallet2,
  Key,
  Shield,
  User,
  Moon,
  Sun,
  Volume2,
  VolumeX,
  Eye,
  EyeOff,
  Smartphone,
  Monitor,
  RefreshCw
} from "lucide-react";
import {
  PageContainer,
  PageHeader,
  LoadingState
} from "@/components/ui/StandardizedComponents";
import { useMatrixIframes } from "@/hooks/useMatrixIframes";

const WalletPanel = dynamic(() => import("./WalletPanel"), { ssr: false });

export default function SettingsPage({ searchParams }: any) {
  const embed = String(searchParams?.embed ?? "") === "1";

  // Auto-enhance any iframes on this page
  useMatrixIframes();

  if (embed) {
    return (
      <PageContainer showMatrix={true}>
        <div className="p-4">
          <div className="mb-3 flex items-center gap-3">
            <div className="h-7 w-7 rounded-md bg-teal-500/20 ring-1 ring-teal-400/30 flex items-center justify-center">
              <Settings className="h-4 w-4 text-teal-300" />
            </div>
            <h1 className="text-lg font-semibold text-teal-300">Settings</h1>
          </div>
          <div className="rounded-xl border border-white/10 bg-white/5 p-4 text-sm text-white/70">
            Settings panel - open full page for complete functionality
          </div>
        </div>
      </PageContainer>
    );
  }

  return (
    <PageContainer showMatrix={true}>
      <PageHeader
        title="Settings"
        subtitle="Customize your TapTap Matrix experience"
        icon={Settings}
        showBackButton={true}
        actions={
          <button className="rounded-md border border-white/10 bg-white/5 p-2 text-white/70 hover:bg-white/10 transition-colors">
            <RefreshCw className="h-4 w-4" />
          </button>
        }
      />

      <div className="max-w-6xl mx-auto px-4 py-8 space-y-8">{/* Settings Grid */}
        <div className="grid gap-6 md:grid-cols-2">
          {/* Beta Unlock */}
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white/5 rounded-xl border border-white/10 p-6"
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="h-10 w-10 rounded-lg bg-amber-500/20 ring-1 ring-amber-400/30 flex items-center justify-center">
                <Key className="h-5 w-5 text-amber-300" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-white">Beta Unlock</h2>
                <p className="text-sm text-white/60">Enter a beta code to unlock premium features</p>
              </div>
            </div>
            <BetaUnlockForm />
          </motion.section>

          {/* Notifications */}
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white/5 rounded-xl border border-white/10 p-6"
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="h-10 w-10 rounded-lg bg-blue-500/20 ring-1 ring-blue-400/30 flex items-center justify-center">
                <Bell className="h-5 w-5 text-blue-300" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-white">Notifications</h2>
                <p className="text-sm text-white/60">Control which notifications you receive</p>
              </div>
            </div>
            <NotificationsToggles />
          </motion.section>

          {/* Personalization */}
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white/5 rounded-xl border border-white/10 p-6"
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="h-10 w-10 rounded-lg bg-purple-500/20 ring-1 ring-purple-400/30 flex items-center justify-center">
                <Palette className="h-5 w-5 text-purple-300" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-white">Personalization (Astro)</h2>
                <p className="text-sm text-white/60">Customize your Matrix experience</p>
              </div>
            </div>
            <PersonalizationPanel />
          </motion.section>

          {/* Wallet */}
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-white/5 rounded-xl border border-white/10 p-6"
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="h-10 w-10 rounded-lg bg-green-500/20 ring-1 ring-green-400/30 flex items-center justify-center">
                <Wallet2 className="h-5 w-5 text-green-300" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-white">Wallet</h2>
                <p className="text-sm text-white/60">Manage your crypto wallet connections</p>
              </div>
            </div>
            <WalletPanel />
          </motion.section>
        </div>
      </div>
    </PageContainer>
  );
}

function BetaUnlockForm() {
  const [code, setCode] = React.useState("");
  const [status, setStatus] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(false);

  const apply = async () => {
    setLoading(true);
    try {
      if (code.trim().toUpperCase() === "RSL4EVA") {
        localStorage.setItem("taptap.betaUnlock", "1");
        document.cookie = "taptap.beta=1; Path=/; Max-Age=31536000; SameSite=Lax";
        setStatus("Beta Unlocked ✨");
      } else {
        setStatus("Invalid code");
      }
    } catch {
      setStatus("Saved locally");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <input
          value={code}
          onChange={(e) => setCode(e.target.value)}
          placeholder="Enter Beta Code"
          className="flex-1 p-3 rounded-lg bg-black/50 border border-white/10 text-white placeholder-white/40 focus:border-teal-400/50 focus:outline-none focus:ring-1 focus:ring-teal-400/50"
        />
        <button
          onClick={apply}
          disabled={loading || !code.trim()}
          className="inline-flex items-center gap-2 px-4 py-3 bg-amber-500/90 text-black font-semibold rounded-lg hover:bg-amber-400 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {loading ? (
            <div className="animate-spin h-4 w-4 border-2 border-black/30 border-t-black rounded-full" />
          ) : (
            <Key className="h-4 w-4" />
          )}
          Apply
        </button>
      </div>
      {status && (
        <motion.div
          initial={{ opacity: 0, y: 5 }}
          animate={{ opacity: 1, y: 0 }}
          className={`text-sm p-2 rounded-lg ${
            status.includes('Unlocked')
              ? 'text-emerald-200 bg-emerald-500/10 border border-emerald-400/30'
              : 'text-amber-200 bg-amber-500/10 border border-amber-400/30'
          }`}
        >
          {status}
        </motion.div>
      )}
    </div>
  );
}

function Toggle({ label, value, onChange, icon }: {
  label: string;
  value: boolean;
  onChange: (v: boolean) => void;
  icon?: React.ComponentType<any>;
}) {
  return (
    <motion.label
      className="flex items-center justify-between gap-3 p-3 rounded-lg border border-white/10 bg-black/20 hover:bg-black/40 transition-colors cursor-pointer"
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
    >
      <div className="flex items-center gap-3">
        {icon && (
          <div className="h-6 w-6 rounded-md bg-white/10 flex items-center justify-center">
            {React.createElement(icon, { className: "h-3 w-3 text-white/70" })}
          </div>
        )}
        <span className="text-white/80 font-medium">{label}</span>
      </div>
      <div className="relative">
        <input
          type="checkbox"
          checked={value}
          onChange={(e) => onChange(e.target.checked)}
          className="sr-only"
        />
        <div className={`w-11 h-6 rounded-full transition-colors ${
          value ? 'bg-teal-500' : 'bg-white/20'
        }`}>
          <div className={`w-5 h-5 bg-white rounded-full shadow-md transform transition-transform ${
            value ? 'translate-x-5' : 'translate-x-0.5'
          } mt-0.5`} />
        </div>
      </div>
    </motion.label>
  );
}

function NotificationsToggles() {
  const [state, setState] = React.useState(() => {
    try { return JSON.parse(localStorage.getItem("taptap.notifications") || "{}"); } catch { return {}; }
  });

  React.useEffect(() => {
    try { localStorage.setItem("taptap.notifications", JSON.stringify(state)); } catch {}
  }, [state]);

  const bind = (k: string) => ({
    value: !!state[k],
    onChange: (v: boolean) => setState((s: any) => ({ ...s, [k]: v }))
  });

  const notificationTypes = [
    { key: "social", label: "Social", icon: User },
    { key: "battles", label: "Battles", icon: Shield },
    { key: "live", label: "Live", icon: Volume2 },
    { key: "marketplace", label: "Marketplace", icon: Smartphone },
    { key: "astro", label: "Astro Daily", icon: Eye },
  ];

  return (
    <div className="space-y-3">
      {notificationTypes.map((type, index) => (
        <motion.div
          key={type.key}
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: index * 0.05 }}
        >
          <Toggle
            label={type.label}
            icon={type.icon}
            {...bind(type.key)}
          />
        </motion.div>
      ))}
    </div>
  );
}

function PersonalizationPanel() {
  const [enabled, setEnabled] = React.useState(true);
  const [weight, setWeight] = React.useState(0.5);

  React.useEffect(() => {
    try {
      const en = localStorage.getItem("taptap.astro.enabled");
      const w = localStorage.getItem("taptap.astro.weight");
      setEnabled(en === null ? true : en === "1");
      if (w) setWeight(Math.min(1, Math.max(0, Number(w))));
    } catch {}
  }, []);

  const handleEnabledChange = (checked: boolean) => {
    setEnabled(checked);
    try {
      localStorage.setItem("taptap.astro.enabled", checked ? "1" : "0");
    } catch {}
  };

  const handleWeightChange = (value: number) => {
    setWeight(value);
    try {
      localStorage.setItem("taptap.astro.weight", String(value));
      document.cookie = `taptap.astro.weight=${value}; Path=/; Max-Age=31536000; SameSite=Lax`;
    } catch {}
  };

  return (
    <div className="space-y-4">
      <p className="text-sm text-white/70">
        Astro Scenes and daily vibes. Customize how the Matrix responds to your behavior and preferences.
      </p>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="p-3 rounded-lg border border-white/10 bg-black/20"
      >
        <label className="flex items-center gap-3 cursor-pointer">
          <div className="relative">
            <input
              type="checkbox"
              checked={enabled}
              onChange={(e) => handleEnabledChange(e.target.checked)}
              className="sr-only"
            />
            <div className={`w-11 h-6 rounded-full transition-colors ${
              enabled ? 'bg-purple-500' : 'bg-white/20'
            }`}>
              <div className={`w-5 h-5 bg-white rounded-full shadow-md transform transition-transform ${
                enabled ? 'translate-x-5' : 'translate-x-0.5'
              } mt-0.5`} />
            </div>
          </div>
          <div>
            <span className="text-white font-medium">Enable Astro</span>
            <p className="text-xs text-white/60">Personalized Matrix experiences</p>
          </div>
        </label>
      </motion.div>

      {enabled && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          className="space-y-3"
        >
          <div className="p-3 rounded-lg border border-white/10 bg-black/20">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-white/80">Astro vs. Behavior Weight</span>
              <span className="text-sm text-purple-300 font-mono">
                {Math.round(weight * 100)}%
              </span>
            </div>
            <input
              type="range"
              min={0}
              max={1}
              step={0.05}
              value={weight}
              onChange={(e) => handleWeightChange(Number(e.target.value))}
              className="w-full h-2 bg-white/20 rounded-lg appearance-none cursor-pointer slider"
              style={{
                background: `linear-gradient(to right, #8b5cf6 0%, #8b5cf6 ${weight * 100}%, rgba(255,255,255,0.2) ${weight * 100}%, rgba(255,255,255,0.2) 100%)`
              }}
            />
            <div className="flex justify-between text-xs text-white/60 mt-1">
              <span>Behavior-driven</span>
              <span>Astro-driven</span>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
}
