#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")/.." && pwd)"
HELPER="$ROOT/scripts/focus-firefox-hyprland.sh"
TMP="$(mktemp -d)"
trap 'rm -rf "$TMP"' EXIT

FAKE_BIN="$TMP/bin"
mkdir -p "$FAKE_BIN"
cat >"$FAKE_BIN/hyprctl" <<'SH'
#!/usr/bin/env bash
set -euo pipefail
case "${1:-}" in
  clients)
    cat "${FAKE_CLIENTS:?}"
    ;;
  dispatch)
    printf '%s\n' "${2:-}" >> "${DISPATCH_LOG:?}"
    ;;
  *)
    exit 2
    ;;
esac
SH
chmod +x "$FAKE_BIN/hyprctl"

run_helper() {
  PATH="$FAKE_BIN:/usr/bin:/bin" \
  CHATGPT_SWAYNC_FOCUS_DELAY=0 \
  FAKE_CLIENTS="$1" \
  DISPATCH_LOG="$2" \
  "$HELPER"
}

# Outside Hyprland, the helper must be a no-op even if hyprctl is available.
printf '%s\n' '[{"class":"firefox","title":"[ChatGPT Inbox Return] Demo","address":"0xabc"}]' > "$TMP/clients.json"
: > "$TMP/dispatch.log"
env -u HYPRLAND_INSTANCE_SIGNATURE \
  PATH="$FAKE_BIN:/usr/bin:/bin" \
  CHATGPT_SWAYNC_FOCUS_DELAY=0 \
  FAKE_CLIENTS="$TMP/clients.json" \
  DISPATCH_LOG="$TMP/dispatch.log" \
  "$HELPER"
[[ ! -s "$TMP/dispatch.log" ]]

# With multiple Firefox windows, only the one carrying the source marker is eligible.
cat > "$TMP/clients.json" <<'JSON'
[
  {"class":"firefox","title":"Other Chat","address":"0x111"},
  {"class":"kitty","title":"Work","address":"0x222"},
  {"class":"firefox","title":"[ChatGPT Inbox Return] ChatGPT","address":"0xabc"}
]
JSON
: > "$TMP/dispatch.log"
HYPRLAND_INSTANCE_SIGNATURE=test run_helper "$TMP/clients.json" "$TMP/dispatch.log"
grep -Fq "w.address == '0xabc'" "$TMP/dispatch.log"
if grep -Fq "0x111" "$TMP/dispatch.log"; then
  echo 'focus helper targeted an unmarked Firefox window' >&2
  exit 1
fi

# If no marker is present, fail quiet instead of focusing an arbitrary Firefox window.
printf '%s\n' '[{"class":"firefox","title":"Unmarked Chat","address":"0x111"}]' > "$TMP/clients.json"
: > "$TMP/dispatch.log"
HYPRLAND_INSTANCE_SIGNATURE=test run_helper "$TMP/clients.json" "$TMP/dispatch.log"
[[ ! -s "$TMP/dispatch.log" ]]

printf '%s\n' 'Hyprland focus helper tests passed'
