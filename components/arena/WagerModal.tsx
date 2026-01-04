'use client'
import { useState } from 'react'
import { io } from 'socket.io-client'

export interface Battle {
  id: string
  title: string
  status?: 'UPCOMING' | 'LIVE' | 'ENDED'
}

interface WagerModalProps {
  battle?: Battle | null
  userId?: string
  open: boolean
  balance: number
  onClose: () => void
  onWagerPlaced?: (battle: Battle, newBalance: number) => void
}

export default function WagerModal({
  battle,
  userId,
  open,
  balance,
  onClose,
  onWagerPlaced,
}: WagerModalProps) {
  const [amount, setAmount] = useState<number>(100)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [selected, setSelected] = useState<'A' | 'B' | null>(null)

  if (!open || !battle) return null
  const b = battle as Battle
  const socket = io('/', { autoConnect: false })

  async function handleWager() {
    if (!userId) {
      setError('You must be signed in to wager.')
      return
    }
    if (!selected) {
      setError('Select a contestant.')
      return
    }
    if (amount <= 0) {
      setError('Wager must be greater than 0.')
      return
    }
    if (amount > balance) {
      setError('Insufficient Tap balance.')
      return
    }

    setLoading(true)
    setError(null)
    try {
      // deduct TapCoins
      const res = await fetch('/api/treasure/deduct', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          amount,
          reason: `wager:${b.id}:${selected}`,
        }),
      })
      if (!res.ok) throw new Error(await res.text())
      const body = await res.json()
      const newBalance = body.newBalance ?? balance - amount

      // log wager
      await fetch('/api/battles/wager', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          battleId: b.id,
          contestant: selected,
          amount,
        }),
      }).catch(() => {})

      // emit to socket (optional realtime update)
      try {
        socket.connect()
        socket.emit('wager:placed', {
          battleId: b.id,
          userId,
          contestant: selected,
          amount,
        })
      } catch { /* noop */ }

      onWagerPlaced?.(b, newBalance)
      onClose()
    } catch (err: any) {
      setError(err.message || 'Wager failed.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className='fixed inset-0 z-50 flex items-center justify-center'>
      <div
        className='absolute inset-0 bg-black/60 backdrop-blur-sm'
        onClick={() => !loading && onClose()}
      />
      <div className='relative w-full max-w-md bg-gradient-to-b from-gray-900 to-black border border-white/10 rounded-2xl p-6 text-white'>
        <h3 className='text-xl font-bold text-teal-300 mb-3'>Place a Wager</h3>
        <p className='text-sm text-white/70 mb-4'>{b.title}</p>

        {/* contestant selection */}
        <div className='grid grid-cols-2 gap-3 mb-4'>
          {['A', 'B'].map((c) => (
            <button
              key={c}
              onClick={() => setSelected(c as 'A' | 'B')}
              className={`px-3 py-2 rounded-md border border-white/10 ${
                selected === c ? 'bg-gradient-to-r from-teal-500 to-purple-500 text-black font-bold' : 'bg-white/5'
              }`}
            >
              Contestant {c}
            </button>
          ))}
        </div>

        {/* amount input */}
        <label className='block text-xs text-white/60 mb-1'>Amount (Taps)</label>
        <input
          type='number'
          value={amount}
          onChange={(e) => setAmount(Number(e.target.value))}
          className='w-full bg-black/40 border border-white/10 rounded-md p-2 text-sm mb-2'
        />
        <div className='text-xs text-white/60 mb-4'>Balance: {balance} Taps</div>

        {error && (
          <div className='mb-3 text-xs text-red-400 bg-red-900/20 border border-red-500/20 rounded-md p-2'>
            {error}
          </div>
        )}

        <div className='flex items-center justify-end gap-3'>
          <button
            onClick={onClose}
            disabled={loading}
            className='px-4 py-2 rounded-md border border-white/10 text-sm hover:bg-white/10 disabled:opacity-50'
          >
            Cancel
          </button>
          <button
            onClick={handleWager}
            disabled={loading}
            className='px-4 py-2 rounded-md bg-gradient-to-r from-purple-500 to-teal-400 text-black font-bold text-sm hover:scale-[1.02] transition-transform disabled:opacity-50'
          >
            {loading ? 'ProcessingÃ¢â‚¬Â¦' : `Wager ${amount} Taps`}
          </button>
        </div>
      </div>
    </div>
  )
}
