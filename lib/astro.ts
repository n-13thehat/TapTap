// Astro Vibes: types and simple logic

export type AstroProfile = {
  sign?: string | null;
  moon?: string | null;
  rising?: string | null;
  birthDate?: string | null; // ISO date
  birthTime?: string | null; // HH:mm (optional)
  location?: string | null;  // free text city
};

export type AstroTransit = {
  date: string; // ISO date
  factors: string[]; // human-readable factors
};

export type AstroTasteMod = {
  userId?: string | null;
  scalarEnergy: number; // 0..1
  scalarFocus: number;  // 0..1
  scalarChill: number;  // 0..1
  scalarSocial: number; // 0..1
};

export type VibeMode = "Energy" | "Focus" | "Chill" | "Social";

export function computeTodayVibe(profile: AstroProfile | null, weight: number = 0.5): { mode: VibeMode; tips: string[] } {
  // Naive mapping: use birth month to influence daily vibe deterministically.
  // Weight blends with behavior (not implemented here), leaving a stable default.
  const today = new Date();
  const m = profile?.birthDate ? new Date(profile.birthDate).getMonth() : today.getMonth();
  const seed = (m + today.getDate()) % 4;
  const modes: VibeMode[] = ["Energy", "Focus", "Chill", "Social"];
  const mode = modes[seed];
  const tipsByMode: Record<VibeMode, string[]> = {
    Energy: ["Queue upbeat tracks", "Try a TapGame battle", "Share a clip"],
    Focus: ["Instrumentals & low vocals", "Enable reduced motion", "Use Chill playlists"],
    Chill: ["Lo-fi and ambient", "Lower volume & dim visuals", "Long-form mixes"],
    Social: ["Go Live later today", "Invite friends to a battle", "Post highlights"],
  };
  return { mode, tips: tipsByMode[mode] };
}

export function modByAstro(base: number[], mod: AstroTasteMod): number[] {
  // Apply simple scalars to a list of base weights (e.g., [energy, focus, chill, social])
  if (base.length < 4) return base;
  const out = [...base];
  out[0] = base[0] * (0.5 + mod.scalarEnergy);
  out[1] = base[1] * (0.5 + mod.scalarFocus);
  out[2] = base[2] * (0.5 + mod.scalarChill);
  out[3] = base[3] * (0.5 + mod.scalarSocial);
  return out;
}

