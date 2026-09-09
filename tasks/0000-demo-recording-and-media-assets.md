# 0000 - Cinematic Demo Recording & Showcase Media

Status: Completed

Showcase revision: **v3 — AgentDock-native cinematic pipeline**

Previous state:

- v0.2.5 functional end-to-end notification and click-to-return path: verified;
- engineering validation demo: superseded;
- Cinematic Showcase v2: improved but rejected for visible motion jitter, a non-essential command-running scene, and an incomplete screenshot-like final return shot;
- v3 therefore changes both the **production stack** and the **shot design**.

## Completion evidence — 2026-09-09

- AgentDock validated and activated `video-shotcraft` plus the required Remotion Skills without invoking the local Codex CLI.
- Remotion `4.0.522` passed both the sample-render gate and the final production render; the final project is pinned to that verified version.
- Real 1920×1080 / 30 fps OBS + PipeWire footage covers prompt submission, background completion with Chrome still focused, swaync Inbox opening, a real `/dev/uinput` notification-card click, and continuous Firefox return to the originating ChatGPT conversation.
- `docs/assets/demo/main-demo.mp4` is 23.552 seconds, 1920×1080, 30 fps, H.264; the 8-second `main-demo-preview.webp` and all three required 1920×1080 stills are present.
- Final frame/contact-sheet QA found no v2-style camera jitter, command-running filler, screenshot substitution, or incomplete landing frame.
- `make test`, Remotion lint/type checking, and `git diff --check` pass.
- Temporary OBS WebSocket, XDPH picker/cursor, ydotool, and recording-service state were restored/removed after capture.
- Raw v3 footage and `node_modules` remain Git-ignored; relative to the task-start baseline, new v3 work is isolated to the demo assets, task documentation, and `tools/demo-video-v3/`. Older functional changes in the working tree predate TASK-0000 and were intentionally left untouched.

## Background

`chatgpt-swaync-inbox` v0.2.5 has already been verified end to end on Arch Linux + Hyprland + Firefox + Tampermonkey + swaync:

```text
ChatGPT finishes in the background
        ↓
ChatGPT Answer Complete
        ↓
swaync persistent Inbox
        ↓
no focus stealing on notification appearance
        ↓
explicit notification click
        ↓
ActionInvoked("default") + ActivationToken
        ↓
Hyprland focuses the originating Firefox context
        ↓
original ChatGPT conversation restored
```

The remaining problem is no longer functional correctness. It is **showcase production quality and production efficiency**.

The v2 video proved that hand-authoring camera motion with screenshots, ImageMagick, and custom FFmpeg filters is too slow and too fragile for repeated product-film iteration. It produced visible motion jitter, encouraged artificial engineering scenes, and made it too easy to substitute screenshots where continuous real interaction should be shown.

The v3 strategy therefore adopts an AgentDock-native reusable production stack built around existing open-source video Skills and Remotion instead of continuing to invent a custom video editor.

## Goal

Produce a privacy-safe, cinematic, GitHub-ready product demo that communicates this value in roughly 20–30 seconds:

```text
ASK
↓
KEEP WORKING
↓
RESULT WAITS
↓
CLICK TO RETURN
```

The viewer should understand the core product principle even without audio:

> Task completed ≠ interrupt the user.
> Task completed = a result enters the inbox until the user is ready to handle it.

The task has two equal outputs:

1. a production-quality showcase video for this repository;
2. a reusable **AgentDock-native product-demo pipeline** that can later be reused for OPK-RAG and other projects.

---

# 1. Production stack

## Primary execution owner

**AgentDock is the sole local execution layer for this task.**

AgentDock is responsible for:

- Skill validation / installation / activation;
- reading Skill instructions;
- repository/file modification;
- dependency installation;
- Remotion project generation;
- local browser/render processes;
- source-media inspection;
- frame extraction and QA;
- FFmpeg encoding/optimization when needed;
- final validation.

## Primary video stack

