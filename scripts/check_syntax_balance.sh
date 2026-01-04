#!/usr/bin/env bash
# 🔍 TapTap ZION — Syntax Balance Checker
# Scans for unmatched (), {}, [] pairs before build

set -euo pipefail
TARGET=${1:-"app/library/page.tsx"}

echo "🧠 Checking syntax balance for: $TARGET"

awk '
  {
    for (i=1;i<=length($0);i++) {
      c=substr($0,i,1)
      if (c=="{") stack[++top]="}"
      else if (c=="(") stack[++top]=")"
      else if (c=="[") stack[++top]="]"
      else if ((c=="}"||c==")"||c=="]") && top>0) {
        if (stack[top]!=c) {
          printf("❌ Mismatch at line %d: expected %s got %s\n", NR, stack[top], c)
          err=1
        }
        top--
      }
    }
  }
  END {
    if (top>0) {
      printf("❌ %d unmatched opening brace(s) remain.\n", top)
      err=1
    }
    if (!err) print("✅ All braces balanced.")
    exit err
  }
' "$TARGET"
