#!/usr/bin/env bash
set -u
ROOT="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")/.." && pwd)"
CONFIG="${XDG_CONFIG_HOME:-$HOME/.config}/swaync/config.json"
STATE="${XDG_STATE_HOME:-$HOME/.local/state}/chatgpt-swaync-inbox/install-state.json"
fail=0

check_cmd() {
  if command -v "$1" >/dev/null 2>&1; then
    printf 'OK   command: %s\n' "$1"
  else
    printf 'FAIL command missing: %s\n' "$1"
    fail=1
  fi
}

check_cmd python3
check_cmd swaync
check_cmd swaync-client
check_cmd notify-send

if pgrep -x swaync >/dev/null 2>&1; then
  printf 'OK   swaync is running\n'
else
  printf 'FAIL swaync is not running\n'
  fail=1
fi

if [ -n "${DBUS_SESSION_BUS_ADDRESS:-}" ]; then
  printf 'OK   DBUS_SESSION_BUS_ADDRESS is set\n'
else
  printf 'WARN DBUS_SESSION_BUS_ADDRESS is not set in this shell\n'
fi

if python3 "$ROOT/tools/swaync_config.py" check --config "$CONFIG" --state "$STATE"; then
  printf 'OK   persistent ChatGPT rule is active\n'
else
  printf 'FAIL persistent ChatGPT rule is not fully active\n'
  fail=1
fi

if command -v swaync-client >/dev/null 2>&1; then
  dnd="$(swaync-client -D 2>/dev/null || true)"
  inhibited="$(swaync-client -I 2>/dev/null || true)"
  printf 'INFO DND=%s inhibited=%s\n' "${dnd:-unknown}" "${inhibited:-unknown}"
fi

exit "$fail"