Target stack:

```text
Current ChatGPT conversation
        ↓
AgentDock
        ├── video-shotcraft Skill
        ├── remotion-dev/skills
        ├── Remotion
        ├── Chromium / browser renderer
        └── FFmpeg only for encoding/diagnostics where useful
        ↓
Cinematic product demo
```

### Primary tools

1. **video-shotcraft**
   - product-story / shot recipe layer;
   - camera language;
   - motion recipes;
   - cinematic scene composition;
   - transitions and shot hierarchy;
   - use Motion Workbench if compatible and useful.

2. **remotion-dev/skills**
   - Remotion project creation;
   - composition implementation;
   - studio / preview workflow;
   - rendering;
   - Remotion best practices.

3. **Remotion**
   - deterministic timeline;
   - smooth interpolation / easing;
   - zoom / pan / transform composition;
   - overlays / highlights / cursor emphasis;
   - final local rendering.

4. **OBS or another verified real capture path**
   - source footage only;
   - used where continuous real desktop interaction is required.

5. **FFmpeg / ImageMagick / grim**
   - diagnostics, format conversion, smoke capture, extraction, fallback only;
   - **not the primary cinematic motion system**.

## Fallback hierarchy

```text
video-shotcraft + Remotion
        ↓ if incompatible
Remotion Skills + custom Remotion composition
        ↓ if blocked
OBS real footage + minimal FFmpeg finishing
```

Do not fall back to the old screenshot-heavy hand-built FFmpeg camera system unless the Skill-based pipeline is conclusively incompatible.

---

# 2. No-Codex constraint

The v3 pipeline is explicitly designed to avoid consuming the user's local Codex 5-hour allowance.

## Hard constraints

- [x] Do **not** invoke the local `codex` CLI.
- [x] Do **not** delegate video generation to a local Codex session.
- [x] Do **not** require Codex for Skill orchestration.
- [x] Agent reasoning stays in the current ChatGPT conversation.
- [x] All local execution happens through AgentDock.
- [x] Remotion/Chromium/FFmpeg rendering consumes local machine resources, not Codex quota.

If a third-party Skill internally requires an external model/API, stop and document that requirement before enabling it.

The preferred pipeline must remain:

```text
ChatGPT reasoning
→ AgentDock execution
→ local rendering
```

not:

```text
AgentDock
→ Codex
→ video generation
```

---

# 3. Phase A — Toolchain Validation

Do not begin the final v3 edit until the production stack is proven locally.

## video-shotcraft validation

- [x] Repository/source is reviewed.
- [x] License is acceptable for this project.
- [x] Package/Skill can be validated through AgentDock.
- [x] Skill can be installed into AgentDock or otherwise bound as an AgentDock Skill context.
- [x] `SKILL.md` / equivalent instructions can be read through AgentDock.
- [x] Skill dependencies can be installed locally.
- [x] A sample shot/composition can be generated without Codex.
- [x] A sample render completes locally.
- [x] Motion behavior is visually smoother than the rejected v2 FFmpeg camera motion.

## Remotion Skills validation

- [x] `remotion-dev/skills` source is reviewed.
- [x] Relevant Skills can be installed/read/used from AgentDock.
- [x] A minimal Remotion composition builds.
- [x] Remotion Studio or equivalent preview starts locally when needed.
- [x] A local H.264 MP4 render succeeds.
- [x] Rendering does not require Codex or a paid external model API.

## Optional capture-tool validation

Focra or another open-source Screen Studio-style tool may be tested, but only if it materially improves real desktop capture.

Optional alternate-capture validation was not needed for v3 because the OBS + PipeWire path passed the real Firefox + swaync capture requirements on the current Arch + Hyprland/Wayland stack.

If an alternate capture tool is evaluated later, accept it only when:

- [ ] it works reliably on the current Arch + Hyprland/Wayland environment;
- [ ] it can capture the required Firefox + swaync interaction;
- [ ] its motion/cursor features are deterministic enough for reuse;
- [ ] it does not force X11-only behavior that degrades the current desktop workflow.

