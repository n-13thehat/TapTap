"use client"

import React, { useEffect, useRef } from "react"

export default function MatrixRain() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    const fontSize = 16
    const columns = Math.floor(window.innerWidth / fontSize)
    const drops: number[] = Array(columns).fill(1)

    const resize = () => {
      const el = canvas as HTMLCanvasElement
      el.width = window.innerWidth
      el.height = window.innerHeight
    }

    resize()
    window.addEventListener("resize", resize)

    function drawRain() {
      if (!ctx) return
      const el = canvas as HTMLCanvasElement
      const width = el.width
      const height = el.height
      ctx.fillStyle = "rgba(0,0,0,0.15)"
      ctx.fillRect(0, 0, width, height)
      ctx.fillStyle = "#00ffd1"
      ctx.font = `${fontSize}px monospace`

      for (let i = 0; i < drops.length; i++) {
        const text = String.fromCharCode(0x30A0 + Math.random() * 96)
        const x = i * fontSize
        const y = drops[i] * fontSize
        ctx.fillText(text, x, y)
        if (y > height && Math.random() > 0.975) drops[i] = 0
        drops[i]++
      }
    }

    const interval = setInterval(drawRain, 33)
    return () => {
      clearInterval(interval)
      window.removeEventListener("resize", resize)
    }
  }, [])

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 w-full h-full bg-black"
      style={{ zIndex: -1 }}
    />
  )
}
