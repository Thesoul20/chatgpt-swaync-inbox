#!/usr/bin/env bash
set -euo pipefail

HERE="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
ROOT="$(cd -- "$HERE/../.." && pwd)"
RAW="$ROOT/docs/assets/demo/raw/v3"
PUBLIC="$HERE/public/sources"
OUT="$HERE/out"
ASSETS="$ROOT/docs/assets/demo"

required=(ask.mp4 work.mp4 inbox.mp4 return.mp4)
for name in "${required[@]}"; do
  if [[ ! -s "$RAW/$name" ]]; then
    printf 'missing raw source: %s\n' "$RAW/$name" >&2
    exit 2
  fi
done

if [[ ! -x "$HERE/node_modules/.bin/remotion" ]]; then
  (cd "$HERE" && npm ci)
fi

rm -rf "$PUBLIC"
mkdir -p "$PUBLIC" "$OUT" "$ASSETS"
cp "$RAW"/{ask,work,inbox,return}.mp4 "$PUBLIC/"

cleanup() {
  if [[ "${KEEP_SOURCES:-0}" != "1" ]]; then
    rm -rf "$PUBLIC"
  fi
}
trap cleanup EXIT

cd "$HERE"
npm run lint
npm run render:main
npm run render:preview

ffmpeg -y -loglevel error -i "$OUT/preview.mp4" \
  -vf 'fps=12,scale=960:-2:flags=lanczos' \
  -an -c:v libwebp -lossless 0 -quality 68 -compression_level 6 -loop 0 \
  "$ASSETS/main-demo-preview.webp"

npx remotion still src/index.ts MainDemo "$ASSETS/notification.png" --frame=280 --overwrite
npx remotion still src/index.ts MainDemo "$ASSETS/swaync-inbox.png" --frame=430 --overwrite
npx remotion still src/index.ts MainDemo "$ASSETS/click-to-return.png" --frame=660 --overwrite

python3 - "$ASSETS/main-demo.mp4" "$ASSETS/main-demo-preview.webp" <<'PY'
import json
import subprocess
import sys
from pathlib import Path

mp4 = Path(sys.argv[1])
preview = Path(sys.argv[2])
probe = json.loads(subprocess.check_output([
    'ffprobe', '-v', 'error', '-show_streams', '-show_format', '-of', 'json', str(mp4)
]))
video = next(s for s in probe['streams'] if s['codec_type'] == 'video')
duration = float(probe['format']['duration'])
assert video['codec_name'] == 'h264', video['codec_name']
assert (int(video['width']), int(video['height'])) == (1920, 1080)
assert video['avg_frame_rate'] == '30/1', video['avg_frame_rate']
assert 20 <= duration <= 30, duration
assert preview.stat().st_size > 0
print(f'validated main-demo.mp4: {duration:.3f}s, 1920x1080, 30fps, H.264')
print(f'validated main-demo-preview.webp: {preview.stat().st_size} bytes')
PY

printf 'v3 demo assets written to %s\n' "$ASSETS"
