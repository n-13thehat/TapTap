"use client";

import { checkHavenPolicy, type HavenPolicyResult } from "@/lib/havenPolicy";

export function evaluateDmMessage(text: string): HavenPolicyResult {
  return checkHavenPolicy({
    id: `dm_${text.length}_${Date.now()}`,
    type: "post",
    content: text,
    metadata: { scope: "dm" },
  });
}