Flowtake/X11-only paths are not preferred for the current Hyprland setup.

## Toolchain gate

**Phase A passes only when one real sample clip is produced by AgentDock using the selected Skill/Remotion pipeline without starting Codex.**

If Phase A fails, document exactly why before choosing the fallback stack.

---

# 4. Real-use story design

The v3 film should no longer contain an engineering step merely because it is easy to automate.

The rejected command-running scene (`make test`, fake terminal work, etc.) is explicitly removed from the story unless it happens to be genuinely representative of the user's normal action at that moment.

## Final story beats

### Beat 1 — ASK

A real ChatGPT task is submitted.

Required direction:

```text
wide ChatGPT context
    ↓
smooth push-in to composer
    ↓
prompt is readable
    ↓
real submit
    ↓
brief generation-start confirmation
```

Requirements:

- dedicated privacy-safe conversation;
- no private ChatGPT history;
- composer/input area is the hero;
- zoom motion must be smooth and stable;
- no visible jitter;
- do not rely on a distant full-desktop view.

### Beat 2 — KEEP WORKING

The user returns to something they would realistically do while ChatGPT runs.

Preferred examples:

- Obsidian note review/writing;
- reading project documentation;
- code/editor work that naturally belongs to the current workflow;
- another real work surface the user normally uses.

Explicitly avoid:

- fake/demo-only terminal content;
- command execution inserted only to fill time;
- “Running tests…” scenes whose only purpose is to prove the user is doing something.

Requirements:

- the work surface looks natural and believable;
- movement is calm and purposeful;
- when the real ChatGPT notification appears, this application remains focused;
- the notification is a real userscript-generated `ChatGPT Answer Complete` notification.

### Beat 3 — RESULT WAITS

Show that the result remains in swaync after the transient popup moment.

Required direction:

```text
normal work context
    ↓
open swaync Inbox
    ↓
smooth focus/reframe toward the ChatGPT card
    ↓
brief hold showing that the result persists
```

Requirements:

- real swaync card;
- unrelated notification history excluded from public media;
- result card is clearly readable;
- movement must be smooth and stable;
- no screenshot-only substitute for the interaction that opens the Inbox.

### Beat 4 — CLICK TO RETURN

This is the Hero Moment and must be continuous real footage.

Required direction:

```text
real ChatGPT notification card visible
        ↓
real cursor approaches the card
        ↓
real click
        ↓
continuous transition while Firefox activates
        ↓
originating ChatGPT conversation appears
        ↓
completed answer is fully visible enough to understand the return
        ↓
landing hold
```

## Hard continuity rule

The critical return sequence MUST NOT be represented as:

```text
notification screenshot
→ cut
→ ChatGPT screenshot
```

or:

```text
notification card
→ synthetic replacement frame
→ cropped/incomplete return screenshot
```

It MUST contain continuous real footage covering the click and the browser return.

The final landing shot must show enough of the original conversation to make it visually obvious that the user returned to the originating context.

---

# 5. Cinematic visual language

## Stability first

Visible zoom/pan jitter is an automatic Presentation Validation failure.

Camera motion must use a stable motion engine such as Remotion interpolation / easing or a validated video-shotcraft recipe.

Required properties:

- smooth easing;
- no frame-to-frame crop wobble;
- no discontinuous scale jumps;
- no repeated micro-zoom corrections;
- no shaky hand-authored transform path.

## Visual hierarchy

At each moment there must be one dominant focal subject.

Use, when appropriate:

- smooth push-in / pull-out;
- stable pan/reframe;
- background dimming;
- subtle vignette;
- focal outline/glow;
- cursor emphasis;
- click ripple;
- short landing hold;
- speed ramp only when it improves clarity;
- cinematic transitions from the selected Skill library.

## Highlight rules

### Composer

- clear focal zoom;
- prompt text readable;
- submit action visible.

