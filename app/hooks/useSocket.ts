"use client";
import { useEffect, useRef } from 'react'
import { io, Socket } from 'socket.io-client'

type Options = {
  user?: string
  onNotification?: (payload: any) => void
}

export function useSocket(opts?: Options) {
  const socketRef = useRef<Socket | null>(null)

  useEffect(() => {
    let disposed = false
    // Try to initialize the server (idempotent)
    fetch('/api/socket').catch(() => {})

    const socket = io({ path: '/api/socket' })
    socketRef.current = socket

    socket.on('connect', () => {
      if (opts?.user) socket.emit('identify', { user: opts.user })
    })

    socket.on('notification', (payload: any) => {
      opts?.onNotification?.(payload)
    })

    socket.on('connect_error', () => {
      // Fallback demo notifications if server unavailable
      if (disposed) return
      const demo = [
        { title: 'Offline notice', body: 'Socket server not available.' },
        { title: 'Demo', body: 'This is a local demo notification.' },
        { title: 'Tips', body: 'Start server route at /api/socket.' },
      ]
      for (const n of demo) opts?.onNotification?.(n)
    })

    return () => {
      disposed = true
      try { socket.disconnect() } catch {}
      socketRef.current = null
    }
  }, [opts])

  return socketRef
}
