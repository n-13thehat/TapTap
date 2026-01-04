"use client";
import { useEffect, useRef } from "react";

export default function MatrixRain() {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current!;
    const ctx = canvas.getContext("2d")!;
    let w = (canvas.width = window.innerWidth);
    let h = (canvas.height = window.innerHeight);

    // teal matrix character pool
    const chars = [
      "T","A","P","R","S","L","V","X",
      "9","3","6","I","U","N","D","M",
      "O","K","G","P","H","C"
    ];
    const fontSize = 18;
    const cols = Math.floor(w / fontSize);
    const drops: number[] = Array(cols).fill(0);

    const draw = () => {
      // translucent fade creates trail effect
      ctx.fillStyle = "rgba(0, 5, 10, 0.08)";
      ctx.fillRect(0, 0, w, h);
      ctx.font = `${fontSize}px monospace`;

      for (let i = 0; i < cols; i++) {
        const char = chars[Math.floor(Math.random() * chars.length)];
        const x = i * fontSize;
        const y = drops[i] * fontSize;

        // bright teal-white head
        ctx.shadowColor = "#00fff0";
        ctx.shadowBlur = 10;
        ctx.fillStyle = "rgba(0,255,240,0.95)";
        ctx.fillText(char, x, y);

        // trailing glyphs behind the head
        for (let t = 1; t < 20; t++) {
          const trailY = y - t * fontSize;
          if (trailY < 0) break;
          const opacity = Math.max(0, 1 - t / 20);
          ctx.fillStyle = `rgba(0,255,180,${opacity * 0.8})`;
          ctx.shadowBlur = 0;
          ctx.fillText(chars[Math.floor(Math.random() * chars.length)], x, trailY);
        }

        // reset columns occasionally for variation
        if (y > h && Math.random() > 0.975) drops[i] = 0;
        drops[i] += 1.1; // balanced fall speed
      }

      requestAnimationFrame(draw);
    };

    draw();

    const resize = () => {
      w = canvas.width = window.innerWidth;
      h = canvas.height = window.innerHeight;
    };
    window.addEventListener("resize", resize);
    return () => window.removeEventListener("resize", resize);
  }, []);

  return (
    <canvas
      ref={ref}
      className="fixed top-0 left-0 w-full h-full bg-black z-[10] pointer-events-none"
    />
  );
}



