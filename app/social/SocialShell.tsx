"use client"

import * as React from "react"
import MatrixLoader from "@/components/MatrixLoader"

export default function SocialShell({ children }: { children: React.ReactNode }) {
  const [loading, setLoading] = React.useState(true)
  React.useEffect(() => {
    const t = setTimeout(() => setLoading(false), 900)
    return () => clearTimeout(t)
  }, [])
  return (
    <>
      {loading && <MatrixLoader />}
      {children}
    </>
  )
}