### Completion notification

- notification enlarged or reframed;
- work context remains visible enough to prove no focus stealing;
- title `ChatGPT Answer Complete` readable.

### Inbox

- ChatGPT card isolated from surrounding chrome;
- surrounding controls visually de-emphasized.

### Return Hero Moment

- cursor/click visible;
- transition continuous;
- landing context complete enough to understand;
- strongest visual emphasis in the film.

---

# 6. Recording/capture policy

## Real behavior requirement

All behavioral claims must be backed by real product interaction.

Real source footage is required for:

- prompt submission;
- background completion/no-focus-steal evidence;
- swaync Inbox opening;
- notification click;
- Firefox activation;
- original conversation return.

## Staging allowed

Scenes may be captured separately for privacy and quality, provided each scene is real and the edit does not fabricate a false behavior claim.

## Public-safety preparation

Before recording:

- create a privacy-safe ChatGPT conversation;
- hide/remove unrelated ChatGPT history from public frame;
- hide bookmarks/profile/account information where possible;
- remove or crop unrelated notification history;
- avoid terminal prompts containing user/host/path identifiers;
- do not expose email addresses or private document titles.

---

# 7. Deliverables

Required final assets:

```text
docs/assets/demo/
├── README.md
├── main-demo.mp4
├── main-demo-preview.webp
├── notification.png
├── swaync-inbox.png
└── click-to-return.png
```

## main-demo.mp4

Target:

- 20–30 seconds;
- 1920×1080;
- 30 fps;
- H.264 / GitHub-friendly;
- understandable muted;
- no visible camera jitter;
- continuous real click-to-return footage;
- no unnecessary engineering filler scene.

## main-demo-preview.webp

Target:

- roughly 6–10 seconds;
- lightweight enough for README;
- loops cleanly;
- contains the strongest visual value sequence;
- should not merely be an arbitrary crop from the main video if a purpose-built preview tells the story better.

## Static screenshots

- `notification.png` — real completion notification with the user's other work context still active;
- `swaync-inbox.png` — real persistent ChatGPT result, tightly and safely framed;
- `click-to-return.png` — complete enough landing context after the real return action.

---

# 8. Functional validation

The following functional behavior has already been verified and remains a hard baseline:

- [x] A real ChatGPT task can trigger completion capture.
- [x] The userscript emits real `ChatGPT Answer Complete` notifications.
- [x] Notification appearance does not steal focus.
- [x] The result persists in swaync until handled.
- [x] A real notification-card click can emit `ActionInvoked("default")`.
- [x] A real click produces an activation token on the tested stack.
- [x] v0.2.5 Hyprland focus fallback can return Firefox to the foreground.
- [x] The click does not intentionally create a new browser tab.
- [x] The original ChatGPT context can be restored.

Functional correctness alone does not close v3.

---

# 9. Toolchain Validation

- [x] video-shotcraft compatibility reviewed.
- [x] video-shotcraft AgentDock installation/activation path verified or documented fallback chosen.
- [x] video-shotcraft instructions loaded without Codex.
- [x] remotion-dev/skills compatibility reviewed.
- [x] relevant Remotion Skills loaded through AgentDock.
- [x] local Remotion sample composition rendered successfully.
- [x] selected cinematic motion path visually avoids v2 jitter.
- [x] no local Codex process is required for the pipeline.
- [x] no unexpected paid external model/API is required.
- [x] reusable v3 production workflow is documented.

---

# 10. Presentation Validation

A technically correct screen recording MUST fail if it still looks like incidental validation footage.

