"use client";
import AssistiveOrb from "@/components/AssistiveOrb";
import Image from "next/image";
export default function Treasure() {
  return (
    <main className="min-h-screen pb-20 p-6 max-w-5xl mx-auto">
      <div className="rounded-2xl border border-white/10 bg-white/5 p-6 shadow-glow">
        <div className="text-sm uppercase tracking-widest text-white/60">AI Character</div>
        <h1 className="text-4xl font-bold mt-2" style={{ color: "#1FA37A" }}>
          Treasure
        </h1>
        <p className="mt-3 text-white/70">
          Dark-green wallet & airdrops. $TAP integration hooks ready.
        </p>
      </div>
      <div className="mt-6 relative aspect-square rounded-2xl overflow-hidden border border-white/10 bg-black/40 flex items-center justify-center">
        <Image
          src="/branding/treasure.png"
          alt="Treasure"
          width={512}
          height={512}
          className="object-contain"
        />
      </div>
      <AssistiveOrb />
      {/* Global player is provided by app/layout */}
    </main>
  );
}

