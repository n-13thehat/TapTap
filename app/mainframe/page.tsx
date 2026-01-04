"use client";
import Link from "next/link";
import React, { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { connectDesktopBridge, startNfcSession, readNdefOnce } from "@/electron/bridge/nfc";
import MatrixBackgroundMode from "../components/MatrixBackgroundMode";
import { motion } from "framer-motion";
import {
  Terminal,
  Usb,
  Nfc,
  Wifi,
  WifiOff,
  CheckCircle,
  AlertCircle,
  Scan,
  Settings,
  RefreshCw,
  Zap
} from "lucide-react";
import {
  PageContainer,
  PageHeader,
  LoadingState,
  ErrorState
} from "@/components/ui/StandardizedComponents";
import { useMatrixIframes } from "@/hooks/useMatrixIframes";

function MainframeContent() {
  const searchParams = useSearchParams();
  const embed = String(searchParams?.get("embed") ?? "") === "1";
  const TITLE = "Mainframe";
  const KEY: string = "mainframe";

  const [hasWebUSB, setHasWebUSB] = useState<boolean>(false);
  const [hasWebNDEF, setHasWebNDEF] = useState<boolean>(false);
  const [bridgeStatus, setBridgeStatus] = useState<string>("");
  const [bridgeConnected, setBridgeConnected] = useState<boolean>(false);
  const [scanBusy, setScanBusy] = useState<boolean>(false);
  const [scanStatus, setScanStatus] = useState<string>("");
  const [scanResult, setScanResult] = useState<null | { ok?: boolean; added?: number; error?: string }>(null);
  const [loading, setLoading] = useState(true);

  // Auto-enhance any iframes on this page
  useMatrixIframes();

  useEffect(() => {
    async function checkCapabilities() {
      setLoading(true);
      try {
        setHasWebUSB(typeof navigator !== "undefined" && !!(navigator as any).usb);
      } catch { setHasWebUSB(false); }
      try {
        const ndefAvail = typeof window !== "undefined" && typeof (window as any).NDEFReader !== "undefined";
        setHasWebNDEF(!!ndefAvail);
      } catch { setHasWebNDEF(false); }
      setLoading(false);
    }
    checkCapabilities();
  }, []);

  const handleBridge = async () => {
    setBridgeStatus("Connecting to Desktop Bridge...");
    setBridgeConnected(false);
    try {
      const ok = await connectDesktopBridge();
      setBridgeConnected(ok);
      setBridgeStatus(ok ? "Bridge connected. Ready for NFC/USB operations." : "Bridge not available.");
    } catch (e: any) {
      setBridgeStatus(`Bridge error: ${e?.message || String(e)}`);
      setBridgeConnected(false);
    }
  };

  const handleScanAndClaim = async () => {
    try {
      setScanBusy(true);
      setScanResult(null);
      setScanStatus("Starting NFC session via Desktop Bridge…");
      const ok = await startNfcSession();
      if (!ok) {
        setScanStatus("Desktop Bridge NFC not available. Ensure Electron app is running.");
        setScanBusy(false);
        return;
      }
      setScanStatus("Waiting for tag… hold near reader.");
      const payload = await readNdefOnce();
      if (!payload) {
        setScanStatus("No tag read. Try again.");
        setScanBusy(false);
        return;
      }
      setScanStatus("Tag read. Claiming to your library…");
      const resp = await fetch("/api/library/claim-tap", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ tapPayload: payload }) });
      const json = await resp.json();
      setScanResult(json);
      if (!resp.ok) setScanStatus(json?.error || "Claim failed");
      else setScanStatus(`Claimed: added ${json?.added ?? 0} item(s).`);
    } catch (e: any) {
      setScanStatus(e?.message || "Scan failed");
    } finally {
      setScanBusy(false);
    }
  };

  if (embed) {
    return (
      <PageContainer showMatrix={true}>
        <div className="p-4">
          <div className="mb-3 flex items-center gap-3">
            <div className="h-12 w-12 rounded-lg bg-teal-500/20 ring-1 ring-teal-400/30 flex items-center justify-center">
              <Terminal className="h-6 w-6 text-teal-300" />
            </div>
            <h1 className="text-lg font-semibold text-teal-300">Mainframe</h1>
          </div>
          <div className="rounded-xl border border-white/10 bg-white/5 p-4 text-sm text-white/70">
            Hardware connectivity interface - open full page for complete functionality
          </div>
        </div>
      </PageContainer>
    );
  }

  return (
    <PageContainer showMatrix={true}>
      <div className="absolute inset-0 z-0">
        <MatrixBackgroundMode mode="galaxy" />
      </div>

      <PageHeader
        title="Mainframe"
        subtitle="Hardware connectivity and NFC operations"
        icon={Terminal}
        showBackButton={true}
        actions={
          <div className="flex items-center gap-2">
            <button
              onClick={() => window.location.reload()}
              className="rounded-md border border-white/10 bg-white/5 p-2 text-white/70 hover:bg-white/10 transition-colors"
            >
              <RefreshCw className="h-4 w-4" />
            </button>
            <button className="rounded-md border border-white/10 bg-white/5 p-2 text-white/70 hover:bg-white/10 transition-colors">
              <Settings className="h-4 w-4" />
            </button>
          </div>
        }
      />

      <div className="relative z-10 max-w-6xl mx-auto px-4 py-8 space-y-8">{loading ? (
          <LoadingState message="Checking hardware capabilities..." showMatrix={false} />
        ) : (
          <>
            {/* Hardware Connectivity Status */}
            <motion.section
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white/5 rounded-xl border border-white/10 p-6"
            >
              <div className="flex items-center gap-3 mb-6">
                <div className="h-10 w-10 rounded-lg bg-blue-500/20 ring-1 ring-blue-400/30 flex items-center justify-center">
                  <Wifi className="h-5 w-5 text-blue-300" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-white">Hardware Connectivity</h2>
                  <p className="text-sm text-white/60">Check browser and system hardware capabilities</p>
                </div>
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.1 }}
                  className="rounded-lg border border-white/10 bg-black/40 p-4"
                >
                  <div className="flex items-center gap-3 mb-2">
                    <Usb className="h-5 w-5 text-white/70" />
                    <span className="font-medium text-white/90">WebUSB</span>
                  </div>
                  <div className={`flex items-center gap-2 ${hasWebUSB ? "text-emerald-300" : "text-amber-300"}`}>
                    {hasWebUSB ? <CheckCircle className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
                    <span className="text-sm">
                      {hasWebUSB ? "Available in this browser" : "Not available (use Desktop Bridge)"}
                    </span>
                  </div>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.2 }}
                  className="rounded-lg border border-white/10 bg-black/40 p-4"
                >
                  <div className="flex items-center gap-3 mb-2">
                    <Nfc className="h-5 w-5 text-white/70" />
                    <span className="font-medium text-white/90">Web NFC (NDEF)</span>
                  </div>
                  <div className={`flex items-center gap-2 ${hasWebNDEF ? "text-emerald-300" : "text-amber-300"}`}>
                    {hasWebNDEF ? <CheckCircle className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
                    <span className="text-sm">
                      {hasWebNDEF ? "Available in this browser" : "Not available (use Desktop Bridge)"}
                    </span>
                  </div>
                </motion.div>
              </div>

              {(!hasWebUSB || !hasWebNDEF) && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className="mt-6 pt-6 border-t border-white/10"
                >
                  <div className="flex items-center gap-3 mb-4">
                    <div className={`h-8 w-8 rounded-lg flex items-center justify-center ${
                      bridgeConnected
                        ? 'bg-emerald-500/20 ring-1 ring-emerald-400/30'
                        : 'bg-amber-500/20 ring-1 ring-amber-400/30'
                    }`}>
                      {bridgeConnected ? <Wifi className="h-4 w-4 text-emerald-300" /> : <WifiOff className="h-4 w-4 text-amber-300" />}
                    </div>
                    <div>
                      <h3 className="font-medium text-white">Desktop Bridge</h3>
                      <p className="text-sm text-white/60">Connect to desktop app for hardware access</p>
                    </div>
                  </div>

                  <button
                    onClick={handleBridge}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-teal-500/90 text-black font-semibold rounded-lg hover:bg-teal-400 transition-colors"
                  >
                    <Zap className="h-4 w-4" />
                    Connect via Desktop Bridge
                  </button>

                  {bridgeStatus && (
                    <motion.div
                      initial={{ opacity: 0, y: 5 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={`mt-3 p-3 rounded-lg border text-sm ${
                        bridgeConnected
                          ? 'border-emerald-400/30 bg-emerald-400/10 text-emerald-200'
                          : 'border-amber-400/30 bg-amber-400/10 text-amber-200'
                      }`}
                    >
                      {bridgeStatus}
                    </motion.div>
                  )}
                </motion.div>
              )}
            </motion.section>

            {/* NFC Scanning */}
            <motion.section
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-white/5 rounded-xl border border-white/10 p-6"
            >
              <div className="flex items-center gap-3 mb-6">
                <div className="h-10 w-10 rounded-lg bg-emerald-500/20 ring-1 ring-emerald-400/30 flex items-center justify-center">
                  <Scan className="h-5 w-5 text-emerald-300" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-white">Scan + Claim to Library</h2>
                  <p className="text-sm text-white/60">Use NFC scanning to automatically add content to your library</p>
                </div>
              </div>

              <div className="space-y-4">
                <p className="text-white/70">
                  Use the Desktop Bridge to scan an NFC tag and automatically add the referenced content to your Library.
                </p>

                <div className="flex items-center gap-3">
                  <button
                    disabled={scanBusy || !bridgeConnected}
                    onClick={handleScanAndClaim}
                    className="inline-flex items-center gap-2 px-6 py-3 bg-emerald-500/90 text-black font-semibold rounded-lg hover:bg-emerald-400 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {scanBusy ? (
                      <>
                        <div className="animate-spin h-4 w-4 border-2 border-black/30 border-t-black rounded-full" />
                        Scanning...
                      </>
                    ) : (
                      <>
                        <Scan className="h-4 w-4" />
                        Scan and Claim
                      </>
                    )}
                  </button>

                  {scanStatus && (
                    <motion.div
                      initial={{ opacity: 0, x: 10 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="text-sm text-white/70"
                    >
                      {scanStatus}
                    </motion.div>
                  )}
                </div>

                {scanResult && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`p-4 rounded-lg border ${
                      scanResult.ok
                        ? "border-emerald-400/30 bg-emerald-400/10"
                        : "border-rose-400/30 bg-rose-400/10"
                    }`}
                  >
                    <div className={`flex items-center gap-2 ${
                      scanResult.ok ? 'text-emerald-200' : 'text-rose-200'
                    }`}>
                      {scanResult.ok ? <CheckCircle className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
                      <span className="font-medium">
                        {scanResult.ok ? 'Scan Successful' : 'Scan Failed'}
                      </span>
                    </div>
                    <p className="text-sm mt-1 text-white/80">
                      {scanResult.ok ? (
                        `Added ${scanResult.added ?? 0} item(s) to your Library.`
                      ) : (
                        `Claim failed: ${scanResult.error || "Unknown error"}`
                      )}
                    </p>
                  </motion.div>
                )}
              </div>
            </motion.section>
          </>
        )}
      </div>
    </PageContainer>
  );
}

export default function MainframePage() {
  return (
    <Suspense fallback={
      <PageContainer>
        <PageHeader title="Mainframe" />
        <LoadingState message="Loading mainframe..." />
      </PageContainer>
    }>
      <MainframeContent />
    </Suspense>
  );
}






