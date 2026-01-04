'use client'
import { useEffect, useRef, useState } from 'react'
import { io, Socket } from 'socket.io-client'

interface ChatMessage {
  id: string
  user: string
  text: string
  color?: string
}

interface ChatPanelProps {
  battleId: string
  userId?: string
  username?: string
}

export default function ChatPanel({ battleId, userId, username }: ChatPanelProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [socketConnected, setSocketConnected] = useState(false)
  const [input, setInput] = useState('')
  const chatRef = useRef<HTMLDivElement | null>(null)
  const socketRef = useRef<Socket | null>(null)

  useEffect(() => {
    if (!battleId) return
    // connect socket once
    const s = io('/', { transports: ['websocket'] })
    socketRef.current = s

    s.on('connect', () => {
      setSocketConnected(true)
      s.emit('arena:join', { room: `battle:${battleId}` })
    })

    s.on('disconnect', () => setSocketConnected(false))

    s.on('chat:message', (msg: ChatMessage) => {
      setMessages((prev) => [...prev.slice(-200), msg])
    })

    return () => {
      s.emit('arena:leave', { room: `battle:${battleId}` })
      s.disconnect()
    }
  }, [battleId])

  useEffect(() => {
    // always scroll to bottom
    chatRef.current?.scrollTo({ top: chatRef.current.scrollHeight, behavior: 'smooth' })
  }, [messages])

  async function sendMessage() {
    const text = input.trim()
    if (!text || !socketRef.current) return
    const msg: ChatMessage = {
      id: Date.now().toString(),
      user: username || 'Guest',
      text,
      color: '#' + Math.floor(Math.random() * 0xffffff).toString(16),
    }
    socketRef.current.emit('chat:message', { room: `battle:${battleId}`, msg })
    setMessages((p) => [...p.slice(-200), msg])
    setInput('')
  }

  return (
    <aside className='flex flex-col bg-white/3 border border-white/6 rounded-2xl p-3 w-full h-[600px]'>
      <div className='flex items-center justify-between mb-2'>
        <h4 className='font-semibold text-teal-300'>Live Chat</h4>
        <span className='text-xs text-white/60'>
          {socketConnected ? 'Connected' : 'Connecting...'}
        </span>
      </div>

      <div
        ref={chatRef}
        className='flex-1 overflow-y-auto space-y-2 pr-2 text-sm scrollbar-thin scrollbar-thumb-teal-500/30'
      >
        {messages.map((m) => (
          <div key={m.id}>
            <span style={{ color: m.color }} className='font-semibold mr-1'>
              {m.user}:
            </span>
            <span className='text-white/80'>{m.text}</span>
          </div>
        ))}
      </div>

      <div className='mt-3 flex items-center gap-2'>
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
          className='flex-1 bg-black/40 border border-white/10 rounded-md px-3 py-2 text-sm outline-none focus:border-teal-400'
          placeholder='Type your message...'
        />
        <button
          onClick={sendMessage}
          disabled={!socketConnected}
          className='px-3 py-2 rounded-md bg-gradient-to-r from-teal-500 to-purple-500 text-black font-bold text-sm disabled:opacity-50'
        >
          Send
        </button>
      </div>
    </aside>
  )
}
