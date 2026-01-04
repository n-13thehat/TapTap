// Desktop Bridge NFC/USB stub
// In Electron, this file would communicate with the preload/main process via IPC.
// Here we provide a safe stub that resolves gracefully in web-only environments.

export async function connectDesktopBridge(): Promise<boolean> {
  try {
    // @ts-ignore
    const api = (globalThis as any).electronBridge || (globalThis as any).window?.electronBridge
    if (api && typeof api.connect === 'function') {
      await api.connect()
      return true
    }
    // Simulate probing an IPC channel if not present
    return false
  } catch {
    return false
  }
}

export async function startNfcSession(): Promise<boolean> {
  try {
    // @ts-ignore
    const api = (globalThis as any).electronBridge
    if (api && typeof api.startNfcSession === 'function') {
      await api.startNfcSession()
      return true
    }
    return false
  } catch {
    return false
  }
}

export async function readNdefOnce(): Promise<string | null> {
  try {
    // @ts-ignore
    const api = (globalThis as any).electronBridge
    if (api && typeof api.readNdefOnce === 'function') {
      const payload = await api.readNdefOnce()
      return payload ?? null
    }
    return null
  } catch {
    return null
  }
}

