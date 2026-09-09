#!/usr/bin/env bash
set -euo pipefail
ROOT="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")/.." && pwd)"
SCRIPT="$ROOT/userscript/chatgpt-swaync-inbox.user.js"
node --check "$SCRIPT"
grep -q "@match        https://chatgpt.com/\*" "$SCRIPT"
grep -q "title: NOTIFICATION_TITLE" "$SCRIPT"
grep -q "const NOTIFICATION_TITLE = 'ChatGPT Answer Complete'" "$SCRIPT"
if grep -A12 "function sendNotification" "$SCRIPT" | grep -q "timeout:"; then
  echo 'production notification must not set a timeout' >&2
  exit 1
fi
printf '%s\n' 'userscript static checks passed'
