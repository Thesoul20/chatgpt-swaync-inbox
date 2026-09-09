#!/usr/bin/env bash
set -euo pipefail
ROOT="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")/.." && pwd)"
CONFIG="${XDG_CONFIG_HOME:-$HOME/.config}/swaync/config.json"
STATE="${XDG_STATE_HOME:-$HOME/.local/state}/chatgpt-swaync-inbox/install-state.json"
python3 "$ROOT/tools/swaync_config.py" apply --config "$CONFIG" --state "$STATE"
if command -v swaync-client >/dev/null 2>&1; then
  swaync-client -R >/dev/null 2>&1 || true
fi
printf '%s\n' 'swaync integration installed.'
printf '%s\n' 'Next: install userscript/chatgpt-swaync-inbox.user.js in Tampermonkey or Violentmonkey.'
