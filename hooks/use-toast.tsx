"use client"

import * as React from 'react'

export type Toast = {
  id: string
  title?: string
  description?: string
  action?: React.ReactElement
  variant?: 'default' | 'destructive'
  duration?: number
}

const ToastContext = React.createContext<{
  toasts: Toast[]
  toast: (props: Omit<Toast, "id">) => void
  dismiss: (id: string) => void
}>({
  toasts: [],
  toast: () => {},
  dismiss: () => {},
})

export function useToast() {
  return React.useContext(ToastContext)
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = React.useState<Toast[]>([])

  const dismiss = React.useCallback((id: string) => {
    setToasts((current) => current.filter((t) => t.id !== id))
  }, [])

  const toast = React.useCallback((props: Omit<Toast, "id">) => {
    const id = Math.random().toString(36).slice(2)
    setToasts((current) => [...current, { ...props, id }])
    
    // Auto dismiss after duration
    if (props.duration !== Infinity) {
      setTimeout(() => dismiss(id), props.duration ?? 4000)
    }
  }, [dismiss])

  return (
    <ToastContext.Provider value={{ toasts, toast, dismiss }}>
      {children}
    </ToastContext.Provider>
  )
}
