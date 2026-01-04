"use client";
import React, { useEffect, useRef } from "react";

export default function SurfVisualizer() {
  const ref = useRef<HTMLCanvasElement | null>(null);
  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    let raf = 0; let t = 0;
    function draw() {
      const w = (canvas as HTMLCanvasElement).width = (canvas as HTMLCanvasElement).clientWidth;
      const h = (canvas as HTMLCanvasElement).height = (canvas as HTMLCanvasElement).clientHeight;
      (ctx as CanvasRenderingContext2D).clearRect(0,0,w,h);
      const grd = (ctx as CanvasRenderingContext2D).createLinearGradient(0,0,w,h);
      grd.addColorStop(0, 'rgba(94,234,212,0.10)');
      grd.addColorStop(1, 'rgba(14,165,233,0.08)');
      (ctx as CanvasRenderingContext2D).fillStyle = grd; (ctx as CanvasRenderingContext2D).fillRect(0,0,w,h);
      (ctx as CanvasRenderingContext2D).beginPath();
      for (let x=0; x<w; x++) {
        const y = h/2 + Math.sin((x/80) + t/20) * 18 + Math.cos((x/40) + t/25) * 10;
        if (x === 0) (ctx as CanvasRenderingContext2D).moveTo(x, y); else (ctx as CanvasRenderingContext2D).lineTo(x, y);
      }
      (ctx as CanvasRenderingContext2D).strokeStyle = 'rgba(94,234,212,0.5)';
      (ctx as CanvasRenderingContext2D).lineWidth = 1.5;
      (ctx as CanvasRenderingContext2D).stroke();
      t++;
      raf = requestAnimationFrame(draw);
    }
    raf = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(raf);
  }, []);
  return <canvas ref={ref} className="h-24 w-full rounded-lg ring-1 ring-white/10" />;
}