- [x] A first-time viewer understands the product benefit within roughly 5 seconds.
- [x] The whole value loop is understandable within 20–30 seconds.
- [x] The core story remains understandable muted.
- [x] The core story remains understandable even when captions are ignored.
- [x] Composer/input receives stable focal treatment.
- [x] Completion notification receives stable readable emphasis.
- [x] Real work context remains visible enough to prove no focus steal.
- [x] Work-away scene resembles natural day-to-day usage.
- [x] No artificial command-running filler remains.
- [x] Inbox opening is shown as real behavior, not only a screenshot.
- [x] Persistent result card is clearly isolated/readable.
- [x] Click-to-return is continuous real footage.
- [x] Return landing view shows enough of the original conversation.
- [x] Click-to-return is the strongest Hero Moment.
- [x] Camera zoom/pan has no distracting jitter.
- [x] Camera motion uses deliberate easing and stable paths.
- [x] Cursor/click emphasis is intentional where useful.
- [x] Final edit contains no failed automation, dead time, or debug artifacts.
- [x] Public media contains no private or unrelated content.
- [x] README preview is polished and loops cleanly.
- [x] Static screenshots are final-quality and consistently framed.

---

# 11. Repository Validation

- [x] All final public media lives under `docs/assets/demo/`.
- [x] Raw/intermediate media stays outside Git unless intentionally retained.
- [x] v3 Skill/Remotion production workflow is documented.
- [x] Any added dependencies are justified and reproducible.
- [x] Existing project tests pass.
- [x] `git diff --check` passes.
- [x] swaync test configuration is restored after capture.
- [x] No temporary recording/demo windows remain open after validation.
- [x] Working tree contains only intentional task-0000 changes before commit.

---

# 12. README integration preparation

This task still does not perform the full README information-architecture redesign.

`docs/assets/demo/README.md` must document:

- main showcase asset;
- lightweight preview asset;
- chosen AgentDock/video-shotcraft/Remotion stack;
- Skill installation/activation process;
- real-footage capture process;
- local render process;
- optimization process;
- privacy review process;
- re-render/re-record workflow;
- which intermediate assets stay outside Git;
- explicit statement that local Codex is not required for the production pipeline.

Task `0001 - README Hero & Information Architecture` will consume the accepted v3 assets.

---

# 13. Out of scope

This task does not include:

- full README redesign;
- project logo redesign;
- product UI redesign;
- swaync theme redesign;
- new notification product features;
- multi-provider AI support;
- long-form tutorial videos;
- YouTube/Bilibili publishing;
- architecture diagram redesign;
- building a new general-purpose video editor from scratch;
- creating a custom Agent video framework when an existing open-source Skill/Remotion solution is sufficient.

---

# 14. Acceptance criteria

Task `0000` can close only when all of the following are true:

1. The selected AgentDock-native video stack is locally validated before final production.
2. The pipeline does not require local Codex or consume the Codex 5-hour allowance.
3. `main-demo.mp4` is a deliberately directed product showcase, not engineering validation footage.
4. The final film uses real product behavior for all important interaction claims.
5. The story is reduced to the actual user value loop: ASK → KEEP WORKING → RESULT WAITS → CLICK TO RETURN.
6. The unnecessary command-running filler scene is removed.
7. Camera motion is visibly stable and free of the v2 zoom/pan jitter.
8. Composer, completion notification, Inbox card, and return action each receive distinct focal treatment.
9. Notification appearance visibly preserves the user's current focus.
10. Persistent swaync behavior is clearly demonstrated.
11. Click-to-return is shown with continuous real footage rather than screenshot substitution.
12. The final return frame shows enough of the original ChatGPT conversation to make context restoration obvious.
13. Click-to-return functions as the film's Hero Moment.
14. The film is understandable muted and remains understandable without relying on captions.
15. Public assets pass privacy review.
16. `main-demo-preview.webp` is available and polished for README use.
17. Three final static screenshots are present and publication-safe.
18. The reusable AgentDock + Skill + Remotion workflow is documented.
19. Existing tests and `git diff --check` pass.
20. The final Git diff contains only intentional task-0000 work.

---

# Follow-up

After v3 is accepted, continue with:

```text
0001 - README Hero & Information Architecture
```

`0001` will redesign the repository presentation around the finalized v3 cinematic assets.
