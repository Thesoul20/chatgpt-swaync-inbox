#!/usr/bin/env bash
set -euo pipefail
ROOT="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")/.." && pwd)"
SCRIPT="$ROOT/userscript/chatgpt-swaync-inbox.user.js"
node --check "$SCRIPT"
grep -q "@match        https://chatgpt.com/\*" "$SCRIPT"
grep -q "@version      0.2.2" "$SCRIPT"
grep -q "const NOTIFICATION_TITLE = 'ChatGPT Answer Complete'" "$SCRIPT"
grep -q "PerformanceObserver" "$SCRIPT"
grep -q "/backend-api/f/conversation" "$SCRIPT"
grep -q "selectPromptBoundTurn" "$SCRIPT"
grep -q "detectObviousError" "$SCRIPT"
grep -q "manual stop" "$SCRIPT"
grep -q "event?.preventDefault?.()" "$SCRIPT"
if grep -q "highlight: true" "$SCRIPT"; then
  echo 'production/test notifications must not request automatic tab highlighting' >&2
  exit 1
fi
grep -q "location.assign(conversationUrl)" "$SCRIPT"
if grep -qE '^[[:space:]]*url:[[:space:]]*location\.href' "$SCRIPT"; then
  echo 'notification must not use url: location.href because it opens a new tab' >&2
  exit 1
fi
if grep -A22 "function sendNotification" "$SCRIPT" | grep -q "timeout:"; then
  echo 'production notification must not set a timeout' >&2
  exit 1
fi
printf '%s\n' 'userscript static checks passed'
