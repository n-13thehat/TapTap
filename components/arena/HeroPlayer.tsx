"use client"
import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import MatrixYouTubePlayer from '../MatrixYouTubePlayer'
import MatrixRain from '../MatrixRain'

export interface Battle {
  id: string
  title: string
  hostChannel?: string
  thumbnailUrl?: string
  videoUrl?: string
  tier?: 'UNDERCARD' | 'MIDCARD' | 'HIGHCARD' | 'CHAMPIONSHIP'
  tapCoinCost?: number
  status?: 'UPCOMING' | 'LIVE' | 'ENDED'
  viewers?: number
}

interface HeroPlayerProps {
  battle?: Battle | null
  unlocked?: Record<string, boolean>
  onUnlock?: (battle: Battle) => void
  onWager?: (battle: Battle) => void
  onPlayerApi?: (api: { getCurrentTime: () => number; getDuration: () => number; seekTo: (s: number) => void }) => void
  onEnded?: () => void
}

const TIER_COLOR: Record<string, string> = {
  UNDERCARD: 'from-gray-600 to-gray-500',
  MIDCARD: 'from-teal-300 to-teal-400',
  HIGHCARD: 'from-teal-400 to-purple-500',
  CHAMPIONSHIP: 'from-purple-600 to-pink-500',
}

declare global {
  interface Window { YT?: any; onYouTubeIframeAPIReady?: () => void }
}

