// Lightweight astrotech utilities used for greetings and mood.
// This is intentionally simple and deterministic without external deps.

export type AstroMood =
  | "flow"
  | "focus"
  | "fire"
  | "earth"
  | "air"
  | "water"
  | "reflect";

export function moodOfDay(seed: string | null | undefined, date = new Date()): AstroMood {
  const base = (seed || "ZION") + "::" + date.toDateString();
  let h = 0;
  for (let i = 0; i < base.length; i++) h = (h * 33 + base.charCodeAt(i)) >>> 0;
  const moods: AstroMood[] = ["flow", "focus", "fire", "earth", "air", "water", "reflect"];
  return moods[h % moods.length];
}

export function greetingForNow(name?: string | null) {
  const hr = new Date().getHours();
  const prefix = hr < 12 ? "Good morning" : hr < 18 ? "Good afternoon" : "Good evening";
  return `${prefix}${name ? ", " + name : ""}`;
}

export function moodTagline(mood: AstroMood): string {
  switch (mood) {
    case "flow":
      return "Ride the wave. Surf is tuned to you.";
    case "focus":
      return "Deep focus unlocked. Library sorts for clarity.";
    case "fire":
      return "Turn it up. Battles and drops run hot.";
    case "earth":
      return "Grounded groove. Originals anchor your day.";
    case "air":
      return "Light and bright. Discover new voices.";
    case "water":
      return "Fluid vibes. Social glides in sync.";
    default:
      return "Reflect and recalibrate. Tap in when ready.";
  }
}

