"use client";
import { useEffect } from "react";
import type { BootstrapPayload } from "./types";

export function LegacyBridge({ data, children }:{ data: BootstrapPayload; children: React.ReactNode }) {
  useEffect(()=> {
    try {
      (window as any).__SOCIAL_BOOTSTRAP__ = data;
      window.dispatchEvent(new CustomEvent("social:bootstrap", { detail: data }));
    } catch {}
  }, [data]);
  return <>{children}</>;
}
