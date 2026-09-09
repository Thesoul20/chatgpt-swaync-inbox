# Demo media

This directory contains the accepted public showcase media for `chatgpt-swaync-inbox` v3.

## Final assets

| Asset | Purpose | v3 output |
|---|---|---|
| `main-demo.mp4` | Main GitHub/Release product demo | 23.55 s, 1920×1080, 30 fps, H.264 |
| `main-demo-preview.webp` | Lightweight looping README preview | 8.04 s source timeline, 960×540 animated WebP |
| `notification.png` | Completion notification while another app remains focused | 1920×1080 final-timeline still |
| `swaync-inbox.png` | Persistent ChatGPT result in swaync | 1920×1080 final-timeline still |
| `click-to-return.png` | Originating ChatGPT conversation after explicit handling | 1920×1080 final-timeline still |

## Story

The v3 film is intentionally reduced to the actual user value loop:

```text
ASK
↓
KEEP WORKING
↓
RESULT WAITS
↓
CLICK TO RETURN
```

It shows real product behavior for every important claim:

1. a privacy-safe ChatGPT task is submitted;
2. the user switches to the project's public GitHub page and keeps working;
3. a real `ChatGPT Answer Complete` notification appears while Chrome remains focused;
4. the result persists as a real swaync Inbox card;
5. a real mouse click on that card triggers the product's action path;
6. Firefox returns to the originating ChatGPT conversation with the completed answer visible.

The click-to-return sequence remains continuous source footage; there is no notification-screenshot → ChatGPT-screenshot substitution. The small Remotion click ripple only emphasizes the already-real click.

## AgentDock-native production stack

The production path used for this revision is:

```text
Current ChatGPT conversation
        ↓
AgentDock
        ├── video-shotcraft Skill
        ├── remotion-dev/skills
        ├── Remotion 4.0.522
        ├── Chromium Headless Shell
        └── FFmpeg for encode/diagnostics
        ↓
GitHub-ready showcase assets
```

Validated Skill/tool inputs:

- `video-shotcraft` upstream revision `fce06e5` (Apache-2.0); the upstream package lacked AgentDock's required semantic `version` metadata, so validation used a local compatibility copy adding only `version: 0.0.0+fce06e5` before installation/activation;
- `remotion-dev/skills` revision `11986e4`;
- AgentDock-activated Remotion Skills: `remotion-best-practices`, `remotion-create`, `remotion-markup`, `remotion-render`, and `remotion-studio`;
- Remotion `4.0.522`, which is also the version that passed the sample-render gate and the final production render.

A local sample H.264 render was completed before final editing. No local Codex CLI was invoked and no paid external model API is required by the production path.

## Real-footage capture

The final source material was captured on Arch Linux + Hyprland/Wayland with OBS + PipeWire at 1920×1080 / 30 fps.

For unattended capture, the recording session temporarily used:

- an XDPH custom picker that selected the physical `HDMI-A-1` output deterministically;
- `screencopy:cursor_mode = 2` when verifying embedded-cursor capture;
- a temporary local OBS WebSocket configuration for graceful AgentDock-controlled StartRecord/StopRecord;
- a temporary `ydotoold` `/dev/uinput` path for the real notification-card left click.

Those capture-only settings are not part of the product configuration and must be restored after production.

Raw normalized v3 sources are kept outside Git under the ignored directory:

```text
docs/assets/demo/raw/v3/
├── ask.mp4
├── work.mp4
├── inbox.mp4
└── return.mp4
```

The public repository should retain the final assets and the deterministic Remotion project, not raw capture footage.

## Re-rendering

The reusable project lives at `tools/demo-video-v3/`.

From the repository root:

```bash
tools/demo-video-v3/render-v3.sh
```

The script validates source availability, copies ignored raw clips into Remotion's temporary `public/sources/`, runs lint/type checking, renders the main and preview compositions, creates the WebP and final stills, validates output specifications, and removes temporary copied sources.

To inspect the project in Remotion Studio while retaining copied sources:

```bash
KEEP_SOURCES=1 tools/demo-video-v3/render-v3.sh
cd tools/demo-video-v3
npm run dev
```

## Why Remotion replaced the v2 camera system

The rejected v2 edit used screenshot/ImageMagick/custom-FFmpeg camera motion. It was functionally correct but produced visible zoom/pan jitter, encouraged a demo-only command-running scene, and ended on an incomplete screenshot-like return view.

v3 moves cinematic motion to a deterministic frame-based Remotion timeline:

- stable easing rather than frame-to-frame crop scripts;
- a real public GitHub work surface instead of command-running filler;
- explicit focal treatment for the composer, completion notification, Inbox card, and return action;
- a complete landing hold on the originating conversation;
- one reusable render project instead of one-off video-filter commands.

## Privacy review

Before publishing replacements, verify that public media does not expose:

- private ChatGPT history or unrelated conversation titles;
- email addresses, account credentials, tokens, or API keys;
- bookmarks/profile data that is not required by the demo;
- local filesystem paths, usernames, hostnames, or terminal prompts;
- unrelated notification-center history;
- private project/document content.

The v3 public flow uses a dedicated safe AI-agent prompt, the project's public GitHub repository, a single ChatGPT completion card, and the returned dedicated conversation. No terminal scene is present in the final film.

## No-Codex statement

The final production pipeline is explicitly:

```text
ChatGPT reasoning → AgentDock execution → local Remotion/Chromium/FFmpeg rendering
```

It does not require the local `codex` CLI and does not consume the user's Codex 5-hour allowance.

## README integration

Task `0001 - README Hero & Information Architecture` can consume these assets directly. A minimal placement is:

```markdown
## Demo

![Demo preview](docs/assets/demo/main-demo-preview.webp)

Leave ChatGPT running, keep working, and return only when the result is ready.
```

Link `main-demo.mp4` nearby for the full 23.5-second flow. Full README information-architecture work remains outside task 0000.
