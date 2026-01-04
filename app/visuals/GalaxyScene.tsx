"use client";
import { useEffect, useRef } from "react";

export default function GalaxyScene() {
  const ref = useRef<HTMLCanvasElement|null>(null);
  const raf = useRef<number | null>(null);

  useEffect(() => {
    const c = ref.current!;
    const ctx = c.getContext("2d")!;
    let w = c.width = window.innerWidth;
    let h = c.height = window.innerHeight;

    // Enhanced star system with different types
    const stars = Array.from({length: Math.floor((w*h)/12000)}, () => ({
      x: Math.random() * w,
      y: Math.random() * h,
      z: Math.random() * 2 + 0.5,
      size: Math.random() * 2 + 0.5,
      brightness: Math.random() * 0.8 + 0.2,
      color: Math.random() > 0.7 ? '#00ffd2' : '#ffffff',
      twinkle: Math.random() * Math.PI * 2
    }));

    // Nebula particles
    const nebula = Array.from({length: 50}, () => ({
      x: Math.random() * w,
      y: Math.random() * h,
      size: Math.random() * 100 + 50,
      opacity: Math.random() * 0.1 + 0.02,
      drift: Math.random() * 0.5 + 0.1
    }));

    function draw(){
      // Fade background
      ctx.fillStyle = "rgba(0,0,0,0.3)";
      ctx.fillRect(0, 0, w, h);

      // Draw nebula
      for (const n of nebula) {
        const gradient = ctx.createRadialGradient(n.x, n.y, 0, n.x, n.y, n.size);
        gradient.addColorStop(0, `rgba(0, 255, 210, ${n.opacity})`);
        gradient.addColorStop(1, 'transparent');
        ctx.fillStyle = gradient;
        ctx.fillRect(n.x - n.size, n.y - n.size, n.size * 2, n.size * 2);

        n.x += n.drift * 0.1;
        if (n.x > w + n.size) n.x = -n.size;
      }

      // Draw stars with enhanced effects
      for (const s of stars) {
        const twinkleEffect = Math.sin(Date.now() * 0.001 + s.twinkle) * 0.3 + 0.7;
        const alpha = s.brightness * twinkleEffect;

        // Star glow
        if (s.color === '#00ffd2') {
          ctx.shadowColor = s.color;
          ctx.shadowBlur = s.size * 2;
        } else {
          ctx.shadowColor = 'white';
          ctx.shadowBlur = s.size;
        }

        ctx.fillStyle = s.color;
        ctx.globalAlpha = alpha;
        ctx.fillRect(s.x, s.y, s.size, s.size);

        // Movement
        s.x += (s.z - 1) * 0.4;
        if (s.x > w) {
          s.x = -s.size;
          s.y = Math.random() * h;
        }
      }

      ctx.globalAlpha = 1;
      ctx.shadowBlur = 0;
      raf.current = requestAnimationFrame(draw);
    }

    function onResize(){
      w = c.width = window.innerWidth;
      h = c.height = window.innerHeight;
    }

    raf.current = requestAnimationFrame(draw);
    window.addEventListener("resize", onResize);
    return () => {
      if (raf.current !== null) cancelAnimationFrame(raf.current);
      window.removeEventListener("resize", onResize);
    }
  }, []);

  return <canvas ref={ref} className="fixed inset-0 -z-20" />;
}