export default function HeroPlayer({
  battle,
  unlocked = {},
  onUnlock,
  onWager,
  onPlayerApi,
  onEnded,
}: HeroPlayerProps) {
  const [isUnlocked, setIsUnlocked] = useState(false)
  const [frameLoading, setFrameLoading] = useState(true)
  const playerRef = useRef<any>(null)
  const mountRef = useRef<HTMLDivElement | null>(null)
  const [videoId, setVideoId] = useState<string>('')

  // resolve video id and unlocked state
  useEffect(() => {
    if (!battle) return
    const id = extractYouTubeId(battle.videoUrl || battle.id)
    setVideoId(id)
    setIsUnlocked(!!unlocked[battle.id])
    setFrameLoading(true)
  }, [battle, unlocked])

  // load YT Iframe API once
  useEffect(() => {
    if (!mountRef.current) return
    let cancelled = false

    async function ensureYT() {
      if (typeof window === 'undefined') return
      if (window.YT && window.YT.Player) return
      await new Promise<void>((resolve) => {
        const existing = document.querySelector('script[src="https://www.youtube.com/iframe_api"]') as HTMLScriptElement | null
        if (existing && (window as any).YT && (window as any).YT.Player) {
          resolve();
          return
        }
        if (!existing) {
          const tag = document.createElement('script')
          tag.src = 'https://www.youtube.com/iframe_api'
          document.head.appendChild(tag)
        }
        const prev = window.onYouTubeIframeAPIReady
        window.onYouTubeIframeAPIReady = () => {
          prev?.()
          resolve()
        }
        // if already loaded, resolve on next tick
        if ((window as any).YT && (window as any).YT.Player) resolve()
      })
    }

    function createOrUpdatePlayer() {
      if (!mountRef.current || !window.YT || !window.YT.Player || !videoId) return
      if (playerRef.current) {
        // update existing
        try {
          if (isUnlocked) {
            playerRef.current.loadVideoById({ videoId })
          } else {
            playerRef.current.cueVideoById({ videoId, startSeconds: 0, endSeconds: 10 })
          }
        } catch {}
        return
      }
      // create
      playerRef.current = new window.YT.Player(mountRef.current, {
        width: '100%',
        height: '100%',
        videoId,
        host: 'https://www.youtube-nocookie.com',
        playerVars: {
          rel: 0,
          modestbranding: 1,
          showinfo: 0,
          iv_load_policy: 3,
          cc_load_policy: 0,
          autoplay: 0,
          controls: 1,
          origin: typeof window !== 'undefined' ? window.location.origin : undefined,
        },
        events: {
          onReady: () => {
            setFrameLoading(false)
            try {
              if (isUnlocked) {
                playerRef.current.playVideo()
              } else {
                playerRef.current.cueVideoById({ videoId, startSeconds: 0, endSeconds: 10 })
              }
            } catch {}
            // expose API upward
            onPlayerApi?.({
              getCurrentTime: () => {
                try { return Number(playerRef.current?.getCurrentTime?.() || 0) } catch { return 0 }
              },
              getDuration: () => {
                try { return Number(playerRef.current?.getDuration?.() || 0) } catch { return 0 }
              },
              seekTo: (s: number) => { try { playerRef.current?.seekTo?.(Math.max(0, s), true) } catch {} },
            })
          },
          onStateChange: (e: any) => {
            // 0 = ended
            if (e?.data === 0) {
              try { onEnded?.() } catch {}
            }
          },
          onError: () => {},
        },
      })
    }

    ;(async () => {
      await ensureYT()
      if (!cancelled) createOrUpdatePlayer()
    })()

    return () => {
      cancelled = true
    }
  }, [videoId, isUnlocked, onPlayerApi, onEnded])

  if (!battle) {
    return (
      <div className='rounded-2xl border border-white/10 bg-black/60 aspect-video flex items-center justify-center text-white/60'>
        Select a battle to begin
      </div>
    )
  }

  const tierColor = TIER_COLOR[battle.tier || 'UNDERCARD']

  return (
    <section className='relative rounded-2xl overflow-hidden border border-teal-400/20 shadow-2xl shadow-teal-400/10'>
      {/* Matrix background effect */}
      <div className='absolute inset-0 opacity-20 pointer-events-none'>
        <MatrixRain speed={0.5} glow="subtle" trail={0.8} />
      </div>

      {/* gradient overlay */}
      <div className='absolute inset-0 bg-gradient-to-b from-black/30 to-black/90 z-10 pointer-events-none' />

      {/* Matrix YouTube Player */}
      <div className='relative aspect-video bg-black'>
        <MatrixYouTubePlayer
          videoId={videoId}
          className='w-full h-full'
          autoplay={false}
          controls={isUnlocked}
          muted={!isUnlocked}
          matrixIntensity={isUnlocked ? 'strong' : 'medium'}
          showMatrixOverlay={true}
          onReady={() => {
            setFrameLoading(false);
            // Initialize player API if needed
            if (onPlayerApi && playerRef.current) {
              onPlayerApi({
                getCurrentTime: () => 0,
                getDuration: () => 0,
                seekTo: (s: number) => {},
              });
            }
          }}
        />

        {/* Matrix loading overlay */}
        <AnimatePresence>
          {frameLoading && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className='absolute inset-0 z-20 bg-black/80 flex items-center justify-center'
            >
              <div className="relative">
                <div className="absolute inset-0 w-32 h-32 -m-16 opacity-30">
                  <MatrixRain speed={2} glow="strong" trail={2} />
                </div>
                <div className="relative z-10 text-center">
                  <div className="text-teal-400 font-mono text-lg mb-2">
                    INITIALIZING BATTLE MATRIX...
                  </div>
                  <div className="flex space-x-1">
                    {[0, 1, 2].map((i) => (
                      <motion.div
                        key={i}
                        className="w-2 h-2 bg-teal-400 rounded-full"
                        animate={{
                          opacity: [0.3, 1, 0.3],
                          scale: [0.8, 1.2, 0.8],
                        }}
                        transition={{
                          duration: 1.5,
                          repeat: Infinity,
                          delay: i * 0.2,
                        }}
                      />
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* bottom bar */}
      <div className='absolute bottom-0 left-0 right-0 z-20 p-4 flex items-center justify-between'>
        <div>
          <h2 className='text-2xl font-bold text-teal-300 drop-shadow'>
            {battle.title}
          </h2>
          <p className='text-sm text-white/70'>
            {battle.hostChannel} Ã¢â‚¬Â¢ {battle.viewers?.toLocaleString() ?? 0} viewers
          </p>
        </div>

        <div className='flex items-center gap-3'>
          <div className={`text-xs px-2 py-1 rounded-md bg-gradient-to-r ${tierColor}`}>
            {battle.tier}
          </div>

          {!isUnlocked ? (
            <button
              onClick={() => onUnlock?.(battle)}
              className='px-4 py-2 rounded-lg bg-gradient-to-r from-teal-500 to-purple-500 text-black font-bold hover:scale-[1.02] transition-transform'
            >
              Unlock ({battle.tapCoinCost ?? 50} Taps)
            </button>
          ) : (
            <div className='text-xs px-3 py-1 rounded-md bg-white/10 border border-white/10'>
              Unlocked
            </div>
          )}

          {battle.status === 'LIVE' && (
            <button
              onClick={() => onWager?.(battle)}
              className='px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-sm hover:bg-white/10'
            >
              Wager
            </button>
          )}
        </div>
      </div>
    </section>
  )
}

/* util */
function extractYouTubeId(input?: string): string {
  if (!input) return ''
  const idMatch = input.match(/(?:v=|\/)([0-9A-Za-z_-]{11})/)
  if (idMatch && idMatch[1]) return idMatch[1]
  if (/^[0-9A-Za-z_-]{11}$/.test(input)) return input
  return input.split('?')[0].split('/').pop() || input
}
