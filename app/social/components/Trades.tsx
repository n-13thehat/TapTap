'use client'

import * as React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { TradesAPI } from '../supabaseClient'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { ScrollArea } from '@/components/ui/scroll-area'

type TradesProps = {
  userId: string
}

type Trade = {
  id: string
  requesterId: string
  targetId: string
  offerTracks: any
  askTracks: any
  status: 'pending' | 'accepted' | 'declined'
  createdAt: string
  requester?: { id: string; name: string; avatarUrl?: string | null }
  target?: { id: string; name: string; avatarUrl?: string | null }
}

export const Trades: React.FC<TradesProps> = ({ userId }) => {
  const [trades, setTrades] = React.useState<Trade[]>([])
  const [newTrade, setNewTrade] = React.useState({
    targetId: '',
    offerTracks: '',
    askTracks: ''
  })
  const [creating, setCreating] = React.useState(false)
  const [open, setOpen] = React.useState(false)

  React.useEffect(() => {
    let active = true
    const load = async () => {
      const list = await TradesAPI.list()
      if (active) setTrades(list)
    }
    load()

    const sub = TradesAPI.subscribe((trade) => {
      setTrades((prev) => {
        const exists = prev.find((t) => t.id === trade.id)
        if (exists) {
          return prev.map((t) => (t.id === trade.id ? trade : t))
        }
        return [trade, ...prev]
      })
    })

    return () => {
      active = false
      sub.unsubscribe()
    }
  }, [])

  const createTrade = async () => {
    if (!newTrade.targetId.trim()) return
    setCreating(true)
    try {
      const payload = {
        requesterId: userId,
        targetId: newTrade.targetId,
        offerTracks: newTrade.offerTracks ? JSON.parse(newTrade.offerTracks) : [],
        askTracks: newTrade.askTracks ? JSON.parse(newTrade.askTracks) : []
      }
      await TradesAPI.create(payload)
      setNewTrade({ targetId: '', offerTracks: '', askTracks: '' })
      setOpen(false)
    } catch (err) {
      console.error(err)
    } finally {
      setCreating(false)
    }
  }

  return (
    <div className="flex-1 min-h-screen">
      <header className="sticky top-0 z-20 border-b border-white/10 bg-black/70 px-4 py-3 backdrop-blur">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-teal-200">Trades</h2>
          <Button
            size="sm"
            className="bg-teal-500/80 text-black hover:bg-teal-400"
            onClick={() => setOpen(true)}
          >
            Request Trade
          </Button>
        </div>
      </header>

      <ScrollArea className="h-[calc(100vh-64px)] p-4">
        <AnimatePresence>
          {trades.map((t) => (
            <motion.div
              key={t.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
            >
              <Card className="mb-3 border-white/10 bg-black/60 p-4 hover:bg-black/40 transition">
                <div className="flex justify-between items-start">
                  <div>
                    <div className="text-sm text-gray-200">
                      <span className="font-semibold text-teal-300">{t.requester?.name ?? 'User'}</span>{' '}→{' '}
                      <span className="font-semibold text-teal-300">{t.target?.name ?? 'User'}</span>
                    </div>
                    <div className="text-xs text-gray-400">
                      {new Date(t.createdAt).toLocaleString()}
                    </div>
                  </div>
                  <div
                    className={`text-xs font-semibold ${
                      t.status === 'pending'
                        ? 'text-yellow-400'
                        : t.status === 'accepted'
                        ? 'text-teal-400'
                        : 'text-red-400'
                    }`}
                  >
                    {t.status.toUpperCase()}
                  </div>
                </div>

                <div className="mt-3 grid grid-cols-1 gap-2 md:grid-cols-2 text-sm text-gray-300">
                  <div>
                    <div className="font-semibold text-gray-400 mb-1">Offer</div>
                    <pre className="whitespace-pre-wrap rounded bg-black/30 p-2 text-xs">
                      {JSON.stringify(t.offerTracks, null, 2)}
                    </pre>
                  </div>
                  <div>
                    <div className="font-semibold text-gray-400 mb-1">Ask</div>
                    <pre className="whitespace-pre-wrap rounded bg-black/30 p-2 text-xs">
                      {JSON.stringify(t.askTracks, null, 2)}
                    </pre>
                  </div>
                </div>

                {t.targetId === userId && t.status === 'pending' && (
                  <div className="mt-3 flex gap-2">
                    <Button
                      size="sm"
                      className="bg-teal-500/80 text-black hover:bg-teal-400"
                      onClick={() =>
                        setTrades((prev) =>
                          prev.map((tr) =>
                            tr.id === t.id ? { ...tr, status: 'accepted' } : tr
                          )
                        )
                      }
                    >
                      Accept
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="text-red-400 hover:text-red-500"
                      onClick={() =>
                        setTrades((prev) =>
                          prev.map((tr) =>
                            tr.id === t.id ? { ...tr, status: 'declined' } : tr
                          )
                        )
                      }
                    >
                      Decline
                    </Button>
                  </div>
                )}
              </Card>
            </motion.div>
          ))}
        </AnimatePresence>

        {trades.length === 0 && (
          <div className="flex h-40 items-center justify-center text-gray-500 text-sm">
            No trades yet. Start one!
          </div>
        )}
      </ScrollArea>

      {/* Request Trade Dialog */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md border border-white/10 bg-black/80 text-gray-200 backdrop-blur-lg">
          <DialogHeader>
            <DialogTitle className="text-teal-300">Request Trade</DialogTitle>
          </DialogHeader>
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="space-y-3"
          >
            <Input
              placeholder="Target User ID"
              value={newTrade.targetId}
              onChange={(e) =>
                setNewTrade((p) => ({ ...p, targetId: e.target.value }))
              }
              className="border-white/10 bg-black/60"
            />
            <Textarea
              placeholder='Offer Tracks (JSON array, e.g. ["Track A", "Track B"])'
              value={newTrade.offerTracks}
              onChange={(e) =>
                setNewTrade((p) => ({ ...p, offerTracks: e.target.value }))
              }
              className="border-white/10 bg-black/60 text-xs"
            />
            <Textarea
              placeholder='Ask Tracks (JSON array, e.g. ["Track X", "Track Y"])'
              value={newTrade.askTracks}
              onChange={(e) =>
                setNewTrade((p) => ({ ...p, askTracks: e.target.value }))
              }
              className="border-white/10 bg-black/60 text-xs"
            />

            <div className="flex justify-end gap-2 pt-2">
              <Button
                variant="ghost"
                size="sm"
                className="text-gray-400 hover:text-teal-400"
                onClick={() => setOpen(false)}
              >
                Cancel
              </Button>
              <Button
                onClick={createTrade}
                disabled={creating}
                className="bg-teal-500/80 text-black hover:bg-teal-400"
              >
                {creating ? 'SubmittingÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚Â¦' : 'Send Request'}
              </Button>
            </div>
          </motion.div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

