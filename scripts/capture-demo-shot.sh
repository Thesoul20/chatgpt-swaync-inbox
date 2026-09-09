#!/usr/bin/env bash
set -euo pipefail

usage() {
  echo "Usage: scripts/capture-demo-shot.sh OUTPUT.png [GEOMETRY]" >&2
  echo "Example: scripts/capture-demo-shot.sh shot.png '1850,70 650x520'" >&2
}

[[ $# -ge 1 ]] || { usage; exit 2; }
out=$1
geometry=${2:-}
command -v grim >/dev/null 2>&1 || { echo "missing required command: grim" >&2; exit 1; }
mkdir -p "$(dirname "$out")"
if [[ -n "$geometry" ]]; then
  grim -g "$geometry" "$out"
else
  grim "$out"
fi
