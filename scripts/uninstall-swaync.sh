#!/usr/bin/env bash
set -euo pipefail
ROOT="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")/.." && pwd)"
CONFIG="${XDG_CONFIG_HOME:-$HOME/.config}/swaync/config.json"
STATE="${XDG_STATE_HOME:-$HOME/.local/state}/chatgpt-swaync-inbox/install-state.json"
DEFAULT_HELPER="${XDG_DATA_HOME:-$HOME/.local/share}/chatgpt-swaync-inbox/focus-browser-hyprland.sh"
FOCUS_HELPER="$DEFAULT_HELPER"
if [[ -f "$STATE" ]]; then
  FOCUS_HELPER="$(python3 - "$STATE" "$DEFAULT_HELPER" <<'PY'
import json,sys
try:
    state=json.load(open(sys.argv[1]))
    print(state.get('focus_helper') or sys.argv[2])
except Exception:
    print(sys.argv[2])
PY
)"
fi
python3 "$ROOT/tools/swaync_config.py" remove --config "$CONFIG" --state "$STATE"
rm -f -- "$FOCUS_HELPER"
rmdir --ignore-fail-on-non-empty -- "$(dirname -- "$FOCUS_HELPER")" 2>/dev/null || true
if command -v swaync-client >/dev/null 2>&1; then
  swaync-client -R >/dev/null 2>&1 || true
fi
printf '%s\n' 'swaync integration removed.'
