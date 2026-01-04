'use client'
import { useEffect, useRef, useState } from 'react'
import { io, Socket } from 'socket.io-client'

interface Supporter {
  id: string
  name: string
  taps: number
}

interface LeaderboardProps {
  battleId: string
}

export default function Leaderboard({ battleId }: LeaderboardProps) {
  const [supporters, setSupporters] = useState<Supporter[]>([])
  const [socketConnected, setSocketConnected] = useState(false)
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null)
  const socketRef = useRef<Socket | null>(null)

  useEffect(() => {
    if (!battleId) return
    const s = io('/', { transports: ['websocket'] })
    // store reference
    socketRef.current = s

    s.on('connect', () => {
      setSocketConnected(true)
      s.emit('arena:join', { room: `leaderboard:${battleId}` })
    })

    s.on('disconnect', () => setSocketConnected(false))

    s.on('leaderboard:update', (payload: Supporter[]) => {
      setSupporters(payload.sort((a, b) => b.taps - a.taps))
      setLastUpdate(new Date())
    })

    return () => {
      s.emit('arena:leave', { room: `leaderboard:${battleId}` })
      s.disconnect()
    }
  }, [battleId])

  return (
    <div className='bg-white/3 border border-white/6 rounded-2xl p-4 flex flex-col'>
      <div className='flex items-center justify-between mb-3'>
        <h4 className='text-teal-300 font-semibold'>Top Supporters</h4>
        <div className='text-xs text-white/60'>
          {socketConnected ? 'Live' : 'Offline'}
        </div>
      </div>

      {supporters.length === 0 ? (
        <p className='text-xs text-white/60 text-center py-6'>
          No supporters yet. Be the first to unlock or wager!
        </p>
      ) : (
        <div className='space-y-2 overflow-y-auto max-h-[300px]'>
          {supporters.map((s, i) => (
            <div
              key={s.id}
              className='flex items-center justify-between text-sm border-b border-white/5 pb-1'
            >
              <div className='flex items-center gap-2'>
                <div className='w-6 h-6 rounded-full bg-white/10 flex items-center justify-center text-xs font-bold text-teal-300'>
                  {i + 1}
                </div>
                <span className='font-medium text-white/80'>{s.name}</span>
              </div>
              <span className='text-xs text-teal-200 font-semibold'>
                {s.taps.toLocaleString()} Taps
              </span>
            </div>
          ))}
        </div>
      )}

      <div className='mt-3 text-xs text-white/50 text-right'>
        {lastUpdate ? `Updated ${lastUpdate.toLocaleTimeString()}` : 'Awaiting data...'}
      </div>
    </div>
  )
}
