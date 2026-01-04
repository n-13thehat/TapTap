"use client"

import { useState } from "react"

export interface Toast {
  id: string
  message: string
}

export const useToast = () => {
  const [toasts, setToasts] = useState<Toast[]>([])

  const toast = (props: Omit<Toast, "id">) => {
    const id = Math.random().toString(36).substring(2, 9)
    setToasts([...toasts, { id, ...props }])
    setTimeout(() => dismiss(id), 5000)
  }

  const dismiss = (id: string) => {
    setToasts(toasts.filter(t => t.id !== id))
  }

  return { toasts, toast, dismiss }
}