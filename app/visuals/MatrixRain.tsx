"use client";
import React, { useEffect, useRef } from "react";

type Glow = "low" | "medium" | "full";

export default function MatrixRain({
  speed = 1,
  glow = "medium",
  trail = 1.1,
}: {
  speed?: number;
  glow?: Glow | string;
  trail?: number;
}) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current!;
    const ctx = canvas.getContext("2d")!;

    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);
    const onResize = () => {
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
      columns = Math.floor(width / fontSize);
      drops = new Array(columns).fill(0).map(() => Math.random() * -100);
    };

    window.addEventListener("resize", onResize);

    const fontSize = 16;
    let columns = Math.floor(width / fontSize);
    let drops = new Array(columns).fill(0).map(() => Math.random() * -100);

    const tokens = ["TAP", "RSL", "VX9", "369", "NDA", "GMP", "AMOK", "NHC", "ZION", "CODE", "01", "10"];
    const katakana = "アイウエオカキクケコサシスセソタチツテトナニヌネノハヒフヘホマミムメモヤユヨラリルレロワヲン";
    const symbols = "!@#$%^&*()_+-=[]{}|;:,.<>?";

    function randomChar() {
      const pick = Math.random();
      if (pick < 0.5) return katakana[Math.floor(Math.random() * katakana.length)];
      if (pick < 0.8) {
        const t = tokens[Math.floor(Math.random() * tokens.length)];
        return t[Math.floor(Math.random() * t.length)];
      }
      return symbols[Math.floor(Math.random() * symbols.length)];
    }

    // Enhanced gradient with teal cyberpunk colors
    const gradient = ctx.createLinearGradient(0, 0, width, height);
    gradient.addColorStop(0, "#00ffd2");
    gradient.addColorStop(0.5, "#14b8a6");
    gradient.addColorStop(1, "#0fa192");

    const glowMap: Record<string, string> = {
      low: "0 0 8px #00ffd280",
      medium: "0 0 12px #00ffd2a0",
      full: "0 0 18px #00ffd2bf",
    };

    function draw() {
      // Fade the canvas slightly to create trail effect
      ctx.fillStyle = `rgba(0,0,0,${Math.min(0.2 * trail, 0.5)})`;
      ctx.fillRect(0, 0, width, height);

      ctx.fillStyle = gradient as any;
      ctx.font = `${fontSize}px 'Courier New', monospace`;
      (ctx as any).shadowColor = "#00ffd2";
      (ctx as any).shadowBlur = glowMap[String(glow)] ? parseInt(glowMap[String(glow)].split(" ")[2]) : 12;

      for (let i = 0; i < drops.length; i++) {
        const text = randomChar();
        const x = i * fontSize;
        const y = drops[i] * fontSize;
        ctx.fillText(text, x, y);

        const fall = (Math.random() * 1.5 + 0.5) * speed;
        drops[i] = drops[i] + fall;

        if (y > height && Math.random() > 0.975) {
          drops[i] = 0 - Math.random() * 50;
        }
      }
      rafRef.current = requestAnimationFrame(draw);
    }

    // Prime background darker layer
    ctx.fillStyle = "rgba(0,0,0,0.9)";
    ctx.fillRect(0, 0, width, height);
    rafRef.current = requestAnimationFrame(draw);

    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      window.removeEventListener("resize", onResize);
    };
  }, [speed, glow, trail]);

  return (
    <canvas
      ref={canvasRef}
      className="pointer-events-none fixed inset-0 -z-10 [image-rendering:pixelated]"
    />
  );
}
