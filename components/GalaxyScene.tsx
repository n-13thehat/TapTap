"use client";
import { useEffect, useRef } from "react";

export default function GalaxyScene() {
  const ref = useRef<HTMLCanvasElement|null>(null);
  const raf = useRef<number>(0);

  useEffect(() => {
    const c = ref.current!;
    const ctx = c.getContext("2d")!;
    let w = c.width = window.innerWidth;
    let h = c.height = window.innerHeight;

    const stars = Array.from({length: Math.floor((w*h)/16000)}, () => ({
      x: Math.random()*w,
      y: Math.random()*h,
      z: Math.random()*1.5 + 0.5
    }));

    function draw(){
      ctx.fillStyle = "rgba(0,0,0,0.5)";
      ctx.fillRect(0,0,w,h);
      ctx.fillStyle = "white";
      for (const s of stars) {
        s.x += (s.z - 1) * 0.3;
        if (s.x > w) s.x = 0;
        ctx.fillRect(s.x, s.y, 1, 1);
      }
      raf.current = requestAnimationFrame(draw);
    }

    function onResize(){
      w = c.width = window.innerWidth;
      h = c.height = window.innerHeight;
    }

    raf.current = requestAnimationFrame(draw);
    window.addEventListener("resize", onResize);
    return () => {
      cancelAnimationFrame(raf.current!);
      window.removeEventListener("resize", onResize);
    }
  }, []);

  return <canvas ref={ref} className="fixed inset-0 -z-20" />;
}
