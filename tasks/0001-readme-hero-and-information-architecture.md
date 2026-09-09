# 0001 - README Hero & Information Architecture

Status: Completed

Depends on: `0000 - Cinematic Demo Recording & Showcase Media`

## Completion evidence — 2026-09-09

- README hero now states the Linux/Wayland persistent-result-inbox value and the ASK → KEEP WORKING → RESULT WAITS → CLICK TO RETURN loop before implementation detail.
- The accepted animated v3 preview is embedded near the top and links to `docs/assets/demo/main-demo.mp4`.
- Quick Start appears before detector internals and keeps the global `timeout-critical=0` warning explicit.
- Existing Hyprland focus fallback, `run-on: action`, `[ChatGPT Inbox Return]` marker, conversation-bound return, detector safeguards, diagnostics, limitations, security, and related-work facts remain represented.
- A local README validator resolved 19 local media/document/anchor references with no missing paths or duplicate heading slugs.
- `make test` and `git diff --check` pass.
- File modification-time review confirms TASK-0001 changed only `README.md` and this task card after the task-start checkpoint; earlier product changes in the working tree were left untouched.

## Goal

Redesign the repository README around the accepted v3 showcase assets so a first-time GitHub visitor can understand the product value within seconds, see the real workflow immediately, reach installation quickly, and still find the existing technical, reliability, limitation, security, and development details without changing product behavior.

The README should present the project as a mature open-source product rather than as an implementation log.

## Product message

The first screen should communicate:

> Ask. Keep working. The result waits. Click to return.

The key distinction is not merely that ChatGPT can emit a Linux notification. The project turns completed ChatGPT work into a persistent swaync inbox item that does not interrupt the current task and can return the user to the originating ChatGPT context when explicitly handled.

## Accepted showcase assets

Use the accepted TASK-0000 media rather than creating replacement assets:

- `docs/assets/demo/main-demo-preview.webp` — required near the top of the README;
- `docs/assets/demo/main-demo.mp4` — required as the full-demo link;
- `docs/assets/demo/notification.png` — available if a static key frame improves comprehension;
- `docs/assets/demo/swaync-inbox.png` — available if a static key frame improves comprehension;
- `docs/assets/demo/click-to-return.png` — available if a static key frame improves comprehension.

Do not re-record or re-render video as part of TASK-0001.

## Target information architecture

The README should converge on this product-first order:

1. Hero
2. Demo
3. Why this exists
4. What you get
5. Quick Start
6. How it works
7. Usage / click-to-return behavior
8. Reliability and safety
9. Requirements
10. Diagnostics and tests
11. Comparison / related work
12. Known limitations
13. Security and privacy
14. Development / deeper docs
15. License / project status

Low-level detector and compositor details must not dominate the first screen.

## Implementation requirements

### Hero

- Use a concise product title and Linux/Wayland positioning.
- State the value loop in one short line.
- Add lightweight project badges where they improve scanability.
- Show `main-demo-preview.webp` near the top.
- Link the full `main-demo.mp4` near the preview.
- Provide immediate paths to Quick Start, architecture, and troubleshooting.

### Demo

- Explain ASK → KEEP WORKING → RESULT WAITS → CLICK TO RETURN.
- Make clear that TASK-0000 footage is real product behavior.
- Avoid a large screenshot gallery unless it improves comprehension beyond the animated preview.

### Product value

Prioritize these user-facing outcomes before implementation detail:

- persistent result inbox;
- no focus stealing when completion appears;
- explicit click-to-return;
- conversation-bound return behavior;
- local-only operation;
- reversible swaync integration.

### Quick Start

Keep the initial setup path short and actionable:

1. clone repository;
2. run swaync installer;
3. install userscript;
4. run doctor/test notification;
5. use ChatGPT normally.

Retain the important `timeout-critical=0` warning.

### Technical accuracy

Preserve the current working-tree facts that predate TASK-0001, including:

- Hyprland-specific compositor focus fallback;
- title-scoped swaync `run-on: action` helper;
- `[ChatGPT Inbox Return]` source-tab marker;
- captured conversation URL restoration;
- installer/uninstaller state restoration;
- doctor checks for the rule/action/helper;
- hybrid resource-completion + DOM fallback detection;
- prompt-bound assistant-turn selection;
- fail-quiet/manual-stop/error guards;
- current platform limitations.

### README depth

Move deep implementation explanation below product usage. Prefer linking to existing docs over duplicating long architecture prose in the README.

## Out of scope

TASK-0001 must not:

- change the userscript or detector behavior;
- change swaync configuration behavior;
- modify installer/uninstaller logic;
- add notification features;
- redesign the v3 video;
- redesign the project logo;
- redesign architecture diagrams;
- redesign application UI or swaync theme;
- add provider support;
- perform release publishing.

## Acceptance criteria

- [x] A first-time visitor can identify the product and Linux/Wayland audience within roughly 5 seconds.
- [x] The first screen exposes the accepted animated v3 preview.
- [x] A full-video link to `main-demo.mp4` is present and local-path correct.
- [x] The value loop is understandable without reading implementation details.
- [x] Product outcomes appear before detector internals.
- [x] Quick Start is reachable near the top and remains concise.
- [x] The `timeout-critical=0` global critical-notification warning remains explicit.
- [x] Hyprland click-focus fallback behavior remains documented accurately.
- [x] Conversation-bound return behavior remains documented accurately.
- [x] Local-only / no API-key privacy posture remains clear.
- [x] Diagnostics and tests remain documented.
- [x] Related-work comparison remains available.
- [x] Known limitations remain available.
- [x] Security and license links remain available.
- [x] README does not duplicate large blocks already better served by `docs/architecture.md` or `docs/troubleshooting.md`.
- [x] All local README links and media paths resolve.
- [x] GitHub Markdown structure has no duplicate/invalid local section anchors relied upon by navigation.
- [x] Existing project tests pass.
- [x] `git diff --check` passes.
- [x] TASK-0001 changes only README presentation/task documentation and does not modify product logic.

## Follow-up

After TASK-0001 is accepted, the next task should be chosen from the remaining repository-governance/showcase backlog rather than expanding README scope inside this task.
