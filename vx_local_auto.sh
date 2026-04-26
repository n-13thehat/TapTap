#!/usr/bin/env bash
set -euo pipefail
trap 'echo "❌ Error line $LINENO" | tee -a vx_local_auto.log' ERR

ROOT="$HOME/Desktop/TapTap-Mainframe gitty"
STAGE_DIR="$ROOT/stages"
LOG="$ROOT/vx_local_auto.log"

echo "🚀 VX Local Auto-Runner"
echo "📁 Watching: $STAGE_DIR"
echo "--------------------------------------" | tee -a "$LOG"

LAST_HASH=""

while true; do
  if [[ -d "$STAGE_DIR" ]]; then
    CURRENT_HASH=$(find "$STAGE_DIR" -type f -name "*.sh" -exec sha1sum {} \; | sha1sum | awk '{print $1}')
    if [[ "$CURRENT_HASH" != "$LAST_HASH" ]]; then
      echo "🆕 Detected new or updated stage at $(date)" | tee -a "$LOG"

      for FILE in $(find "$STAGE_DIR" -type f -name "*.sh" | sort); do
        echo "⚙️  Running $FILE ..." | tee -a "$LOG"
        chmod +x "$FILE"
        bash "$FILE" 2>&1 | tee -a "$LOG"
      done

      echo "✅ Completed batch at $(date)" | tee -a "$LOG"
      LAST_HASH="$CURRENT_HASH"
    fi
  else
    echo "⚠️  No stages folder found at $STAGE_DIR" | tee -a "$LOG"
  fi

  echo "🕒 Sleeping 10 minutes..."
  sleep 600
done
