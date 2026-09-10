#!/usr/bin/env bash
set -euo pipefail
ROOT="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")/.." && pwd)"
CONFIG="${XDG_CONFIG_HOME:-$HOME/.config}/swaync/config.json"
STATE="${XDG_STATE_HOME:-$HOME/.local/state}/chatgpt-swaync-inbox/install-state.json"
FOCUS_DIR="${XDG_DATA_HOME:-$HOME/.local/share}/chatgpt-swaync-inbox"
FOCUS_HELPER="$FOCUS_DIR/focus-browser-hyprland.sh"

install -Dm755 "$ROOT/scripts/focus-firefox-hyprland.sh" "$FOCUS_HELPER"
python3 "$ROOT/tools/swaync_config.py" apply --config "$CONFIG" --state "$STATE" --focus-helper "$FOCUS_HELPER"
if command -v swaync-client >/dev/null 2>&1; then
  swaync-client -R >/dev/null 2>&1 || true
fi
printf '%s\n' 'swaync integration installed.'
printf 'Hyprland click-focus helper: %s\n' "$FOCUS_HELPER"
printf '%s\n' 'Next: install userscript/chatgpt-swaync-inbox.user.js in Tampermonkey or Violentmonkey.'
