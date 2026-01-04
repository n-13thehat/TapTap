'use client'
import { useState } from 'react'

export interface Battle {
  id: string
  title: string
  tapCoinCost: number
}

interface UnlockModalProps {
  battle?: Battle | null
  userId?: string
  open: boolean
  onClose: () => void
  onUnlocked?: (battle: Battle, newBalance: number) => void
}

export default function UnlockModal({
  battle,
  userId,
  open,
  onClose,
  onUnlocked,
}: UnlockModalProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  if (!open || !battle) return null
  const b = battle as Battle

  async function handleUnlock() {
    if (!userId) {
      setError('You must be signed in to unlock battles.')
      return
    }
    setLoading(true)
    setError(null)

    try {
      const res = await fetch('/api/treasure/deduct', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          amount: b.tapCoinCost,
          reason: `unlock:battle:${b.id}`,
        }),
      })

      if (!res.ok) throw new Error(await res.text())
      const body = await res.json()
      const newBalance = body.newBalance ?? 0

      // log unlock for persistence
      await fetch('/api/battles/unlock', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, battleId: b.id }),
      }).catch(() => {})

      onUnlocked?.(b, newBalance)
      onClose()
    } catch (err: any) {
      setError(err.message || 'Unlock failed.')
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
        <h3 className='text-xl font-bold text-teal-300 mb-2'>Unlock Battle</h3>
        <p className='text-sm text-white/70 mb-4'>{b.title}</p>

        <div className='mb-4 flex items-center justify-between'>
          <span className='text-sm text-white/70'>Price</span>
          <span className='text-sm font-semibold text-teal-200'>
            {b.tapCoinCost} Taps (${(b.tapCoinCost * 0.01).toFixed(2)})
          </span>
        </div>

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
            onClick={handleUnlock}
            disabled={loading}
            className='px-4 py-2 rounded-md bg-gradient-to-r from-teal-500 to-purple-500 text-black font-bold text-sm hover:scale-[1.02] transition-transform disabled:opacity-50'
          >
            {loading ? 'Processing...' : `Unlock (${b.tapCoinCost} Taps)`}
          </button>
        </div>
      </div>
    </div>
  )
}
