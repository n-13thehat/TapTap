"use client"

import React, { createContext, useCallback, useContext, useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"

type Toast = {
  id: string
  message: string
  type?: "info" | "success" | "error"
  duration?: number
}

interface ToastContextType {
  toasts: Toast[]
  toast: (msg: Omit<Toast, "id">) => void
  dismiss: (id: string) => void
}

const ToastContext = createContext<ToastContextType>({
  toasts: [],
  toast: () => {},
  dismiss: () => {},
})

export const useToast = () => useContext(ToastContext)

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])

  const dismiss = useCallback((id: string) => {
    setToasts(t => t.filter(toast => toast.id !== id))
  }, [])

  const toast = useCallback((msg: Omit<Toast, "id">) => {
    const id = Math.random().toString(36).substring(2, 9)
    setToasts(t => [...t, { ...msg, id }])
    setTimeout(() => dismiss(id), msg.duration ?? 4000)
  }, [dismiss])

  // Inject keyframes style on client only
  useEffect(() => {
    if (typeof document === "undefined") return
    const style = document.createElement("style")
    style.innerHTML = `
@keyframes matrixPulse {
  0%, 100% { box-shadow: 0 0 10px #00ffe5aa, 0 0 20px #00ffe588; }
  50% { box-shadow: 0 0 25px #00ffe5cc, 0 0 35px #00ffe544; }
}`
    document.head.appendChild(style)
    return () => {
      try { document.head.removeChild(style) } catch { /* ignore */ }
    }
  }, [])

  return (
    <ToastContext.Provider value={{ toasts, toast, dismiss }}>
      {children}
      <div className="fixed right-4 top-4 z-[9999] flex flex-col gap-3">
        <AnimatePresence>
          {toasts.map(t => (
            <motion.div
              key={t.id}
              initial={{ opacity: 0, y: -10, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -20, scale: 0.95 }}
              transition={{ duration: 0.25 }}
              className={`relative rounded-xl px-4 py-3 text-sm font-semibold shadow-lg backdrop-blur-sm border
                ${
                  t.type === "error"
                    ? "border-red-400/40 text-red-300 bg-red-900/30"
                    : t.type === "success"
                    ? "border-emerald-400/40 text-emerald-300 bg-emerald-900/30"
                    : "border-cyan-400/40 text-cyan-300 bg-black/60"
                }
              `}
            >
              <div className="absolute inset-0 rounded-xl pointer-events-none animate-[matrixPulse_3s_ease-in-out_infinite] bg-gradient-to-br from-cyan-400/10 to-transparent" />
              <span className="relative z-10">{t.message}</span>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  )
}
