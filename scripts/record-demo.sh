#!/usr/bin/env bash
set -euo pipefail

usage() {
  cat <<'USAGE'
Usage: scripts/record-demo.sh OUTPUT.mp4 [SECONDS] [FPS]

Record the active Wayland output using grim frames piped into ffmpeg.
Defaults: 20 seconds, 6 captured frames per second, 1920x1080 H.264 output.

The script intentionally avoids adding a wf-recorder dependency so it works on the
same minimal Arch/Hyprland setup as the project itself.
USAGE
}

if [[ ${1:-} == "-h" || ${1:-} == "--help" || $# -lt 1 ]]; then
  usage
  [[ $# -ge 1 ]] && exit 0 || exit 2
fi

out=$1
duration=${2:-20}
fps=${3:-6}

for cmd in grim ffmpeg; do
  command -v "$cmd" >/dev/null 2>&1 || { echo "missing required command: $cmd" >&2; exit 1; }
done

[[ -n ${XDG_RUNTIME_DIR:-} ]] || { echo "XDG_RUNTIME_DIR is required" >&2; exit 1; }
[[ -n ${WAYLAND_DISPLAY:-} ]] || { echo "WAYLAND_DISPLAY is required" >&2; exit 1; }

mkdir -p "$(dirname "$out")"
frames=$((duration * fps))
interval=$(python3 - "$fps" <<'PY'
import sys
print(max(0.0, 1.0 / float(sys.argv[1])))
PY
)

producer() {
  local i start target now sleep_for
  start=$(python3 - <<'PY'
import time
print(time.monotonic())
PY
)
  for ((i=0; i<frames; i++)); do
    grim -t png -
    target=$(python3 - "$start" "$i" "$interval" <<'PY'
import sys
print(float(sys.argv[1]) + (int(sys.argv[2]) + 1) * float(sys.argv[3]))
PY
)
    now=$(python3 - <<'PY'
import time
print(time.monotonic())
PY
)
    sleep_for=$(python3 - "$target" "$now" <<'PY'
import sys
print(max(0.0, float(sys.argv[1]) - float(sys.argv[2])))
PY
)
    sleep "$sleep_for"
  done
}

producer | ffmpeg -hide_banner -loglevel warning -y \
  -f image2pipe -framerate "$fps" -vcodec png -i - \
  -vf "scale=1920:1080:force_original_aspect_ratio=decrease,pad=1920:1080:(ow-iw)/2:(oh-ih)/2,fps=30,format=yuv420p" \
  -an -c:v libx264 -preset veryfast -crf 24 -movflags +faststart "$out"
