#!/usr/bin/env bash
set -euo pipefail

# Wayland compositors are allowed to reject browser.windows.update({focused:true}).
# swaync launches this helper only when a ChatGPT completion notification action
# is explicitly activated. Tampermonkey marks the originating tab title briefly;
# focus only that exact Firefox window and fail quietly if the marker is absent.

MARKER='[ChatGPT Inbox Return] '
DELAY="${CHATGPT_SWAYNC_FOCUS_DELAY:-0.20}"

# This integration is intentionally a no-op outside Hyprland.
[[ -n "${HYPRLAND_INSTANCE_SIGNATURE:-}" ]] || exit 0
command -v hyprctl >/dev/null 2>&1 || exit 0
command -v python3 >/dev/null 2>&1 || exit 0

sleep "$DELAY"

find_marked_address() {
  hyprctl clients -j 2>/dev/null | python3 -c '
import json
import sys
marker = sys.argv[1]
try:
    clients = json.load(sys.stdin)
except Exception:
    raise SystemExit(0)
for client in clients:
    cls = str(client.get("class") or "").lower()
    title = str(client.get("title") or "")
    if "firefox" in cls and title.startswith(marker):
        print(client.get("address") or "")
        break
' "$MARKER"
}

# Give Tampermonkey's notification callback a short window to activate the
# originating tab and expose its marker as the Firefox window title.
address=""
for _ in 1 2 3 4 5 6; do
  address="$(find_marked_address || true)"
  [[ -n "$address" ]] && break
  sleep 0.05
done

[[ -n "$address" ]] || exit 0

expr="(function() local target=nil; for _,w in ipairs(hl.get_windows()) do if w.address == '$address' then target=w; break end end; if target then return hl.dsp.focus({window=target}) else return hl.dsp.no_op() end end)()"
hyprctl dispatch "$expr" >/dev/null 2>&1 || true
