#!/usr/bin/env bash
set -euo pipefail
if ! command -v notify-send >/dev/null 2>&1; then
  echo 'notify-send is required (Arch: libnotify)' >&2
  exit 1
fi
notify-send --app-name='chatgpt-swaync-inbox' 'ChatGPT Answer Complete' \
  'Persistent-notification test. This should remain until you dismiss it.'
echo 'Test notification sent. It should remain in swaync until manually dismissed.'
