"use client";
import { useEffect, useMemo, useState } from "react";
import { Loader2 } from "lucide-react";
import { usePathname } from "next/navigation";

export type MatrixTransitionOverlayProps = {
  forceVisible?: boolean;
  message?: string;
};

export default function MatrixTransitionOverlay({
  forceVisible,
  message,
}: MatrixTransitionOverlayProps) {
  const pathname = usePathname();
  const [visible, setVisible] = useState(forceVisible ?? false);

  useEffect(() => {
    if (forceVisible) {
      setVisible(true);
      return;
    }
    setVisible(true);
    const timer = window.setTimeout(() => setVisible(false), 400);
    return () => window.clearTimeout(timer);
  }, [pathname, forceVisible]);

  const label = useMemo(
    () => message || "Matrix rain is routing your next move…",
    [message],
  );

  if (!visible) return null;

  return (
    <div className="pointer-events-none fixed inset-0 z-[60]">
      <div className="absolute inset-0 bg-gradient-to-b from-black/90 via-black/60 to-black/80 backdrop-blur-sm" />
      <div className="relative z-10 flex h-full w-full flex-col items-center justify-center gap-3 text-xs tracking-[0.3em] uppercase text-white/70">
        <div className="flex items-center gap-2 rounded-full border border-white/10 bg-white/10 px-4 py-2 shadow-lg shadow-teal-500/20">
          <Loader2 className="h-4 w-4 animate-spin text-teal-300" />
          <span className="text-[11px] text-white/90">{label}</span>
        </div>
        <div className="text-[9px] text-white/40">TapTap · Matrix traffic</div>
      </div>
    </div>
  );
}
