#!/usr/bin/env bash
set -u
ROOT="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")/.." && pwd)"
CONFIG="${XDG_CONFIG_HOME:-$HOME/.config}/swaync/config.json"
STATE="${XDG_STATE_HOME:-$HOME/.local/state}/chatgpt-swaync-inbox/install-state.json"
FOCUS_HELPER="${XDG_DATA_HOME:-$HOME/.local/share}/chatgpt-swaync-inbox/focus-browser-hyprland.sh"
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

if python3 "$ROOT/tools/swaync_config.py" check --config "$CONFIG" --state "$STATE" --focus-helper "$FOCUS_HELPER"; then
  printf 'OK   persistent ChatGPT rule/action integration is active\n'
else
  printf 'FAIL persistent ChatGPT rule/action integration is not fully active\n'
  fail=1
fi

if [ -x "$FOCUS_HELPER" ]; then
  printf 'OK   click-focus helper is installed: %s\n' "$FOCUS_HELPER"
else
  printf 'FAIL click-focus helper missing/not executable: %s\n' "$FOCUS_HELPER"
  fail=1
fi

if [ -n "${HYPRLAND_INSTANCE_SIGNATURE:-}" ]; then
  if command -v hyprctl >/dev/null 2>&1; then
    printf 'OK   Hyprland detected and hyprctl is available\n'
  else
    printf 'FAIL Hyprland detected but hyprctl is missing\n'
    fail=1
  fi
else
  printf 'INFO Hyprland not detected in this shell; focus helper will no-op outside Hyprland\n'
fi

if command -v swaync-client >/dev/null 2>&1; then
  if [ -z "${DBUS_SESSION_BUS_ADDRESS:-}" ]; then
    printf 'INFO skipped DND/inhibition query because desktop D-Bus is unavailable in this shell\n'
  else
    if command -v timeout >/dev/null 2>&1; then
      dnd="$(timeout 2s swaync-client -D 2>/dev/null || true)"
      inhibited="$(timeout 2s swaync-client -I 2>/dev/null || true)"
    else
      dnd="$(swaync-client -D 2>/dev/null || true)"
      inhibited="$(swaync-client -I 2>/dev/null || true)"
    fi
    printf 'INFO DND=%s inhibited=%s\n' "${dnd:-unknown}" "${inhibited:-unknown}"
  fi
fi

exit "$fail"
