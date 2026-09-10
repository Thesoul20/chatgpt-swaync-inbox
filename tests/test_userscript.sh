#!/usr/bin/env bash
set -euo pipefail
ROOT="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")/.." && pwd)"
SCRIPT="$ROOT/userscript/chatgpt-swaync-inbox.user.js"
FOCUS_HELPER="$ROOT/scripts/focus-firefox-hyprland.sh"
node --check "$SCRIPT"
grep -q "@match        https://chatgpt.com/\*" "$SCRIPT"
grep -q "@version      0.2.5" "$SCRIPT"
grep -q "const NOTIFICATION_TITLE = 'ChatGPT Answer Complete'" "$SCRIPT"
grep -q "PerformanceObserver" "$SCRIPT"
grep -q "/backend-api/f/conversation" "$SCRIPT"
grep -q "selectPromptBoundTurn" "$SCRIPT"
grep -q "detectObviousError" "$SCRIPT"
grep -q "manual stop" "$SCRIPT"
grep -q "event?.preventDefault?.()" "$SCRIPT"
grep -q "@grant        window.focus" "$SCRIPT"
grep -Fq "const FOCUS_TARGET_TITLE_PREFIX = '[ChatGPT Inbox Return] ';" "$SCRIPT"
grep -q "markFocusTarget" "$SCRIPT"
grep -q "handleNotificationClick" "$SCRIPT"
grep -q "MutationObserver" "$SCRIPT"
grep -q "shouldArmForPromptChange" "$SCRIPT"
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
[[ -x "$FOCUS_HELPER" ]] || { echo 'Hyprland focus helper must be executable' >&2; exit 1; }
grep -Fq "MARKER='[ChatGPT Inbox Return] '" "$FOCUS_HELPER"
env -u HYPRLAND_INSTANCE_SIGNATURE "$FOCUS_HELPER"
printf '%s\n' 'userscript/focus-helper static checks passed'
