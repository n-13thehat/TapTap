"use client";
import { useEffect, useRef } from "react";

type Props = {
  speed?: number;      // 1.0 = default
  glow?: "subtle" | "medium" | "strong";
  trail?: number;      // 1.25 default
};

const BRAND_SEGMENTS = ["RSL","TAP","369","VX9","IUI","NDA","GMP","AMOK","NHC"];
// Build final character pool: brand letters separated, plus katakana + ♿
const katakana = [
  ..."アカサタナハマヤラワガザダバパ",
  ..."イキシチニヒミリギジヂビピ",
  ..."ウクスツヌフムユルグズヅブプ",
  ..."エケセテネヘメレゲゼデベペ",
  ..."オコソトノホモヨロゴゾドボポ"
];
const handicap = ["♿"];
const brandChars = [...BRAND_SEGMENTS.join("")]; // letters only (separated by design in the pool)
const rainChars = [...brandChars, ...katakana, ...handicap];

export default function MatrixRain({ speed=1.0, glow="medium", trail=1.25 }: Props) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const rafRef = useRef<number>(0);
  const dropsRef = useRef<number[]>([]);
  const fontSize = 16;   // base glyph size
  const targetFps = 45;  // throttle a bit for perf

  useEffect(() => {
    const teal =
      (typeof window !== "undefined" &&
        getComputedStyle(document.documentElement)
          .getPropertyValue("--accent")
          ?.trim()) ||
      "#0fa192";
    const canvas = canvasRef.current!;
    const ctx = canvas.getContext("2d")!;
    let width = canvas.width = window.innerWidth;
    let height = canvas.height = window.innerHeight;

    const columns = Math.ceil(width / fontSize);
    dropsRef.current = new Array(columns).fill(0).map(() => Math.floor(Math.random() * -20));

    let then = 0;
    const interval = 1000 / targetFps;

    const glowBlur = glow === "strong" ? 12 : glow === "medium" ? 8 : 4;

    function draw(now: number){
      const delta = now - then;
      if (delta < interval) {
        rafRef.current = requestAnimationFrame(draw);
        return;
      }
      then = now - (delta % interval);

      // translucent clear for trail persistence
      ctx.fillStyle = `rgba(0,0,0,${Math.max(0.08, 0.18 / trail)})`;
      ctx.fillRect(0, 0, width, height);

      // fade mask top/bottom (soft vignette)
      const gradTop = ctx.createLinearGradient(0,0,0,80);
      gradTop.addColorStop(0,"rgba(0,0,0,1)");
      gradTop.addColorStop(1,"rgba(0,0,0,0)");
      ctx.fillStyle = gradTop;
      ctx.fillRect(0,0,width,80);

      const gradBot = ctx.createLinearGradient(0,height-80,0,height);
      gradBot.addColorStop(0,"rgba(0,0,0,0)");
      gradBot.addColorStop(1,"rgba(0,0,0,1)");
      ctx.fillStyle = gradBot;
      ctx.fillRect(0,height-80,width,80);

      ctx.font = `${fontSize}px ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace`;
      ctx.textAlign = "center";
      ctx.textBaseline = "top";

      // draw columns
      for (let i = 0; i < dropsRef.current.length; i++) {
        const x = i * fontSize + fontSize / 2;
        const y = dropsRef.current[i] * fontSize;

        // choose a char: sprinkle ♿ sparsely (1/120 chance)
        const useHandicap = Math.random() < 1/120;
        const ch = useHandicap ? "♿" : rainChars[(Math.random() * rainChars.length) | 0];

        // glow + fill
        ctx.shadowColor = teal;
        ctx.shadowBlur = glowBlur;
        ctx.fillStyle = teal;
        ctx.fillText(ch, x, y);

        // advance
        const drift = (1 + Math.random() * 0.2) * speed;
        if (y > height && Math.random() > 0.985) {
          dropsRef.current[i] = 0 - Math.floor(Math.random() * 20);
        } else {
          dropsRef.current[i] += drift;
        }
      }

      rafRef.current = requestAnimationFrame(draw);
    }

    function onResize(){
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
      const cols = Math.ceil(width / fontSize);
      const prev = dropsRef.current;
      dropsRef.current = new Array(cols).fill(0).map((_,i)=> prev[i] ?? Math.floor(Math.random() * -20));
    }

    rafRef.current = requestAnimationFrame(draw);
    window.addEventListener("resize", onResize);
    return () => {
      cancelAnimationFrame(rafRef.current!);
      window.removeEventListener("resize", onResize);
    };
  }, [speed, glow, trail]);

  return <canvas ref={canvasRef} className="fixed inset-0 w-full h-full mask-fade-v" />;
}
