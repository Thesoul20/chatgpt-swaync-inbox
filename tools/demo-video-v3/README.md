# v3 Remotion demo pipeline

This is the deterministic post-production project for the `chatgpt-swaync-inbox` v3 showcase.

The composition intentionally keeps behavioral claims in real captured footage. Remotion is used for stable framing, easing, readable story labels, focal outlines, the click ripple, and publication rendering; it does not fabricate the notification, Inbox open, click action, or browser return.

## Version lock

The project is pinned to Remotion `4.0.522`, matching the AgentDock-installed Remotion Skills and the version that passed the local toolchain gate. Do not casually bump the Remotion patch version while preparing release media; `4.0.523` was observed to produce an incomplete bundle on this machine while `4.0.522` rendered correctly.

## Raw sources

The four normalized real clips are expected at:

```text
docs/assets/demo/raw/v3/
├── ask.mp4
├── work.mp4
├── inbox.mp4
└── return.mp4
```

That directory is ignored by Git. `render-v3.sh` copies the clips into `public/sources/` only for the render and removes that temporary directory on exit.

## Render everything

From the repository root:

```bash
tools/demo-video-v3/render-v3.sh
```

The script:

1. validates that all four real source clips exist;
2. installs locked npm dependencies if needed;
3. runs ESLint and TypeScript validation;
4. renders `MainDemo` and `Preview` with Remotion;
5. encodes the animated README WebP with FFmpeg;
6. renders the three publication stills from the same final timeline;
7. validates the main MP4 codec, dimensions, frame rate, and duration;
8. removes temporary `public/sources/` media.

Set `KEEP_SOURCES=1` only when you need the copied media to remain available for Remotion Studio:

```bash
KEEP_SOURCES=1 tools/demo-video-v3/render-v3.sh
cd tools/demo-video-v3
npm run dev
```

## Compositions

- `MainDemo` — 705 frames, 23.5 seconds, 1920×1080 at 30 fps.
- `Preview` — 240 frames, 8 seconds, focused on RESULT WAITS → CLICK TO RETURN.

The main story is:

```text
ASK → KEEP WORKING → RESULT WAITS → CLICK TO RETURN
```

The Return scene preserves the continuous real click-to-return footage. The visible click ripple is only an emphasis layer; the underlying card activation and Firefox return are real captured behavior.

## No-Codex production path

This project does not call the local `codex` CLI and does not require a paid external model API. The intended execution path is:

```text
ChatGPT reasoning → AgentDock execution → local Remotion/Chromium/FFmpeg rendering
```

See `docs/assets/demo/README.md` for the full capture, Skill, privacy, and re-record workflow.
