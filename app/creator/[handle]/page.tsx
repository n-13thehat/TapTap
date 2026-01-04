"use client"
import React from "react"
import { ToastProvider, useToast } from "@/components/ui/toast-provider"

export default function CreatorHandlePage() {
  const { toast } = useToast()
  return (
    <ToastProvider>
      <div className="flex flex-col items-center justify-center min-h-screen bg-black text-cyan-400">
        <h1 className="text-2xl font-bold mb-6">Creator Profile (TapTap ZION)</h1>
        <button
          onClick={() => toast({ message: "Matrix Pulse Activated âš¡", type: "success" })}
          className="rounded-lg border border-cyan-500/40 bg-black/40 px-5 py-2 hover:bg-cyan-500/10 transition-all duration-300"
        >
          Test Toast
        </button>
      </div>
    </ToastProvider>
  )
}