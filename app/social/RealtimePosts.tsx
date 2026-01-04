"use client";
import { useEffect } from "react";
import { subscribeToTable } from "@/app/lib/supabase";

export default function RealtimePosts() {
  useEffect(() => {
    const off = subscribeToTable("Post", null, (chg) => {
      if (chg.eventType === "INSERT" && (chg.payload as any)?.new) {
        try {
          const detail = (chg.payload as any).new;
          window.dispatchEvent(new CustomEvent("social:new-post", { detail }));
        } catch {}
      }
    });
    return off;
  }, []);
  return null;
}

