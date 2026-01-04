"use client";
import { useEffect, useRef } from "react";
export default function GalaxyScene() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const c = canvasRef.current!,
      ctx = c.getContext("2d")!;
    let w = (c.width = window.innerWidth),
      h = (c.height = window.innerHeight);
    const stars = Array.from({ length: 250 }, () => ({
      x: Math.random() * w,
      y: Math.random() * h,
      r: Math.random() * 1.1,
    }));
    const draw = () => {
      ctx.fillStyle = "rgba(0,0,0,1)";
      ctx.fillRect(0, 0, w, h);
      ctx.fillStyle = "rgba(0,255,200,0.25)";
      stars.forEach((s) => {
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
        ctx.fill();
      });
      requestAnimationFrame(draw);
    };
    draw();
    window.addEventListener("resize", () => {
      w = c.width = window.innerWidth;
      h = c.height = window.innerHeight;
    });
  }, []);
  return (
    <canvas ref={canvasRef} className="fixed top-0 left-0 w-full h-full z-0 pointer-events-none" />
  );
}
