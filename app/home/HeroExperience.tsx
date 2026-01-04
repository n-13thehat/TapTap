"use client"

import * as React from "react"
import { motion } from "framer-motion"
import Image from "next/image"
import MatrixLoader from "@/components/MatrixLoader"
import AssistiveOrb from "@/components/AssistiveOrb"
import AuthGate from "@/components/AuthGate"

type Counts = Record<string, number>

type HeroExperienceProps = {
  initialCounts?: Counts
  refreshMs?: number
}

const DEFAULT_REFRESH_MS = 60_000

export default function HeroExperience({ initialCounts = {}, refreshMs = DEFAULT_REFRESH_MS }: HeroExperienceProps) {
  const [counts, setCounts] = React.useState<Counts>(initialCounts)

  React.useEffect(() => {
    let abort = false
    const refresh = async () => {
      try {
        const res = await fetch("/api/home/featured", { cache: "no-store" })
        if (!res.ok) return
        const json = await res.json().catch(() => null)
        if (!json?.counts || abort) return
        setCounts((prev) => {
          const next = json.counts as Counts
          // Skip state updates if nothing changed to prevent needless re-renders.
          const keys = new Set([...Object.keys(prev), ...Object.keys(next)])
          for (const key of keys) {
            if (prev[key] !== next[key]) return next
          }
          return prev
        })
      } catch {
        // Silent network failure; will retry on next interval.
      }
    }

    refresh()
    const id = setInterval(refresh, refreshMs)
    return () => {
      abort = true
      clearInterval(id)
    }
  }, [refreshMs])

  const tiles: { key: string; title: string; desc: string; href: string }[] = [
    { key: "library", title: "Library", desc: "Stream, upload, visualize.", href: "/library" },
    { key: "social", title: "Social", desc: "Post, trade, connect.", href: "/social" },
    { key: "ai", title: "AI", desc: "Hope, Muse, Treasure.", href: "/ai" },
    { key: "marketplace", title: "Marketplace", desc: "Buy & sell TapPass.", href: "/marketplace" },
    { key: "battles", title: "Battles", desc: "Leagues & latest matchups.", href: "/battles" },
    { key: "surf", title: "Surf", desc: "Discover and queue sessions.", href: "/surf" },
  ]

  return (
    <main className="relative min-h-screen overflow-hidden bg-black text-white">
      <MatrixLoader />
      <div className="absolute inset-0 bg-gradient-to-b from-black/80 via-black/60 to-black opacity-90" />

      {/* Hero */}
      <section className="relative z-10 mx-auto flex min-h-screen max-w-6xl flex-col items-center justify-center px-6 text-center">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1.0, ease: "easeOut" }}
          className="flex items-center justify-center gap-3"
        >
          <span className="title-chip">
            <Image src="/branding/taptap-logo.png" alt="TapTap" width={28} height={28} />
            <span className="text-teal-200/90">TapTap</span>
          </span>
          <h1 className="bg-gradient-to-r from-teal-300 via-teal-100 to-white bg-clip-text text-4xl font-bold text-transparent drop-shadow-lg md:text-5xl">
            Matrix Mainframe
          </h1>
        </motion.div>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6, duration: 0.9 }}
          className="mt-5 max-w-xl text-sm text-teal-100/70 md:text-base"
        >
          The next evolution in sound, social, and AI -- powered by VX9.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8, duration: 0.7 }}
          className="mt-8 w-full max-w-md"
        >
          <AuthGate />
        </motion.div>

        <motion.div
          className="mt-10 h-12 w-12 rounded-full border border-teal-400/30 shadow-[0_0_30px_#00ffd160]"
          animate={{ scale: [1, 1.1, 1], opacity: [0.5, 1, 0.5] }}
          transition={{ repeat: Infinity, duration: 2 }}
        />
      </section>

      {/* Overview */}
      <section id="overview" className="relative z-10 mx-auto max-w-6xl px-6 pb-40 pt-8">
        <motion.div initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }} className="mb-6 flex items-center justify-center gap-2">
          <span className="title-chip">
            <Image src="/branding/taptap-logo.png" alt="TapTap" width={20} height={20} />
            <span className="text-teal-200/90">Explore</span>
          </span>
          <h2 className="text-2xl font-semibold text-teal-300 md:text-3xl text-glow">the Matrix</h2>
        </motion.div>

        <div className="mt-6 grid gap-6 md:grid-cols-3">
          {tiles.map((item, i) => (
            <motion.a
              key={item.title}
              href={item.href}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.06 + 0.1 }}
              className="group relative overflow-hidden rounded-2xl border border-teal-400/20 bg-black/60 p-5 backdrop-blur-md hover:border-teal-400/40"
            >
              <div className="mb-1 text-lg font-semibold text-teal-300">{item.title}</div>
              <div className="text-sm text-gray-400">{item.desc}</div>
              {typeof counts[item.key] === "number" && (
                <div className="mt-2 inline-flex items-center gap-2 rounded-md border border-white/10 bg-white/5 px-2 py-0.5 text-[11px] text-white/70">
                  <span className="h-1.5 w-1.5 rounded-full bg-teal-400" /> {counts[item.key]} new
                </div>
              )}
              <div className="pointer-events-none absolute inset-0 -z-10 bg-teal-500/10 opacity-0 blur-3xl transition-opacity duration-500 group-hover:opacity-100" />
            </motion.a>
          ))}
        </div>
      </section>

      <motion.div
        className="fixed bottom-6 right-6 z-50"
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 1.2, duration: 0.6 }}
      >
        <AssistiveOrb />
      </motion.div>

      <motion.footer
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.4, duration: 0.8 }}
        className="relative z-10 mt-10 pb-6 text-center text-xs text-teal-300/60"
      >
        <p>Welcome to the Matrix of Sound -- TapTap Mainframe</p>
      </motion.footer>
    </main>
  )
}
